import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Calendar, Clock, Target, User, Scale, Ruler, CreditCard, ChevronLeft, ChevronRight, Play, Info, Activity, XCircle, Home, Loader2, Edit, LogOut, ChevronDown, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import ClientCreator from '../components/ClientCreator'
import RoutineEditor from '../components/RoutineEditor'
import ProgressChart from '../components/ProgressChart'
import MetricSelector from '../components/MetricSelector'
import ProfileImageUploadModal from '../components/ProfileImageUploadModal'
import { formatDate, calculateAge } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { DAYS_OF_WEEK, getCurrentDayOfWeek, getSubscriptionStatus } from '../definitions'
import { useApi } from '../hooks/useApi'
import { clientsAPI, clientRoutinesAPI } from '../lib/api'
import type { Client, ProgressMetrics } from '../lib/api'

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const currentDayParam = searchParams.get('day')
  const [currentDay, setCurrentDay] = useState(currentDayParam || getCurrentDayOfWeek())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Estado para gráficas de progreso
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'body_fat'])
  const [showProgressChart, setShowProgressChart] = useState(false)
  
  // Estado para modal de subida de foto de perfil
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Detectar si estamos en la ruta /me
  const isMeRoute = location.pathname === '/me'
  
  // Usar el ID de la URL o el ID del cliente autenticado
  const clientId = id || user?.clientId

  // Check if edit modal should be shown
  const isEditModalOpen = searchParams.get('modal') === 'edit-client'
  const isEditRoutinesModalOpen = searchParams.get('modal') === 'edit-routines'

  // Función personalizada para cargar cliente según la ruta
  const loadClientData = async () => {
    try {
      if (isMeRoute) {
        const response = await clientsAPI.getMe()
        return response
      } else if (clientId) {
        return await clientsAPI.getById(parseInt(clientId))
      }
      throw new Error('ID de cliente no válido')
    } catch (error) {
      throw error
    }
  }

  // Hook personalizado para cargar datos del cliente
  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const {
    data: clientProgress,
    execute: loadProgress
  } = useApi<ProgressMetrics[]>(clientsAPI.getProgress)

  const {
    data: clientRoutines,
    loading: routinesLoading,
    error: routinesError,
    execute: loadRoutines
  } = useApi<any>(clientRoutinesAPI.getByClientId)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setClientLoading(true)
        setClientError(null)
        
        // Cargar datos del cliente
        const clientData = await loadClientData()
        setClient(clientData)
        
        // Cargar progreso y rutinas si tenemos un clientId válido
        if (clientData?.id) {
          loadProgress(clientData.id)
          loadRoutines(clientData.id)
        }
      } catch (error: any) {
        setClientError(error.message || 'Error al cargar los datos del cliente')
      } finally {
        setClientLoading(false)
      }
    }

    fetchData()
  }, [clientId, isMeRoute, loadProgress, loadRoutines])

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Función para determinar la ruta de inicio según el rol del usuario
  const getHomeRoute = () => {
    return (user?.role === 'client' || user?.role === 'guest') ? '/me' : '/'
  }

  // Verificar permisos de acceso
  const hasAccess = () => {
    // Owners y entrenadores pueden acceder a cualquier cliente
    if (user?.role === 'owner' || user?.role === 'trainer') {
      return true
    }
    
    // Clientes y guests solo pueden ver su propia información
    if ((user?.role === 'client' || user?.role === 'guest') && user?.clientId === clientId) {
      return true
    }
    
    return false
  }

  if (!hasAccess()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permiso para ver la información de este cliente.</p>
            <Button onClick={() => navigate(getHomeRoute())}>
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar loading mientras se cargan los datos
  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargando cliente...</h2>
            <p className="text-gray-600">Obteniendo información del cliente</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si no se pudo cargar el cliente
  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {clientError ? 'Error al cargar cliente' : 'Cliente no encontrado'}
            </h2>
            <p className="text-gray-600 mb-4">
              {clientError || 'El cliente que buscas no existe'}
            </p>
            <Button onClick={() => navigate(getHomeRoute())}>
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Obtener el progreso más reciente
  const latestProgress = clientProgress && clientProgress.length > 0 ? 
    clientProgress.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null

  // Usar las constantes importadas de definitions.ts
  // Filtrar rutinas duplicadas basándose en el ID de la rutina
  // Handle paginated response from API
  const routinesArray = clientRoutines?.results || clientRoutines || []
  
  const assignedRoutines = routinesArray.filter((routine: any, index: number, self: any[]) => 
    index === self.findIndex((r: any) => r.id === routine.id)
  )
  
  const getRoutineForDay = (day: string) => {
    return assignedRoutines.find((routine: any) => {
      const assignedDays = routine?.assigned_days
      
      // Handle different data types for assigned_days - Fixed for type safety
      if (Array.isArray(assignedDays)) {
        return assignedDays.includes(day)
      } else if (typeof assignedDays === 'string') {
        // If it's a string, it might be JSON or comma-separated
        try {
          const parsed = JSON.parse(assignedDays)
          return Array.isArray(parsed) ? parsed.includes(day) : false
        } catch {
          // If not JSON, try comma-separated
          return assignedDays.split(',').map(d => d.trim()).includes(day)
        }
      }
      
      return false
    })
  }
  
  const currentRoutine = getRoutineForDay(currentDay) as any
  
  const navigateToDay = (day: string) => {
    setCurrentDay(day)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('day', day)
    setSearchParams(newParams)
  }
  
  const navigateToPreviousDay = () => {
    const currentIndex = DAYS_OF_WEEK.findIndex(d => d.key === currentDay)
    const previousIndex = currentIndex === 0 ? DAYS_OF_WEEK.length - 1 : currentIndex - 1
    navigateToDay(DAYS_OF_WEEK[previousIndex].key)
  }
  
  const navigateToNextDay = () => {
    const currentIndex = DAYS_OF_WEEK.findIndex(d => d.key === currentDay)
    const nextIndex = currentIndex === DAYS_OF_WEEK.length - 1 ? 0 : currentIndex + 1
    navigateToDay(DAYS_OF_WEEK[nextIndex].key)
  }
  
  const subscriptionStatus = client.subscription_start && client.subscription_end ? 
    getSubscriptionStatus(client.subscription_start, client.subscription_end) : null

  const handleCloseEditModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
  }

  // Funciones para manejar gráficas de progreso
  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  const handleSelectAllMetrics = () => {
    setSelectedMetrics([
      'weight', 'body_fat', 'muscle_mass', 'chest', 'waist', 'biceps', 
      'forearms', 'thighs', 'calves', 'neck', 'shoulders', 'hips'
    ])
  }

  const handleClearAllMetrics = () => {
    setSelectedMetrics([])
  }

  // Función para preparar datos para la gráfica
  const prepareChartData = () => {
    if (!clientProgress || clientProgress.length === 0) return []
    
    return clientProgress
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(progress => ({
        date: progress.date,
        weight: progress.weight,
        body_fat: progress.body_fat,
        muscle_mass: progress.muscle_mass,
        chest: progress.measurements?.chest,
        waist: progress.measurements?.waist,
        biceps: progress.measurements?.biceps,
        forearms: progress.measurements?.forearms,
        thighs: progress.measurements?.thighs,
        calves: progress.measurements?.calves,
        neck: progress.measurements?.neck,
        shoulders: progress.measurements?.shoulders,
        hips: progress.measurements?.hips
      }))
  }

  const handleSaveClient = async (clientData: any) => {
    try {
      if (clientId) {
        await clientsAPI.update(parseInt(clientId), clientData)
        // Recargar los datos del cliente
        const updatedClient = await loadClientData()
        setClient(updatedClient)
      }
      handleCloseEditModal()
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header independiente */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.role === 'client' ? 'Mi Rutina' : `Cliente: ${client?.name || 'Cargando...'}`}
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.role === 'client' ? 'Detalle de mi información y rutinas' : 'Información del cliente y rutinas asignadas'}
                </p>
              </div>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={user?.role === 'client' ? client.profile_image : undefined} 
                    alt={user?.role === 'client' ? client.name : user?.name || ''} 
                  />
                  <AvatarFallback>
                    {user?.role === 'client' 
                      ? client.name.split(' ').map(n => n[0]).join('')
                      : user?.name?.split(' ').map(n => n[0]).join('') || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Menú desplegable */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Mi Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (isMeRoute || user?.role === 'client') {
                        setIsUploadModalOpen(true)
                      }
                    }}
                    className="relative group"
                    type="button"
                  >
                    <Avatar className={`w-16 h-16 ${(isMeRoute || user?.role === 'client') ? 'cursor-pointer ring-2 ring-transparent group-hover:ring-primary-500' : ''} transition-all`}>
                      <AvatarImage src={client.profile_image} alt={client.name} />
                      <AvatarFallback>
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {(isMeRoute || user?.role === 'client') && (
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Cambiar
                        </span>
                      </div>
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-gray-600">{client.email}</p>
                    {client.phone && (
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {client.birth_date && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Edad</p>
                        <p className="text-lg font-semibold">
                          {calculateAge(client.birth_date)} años
                        </p>
                      </div>
                    </div>
                  )}
                  {client.weight > 0 && (
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Peso</p>
                        <p className="text-lg font-semibold">{client.weight} kg</p>
                      </div>
                    </div>
                  )}
                  {client.height > 0 && (
                    <div className="flex items-center space-x-2">
                      <Ruler className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Altura</p>
                        <p className="text-lg font-semibold">{client.height} cm</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                                          <div>
                        <p className="text-sm font-medium">Miembro desde</p>
                        <p className="text-lg font-semibold">{formatDate(new Date(client.join_date))}</p>
                      </div>
                  </div>
                </div>
                {client.goals && Array.isArray(client.goals) && client.goals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Mis Metas de Entrenamiento</p>
                    <div className="flex flex-wrap gap-2">
                      {client.goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {typeof goal === 'string' ? goal : goal.title || 'Meta'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Sección de Medidas Antropométricas */}
            {latestProgress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Ruler className="w-5 h-5" />
                    <span>Mis Medidas Antropométricas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Última actualización: {formatDate(new Date(latestProgress.date))}</p>
                  </div>
                  
                  {/* Medidas principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Peso</p>
                        <p className="text-lg font-semibold">{latestProgress.weight} kg</p>
                      </div>
                    </div>
                    {latestProgress.body_fat && (
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Grasa Corporal</p>
                          <p className="text-lg font-semibold">{latestProgress.body_fat}%</p>
                        </div>
                      </div>
                    )}
                    {latestProgress.muscle_mass && (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Masa Muscular</p>
                          <p className="text-lg font-semibold">{latestProgress.muscle_mass} kg</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Medidas corporales */}
                  {latestProgress.measurements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Medidas Corporales (cm)</h4>
                      <div className="grid grid-cols-2 gap-3">
                                                 {Object.entries(latestProgress.measurements).map(([key, value]) => (
                           <div key={key} className="bg-gray-50 p-3 rounded-lg">
                             <p className="text-sm font-medium text-gray-600 capitalize">
                               {key.replace('_', ' ')}
                             </p>
                             <p className="text-lg font-semibold">{String(value)} cm</p>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {/* Botón para mostrar gráficas de progreso */}
                  {clientProgress && clientProgress.length > 1 && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => setShowProgressChart(!showProgressChart)}
                        variant="outline"
                        className="w-full"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {showProgressChart ? 'Ocultar Gráfica' : 'Ver Gráfica de Progreso'}
                      </Button>
                    </div>
                  )}

                  {/* Botón para ver historial */}
                  {clientProgress && clientProgress.length > 1 && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/my-routine/progress`)}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Ver Historial de Medidas
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {client.subscription_type && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Mi Suscripción</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {client.subscription_type === 'premium' ? 'Premium' : 
                       client.subscription_type === 'personalized' ? 'Personalizada' : 'Estándar'}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        client.subscription_type === 'premium' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        client.subscription_type === 'personalized' ? 'border-green-200 text-green-700 bg-green-50' :
                        'border-blue-200 text-blue-700 bg-blue-50'
                      }
                    >
                      {client.subscription_type}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {client.subscription_start && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Inicio:</span>
                        <span>{client.subscription_start}</span>
                      </div>
                    )}
                    {client.subscription_end && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fin:</span>
                        <span>{client.subscription_end}</span>
                      </div>
                    )}
                  </div>
                  {subscriptionStatus && (
                    <div className={`p-3 rounded-lg border ${
                      subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : subscriptionStatus.status === 'warning' || subscriptionStatus.status === 'halfway'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {subscriptionStatus.status === 'expired' ? 'Suscripción vencida' :
                           subscriptionStatus.status === 'critical' ? 'Vence pronto' :
                           subscriptionStatus.status === 'warning' ? 'Atención' :
                           subscriptionStatus.status === 'halfway' ? 'Más de 50% completada' :
                           'Activa'}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={
                            subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'critical'
                              ? 'border-red-300 text-red-700 bg-red-100'
                              : subscriptionStatus.status === 'warning' || subscriptionStatus.status === 'halfway'
                              ? 'border-yellow-300 text-yellow-700 bg-yellow-100'
                              : 'border-green-300 text-green-700 bg-green-100'
                          }
                        >
                          {subscriptionStatus.status === 'expired' 
                            ? 'Vencida' 
                            : subscriptionStatus.status === 'critical'
                            ? `${subscriptionStatus.days} días`
                            : subscriptionStatus.status === 'warning'
                            ? `${subscriptionStatus.days} días`
                            : subscriptionStatus.status === 'halfway'
                            ? 'Más de 50%'
                            : 'Activa'
                          }
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Información Adicional */}
            {(client.notes || client.emergency_contact || client.medical_conditions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="w-5 h-5" />
                    <span>Información Adicional</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.emergency_contact && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Contacto de Emergencia</p>
                      <p className="text-sm">{client.emergency_contact}</p>
                    </div>
                  )}
                  {client.medical_conditions && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Condiciones Médicas</p>
                      <p className="text-sm">{client.medical_conditions}</p>
                    </div>
                  )}
                  {client.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Notas</p>
                      <p className="text-sm">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Sección de Gráficas de Progreso */}
            {showProgressChart && clientProgress && clientProgress.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Mi Progreso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selector de métricas */}
                  <MetricSelector
                    selectedMetrics={selectedMetrics}
                    onMetricToggle={handleMetricToggle}
                    onSelectAll={handleSelectAllMetrics}
                    onClearAll={handleClearAllMetrics}
                  />
                  
                  {/* Gráfica de progreso */}
                  {selectedMetrics.length > 0 && (
                    <ProgressChart
                      data={prepareChartData()}
                      selectedMetrics={selectedMetrics}
                      title="Evolución de Medidas"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navegación de días */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Navegación de Días</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={navigateToPreviousDay}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      {DAYS_OF_WEEK.find(d => d.key === currentDay)?.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentRoutine ? `${currentRoutine.name} programada` : 'Sin rutina programada'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={navigateToNextDay}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const hasRoutine = getRoutineForDay(day.key)
                    const isCurrentDay = currentDay === day.key
                    return (
                      <button
                        key={day.key}
                        onClick={() => navigateToDay(day.key)}
                        className={`p-3 rounded-lg border transition-all ${
                          isCurrentDay
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : hasRoutine
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-xs font-medium">{day.short}</p>
                          {hasRoutine && (
                            <div className="w-2 h-2 bg-current rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    Mi Rutina para {DAYS_OF_WEEK.find(d => d.key === currentDay)?.label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRoutine ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">{currentRoutine.routine?.name}</h4>
                      <p className="text-gray-600 mb-3">{currentRoutine.routine?.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{currentRoutine.routine?.duration} semanas</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{currentRoutine.routine?.days_per_week} días/semana</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-semibold">Mis Entrenamientos del día:</h5>
                      {currentRoutine.routine?.workouts?.map((workout: any) => (
                        <Card key={workout.id} className="border-l-4 border-l-primary-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h6 className="font-semibold">{workout.name}</h6>
                                <p className="text-sm text-gray-600">{workout.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {workout.estimated_duration} min
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    workout.difficulty === 'beginner' ? 'border-green-200 text-green-700 bg-green-50' :
                                    workout.difficulty === 'intermediate' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                    'border-red-200 text-red-700 bg-red-50'
                                  }`}
                                >
                                  {workout.difficulty === 'beginner' ? 'Principiante' :
                                   workout.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {workout.sets.map((exerciseSet: any) => {
                                const exercise = exerciseSet.exercise
                                return (
                                  <div key={exerciseSet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-medium">{exercise?.name}</p>
                                      <p className="text-sm text-gray-600">{exercise?.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm">
                                      <div className="text-center">
                                        <p className="font-medium">{exerciseSet.reps}</p>
                                        <p className="text-gray-500">Reps</p>
                                      </div>
                                      {exerciseSet.weight > 0 && (
                                        <div className="text-center">
                                          <p className="font-medium">{exerciseSet.weight}kg</p>
                                          <p className="text-gray-500">Peso</p>
                                        </div>
                                      )}
                                      <div className="text-center">
                                        <p className="font-medium">{exerciseSet.rest_time}s</p>
                                        <p className="text-gray-500">Descanso</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex space-x-2 mt-4">
                              <Button className="flex-1 bg-primary-600 hover:bg-primary-700">
                                <Play className="w-4 h-4 mr-2" />
                                Iniciar Entrenamiento
                              </Button>
                              <Button variant="outline" className="flex-1">
                                <Activity className="w-4 h-4 mr-2" />
                                Ver Progreso
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Sin rutina programada</h4>
                    <p className="text-gray-600 mb-4">
                      No hay rutina asignada para {DAYS_OF_WEEK.find(d => d.key === currentDay)?.label}
                    </p>
                    <Button variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Asignar Rutina
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Mis Rutinas Asignadas</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.set('modal', 'edit-routines')
                      setSearchParams(newParams)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Rutinas
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routinesLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 text-primary-600 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-gray-600">Cargando rutinas...</p>
                  </div>
                ) : routinesError ? (
                  <div className="text-center py-4">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">Error al cargar rutinas: {routinesError}</p>
                  </div>
                ) : assignedRoutines.length > 0 ? (
                  <div className="space-y-3">
                    {assignedRoutines.map((routine: any) => (
                      <div key={routine?.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h6 className="font-medium">{routine?.routine?.name}</h6>
                          <p className="text-sm text-gray-600">{routine?.routine?.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{routine?.routine?.days_per_week} días/semana</span>
                            <span>•</span>
                            <span>{routine?.routine?.duration} semanas</span>
                            <span>•</span>
                            <span>{routine?.routine?.workouts?.length || 0} entrenamientos</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const assignedDays = routine?.assigned_days
                            let daysArray: string[] = []
                            
                            if (Array.isArray(assignedDays)) {
                              daysArray = assignedDays
                            } else if (typeof assignedDays === 'string') {
                              try {
                                const parsed = JSON.parse(assignedDays)
                                daysArray = Array.isArray(parsed) ? parsed : []
                              } catch {
                                daysArray = assignedDays.split(',').map(d => d.trim())
                              }
                            }
                            
                            return daysArray.map((day: string) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {DAYS_OF_WEEK.find(d => d.key === day)?.short}
                              </Badge>
                            ))
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No hay rutinas asignadas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <ClientCreator
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveClient}
          clientToEdit={client}
          clientId={clientId}
        />
      )}

      {/* Edit Routines Modal */}
      {isEditRoutinesModalOpen && clientId && (
        <RoutineEditor
          isOpen={isEditRoutinesModalOpen}
          onClose={handleCloseEditModal}
          clientId={clientId}
          onRoutinesUpdated={() => {
            // Recargar las rutinas del cliente
            loadRoutines(parseInt(clientId.toString()))
          }}
        />
      )}

      {/* Modal para subir foto de perfil - Solo visible si es la ruta /me o si el usuario es cliente */}
      {client && client.id && (isMeRoute || user?.role === 'client') && isUploadModalOpen && (
        <ProfileImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          clientId={client.id}
          currentImageUrl={client.profile_image}
          clientName={client.name}
          onUploadSuccess={async (imageUrl) => {
            // Actualizar la imagen en el cliente local inmediatamente
            setClient((prev) => prev ? { ...prev, profile_image: imageUrl } : null)
            // Recargar los datos del cliente para asegurar consistencia
            try {
              let clientData: Client
              if (isMeRoute) {
                const response = await clientsAPI.getMe()
                // Manejar respuesta paginada o directa
                if ('results' in response && Array.isArray(response.results) && response.results.length > 0) {
                  clientData = response.results[0]
                } else if ('id' in response) {
                  clientData = response as Client
                } else {
                  return
                }
              } else if (client?.id) {
                clientData = await clientsAPI.getById(client.id)
              } else {
                return
              }
              setClient(clientData)
            } catch (error) {
              console.error('Error reloading client data:', error)
            }
          }}
        />
      )}
    </div>
  )
}

export default ClientDetail
