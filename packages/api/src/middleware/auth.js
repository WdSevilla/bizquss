/**
 * Hook de Fastify para verificar que la request lleva una api_key válida
 * en el header X-Api-Key. Adjunta el site encontrado en request.site.
 */
export async function requireApiKey(request, reply) {
  const apiKey = request.headers['x-api-key']
  if (!apiKey) {
    return reply.code(401).send({ error: 'X-Api-Key header requerido' })
  }

  const site = await request.server.sites.findByApiKey(apiKey)
  if (!site) {
    return reply.code(401).send({ error: 'API key inválida' })
  }

  // Verificar que el origen de la request coincide con el dominio del sitio
  const origin = request.headers['origin'] ?? ''
  if (origin && !origin.includes(site.domain)) {
    return reply.code(403).send({ error: 'Dominio no autorizado para esta API key' })
  }

  request.site = site
}

/**
 * Hook para verificar JWT (panel admin).
 */
export async function requireJwt(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Token inválido o expirado' })
  }
}
