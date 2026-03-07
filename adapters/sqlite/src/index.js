import Database from 'better-sqlite3'

/**
 * Crea un adapter SQLite que expone la misma interfaz `{ query, close }`
 * que usa el adapter de Postgres.
 * WAL mode activado para máximo rendimiento en lecturas concurrentes.
 * @param {string} path - Ruta al archivo .db
 */
export function createSqliteAdapter(path) {
  const db = new Database(path)

  // WAL mode: las lecturas no bloquean escrituras
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  /**
   * Ejecuta una query con parámetros posicionales ($1, $2...).
   * Normaliza la sintaxis de Postgres a la de SQLite (?).
   * @param {string} sql
   * @param {any[]} params
   * @returns {Promise<object[]>}
   */
  async function query(sql, params = []) {
    // SQLite usa ? en lugar de $1, $2...
    const normalized = sql.replace(/\$(\d+)/g, '?')
    const stmt = db.prepare(normalized)

    // Detectar si es SELECT o mutación
    const isSelect = normalized.trimStart().toUpperCase().startsWith('SELECT')
    if (isSelect) {
      return stmt.all(...params)
    }

    const info = stmt.run(...params)
    // Simular el RETURNING de Postgres para INSERT/UPDATE
    if (info.lastInsertRowid) {
      const table = extractTable(normalized)
      if (table) {
        const row = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid)
        return row ? [row] : []
      }
    }
    return []
  }

  function close() {
    db.close()
  }

  return { query, close }
}

/** Extrae el nombre de tabla de un INSERT/UPDATE para el RETURNING simulado */
function extractTable(sql) {
  const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i)
  if (insertMatch) return insertMatch[1]
  const updateMatch = sql.match(/UPDATE\s+(\w+)/i)
  if (updateMatch) return updateMatch[1]
  return null
}
