<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo">💬 Remarq</div>

      <nav class="sidebar-nav">
        <RouterLink :to="{ name: 'Dashboard' }">
          <span>🏠</span> Dashboard
        </RouterLink>
      </nav>

      <div class="sidebar-user" v-if="auth.user">
        <div class="sidebar-user-info">
          <img :src="auth.user.avatar_url" :alt="auth.user.login" />
          <span class="sidebar-user-name">{{ auth.user.login }}</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%" @click="handleLogout">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>
