# Configuración de API - Gym Now

## 📋 Descripción

Este documento describe la configuración y uso de la API para la aplicación Gym Now, incluyendo la configuración de axios, hooks personalizados y ejemplos de implementación.

## 🚀 Instalación y Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# App Configuration
VITE_APP_NAME=Gym Now
VITE_APP_VERSION=1.0.0
```

### 2. Dependencias Instaladas

```bash
npm install axios
```

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── api.ts              # Configuración de axios y funciones de API
├── hooks/
│   └── useApi.ts           # Hooks personalizados para manejar API
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación actualizado
└── components/
    └── ApiExample.tsx      # Ejemplo de uso de la API
```

## 🔧 Configuración de Axios

### Características Principales

- **Base URL configurable** desde variables de entorno
- **Timeout de 10 segundos** para peticiones
- **Interceptores automáticos** para autenticación
- **Manejo de errores** centralizado
- **Tipos TypeScript** para respuestas

### Interceptores

#### Request Interceptor
- Agrega automáticamente el token de autenticación
- Maneja headers de Content-Type

#### Response Interceptor
- Maneja errores 401 (no autorizado)
- Redirige a login en caso de token expirado
- Maneja timeouts de conexión

## 🎣 Hooks Personalizados

### useApi
Hook básico para peticiones simples.

```typescript
const { data, loading, error, execute, reset } = useApi(apiFunction)
```

### usePaginatedApi
Hook para listas paginadas con funcionalidades adicionales.

```typescript
const {
  data,
  loading,
  error,
  execute,
  loadMore,
  refresh,
  reset
} = usePaginatedApi(apiFunction)
```

### useCrudApi
Hook para operaciones CRUD completas.

```typescript
const {
  data,
  loading,
  error,
  creating,
  updating,
  deleting,
  get,
  create,
  update,
  remove,
  reset
} = useCrudApi(getFn, createFn, updateFn, deleteFn)
```

## 📡 Funciones de API Disponibles

### Autenticación
```typescript
import { authAPI } from '../lib/api'

// Login
const result = await authAPI.login(username, password)

// Logout
await authAPI.logout()

// Refresh token
const result = await authAPI.refreshToken()

// Get profile
const profile = await authAPI.getProfile()
```

### Clientes
```typescript
import { clientsAPI } from '../lib/api'

// Obtener todos los clientes (paginado)
const clients = await clientsAPI.getAll({ page: 1, limit: 10 })

// Obtener cliente por ID
const client = await clientsAPI.getById('client-id')

// Crear cliente
const newClient = await clientsAPI.create(clientData)

// Actualizar cliente
const updatedClient = await clientsAPI.update('client-id', clientData)

// Eliminar cliente
await clientsAPI.delete('client-id')

// Medidas antropométricas
const progress = await clientsAPI.getProgress('client-id')
const newProgress = await clientsAPI.addProgress('client-id', progressData)
```

### Rutinas
```typescript
import { routinesAPI } from '../lib/api'

// Obtener todas las rutinas
const routines = await routinesAPI.getAll()

// Asignar rutina a cliente
await routinesAPI.assignToClient('client-id', 'routine-id')

// Desasignar rutina
await routinesAPI.unassignFromClient('client-id', 'routine-id')
```

### Ejercicios
```typescript
import { exercisesAPI } from '../lib/api'

// Obtener ejercicios con filtros
const exercises = await exercisesAPI.getAll({ 
  muscleGroup: 'pecho',
  search: 'press'
})
```

### Progreso y Estadísticas
```typescript
import { progressAPI } from '../lib/api'

// Estadísticas globales
const stats = await progressAPI.getGlobalStats()

// Progreso de cliente
const clientProgress = await progressAPI.getClientProgress('client-id')

// Historial de entrenamientos
const workouts = await progressAPI.getWorkoutHistory('client-id')
```

### Suscripciones
```typescript
import { subscriptionsAPI } from '../lib/api'

// Renovar suscripción
await subscriptionsAPI.renew('subscription-id', renewalData)

// Cancelar suscripción
await subscriptionsAPI.cancel('subscription-id')
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Lista de Clientes con Paginación

```typescript
import { usePaginatedApi } from '../hooks/useApi'
import { clientsAPI } from '../lib/api'

const ClientList = () => {
  const {
    data: clients,
    loading,
    error,
    execute,
    loadMore,
    refresh
  } = usePaginatedApi(async (params) => {
    const response = await clientsAPI.getAll(params)
    return response.data
  })

  useEffect(() => {
    execute({ page: 1, limit: 10 })
  }, [execute])

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
      <button onClick={loadMore}>Cargar Más</button>
    </div>
  )
}
```

### Ejemplo 2: Crear Cliente

```typescript
import { useApi } from '../hooks/useApi'
import { clientsAPI } from '../lib/api'

const CreateClient = () => {
  const { execute: createClient, loading, error } = useApi(clientsAPI.create)

  const handleSubmit = async (clientData) => {
    const result = await createClient(clientData)
    if (result) {
      // Cliente creado exitosamente
      console.log('Cliente creado:', result)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Cliente'}
      </button>
    </form>
  )
}
```

### Ejemplo 3: Autenticación

```typescript
import { useAuth } from '../contexts/AuthContext'

const LoginForm = () => {
  const { login } = useAuth()

  const handleLogin = async (username, password) => {
    const result = await login(username, password)
    if (result.success) {
      // Login exitoso
      navigate('/dashboard')
    } else {
      // Mostrar error
      setError(result.error)
    }
  }
}
```

## 🛠️ Manejo de Errores

### Función handleApiError

```typescript
import { handleApiError } from '../lib/api'

try {
  const result = await apiFunction()
} catch (error) {
  const errorMessage = handleApiError(error)
  console.error(errorMessage)
}
```

### Tipos de Error

- **401 Unauthorized**: Token expirado o inválido
- **403 Forbidden**: Sin permisos para la operación
- **404 Not Found**: Recurso no encontrado
- **422 Validation Error**: Datos de entrada inválidos
- **500 Server Error**: Error interno del servidor
- **ECONNABORTED**: Timeout de conexión

## 🔒 Autenticación

### Flujo de Autenticación

1. **Login**: Usuario ingresa credenciales
2. **Token**: Servidor devuelve JWT token
3. **Storage**: Token se guarda en localStorage
4. **Requests**: Token se envía automáticamente en headers
5. **Refresh**: Token se renueva automáticamente
6. **Logout**: Token se elimina del storage

### Headers de Autenticación

```typescript
// Automático via interceptor
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

## 📊 Tipos de Respuesta

### ApiResponse
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}
```

### PaginatedResponse
```typescript
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

## 🚀 Próximos Pasos

1. **Implementar API real**: Conectar con backend
2. **Testing**: Agregar tests para hooks y funciones
3. **Caching**: Implementar cache de respuestas
4. **Offline**: Manejo de estado offline
5. **Optimización**: Lazy loading y optimizaciones

## 📝 Notas

- La configuración actual usa datos mock para desarrollo
- Los hooks manejan automáticamente estados de carga y error
- La autenticación se integra con el contexto existente
- Todas las funciones son TypeScript-friendly
- Los interceptores manejan automáticamente la autenticación 