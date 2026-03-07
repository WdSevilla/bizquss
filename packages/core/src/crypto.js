import { createHash, randomBytes } from 'node:crypto'

/**
 * Hashea una IP con un salt rotativo diario.
 * El hash expira naturalmente cuando el salt cambia — cumple RGPD.
 * @param {string} ip
 * @param {string} salt - Salt del día (env: SALT + fecha actual)
 * @returns {string}
 */
export function hashIp(ip, salt) {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

/**
 * Genera una API key segura para identificar un sitio.
 * @returns {string} - 32 bytes en hex (64 caracteres)
 */
export function generateApiKey() {
  return randomBytes(32).toString('hex')
}

/**
 * Genera el salt diario combinando el salt base con la fecha UTC.
 * @param {string} baseSalt - Valor de la variable de entorno SALT
 * @returns {string}
 */
export function getDailySalt(baseSalt) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `${baseSalt}:${today}`
}
