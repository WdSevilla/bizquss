export class SiteRepository {
  /** @param {{ query: Function }} db */
  constructor(db) {
    this.db = db
  }

  async findByApiKey(apiKey) {
    const [site] = await this.db.query(
      `SELECT id, domain, settings FROM sites WHERE api_key = $1`,
      [apiKey]
    )
    return site ?? null
  }

  async findById(id) {
    const [site] = await this.db.query(
      `SELECT * FROM sites WHERE id = $1`,
      [id]
    )
    return site ?? null
  }

  async create(data) {
    const { domain, ownerId, apiKey, settings } = data
    const [site] = await this.db.query(
      `INSERT INTO sites (domain, owner_id, api_key, settings)
       VALUES ($1, $2, $3, $4)
       RETURNING id, domain, api_key, settings, created_at`,
      [domain, ownerId, apiKey, JSON.stringify(settings ?? {})]
    )
    return site
  }

  async updateSettings(id, settings) {
    const [site] = await this.db.query(
      `UPDATE sites SET settings = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(settings), id]
    )
    return site
  }
}
