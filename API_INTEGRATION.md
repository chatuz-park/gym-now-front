# Integración con Backend - Gym Now

## 📋 Resumen de la Integración

Se ha completado la integración con el backend basado en el archivo `docs/swagger.json`. La API está configurada para funcionar con el servidor en `localhost:8000` y utiliza autenticación JWT.

## 🔧 Configuración Realizada

### 1. **URL del Backend**
- **Host**: `localhost:8000`
- **Base Path**: `/api`
- **URL Completa**: `http://localhost:8000/api`

### 2. **Autenticación JWT**
- **Login**: `POST /token/`
- **Refresh**: `POST /token/refresh/`
- **Headers**: `Authorization: Bearer <token>`

### 3. **Endpoints Implementados**

#### Autenticación
```typescript
// Login
POST /token/
{
  "username": "string",
  "password": "string"
}

// Refresh Token
POST /token/refresh/
{
  "refresh": "string"
}
```

#### Clientes
```typescript
// Listar clientes
GET /clients/?search=string&ordering=string

// Obtener cliente por ID
GET /clients/{id}/

// Crear cliente
POST /clients/

// Actualizar cliente
PUT /clients/{id}/
PATCH /clients/{id}/

// Eliminar cliente
DELETE /clients/{id}/

// Endpoints específicos
GET /clients/{id}/goals/
GET /clients/{id}/progress/
GET /clients/{id}/routines/
```

#### Ejercicios
```typescript
// Listar ejercicios
GET /exercises/?search=string&ordering=string

// Obtener por dificultad
GET /exercises/by_difficulty/

// Obtener por grupo muscular
GET /exercises/by_muscle_group/

// CRUD completo
GET /exercises/{id}/
POST /exercises/
PUT /exercises/{id}/
PATCH /exercises/{id}/
DELETE /exercises/{id}/
```

#### Rutinas
```typescript
// Listar rutinas
GET /routines/?search=string&ordering=string

// Obtener por frecuencia
GET /routines/by_frequency/

// Obtener workouts de una rutina
GET /routines/{id}/workouts/

// CRUD completo
GET /routines/{id}/
POST /routines/
PUT /routines/{id}/
PATCH /routines/{id}/
DELETE /routines/{id}/
```

#### Rutinas de Clientes
```typescript
// Listar rutinas de clientes
GET /client-routines/?ordering=string

// Completar workout
POST /client-routines/{id}/complete_workout/

// Obtener progreso
GET /client-routines/{id}/progress/

// CRUD completo
GET /client-routines/{id}/
POST /client-routines/
PUT /client-routines/{id}/
PATCH /client-routines/{id}/
DELETE /client-routines/{id}/
```

#### Objetivos
```typescript
// Listar objetivos
GET /goals/?search=string&ordering=string

// Obtener completados
GET /goals/completed/

// Obtener pendientes
GET /goals/pending/

// Actualizar progreso
POST /goals/{id}/update_progress/

// CRUD completo
GET /goals/{id}/
POST /goals/
PUT /goals/{id}/
PATCH /goals/{id}/
DELETE /goals/{id}/
```

#### Métricas de Progreso
```typescript
// Listar métricas
GET /progress-metrics/?ordering=string

// Progreso de cliente
GET /progress-metrics/client_progress/

// CRUD completo
GET /progress-metrics/{id}/
POST /progress-metrics/
PUT /progress-metrics/{id}/
PATCH /progress-metrics/{id}/
DELETE /progress-metrics/{id}/
```

#### Workouts
```typescript
// Listar workouts
GET /workouts/?search=string&ordering=string

// Obtener por categoría
GET /workouts/by_category/

// Obtener sets de un workout
GET /workouts/{id}/sets/

// CRUD completo
GET /workouts/{id}/
POST /workouts/
PUT /workouts/{id}/
PATCH /workouts/{id}/
DELETE /workouts/{id}/
```

#### Sets de Workouts
```typescript
// Listar sets
GET /workout-sets/?ordering=string

// CRUD completo
GET /workout-sets/{id}/
POST /workout-sets/
PUT /workout-sets/{id}/
PATCH /workout-sets/{id}/
DELETE /workout-sets/{id}/
```

## 🎣 Hooks Personalizados

### useApi
```typescript
const { data, loading, error, execute, reset, setData } = useApi(apiFunction)
```

### usePaginatedApi
```typescript
const { data, loading, error, execute, refresh, reset } = usePaginatedApi(apiFunction)
```

### useCrudApi
```typescript
const { data, loading, error, creating, updating, deleting, get, create, update, remove, reset } = useCrudApi(getFn, createFn, updateFn, deleteFn)
```

## 📊 Tipos TypeScript

### Client
```typescript
interface Client {
  id: number
  name: string
  email: string
  phone: string
  age: number
  weight: number
  height: number
  goals: any
  join_date: string
  profile_image?: string
  subscription_type?: 'standard' | 'premium' | 'personalized'
  subscription_start?: string
  subscription_end?: string
  notes?: string
  emergency_contact?: string
  medical_conditions?: string
  assigned_routines: Routine[]
}
```

### Exercise
```typescript
interface Exercise {
  id: number
  name: string
  description: string
  muscle_groups: any
  equipment: any
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: any
  video_url?: string
  image_url?: string
}
```

### Routine
```typescript
interface Routine {
  id: number
  workouts: Workout[]
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'custom'
  days_per_week: number
  duration: number
  scheduled_days?: any
}
```

### ProgressMetrics
```typescript
interface ProgressMetrics {
  id: number
  client: Client
  client_id: number
  date: string
  weight: number
  body_fat?: number
  muscle_mass?: number
  measurements: any
  photos?: any
}
```

## 🔒 Manejo de Autenticación

### Flujo de Login
1. Usuario ingresa credenciales
2. Se envía petición a `/token/`
3. Se reciben `access` y `refresh` tokens
4. Se guardan en localStorage
5. Se configura el interceptor de axios

### Refresh Automático
- El interceptor detecta errores 401
- Intenta renovar el token con `/token/refresh/`
- Si falla, redirige a login
- Si funciona, repite la petición original

### Logout
- Limpia todos los tokens del localStorage
- No requiere petición al servidor (JWT)

## 🛠️ Ejemplo de Uso

### Cargar Clientes
```typescript
import { usePaginatedApi } from '../hooks/useApi'
import { clientsAPI } from '../lib/api'

const ClientList = () => {
  const {
    data: clients,
    loading,
    error,
    execute,
    refresh
  } = usePaginatedApi(clientsAPI.getAll)

  useEffect(() => {
    execute({ search: '', ordering: 'name' })
  }, [execute])

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  )
}
```

### Crear Cliente
```typescript
import { useApi } from '../hooks/useApi'
import { clientsAPI } from '../lib/api'

const CreateClient = () => {
  const { execute: createClient, loading, error } = useApi(clientsAPI.create)

  const handleSubmit = async (clientData) => {
    const result = await createClient(clientData)
    if (result) {
      console.log('Cliente creado:', result)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Cliente'}
      </button>
    </form>
  )
}
```

### Login
```typescript
import { useAuth } from '../contexts/AuthContext'

const LoginForm = () => {
  const { login } = useAuth()

  const handleLogin = async (username, password) => {
    const result = await login(username, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }
}
```

## 🚀 Variables de Entorno

Crear archivo `.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# Environment
VITE_NODE_ENV=development

# App Configuration
VITE_APP_NAME=Gym Now
VITE_APP_VERSION=1.0.0
```

## 📝 Notas Importantes

### Diferencias con la API Anterior
1. **URL**: Cambió de `localhost:3000` a `localhost:8000`
2. **Autenticación**: JWT en lugar de sesiones
3. **Estructura**: Sin wrapper `ApiResponse`, respuestas directas
4. **Paginación**: No implementada en el backend actual
5. **IDs**: Números en lugar de strings

### Adaptaciones Necesarias
1. **Tipos de datos**: Actualizar interfaces para coincidir con el backend
2. **IDs**: Cambiar de string a number
3. **Campos**: Usar nombres del backend (snake_case)
4. **Paginación**: Implementar si es necesaria
5. **Filtros**: Adaptar a los parámetros disponibles

### Próximos Pasos
1. **Testing**: Probar todos los endpoints
2. **Error Handling**: Mejorar manejo de errores específicos
3. **Caching**: Implementar cache de respuestas
4. **Optimización**: Lazy loading y optimizaciones
5. **UI Updates**: Actualizar componentes para usar datos reales

## 🔍 Debugging

### Verificar Conexión
```typescript
// En la consola del navegador
console.log('API URL:', import.meta.env.VITE_API_URL)
console.log('Token:', localStorage.getItem('token'))
```

### Logs de Red
- Abrir DevTools > Network
- Filtrar por "Fetch/XHR"
- Verificar peticiones a `localhost:8000`

### Errores Comunes
- **CORS**: Verificar configuración del backend
- **401**: Token expirado o inválido
- **404**: Endpoint no encontrado
- **500**: Error interno del servidor 