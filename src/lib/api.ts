import axios from 'axios'

// Configuración base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
    const originalRequest = error.config

    // Manejar errores de autenticación
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await api.post('/token/refresh/', {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('token', access)
          
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Si el refresh token también expiró, redirigir a login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    
    // Manejar errores de red
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout de la petición')
    }
    
    return Promise.reject(error)
  }
)

// Tipos basados en el swagger
export interface Client {
  id: number
  name: string
  email: string
  phone: string
  birth_date?: string
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

export interface Exercise {
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
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: 'strength' | 'cardio' | 'flexibility' | 'mixed'
}

export interface Routine {
  id: number
  workouts: Workout[]
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'custom'
  days_per_week: number
  duration: number
  scheduled_days?: any
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
  assigned_days: any
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
  category: 'weight' | 'strength' | 'endurance' | 'flexibility' | 'custom'
}

export interface ProgressMetrics {
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

export interface RoutineProgress {
  id: number
  client_routine: ClientRoutine
  client_routine_id: number
  workout: Workout
  workout_id: number
  completed_at: string
  notes?: string
  rating?: number
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
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await api.post<{ access: string }>('/token/refresh/', {
      refresh: refreshToken
    })
    return {
      success: true,
      data: {
        token: response.data.access
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
    const response = await api.get<Routine[]>(`/clients/${clientId}/routines/`)
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
  getAll: async (params?: { search?: string; ordering?: string }) => {
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

  create: async (routineData: Partial<Routine>) => {
    const response = await api.post<Routine>('/routines/', routineData)
    return response.data
  },

  update: async (id: number, routineData: Partial<Routine>) => {
    const response = await api.put<Routine>(`/routines/${id}/`, routineData)
    return response.data
  },

  patch: async (id: number, routineData: Partial<Routine>) => {
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
    const response = await api.get<ClientRoutine[]>('/client-routines/', { params })
    return response.data
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
  completeWorkout: async (id: number, data: any) => {
    const response = await api.post<ClientRoutine>(`/client-routines/${id}/complete_workout/`, data)
    return response.data
  },

  getProgress: async (id: number) => {
    const response = await api.get<ClientRoutine>(`/client-routines/${id}/progress/`)
    return response.data
  },

  getByClientId: async (clientId: number) => {
    const response = await api.get<ClientRoutine[]>(`/client-routines/?client_id=${clientId}`)
    return response.data
  },
}

// Funciones para objetivos
export const goalsAPI = {
  getAll: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get<Goal[]>('/goals/', { params })
    return response.data
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

  updateProgress: async (id: number, data: any) => {
    const response = await api.post<Goal>(`/goals/${id}/update_progress/`, data)
    return response.data
  },
}

// Funciones para métricas de progreso
export const progressMetricsAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<ProgressMetrics[]>('/progress-metrics/', { params })
    return response.data
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
  getClientProgress: async (params?: { ordering?: string }) => {
    const response = await api.get<ProgressMetrics[]>('/progress-metrics/client_progress/', { params })
    return response.data
  },
}

// Funciones para progreso de rutinas
export const routineProgressAPI = {
  getAll: async (params?: { ordering?: string }) => {
    const response = await api.get<RoutineProgress[]>('/routine-progress/', { params })
    return response.data
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

  create: async (workoutData: any) => {
    const response = await api.post<Workout>('/workouts/', workoutData)
    return response.data
  },

  update: async (id: number, workoutData: any) => {
    const response = await api.put<Workout>(`/workouts/${id}/`, workoutData)
    return response.data
  },

  patch: async (id: number, workoutData: any) => {
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
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'Ha ocurrido un error inesperado'
}

export default api 