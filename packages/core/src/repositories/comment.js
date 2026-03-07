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
}
