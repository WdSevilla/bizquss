import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'

import { commentsRoutes } from './routes/comments.js'
import { sitesRoutes } from './routes/sites.js'
import { authRoutes } from './routes/auth.js'
import { dbPlugin } from './plugins/db.js'

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

// Rutas
await app.register(commentsRoutes, { prefix: '/v1/comments' })
await app.register(sitesRoutes,   { prefix: '/v1/sites' })
await app.register(authRoutes,    { prefix: '/v1/auth' })

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
