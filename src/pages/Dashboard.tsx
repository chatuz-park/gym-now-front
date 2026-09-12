import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, TrendingUp, Target, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { calculateProgress, formatDate, formatTime } from '../lib/utils'
import { handleApiError } from '../lib/api'
import { useClientsQuery } from '../hooks/useClients'
import { useClientRoutinesQuery } from '../hooks/useClientRoutines'
import { useGoalsQuery, useProgressMetricsQuery, useRoutineProgressQuery } from '../hooks/useProgress'
import PageFallback from '../components/PageFallback'

function sessionDuration(startedAt?: string | null, completedAt?: string) {
  if (!startedAt || !completedAt) return null
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  const minutes = Math.max(1, Math.round(ms / 60000))
  return `${minutes} min`
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const clientsQuery = useClientsQuery()
  const routinesQuery = useClientRoutinesQuery({ ordering: '-start_date' })
  const goalsQuery = useGoalsQuery({ ordering: '-deadline' })
  const metricsQuery = useProgressMetricsQuery({ ordering: '-date' })
  const sessionsQuery = useRoutineProgressQuery({ ordering: '-completed_at' })

  const loading =
    clientsQuery.isPending ||
    routinesQuery.isPending ||
    goalsQuery.isPending ||
    metricsQuery.isPending ||
    sessionsQuery.isPending
  const queryError =
    clientsQuery.error ||
    routinesQuery.error ||
    goalsQuery.error ||
    metricsQuery.error ||
    sessionsQuery.error

  if (loading) return <PageFallback />

  if (queryError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {handleApiError(queryError)}
      </div>
    )
  }

  const clientsCount = clientsQuery.data?.count ?? 0
  const routineList = routinesQuery.data ?? []
  const activeRoutines = routineList.filter((routine) => routine.is_active).length
  const goals = goalsQuery.data ?? []
  const recentMetrics = (metricsQuery.data ?? []).slice(0, 5)
  const sessions = (sessionsQuery.data ?? []).slice(0, 8)

  const completedGoals = goals.filter((goal) => goal.is_completed).length
  const averageProgress = goals.length
    ? Math.round(
        goals.reduce((sum, goal) => sum + calculateProgress(goal.current_value, goal.target_value), 0) /
          goals.length
      )
    : 0

  const stats = [
    {
      title: 'Clientes Activos',
      value: clientsCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Rutinas Activas',
      value: activeRoutines,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Progreso Promedio',
      value: `${averageProgress}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Metas Completadas',
      value: `${completedGoals}/${goals.length}`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu gimnasio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentMetrics.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay medidas registradas.</p>
          ) : (
            recentMetrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {metric.client?.name ?? `Cliente #${metric.client_id}`} registró {metric.weight} kg
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(metric.date)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Actividad de clientes</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/progress')}>
            Ver progreso
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 && goals.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay entrenamientos ni metas registradas.</p>
          ) : (
            <>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no hay entrenamientos registrados.</p>
              ) : (
                sessions.map((session) => {
                  const client = session.client_routine?.client
                  const clientId = client?.id ?? session.client_routine?.client_id
                  const duration = sessionDuration(session.started_at, session.completed_at)
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className="flex w-full items-start space-x-3 text-left"
                      onClick={() => clientId && navigate(`/clients/${clientId}`)}
                      disabled={!clientId}
                    >
                      <div className="mt-1.5 rounded-full bg-green-50 p-1">
                        <Dumbbell className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {client?.name ?? 'Cliente'} completó {session.workout?.name ?? 'un entrenamiento'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.completed_at)} · {formatTime(session.completed_at)}
                          {session.started_at ? ` · Inicio ${formatTime(session.started_at)}` : ''}
                          {duration ? ` · ${duration}` : ''}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}

              {goals.length > 0 && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Metas</p>
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {goal.client?.name ? `${goal.client.name}: ` : ''}
                          {goal.title}
                        </span>
                        <span className="text-sm text-gray-500">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <Progress
                        value={calculateProgress(goal.current_value, goal.target_value)}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
