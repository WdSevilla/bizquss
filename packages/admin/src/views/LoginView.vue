<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-logo">💬 Bizquss</div>
      <h1 class="login-title">Panel de administración</h1>
      <p class="login-sub">Inicia sesión para moderar tus comentarios.</p>

      <div class="login-providers">
        <a class="btn btn-primary login-btn" :href="githubUrl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          Continuar con GitHub
        </a>

        <a class="btn btn-google login-btn" :href="googleUrl">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </a>
      </div>

      <div class="login-divider">
        <span>o</span>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <input
          v-if="isRegister"
          v-model="name"
          type="text"
          class="login-input"
          placeholder="Nombre (opcional)"
          autocomplete="name"
        />
        <input
          v-model="email"
          type="email"
          class="login-input"
          placeholder="Email"
          required
          autocomplete="email"
        />
        <input
          v-model="password"
          type="password"
          class="login-input"
          placeholder="Contraseña"
          required
          autocomplete="current-password"
          minlength="6"
        />
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? 'Cargando...' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión') }}
        </button>
      </form>

      <button class="login-toggle" @click="isRegister = !isRegister">
        {{ isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crear una' }}
      </button>

      <p class="login-hint">
        Solo los usuarios autorizados pueden acceder.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const githubUrl = '/v1/auth/github'
const googleUrl = '/v1/auth/google'

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isRegister.value) {
      await auth.register(email.value, password.value, name.value || undefined)
    } else {
      await auth.loginWithCredentials(email.value, password.value)
    }
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
}
.login-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
}
.login-logo   { font-size: 2rem; margin-bottom: .75rem; }
.login-title  { font-size: 1.3rem; font-weight: 700; margin-bottom: .4rem; }
.login-sub    { color: var(--c-muted); font-size: .9rem; margin-bottom: 1.75rem; }
.login-providers { display: flex; flex-direction: column; gap: .75rem; }
.login-btn    { width: 100%; justify-content: center; padding: .7rem 1rem; font-size: .95rem; }
.btn-google   {
  background: #fff; color: #3c4043; border: 1px solid var(--c-border);
  display: inline-flex; align-items: center; gap: .5rem;
  border-radius: var(--radius); text-decoration: none; cursor: pointer;
  transition: background .15s;
}
.btn-google:hover { background: #f8f9fa; }

.login-divider {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin: 1.25rem 0;
  color: var(--c-muted);
  font-size: .85rem;
}
.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--c-border);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: .65rem;
}
.login-input {
  width: 100%;
  padding: .6rem .75rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  font-size: .9rem;
  background: var(--c-bg);
  color: var(--c-text);
  box-sizing: border-box;
}
.login-input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 25%, transparent);
}
.login-error {
  color: var(--c-danger, #e53e3e);
  font-size: .8rem;
  margin: 0;
}
.login-toggle {
  background: none;
  border: none;
  color: var(--c-primary);
  font-size: .85rem;
  cursor: pointer;
  margin-top: .75rem;
  padding: 0;
}
.login-toggle:hover { text-decoration: underline; }

.login-hint   { margin-top: 1.25rem; font-size: .8rem; color: var(--c-muted); }
</style>
