# Bizquss

Sistema de comentarios open-source, self-hosteable. Alternativa a Disqus/Commento.

- **Widget** — Web Component `<bizquss-widget>` compatible con cualquier web o CMS
- **Panel de moderación** — SPA Vue 3 para aprobar, marcar spam o eliminar comentarios
- **API** — Fastify, sin dependencias de terceros para los datos
- **Base de datos** — SQLite (por defecto) o PostgreSQL
- **Auth** — GitHub OAuth, Google OAuth

---

## Índice

- [Despliegue con Docker](#despliegue-rápido-con-docker)
- [Incrustar el widget](#incrustar-el-widget)
- [Desarrollo local](#desarrollo-local)
- [Moderación](#moderación)
- [Licencia](#licencia)

---

## Despliegue rápido con Docker

### 1. Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/) instalados
- Git para clonar el repositorio
- Una OAuth App en GitHub y/o Google (ver paso 3)

```bash
# Verificar que Docker está disponible
docker --version        # Docker 24+ recomendado
docker compose version  # Compose v2+
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/bizquss.git
cd bizquss
```

### 3. Registrar la OAuth App

Bizquss requiere al menos un proveedor OAuth para autenticar administradores. Configura GitHub, Google o ambos.

**GitHub** (recomendado):
1. Ve a [github.com/settings/developers](https://github.com/settings/developers) → *New OAuth App*
2. Rellena los campos:
   - **Application name**: `Bizquss` (o el nombre que prefieras)
   - **Homepage URL**: `http://TU_IP`
   - **Authorization callback URL**: `http://TU_IP/v1/auth/github/callback`
3. Pulsa *Register application* y copia el **Client ID** y el **Client Secret**

**Google** (opcional):
1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → *APIs y servicios* → *Credenciales* → *Crear credenciales* → *ID de cliente OAuth 2.0*
2. Tipo de aplicación: **Aplicación web**
3. **URI de redireccionamiento autorizado**: `http://TU_IP/v1/auth/google/callback`
4. Copia el **Client ID** y el **Client Secret**

> Sustituye `TU_IP` por la IP o dominio donde servirás Bizquss (p. ej. `192.168.1.10` o `comentarios.tudominio.com`).

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores. Los campos marcados con `*` son **obligatorios**:

| Variable | * | Descripción | Ejemplo |
|---|---|---|---|
| `JWT_SECRET` | ✓ | Clave secreta para firmar tokens JWT. Usa una cadena larga y aleatoria. | `openssl rand -hex 32` |
| `SALT` | ✓ | Sal para anonimizar IPs de comentaristas. | `openssl rand -hex 16` |
| `BASE_URL` | ✓ | URL pública de la API (sin barra final). | `http://192.168.1.10` |
| `ADMIN_URL` | ✓ | URL pública del panel admin (sin barra final). | `http://192.168.1.10` |
| `GITHUB_CLIENT_ID` | ✓* | ID de tu OAuth App de GitHub. | `Iv1.abc123` |
| `GITHUB_CLIENT_SECRET` | ✓* | Secret de tu OAuth App de GitHub. | `abc123...` |
| `GOOGLE_CLIENT_ID` | — | ID de tu OAuth App de Google (opcional). | `123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | — | Secret de tu OAuth App de Google (opcional). | `GOCSPX-...` |
| `DEFAULT_MODERATION` | — | Estado por defecto de nuevos comentarios. | `pending` \| `auto_approve` |
| `MAX_COMMENT_LENGTH` | — | Longitud máxima de un comentario en caracteres. | `10000` |
| `SMTP_HOST` | — | Servidor SMTP para notificaciones por email. | `smtp.gmail.com` |
| `SMTP_PORT` | — | Puerto SMTP. | `587` |
| `SMTP_USER` | — | Usuario SMTP. | `tu@gmail.com` |
| `SMTP_PASS` | — | Contraseña SMTP. | `app-password` |
| `SMTP_FROM` | — | Dirección remitente de los emails. | `noreply@tudominio.com` |

> `*` Al menos GitHub **o** Google debe estar configurado.

Para generar valores seguros para `JWT_SECRET` y `SALT`:
```bash
openssl rand -hex 32   # para JWT_SECRET
openssl rand -hex 16   # para SALT
```

### 5. Arrancar con SQLite (por defecto)

```bash
cd docker
docker compose up -d --build
```

Docker descargará las imágenes base, compilará los contenedores y levantará los servicios. La primera vez puede tardar varios minutos.

Una vez iniciado:
- **Panel de administración**: `http://TU_IP/`
- **API**: `http://TU_IP/v1/`

El **primer usuario** que inicie sesión queda registrado como administrador automáticamente.

Los datos SQLite se persisten en el volumen Docker `bizquss_data` (en `/data/bizquss.db` dentro del contenedor).

#### Verificar que está corriendo

```bash
docker compose ps              # ver estado de los contenedores
docker compose logs -f api     # logs de la API en tiempo real
curl http://TU_IP/health       # debe devolver {"status":"ok"}
```

### 5b. Arrancar con PostgreSQL

Activa el perfil `postgres` y proporciona la contraseña:

```bash
cd docker
POSTGRES_PASSWORD=mipassword docker compose --profile postgres up -d --build
```

Y en `.env` cambia las variables de base de datos:
```env
DB_DRIVER=postgres
DATABASE_URL=postgresql://bizquss:mipassword@postgres:5432/bizquss
```

Reinicia los servicios para que lean la nueva configuración:
```bash
docker compose down
POSTGRES_PASSWORD=mipassword docker compose --profile postgres up -d
```

### Actualizar a una nueva versión

```bash
cd docker
git pull
docker compose down
docker compose up -d --build
```

Los datos (volúmenes Docker) se conservan entre actualizaciones.

---

## Incrustar el widget

Primero crea un sitio en el panel de administración (`http://TU_IP/`) y copia la **API key** generada.

### Instalación directa (sin bundler)

```html
<script src="http://TU_IP/widget/bizquss.min.js"></script>
<bizquss-widget
  api-url="http://TU_IP"
  site-key="TU_API_KEY"
></bizquss-widget>
```

### Con bundler (npm/pnpm)

```bash
npm install @bizquss/widget
# o
pnpm add @bizquss/widget
```

```js
// Importar una sola vez (p. ej. en main.js)
import '@bizquss/widget'
```

```html
<bizquss-widget api-url="http://TU_IP" site-key="TU_API_KEY"></bizquss-widget>
```

### Atributos del widget

| Atributo | Requerido | Por defecto | Descripción |
|---|---|---|---|
| `api-url` | Sí | — | URL base de tu instancia de Bizquss |
| `site-key` | Sí | — | API key del sitio (se obtiene en el panel) |
| `thread-url` | No | `window.location.pathname` | Identificador del hilo de comentarios |
| `theme` | No | `auto` | `auto`, `light` o `dark` |

El atributo `thread-url` permite agrupar comentarios por página. Si no se especifica, usa la ruta actual del navegador.

---

## Desarrollo local

### Requisitos

- Node.js 20+
- pnpm 9+ — `npm install -g pnpm`

```bash
node --version   # v20+
pnpm --version   # 9+
```

### Setup inicial

```bash
# 1. Instalar todas las dependencias del monorepo
pnpm install

# 2. Copiar las variables de entorno
cp .env.example .env
# Edita .env: ajusta BASE_URL, ADMIN_URL, OAuth credentials...

# 3. Ejecutar migraciones de base de datos
pnpm db:migrate

# 4. Arrancar todos los servicios en paralelo
pnpm dev
```

O arrancar servicios individualmente:

```bash
# Solo la API (puerto 3100)
pnpm --filter @bizquss/api dev

# Solo el panel admin (puerto 5173)
pnpm --filter @bizquss/admin dev

# Solo el widget (modo watch)
pnpm --filter @bizquss/widget dev
```

En desarrollo, la API corre en `http://localhost:3100` y el admin en `http://localhost:5173`. Configura `ADMIN_URL=http://localhost:5173` y `BASE_URL=http://localhost:3100` en `.env`.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Arranca API, admin y widget en modo watch (paralelo) |
| `pnpm build` | Compila todos los paquetes para producción |
| `pnpm test` | Ejecuta todos los tests |
| `pnpm lint` | Linting de todos los paquetes |
| `pnpm db:migrate` | Aplica las migraciones de base de datos |

### Estructura del monorepo

```
packages/
  core/     — repositorios y lógica de negocio (sin dependencias de framework)
  api/      — servidor Fastify  (puerto 3100)
  admin/    — panel Vue 3       (puerto 5173 en dev)
  widget/   — Web Component <bizquss-widget>
adapters/
  sqlite/   — adapter SQLite (por defecto)
  postgres/ — adapter PostgreSQL
docker/     — Dockerfile, nginx.Dockerfile, docker-compose.yml, nginx.conf
```

### Build del widget

```bash
pnpm --filter @bizquss/widget build
# Salida:
#   packages/widget/dist/bizquss.min.js   → para <script src>
#   packages/widget/dist/bizquss.esm.js   → para bundlers (import)
```

### Tests

```bash
pnpm test                              # todos los tests
pnpm --filter @bizquss/core test       # solo core
pnpm --filter @bizquss/api test        # solo API
pnpm --filter @bizquss/sqlite test     # solo adapter SQLite
pnpm --filter @bizquss/postgres test   # solo adapter PostgreSQL
```

---

## Moderación

El panel en `http://TU_IP/` permite:

- **Sitios**: crear sitios y obtener la API key para el widget
- **Hilos**: ver todos los hilos de un sitio, bloquear/desbloquear
- **Comentarios**: aprobar, marcar como spam, restaurar o eliminar

El estado por defecto de los comentarios nuevos se controla con `DEFAULT_MODERATION` en `.env`:
- `pending` — requieren aprobación manual antes de ser visibles (recomendado)
- `auto_approve` — se publican automáticamente sin revisión

---

## Licencia

[AGPL-3.0](LICENSE) — si modificas y hospedas el servicio, debes publicar tu código fuente.
