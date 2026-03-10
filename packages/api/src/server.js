import { config } from 'dotenv'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
// Busca el .env en la raíz del monorepo (dos niveles arriba de packages/api/src)
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'

import { commentsRoutes } from './routes/comments.js'
import { sitesRoutes } from './routes/sites.js'
import { authRoutes } from './routes/auth.js'
import { adminRoutes } from './routes/admin.js'
import { dbPlugin } from './plugins/db.js'
import mailerPlugin from './services/mailer.js'

const app = Fastify({ logger: true })

// Seguridad
await app.register(helmet, { contentSecurityPolicy: false })
await app.register(cors, {
  origin: true, // En producción, limitar a dominios registrados
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
})
await app.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.headers['x-api-key'] ?? req.ip,
})
await app.register(jwt, {
  secret: process.env.JWT_SECRET,
})

// Base de datos (inyectada como plugin)
await app.register(dbPlugin)
await app.register(mailerPlugin)

// Rutas públicas (widget)
await app.register(commentsRoutes, { prefix: '/v1/comments' })
await app.register(sitesRoutes,   { prefix: '/v1/sites' })

// Auth (OAuth + JWT)
await app.register(authRoutes, { prefix: '/v1/auth' })

// Panel admin (JWT requerido)
await app.register(adminRoutes, { prefix: '/v1/admin' })

// Health check
app.get('/health', () => ({ status: 'ok', version: '0.1.0' }))

const port = parseInt(process.env.PORT ?? '3100')
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
