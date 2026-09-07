import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin once (reused across function invocations)
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    })
}

const db = getFirestore()

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

    try {
        const { orderID, invoiceId } = JSON.parse(event.body)

        if (!orderID || !invoiceId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Missing orderID or invoiceId' })
            }
        }

        // Get the invoice first to confirm it exists and isn't already paid
        const invoiceRef = db.collection('invoices').doc(invoiceId)
        const invoiceSnap = await invoiceRef.get()

        if (!invoiceSnap.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: 'Invoice not found' })
            }
        }

        const invoiceData = invoiceSnap.data()
        if (invoiceData.status === 'paid') {
            // Already paid — return success idempotently rather than erroring
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, alreadyPaid: true })
            }
        }

        // Get PayPal access token
        const tokenResult = await getAccessToken()
        if (tokenResult.status !== 200) {
            console.error('PayPal auth failed:', tokenResult.data)
            return {
                statusCode: 502,
                body: JSON.stringify({ success: false, error: 'Payment authorization failed' })
            }
        }
        const accessToken = tokenResult.data.access_token

        // Capture the order
        const captureRes = await fetch(`${PP_BASE}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        const captureData = await captureRes.json()

        if (captureRes.status !== 200 && captureRes.status !== 201) {
            console.error('Capture failed:', captureData)
            return {
                statusCode: 502,
                body: JSON.stringify({ success: false, error: 'Payment capture failed' })
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

        // Mark the invoice as paid in Firestore
        await invoiceRef.update({
            status: 'paid',
            transactionId,
            paidAt: new Date().toISOString()
        })

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, transactionId })
        }
    } catch (err) {
        console.error('capture-invoice error:', err)
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Internal server error' })
        }
    }
}