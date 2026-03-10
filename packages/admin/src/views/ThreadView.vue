<template>
  <AppLayout>
    <div class="page">
      <div class="breadcrumb">
        <RouterLink :to="{ name: 'Dashboard' }">Dashboard</RouterLink>
        <span class="breadcrumb-sep">/</span>
        <RouterLink :to="{ name: 'Site', params: { siteId } }">{{ siteDomain }}</RouterLink>
        <span class="breadcrumb-sep">/</span>
        <span>{{ thread?.title || thread?.url_path || '…' }}</span>
      </div>

      <div class="page-header">
        <div>
          <h1>{{ thread?.title || thread?.url_path }}</h1>
          <p v-if="thread" style="color:var(--c-muted);font-size:.82rem;margin-top:.2rem">
            <code>{{ thread.url_path }}</code>
          </p>
        </div>
        <button
          v-if="thread"
          class="btn btn-sm"
          :class="thread.is_locked ? 'btn-primary' : 'btn-ghost'"
          @click="toggleLock"
          :disabled="locking"
        >
          {{ thread.is_locked ? '🔓 Desbloquear' : '🔒 Cerrar hilo' }}
        </button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <!-- Tabs de filtro -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="setTab(tab.value)"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="badge badge-pending" style="margin-left:.3rem">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="loading" class="spinner" />

      <div v-else-if="filtered.length === 0" class="empty-state">
        No hay comentarios en este estado.
      </div>

      <div v-else>
        <div
          v-for="comment in filtered"
          :key="comment.id"
          class="comment-card"
          :class="{ 'comment-card--deleted': comment.status === 'deleted' }"
        >
          <div class="comment-header">
            <span class="comment-author">{{ comment.author_name }}</span>
            <span v-if="comment.author_email" class="comment-email">{{ comment.author_email }}</span>
            <span class="badge" :class="`badge-${comment.status}`">{{ statusLabel(comment.status) }}</span>
            <span class="comment-date">{{ fmtDate(comment.created_at) }}</span>
          </div>

          <div class="comment-body" v-html="comment.content_html" />

          <div class="comment-actions" v-if="comment.status !== 'deleted'">
            <button
              v-if="comment.status !== 'approved'"
              class="btn btn-success btn-sm"
              @click="moderate(comment, 'approved')"
            >✓ Aprobar</button>

            <button
              v-if="comment.status !== 'pending'"
              class="btn btn-ghost btn-sm"
              @click="moderate(comment, 'pending')"
            >↩ Pendiente</button>

            <button
              v-if="comment.status !== 'spam'"
              class="btn btn-ghost btn-sm"
              @click="moderate(comment, 'spam')"
            >⛔ Spam</button>

            <button
              class="btn btn-danger btn-sm"
              style="margin-left:auto"
              @click="moderate(comment, 'deleted')"
            >🗑 Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useApi } from '../composables/useApi.js'

const route    = useRoute()
const api      = useApi()
const siteId   = route.params.siteId
const threadId = route.params.threadId

const thread     = ref(null)
const comments   = ref([])
const loading    = ref(true)
const error      = ref(null)
const locking    = ref(false)
const activeTab  = ref('pending')
const siteDomain = ref('')

const tabs = computed(() => [
  { value: 'pending',  label: 'Pendientes', count: comments.value.filter(c => c.status === 'pending').length },
  { value: 'approved', label: 'Aprobados',  count: 0 },
  { value: 'spam',     label: 'Spam',       count: 0 },
  { value: 'all',      label: 'Todos',      count: 0 },
])

const filtered = computed(() => {
  if (activeTab.value === 'all') return comments.value
  return comments.value.filter(c => c.status === activeTab.value)
})

function setTab(tab) { activeTab.value = tab }

async function load() {
  loading.value = true
  error.value   = null
  try {
    const [data, sitesData] = await Promise.all([
      api.get(`/admin/threads/${threadId}/comments`),
      api.get('/admin/sites'),
    ])
    thread.value   = data.thread
    comments.value = data.comments
    const site     = sitesData.sites.find(s => s.id === siteId)
    siteDomain.value = site?.domain ?? ''
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function moderate(comment, status) {
  try {
    await api.patch(`/admin/comments/${comment.id}`, { status })
    comment.status = status
  } catch (err) {
    error.value = err.message
  }
}

async function toggleLock() {
  if (!thread.value) return
  locking.value = true
  try {
    const updated = await api.patch(`/admin/threads/${threadId}`, { locked: !thread.value.is_locked })
    thread.value.is_locked = updated.is_locked
  } catch (err) {
    error.value = err.message
  } finally {
    locking.value = false
  }
}

function statusLabel(s) {
  return { pending: 'Pendiente', approved: 'Aprobado', spam: 'Spam', deleted: 'Eliminado' }[s] ?? s
}

function fmtDate(d) {
  return new Date(d).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
.comment-card--deleted { opacity: .5; }
</style>
