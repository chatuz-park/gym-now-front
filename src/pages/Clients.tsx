import React, { useState, useEffect } from 'react'
import { Search, Plus, Phone, Mail, Calendar, CreditCard, Target, Users, Clock, AlertTriangle, AlertCircle, ChevronDown, ChevronRight, RefreshCw, Eye, X, Edit, Trash2 } from 'lucide-react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import ClientCreator from '../components/ClientCreator'
import RoutineEditor from '../components/RoutineEditor'

import { formatDate } from '../lib/utils'
import { usePaginatedApi, useApi } from '../hooks/useApi'
import { clientsAPI, routinesAPI, clientRoutinesAPI } from '../lib/api'
import type { Client, Routine } from '../lib/api'
import { 
  DAYS_OF_WEEK, 
  getSubscriptionStatus, 
  getSubscriptionHighlightClass, 
  getSubscriptionColor, 
  getSubscriptionName,
  formatSelectedDays 
} from '../definitions'
import toast, { Toaster } from 'react-hot-toast'

const Clients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { id: clientIdFromPath } = useParams<{ id: string }>()

  const [expiringAccordionOpen, setExpiringAccordionOpen] = useState(false)
  const [selectedRoutineForAssignment, setSelectedRoutineForAssignment] = useState<string | null>(null)
  const [selectedDaysForClient, setSelectedDaysForClient] = useState<string[]>([])
  const [renewalDate, setRenewalDate] = useState('')
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Hook para cargar clientes desde la API
  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
    execute: loadClients,
    refresh: refreshClients
  } = usePaginatedApi(clientsAPI.getAll)

  // Hook para cargar rutinas desde la API
  const {
    data: routines,
    loading: routinesLoading,
    error: routinesError,
    execute: loadRoutines
  } = usePaginatedApi(routinesAPI.getAll)

  // Hook para asignar rutinas a clientes
  const {
    execute: assignRoutineToClient,
    loading: assigningRoutine
  } = useApi(clientRoutinesAPI.create)

  // Hook para eliminar clientes
  const {
    execute: deleteClient,
    loading: deletingClient
  } = useApi(clientsAPI.delete)

  // Cargar clientes y rutinas al montar el componente
  useEffect(() => {
    loadClients()
    loadRoutines()
  }, [loadClients, loadRoutines])

  // Usar las constantes importadas de definitions.ts

  // Get modal state from URL params
  const isClientCreatorOpen = searchParams.get('modal') === 'create-client'
  const isRenewalModalOpen = searchParams.get('modal') === 'renew-subscription' && !!clientIdFromPath
  const isAssignRoutineModalOpen = searchParams.get('modal') === 'assign-routine' && !!searchParams.get('id')
  const isEditRoutinesModalOpen = searchParams.get('modal') === 'edit-routines' && !!searchParams.get('id')
  const searchTerm = searchParams.get('search') || ''
  const activeFilter = searchParams.get('filter') || 'all'

  // Cargar rutinas asignadas del cliente cuando se abre el modal
  useEffect(() => {
    if (isAssignRoutineModalOpen && searchParams.get('id')) {
      const clientId = searchParams.get('id')
      const client = clients.find(c => c.id.toString() === clientId)
      
      if (client && client.assigned_routines && client.assigned_routines.length > 0) {
        // Obtener los IDs de las rutinas asignadas
        const assignedRoutineIds = client.assigned_routines.map(routine => {
          if (typeof routine === 'number') {
            return routine
          }
          // Cast para acceder a la estructura correcta
          const assignedRoutine = routine as any
          return assignedRoutine.routine?.id
        })
        
        // Si hay rutinas asignadas, seleccionar la primera por defecto
        if (assignedRoutineIds.length > 0) {
          setSelectedRoutineForAssignment(assignedRoutineIds[0].toString())
        }
      }
      
      // Limpiar los días seleccionados al abrir el modal
      setSelectedDaysForClient([])
    }
  }, [isAssignRoutineModalOpen, searchParams, clients])

  // Filter clients based on search term and active filter
  const getFilteredClients = () => {
    let filtered = clients

    // Apply filter
    switch (activeFilter) {
      case 'active':
        filtered = clients.filter(c => {
          if (!c.subscription_type || !c.subscription_start || !c.subscription_end) return false
          
          const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
          return status.status === 'active' || status.status === 'halfway' || status.status === 'warning' || status.status === 'pending'
        })
        break
      case 'premium':
        filtered = clients.filter(c => c.subscription_type === 'premium')
        break
      case 'with-routines':
        filtered = clients.filter(c => c.assigned_routines?.length > 0)
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
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Si la suscripción aún no ha comenzado
    if (daysUntilStart > 0) {
      return { status: 'pending', days: daysUntilStart, progress: 0 }
    }
    
    // Si la suscripción ha expirado
    if (daysUntilExpiration < 0) {
      return { status: 'expired', days: daysUntilExpiration, progress: 1 }
    }
    
    // Si está por vencer (7 días o menos)
    if (daysUntilExpiration <= 7) {
      return { status: 'critical', days: daysUntilExpiration, progress }
    }
    
    // Si está en advertencia (30 días o menos)
    if (daysUntilExpiration <= 30) {
      return { status: 'warning', days: daysUntilExpiration, progress }
    }
    
    // Si está a más del 50% de su duración
    if (progress > 0.5) {
      return { status: 'halfway', days: daysUntilExpiration, progress }
    }
    
    // Suscripción activa
    return { status: 'active', days: daysUntilExpiration, progress }
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
      if (!client.subscription_start || !client.subscription_end) return false
      
      const status = getSubscriptionStatus(client.subscription_start, client.subscription_end)
      return status.status === 'critical' || status.status === 'warning' || status.status === 'expired'
    }).sort((a, b) => {
      const statusA = getSubscriptionStatus(a.subscription_start!, a.subscription_end!)
      const statusB = getSubscriptionStatus(b.subscription_start!, b.subscription_end!)
      return statusA.days - statusB.days
    })
  }

  const expiringClients = getExpiringClients()

  const filteredClients = getFilteredClients()

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'Todos', count: clients.length, icon: Users },
    { id: 'active', label: 'Activos', count: clients.filter(c => {
      if (!c.subscription_type || !c.subscription_start || !c.subscription_end) return false
      
      const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
      return status.status === 'active' || status.status === 'halfway' || status.status === 'warning' || status.status === 'pending'
    }).length, icon: Target },
    { id: 'premium', label: 'Premium', count: clients.filter(c => c.subscription_type === 'premium').length, icon: CreditCard },
    { id: 'with-routines', label: 'Con Rutinas', count: clients.filter(c => c.assigned_routines?.length > 0).length, icon: Clock },
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
      toast.error('Por favor selecciona una fecha de renovación')
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
    navigate(`/clients/${clientId}?modal=edit-client`)
  }

  const handleAssignRoutine = (clientId: string) => {
    console.log('Opening routine assignment modal for client:', clientId)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'assign-routine')
    newParams.set('id', clientId)
    setSearchParams(newParams)
  }

  const handleEditRoutines = (clientId: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'edit-routines')
    newParams.set('id', clientId)
    setSearchParams(newParams)
  }

  const handleCloseEditRoutinesModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    newParams.delete('id')
    setSearchParams(newParams)
  }

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client)
  }

  const handleCloseDeleteModal = () => {
    setClientToDelete(null)
  }

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      await deleteClient(clientToDelete.id)
      toast.success(`Cliente ${clientToDelete.name} eliminado exitosamente`)
      refreshClients()
      handleCloseDeleteModal()
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      toast.error('Error al eliminar el cliente. Por favor, inténtalo de nuevo.')
    }
  }

  const handleCloseRoutineModal = () => {
    console.log('Closing routine assignment modal')
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    newParams.delete('id')
    setSearchParams(newParams)
    setSelectedRoutineForAssignment(null)
    setSelectedDaysForClient([])
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleSelectRoutine = (routineId: string) => {
    setSelectedRoutineForAssignment(routineId)
    
    // Limpiar los días seleccionados para nueva asignación
    setSelectedDaysForClient([])
  }

  const handleDayToggle = (day: string) => {
    console.log('Toggling day:', day)
    setSelectedDaysForClient(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleAssignRoutineToClient = async () => {
    if (!selectedRoutineForAssignment || selectedDaysForClient.length === 0) {
      toast.error('Por favor selecciona una rutina y al menos un día')
      return
    }

    const clientId = searchParams.get('id')
    if (!clientId) {
      toast.error('Error: No se pudo identificar el cliente')
      return
    }

    try {
      // Crear objeto con los días asignados
      const assignedDays: { [key: string]: boolean } = {}
      selectedDaysForClient.forEach(day => {
        assignedDays[day] = true
      })

      // Asignar rutina al cliente
      await assignRoutineToClient({
        client_id: parseInt(clientId),
        routine_id: parseInt(selectedRoutineForAssignment),
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        assigned_days: assignedDays
      })

      // Actualizar la lista de clientes
      refreshClients()
      
      // Cerrar modal y limpiar estado
      handleCloseRoutineModal()
      
      // Mostrar mensaje de éxito
      toast.success('Rutina asignada exitosamente')
    } catch (error) {
      console.error('Error al asignar rutina:', error)
      toast.error('Error al asignar la rutina. Por favor, inténtalo de nuevo.')
    }
  }

  const formatSelectedDays = (days: string[]) => {
    return days.map(day => {
      const dayInfo = DAYS_OF_WEEK.find(d => d.key === day)
      return dayInfo ? dayInfo.label : day
    }).join(', ')
  }

  const handleCreateClient = (clientData: any) => {
    // El cliente ya fue creado en la API, solo necesitamos actualizar la lista
    refreshClients()
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

  const getPreviouslyAssignedDays = (routineId: string) => {
    const clientId = searchParams.get('id')
    const client = clients.find(c => c.id.toString() === clientId)
    
    if (client?.assigned_routines) {
      const assignedRoutine = client.assigned_routines.find(routine => {
        if (typeof routine === 'number') {
          return routine.toString() === routineId
        }
        const assignedRoutine = routine as any
        return assignedRoutine.routine?.id?.toString() === routineId
      })
      
      if (assignedRoutine && typeof assignedRoutine !== 'number') {
        const assignedRoutineData = assignedRoutine as any
        if (assignedRoutineData.assigned_days) {
          // Convertir assigned_days de objeto a array de strings
          return Object.keys(assignedRoutineData.assigned_days).filter(day => 
            assignedRoutineData.assigned_days[day]
          )
        }
      }
    }
    return []
  }

  const isDayPreviouslyAssigned = (dayKey: string) => {
    if (!selectedRoutineForAssignment) return false
    const previouslyAssignedDays = getPreviouslyAssignedDays(selectedRoutineForAssignment)
    return previouslyAssignedDays.includes(dayKey)
  }

  // Función para obtener todos los días asignados de todas las rutinas del cliente
  const getAllAssignedDays = () => {
    const clientId = searchParams.get('id')
    const client = clients.find(c => c.id.toString() === clientId)
    
    if (!client?.assigned_routines) return {}
    
    const allDays: { [key: string]: string[] } = {}
    
    client.assigned_routines.forEach(assignedRoutine => {
      if (typeof assignedRoutine === 'number') return
      
      const assignedRoutineData = assignedRoutine as any
      if (assignedRoutineData.assigned_days) {
        const routineDays = Object.keys(assignedRoutineData.assigned_days).filter(day => 
          assignedRoutineData.assigned_days[day]
        )
        
        routineDays.forEach(day => {
          if (!allDays[day]) {
            allDays[day] = []
          }
          allDays[day].push(assignedRoutineData.routine?.name || 'Rutina')
        })
      }
    })
    
    return allDays
  }

  // Función para verificar si un día está sobrecargado (tiene múltiples rutinas)
  const isDayOverloaded = (dayKey: string) => {
    const allDays = getAllAssignedDays()
    return allDays[dayKey] && allDays[dayKey].length > 1
  }

  // Función para obtener las rutinas que están asignadas a un día específico
  const getRoutinesForDay = (dayKey: string) => {
    const allDays = getAllAssignedDays()
    return allDays[dayKey] || []
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
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
                  const status = getSubscriptionStatus(client.subscription_start!, client.subscription_end!)
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
                            <AvatarImage src={client.profile_image} alt={client.name} />
                            <AvatarFallback className="text-xs">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">
                              {getSubscriptionName(client.subscription_type || 'standard')} - Vence {client.subscription_end}
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
            const subscriptionStatus = client.subscription_start && client.subscription_end 
              ? getSubscriptionStatus(client.subscription_start, client.subscription_end)
              : null
            
            return (
              <Card 
                key={client.id} 
                className={`transition-all hover:shadow-md ${
                  subscriptionStatus ? getSubscriptionHighlightClass(subscriptionStatus.status) : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={client.profile_image} alt={client.name} />
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
                          {client.subscription_type && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSubscriptionColor(client.subscription_type)}`}
                            >
                              {getSubscriptionName(client.subscription_type)}
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
                          <span>Miembro desde {formatDate(client.join_date)}</span>
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
                        
                        {client.assigned_routines?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {client.assigned_routines.length} rutina{client.assigned_routines.length > 1 ? 's' : ''}
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
                        {client.assigned_routines?.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRoutines(client.id)
                            }}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar Rutinas
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClient(client)
                          }}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
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
      {isAssignRoutineModalOpen && searchParams.get('id') && (
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
              <CardContent className="space-y-6">
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    Selecciona una rutina y los días de la semana para{' '}
                    <span className="font-semibold">
                      {clients.find(c => c.id === searchParams.get('id'))?.name}
                    </span>
                  </p>
                </div>
                
                {/* Routine Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">1. Selecciona una Rutina</p>
                  {routinesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Cargando rutinas...</p>
                    </div>
                  ) : routinesError ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-600">Error al cargar rutinas: {routinesError}</p>
                    </div>
                  ) : routines && routines.length > 0 ? (
                    <div className="space-y-2">
                      {routines.map((routine) => {
                        const clientId = searchParams.get('id')
                        const client = clients.find(c => c.id.toString() === clientId)
                        const isAlreadyAssigned = client?.assigned_routines?.some(assignedRoutine => {
                          // Si assignedRoutine es un número, comparar directamente
                          if (typeof assignedRoutine === 'number') {
                            return assignedRoutine === routine.id
                          }
                          // Si assignedRoutine es un objeto, comparar con routine.id
                          return assignedRoutine.routine?.id === routine.id
                        })
                        
                        return (
                          <Card 
                            key={routine.id}
                            className={`transition-all ${
                              isAlreadyAssigned
                                ? 'ring-1 ring-green-500 bg-green-50 cursor-not-allowed opacity-75'
                                : selectedRoutineForAssignment === routine.id 
                                ? 'ring-2 ring-primary-500 bg-primary-50 cursor-pointer' 
                                : 'hover:shadow-md cursor-pointer'
                            }`}
                            onClick={() => !isAlreadyAssigned && handleSelectRoutine(routine.id)}
                          >
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold text-sm">{routine.name}</h4>
                                    {isAlreadyAssigned && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-500">
                                        Ya Asignada
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {routine.days_per_week} días/semana
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{routine.description}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{routine.duration} semanas</span>
                                  <span>•</span>
                                  <span>{routine.workouts.length} entrenamientos</span>
                                </div>
                                {isAlreadyAssigned && (
                                  <p className="text-xs text-green-600 font-medium">
                                    Esta rutina ya está asignada al cliente
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">No hay rutinas disponibles</p>
                    </div>
                  )}
                </div>

                {/* Day Selection */}
                {selectedRoutineForAssignment && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">2. Selecciona los Días</p>
                    
                    <div className="flex flex-wrap gap-1 justify-center">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = selectedDaysForClient.includes(day.key)
                        const isPreviouslyAssigned = isDayPreviouslyAssigned(day.key)
                        const isOverloaded = isDayOverloaded(day.key)
                        const routinesForDay = getRoutinesForDay(day.key)
                        
                        return (
                          <Button
                            key={day.key}
                            variant="outline"
                            size="sm"
                            onClick={() => handleDayToggle(day.key)}
                            className={`text-xs px-2 py-1 ${
                              isSelected
                                ? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100' 
                                : isPreviouslyAssigned
                                ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                                : isOverloaded
                                ? 'bg-yellow-50 border-yellow-300 text-yellow-600 hover:bg-yellow-100'
                                : 'hover:bg-gray-50'
                            }`}
                            title={
                              isOverloaded 
                                ? `Sobrecargado: ${routinesForDay.join(', ')}` 
                                : isPreviouslyAssigned 
                                ? `Ya asignado: ${day.label}` 
                                : day.label
                            }
                          >
                            {day.short}
                            {isOverloaded && (
                              <span className="ml-1 text-xs font-bold">!</span>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                    {selectedDaysForClient.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Días seleccionados: {formatSelectedDays(selectedDaysForClient)}
                      </p>
                    )}
                    
                    {/* Información sobre días sobrecargados */}
                    {(() => {
                      const overloadedDays = DAYS_OF_WEEK.filter(day => isDayOverloaded(day.key))
                      if (overloadedDays.length > 0) {
                        return (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                            <p className="text-xs font-medium text-orange-800 mb-1">
                              ⚠️ Días con múltiples rutinas:
                            </p>
                            <div className="space-y-1">
                              {overloadedDays.map(day => {
                                const routines = getRoutinesForDay(day.key)
                                return (
                                  <p key={day.key} className="text-xs text-orange-700">
                                    <span className="font-medium">{day.label}:</span> {routines.join(', ')}
                                  </p>
                                )
                              })}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}
                
                {/* Assign Button */}
                {selectedRoutineForAssignment && selectedDaysForClient.length > 0 && (
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-primary-600 hover:bg-primary-700"
                      onClick={handleAssignRoutineToClient}
                      disabled={assigningRoutine}
                    >
                      {assigningRoutine ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Asignando...
                        </>
                      ) : (
                        'Asignar Rutina'
                      )}
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

      {/* Edit Routines Modal */}
      {isEditRoutinesModalOpen && searchParams.get('id') && (
        <RoutineEditor
          isOpen={isEditRoutinesModalOpen}
          onClose={handleCloseEditRoutinesModal}
          clientId={searchParams.get('id')!}
          onRoutinesUpdated={() => {
            refreshClients()
          }}
        />
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseDeleteModal}
        >
          <Card 
            className="w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white sticky top-0 z-10 border-b">
              <CardTitle className="text-red-600">Eliminar Cliente</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDeleteModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Estás seguro de que quieres eliminar este cliente?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Esta acción no se puede deshacer. Se eliminarán todos los datos del cliente, incluyendo:
                </p>
                <ul className="text-sm text-gray-600 text-left space-y-1 mb-6">
                  <li>• Información personal</li>
                  <li>• Rutinas asignadas</li>
                  <li>• Progreso y métricas</li>
                  <li>• Historial de entrenamientos</li>
                </ul>
                <div className="bg-gray-50 p-3 rounded-lg mb-6">
                  <p className="text-sm font-medium text-gray-900">
                    Cliente a eliminar: <span className="text-red-600">{clientToDelete.name}</span>
                  </p>
                  <p className="text-xs text-gray-600">{clientToDelete.email}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleCloseDeleteModal}
                  className="flex-1"
                  disabled={deletingClient}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmDeleteClient}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={deletingClient}
                >
                  {deletingClient ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar Cliente'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Clients 