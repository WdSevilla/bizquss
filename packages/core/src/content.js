import { marked } from 'marked'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

const { window } = new JSDOM('')
const purify = DOMPurify(window)

// Solo permitir un subconjunto seguro de HTML
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a']
const ALLOWED_ATTR = ['href', 'title']

/**
 * Renderiza Markdown a HTML y lo sanitiza.
 * @param {string} input - Texto en Markdown del usuario
 * @returns {string} HTML sanitizado y seguro
 */
export function renderMarkdown(input) {
  const raw = marked.parse(input, { gfm: true, breaks: true })
  return purify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitiza contenido sin renderizar Markdown (para previews).
 * @param {string} input
 * @returns {string}
 */
export function sanitizeContent(input) {
  return purify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
