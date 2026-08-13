import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Home, Ruler, Scale, Activity, Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { mockClients, mockProgressMetrics } from '../data/mockData'
import { formatDate } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

// MOCK: ID del cliente autenticado
const AUTHENTICATED_CLIENT_ID = '1'

const Progress: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const clientId = AUTHENTICATED_CLIENT_ID

  const client = mockClients.find(c => c.id === clientId)
  const clientProgress = mockProgressMetrics
    .filter(p => p.clientId === clientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Función para determinar la ruta de inicio según el rol del usuario
  const getHomeRoute = () => {
    return (user?.role === 'client' || user?.role === 'guest') ? '/me' : '/'
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h2>
            <p className="text-gray-600 mb-4">El cliente que buscas no existe</p>
            <Button onClick={() => navigate(getHomeRoute())}>
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/my-routine`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi Progreso</h1>
                <p className="text-sm text-gray-600">Historial de medidas y progreso</p>
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
        {clientProgress.length === 0 ? (
          <div className="text-center py-12">
            <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos de progreso</h3>
            <p className="text-gray-600 mb-4">Aún no hay medidas registradas para este cliente.</p>
            <Button>
              <Ruler className="w-4 h-4 mr-2" />
              Registrar Primera Medida
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen general */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Resumen de Progreso</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-600">Peso Inicial</p>
                        <p className="text-lg font-semibold">{clientProgress[clientProgress.length - 1].weight} kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Peso Actual</p>
                        <p className="text-lg font-semibold">{clientProgress[0].weight} kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-600">Diferencia</p>
                        <p className={`text-lg font-semibold ${
                          clientProgress[0].weight > clientProgress[clientProgress.length - 1].weight 
                            ? 'text-green-600' 
                            : clientProgress[0].weight < clientProgress[clientProgress.length - 1].weight 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {clientProgress[0].weight > clientProgress[clientProgress.length - 1].weight ? '+' : ''}
                          {clientProgress[0].weight - clientProgress[clientProgress.length - 1].weight} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historial de medidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ruler className="w-5 h-5" />
                  <span>Historial de Medidas Antropométricas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {clientProgress.map((progress, index) => {
                    const previousProgress = index < clientProgress.length - 1 ? clientProgress[index + 1] : null
                    
                    return (
                      <div key={progress.date.toString()} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-semibold">{formatDate(progress.date)}</h4>
                              <p className="text-sm text-gray-600">
                                {index === 0 ? 'Medida más reciente' : 'Medida anterior'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {index === 0 ? 'Actual' : 'Histórico'}
                          </Badge>
                        </div>

                        {/* Medidas principales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Scale className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">Peso</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{progress.weight} kg</span>
                              {previousProgress && getTrendIcon(progress.weight, previousProgress.weight)}
                            </div>
                          </div>
                          
                          {progress.bodyFat && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">Grasa</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{progress.bodyFat}%</span>
                                {previousProgress && previousProgress.bodyFat && 
                                  getTrendIcon(progress.bodyFat, previousProgress.bodyFat)}
                              </div>
                            </div>
                          )}
                          
                          {progress.muscleMass && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">Masa</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{progress.muscleMass} kg</span>
                                {previousProgress && previousProgress.muscleMass && 
                                  getTrendIcon(progress.muscleMass, previousProgress.muscleMass)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Medidas corporales */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Medidas Corporales (cm)</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(progress.measurements).map(([key, value]) => {
                              const measurementName = {
                                chest: 'Pecho',
                                waist: 'Cintura',
                                biceps: 'Bíceps',
                                forearms: 'Antebrazos',
                                thighs: 'Muslos',
                                calves: 'Pantorrillas',
                                neck: 'Cuello',
                                shoulders: 'Hombros',
                                hips: 'Cadera'
                              }[key]
                              
                              const previousValue = previousProgress?.measurements[key as keyof typeof progress.measurements]
                              
                              return (
                                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm font-medium text-gray-600">{measurementName}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className={`font-semibold ${previousValue ? getTrendColor(value, previousValue) : ''}`}>
                                      {value}
                                    </span>
                                    {previousValue && getTrendIcon(value, previousValue)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default Progress 