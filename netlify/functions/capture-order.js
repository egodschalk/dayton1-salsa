import admin from 'firebase-admin'

const CLIENT_ID = process.env.PP_CLIENT
const SECRET_KEY = process.env.PP_SECRET
const PAYPAL_API = 'https://api.paypal.com'

function getDb() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
            })
        })
    }
    return admin.firestore()
}

async function getAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64')
    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    })
    const data = await res.json()
    if (!data.access_token) {
        console.error('PayPal token error:', res.status, data)
        return null
    }
    return data.access_token
}

function reply(statusCode, body) {
    return { statusCode, body: JSON.stringify(body) }
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' }
    }

    try {
        const { orderID, passKeys } = JSON.parse(event.body || '{}')

        if (!orderID || !Array.isArray(passKeys) || passKeys.length === 0 || passKeys.length > 20) {
            return reply(400, { error: 'Invalid request.' })
        }

        const accessToken = await getAccessToken()
        if (!accessToken) {
            return reply(500, { error: 'Payment service is unavailable. Please try again later.' })
        }

        // 1. Look at the PayPal order BEFORE taking any money
        const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const order = await orderRes.json()

        if (!orderRes.ok) {
            console.error('PayPal order lookup failed:', orderRes.status, order)
            return reply(400, { error: 'Could not find that PayPal order.' })
        }
        if (order.status !== 'APPROVED') {
            return reply(400, { error: 'This order is not ready to be charged.' })
        }

        const units = order.purchase_units || []
        const amount = units[0]?.amount
        if (units.length !== 1 || amount?.currency_code !== 'USD') {
            return reply(400, { error: 'Order details are invalid.' })
        }
        const paidCents = Math.round(parseFloat(amount.value) * 100)

        // 2. Work out what the passes SHOULD cost, using the real prices in Firestore
        const snap = await getDb().collection('passTypes').get()
        const prices = new Map()
        snap.forEach(doc => {
            const p = doc.data()
            if (p.active && p.key) prices.set(p.key, Math.round(parseFloat(p.amount) * 100))
        })

        let expectedCents = 0
        for (const key of passKeys) {
            if (typeof key !== 'string' || !prices.has(key)) {
                return reply(400, { error: 'One of the selected passes is no longer available.' })
            }
            expectedCents += prices.get(key)
        }

        if (expectedCents !== paidCents) {
            console.error('Price mismatch', { orderID, expectedCents, paidCents, passKeys })
            return reply(400, { error: 'The order total does not match the pass prices. You have not been charged.' })
        }

        // 3. Prices match, so take the payment
        const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        const captured = await captureRes.json()

        if (!captureRes.ok) {
            console.error('PayPal capture failed:', captureRes.status, captured)
            return reply(400, { error: 'Payment could not be completed. You have not been charged.' })
        }

        return reply(200, captured)
    } catch (error) {
        console.error('capture-order error:', error)
        return reply(500, { error: 'Something went wrong. Please try again.' })
    }
}