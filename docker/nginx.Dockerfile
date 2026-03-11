# Stage 1: Build del admin SPA y el widget con Vite
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/admin/package.json   ./packages/admin/
COPY packages/widget/package.json  ./packages/widget/
COPY packages/core/package.json    ./packages/core/

RUN pnpm install --frozen-lockfile

COPY packages/admin  ./packages/admin
COPY packages/widget ./packages/widget
COPY packages/core   ./packages/core

RUN pnpm --filter @bizquss/admin build
RUN pnpm --filter @bizquss/widget build

# Stage 2: nginx sirve el build estático
FROM nginx:alpine
COPY --from=builder /app/packages/admin/dist          /usr/share/nginx/html
COPY --from=builder /app/packages/widget/dist         /usr/share/nginx/html/widget
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
