/**
 * Rutas de autenticación — GitHub OAuth.
 *
 * Flujo:
 *   1. GET /v1/auth/github          → redirect a GitHub
 *   2. GET /v1/auth/github/callback → intercambia code por token, upsert user, devuelve JWT
 *   3. GET /v1/auth/me              → devuelve el usuario autenticado
 *   4. POST /v1/auth/logout         → (stateless JWT — solo referencia en el cliente)
 */
import { requireJwt } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

export async function authRoutes(app) {
  const clientId     = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const adminUrl     = process.env.ADMIN_URL ?? 'http://localhost:5173'

  const googleClientId     = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  // GET /v1/auth/github — redirige al flujo OAuth de GitHub
  app.get('/github', async (request, reply) => {
    if (!clientId) {
      return reply.code(501).send({ error: 'GitHub OAuth no configurado (falta GITHUB_CLIENT_ID)' })
    }
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'read:user user:email',
    })
    return reply.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // GET /v1/auth/github/callback — callback de GitHub
  app.get('/github/callback', async (request, reply) => {
    const { code } = request.query

    if (!code) {
      return reply.code(400).send({ error: 'Código OAuth requerido' })
    }

    // Intercambiar code por access_token
    let accessToken
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error_description)
      accessToken = tokenData.access_token
    } catch (err) {
      app.log.error({ err }, 'Error intercambiando code por token de GitHub')
      return reply.code(502).send({ error: 'Error de autenticación con GitHub' })
    }

    // Obtener info del usuario de GitHub
    let ghUser
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      })
      ghUser = await userRes.json()
    } catch (err) {
      app.log.error({ err }, 'Error obteniendo usuario de GitHub')
      return reply.code(502).send({ error: 'Error obteniendo datos de GitHub' })
    }

    // Obtener email (puede no estar en el perfil público)
    let email = ghUser.email
    if (!email) {
      try {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github+json',
          },
        })
        const emails = await emailRes.json()
        const primary = emails.find(e => e.primary && e.verified)
        email = primary?.email ?? null
      } catch { /* email opcional */ }
    }

    // Upsert usuario en la base de datos
    const user = await request.server.users.upsertFromGithub({
      githubId: ghUser.id,
      login: ghUser.login,
      name: ghUser.name,
      avatarUrl: ghUser.avatar_url,
      email,
    })

    // Generar JWT (30 días)
    const token = app.jwt.sign(
      { sub: user.id, login: user.login, isAdmin: Boolean(user.is_admin) },
      { expiresIn: '30d' }
    )

    // Redirigir al admin con el token en el hash (no llega a logs del servidor)
    return reply.redirect(`${adminUrl}/auth/callback#token=${token}`)
  })

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  // GET /v1/auth/google — redirige al flujo OAuth de Google
  app.get('/google', async (request, reply) => {
    if (!googleClientId) {
      return reply.code(501).send({ error: 'Google OAuth no configurado (falta GOOGLE_CLIENT_ID)' })
    }
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3100'
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: `${baseUrl}/v1/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
    })
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  // GET /v1/auth/google/callback — callback de Google
  app.get('/google/callback', async (request, reply) => {
    const { code } = request.query

    if (!code) {
      return reply.code(400).send({ error: 'Código OAuth requerido' })
    }

    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3100'

    // Intercambiar code por access_token
    let accessToken
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: `${baseUrl}/v1/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error_description)
      accessToken = tokenData.access_token
    } catch (err) {
      app.log.error({ err }, 'Error intercambiando code por token de Google')
      return reply.code(502).send({ error: 'Error de autenticación con Google' })
    }

    // Obtener info del usuario de Google
    let gUser
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      gUser = await userRes.json()
    } catch (err) {
      app.log.error({ err }, 'Error obteniendo usuario de Google')
      return reply.code(502).send({ error: 'Error obteniendo datos de Google' })
    }

    const user = await request.server.users.upsertFromGoogle({
      googleId: gUser.id,
      login: gUser.email.split('@')[0],
      name: gUser.name,
      avatarUrl: gUser.picture,
      email: gUser.email,
    })

    const token = app.jwt.sign(
      { sub: user.id, login: user.login, isAdmin: Boolean(user.is_admin) },
      { expiresIn: '30d' }
    )

    return reply.redirect(`${adminUrl}/auth/callback#token=${token}`)
  })

  // ─── Email / Password ──────────────────────────────────────────────────────

  // POST /v1/auth/register — crear cuenta con email y contraseña
  app.post('/register', async (request, reply) => {
    const { email, password, name } = request.body ?? {}

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email y contraseña son requeridos' })
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const existing = await request.server.users.findByEmail(email)
    if (existing) {
      return reply.code(409).send({ error: 'Ya existe una cuenta con ese email' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const login = email.split('@')[0]

    const user = await request.server.users.createWithPassword({
      email,
      passwordHash,
      login,
      name: name ?? null,
    })

    const token = app.jwt.sign(
      { sub: user.id, login: user.login, isAdmin: Boolean(user.is_admin) },
      { expiresIn: '30d' }
    )

    return { token }
  })

  // POST /v1/auth/login — iniciar sesión con email y contraseña
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body ?? {}

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email y contraseña son requeridos' })
    }

    const user = await request.server.users.findByEmail(email)
    if (!user || !user.password_hash) {
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const token = app.jwt.sign(
      { sub: user.id, login: user.login, isAdmin: Boolean(user.is_admin) },
      { expiresIn: '30d' }
    )

    return { token }
  })

  // GET /v1/auth/me — devuelve el usuario autenticado
  app.get('/me', { preHandler: [requireJwt] }, async (request) => {
    const user = await request.server.users.findById(request.user.sub)
    if (!user) return { error: 'Usuario no encontrado' }
    return {
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      is_admin: Boolean(user.is_admin),
    }
  })

  // POST /v1/auth/logout — stateless, el cliente borra el token
  app.post('/logout', async () => ({ ok: true }))
}
