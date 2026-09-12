import type { ComponentType } from 'react'

// ============================================================================
// TIPOS DE SUSCRIPCIÓN
// ============================================================================

export type SubscriptionType = string
export type PlanColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'

export const PLAN_COLORS: Array<{ id: PlanColor; label: string; badge: string; card: string }> = [
  { id: 'blue', label: 'Azul', badge: 'border-blue-200 text-blue-700 bg-blue-50', card: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'purple', label: 'Morado', badge: 'border-purple-200 text-purple-700 bg-purple-50', card: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'green', label: 'Verde', badge: 'border-green-200 text-green-700 bg-green-50', card: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'orange', label: 'Naranja', badge: 'border-orange-200 text-orange-700 bg-orange-50', card: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'red', label: 'Rojo', badge: 'border-red-200 text-red-700 bg-red-50', card: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'gray', label: 'Gris', badge: 'border-gray-200 text-gray-700 bg-gray-50', card: 'bg-gray-50 text-gray-700 border-gray-200' },
]

export const SUBSCRIPTION_TYPES: Array<{
  id: SubscriptionType
  name: string
  price: number
  features: string[]
  color: string
}> = [
  {
    id: 'standard',
    name: 'Estándar',
    price: 199000,
    features: ['Acceso básico', '2 rutinas', 'Seguimiento básico'],
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299000,
    features: ['Acceso completo', 'Rutinas ilimitadas', 'Seguimiento avanzado', 'Consultas prioritarias'],
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'personalized',
    name: 'Personalizada',
    price: 399000,
    features: ['Todo de Premium', 'Rutinas personalizadas', 'Sesiones 1:1', 'Nutrición incluida'],
    color: 'bg-green-50 text-green-700 border-green-200'
  }
]

// ============================================================================
// METAS DE ENTRENAMIENTO
// ============================================================================

export const AVAILABLE_GOALS: string[] = [
  'Perder peso',
  'Ganar masa muscular',
  'Mejorar resistencia',
  'Aumentar fuerza',
  'Mejorar flexibilidad',
  'Mantener peso',
  'Reducir estrés',
  'Mejorar postura'
]

// ============================================================================
// DÍAS DE LA SEMANA
// ============================================================================

export const DAYS_OF_WEEK: Array<{
  key: string
  label: string
  short: string
}> = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
]

export const DAYS_ARRAY: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// ============================================================================
// ESTADOS DE SUSCRIPCIÓN
// ============================================================================

export type SubscriptionStatus = 'active' | 'expired' | 'critical' | 'warning' | 'halfway'

export interface SubscriptionStatusInfo {
  status: SubscriptionStatus
  days: number
  progress: number
}

// ============================================================================
// CATEGORÍAS DE EJERCICIOS
// ============================================================================

export const EXERCISE_CATEGORIES: Array<{
  id: string
  name: string
  color: 'default' | 'destructive' | 'success' | 'secondary'
}> = [
  { id: 'all', name: 'Todos', color: 'default' },
  { id: 'strength', name: 'Fuerza', color: 'default' },
  { id: 'cardio', name: 'Cardio', color: 'destructive' },
  { id: 'flexibility', name: 'Flexibilidad', color: 'success' },
  { id: 'core', name: 'Core', color: 'secondary' }
]

// ============================================================================
// NIVELES DE DIFICULTAD
// ============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export const DIFFICULTY_COLORS: Record<DifficultyLevel, 'success' | 'warning' | 'destructive'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive'
}

// ============================================================================
// OPCIONES DE FILTRO PARA CLIENTES
// ============================================================================

export interface FilterOption {
  id: string
  label: string
  count: number
  icon: ComponentType<{ className?: string }>
}

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/** Interpreta `YYYY-MM-DD` como fecha local para no correr el día por UTC. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

/** True si `subscription_end` es un día anterior a hoy (la fecha de fin sigue vigente). */
export function isSubscriptionExpired(endDate?: string | null): boolean {
  if (!endDate) return false
  const end = parseLocalDate(endDate)
  if (!end) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return end < today
}

export const getSubscriptionStatus = (startDate: string, endDate: string): SubscriptionStatusInfo => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  
  const totalDuration = end.getTime() - start.getTime()
  const elapsed = today.getTime() - start.getTime()
  const progress = elapsed / totalDuration
  
  const daysUntilExpiration = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiration < 0) {
    return { status: 'expired', days: daysUntilExpiration, progress }
  } else if (daysUntilExpiration <= 7) {
    return { status: 'critical', days: daysUntilExpiration, progress }
  } else if (daysUntilExpiration <= 30) {
    return { status: 'warning', days: daysUntilExpiration, progress }
  } else if (progress > 0.5) {
    return { status: 'halfway', days: daysUntilExpiration, progress }
  } else {
    return { status: 'active', days: daysUntilExpiration, progress }
  }
}

export const getSubscriptionHighlightClass = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'expired':
    case 'critical':
      return 'bg-red-50 border-red-200'
    case 'warning':
    case 'halfway':
      return 'bg-yellow-50 border-yellow-200'
    default:
      return ''
  }
}

export const getPlanColorClass = (color?: string, variant: 'badge' | 'card' = 'badge'): string => {
  const found = PLAN_COLORS.find((item) => item.id === color)
  if (found) return variant === 'card' ? found.card : found.badge
  return variant === 'card'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'border-blue-200 text-blue-700 bg-blue-50'
}

export const getSubscriptionColor = (type: SubscriptionType): string => {
  switch (type) {
    case 'premium': 
      return 'border-purple-200 text-purple-700 bg-purple-50'
    case 'personalized': 
      return 'border-green-200 text-green-700 bg-green-50'
    default: 
      return 'border-blue-200 text-blue-700 bg-blue-50'
  }
}

export const getSubscriptionName = (type: SubscriptionType): string => {
  switch (type) {
    case 'premium': 
      return 'Premium'
    case 'personalized': 
      return 'Personalizada'
    case 'standard':
      return 'Estándar'
    default: 
      return type
  }
}

export const getCurrentDayOfWeek = (): string => {
  return DAYS_ARRAY[new Date().getDay()]
}

export const getDifficultyColor = (difficulty: DifficultyLevel): 'success' | 'warning' | 'destructive' | 'secondary' => {
  return DIFFICULTY_COLORS[difficulty] || 'secondary'
}

// ============================================================================
// FUNCIONES PARA EJERCICIOS
// ============================================================================

export const getExerciseIcon = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase()
  if (name.includes('sentadilla') || name.includes('squat')) return '🏋️'
  if (name.includes('press') || name.includes('bench')) return '💪'
  if (name.includes('peso muerto') || name.includes('deadlift')) return '🏋️'
  if (name.includes('flexion') || name.includes('push-up')) return '🤸'
  if (name.includes('plancha') || name.includes('plank')) return '🧘'
  if (name.includes('cardio') || name.includes('correr')) return '🏃'
  if (name.includes('estiramiento') || name.includes('stretch')) return '🧘'
  return '🏋️' // Default icon
}

export const getExerciseColor = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase()
  if (name.includes('sentadilla') || name.includes('squat') || name.includes('peso muerto')) {
    return 'from-blue-100 to-blue-200 border-blue-200 text-blue-600'
  }
  if (name.includes('press') || name.includes('bench') || name.includes('flexion')) {
    return 'from-red-100 to-red-200 border-red-200 text-red-600'
  }
  if (name.includes('plancha') || name.includes('core')) {
    return 'from-green-100 to-green-200 border-green-200 text-green-600'
  }
  if (name.includes('cardio') || name.includes('correr')) {
    return 'from-purple-100 to-purple-200 border-purple-200 text-purple-600'
  }
  return 'from-primary-100 to-primary-200 border-primary-200 text-primary-600'
}

// ============================================================================
// FUNCIONES DE FORMATEO
// ============================================================================

export const formatSelectedDays = (days: string[]): string => {
  if (days.length === 0) return 'No asignado'
  if (days.length === 1) return DAYS_OF_WEEK.find(d => d.key === days[0])?.label || days[0]
  if (days.length === 7) return 'Todos los días'
  return days.map(day => DAYS_OF_WEEK.find(d => d.key === day)?.short || day).join(', ')
}

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

export const DEFAULT_EXERCISE_SET = {
  sets: 3,
  reps: 12,
  weight: 0,
  restTime: 60
}

export const DEFAULT_RENEWAL_MONTHS = 6 