import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Home, Ruler, Scale, Activity, Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { formatDate } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import { getHomePath } from '../lib/rbac'
import { handleApiError } from '../lib/api'
import type { BodyMeasurements } from '../lib/api'
import { useMeQuery, useClientProgressQuery } from '../hooks/useClients'
import PageFallback from '../components/PageFallback'

const MEASUREMENT_LABELS: Record<keyof BodyMeasurements, string> = {
  chest: 'Pecho',
  waist: 'Cintura',
  biceps: 'Bíceps',
  forearms: 'Antebrazos',
  thighs: 'Muslos',
  calves: 'Pantorrillas',
  neck: 'Cuello',
  shoulders: 'Hombros',
  hips: 'Cadera',
}

const Progress: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const meQuery = useMeQuery()
  const progressQuery = useClientProgressQuery(meQuery.data?.id)

  const client = meQuery.data ?? null
  const clientProgress = [...(progressQuery.data ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const loading = meQuery.isPending || progressQuery.isPending
  const error = meQuery.error || progressQuery.error

  const getHomeRoute = () => getHomePath(user?.role)

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

  if (loading) return <PageFallback />

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No se pudo cargar el progreso</h2>
          <p className="text-gray-600 mb-4">{error ? handleApiError(error) : 'El cliente no existe'}</p>
          <Button onClick={() => navigate(getHomeRoute())}>
            <Home className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/me')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi Progreso</h1>
                <p className="text-sm text-gray-600">Historial de medidas y progreso</p>
              </div>
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={client.profile_image} alt={client.name} />
              <AvatarFallback>
                {client.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {clientProgress.length === 0 ? (
          <div className="text-center py-12">
            <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos de progreso</h3>
            <p className="text-gray-600">Aún no hay medidas registradas para este cliente.</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                        <p className="text-lg font-semibold">
                          {clientProgress[0].weight - clientProgress[clientProgress.length - 1].weight} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    const measurements = progress.measurements ?? {}

                    return (
                      <div key={progress.id} className="border rounded-lg p-4">
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

                          {progress.body_fat != null && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">Grasa</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{progress.body_fat}%</span>
                                {previousProgress?.body_fat != null &&
                                  getTrendIcon(progress.body_fat, previousProgress.body_fat)}
                              </div>
                            </div>
                          )}

                          {progress.muscle_mass != null && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">Masa</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{progress.muscle_mass} kg</span>
                                {previousProgress?.muscle_mass != null &&
                                  getTrendIcon(progress.muscle_mass, previousProgress.muscle_mass)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Medidas Corporales (cm)</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(Object.keys(MEASUREMENT_LABELS) as Array<keyof BodyMeasurements>).map((key) => {
                              const value = measurements[key]
                              if (value == null) return null
                              const previousValue = previousProgress?.measurements?.[key]
                              return (
                                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm font-medium text-gray-600">{MEASUREMENT_LABELS[key]}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className={`font-semibold ${previousValue != null ? getTrendColor(value, previousValue) : ''}`}>
                                      {value}
                                    </span>
                                    {previousValue != null && getTrendIcon(value, previousValue)}
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
