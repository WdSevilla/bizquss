/**
 * CommentRepository — lógica de negocio pura, agnóstica de la base de datos.
 * Recibe un `db` adapter (SQLite o Postgres) que implementa la misma interfaz.
 */
export class CommentRepository {
  /** @param {{ query: Function }} db */
  constructor(db) {
    this.db = db
  }

  /**
   * Lista comentarios aprobados de un hilo, con sus respuestas directas.
   * Devuelve un árbol plano ordenado por fecha — el frontend construye la jerarquía.
   * @param {string} threadId
   * @returns {Promise<object[]>}
   */
  async listByThread(threadId) {
    return this.db.query(
      `SELECT id, parent_id, author_name, content_html, created_at, edited_at
       FROM comments
       WHERE thread_id = $1 AND status = 'approved'
       ORDER BY created_at ASC`,
      [threadId]
    )
  }

  /**
   * Crea un comentario nuevo con estado 'pending' por defecto.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async create(data) {
    const { threadId, parentId, userId, authorName, authorEmail, content, contentHtml, ipHash } = data
    const [comment] = await this.db.query(
      `INSERT INTO comments
         (thread_id, parent_id, user_id, author_name, author_email, content, content_html, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, thread_id, parent_id, author_name, content_html, status, created_at`,
      [threadId, parentId ?? null, userId ?? null, authorName, authorEmail ?? null, content, contentHtml, ipHash]
    )
    return comment
  }

  /**
   * Cambia el estado de un comentario (moderación).
   * @param {string} id
   * @param {'approved'|'spam'|'deleted'} status
   * @returns {Promise<object>}
   */
  async updateStatus(id, status) {
    const [comment] = await this.db.query(
      `UPDATE comments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    )
    return comment
  }

  /**
   * Obtiene un comentario por ID (solo para uso interno/admin).
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [comment] = await this.db.query(
      `SELECT * FROM comments WHERE id = $1`,
      [id]
    )
    return comment ?? null
  }

  /**
   * Lista TODOS los comentarios de un hilo (admin), con filtro opcional de estado.
   * @param {string} threadId
   * @param {'pending'|'approved'|'spam'|'deleted'|'all'} [status='all']
   * @returns {Promise<object[]>}
   */
  async adminListByThread(threadId, status = 'all') {
    if (status === 'all') {
      return this.db.query(
        `SELECT id, parent_id, author_name, author_email, content, content_html,
                status, ip_hash, created_at, edited_at
         FROM comments
         WHERE thread_id = $1 AND status != 'deleted'
         ORDER BY created_at ASC`,
        [threadId]
      )
    }
    return this.db.query(
      `SELECT id, parent_id, author_name, author_email, content, content_html,
              status, ip_hash, created_at, edited_at
       FROM comments
       WHERE thread_id = $1 AND status = $2
       ORDER BY created_at ASC`,
      [threadId, status]
    )
  }

  /**
   * Cuenta comentarios pendientes agrupados por sitio.
   * @param {string} siteId
   * @returns {Promise<number>}
   */
  async countPendingBySite(siteId) {
    const [{ count }] = await this.db.query(
      `SELECT COUNT(*) as count FROM comments c
       JOIN threads t ON c.thread_id = t.id
       WHERE t.site_id = $1 AND c.status = 'pending'`,
      [siteId]
    )
    return Number(count)
  }
}
