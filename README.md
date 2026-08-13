# GymNow - Aplicación de Gestión de Gimnasio

Una aplicación móvil para el seguimiento de rutinas y el avance de clientes en gimnasios, desarrollada con React, TypeScript y Vite.

## 🚀 Características

### 📱 Diseño Mobile-First
- Interfaz optimizada para dispositivos móviles
- Navegación intuitiva con barra inferior
- Componentes responsivos y accesibles

### 👥 Gestión de Clientes
- Perfiles completos de clientes con información personal
- Seguimiento de objetivos y metas
- Historial de progreso y mediciones
- Búsqueda y filtrado de clientes

### 💪 Gestión de Rutinas
- Creación y gestión de rutinas de entrenamiento
- Ejercicios con instrucciones detalladas
- Diferentes niveles de dificultad
- Categorización por tipo de entrenamiento

### 📊 Seguimiento de Progreso
- Métricas de peso, grasa corporal y medidas
- Gráficos de progreso visual
- Comparación de resultados a lo largo del tiempo
- Seguimiento de metas y objetivos

### ⚙️ Configuración
- Perfil de entrenador personalizable
- Configuración de notificaciones
- Preferencias de privacidad y seguridad

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Lucide React
- **State Management**: React Hooks
- **Icons**: Lucide React

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd gym-now
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

## 🐳 Docker

El `Dockerfile` es multi-stage (`deps` → `dev` / `build` → `prod`). Las dependencias se cachean por lockfile y npm usa caché de BuildKit.

### Variables de entorno

Crea un archivo `.env` en la raíz (puedes basarte en `env.example`):

```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Gym Now
VITE_APP_VERSION=1.0.0
PORT=5173        # Puerto del servidor Vite (perfil dev)
HTTP_PORT=8080   # Puerto HTTP expuesto por Nginx (perfil prod)
```

> **Importante:** Vite incrusta las variables `VITE_*` en el JavaScript **en tiempo de build**. En producción no basta con un `environment:` en el contenedor Nginx: hay que pasarlas como **build args**. Además, `VITE_API_URL` debe ser una URL que el **navegador** pueda alcanzar (por ejemplo `http://localhost:8000/api` o `https://api.tudominio.com/api`), no un hostname interno de Docker como `backend`.

### Desarrollo (Vite + HMR)

Ejecuta el frontend con hot-reload dentro de Docker en el puerto configurado (`PORT`, por defecto 5173). El contenedor usa polling de archivos para que el HMR funcione en Docker Desktop:

```bash
docker compose --profile dev up --build
# Abrir: http://localhost:5173  (o el puerto que definas en PORT)
```

Opcionalmente puedes cambiar el puerto:

```bash
export PORT=5174
export VITE_API_URL=http://localhost:8000/api
docker compose --profile dev up --build
# Abrir: http://localhost:5174
```

### Producción (build + Nginx)

Construye y sirve la aplicación con Nginx en `HTTP_PORT` (por defecto 8080). Compose reenvía `VITE_*` del `.env` como build args:

```bash
docker compose --profile prod up --build
# Abrir: http://localhost:8080
```

Para cambiar el puerto público y la URL de la API:

```bash
docker compose --profile prod build \
  --build-arg VITE_API_URL=https://api.tudominio.com/api \
  --build-arg VITE_APP_NAME="Gym Now" \
  --build-arg VITE_APP_VERSION=1.0.0
docker compose --profile prod up
# Abrir: http://localhost:8080  (o HTTP_PORT)
```

### Notas

- **Etapas:** `deps` (npm ci), `dev` (Vite + HMR), `build` (assets estáticos) y `prod` (Nginx sirviendo `/dist`).
- **Nginx:** SPA con fallback a `index.html` (sin caché), gzip, headers de seguridad y caché larga para assets hasheados de Vite.
- **Healthcheck:** el contenedor de producción comprueba `http://127.0.0.1/` y apaga nginx con `SIGQUIT`.
- **`.dockerignore`:** reduce el contexto de build (git, IDE, `node_modules`, `.env`, markdown, compose).

## 🏗️ Estructura del Proyecto

```