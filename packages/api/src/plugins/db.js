import fp from 'fastify-plugin'
import { CommentRepository, SiteRepository, ThreadRepository } from '@remarq/core'

/**
 * Plugin que inyecta el adapter de base de datos correcto
 * según la variable de entorno DB_DRIVER (sqlite | postgres).
 */
async function dbPlugin(app) {
  const driver = process.env.DB_DRIVER ?? 'sqlite'

  let db
  if (driver === 'postgres') {
    const { createPostgresAdapter } = await import('@remarq/adapter-postgres')
    db = await createPostgresAdapter(process.env.DATABASE_URL)
  } else {
    const { createSqliteAdapter } = await import('@remarq/adapter-sqlite')
    db = createSqliteAdapter(process.env.DATABASE_URL ?? './remarq.db')
  }

  // Decorar la instancia de Fastify con los repositorios
  app.decorate('db', db)
  app.decorate('comments', new CommentRepository(db))
  app.decorate('sites',    new SiteRepository(db))
  app.decorate('threads',  new ThreadRepository(db))

  app.addHook('onClose', async () => db.close?.())
}

export default fp(dbPlugin, { name: 'db' })
export { dbPlugin }
