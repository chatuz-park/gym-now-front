import React, { useState } from 'react'
import { Search, Plus, Phone, Mail, Calendar, CreditCard, Target, Users, Clock, AlertTriangle, AlertCircle, ChevronDown, ChevronRight, RefreshCw, Eye, X } from 'lucide-react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import ClientCreator from '../components/ClientCreator'
import { mockClients, mockRoutines } from '../data/mockData'
import { formatDate } from '../lib/utils'

const Clients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { id: clientIdFromPath } = useParams<{ id: string }>()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clients, setClients] = useState(mockClients)
  const [expiringAccordionOpen, setExpiringAccordionOpen] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [clientForRoutine, setClientForRoutine] = useState<string | null>(null)
  const [selectedRoutineForAssignment, setSelectedRoutineForAssignment] = useState<string | null>(null)
  const [selectedDaysForClient, setSelectedDaysForClient] = useState<string[]>([])
  const [renewalDate, setRenewalDate] = useState('')

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  // Get modal state from URL params
  const isClientCreatorOpen = searchParams.get('modal') === 'create-client'
  const isRenewalModalOpen = searchParams.get('modal') === 'renew-subscription' && !!clientIdFromPath
  const searchTerm = searchParams.get('search') || ''
  const activeFilter = searchParams.get('filter') || 'all'

  // Filter clients based on search term and active filter
  const getFilteredClients = () => {
    let filtered = clients

    // Apply filter
    switch (activeFilter) {
      case 'active':
        filtered = clients.filter(c => {
          const subscription = (c as any).subscription
          if (!subscription?.type || !subscription?.startDate || !subscription?.endDate) return false
          
          const status = getSubscriptionStatus(subscription.startDate, subscription.endDate)
          return status.status === 'active' || status.status === 'halfway' || status.status === 'warning'
        })
        break
      case 'premium':
        filtered = clients.filter(c => (c as any).subscription?.type === 'premium')
        break
      case 'with-routines':
        filtered = clients.filter(c => (c as any).assignedRoutines?.length > 0)
        break
      case 'expiring':
        filtered = getExpiringClients()
        break
      default:
        filtered = clients
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  // Helper functions for subscription expiration
  const getDaysUntilExpiration = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getSubscriptionStatus = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = today.getTime() - start.getTime()
    const progress = elapsed / totalDuration
    
    const daysUntilExpiration = getDaysUntilExpiration(endDate)
    
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

  const getSubscriptionHighlightClass = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-50 border-red-200'
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'halfway':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return ''
    }
  }

  const getExpiringClients = () => {
    return clients.filter(client => {
      const subscription = (client as any).subscription
      if (!subscription?.startDate || !subscription?.endDate) return false
      
      const status = getSubscriptionStatus(subscription.startDate, subscription.endDate)
      return status.status === 'critical' || status.status === 'warning' || status.status === 'expired'
    }).sort((a, b) => {
      const statusA = getSubscriptionStatus((a as any).subscription.startDate, (a as any).subscription.endDate)
      const statusB = getSubscriptionStatus((b as any).subscription.startDate, (b as any).subscription.endDate)
      return statusA.days - statusB.days
    })
  }

  const expiringClients = getExpiringClients()

  const filteredClients = getFilteredClients()

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'Todos', count: clients.length, icon: Users },
    { id: 'active', label: 'Activos', count: clients.filter(c => {
      const subscription = (c as any).subscription
      if (!subscription?.type || !subscription?.startDate || !subscription?.endDate) return false
      
      const status = getSubscriptionStatus(subscription.startDate, subscription.endDate)
      return status.status === 'active' || status.status === 'halfway' || status.status === 'warning'
    }).length, icon: Target },
    { id: 'premium', label: 'Premium', count: clients.filter(c => (c as any).subscription?.type === 'premium').length, icon: CreditCard },
    { id: 'with-routines', label: 'Con Rutinas', count: clients.filter(c => (c as any).assignedRoutines?.length > 0).length, icon: Clock },
    { id: 'expiring', label: 'Por Vencer', count: expiringClients.length, icon: AlertTriangle }
  ]

  const handleFilterChange = (filterId: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (filterId === 'all') {
      newParams.delete('filter')
    } else {
      newParams.set('filter', filterId)
    }
    setSearchParams(newParams)
  }

  const getClientGoals = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.goals || []
  }

  const getSubscriptionColor = (type: string) => {
    switch (type) {
      case 'premium': return 'border-purple-200 text-purple-700 bg-purple-50'
      case 'personalized': return 'border-green-200 text-green-700 bg-green-50'
      default: return 'border-blue-200 text-blue-700 bg-blue-50'
    }
  }

  const getSubscriptionName = (type: string) => {
    switch (type) {
      case 'premium': return 'Premium'
      case 'personalized': return 'Personalizada'
      default: return 'Estándar'
    }
  }

  const openClientCreator = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'create-client')
    setSearchParams(newParams)
  }

  const closeClientCreator = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
  }

  const handleRenewSubscription = (clientId: string) => {
    // Navegar a /clients/:id?modal=renew-subscription
    navigate(`/clients/${clientId}?modal=renew-subscription`)
    // Set default renewal date to 6 months from now
    const defaultDate = new Date()
    defaultDate.setMonth(defaultDate.getMonth() + 6)
    setRenewalDate(defaultDate.toISOString().split('T')[0])
  }

  const handleCloseRenewalModal = () => {
    // Volver a la ruta base de clientes
    navigate('/clients')
    setRenewalDate('')
  }

  const handleRenewSubscriptionSubmit = () => {
    if (!renewalDate || !clientIdFromPath) {
      alert('Por favor selecciona una fecha de renovación')
      return
    }
    // TODO: Implement subscription renewal logic
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientIdFromPath 
          ? {
              ...client,
              subscription: {
                ...(client as any).subscription,
                endDate: renewalDate
              }
            }
          : client
      )
    )
    handleCloseRenewalModal()
  }

  const handleViewDetails = (clientId: string) => {
    setSelectedClient(clientId)
  }

  const handleAssignRoutine = (clientId: string) => {
    console.log('Opening routine assignment modal for client:', clientId)
    setClientForRoutine(clientId)
    setShowRoutineModal(true)
    setSelectedRoutineForAssignment(null)
    setSelectedDaysForClient([])
  }

  const handleCloseRoutineModal = () => {
    console.log('Closing routine assignment modal')
    setShowRoutineModal(false)
    setClientForRoutine(null)
    setSelectedRoutineForAssignment(null)
    setSelectedDaysForClient([])
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleSelectRoutine = (routineId: string) => {
    console.log('Selected routine:', routineId)
    setSelectedRoutineForAssignment(routineId)
  }

  const handleDayToggle = (day: string) => {
    console.log('Toggling day:', day)
    setSelectedDaysForClient(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleAssignRoutineToClient = () => {
    if (!selectedRoutineForAssignment || selectedDaysForClient.length === 0) {
      alert('Por favor selecciona una rutina y al menos un día')
      return
    }
    
    // TODO: Implement routine assignment logic
    console.log('Assigning routine', selectedRoutineForAssignment, 'to client', clientForRoutine, 'on days:', selectedDaysForClient)
    handleCloseRoutineModal()
  }

  const formatSelectedDays = (days: string[]) => {
    return days.map(day => {
      const dayInfo = daysOfWeek.find(d => d.key === day)
      return dayInfo ? dayInfo.label : day
    }).join(', ')
  }

  const handleCreateClient = (clientData: any) => {
    // Create new client with proper structure
    const newClient = {
      id: clientData.id,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      age: parseInt(clientData.age) || 0,
      weight: parseInt(clientData.weight) || 0,
      height: parseInt(clientData.height) || 0,
      goals: clientData.goals || [],
      joinDate: clientData.joinDate,
      profileImage: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=150&h=150&fit=crop&crop=face`,
      subscription: {
        type: clientData.subscriptionType,
        startDate: clientData.startDate,
        endDate: clientData.endDate
      },
      assignedRoutines: clientData.assignedRoutines || [],
      notes: clientData.notes || '',
      emergencyContact: clientData.emergencyContact || '',
      medicalConditions: clientData.medicalConditions || ''
    }

    setClients([...clients, newClient])
  }

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600">Gestiona tus clientes y su información</p>
      </div>

      {/* Search and Add */}
      <div className="flex space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={openClientCreator}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {filterOptions.map((filter) => {
          const Icon = filter.icon
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{filter.label}</span>
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => {
                    const subscription = (c as any).subscription
                    if (!subscription?.type || !subscription?.startDate || !subscription?.endDate) return false
                    
                    const status = getSubscriptionStatus(subscription.startDate, subscription.endDate)
                    return status.status === 'active' || status.status === 'halfway' || status.status === 'warning'
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => (c as any).subscription?.type === 'premium').length}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Rutinas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => (c as any).assignedRoutines?.length > 0).length}
                </p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Vencer</p>
                <p className="text-2xl font-bold text-red-600">
                  {expiringClients.length}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Subscriptions Accordion */}
      {expiringClients.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <button
            className="w-full flex items-center justify-between px-6 py-4 focus:outline-none select-none"
            onClick={() => setExpiringAccordionOpen((open) => !open)}
            aria-expanded={expiringAccordionOpen}
            aria-controls="expiring-accordion-content"
          >
            <span className="flex items-center space-x-2 text-red-800 font-semibold">
              <AlertTriangle className="w-5 h-5" />
              <span>Suscripciones por Vencer ({expiringClients.length})</span>
            </span>
            {expiringAccordionOpen ? (
              <ChevronDown className="w-5 h-5 text-red-800" />
            ) : (
              <ChevronRight className="w-5 h-5 text-red-800" />
            )}
          </button>
          {expiringAccordionOpen && (
            <CardContent id="expiring-accordion-content">
              <div className="space-y-3">
                {expiringClients.slice(0, 5).map((client) => {
                  const subscription = (client as any).subscription
                  const status = getSubscriptionStatus(subscription.startDate, subscription.endDate)
                  return (
                    <div 
                      key={client.id}
                      className={`p-3 rounded-lg border ${
                        status.status === 'expired' || status.status === 'critical' 
                          ? 'bg-red-100 border-red-300' 
                          : 'bg-yellow-100 border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={client.profileImage} alt={client.name} />
                            <AvatarFallback className="text-xs">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">
                              {getSubscriptionName(subscription.type)} - Vence {subscription.endDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={
                              status.status === 'expired' || status.status === 'critical'
                                ? 'border-red-300 text-red-700 bg-red-100'
                                : 'border-yellow-300 text-yellow-700 bg-yellow-100'
                            }
                          >
                            {status.status === 'expired' 
                              ? 'Vencida' 
                              : status.status === 'critical'
                              ? `${status.days} días`
                              : `${status.days} días`
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {expiringClients.length > 5 && (
                  <p className="text-sm text-gray-600 text-center">
                    Y {expiringClients.length - 5} más...
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-2">
                <Users className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">No se encontraron clientes</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No hay clientes que coincidan con "${searchTerm}" en el filtro seleccionado.`
                    : 'No hay clientes en el filtro seleccionado.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const subscription = (client as any).subscription
            const subscriptionStatus = subscription?.startDate && subscription?.endDate 
              ? getSubscriptionStatus(subscription.startDate, subscription.endDate)
              : null
            
            return (
              <Card 
                key={client.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedClient === client.id ? 'ring-2 ring-primary-500' : ''
                } ${subscriptionStatus ? getSubscriptionHighlightClass(subscriptionStatus.status) : ''}`}
                onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={client.profileImage} alt={client.name} />
                      <AvatarFallback>
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <p className="text-sm text-gray-600">{client.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {client.age > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {client.age} años
                            </Badge>
                          )}
                          {subscription?.type && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSubscriptionColor(subscription.type)}`}
                            >
                              {getSubscriptionName(subscription.type)}
                            </Badge>
                          )}
                          {subscriptionStatus && (
                            <Badge 
                              variant="outline" 
                              className={
                                subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'critical'
                                  ? 'border-red-300 text-red-700 bg-red-100 text-xs'
                                  : subscriptionStatus.status === 'warning' || subscriptionStatus.status === 'halfway'
                                  ? 'border-yellow-300 text-yellow-700 bg-yellow-100 text-xs'
                                  : 'text-xs'
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
                          )}
                        </div>
                      </div>
                      
                      {/* Contact & Physical Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone || 'No especificado'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Miembro desde {formatDate(client.joinDate)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>
                            {client.weight > 0 && client.height > 0 
                              ? `${client.weight}kg / ${client.height}cm`
                              : 'Medidas no especificadas'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Goals & Routines */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {getClientGoals(client.id).slice(0, 3).map((goal, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                          {getClientGoals(client.id).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{getClientGoals(client.id).length - 3} más
                            </Badge>
                          )}
                        </div>
                        
                        {(client as any).assignedRoutines?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {(client as any).assignedRoutines.length} rutina{(client as any).assignedRoutines.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      {((client as any).notes || (client as any).emergencyContact || (client as any).medicalConditions) && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {(client as any).notes && (
                              <span>📝 Notas disponibles</span>
                            )}
                            {(client as any).emergencyContact && (
                              <span>🚨 Contacto de emergencia</span>
                            )}
                            {(client as any).medicalConditions && (
                              <span>🏥 Condiciones médicas</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenewSubscription(client.id)
                          }}
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Renovar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(client.id)
                          }}
                          className="flex-1 bg-primary-600 hover:bg-primary-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssignRoutine(client.id)
                          }}
                          className="flex-1"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          Asignar Rutina
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalles del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const client = clients.find(c => c.id === selectedClient)
                if (!client) return null
                
                return (
                  <>
                    {/* Basic Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={client.profileImage} />
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
                    
                    {/* Physical & Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                      {client.age > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Edad</p>
                          <p className="text-lg font-semibold">{client.age} años</p>
                        </div>
                      )}
                      {client.weight > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Peso</p>
                          <p className="text-lg font-semibold">{client.weight} kg</p>
                        </div>
                      )}
                      {client.height > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Altura</p>
                          <p className="text-lg font-semibold">{client.height} cm</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-600">Miembro desde</p>
                        <p className="text-lg font-semibold">{formatDate(client.joinDate)}</p>
                      </div>
                    </div>
                    
                    {/* Goals */}
                    {getClientGoals(client.id).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Metas de Entrenamiento</p>
                        <div className="flex flex-wrap gap-2">
                          {getClientGoals(client.id).map((goal, index) => (
                            <Badge key={index} variant="secondary">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subscription Details */}
                    {(client as any).subscription?.type && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Suscripción</p>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {getSubscriptionName((client as any).subscription.type)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={getSubscriptionColor((client as any).subscription.type)}
                            >
                              {(client as any).subscription.type}
                            </Badge>
                          </div>
                          {(client as any).subscription.startDate && (
                            <p className="text-sm text-gray-600">
                              <strong>Inicio:</strong> {(client as any).subscription.startDate}
                            </p>
                          )}
                          {(client as any).subscription.endDate && (
                            <p className="text-sm text-gray-600">
                              <strong>Fin:</strong> {(client as any).subscription.endDate}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assigned Routines */}
                    {(client as any).assignedRoutines?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Rutinas Asignadas</p>
                        <div className="space-y-2">
                          {(client as any).assignedRoutines.map((routineId: string, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              Rutina #{index + 1} (ID: {routineId})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    {((client as any).notes || (client as any).emergencyContact || (client as any).medicalConditions) && (
                      <div className="space-y-4">
                                                 {(client as any).emergencyContact && (
                           <div>
                             <p className="text-sm font-medium text-gray-600 mb-1">Contacto de Emergencia</p>
                             <p className="text-sm">{(client as any).emergencyContact}</p>
                           </div>
                         )}
                         
                         {(client as any).medicalConditions && (
                           <div>
                             <p className="text-sm font-medium text-gray-600 mb-1">Condiciones Médicas</p>
                             <p className="text-sm">{(client as any).medicalConditions}</p>
                           </div>
                         )}
                         
                         {(client as any).notes && (
                           <div>
                             <p className="text-sm font-medium text-gray-600 mb-1">Notas Adicionales</p>
                             <p className="text-sm">{(client as any).notes}</p>
                           </div>
                         )}
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" className="flex-1">
                        Editar
                      </Button>
                      <Button className="flex-1 bg-primary-600 hover:bg-primary-700">
                        Ver Progreso
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Renewal Modal */}
      {isRenewalModalOpen && clientIdFromPath && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseRenewalModal}
        >
          <Card 
            className="w-full max-w-md overflow-hidden"
            onClick={handleModalContentClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white sticky top-0 z-10 border-b">
              <CardTitle>Renovar Suscripción</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseRenewalModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Renovar suscripción para{' '}
                  <span className="font-semibold">
                    {clients.find(c => c.id === clientIdFromPath)?.name}
                  </span>
                </p>
              </div>

              {/* Client Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={clients.find(c => c.id === clientIdFromPath)?.profileImage} />
                  <AvatarFallback>
                    {clients.find(c => c.id === clientIdFromPath)?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {clients.find(c => c.id === clientIdFromPath)?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {(clients.find(c => c.id === clientIdFromPath) as any)?.subscription?.type || 'Sin suscripción'}
                  </p>
                </div>
              </div>

              {/* Current Subscription Info */}
              {(clients.find(c => c.id === clientIdFromPath) as any)?.subscription?.endDate && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Suscripción Actual</p>
                  <p className="text-xs text-yellow-700">
                    Vence: {(clients.find(c => c.id === clientIdFromPath) as any)?.subscription?.endDate}
                  </p>
                </div>
              )}

              {/* Renewal Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Nueva fecha de vencimiento
                </label>
                <Input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Selecciona hasta cuándo renovar la suscripción
                </p>
              </div>

              {/* Quick Date Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Opciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date()
                      date.setMonth(date.getMonth() + 3)
                      setRenewalDate(date.toISOString().split('T')[0])
                    }}
                    className="text-xs"
                  >
                    3 meses
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date()
                      date.setMonth(date.getMonth() + 6)
                      setRenewalDate(date.toISOString().split('T')[0])
                    }}
                    className="text-xs"
                  >
                    6 meses
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date()
                      date.setFullYear(date.getFullYear() + 1)
                      setRenewalDate(date.toISOString().split('T')[0])
                    }}
                    className="text-xs"
                  >
                    1 año
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = new Date()
                      date.setFullYear(date.getFullYear() + 2)
                      setRenewalDate(date.toISOString().split('T')[0])
                    }}
                    className="text-xs"
                  >
                    2 años
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCloseRenewalModal}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                  onClick={handleRenewSubscriptionSubmit}
                  disabled={!renewalDate}
                >
                  Renovar Suscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Routine Modal */}
      {showRoutineModal && clientForRoutine && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseRoutineModal}
        >
          <Card 
            className="w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={handleModalContentClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white sticky top-0 z-10 border-b">
              <CardTitle>Asignar Rutina</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseRoutineModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <div className="max-h-[calc(80vh-80px)] overflow-y-auto">
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Selecciona una rutina y días para{' '}
                    <span className="font-semibold">
                      {clients.find(c => c.id === clientForRoutine)?.name}
                    </span>
                  </p>
                </div>
                
                {/* Debug Info */}
                <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
                  <p>Modal abierto: {showRoutineModal ? 'Sí' : 'No'}</p>
                  <p>Cliente: {clientForRoutine}</p>
                  <p>Rutina seleccionada: {selectedRoutineForAssignment || 'Ninguna'}</p>
                  <p>Días seleccionados: {selectedDaysForClient.length}</p>
                </div>
                
                {/* Routine Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">1. Selecciona una Rutina</p>
                  <div className="space-y-2">
                    {mockRoutines.map((routine) => (
                      <Card 
                        key={routine.id}
                        className={`cursor-pointer transition-all ${
                          selectedRoutineForAssignment === routine.id 
                            ? 'ring-2 ring-primary-500 bg-primary-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleSelectRoutine(routine.id)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{routine.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {routine.daysPerWeek} días/semana
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{routine.description}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{routine.duration} semanas</span>
                              <span>•</span>
                              <span>{routine.workouts.length} entrenamientos</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Day Selection */}
                {selectedRoutineForAssignment && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">2. Selecciona los Días</p>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.key}
                          variant={selectedDaysForClient.includes(day.key) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDayToggle(day.key)}
                          className="justify-start"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    {selectedDaysForClient.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Días seleccionados: {formatSelectedDays(selectedDaysForClient)}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Assign Button */}
                {selectedRoutineForAssignment && selectedDaysForClient.length > 0 && (
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-primary-600 hover:bg-primary-700"
                      onClick={handleAssignRoutineToClient}
                    >
                      Asignar Rutina
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>
      )}

      {/* Client Creator Modal */}
      <ClientCreator
        isOpen={isClientCreatorOpen}
        onClose={closeClientCreator}
        onSave={handleCreateClient}
      />
    </div>
  )
}

export default Clients 