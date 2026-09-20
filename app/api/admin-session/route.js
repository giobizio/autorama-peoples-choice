import crypto from 'crypto'

const COOKIE_NAME = 'autorama_admin_session'

function verifySessionToken(token) {
  try {
    if (!token || !process.env.ADMIN_PASSWORD) {
      return false
    }

    const [expiresString, signature] = token.split('.')

    if (!expiresString || !signature) {
      return false
    }

    const expires = Number(expiresString)

    if (!Number.isFinite(expires)) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)

    if (expires <= now) {
      return false
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.ADMIN_PASSWORD)
      .update(expiresString)
      .digest('hex')

    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    )
  } catch (error) {
    return false
  }
}

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || ''

  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf('=')

        if (index === -1) {
          return [cookie, '']
        }

        return [
          cookie.slice(0, index),
          cookie.slice(index + 1)
        ]
      })
  )

  const token = cookies[COOKIE_NAME]

  if (!verifySessionToken(token)) {
    return Response.json(
      { authenticated: false },
      { status: 401 }
    )
  }

  return Response.json({
    authenticated: true
  })
}
