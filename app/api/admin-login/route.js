import crypto from 'crypto'

const COOKIE_NAME = 'autorama_admin_session'
const SESSION_DURATION = 24 * 60 * 60

function getSessionSecret() {
  return process.env.ADMIN_PASSWORD
}

function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DURATION

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(String(expires))
    .digest('hex')

  return `${expires}.${signature}`
}

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return Response.json(
        { ok: false },
        { status: 400 }
      )
    }

    if (!process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD is not configured')

      return Response.json(
        { ok: false },
        { status: 500 }
      )
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { ok: false },
        { status: 401 }
      )
    }

    const token = createSessionToken()

    const response = Response.json({
      ok: true
    })

    response.headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION}`
    )

    return response
  } catch (error) {
    console.error('Admin login error:', error)

    return Response.json(
      { ok: false },
      { status: 500 }
    )
  }
}
