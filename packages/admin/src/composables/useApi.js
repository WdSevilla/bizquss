/**
 * Composable para hacer llamadas a la API con el JWT del usuario.
 * En desarrollo, Vite hace proxy de /v1 → http://localhost:3100/v1.
 */
import { useAuthStore } from '../stores/auth.js'

export function useApi() {
  const auth = useAuthStore()

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' }
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

    const res = await fetch(`/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      auth.logout()
      throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.')
    }

    if (res.status === 204) return null

    const data = await res.json()

    if (!res.ok) {
      const msg = data.error ?? data.errors?.join(', ') ?? `Error ${res.status}`
      throw new Error(msg)
    }

    return data
  }

  return {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    patch:  (path, body)  => request('PATCH',  path, body),
    delete: (path)        => request('DELETE', path),
  }
}
