import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Calendar, Target, Filter, Search, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress as ProgressBar } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { calculateProgress, formatDate } from '../lib/utils'
import { handleApiError } from '../lib/api'
import { useClientsQuery } from '../hooks/useClients'
import { useGoalsQuery, useProgressMetricsQuery, useRoutineProgressQuery } from '../hooks/useProgress'
import PageFallback from '../components/PageFallback'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

function inTimeRange(dateValue: string, range: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const start = new Date(now)
  if (range === 'week') start.setDate(now.getDate() - 7)
  else if (range === 'month') start.setMonth(now.getMonth() - 1)
  else if (range === 'quarter') start.setMonth(now.getMonth() - 3)
  else start.setFullYear(now.getFullYear() - 1)
  return date >= start
}

function clientInitials(name: string) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2)
}

const GlobalProgress: React.FC = () => {
  const navigate = useNavigate()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')

  const clientsQuery = useClientsQuery({ ordering: 'name' })
  const goalsQuery = useGoalsQuery()
  const metricsQuery = useProgressMetricsQuery({ ordering: '-date' })
  const sessionsQuery = useRoutineProgressQuery({ ordering: '-completed_at' })

  const loading =
    clientsQuery.isPending || goalsQuery.isPending || metricsQuery.isPending || sessionsQuery.isPending
  const queryError = clientsQuery.error || goalsQuery.error || metricsQuery.error || sessionsQuery.error

  const clients = clientsQuery.data?.results ?? []
  const goals = Array.isArray(goalsQuery.data) ? goalsQuery.data : []
  const metrics = Array.isArray(metricsQuery.data) ? metricsQuery.data : []
  const sessionsCount = Array.isArray(sessionsQuery.data) ? sessionsQuery.data.length : 0

  const rangedMetrics = useMemo(
    () => metrics.filter((metric) => inTimeRange(metric.date, timeRange)),
    [metrics, timeRange]
  )

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return clients.filter((client) =>
      client.name.toLowerCase().includes(term) || client.email.toLowerCase().includes(term)
    )
  }, [clients, searchTerm])

  const completedGoals = goals.filter((goal) => goal.is_completed).length
  const averageProgress = goals.length
    ? Math.round(
        goals.reduce((sum, goal) => sum + calculateProgress(goal.current_value, goal.target_value), 0) /
          goals.length
      )
    : 0

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null
  useLockBodyScroll(!!selectedClient)
  const selectedGoals = goals.filter((goal) => goal.client_id === selectedClientId)
  const selectedMetrics = rangedMetrics.filter((metric) => metric.client_id === selectedClientId)

  if (loading) return <PageFallback />

  if (queryError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {handleApiError(queryError)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Progreso Global</h1>
        <p className="text-gray-600">Seguimiento del progreso de todos los clientes</p>
      </div>

      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Período:</span>
        <div className="flex space-x-1">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              className="text-xs"
            >
              {range === 'week' && 'Semana'}
              {range === 'month' && 'Mes'}
              {range === 'quarter' && 'Trimestre'}
              {range === 'year' && 'Año'}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Metas Alcanzadas</p>
                    <p className="text-2xl font-bold text-gray-900">{completedGoals}/{goals.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sesiones Completadas</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionsCount}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progreso Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rangedMetrics.slice(0, 5).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{metric.client?.name ?? `Cliente #${metric.client_id}`}</p>
                    <p className="text-xs text-gray-600">peso</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{metric.weight} kg</p>
                    <p className="text-xs text-gray-500">{formatDate(metric.date)}</p>
                  </div>
                </div>
              ))}
              {rangedMetrics.length === 0 && (
                <p className="text-sm text-gray-500">No hay medidas en este período.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {filteredClients.map((client) => {
            const clientGoals = goals.filter((goal) => goal.client_id === client.id)
            const latestMetric = rangedMetrics.find((metric) => metric.client_id === client.id)
            const average = clientGoals.length
              ? clientGoals.reduce((acc, goal) => acc + calculateProgress(goal.current_value, goal.target_value), 0) /
                clientGoals.length
              : 0

            return (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={client.profile_image} alt={client.name} />
                        <AvatarFallback>{clientInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-600">{clientGoals.length} metas</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800">{Math.round(average)}%</span>
                  </div>

                  {clientGoals.slice(0, 2).map((goal) => (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-gray-500">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <ProgressBar value={calculateProgress(goal.current_value, goal.target_value)} className="h-2" />
                    </div>
                  ))}

                  {latestMetric && (
                    <div className="pt-2 border-t grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Peso</p>
                        <p className="font-semibold text-sm">{latestMetric.weight}kg</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Grasa</p>
                        <p className="font-semibold text-sm">{latestMetric.body_fat ?? '—'}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Fecha</p>
                        <p className="font-semibold text-sm">{formatDate(latestMetric.date)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas medidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rangedMetrics.slice(0, 8).map((metric) => (
                <div key={metric.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.client?.name ?? `Cliente #${metric.client_id}`}</span>
                  <Badge variant="secondary">{metric.weight} kg</Badge>
                </div>
              ))}
              {rangedMetrics.length === 0 && (
                <p className="text-sm text-gray-500">No hay métricas en este período.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedClient && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Progreso Detallado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedClient.profile_image} alt={selectedClient.name} />
                  <AvatarFallback>{clientInitials(selectedClient.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                  <p className="text-gray-600 text-sm">{selectedClient.email}</p>
                </div>
              </div>

              {selectedGoals.map((goal) => (
                <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{goal.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {goal.is_completed ? 'Completada' : 'En Progreso'}
                    </Badge>
                  </div>
                  <ProgressBar value={calculateProgress(goal.current_value, goal.target_value)} className="h-2" />
                </div>
              ))}

              {selectedMetrics[0] && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Peso actual: {selectedMetrics[0].weight} kg</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedClientId(null)}>
                  Cerrar
                </Button>
                <Button
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                  onClick={() => navigate(`/clients/${selectedClient.id}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GlobalProgress
