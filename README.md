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

### Variables de entorno

Crea un archivo `.env` en la raíz (puedes basarte en `env.example`):

```
VITE_API_URL=http://localhost:8000/api
PORT=5173        # Puerto del servidor Vite (perfil dev)
HTTP_PORT=8080   # Puerto HTTP expuesto por Nginx (perfil prod)
```

### Desarrollo (Vite + HMR)

Ejecuta el frontend con hot-reload dentro de Docker en el puerto configurado (`PORT`, por defecto 5173):

```bash
docker-compose --profile dev up --build
# Abrir: http://localhost:5173  (o el puerto que definas en PORT)
```

Opcionalmente puedes cambiar el puerto:

```bash
export PORT=5174
export VITE_API_URL=http://localhost:8000/api
docker-compose --profile dev up --build
# Abrir: http://localhost:5174
```

### Producción (build + Nginx)

Construye y sirve la aplicación con Nginx en `HTTP_PORT` (por defecto 8080):

```bash
docker-compose --profile prod up --build
# Abrir: http://localhost:8080
```

Para cambiar el puerto público:

```bash
export HTTP_PORT=9090
export VITE_API_URL=http://backend:8000/api
docker-compose --profile prod up --build
# Abrir: http://localhost:9090
```

Notas:
- El Dockerfile es multi-stage: `dev` (Vite) y `prod` (Nginx sirviendo `/dist`).
- El Nginx está configurado para SPA (fallback a `index.html`).
- `.dockerignore` reduce el contexto de build para imágenes más pequeñas.

## 🏗️ Estructura del Proyecto

```