/**
 * Runner de migraciones minimal.
 * Lee los archivos .sql de /migrations en orden y los ejecuta
 * solo si no han sido aplicados antes.
 */
import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, 'migrations')

async function run() {
  const driver = process.env.DB_DRIVER ?? 'sqlite'

  let db
  if (driver === 'postgres') {
    const { createPostgresAdapter } = await import('@remarq/adapter-postgres')
    db = await createPostgresAdapter(process.env.DATABASE_URL)
  } else {
    const { createSqliteAdapter } = await import('@remarq/adapter-sqlite')
    db = createSqliteAdapter(process.env.DATABASE_URL ?? './remarq.db')
  }

  // Asegurar que la tabla de migraciones existe
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    )
  `)

  const applied = new Set(
    (await db.query('SELECT name FROM _migrations')).map(r => r.name)
  )

  const files = (await readdir(MIGRATIONS_DIR))
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[skip] ${file}`)
      continue
    }

    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`[run]  ${file}`)

    // Ejecutar cada sentencia separada por punto y coma
    for (const stmt of sql.split(';').map(s => s.trim()).filter(Boolean)) {
      await db.query(stmt)
    }

    await db.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file])
    console.log(`[ok]   ${file}`)
  }

  await db.close?.()
  console.log('Migraciones completadas.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
