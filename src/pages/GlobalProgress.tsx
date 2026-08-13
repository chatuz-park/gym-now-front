import React, { useState } from 'react'
import { 
  TrendingUp, Calendar, Target, Filter, Search, Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress as ProgressBar } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { mockClients, mockGoals, mockProgressMetrics } from '../data/mockData'
import { calculateProgress } from '../lib/utils'

const GlobalProgress: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock progress data
  const mockProgress = [
    { id: '1', clientName: 'María González', metric: 'weight', value: '63kg', date: '2024-02-15' },
    { id: '2', clientName: 'Carlos Rodríguez', metric: 'strength', value: '85kg', date: '2024-02-14' },
    { id: '3', clientName: 'Ana Martínez', metric: 'endurance', value: '30min', date: '2024-02-13' },
    { id: '4', clientName: 'María González', metric: 'flexibility', value: '85%', date: '2024-02-12' },
    { id: '5', clientName: 'Carlos Rodríguez', metric: 'weight', value: '82kg', date: '2024-02-11' }
  ]

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-50'
    if (progress >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'weight': return '⚖️'
      case 'strength': return '💪'
      case 'endurance': return '🏃'
      case 'flexibility': return '🧘'
      default: return '📊'
    }
  }

  // Filtrar clientes por término de búsqueda
  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Progreso Global</h1>
        <p className="text-gray-600">Seguimiento del progreso de todos los clientes</p>
      </div>

      {/* Time Range Filter */}
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
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">78%</p>
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
                    <p className="text-2xl font-bold text-gray-900">12/18</p>
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
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progreso Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProgress.slice(0, 5).map((progress) => (
                <div key={progress.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getMetricIcon(progress.metric)}</span>
                    <div>
                      <p className="font-medium text-sm">{progress.clientName}</p>
                      <p className="text-xs text-gray-600">{progress.metric}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{progress.value}</p>
                    <p className="text-xs text-gray-500">{progress.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          {/* Search Bar */}
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
            const clientGoals = mockGoals.filter(goal => goal.clientId === client.id)
            const clientProgress = mockProgressMetrics.filter(p => p.clientId === client.id)
            const averageProgress = clientGoals.length > 0 
              ? clientGoals.reduce((acc, goal) => acc + calculateProgress(goal.currentValue, goal.targetValue), 0) / clientGoals.length
              : 0

            return (
              <Card 
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={client.profileImage} alt={client.name} />
                          <AvatarFallback>
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{clientGoals.length} metas activas</p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${getProgressBgColor(averageProgress)}`}>
                        <span className={`font-bold ${getProgressColor(averageProgress)}`}>
                          {Math.round(averageProgress)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {clientGoals.slice(0, 2).map((goal) => (
                        <div key={goal.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{goal.title}</span>
                            <span className="text-gray-500">
                              {goal.currentValue}/{goal.targetValue} {goal.unit}
                            </span>
                          </div>
                          <ProgressBar 
                            value={calculateProgress(goal.currentValue, goal.targetValue)} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Medidas antropométricas recientes */}
                    {clientProgress.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Última medida:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(clientProgress[0].date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">Peso</p>
                            <p className="font-semibold text-sm">{clientProgress[0].weight}kg</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">Pecho</p>
                            <p className="font-semibold text-sm">{clientProgress[0].measurements.chest}cm</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">Cintura</p>
                            <p className="font-semibold text-sm">{clientProgress[0].measurements.waist}cm</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['weight', 'strength', 'endurance', 'flexibility'].map((metric) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">{getMetricIcon(metric)}</span>
                    <span className="capitalize">{metric}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockProgress
                      .filter(p => p.metric === metric)
                      .slice(0, 3)
                      .map((progress) => (
                        <div key={progress.id} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{progress.clientName}</span>
                          <Badge variant="secondary">{progress.value}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Client Progress Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Progreso Detallado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const client = mockClients.find(c => c.id === selectedClient)
                const clientGoals = mockGoals.filter(goal => goal.clientId === selectedClient)
                const clientProgress = mockProgressMetrics.filter(p => p.clientId === selectedClient)
                
                if (!client) return null
                
                return (
                  <>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={client.profileImage} alt={client.name} />
                        <AvatarFallback>
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <p className="text-gray-600 text-sm">{client.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {clientGoals.map((goal) => (
                        <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{goal.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {goal.isCompleted ? 'Completada' : 'En Progreso'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progreso</span>
                              <span className="font-medium">
                                {goal.currentValue}/{goal.targetValue} {goal.unit}
                              </span>
                            </div>
                            <ProgressBar 
                              value={calculateProgress(goal.currentValue, goal.targetValue)} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {clientProgress.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">Medidas Antropométricas</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">Peso Actual</p>
                            <p className="font-semibold">{clientProgress[0].weight}kg</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">Última Medida</p>
                            <p className="font-semibold text-sm">
                              {new Date(clientProgress[0].date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" className="flex-1">
                        Ver Historial
                      </Button>
                      <Button className="flex-1 bg-primary-600 hover:bg-primary-700">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GlobalProgress 