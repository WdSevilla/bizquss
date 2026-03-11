/**
 * Plugin de Fastify para envío de emails (notificaciones al moderador).
 * Si SMTP_HOST no está configurado, todas las llamadas son no-op silenciosas.
 *
 * Uso:
 *   await app.mailer.notifyNewComment(ownerEmail, { comment, thread, site })
 */
import fp from 'fastify-plugin'
import { createTransport } from 'nodemailer'

async function mailerPlugin(app) {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM ?? 'Bizquss <noreply@bizquss.local>'

  if (!host) {
    app.log.info('SMTP_HOST no configurado — notificaciones por email desactivadas')
    app.decorate('mailer', { notifyNewComment: async () => {} })
    return
  }

  const transporter = createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })

  async function notifyNewComment(ownerEmail, { comment, thread, site }) {
    if (!ownerEmail) return
    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:5173'
    const threadLink = `${adminUrl}/sites/${site.id}/threads/${thread.id}`

    await transporter.sendMail({
      from,
      to: ownerEmail,
      subject: `Nuevo comentario pendiente en ${site.domain}`,
      text: [
        `Nuevo comentario en: ${thread.url_path}`,
        `Autor: ${comment.author_name}`,
        ``,
        comment.content,
        ``,
        `Moderar: ${threadLink}`,
      ].join('\n'),
      html: `
        <p>Nuevo comentario pendiente de moderación en <strong>${site.domain}</strong>.</p>
        <table>
          <tr><td><strong>Página</strong></td><td>${thread.url_path}</td></tr>
          <tr><td><strong>Autor</strong></td><td>${comment.author_name}</td></tr>
        </table>
        <blockquote>${comment.content_html}</blockquote>
        <p><a href="${threadLink}">Moderar comentario →</a></p>
      `,
    })
  }

  app.decorate('mailer', { notifyNewComment })
  app.addHook('onClose', () => transporter.close?.())
}

export default fp(mailerPlugin, { name: 'mailer' })
