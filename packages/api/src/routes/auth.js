/**
 * Rutas de autenticación.
 * v0.1: Solo GitHub OAuth.
 * v0.2: GitLab, Mastodon (ActivityPub).
 */
export async function authRoutes(app) {
  // GET /v1/auth/github — inicia el flujo OAuth con GitHub
  app.get('/github', async (request, reply) => {
    // TODO v0.1: implementar con @fastify/oauth2
    // La lógica completa se implementa junto con el panel admin
    return reply.code(501).send({ error: 'Pendiente de implementación' })
  })

  // GET /v1/auth/github/callback
  app.get('/github/callback', async (request, reply) => {
    return reply.code(501).send({ error: 'Pendiente de implementación' })
  })

  // POST /v1/auth/logout
  app.post('/logout', async (request, reply) => {
    return { ok: true }
  })
}
