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
    return data
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' }
    }

    try {
        const tokenResponse = await getAccessToken()
        return {
            statusCode: 200,
            body: JSON.stringify({
                clientIdLength: CLIENT_ID?.length,
                secretKeyLength: SECRET_KEY?.length,
                tokenResponse
            })
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
}