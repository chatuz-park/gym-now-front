import React from 'react'
import { Users, Calendar, TrendingUp, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { mockClients, mockGoals } from '../data/mockData'
import { calculateProgress } from '../lib/utils'

const Dashboard: React.FC = () => {
  const totalClients = mockClients.length
  const activeGoals = mockGoals.filter(goal => !goal.isCompleted).length
  const completedGoals = mockGoals.filter(goal => goal.isCompleted).length
  const totalGoals = mockGoals.length

  const stats = [
    {
      title: 'Clientes Activos',
      value: totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Rutinas Activas',
      value: 8,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Progreso Promedio',
      value: '78%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Metas Completadas',
      value: `${completedGoals}/${totalGoals}`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu gimnasio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-0 shadow-sm">
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">María completó su rutina de piernas</p>
              <p className="text-xs text-gray-500">Hace 2 horas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Carlos registró nuevo progreso</p>
              <p className="text-xs text-gray-500">Hace 4 horas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Ana alcanzó su meta de peso</p>
              <p className="text-xs text-gray-500">Ayer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Metas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockGoals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{goal.title}</span>
                <span className="text-sm text-gray-500">
                  {goal.currentValue}/{goal.targetValue} {goal.unit}
                </span>
              </div>
              <Progress 
                value={calculateProgress(goal.currentValue, goal.targetValue)} 
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard 