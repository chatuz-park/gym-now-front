# Gym Now

Frontend de gestión de gimnasio para entrenadores y clientes. Permite administrar clientes, rutinas, ejercicios y el seguimiento de progreso, con autenticación JWT y vistas distintas según el rol.

Desarrollado con React 19, TypeScript y Vite. El backend esperado es [gym-now-back](https://github.com/chatuz-park/gym-now-back) (Django REST + JWT) en `http://localhost:8000/api`.

## Características

### Autenticación y roles

- Login con JWT (`access` + `refresh`)
- Renovación automática del token ante respuestas 401
- Cierre de sesión y redirección a `/login` cuando la sesión expira
- Roles: `owner`, `trainer`, `client` y `guest`
- Rutas protegidas por rol (`ProtectedRoute`)

| Rol | Acceso principal |
| --- | --- |
| `owner` / `trainer` | Dashboard, clientes, rutinas, ejercicios, progreso global y ajustes |
| `client` / `guest` | Perfil propio (`/me`), rutina del día y progreso personal |

### Gestión de clientes

- Alta, edición y baja de clientes
- Búsqueda con debounce
- Suscripciones (`standard`, `premium`, `personalized`) y avisos de vencimiento
- Asignación de rutinas por días de la semana
- Registro de medidas (peso, grasa, masa muscular y perímetros)
- Foto de perfil (subida multipart)

### Rutinas y ejercicios

- CRUD de rutinas con workouts y series
- Selector de ejercicios al crear o editar una rutina
- CRUD de ejercicios: grupos musculares, equipo, dificultad e instrucciones
- Filtros y búsqueda

### Vista de cliente

- Ficha del cliente (`/clients/:id`) o perfil autenticado (`/me`)
- Rutina del día, con navegación por días
- Gráficas de progreso (Recharts) y selector de métricas
- Edición de datos y foto de perfil

### Interfaz

- Mobile-first: barra inferior en móvil y sidebar en desktop (entrenadores/dueños)
- Componentes UI con Radix + Tailwind
- Formularios con Formik y validación Yup
- Toasts con `react-hot-toast`

> **Ajustes** es un placeholder. El dashboard y las pantallas de progreso leen la API.

## Stack

| Área | Tecnología |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 (Rolldown) |
| Gestor de paquetes | Bun 1.3+ (`packageManager`: `bun@1.3.10`) |
| Estilos | Tailwind CSS 3 |
| Componentes | Radix UI + Lucide React |
| Routing | React Router 7 |
| HTTP | Axios (interceptores JWT) |
| Server state | TanStack Query |
| Client state | Zustand |
| Formularios | Formik + Yup |
| Gráficas | Recharts |
| Auth | JWT (localStorage) + Zustand |

## Requisitos

- [Bun](https://bun.sh) 1.3+
- Backend Gym Now en marcha (por defecto `http://localhost:8000/api`)
- Docker y Docker Compose (opcional, para contenedores)

## Instalación local

```bash
git clone git@github.com:chatuz-park/gym-now-front.git
cd gym-now
cp env.example .env
bun install
bun run dev
```

Abre `http://localhost:5173` (o el `PORT` de tu `.env`).

### Scripts

| Comando | Descripción |
| --- | --- |
| `bun run dev` | Servidor de desarrollo (Vite + HMR) |
| `bun run build` | Typecheck (`tsc -b`) y build de producción |
| `bun run preview` | Sirve el build localmente |
| `bun run lint` | ESLint |

## Variables de entorno

Copia `env.example` a `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Gym Now
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# Desarrollo (Vite)
PORT=5173
HOST=0.0.0.0
VITE_ALLOWED_HOSTS=localhost

# Producción (Nginx / Docker)
HTTP_PORT=8080
```

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | Base URL de la API. Vite la incrusta **en tiempo de build**. Debe ser alcanzable desde el **navegador**, no un hostname interno de Docker (`backend`). |
| `VITE_APP_NAME` / `VITE_APP_VERSION` | Metadatos de la app (también se incrustan en el build). |
| `PORT` / `HOST` | Puerto y bind del servidor Vite. Compose usa `5173` si no se define `PORT`. |
| `VITE_ALLOWED_HOSTS` | Hosts permitidos por Vite (lista separada por comas). |
| `HTTP_PORT` | Puerto HTTP público de Nginx en producción (default `8080`). |

## Rutas

| Ruta | Quién | Pantalla |
| --- | --- | --- |
| `/login` | Pública | Inicio de sesión |
| `/` | `owner`, `trainer` | Dashboard |
| `/clients` | `owner`, `trainer` | Listado de clientes |
| `/clients/:id` | Autenticados | Ficha de un cliente |
| `/routines` | `owner`, `trainer` | Rutinas |
| `/exercises` | `owner`, `trainer` | Catálogo de ejercicios |
| `/progress` | `owner`, `trainer` | Progreso global |
| `/settings` | `owner`, `trainer` | Ajustes |
| `/me` | Autenticados | Perfil del usuario (cliente) |
| `/my-routine` | `client`, `guest` | Rutina del cliente |
| `/my-routine/progress` | `client`, `guest` | Progreso personal |

## Cliente HTTP

`src/lib/api.ts` concentra Axios y los recursos REST:

- `authAPI` — `/token/`, `/token/refresh/`, `/user-profile/`
- `clientsAPI` — clientes, `/clients/me/`, foto de perfil, goals/progress/routines
- `exercisesAPI`, `routinesAPI`, `workoutsAPI`, `workoutSetsAPI`
- `clientRoutinesAPI` — asignación y `complete_workout`
- `goalsAPI`, `progressMetricsAPI`, `routineProgressAPI`

TanStack Query consume esos `*API` desde hooks de dominio (`src/hooks/useClients.ts`, `useRoutines.ts`, etc.). Zustand guarda la sesión en `src/stores/auth.store.ts`. `useDebounce` vive en `src/hooks/useDebounce.ts`.

Documentación adicional:

- [docs/API_SETUP.md](docs/API_SETUP.md)
- [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)
- [docs/desarrollar-features.md](docs/desarrollar-features.md) — cómo desarrollar cualquier feature (API, hooks, rutas, RBAC)
- [docs/RBAC.md](docs/RBAC.md)
- [docs/CLIENT_CREATOR_INTEGRATION.md](docs/CLIENT_CREATOR_INTEGRATION.md)
- [docs/FORMIK_YUP_INTEGRATION.md](docs/FORMIK_YUP_INTEGRATION.md)
- [docs/swagger.json](docs/swagger.json)

## Docker

Compose carga el `.env` de la raíz. El `Dockerfile` es multi-stage: `deps` (Bun) → `dev` (Vite) / `build` (assets) → `prod` (Nginx). Las variables `VITE_*` se incrustan en el build; hay que pasarlas como build args (Compose lo hace desde el `.env`).

`VITE_API_URL` debe ser una URL que el **navegador** pueda abrir (no un hostname interno como `backend`).

### Producción (Nginx)

```bash
docker compose up -d --build
# http://localhost:8080
```

Para redeployar (reconstruye la imagen y recrea el contenedor):

```bash
docker compose up -d --build --force-recreate --remove-orphans
```

Para parar:

```bash
docker compose down
```

La API y el nombre de la app se toman del `.env`. Ejemplo:

```bash
VITE_API_URL=https://api.tudominio.com/api HTTP_PORT=8080 docker compose up -d --build
```

### Desarrollo (Vite + HMR)

```bash
docker compose --profile dev up --build
# http://localhost:5173
```

El bind mount y `CHOKIDAR_USEPOLLING` permiten hot-reload en Docker Desktop.

### Notas

- **Imágenes:** Compose nombra y recrea las imágenes. No hay tags fijos ni script de deploy.
- **Bun en Docker:** `oven/bun:1.3.10-slim` con `--network-concurrency=8 --backend=copyfile` (el install por defecto suele colgarse en overlayfs).
- **Nginx:** SPA con fallback a `index.html`, gzip, headers de seguridad y caché larga para assets hasheados.
- **Healthcheck:** `http://127.0.0.1/` en la imagen `prod`.

## Estructura

```
gym-now/
├── Dockerfile
├── docker-compose.yml
├── env.example
├── nginx.conf
├── package.json
├── docs/
│   ├── API_SETUP.md
│   ├── API_INTEGRATION.md
│   ├── CLIENT_CREATOR_INTEGRATION.md
│   ├── FORMIK_YUP_INTEGRATION.md
│   └── swagger.json
└── src/
    ├── App.tsx                 # Rutas y QueryClientProvider
    ├── main.tsx
    ├── definitions.ts          # Días, suscripciones, helpers de dominio
    ├── components/
    │   ├── Layout.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── AuthSessionSync.tsx
    │   ├── ClientCreator.tsx
    │   ├── RoutineEditor.tsx
    │   ├── ExerciseSelector.tsx
    │   ├── ProgressChart.tsx
    │   ├── MetricSelector.tsx
    │   ├── ProfileImageUploadModal.tsx
    │   └── ui/                 # Button, Card, Input, Avatar, …
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useDebounce.ts
    │   ├── useClients.ts
    │   ├── useRoutines.ts
    │   ├── useExercises.ts
    │   ├── useClientRoutines.ts
    │   └── useProgress.ts
    ├── stores/
    │   └── auth.store.ts
    ├── lib/
    │   ├── api.ts              # Axios + recursos REST
    │   ├── query-client.ts
    │   ├── query-keys.ts
    │   └── utils.ts
    ├── pages/
    │   ├── lazy.ts             # Code splitting por ruta
    │   ├── Login.tsx
    │   ├── Dashboard.tsx
    │   ├── Clients.tsx
    │   ├── ClientDetail.tsx
    │   ├── Routines.tsx
    │   ├── Exercises.tsx
    │   ├── GlobalProgress.tsx
    │   ├── Progress.tsx
    │   └── Settings.tsx
    └── lib/
        └── api.ts
```

## Licencia

Proyecto privado (`"private": true` en `package.json`).
