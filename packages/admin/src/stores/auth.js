import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'remarq_token'

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

  function logout() {
    setToken(null)
    user.value = null
  }

  return { token, user, isLoggedIn, setToken, fetchMe, logout }
})
