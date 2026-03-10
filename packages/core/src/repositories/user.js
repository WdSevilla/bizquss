export class UserRepository {
  /** @param {{ query: Function }} db */
  constructor(db) {
    this.db = db
  }

  async findByGoogleId(googleId) {
    const [user] = await this.db.query(
      `SELECT * FROM users WHERE google_id = $1`,
      [String(googleId)]
    )
    return user ?? null
  }

  async findByGithubId(githubId) {
    const [user] = await this.db.query(
      `SELECT * FROM users WHERE github_id = $1`,
      [String(githubId)]
    )
    return user ?? null
  }

  async findById(id) {
    const [user] = await this.db.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    )
    return user ?? null
  }

  async upsertFromGithub({ githubId, login, name, avatarUrl, email }) {
    const existing = await this.findByGithubId(githubId)

    if (existing) {
      const [user] = await this.db.query(
        `UPDATE users SET login = $1, name = $2, avatar_url = $3, email = $4
         WHERE github_id = $5 RETURNING *`,
        [login, name ?? null, avatarUrl ?? null, email ?? null, String(githubId)]
      )
      return user
    }

    // Si es el primer usuario, es admin automáticamente
    const [{ count }] = await this.db.query(`SELECT COUNT(*) as count FROM users`)
    const isAdmin = Number(count) === 0 ? 1 : 0

    const [user] = await this.db.query(
      `INSERT INTO users (github_id, login, name, avatar_url, email, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [String(githubId), login, name ?? null, avatarUrl ?? null, email ?? null, isAdmin]
    )
    return user
  }

  async upsertFromGoogle({ googleId, login, name, avatarUrl, email }) {
    const existing = await this.findByGoogleId(googleId)

    if (existing) {
      const [user] = await this.db.query(
        `UPDATE users SET login = $1, name = $2, avatar_url = $3, email = $4
         WHERE google_id = $5 RETURNING *`,
        [login, name ?? null, avatarUrl ?? null, email ?? null, String(googleId)]
      )
      return user
    }

    const [{ count }] = await this.db.query(`SELECT COUNT(*) as count FROM users`)
    const isAdmin = Number(count) === 0 ? 1 : 0

    const [user] = await this.db.query(
      `INSERT INTO users (google_id, login, name, avatar_url, email, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [String(googleId), login, name ?? null, avatarUrl ?? null, email ?? null, isAdmin]
    )
    return user
  }

  async countAll() {
    const [{ count }] = await this.db.query(`SELECT COUNT(*) as count FROM users`)
    return Number(count)
  }
}
