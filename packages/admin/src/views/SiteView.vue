<template>
  <AppLayout>
    <div class="page">
      <div class="breadcrumb">
        <RouterLink :to="{ name: 'Dashboard' }">Dashboard</RouterLink>
        <span class="breadcrumb-sep">/</span>
        <span>{{ site?.domain ?? '…' }}</span>
      </div>

      <div class="page-header">
        <div>
          <h1>{{ site?.domain }}</h1>
          <p style="color:var(--c-muted);font-size:.85rem;margin-top:.25rem">
            Hilos de comentarios
          </p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="showApiKey = !showApiKey">
          {{ showApiKey ? 'Ocultar API key' : 'Ver API key' }}
        </button>
      </div>

      <!-- API key -->
      <div v-if="showApiKey && site" class="api-key-box" style="margin-bottom:1.5rem">
        <span class="api-key-value">{{ site.api_key }}</span>
        <button class="btn btn-ghost btn-sm" @click="copyKey">{{ copied ? '✓ Copiado' : 'Copiar' }}</button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="loading" class="spinner" />

      <div v-else-if="threads.length === 0" class="empty-state">
        <p>Sin hilos todavía.</p>
        <p>Los hilos se crean automáticamente cuando llega el primer comentario.</p>
      </div>

      <div v-else class="card-list">
        <RouterLink
          v-for="thread in threads"
          :key="thread.id"
          :to="{ name: 'Thread', params: { siteId: siteId, threadId: thread.id } }"
          class="card-item"
          style="text-decoration:none; color:inherit"
        >
          <div class="card-item-info">
            <div class="card-item-title">{{ thread.title || thread.url_path }}</div>
            <div class="card-item-sub">
              <code style="font-size:.78rem">{{ thread.url_path }}</code>
              · {{ fmtDate(thread.created_at) }}
              <span v-if="thread.is_locked" style="color:var(--c-warn);margin-left:.4rem">🔒 Cerrado</span>
            </div>
          </div>
          <div class="card-item-actions">
            <span v-if="Number(thread.pending_count) > 0" class="badge badge-pending">
              {{ thread.pending_count }} pendiente{{ thread.pending_count != 1 ? 's' : '' }}
            </span>
            <span class="btn btn-ghost btn-sm">Moderar →</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useApi } from '../composables/useApi.js'

const route   = useRoute()
const api     = useApi()
const siteId  = route.params.siteId

const site      = ref(null)
const threads   = ref([])
const loading   = ref(true)
const error     = ref(null)
const showApiKey = ref(false)
const copied    = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [sitesData, threadsData] = await Promise.all([
      api.get('/admin/sites'),
      api.get(`/admin/sites/${siteId}/threads`),
    ])
    site.value    = sitesData.sites.find(s => s.id === siteId) ?? null
    threads.value = threadsData.threads
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function copyKey() {
  if (!site.value?.api_key) return
  await navigator.clipboard.writeText(site.value.api_key)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(load)
</script>
