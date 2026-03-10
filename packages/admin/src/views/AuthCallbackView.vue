<template>
  <div class="callback-wrap">
    <div class="spinner" />
    <p v-if="error" class="callback-error">{{ error }}</p>
    <p v-else>Iniciando sesión…</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth   = useAuthStore()
const error  = ref(null)

onMounted(async () => {
  // El token llega en el hash: /auth/callback#token=xxx
  const hash   = window.location.hash.slice(1)
  const params = new URLSearchParams(hash)
  const token  = params.get('token')

  if (!token) {
    error.value = 'No se recibió el token. Vuelve a intentarlo.'
    return
  }

  auth.setToken(token)
  // Limpiar el hash para que el token no quede en el historial del navegador
  window.history.replaceState(null, '', window.location.pathname)

  await auth.fetchMe()
  router.replace({ name: 'Dashboard' })
})
</script>

<style scoped>
.callback-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--c-muted);
}
.callback-error { color: var(--c-danger); font-weight: 500; }
</style>
