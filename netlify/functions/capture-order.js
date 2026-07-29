const CLIENT_ID = process.env.PP_CLIENT
const SECRET_KEY = process.env.PP_SECRET

async function getAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64')
    const res = await fetch('https://api.paypal.com/v1/oauth2/token', {
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
        return { statusCode: 405, body: 'Method not allowed' }
    }

    try {
        const { orderID } = JSON.parse(event.body)
        const { data: tokenData, status: tokenStatus } = await getAccessToken()

        if (!tokenData.access_token) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    tokenError: tokenData,
                    tokenStatus,
                    clientIdPreview: `${CLIENT_ID?.slice(0,4)}...${CLIENT_ID?.slice(-4)}`,
                    secretKeyPreview: `${SECRET_KEY?.slice(0,4)}...${SECRET_KEY?.slice(-4)}`
                })
            }
        }

        const res = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            }
        })

        const data = await res.json()
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
}