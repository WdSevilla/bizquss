import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    // Ruta de callback OAuth: extrae el token del hash y redirige al dashboard
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallbackView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/sites/:siteId',
    name: 'Site',
    component: () => import('../views/SiteView.vue'),
  },
  {
    path: '/sites/:siteId/threads/:threadId',
    name: 'Thread',
    component: () => import('../views/ThreadView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global: redirigir a /login si no hay sesión
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'Login' }
  }
})

export default router
