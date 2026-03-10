<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <h1>Mis sitios</h1>
        <button class="btn btn-primary" @click="showModal = true">+ Añadir sitio</button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div v-if="loading" class="spinner" />

      <div v-else-if="sites.length === 0" class="empty-state">
        <p>No tienes sitios registrados.</p>
        <p>Crea uno para empezar a recibir comentarios.</p>
      </div>

      <div v-else class="card-list">
        <RouterLink
          v-for="site in sites"
          :key="site.id"
          :to="{ name: 'Site', params: { siteId: site.id } }"
          class="card-item"
          style="text-decoration:none; color:inherit"
        >
          <div class="card-item-info">
            <div class="card-item-title">{{ site.domain }}</div>
            <div class="card-item-sub">Creado {{ fmtDate(site.created_at) }}</div>
          </div>
          <div class="card-item-actions">
            <span v-if="site.pending_count > 0" class="badge badge-pending">
              {{ site.pending_count }} pendiente{{ site.pending_count !== 1 ? 's' : '' }}
            </span>
            <span class="btn btn-ghost btn-sm">Ver →</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Modal crear sitio -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Añadir sitio</h2>
        <div v-if="createError" class="alert alert-error">{{ createError }}</div>
        <div class="form-group">
          <label>Dominio</label>
          <input
            v-model="newDomain"
            placeholder="ejemplo.com"
            @keyup.enter="createSite"
            :disabled="creating"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="createSite" :disabled="creating || !newDomain">
            {{ creating ? 'Creando…' : 'Crear sitio' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useApi } from '../composables/useApi.js'

const api = useApi()

const sites       = ref([])
const loading     = ref(true)
const error       = ref(null)
const showModal   = ref(false)
const newDomain   = ref('')
const creating    = ref(false)
const createError = ref(null)

async function loadSites() {
  loading.value = true
  error.value = null
  try {
    const data = await api.get('/admin/sites')
    sites.value = data.sites
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function createSite() {
  if (!newDomain.value) return
  creating.value = true
  createError.value = null
  try {
    const site = await api.post('/admin/sites', { domain: newDomain.value.trim() })
    sites.value.unshift({ ...site, pending_count: 0 })
    newDomain.value = ''
    showModal.value = false
  } catch (err) {
    createError.value = err.message
  } finally {
    creating.value = false
  }
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(loadSites)
</script>
