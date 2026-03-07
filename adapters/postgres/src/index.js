import postgres from 'postgres'

/**
 * Crea un adapter PostgreSQL que expone la interfaz `{ query, close }`.
 * @param {string} connectionString
 */
export async function createPostgresAdapter(connectionString) {
  const sql = postgres(connectionString, {
    max: 10,           // pool de conexiones
    idle_timeout: 30,
    connect_timeout: 10,
  })

  /**
   * Ejecuta una query parametrizada.
   * @param {string} sqlStr
   * @param {any[]} params
   * @returns {Promise<object[]>}
   */
  async function query(sqlStr, params = []) {
    // La librería `postgres` usa tagged templates, así que usamos
    // sql.unsafe para queries dinámicas con parámetros posicionales
    const result = await sql.unsafe(sqlStr, params)
    return Array.from(result)
  }

  async function close() {
    await sql.end()
  }

  return { query, close }
}
