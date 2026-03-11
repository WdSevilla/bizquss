/**
 * Rutas del panel de administración.
 * Todas requieren JWT válido.
 *
 * GET    /v1/admin/sites                     → listar sitios del usuario
 * POST   /v1/admin/sites                     → crear sitio
 * DELETE /v1/admin/sites/:siteId             → eliminar sitio
 * GET    /v1/admin/sites/:siteId/threads     → listar hilos del sitio
 * PATCH  /v1/admin/threads/:threadId         → bloquear/desbloquear hilo
 * GET    /v1/admin/threads/:threadId/comments → listar comentarios (admin view)
 * PATCH  /v1/admin/comments/:commentId       → moderar comentario
 * DELETE /v1/admin/comments/:commentId       → eliminar comentario (soft)
 */
import { validateSite, generateApiKey } from '@bizquss/core'
import { requireJwt } from '../middleware/auth.js'

export async function adminRoutes(app) {
  // Todos los endpoints de admin requieren JWT
  app.addHook('preHandler', requireJwt)

  // ─── Sitios ─────────────────────────────────────────────────────────────────

  app.get('/sites', async (request) => {
    const sites = await request.server.sites.listByOwner(request.user.sub)
    // Añadir conteo de pendientes a cada sitio
    const withPending = await Promise.all(
      sites.map(async (site) => ({
        ...site,
        pending_count: await request.server.comments.countPendingBySite(site.id),
      }))
    )
    return { sites: withPending }
  })

  app.post('/sites', async (request, reply) => {
    const { domain, settings } = request.body ?? {}

    const { valid, errors } = validateSite({ domain })
    if (!valid) return reply.code(422).send({ errors })

    const site = await request.server.sites.create({
      domain,
      ownerId: request.user.sub,
      apiKey: generateApiKey(),
      settings: settings ?? {},
    })

    reply.code(201)
    return site
  })

  app.delete('/sites/:siteId', async (request, reply) => {
    const site = await request.server.sites.findById(request.params.siteId)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(404).send({ error: 'Sitio no encontrado' })
    }
    await request.server.sites.delete(site.id)
    reply.code(204).send()
  })

  // ─── Hilos ───────────────────────────────────────────────────────────────────

  app.get('/sites/:siteId/threads', async (request, reply) => {
    const site = await request.server.sites.findById(request.params.siteId)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(404).send({ error: 'Sitio no encontrado' })
    }
    const threads = await request.server.threads.listBySite(site.id)
    return { threads }
  })

  app.patch('/threads/:threadId', async (request, reply) => {
    const { locked } = request.body ?? {}
    if (typeof locked !== 'boolean') {
      return reply.code(422).send({ error: 'El campo "locked" es requerido (boolean)' })
    }

    // Verificar que el hilo pertenece al usuario
    const thread = await request.server.threads.findById(request.params.threadId)
    if (!thread) return reply.code(404).send({ error: 'Hilo no encontrado' })

    const site = await request.server.sites.findById(thread.site_id)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(403).send({ error: 'Sin permisos' })
    }

    const updated = await request.server.threads.setLocked(thread.id, locked)
    return updated
  })

  // ─── Comentarios ─────────────────────────────────────────────────────────────

  app.get('/threads/:threadId/comments', async (request, reply) => {
    const { status = 'all' } = request.query

    const thread = await request.server.threads.findById(request.params.threadId)
    if (!thread) return reply.code(404).send({ error: 'Hilo no encontrado' })

    const site = await request.server.sites.findById(thread.site_id)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(403).send({ error: 'Sin permisos' })
    }

    const comments = await request.server.comments.adminListByThread(thread.id, status)
    return { thread, comments }
  })

  app.patch('/comments/:commentId', async (request, reply) => {
    const { status } = request.body ?? {}
    const validStatuses = ['approved', 'spam', 'deleted', 'pending']
    if (!validStatuses.includes(status)) {
      return reply.code(422).send({ error: `Estado inválido. Valores: ${validStatuses.join(', ')}` })
    }

    const comment = await request.server.comments.findById(request.params.commentId)
    if (!comment) return reply.code(404).send({ error: 'Comentario no encontrado' })

    // Verificar ownership vía thread → site
    const thread = await request.server.threads.findById(comment.thread_id)
    const site   = await request.server.sites.findById(thread?.site_id)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(403).send({ error: 'Sin permisos' })
    }

    const updated = await request.server.comments.updateStatus(comment.id, status)
    return updated
  })

  app.delete('/comments/:commentId', async (request, reply) => {
    const comment = await request.server.comments.findById(request.params.commentId)
    if (!comment) return reply.code(404).send({ error: 'Comentario no encontrado' })

    const thread = await request.server.threads.findById(comment.thread_id)
    const site   = await request.server.sites.findById(thread?.site_id)
    if (!site || site.owner_id !== request.user.sub) {
      return reply.code(403).send({ error: 'Sin permisos' })
    }

    await request.server.comments.updateStatus(comment.id, 'deleted')
    reply.code(204).send()
  })
}
