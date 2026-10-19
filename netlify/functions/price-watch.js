import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// WATCH MODE: this function never blocks or changes a payment.
// It looks at a PayPal order, works out what the order SHOULD cost using the
// real prices in Firestore, and reports whether the two match.
// Open the browser Network tab and click "price-watch" to read the result.

const IS_SANDBOX = false
const PP_BASE = IS_SANDBOX ? 'https://api-m.sandbox.paypal.com' : 'https://api.paypal.com'

function reply(body) {
    // Always 200 so a problem here can never look like a payment failure
    return { statusCode: 200, body: JSON.stringify(body) }
}

function getDb() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        })
    }
    return getFirestore()
}

async function getAccessToken() {
    const auth = Buffer.from(`${process.env.PP_CLIENT}:${process.env.PP_SECRET}`).toString('base64')
    const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    })
    const data = await res.json()
    return { token: data.access_token, status: res.status }
}

export const handler = async (event) => {
    let stage = 'start'
    try {
        if (event.httpMethod !== 'POST') return reply({ ok: false, stage, error: 'POST only' })

        const { orderID, passKeys, merchItems } = JSON.parse(event.body || '{}')
        if (!orderID) return reply({ ok: false, stage, error: 'No orderID' })

        const keys = Array.isArray(passKeys) ? passKeys : []
        const merch = Array.isArray(merchItems) ? merchItems : []

        // 1. PayPal token
        stage = 'paypal-token'
        const { token, status: tokenStatus } = await getAccessToken()
        if (!token) return reply({ ok: false, stage, error: 'PayPal token failed', tokenStatus })

        // 2. Look at the PayPal order
        stage = 'paypal-order-lookup'
        const orderRes = await fetch(`${PP_BASE}/v2/checkout/orders/${encodeURIComponent(orderID)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const order = await orderRes.json()
        if (!orderRes.ok) {
            return reply({ ok: false, stage, error: 'Could not read PayPal order', paypalStatus: orderRes.status, detail: order })
        }
        const unit = order.purchase_units?.[0]
        const paidCents = Math.round(parseFloat(unit?.amount?.value || '0') * 100)

        // 3. Real prices from Firestore
        stage = 'firestore-prices'
        const db = getDb()
        let expectedCents = 0
        const problems = []

        if (keys.length > 0) {
            const snap = await db.collection('passTypes').get()
            const passes = new Map()
            snap.forEach(d => {
                const p = d.data()
                if (p.key) passes.set(p.key, p)
            })
            for (const k of keys) {
                const pass = passes.get(k)
                if (!pass) { problems.push(`Pass "${k}" not found`); continue }
                if (!pass.active) problems.push(`Pass "${k}" is not active`)
                expectedCents += Math.round(parseFloat(pass.amount) * 100)
            }
        }

        for (const item of merch) {
            const snap = await db.collection('products').doc(String(item.productId)).get()
            if (!snap.exists) { problems.push(`Product ${item.productId} not found`); continue }
            const prod = snap.data()
            expectedCents += Math.round(parseFloat(prod.price) * 100) * parseInt(item.quantity, 10)
        }

        stage = 'compare'
        const match = expectedCents === paidCents
        const result = {
            ok: true,
            stage,
            match,
            orderStatus: order.status,
            paidCents,
            expectedCents,
            problems
        }

        if (!match || problems.length > 0) {
            console.error('PRICE WATCH MISMATCH', JSON.stringify({ orderID, ...result }))
        } else {
            console.log('PRICE WATCH OK', JSON.stringify({ orderID, paidCents }))
        }
        return reply(result)
    } catch (err) {
        console.error('price-watch error at stage', stage, err)
        return reply({ ok: false, stage, error: err.message })
    }
}