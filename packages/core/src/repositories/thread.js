export class ThreadRepository {
  /** @param {{ query: Function }} db */
  constructor(db) {
    this.db = db
  }

  /**
   * Busca un hilo por siteId + urlPath. Si no existe, lo crea (upsert).
   * Esto permite que el widget no tenga que crear hilos manualmente.
   * @param {string} siteId
   * @param {string} urlPath
   * @param {string} [title]
   * @returns {Promise<object>}
   */
  async findOrCreate(siteId, urlPath, title) {
    const [existing] = await this.db.query(
      `SELECT * FROM threads WHERE site_id = $1 AND url_path = $2`,
      [siteId, urlPath]
    )
    if (existing) return existing

    const [thread] = await this.db.query(
      `INSERT INTO threads (site_id, url_path, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [siteId, urlPath, title ?? urlPath]
    )
    return thread
  }

  async listBySite(siteId) {
    return this.db.query(
      `SELECT t.*, COUNT(c.id) FILTER (WHERE c.status = 'pending') AS pending_count
       FROM threads t
       LEFT JOIN comments c ON c.thread_id = t.id
       WHERE t.site_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [siteId]
    )
  }
}
