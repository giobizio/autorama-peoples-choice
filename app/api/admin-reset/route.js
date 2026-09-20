import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

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

function getCookie(request, name) {
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

  return cookies[name]
}

export async function POST(request) {
  try {
    const token = getCookie(request, COOKIE_NAME)

    if (!verifySessionToken(token)) {
      return Response.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      )
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error('Supabase server credentials are not configured')

      return Response.json(
        { ok: false, error: 'server_configuration' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    const { error } = await supabaseAdmin
      .from('votes')
      .delete()
      .not('id', 'is', null)

    if (error) {
      console.error('Reset votes error:', error)

      return Response.json(
        { ok: false, error: 'reset_failed' },
        { status: 500 }
      )
    }

    return Response.json({
      ok: true
    })
  } catch (error) {
    console.error('Admin reset error:', error)

    return Response.json(
      { ok: false, error: 'server_error' },
      { status: 500 }
    )
  }
}
