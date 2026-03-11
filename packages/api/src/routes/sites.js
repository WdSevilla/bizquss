import { validateSite, generateApiKey } from '@bizquss/core'
import { requireJwt } from '../middleware/auth.js'

export async function sitesRoutes(app) {
  // POST /v1/sites — registrar un sitio nuevo (requiere admin autenticado)
  app.post('/', {
    preHandler: [requireJwt],
  }, async (request, reply) => {
    const { domain, settings } = request.body ?? {}

    const { valid, errors } = validateSite({ domain })
    if (!valid) {
      return reply.code(422).send({ errors })
    }

    const site = await request.server.sites.create({
      domain,
      ownerId: request.user.id,
      apiKey: generateApiKey(),
      settings: settings ?? {},
    })

    reply.code(201)
    return site
  })

  // GET /v1/sites/:id/threads — listar hilos de un sitio
  app.get('/:id/threads', {
    preHandler: [requireJwt],
  }, async (request, reply) => {
    const site = await request.server.sites.findById(request.params.id)
    if (!site || site.owner_id !== request.user.id) {
      return reply.code(404).send({ error: 'Sitio no encontrado' })
    }

    const threads = await request.server.threads.listBySite(site.id)
    return { threads }
  })
}
