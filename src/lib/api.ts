import axios, { isAxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { UserRole } from './rbac'

const AUTH_STORAGE_KEYS = ['token', 'refreshToken', 'username', 'user'] as const

export function clearAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

type SessionExpiredHandler = () => void
let onSessionExpired: SessionExpiredHandler | null = null

export function setOnSessionExpired(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler
}

function expireSession() {
  clearAuthStorage()
  if (onSessionExpired) {
    onSessionExpired()
    return
  }
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

function isAuthEndpoint(url?: string) {
  return typeof url === 'string' && url.includes('/token/')
}

// Configuración base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  // Usar axios directo para no reentrar al interceptor de 401
  const response = await axios.post<{ access: string }>(
    `${api.defaults.baseURL}/token/refresh/`,
    { refresh: refreshToken },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const access = response.data.access
  localStorage.setItem('token', access)
  return access
}

function getRefreshedAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    // Login y refresh no deben disparar otro intento de renovación
    if (error.response?.status === 401 && originalRequest && !isAuthEndpoint(originalRequest.url)) {
      if (originalRequest._retry || !localStorage.getItem('refreshToken')) {
        expireSession()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const access = await getRefreshedAccessToken()
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch {
        expireSession()
        return Promise.reject(error)
      }
    }

    // Manejar errores de red
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout de la petición')
    }

    return Promise.reject(error)
  }
)

export type SubscriptionType = string
export type PlanColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'

export interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price: number
  duration_days: number
  features: string[]
  color: PlanColor
  is_active: boolean
  subscribers_count: number
}
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutCategory = 'strength' | 'cardio' | 'flexibility' | 'mixed'
export type RoutineFrequency = 'daily' | 'weekly' | 'custom'
export type GoalCategory = 'weight' | 'strength' | 'endurance' | 'flexibility' | 'custom'

export interface BodyMeasurements {
  chest?: number
  waist?: number
  biceps?: number
  forearms?: number
  thighs?: number
  calves?: number
  neck?: number
  shoulders?: number
  hips?: number
}

export interface AssignedRoutineRef {
  id?: number
  routine_id?: number
  routine?: { id: number; name?: string }
  assigned_days?: string[] | Record<string, boolean>
}

export function normalizeAssignedDays(
  days?: string[] | Record<string, boolean>
): string[] {
  if (!days) return []
  if (Array.isArray(days)) return days
  return Object.keys(days).filter((key) => Boolean(days[key]))
}

export function unwrapList<T>(data: T[] | { results?: T[] } | undefined | null): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results
  return []
}

export type AssignedRoutine = Routine | AssignedRoutineRef | number

export function getAssignedRoutineId(routine: AssignedRoutine): number | undefined {
  if (typeof routine === 'number') return routine
  if ('routine' in routine && routine.routine?.id) return routine.routine.id
  if ('routine_id' in routine && routine.routine_id) return routine.routine_id
  if ('id' in routine && typeof routine.id === 'number') return routine.id
  return undefined
}

export interface Client {
  id: number
  name: string
  email: string
  phone: string
  birth_date?: string
  weight: number
  height: number
  goals: Array<string | { title?: string }>
  join_date: string
  profile_image?: string
  subscription_type?: SubscriptionType
  subscription_start?: string
  subscription_end?: string
  plan?: Plan | null
  notes?: string
  emergency_contact?: string
  medical_conditions?: string
  assigned_routines: AssignedRoutine[]
}

export interface Exercise {
  id: number
  name: string
  description: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: Difficulty
  instructions: string[]
  video_url?: string
  image_url?: string
}

export interface WorkoutSet {
  id: number
  exercise: Exercise
  exercise_id: number
  reps: number
  weight: number
  rest_time: number
  completed: boolean
}

export interface Workout {
  id: number
  sets: WorkoutSet[]
  name: string
  description: string
  estimated_duration: number
  difficulty: Difficulty
  category: WorkoutCategory
}

export interface Routine {
  id: number
  workouts: Workout[]
  name: string
  description: string
  frequency: RoutineFrequency
  days_per_week: number
  duration: number
  scheduled_days?: string[]
}

export interface WorkoutSetInput {
  id?: number
  exercise?: number | Exercise
  exercise_id?: number
  reps?: number
  weight?: number
  rest_time?: number
  completed?: boolean
}

export type WorkoutInput = Omit<Workout, 'id' | 'sets'> & {
  id?: number
  sets?: WorkoutSetInput[]
}

export type RoutineInput = Omit<Routine, 'id' | 'workouts'> & {
  id?: number
  workouts?: WorkoutInput[]
  scheduled_days?: string[] | Record<string, boolean>
}

export interface ClientRoutine {
  id: number
  client: Client
  client_id: number
  routine: Routine
  routine_id: number
  start_date: string
  end_date?: string
  is_active: boolean
  assigned_days: string[] | Record<string, boolean>
}

export interface Goal {
  id: number
  client: Client
  client_id: number
  title: string
  description: string
  target_value: number
  current_value: number
  unit: string
  deadline: string
  is_completed: boolean
  category: GoalCategory
}

export interface ProgressMetrics {
  id: number
  client: Client
  client_id: number
  date: string
  weight: number
  body_fat?: number
  muscle_mass?: number
  measurements: BodyMeasurements
  photos?: string[]
}

export interface RoutineProgress {
  id: number
  client_routine: ClientRoutine
  client_routine_id: number
  workout: Workout
  workout_id: number
  started_at?: string | null
  completed_at: string
  notes?: string
  rating?: number
}

export interface CompleteWorkoutInput {
  workout_id: number
  started_at?: string
  notes?: string
  rating?: number
}

export interface ManagedUser {
  id: number
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role: UserRole
  client_id: number | null
  is_last_owner: boolean
  date_joined: string
  last_login?: string | null
}

// Funciones de autenticación
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post<{ access: string; refresh: string }>('/token/', {
      username,
      password,
    })
    return {
      success: true,
      data: {
        token: response.data.access,
        refreshToken: response.data.refresh,
        user: { username }
      }
    }
  },

  logout: async () => {
    // JWT no requiere logout en el servidor, solo limpiar tokens locales
    return { success: true }
  },

  refreshToken: async () => {
    const token = await getRefreshedAccessToken()
    return {
      success: true,
      data: {
        token,
      }
    }
  },

  getUserProfile: async () => {
    const response = await api.get<{
      id: number
      username: string
      email?: string
      first_name?: string
      last_name?: string
      date_joined: string
      last_login?: string
      role: string
    }>('/user-profile/')
    return response.data
  },
}

export const plansAPI = {
  getAll: async (params?: { search?: string; ordering?: string; is_active?: boolean }) => {
    const response = await api.get<
      Plan[] | { count: number; next: string | null; previous: string | null; results: Plan[] }
    >('/plans/', { params })
    const data = response.data
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results
    }
    return data as Plan[]
  },

  getById: async (id: number) => {
    const response = await api.get<Plan>(`/plans/${id}/`)
    return response.data
  },

  create: async (data: Partial<Plan>) => {
    const response = await api.post<Plan>('/plans/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Plan>) => {
    const response = await api.put<Plan>(`/plans/${id}/`, data)
    return response.data
  },

  patch: async (id: number, data: Partial<Plan>) => {
    const response = await api.patch<Plan>(`/plans/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/plans/${id}/`)
  },
}

export const usersAPI = {
  getAll: async (params?: { search?: string; role?: string; ordering?: string }) => {
    const response = await api.get<
      ManagedUser[] | { count: number; next: string | null; previous: string | null; results: ManagedUser[] }
    >('/users/', { params })
    const data = response.data
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results
    }
    return data as ManagedUser[]
  },

  updateRole: async (id: number, role: UserRole) => {
    const response = await api.patch<ManagedUser>(`/users/${id}/`, { role })
    return response.data
  },
}

// Funciones para clientes
export const clientsAPI = {
  getAll: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: Client[] }>('/clients/', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Client>(`/clients/${id}/`)
    return response.data
  },

  create: async (clientData: Partial<Client>) => {
    const response = await api.post<Client>('/clients/', clientData)
    return response.data
  },

  update: async (id: number, clientData: Partial<Client>) => {
    const response = await api.put<Client>(`/clients/${id}/`, clientData)
    return response.data
  },

  patch: async (id: number, clientData: Partial<Client>) => {
    const response = await api.patch<Client>(`/clients/${id}/`, clientData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/clients/${id}/`)
  },

  // Endpoints específicos del cliente
  getGoals: async (clientId: number) => {
    const response = await api.get<Goal[]>(`/clients/${clientId}/goals/`)
    return response.data
  },

  getProgress: async (clientId: number) => {
    const response = await api.get<ProgressMetrics[]>(`/clients/${clientId}/progress/`)
    return response.data
  },

  getRoutines: async (clientId: number) => {
    const response = await api.get<ClientRoutine[]>(`/clients/${clientId}/routines/`)
    return response.data
  },

  // Obtener información del cliente autenticado
  getMe: async () => {
    const response = await api.get<Client>('/clients/me/')
    return response.data
  },

  // Subir imagen de perfil del cliente
  uploadProfileImage: async (clientId: number, file: File) => {
    const formData = new FormData()
    formData.append('profile_image', file)
    
    const response = await api.post<{ profile_image: string; message: string }>(
      `/clients/${clientId}/upload_profile_image/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

// Funciones para ejercicios
export const exercisesAPI = {
  getAll: async (params?: { search?: string; ordering?: string; filter?: string }) => {
    const response = await api.get<Exercise[] | { count: number; next: string | null; previous: string | null; results: Exercise[] }>('/exercises/', { params })
    const data = response.data
    
    // Handle both paginated and non-paginated responses
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results
    }
    
    return data as Exercise[]
  },

  getById: async (id: number) => {
    const response = await api.get<Exercise>(`/exercises/${id}/`)
    return response.data
  },

  create: async (exerciseData: Partial<Exercise>) => {
    const response = await api.post<Exercise>('/exercises/', exerciseData)
    return response.data
  },

  update: async (id: number, exerciseData: Partial<Exercise>) => {
    const response = await api.put<Exercise>(`/exercises/${id}/`, exerciseData)
    return response.data
  },

  patch: async (id: number, exerciseData: Partial<Exercise>) => {
    const response = await api.patch<Exercise>(`/exercises/${id}/`, exerciseData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/exercises/${id}/`)
  },

  // Endpoints específicos de ejercicios
  getByDifficulty: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Exercise[]>('/exercises/by_difficulty/', { params })
    return response.data
  },

  getByMuscleGroup: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Exercise[]>('/exercises/by_muscle_group/', { params })
    return response.data
  },

  uploadImage: async (exerciseId: number, file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post<{ image_url: string; message: string }>(
      `/exercises/${exerciseId}/upload_image/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

// Funciones para rutinas
export const routinesAPI = {
  getAll: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: Routine[] }>('/routines/', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Routine>(`/routines/${id}/`)
    return response.data
  },

  create: async (routineData: Partial<RoutineInput>) => {
    const response = await api.post<Routine>('/routines/', routineData)
    return response.data
  },

  update: async (id: number, routineData: Partial<RoutineInput>) => {
    const response = await api.put<Routine>(`/routines/${id}/`, routineData)
    return response.data
  },

  patch: async (id: number, routineData: Partial<RoutineInput>) => {
    const response = await api.patch<Routine>(`/routines/${id}/`, routineData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/routines/${id}/`)
  },

  // Endpoints específicos de rutinas
  getByFrequency: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Routine[]>('/routines/by_frequency/', { params })
    return response.data
  },

  getWorkouts: async (routineId: number) => {
    const response = await api.get<Workout[]>(`/routines/${routineId}/workouts/`)
    return response.data
  },
}

// Funciones para rutinas de clientes
export const clientRoutinesAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<
      ClientRoutine[] | { results: ClientRoutine[] }
    >('/client-routines/', { params })
    return unwrapList(response.data)
  },

  getById: async (id: number) => {
    const response = await api.get<ClientRoutine>(`/client-routines/${id}/`)
    return response.data
  },

  create: async (clientRoutineData: Partial<ClientRoutine>) => {
    const response = await api.post<ClientRoutine>('/client-routines/', clientRoutineData)
    return response.data
  },

  update: async (id: number, clientRoutineData: Partial<ClientRoutine>) => {
    const response = await api.put<ClientRoutine>(`/client-routines/${id}/`, clientRoutineData)
    return response.data
  },

  patch: async (id: number, clientRoutineData: Partial<ClientRoutine>) => {
    const response = await api.patch<ClientRoutine>(`/client-routines/${id}/`, clientRoutineData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/client-routines/${id}/`)
  },

  // Endpoints específicos de rutinas de clientes
  completeWorkout: async (id: number, data: CompleteWorkoutInput) => {
    const response = await api.post<RoutineProgress>(`/client-routines/${id}/complete_workout/`, data)
    return response.data
  },

  getProgress: async (id: number) => {
    const response = await api.get<RoutineProgress[]>(`/client-routines/${id}/progress/`)
    return response.data
  },

  getByClientId: async (clientId: number) => {
    const response = await api.get<
      ClientRoutine[] | { count: number; next: string | null; previous: string | null; results: ClientRoutine[] }
    >(`/clients/${clientId}/routines/`)
    const data = response.data
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results
    return []
  },
}

// Funciones para objetivos
export const goalsAPI = {
  getAll: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Goal[] | { results: Goal[] }>('/goals/', { params })
    return unwrapList(response.data)
  },

  getById: async (id: number) => {
    const response = await api.get<Goal>(`/goals/${id}/`)
    return response.data
  },

  create: async (goalData: Partial<Goal>) => {
    const response = await api.post<Goal>('/goals/', goalData)
    return response.data
  },

  update: async (id: number, goalData: Partial<Goal>) => {
    const response = await api.put<Goal>(`/goals/${id}/`, goalData)
    return response.data
  },

  patch: async (id: number, goalData: Partial<Goal>) => {
    const response = await api.patch<Goal>(`/goals/${id}/`, goalData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/goals/${id}/`)
  },

  // Endpoints específicos de objetivos
  getCompleted: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Goal[]>('/goals/completed/', { params })
    return response.data
  },

  getPending: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Goal[]>('/goals/pending/', { params })
    return response.data
  },

  updateProgress: async (id: number, data: { current_value?: number; is_completed?: boolean }) => {
    const response = await api.post<Goal>(`/goals/${id}/update_progress/`, data)
    return response.data
  },
}

// Funciones para métricas de progreso
export const progressMetricsAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<
      ProgressMetrics[] | { results: ProgressMetrics[] }
    >('/progress-metrics/', { params })
    return unwrapList(response.data)
  },

  getById: async (id: number) => {
    const response = await api.get<ProgressMetrics>(`/progress-metrics/${id}/`)
    return response.data
  },

  create: async (progressData: Partial<ProgressMetrics>) => {
    const response = await api.post<ProgressMetrics>('/progress-metrics/', progressData)
    return response.data
  },

  update: async (id: number, progressData: Partial<ProgressMetrics>) => {
    const response = await api.put<ProgressMetrics>(`/progress-metrics/${id}/`, progressData)
    return response.data
  },

  patch: async (id: number, progressData: Partial<ProgressMetrics>) => {
    const response = await api.patch<ProgressMetrics>(`/progress-metrics/${id}/`, progressData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/progress-metrics/${id}/`)
  },

  // Endpoints específicos de métricas de progreso
  getClientProgress: async (params?: { ordering?: string; client_id?: number }) => {
    const response = await api.get<ProgressMetrics[]>('/progress-metrics/client_progress/', { params })
    return response.data
  },
}

// Funciones para progreso de rutinas
export const routineProgressAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<
      RoutineProgress[] | { results: RoutineProgress[] }
    >('/routine-progress/', { params })
    return unwrapList(response.data)
  },

  getById: async (id: number) => {
    const response = await api.get<RoutineProgress>(`/routine-progress/${id}/`)
    return response.data
  },

  create: async (progressData: Partial<RoutineProgress>) => {
    const response = await api.post<RoutineProgress>('/routine-progress/', progressData)
    return response.data
  },

  update: async (id: number, progressData: Partial<RoutineProgress>) => {
    const response = await api.put<RoutineProgress>(`/routine-progress/${id}/`, progressData)
    return response.data
  },

  patch: async (id: number, progressData: Partial<RoutineProgress>) => {
    const response = await api.patch<RoutineProgress>(`/routine-progress/${id}/`, progressData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/routine-progress/${id}/`)
  },
}

// Funciones para workouts
export const workoutsAPI = {
  getAll: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Workout[]>('/workouts/', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<Workout>(`/workouts/${id}/`)
    return response.data
  },

  create: async (workoutData: Partial<Workout>) => {
    const response = await api.post<Workout>('/workouts/', workoutData)
    return response.data
  },

  update: async (id: number, workoutData: Partial<Workout>) => {
    const response = await api.put<Workout>(`/workouts/${id}/`, workoutData)
    return response.data
  },

  patch: async (id: number, workoutData: Partial<Workout>) => {
    const response = await api.patch<Workout>(`/workouts/${id}/`, workoutData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/workouts/${id}/`)
  },

  // Endpoints específicos de workouts
  getByCategory: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Workout[]>('/workouts/by_category/', { params })
    return response.data
  },

  getSets: async (workoutId: number) => {
    const response = await api.get<WorkoutSet[]>(`/workouts/${workoutId}/sets/`)
    return response.data
  },
}

// Funciones para sets de workouts
export const workoutSetsAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<WorkoutSet[]>('/workout-sets/', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<WorkoutSet>(`/workout-sets/${id}/`)
    return response.data
  },

  create: async (setData: Partial<WorkoutSet>) => {
    const response = await api.post<WorkoutSet>('/workout-sets/', setData)
    return response.data
  },

  update: async (id: number, setData: Partial<WorkoutSet>) => {
    const response = await api.put<WorkoutSet>(`/workout-sets/${id}/`, setData)
    return response.data
  },

  patch: async (id: number, setData: Partial<WorkoutSet>) => {
    const response = await api.patch<WorkoutSet>(`/workout-sets/${id}/`, setData)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/workout-sets/${id}/`)
  },
}

// Función para manejar errores de la API
function readErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const payload = data as { message?: unknown; error?: unknown; detail?: unknown }
  if (typeof payload.message === 'string') return payload.message
  if (typeof payload.error === 'string') return payload.error
  if (typeof payload.detail === 'string') return payload.detail
  return undefined
}

export const handleApiError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const fromBody = readErrorMessage(error.response?.data)
    if (fromBody) return fromBody
    if (error.message) return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Ha ocurrido un error inesperado'
}

export default api 