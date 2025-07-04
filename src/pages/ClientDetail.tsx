import React, { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, Clock, Target, User, Scale, Ruler, CreditCard, AlertTriangle, ChevronLeft, ChevronRight, Play, CheckCircle, Info, Activity, XCircle, Home
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { mockClients, mockRoutines, mockExercises, mockProgressMetrics } from '../data/mockData'
import { formatDate } from '../lib/utils'

// MOCK: ID del cliente autenticado
const AUTHENTICATED_CLIENT_ID = '1' // Cambia este valor para simular otro cliente

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentDayParam = searchParams.get('day')
  const [currentDay, setCurrentDay] = useState(currentDayParam || getCurrentDayOfWeek())

  // Usar el ID autenticado directamente, o el de la URL si existe (para compatibilidad)
  const clientId = id || AUTHENTICATED_CLIENT_ID

  // Solo permitir ver la info si el id coincide con el mock autenticado
  if (clientId !== AUTHENTICATED_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permiso para ver la información de este cliente.</p>
            <Button onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const client = mockClients.find(c => c.id === clientId)
  const clientProgress = mockProgressMetrics.filter(p => p.clientId === clientId)
  const latestProgress = clientProgress.length > 0 ? 
    clientProgress.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null
  
  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h2>
            <p className="text-gray-600 mb-4">El cliente que buscas no existe</p>
            <Button onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }
  function getCurrentDayOfWeek(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', short: 'Lun' },
    { key: 'tuesday', label: 'Martes', short: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
    { key: 'thursday', label: 'Jueves', short: 'Jue' },
    { key: 'friday', label: 'Viernes', short: 'Vie' },
    { key: 'saturday', label: 'Sábado', short: 'Sáb' },
    { key: 'sunday', label: 'Domingo', short: 'Dom' }
  ]
  const assignedRoutines = client.assignedRoutines?.map(routineId => 
    mockRoutines.find(r => r.id === routineId)
  ).filter(Boolean) || []
  const getRoutineForDay = (day: string) => {
    return assignedRoutines.find(routine => 
      routine?.scheduledDays?.includes(day)
    )
  }
  const currentRoutine = getRoutineForDay(currentDay)
  const navigateToDay = (day: string) => {
    setCurrentDay(day)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('day', day)
    setSearchParams(newParams)
  }
  const navigateToPreviousDay = () => {
    const currentIndex = daysOfWeek.findIndex(d => d.key === currentDay)
    const previousIndex = currentIndex === 0 ? daysOfWeek.length - 1 : currentIndex - 1
    navigateToDay(daysOfWeek[previousIndex].key)
  }
  const navigateToNextDay = () => {
    const currentIndex = daysOfWeek.findIndex(d => d.key === currentDay)
    const nextIndex = currentIndex === daysOfWeek.length - 1 ? 0 : currentIndex + 1
    navigateToDay(daysOfWeek[nextIndex].key)
  }
  const getSubscriptionStatus = (startDate: string, endDate: string) => {
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
  const subscriptionStatus = client.subscription ? 
    getSubscriptionStatus(client.subscription.startDate, client.subscription.endDate) : null
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header independiente */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi Rutina</h1>
                <p className="text-sm text-gray-600">Detalle de mi información y rutinas</p>
              </div>
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={client.profileImage} alt={client.name} />
              <AvatarFallback>
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
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
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={client.profileImage} alt={client.name} />
                    <AvatarFallback>
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-gray-600">{client.email}</p>
                    {client.phone && (
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {client.age > 0 && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Edad</p>
                        <p className="text-lg font-semibold">{client.age} años</p>
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
                      <p className="text-lg font-semibold">{formatDate(client.joinDate)}</p>
                    </div>
                  </div>
                </div>
                {client.goals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Mis Metas de Entrenamiento</p>
                    <div className="flex flex-wrap gap-2">
                      {client.goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {goal}
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
                    <p>Última actualización: {formatDate(latestProgress.date)}</p>
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
                    {latestProgress.bodyFat && (
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Grasa Corporal</p>
                          <p className="text-lg font-semibold">{latestProgress.bodyFat}%</p>
                        </div>
                      </div>
                    )}
                    {latestProgress.muscleMass && (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Masa Muscular</p>
                          <p className="text-lg font-semibold">{latestProgress.muscleMass} kg</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Medidas corporales */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Medidas Corporales (cm)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Pecho</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.chest} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Cintura</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.waist} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Bíceps</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.biceps} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Antebrazos</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.forearms} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Muslos</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.thighs} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Pantorrillas</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.calves} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Cuello</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.neck} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Hombros</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.shoulders} cm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Cadera</p>
                        <p className="text-lg font-semibold">{latestProgress.measurements.hips} cm</p>
                      </div>
                    </div>
                  </div>

                  {/* Botón para ver historial */}
                  {clientProgress.length > 1 && (
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
            
            {client.subscription && (
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
                      {client.subscription.type === 'premium' ? 'Premium' : 
                       client.subscription.type === 'personalized' ? 'Personalizada' : 'Estándar'}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        client.subscription.type === 'premium' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        client.subscription.type === 'personalized' ? 'border-green-200 text-green-700 bg-green-50' :
                        'border-blue-200 text-blue-700 bg-blue-50'
                      }
                    >
                      {client.subscription.type}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Inicio:</span>
                      <span>{client.subscription.startDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fin:</span>
                      <span>{client.subscription.endDate}</span>
                    </div>
                  </div>
                  {subscriptionStatus && (
                    <div className={`p-3 rounded-lg border ${
                      subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : subscriptionStatus.status === 'warning' || subscriptionStatus.status === 'halfway'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : subscriptionStatus.status === 'warning' || subscriptionStatus.status === 'halfway' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {subscriptionStatus.status === 'expired' ? 'Suscripción Vencida' :
                             subscriptionStatus.status === 'critical' ? 'Vence Pronto' :
                             subscriptionStatus.status === 'warning' ? 'Vence en 30 días' :
                             subscriptionStatus.status === 'halfway' ? 'Más de 50% completada' :
                             'Activa'}
                          </p>
                          {subscriptionStatus.status !== 'expired' && (
                            <p className="text-xs text-gray-600">
                              {subscriptionStatus.days} días restantes
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {(client.notes || client.emergencyContact || client.medicalConditions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="w-5 h-5" />
                    <span>Información Adicional</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.emergencyContact && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Contacto de Emergencia</p>
                      <p className="text-sm">{client.emergencyContact}</p>
                    </div>
                  )}
                  {client.medicalConditions && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Condiciones Médicas</p>
                      <p className="text-sm">{client.medicalConditions}</p>
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
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Mis Rutinas de la Semana</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={navigateToPreviousDay}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={navigateToNextDay}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => {
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
                    Mi Rutina para {daysOfWeek.find(d => d.key === currentDay)?.label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentRoutine ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">{currentRoutine.name}</h4>
                      <p className="text-gray-600 mb-3">{currentRoutine.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{currentRoutine.duration} semanas</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{currentRoutine.daysPerWeek} días/semana</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-semibold">Mis Entrenamientos del día:</h5>
                      {currentRoutine.workouts.map((workout, index) => (
                        <Card key={workout.id} className="border-l-4 border-l-primary-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h6 className="font-semibold">{workout.name}</h6>
                                <p className="text-sm text-gray-600">{workout.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {workout.estimatedDuration} min
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
                              {workout.exercises.map((exerciseSet) => {
                                const exercise = mockExercises.find(e => e.id === exerciseSet.exerciseId)
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
                                        <p className="font-medium">{exerciseSet.restTime}s</p>
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
                      No hay rutina asignada para {daysOfWeek.find(d => d.key === currentDay)?.label}
                    </p>
                    <Button variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Asignar Rutina
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {assignedRoutines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Mis Rutinas Asignadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedRoutines.map((routine) => (
                      <div key={routine?.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h6 className="font-medium">{routine?.name}</h6>
                          <p className="text-sm text-gray-600">{routine?.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{routine?.daysPerWeek} días/semana</span>
                            <span>•</span>
                            <span>{routine?.duration} semanas</span>
                            <span>•</span>
                            <span>{routine?.workouts.length} entrenamientos</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {routine?.scheduledDays?.map(day => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {daysOfWeek.find(d => d.key === day)?.short}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClientDetail
