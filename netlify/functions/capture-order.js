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
    return data.access_token
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' }
    }

    // Temp debug — remove after testing
    console.log('CLIENT_ID exists:', !!CLIENT_ID)
    console.log('SECRET_KEY exists:', !!SECRET_KEY)
    console.log('CLIENT_ID length:', CLIENT_ID?.length)
    console.log('SECRET_KEY length:', SECRET_KEY?.length)

    try {
        const { orderID } = JSON.parse(event.body)
        const accessToken = await getAccessToken()

        const res = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
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