# Remarq

Sistema de comentarios open-source, self-hosteable. Alternativa a Disqus/Commento.

- **Widget** — Web Component `<remarq-widget>` compatible con cualquier web o CMS
- **Panel de moderación** — SPA Vue 3 para aprobar, marcar spam o eliminar comentarios
- **API** — Fastify, sin dependencias de terceros para los datos
- **Base de datos** — SQLite (por defecto) o PostgreSQL
- **Auth** — GitHub OAuth, Google OAuth

---

## Despliegue rápido con Docker

### 1. Requisitos previos

- Docker y Docker Compose instalados
- Una OAuth App en GitHub y/o Google (ver más abajo)

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (usa una cadena larga aleatoria) |
| `SALT` | Sal para anonimizar IPs de comentaristas |
| `GITHUB_CLIENT_ID` | ID de tu OAuth App de GitHub |
| `GITHUB_CLIENT_SECRET` | Secret de tu OAuth App de GitHub |
| `GOOGLE_CLIENT_ID` | ID de tu OAuth App de Google (opcional) |
| `GOOGLE_CLIENT_SECRET` | Secret de tu OAuth App de Google (opcional) |
| `ADMIN_URL` | URL pública del panel admin, ej. `http://192.168.1.10` |
| `BASE_URL` | URL pública de la API, ej. `http://192.168.1.10` |
| `SMTP_HOST` | Servidor SMTP para notificaciones (opcional) |

### 3. Registrar la OAuth App

**GitHub:**
1. Ve a [github.com/settings/developers](https://github.com/settings/developers) → *New OAuth App*
2. **Authorization callback URL**: `http://TU_IP/v1/auth/github/callback`

**Google** (opcional):
1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → *APIs y servicios* → *Credenciales* → *Crear credenciales* → *ID de cliente OAuth*
2. **URI de redireccionamiento autorizado**: `http://TU_IP/v1/auth/google/callback`

### 4. Arrancar

```bash
cd docker
docker compose up -d --build
```

- Panel de administración: `http://TU_IP/`
- API: `http://TU_IP/v1/`

El primer usuario que inicie sesión queda como administrador automáticamente.

### Con PostgreSQL

```bash
cd docker
POSTGRES_PASSWORD=mipassword docker compose --profile postgres up -d --build
```

Y en `.env`:
```
DB_DRIVER=postgres
DATABASE_URL=postgresql://remarq:mipassword@postgres:5432/remarq
```

---

## Incrustar el widget

### Instalación directa (CDN)

```html
<script src="http://TU_IP/widget/remarq.min.js"></script>
<remarq-widget
  api-url="http://TU_IP"
  site-key="TU_API_KEY"
></remarq-widget>
```

### Con bundler (npm)

```bash
npm install @remarq/widget
```

```js
import '@remarq/widget'
```

```html
<remarq-widget api-url="http://TU_IP" site-key="TU_API_KEY"></remarq-widget>
```

### Atributos del widget

| Atributo | Requerido | Descripción |
|---|---|---|
| `api-url` | Sí | URL base de tu instancia de Remarq |
| `site-key` | Sí | API key del sitio (se obtiene en el panel) |
| `thread-url` | No | URL del hilo (por defecto `window.location.pathname`) |
| `theme` | No | `auto` (por defecto), `light`, `dark` |

---

## Desarrollo local

### Requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npx pnpm --filter @remarq/api db:migrate

# Arrancar API (puerto 3100) y admin (puerto 5173) en paralelo
pnpm --filter @remarq/api dev &
pnpm --filter @remarq/admin dev
```

### Estructura del monorepo

```
packages/
  core/     — repositorios y lógica de negocio (sin dependencias de framework)
  api/      — servidor Fastify  (puerto 3100)
  admin/    — panel Vue 3       (puerto 5173 en dev)
  widget/   — Web Component <remarq-widget>
adapters/
  sqlite/   — adapter SQLite
  postgres/ — adapter PostgreSQL
docker/     — Dockerfile, nginx.Dockerfile, docker-compose.yml, nginx.conf
```

### Build del widget

```bash
pnpm --filter @remarq/widget build
# → packages/widget/dist/remarq.min.js  (para <script src>)
# → packages/widget/dist/remarq.esm.js  (para bundlers)
```

---

## Moderación

El panel en `/` permite:

- **Sitios**: crear sitios y obtener la API key para el widget
- **Hilos**: ver todos los hilos de un sitio, bloquear/desbloquear
- **Comentarios**: aprobar, marcar como spam, restaurar o eliminar

El estado por defecto de los comentarios nuevos se controla con `DEFAULT_MODERATION`:
- `pending` — requieren aprobación manual (recomendado)
- `auto_approve` — se publican automáticamente

---

## Licencia

[AGPL-3.0](LICENSE) — si modificas y hospedas el servicio, debes publicar tu código fuente.
