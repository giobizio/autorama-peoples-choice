export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return Response.json(
        { ok: false },
        { status: 400 }
      )
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { ok: false },
        { status: 401 }
      )
    }

    return Response.json({
      ok: true
    })
  } catch (error) {
    return Response.json(
      { ok: false },
      { status: 500 }
    )
  }
}
