import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Dumbbell,
  CreditCard,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { calculateProgress, formatDate, formatPrice, formatTime } from '../lib/utils'
import { handleApiError } from '../lib/api'
import { useDashboardSummaryQuery } from '../hooks/useDashboard'
import PageFallback from '../components/PageFallback'
import ProgressChart from '../components/ProgressChart'

function sessionDuration(startedAt?: string | null, completedAt?: string) {
  if (!startedAt || !completedAt) return null
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  const minutes = Math.max(1, Math.round(ms / 60000))
  return `${minutes} min`
}

function daysUntil(dateValue?: string) {
  if (!dateValue) return null
  const end = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(end.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - today.getTime()) / 86400000)
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const summaryQuery = useDashboardSummaryQuery()

  if (summaryQuery.isPending) return <PageFallback />

  if (summaryQuery.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {handleApiError(summaryQuery.error)}
      </div>
    )
  }

  const summary = summaryQuery.data
  const recentMetrics = summary?.recent_metrics ?? []
  const sessions = summary?.recent_sessions ?? []
  const goals = summary?.recent_goals ?? []
  const planMix = summary?.plan_mix ?? []
  const expiringClients = summary?.expiring_clients ?? []
  const inactiveSubscribers = summary?.inactive_subscribers ?? []
  const bodyTrend = (summary?.body_trend ?? []).filter((point) => point.date)
  const sessionsTrend = summary?.sessions_trend ?? []
  const planMixTotal = planMix.reduce((sum, plan) => sum + plan.count, 0)

  const stats = [
    {
      title: 'Suscripciones vivas',
      value: `${summary?.active_subscriptions ?? 0}/${summary?.clients_count ?? 0}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Ingreso estimado',
      value: formatPrice(summary?.estimated_monthly_revenue ?? 0),
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'En riesgo (30 días)',
      value: formatPrice(summary?.revenue_at_risk_30_days ?? 0),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Asistencia 7 días',
      value: `${summary?.engagement_7_days ?? 0}%`,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  const secondaryStats = [
    {
      title: 'Vencidas',
      value: summary?.expired_subscriptions ?? 0,
    },
    {
      title: 'Vencen en 30 días',
      value: summary?.expiring_30_days ?? 0,
    },
    {
      title: 'Con rutina activa',
      value: `${summary?.clients_with_routine ?? 0}/${summary?.clients_count ?? 0}`,
    },
    {
      title: 'Metas vencidas',
      value: `${summary?.goals_overdue ?? 0}/${summary?.goals_count ?? 0}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Indicadores para decidir renovaciones, seguimiento y carga de trabajo</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Tendencia corporal del gimnasio</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              title=""
              height={280}
              data={bodyTrend.map((point) => ({
                date: point.date,
                weight: point.weight ?? undefined,
                body_fat: point.body_fat ?? undefined,
                muscle_mass: point.muscle_mass ?? undefined,
              }))}
              selectedMetrics={['weight', 'body_fat', 'muscle_mass']}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Sesiones de los últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              title=""
              height={280}
              data={sessionsTrend}
              selectedMetrics={['sessions']}
            />
            <p className="mt-3 text-sm text-gray-500">
              {summary?.active_clients_7_days ?? 0} cliente
              {(summary?.active_clients_7_days ?? 0) === 1 ? '' : 's'} entrenó esta semana
              {' · '}
              {summary?.sessions_7_days ?? 0} sesiones
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Renovaciones</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
              Ver clientes
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringClients.length === 0 ? (
              <p className="text-sm text-gray-500">Nadie vence en los próximos 30 días.</p>
            ) : (
              expiringClients.map((client) => {
                const remaining = daysUntil(client.subscription_end)
                return (
                  <button
                    key={client.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 text-left"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">
                        {client.plan_name} · {formatDate(`${client.subscription_end}T00:00:00`)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">{formatPrice(client.price)}</p>
                      <p className="text-xs text-gray-500">
                        {remaining === null ? '' : remaining === 0 ? 'Hoy' : `${remaining} días`}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Pagan y no entrenan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inactiveSubscribers.length === 0 ? (
              <p className="text-sm text-gray-500">Todos los suscriptores vivos entrenaron en 14 días.</p>
            ) : (
              inactiveSubscribers.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 text-left"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.plan_name}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Mix de planes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planMix.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay planes asignados.</p>
          ) : (
            planMix.map((plan) => (
              <div key={plan.slug ?? plan.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">
                    {plan.name}
                    {plan.price ? ` · ${formatPrice(plan.price)}` : ''}
                  </span>
                  <span className="text-gray-500">{plan.count} clientes</span>
                </div>
                <Progress
                  value={planMixTotal ? (plan.count / planMixTotal) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
                    {metric.client_name ?? `Cliente #${metric.client_id}`} registró {metric.weight} kg
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
                  const duration = sessionDuration(session.started_at, session.completed_at)
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className="flex w-full items-start space-x-3 text-left"
                      onClick={() => session.client_id && navigate(`/clients/${session.client_id}`)}
                      disabled={!session.client_id}
                    >
                      <div className="mt-1.5 rounded-full bg-green-50 p-1">
                        <Dumbbell className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {session.client_name || 'Cliente'} completó {session.workout_name || 'un entrenamiento'}
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
                  {goals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {goal.client_name ? `${goal.client_name}: ` : ''}
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
