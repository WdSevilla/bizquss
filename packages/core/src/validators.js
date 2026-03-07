const MAX_COMMENT_LENGTH = parseInt(process.env.MAX_COMMENT_LENGTH ?? '10000')
const MAX_NAME_LENGTH = 100
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Valida los datos de un comentario entrante.
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateComment(data) {
  const errors = []

  if (!data.content || typeof data.content !== 'string') {
    errors.push('content es requerido')
  } else if (data.content.trim().length === 0) {
    errors.push('content no puede estar vacío')
  } else if (data.content.length > MAX_COMMENT_LENGTH) {
    errors.push(`content excede el máximo de ${MAX_COMMENT_LENGTH} caracteres`)
  }

  if (!data.author_name || typeof data.author_name !== 'string') {
    errors.push('author_name es requerido')
  } else if (data.author_name.trim().length === 0) {
    errors.push('author_name no puede estar vacío')
  } else if (data.author_name.length > MAX_NAME_LENGTH) {
    errors.push('author_name demasiado largo')
  }

  if (data.author_email && !EMAIL_RE.test(data.author_email)) {
    errors.push('author_email no es válido')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Valida los datos para crear un sitio.
 * @param {object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSite(data) {
  const errors = []

  if (!data.domain || typeof data.domain !== 'string') {
    errors.push('domain es requerido')
  } else {
    try {
      new URL(`https://${data.domain}`)
    } catch {
      errors.push('domain no es válido')
    }
  }

  return { valid: errors.length === 0, errors }
}
