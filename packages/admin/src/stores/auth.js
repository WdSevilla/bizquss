import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'bizquss_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const user  = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(t) {
    token.value = t
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else   localStorage.removeItem(TOKEN_KEY)
  }

  async function fetchMe() {
    if (!token.value) return

    try {
      const res = await fetch('/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token.value}` },
      })
      if (!res.ok) { logout(); return }
      user.value = await res.json()
    } catch {
      logout()
    }
  }

  async function loginWithCredentials(email, password) {
    const res = await fetch('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de autenticación')
    setToken(data.token)
    await fetchMe()
  }

  async function register(email, password, name) {
    const res = await fetch('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al crear cuenta')
    setToken(data.token)
    await fetchMe()
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  return { token, user, isLoggedIn, setToken, fetchMe, logout, loginWithCredentials, register }
})
