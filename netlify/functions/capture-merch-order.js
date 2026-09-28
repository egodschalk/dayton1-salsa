import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

let initError = null

try {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        })
    }
} catch (err) {
    initError = err.message
}

const IS_SANDBOX = false
const PP_CLIENT = process.env.PP_CLIENT
const PP_SECRET = process.env.PP_SECRET
const PP_BASE = IS_SANDBOX ? 'https://api-m.sandbox.paypal.com' : 'https://api.paypal.com'

async function getAccessToken() {
    const auth = Buffer.from(`${PP_CLIENT}:${PP_SECRET}`).toString('base64')
    const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    })
    const data = await res.json()
    return { data, status: res.status }
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (initError) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Firebase Admin init failed: ' + initError })
        }
    }

    const missingVars = []
    if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID')
    if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL')
    if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY')
    if (!process.env.PP_CLIENT) missingVars.push('PP_CLIENT')
    if (!process.env.PP_SECRET) missingVars.push('PP_SECRET')
    if (missingVars.length > 0) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Missing environment variables: ' + missingVars.join(', ') })
        }
    }

    try {
        const db = getFirestore()
        const { orderID, items, buyer } = JSON.parse(event.body)

        if (!orderID || !Array.isArray(items) || items.length === 0 || !buyer) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Missing orderID, items, or buyer info' })
            }
        }

        // 1. Capture the PayPal payment first
        const tokenResult = await getAccessToken()
        if (tokenResult.status !== 200) {
            return {
                statusCode: 502,
                body: JSON.stringify({ success: false, error: 'Payment authorization failed', detail: tokenResult.data })
            }
        }
        const accessToken = tokenResult.data.access_token

        const captureRes = await fetch(`${PP_BASE}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        const captureData = await captureRes.json()

        if (captureRes.status !== 200 && captureRes.status !== 201) {
            return {
                statusCode: 502,
                body: JSON.stringify({ success: false, error: 'Payment capture failed', detail: captureData })
            }
        }

        const transactionId =
            captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
            captureData?.id

        if (!transactionId) {
            return {
                statusCode: 502,
                body: JSON.stringify({ success: false, error: 'Could not verify transaction' })
            }
        }

        // 2. Payment is confirmed real — now atomically decrement stock for each item
        try {
            await db.runTransaction(async (transaction) => {
                const productRefs = {}
                const productSnaps = {}

                for (const item of items) {
                    if (!productRefs[item.productId]) {
                        const ref = db.collection('products').doc(item.productId)
                        productRefs[item.productId] = ref
                        productSnaps[item.productId] = await transaction.get(ref)
                    }
                }

                for (const item of items) {
                    const snap = productSnaps[item.productId]
                    if (!snap.exists) throw new Error(`${item.productName} is no longer available.`)
                    const data = snap.data()
                    const variant = (data.variants || []).find(v => v.size === item.size)
                    if (!variant) throw new Error(`${item.productName} (${item.size}) is no longer available.`)
                    if (variant.stock < item.quantity) {
                        throw new Error(`Only ${variant.stock} left of ${item.productName} (${item.size}).`)
                    }
                }

                for (const productId of Object.keys(productRefs)) {
                    const snap = productSnaps[productId]
                    const data = snap.data()
                    const itemsForThisProduct = items.filter(i => i.productId === productId)
                    const newVariants = data.variants.map(v => {
                        const match = itemsForThisProduct.find(i => i.size === v.size)
                        if (match) {
                            return { ...v, stock: v.stock - match.quantity }
                        }
                        return v
                    })
                    transaction.update(productRefs[productId], { variants: newVariants })
                }
            })
        } catch (stockErr) {
            // Payment already succeeded but stock ran out — record the order anyway,
            // flagged for the owner to follow up (refund or contact buyer), rather than
            // losing track of a payment that has already gone through.
            const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) * i.quantity), 0)
            await db.collection('orders').add({
                buyerName: buyer.name,
                buyerPhone: buyer.phone,
                buyerEmail: buyer.email || '',
                items,
                totalAmount: totalAmount.toFixed(2),
                transactionId,
                status: 'unfulfilled',
                stockIssue: stockErr.message,
                purchaseDate: new Date().toISOString(),
                deliveredAt: null
            })
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    warning: 'Payment succeeded but stock ran out for part of the order: ' + stockErr.message
                })
            }
        }

        // 3. Stock decrement succeeded — create the order record
        const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) * i.quantity), 0)
        await db.collection('orders').add({
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            buyerEmail: buyer.email || '',
            items,
            totalAmount: totalAmount.toFixed(2),
            transactionId,
            status: 'unfulfilled',
            purchaseDate: new Date().toISOString(),
            deliveredAt: null
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, transactionId })
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        }
    }
}