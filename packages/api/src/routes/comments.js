import { validateComment, renderMarkdown, hashIp, getDailySalt } from '@remarq/core'
import { requireApiKey } from '../middleware/auth.js'

export async function commentsRoutes(app) {
  // GET /v1/comments?thread_url=/blog/mi-post
  // Endpoint público — devuelve comentarios aprobados
  app.get('/', {
    preHandler: [requireApiKey],
  }, async (request, reply) => {
    const { thread_url, title } = request.query

    if (!thread_url) {
      return reply.code(400).send({ error: 'thread_url es requerido' })
    }

    const thread = await request.server.threads.findOrCreate(
      request.site.id,
      thread_url,
      title
    )

    if (thread.is_locked) {
      return { thread_id: thread.id, locked: true, comments: [] }
    }

    const comments = await request.server.comments.listByThread(thread.id)
    return { thread_id: thread.id, locked: false, comments }
  })

  // POST /v1/comments
  // Crea un comentario nuevo (pendiente de moderación)
  app.post('/', {
    preHandler: [requireApiKey],
    config: {
      rateLimit: { max: 5, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { thread_url, title, parent_id, author_name, author_email, content } = request.body ?? {}

    const { valid, errors } = validateComment({ content, author_name, author_email })
    if (!valid) {
      return reply.code(422).send({ errors })
    }

    const thread = await request.server.threads.findOrCreate(
      request.site.id,
      thread_url,
      title
    )

    if (thread.is_locked) {
      return reply.code(403).send({ error: 'Este hilo está cerrado' })
    }

    const dailySalt = getDailySalt(process.env.SALT)
    const ipHash = hashIp(request.ip, dailySalt)
    const contentHtml = renderMarkdown(content)

    const comment = await request.server.comments.create({
      threadId: thread.id,
      parentId: parent_id ?? null,
      authorName: author_name,
      authorEmail: author_email ?? null,
      content,
      contentHtml,
      ipHash,
    })

    // Notificar al owner del sitio si el comentario queda pendiente
    if (comment.status === 'pending') {
      const owner = await request.server.users.findById(request.site.owner_id)
      request.server.mailer.notifyNewComment(owner?.email, {
        comment,
        thread,
        site: request.site,
      }).catch(err => request.server.log.warn({ err }, 'Error enviando notificación de comentario'))
    }

    reply.code(201)
    return comment
  })
}
