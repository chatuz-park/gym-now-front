import React, { useState, useEffect } from 'react'
import { Search, Plus, Phone, Calendar, CreditCard, Target, Users, Clock, AlertTriangle, ChevronDown, ChevronRight, RefreshCw, Eye, X, Edit, Trash2, Ruler } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import ClientCreator from '../components/ClientCreator'
import RoutineEditor from '../components/RoutineEditor'
import AddMeasurementsModal from '../components/AddMeasurementsModal'
import type { MeasurementForm } from '../components/AddMeasurementsModal'

import { formatDate, calculateAge } from '../lib/utils'
import { useDebounce } from '../hooks/useDebounce'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useClientsQuery, useDeleteClientMutation, usePatchClientMutation } from '../hooks/useClients'
import { useRoutinesQuery } from '../hooks/useRoutines'
import { useCreateClientRoutineMutation } from '../hooks/useClientRoutines'
import { useClientProgressMetricsQuery, useCreateProgressMetricsMutation } from '../hooks/useProgress'
import { handleApiError, getAssignedRoutineId, normalizeAssignedDays } from '../lib/api'
import type { AssignedRoutineRef, Client, Plan } from '../lib/api'
import { usePlansQuery } from '../hooks/usePlans'
import { 
  DAYS_OF_WEEK,
  getPlanColorClass
} from '../definitions'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { canDeleteClient } from '../lib/rbac'

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return ''
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return match ? match[1] : value
}

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toLocalDateInputValue(date)
}

const Clients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canRemoveClient = canDeleteClient(user?.role)

  const [expiringAccordionOpen, setExpiringAccordionOpen] = useState(false)
  const [selectedRoutineForAssignment, setSelectedRoutineForAssignment] = useState<string | null>(null)
  const [selectedDaysForClient, setSelectedDaysForClient] = useState<string[]>([])
  const [renewalClient, setRenewalClient] = useState<Client | null>(null)
  const [renewalStartDate, setRenewalStartDate] = useState('')
  const [renewalEndDate, setRenewalEndDate] = useState('')
  const [renewalPlanSlug, setRenewalPlanSlug] = useState('')
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [searchInputValue, setSearchInputValue] = useState('')
  const [isAddMeasurementsModalOpen, setIsAddMeasurementsModalOpen] = useState(false)
  const [selectedClientForMeasurements, setSelectedClientForMeasurements] = useState<Client | null>(null)
  const [measurementDate, setMeasurementDate] = useState('')
  const [measurements, setMeasurements] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    biceps: '',
    forearms: '',
    thighs: '',
    calves: '',
    neck: '',
    shoulders: '',
    hips: ''
  })

  const isClientCreatorOpen = searchParams.get('modal') === 'create-client'
  const isRenewalModalOpen = !!renewalClient
  const isAssignRoutineModalOpen = searchParams.get('modal') === 'assign-routine' && !!searchParams.get('id')
  const isEditRoutinesModalOpen = searchParams.get('modal') === 'edit-routines' && !!searchParams.get('id')
  useLockBodyScroll(isRenewalModalOpen || isAssignRoutineModalOpen || !!clientToDelete)
  const searchTerm = searchParams.get('search') || ''
  const activeFilter = searchParams.get('filter') || 'all'

  const clientsQuery = useClientsQuery({ search: searchTerm, filter: activeFilter })
  const plansQuery = usePlansQuery(undefined, { enabled: isRenewalModalOpen })
  const catalogPlans = plansQuery.data ?? []
  const routinesQuery = useRoutinesQuery()
  const assignRoutineMutation = useCreateClientRoutineMutation()
  const patchClientMutation = usePatchClientMutation()
  const deleteClientMutation = useDeleteClientMutation()
  const addProgressMutation = useCreateProgressMetricsMutation()

  const clients = clientsQuery.data ?? { count: 0, next: null, previous: null, results: [] }
  const routines = routinesQuery.data ?? { count: 0, next: null, previous: null, results: [] }
  const routinesLoading = routinesQuery.isPending
  const routinesError = routinesQuery.error ? handleApiError(routinesQuery.error) : null
  const assigningRoutine = assignRoutineMutation.isPending
  const deletingClient = deleteClientMutation.isPending
  const addingMeasurements = addProgressMutation.isPending
  const renewingSubscription = patchClientMutation.isPending

  // Debounce the search input value
  const debouncedSearchValue = useDebounce(searchInputValue, 500)

  // Initialize search input value from URL params
  useEffect(() => {
    setSearchInputValue(searchTerm)
  }, [searchTerm])

  // Update URL params when debounced search value changes
  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (currentSearch === debouncedSearchValue) return
    const newParams = new URLSearchParams(searchParams)
    if (debouncedSearchValue) {
      newParams.set('search', debouncedSearchValue)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }, [debouncedSearchValue, searchParams, setSearchParams])

  const selectedMeasurementsClientId = selectedClientForMeasurements?.id
  const { data: clientProgress } = useClientProgressMetricsQuery(
    selectedMeasurementsClientId
      ? { client_id: selectedMeasurementsClientId, ordering: '-date' }
      : undefined,
    { enabled: isAddMeasurementsModalOpen && !!selectedMeasurementsClientId }
  )

  // Cargar rutinas asignadas del cliente cuando se abre el modal
  useEffect(() => {
    if (isAssignRoutineModalOpen && searchParams.get('id')) {
      const clientId = searchParams.get('id')
      const client = clients.results.find(c => c.id.toString() === clientId)
      
      if (client && client.assigned_routines && client.assigned_routines.length > 0) {
        // Obtener los IDs de las rutinas asignadas
        const assignedRoutineIds = client.assigned_routines
          .map((routine) => getAssignedRoutineId(routine))
          .filter((id): id is number => typeof id === 'number')
        
        // Si hay rutinas asignadas, seleccionar la primera por defecto
        if (assignedRoutineIds.length > 0) {
          setSelectedRoutineForAssignment(assignedRoutineIds[0].toString())
        }
      }
      
      // Limpiar los días seleccionados al abrir el modal
      setSelectedDaysForClient([])
    }
  }, [isAssignRoutineModalOpen, searchParams, clients])

  // Get filtered clients (filtering is now handled by API)
  const getFilteredClients = () => {
    return clients.results
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

  const filteredClients = getFilteredClients()
  const assignRoutineClient = clients.results.find(c => c.id.toString() === searchParams.get('id'))

  // Filter options - counts are based on total counts from API
  const filterOptions = [
    { id: 'all', label: 'Todos', count: clients.count, icon: Users },
    { id: 'active', label: 'Activos', count: clients.results.filter(c => {
      if (!c.subscription_type || !c.subscription_start || !c.subscription_end) return false
      
      const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
      return status.status === 'active' || status.status === 'halfway' || status.status === 'warning' || status.status === 'pending'
    }).length, icon: Target },
    { id: 'premium', label: 'Premium', count: clients.results.filter(c => c.subscription_type === 'premium').length, icon: CreditCard },
    { id: 'with-routines', label: 'Con Rutinas', count: clients.results.filter(c => c.assigned_routines?.length > 0).length, icon: Clock },
    { id: 'expiring', label: 'Por Vencer', count: clients.results.filter(c => {
      if (!c.subscription_start || !c.subscription_end) return false
      
      const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
      return status.status === 'critical' || status.status === 'warning' || status.status === 'expired'
    }).length, icon: AlertTriangle }
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

  const getClientGoals = (clientId: string | number): string[] => {
    const client = clients.results.find(c => c.id.toString() === clientId.toString())
    return Array.isArray(client?.goals) ? client.goals.map(String) : []
  }

  const getSubscriptionColor = (type: string, color?: string) => {
    if (color) return getPlanColorClass(color)
    switch (type) {
      case 'premium': return 'border-purple-200 text-purple-700 bg-purple-50'
      case 'personalized': return 'border-green-200 text-green-700 bg-green-50'
      default: return 'border-blue-200 text-blue-700 bg-blue-50'
    }
  }

  const getSubscriptionName = (type: string, planName?: string) => {
    if (planName) return planName
    switch (type) {
      case 'premium': return 'Premium'
      case 'personalized': return 'Personalizada'
      default: return type || 'Estándar'
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

  const handleRenewSubscription = (client: Client) => {
    setRenewalClient(client)
    setRenewalStartDate(toDateInputValue(client.subscription_start))
    setRenewalEndDate(toDateInputValue(client.subscription_end))
    setRenewalPlanSlug(client.subscription_type || '')
  }

  const handleCloseRenewalModal = () => {
    setRenewalClient(null)
    setRenewalStartDate('')
    setRenewalEndDate('')
    setRenewalPlanSlug('')
  }

  const selectedRenewalPlan = catalogPlans.find((plan) => plan.slug === renewalPlanSlug)
  const renewalDurationDays = selectedRenewalPlan?.duration_days || 30

  const applyQuickRenewalDates = () => {
    const today = toLocalDateInputValue(new Date())
    setRenewalStartDate(today)
    setRenewalEndDate(addDays(today, renewalDurationDays))
  }

  const handleSelectRenewalPlan = (plan: Plan) => {
    setRenewalPlanSlug(plan.slug)
    if (renewalStartDate) {
      setRenewalEndDate(addDays(renewalStartDate, plan.duration_days))
    }
  }

  const handleRenewSubscriptionSubmit = async () => {
    if (!renewalClient || !renewalStartDate || !renewalEndDate) {
      toast.error('Selecciona las fechas de inicio y vencimiento')
      return
    }
    if (!renewalPlanSlug) {
      toast.error('Selecciona un plan')
      return
    }
    if (renewalEndDate < renewalStartDate) {
      toast.error('La fecha de vencimiento debe ser posterior a la de inicio')
      return
    }

    try {
      await patchClientMutation.mutateAsync({
        id: renewalClient.id,
        data: {
          subscription_type: renewalPlanSlug,
          subscription_start: renewalStartDate,
          subscription_end: renewalEndDate,
        },
      })
      toast.success('Suscripción renovada')
      handleCloseRenewalModal()
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const handleViewDetails = (clientId: string | number) => {
    navigate(`/clients/${clientId}?modal=edit-client`)
  }

  const handleAssignRoutine = (clientId: string | number) => {
    console.log('Opening routine assignment modal for client:', clientId)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'assign-routine')
    newParams.set('id', clientId.toString())
    setSearchParams(newParams)
  }

  const handleEditRoutines = (clientId: string | number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'edit-routines')
    newParams.set('id', clientId.toString())
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

  const handleAddMeasurements = async (client: Client) => {
    setSelectedClientForMeasurements(client)
    setMeasurementDate(new Date().toISOString().split('T')[0])
    
    setIsAddMeasurementsModalOpen(true)
  }

  const handleCloseMeasurementsModal = () => {
    setIsAddMeasurementsModalOpen(false)
    setSelectedClientForMeasurements(null)
    setMeasurementDate('')
    setMeasurements({
      weight: '',
      body_fat: '',
      muscle_mass: '',
      chest: '',
      waist: '',
      biceps: '',
      forearms: '',
      thighs: '',
      calves: '',
      neck: '',
      shoulders: '',
      hips: ''
    })
  }

  // Función para obtener las últimas medidas del cliente
  const getLatestMeasurements = () => {
    if (!clientProgress || clientProgress.length === 0) {
      return {
        weight: '0',
        body_fat: '0',
        muscle_mass: '0',
        chest: '0',
        waist: '0',
        biceps: '0',
        forearms: '0',
        thighs: '0',
        calves: '0',
        neck: '0',
        shoulders: '0',
        hips: '0'
      }
    }

    // Obtener la medida más reciente (ya ordenada por fecha descendente)
    const latest = clientProgress[0]
    
    return {
      weight: latest.weight?.toString() || '0',
      body_fat: latest.body_fat?.toString() || '0',
      muscle_mass: latest.muscle_mass?.toString() || '0',
      chest: latest.measurements?.chest?.toString() || '0',
      waist: latest.measurements?.waist?.toString() || '0',
      biceps: latest.measurements?.biceps?.toString() || '0',
      forearms: latest.measurements?.forearms?.toString() || '0',
      thighs: latest.measurements?.thighs?.toString() || '0',
      calves: latest.measurements?.calves?.toString() || '0',
      neck: latest.measurements?.neck?.toString() || '0',
      shoulders: latest.measurements?.shoulders?.toString() || '0',
      hips: latest.measurements?.hips?.toString() || '0'
    }
  }

  const handleMeasurementChange = (field: keyof MeasurementForm, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitMeasurements = async () => {
    if (!selectedClientForMeasurements || !measurementDate) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const measurementsData = {
        client_id: selectedClientForMeasurements.id,
        date: measurementDate,
        weight: parseFloat(measurements.weight) || 0,
        body_fat: measurements.body_fat ? parseFloat(measurements.body_fat) : undefined,
        muscle_mass: measurements.muscle_mass ? parseFloat(measurements.muscle_mass) : undefined,
        measurements: {
          chest: measurements.chest ? parseFloat(measurements.chest) : 0,
          waist: measurements.waist ? parseFloat(measurements.waist) : 0,
          biceps: measurements.biceps ? parseFloat(measurements.biceps) : 0,
          forearms: measurements.forearms ? parseFloat(measurements.forearms) : 0,
          thighs: measurements.thighs ? parseFloat(measurements.thighs) : 0,
          calves: measurements.calves ? parseFloat(measurements.calves) : 0,
          neck: measurements.neck ? parseFloat(measurements.neck) : 0,
          shoulders: measurements.shoulders ? parseFloat(measurements.shoulders) : 0,
          hips: measurements.hips ? parseFloat(measurements.hips) : 0
        }
      }

      await addProgressMutation.mutateAsync(measurementsData)
      toast.success('Medidas agregadas exitosamente')
      handleCloseMeasurementsModal()
    } catch (error) {
      toast.error('Error al agregar las medidas')
      console.error('Error adding measurements:', error)
    }
  }

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id)
      toast.success(`Cliente ${clientToDelete.name} eliminado exitosamente`)
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
      await assignRoutineMutation.mutateAsync({
        client_id: parseInt(clientId),
        routine_id: parseInt(selectedRoutineForAssignment),
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        assigned_days: assignedDays
      })

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

  const handleCreateClient = () => {
    void clientsQuery.refetch()
  }

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value)
  }

  const getPreviouslyAssignedDays = (routineId: string) => {
    const clientId = searchParams.get('id')
    const client = clients.results.find(c => c.id.toString() === clientId)
    
    if (client?.assigned_routines) {
      const assignedRoutine = client.assigned_routines.find((routine) => {
        return getAssignedRoutineId(routine)?.toString() === routineId
      })

      if (assignedRoutine && typeof assignedRoutine !== 'number') {
        return normalizeAssignedDays((assignedRoutine as AssignedRoutineRef).assigned_days)
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
    const client = clients.results.find(c => c.id.toString() === clientId)
    
    if (!client?.assigned_routines) return {}
    
    const allDays: { [key: string]: string[] } = {}
    
    client.assigned_routines.forEach((assignedRoutine) => {
      if (typeof assignedRoutine === 'number') return

      const ref = assignedRoutine as AssignedRoutineRef
      const routineDays = normalizeAssignedDays(ref.assigned_days)

      routineDays.forEach((day) => {
        if (!allDays[day]) {
          allDays[day] = []
        }
        allDays[day].push(ref.routine?.name || 'Rutina')
      })
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
            value={searchInputValue}
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
                <p className="text-2xl font-bold text-gray-900">{clients.results.length}</p>
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
                  {clients.results.filter(c => {
                    if (!c.subscription_type || !c.subscription_start || !c.subscription_end) return false
                    
                    const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
                    return status.status === 'active' || status.status === 'halfway' || status.status === 'warning' || status.status === 'pending'
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
                  {clients.results.filter(c => c.subscription_type === 'premium').length}
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
                  {clients.results.filter(c => c.assigned_routines?.length > 0).length}
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
                  {clients.results.filter(c => {
                    if (!c.subscription_start || !c.subscription_end) return false
                    
                    const status = getSubscriptionStatus(c.subscription_start, c.subscription_end)
                    return status.status === 'critical' || status.status === 'warning' || status.status === 'expired'
                  }).length}
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
      {activeFilter === 'expiring' && clients.results.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <button
            className="w-full flex items-center justify-between px-6 py-4 focus:outline-none select-none"
            onClick={() => setExpiringAccordionOpen((open) => !open)}
            aria-expanded={expiringAccordionOpen}
            aria-controls="expiring-accordion-content"
          >
            <span className="flex items-center space-x-2 text-red-800 font-semibold">
              <AlertTriangle className="w-5 h-5" />
              <span>Suscripciones por Vencer ({clients.count})</span>
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
                {clients.results.slice(0, 5).map((client) => {
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
                              {getSubscriptionName(client.subscription_type || 'standard', client.plan?.name)} - Vence {client.subscription_end}
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
                {clients.count > 5 && (
                  <p className="text-sm text-gray-600 text-center">
                    Y {clients.count - 5} más...
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
                  {searchInputValue 
                    ? `No hay clientes que coincidan con "${searchInputValue}" en el filtro seleccionado.`
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
                          {client.birth_date && (
                            <Badge variant="secondary" className="text-xs">
                              {calculateAge(client.birth_date)} años
                            </Badge>
                          )}
                          {client.subscription_type && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSubscriptionColor(client.subscription_type || '', client.plan?.color)}`}
                            >
                              {getSubscriptionName(client.subscription_type || '', client.plan?.name)}
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
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {!client.notes && (
                            <span>📝 Notas disponibles</span>
                          )}
                          {client.notes && (
                            <span>📝 {client.notes}</span>
                          )}
                          {!client.emergency_contact && (
                            <span>🚨 Contacto de emergencia</span>
                          )}
                          {client.emergency_contact && (
                            <span>🚨 {client.emergency_contact} </span>
                          )}
                          {!client.medical_conditions && (
                            <span>🏥 Condiciones médicas</span>
                          )}
                          {client.medical_conditions && (
                            <span>🏥 {client.medical_conditions}</span>
                          )}
                        </div>
                      </div>
                      


                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenewSubscription(client)
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
                            handleAddMeasurements(client)
                          }}
                          className="flex-1"
                        >
                          <Ruler className="w-4 h-4 mr-1" />
                          Agregar Medidas
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
                        {canRemoveClient && (
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
                        )}
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
      {isRenewalModalOpen && (
        <div 
          className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleCloseRenewalModal}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
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
            <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-72px)]">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Renovar suscripción para{' '}
                  <span className="font-semibold">
                    {renewalClient?.name}
                  </span>
                </p>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={renewalClient?.profile_image} />
                  <AvatarFallback>
                    {renewalClient?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {renewalClient?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {getSubscriptionName(renewalPlanSlug || renewalClient?.subscription_type || '', selectedRenewalPlan?.name || renewalClient?.plan?.name)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {catalogPlans
                    .filter((plan) => plan.is_active || plan.slug === renewalPlanSlug)
                    .map((plan) => (
                      <button
                        type="button"
                        key={plan.id}
                        onClick={() => handleSelectRenewalPlan(plan)}
                        className={`rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                          renewalPlanSlug === plan.slug
                            ? 'ring-2 ring-primary-500 bg-primary-50 border-primary-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <p className="font-semibold text-sm text-gray-900">{plan.name}</p>
                        <p className="text-lg font-bold text-primary-600 mt-1">
                          ${plan.price.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{plan.duration_days} días</p>
                      </button>
                    ))}
                </div>
                {plansQuery.isPending && (
                  <p className="text-sm text-gray-500">Cargando planes…</p>
                )}
                {!plansQuery.isPending && catalogPlans.filter((plan) => plan.is_active || plan.slug === renewalPlanSlug).length === 0 && (
                  <p className="text-sm text-amber-700">
                    No hay planes activos. Un propietario debe crearlos en Planes.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Fecha de inicio
                  </label>
                  <Input
                    type="date"
                    value={renewalStartDate}
                    onChange={(e) => setRenewalStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Fecha de vencimiento
                  </label>
                  <Input
                    type="date"
                    value={renewalEndDate}
                    onChange={(e) => setRenewalEndDate(e.target.value)}
                    min={renewalStartDate || undefined}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={applyQuickRenewalDates}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Renovar fechas
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Pone el inicio en hoy y el vencimiento según el plan ({renewalDurationDays} días)
              </p>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCloseRenewalModal}
                  disabled={renewingSubscription}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                  onClick={() => void handleRenewSubscriptionSubmit()}
                  disabled={!renewalStartDate || !renewalEndDate || !renewalPlanSlug || renewingSubscription}
                >
                  {renewingSubscription ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Routine Modal */}
      {isAssignRoutineModalOpen && searchParams.get('id') && (
        <div 
          className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
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
                      {assignRoutineClient?.name}
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
                  ) : routines.results.length > 0 ? (
                    <div className="space-y-2">
                      {routines.results.map((routine) => {
                        const isAlreadyAssigned = assignRoutineClient?.assigned_routines?.some((assignedRoutine) => {
                          return getAssignedRoutineId(assignedRoutine) === routine.id
                        })
                        
                        return (
                          <Card 
                            key={routine.id}
                            className={`transition-all ${
                              isAlreadyAssigned
                                ? 'ring-1 ring-green-500 bg-green-50 cursor-not-allowed opacity-75'
                                : selectedRoutineForAssignment === routine.id.toString() 
                                ? 'ring-2 ring-primary-500 bg-primary-50 cursor-pointer' 
                                : 'hover:shadow-md cursor-pointer'
                            }`}
                            onClick={() => !isAlreadyAssigned && handleSelectRoutine(routine.id.toString())}
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
            void clientsQuery.refetch()
          }}
        />
      )}

      {isAddMeasurementsModalOpen && selectedClientForMeasurements && (
        <AddMeasurementsModal
          client={selectedClientForMeasurements}
          date={measurementDate}
          measurements={measurements}
          placeholders={getLatestMeasurements()}
          loading={addingMeasurements}
          onClose={handleCloseMeasurementsModal}
          onDateChange={setMeasurementDate}
          onChange={handleMeasurementChange}
          onSubmit={handleSubmitMeasurements}
        />
      )}

      {canRemoveClient && clientToDelete && (
        <div 
          className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
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