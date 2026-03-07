FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package.json pnpm-workspace.yaml ./
COPY packages/core/package.json    ./packages/core/
COPY packages/api/package.json     ./packages/api/
COPY adapters/sqlite/package.json  ./adapters/sqlite/
COPY adapters/postgres/package.json ./adapters/postgres/

RUN pnpm install --frozen-lockfile --prod

# Copiar código fuente
COPY packages/core/src    ./packages/core/src
COPY packages/api/src     ./packages/api/src
COPY adapters/sqlite/src  ./adapters/sqlite/src
COPY adapters/postgres/src ./adapters/postgres/src

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "node packages/api/src/db/migrate.js && node packages/api/src/server.js"]
