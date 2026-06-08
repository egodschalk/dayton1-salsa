const CLIENT_ID = process.env.PP_CLIENT
const SECRET_KEY = process.env.PP_SECRET

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' }
    }

    const auth = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64')

    return {
        statusCode: 200,
        body: JSON.stringify({
            clientIdPreview: `${CLIENT_ID?.slice(0,4)}...${CLIENT_ID?.slice(-4)}`,
            secretKeyPreview: `${SECRET_KEY?.slice(0,4)}...${SECRET_KEY?.slice(-4)}`,
            authPreview: `${auth?.slice(0,10)}...${auth?.slice(-10)}`,
            clientIdLength: CLIENT_ID?.length,
            secretKeyLength: SECRET_KEY?.length
        })
    }
}