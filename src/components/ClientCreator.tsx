import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Calendar, Target, Ruler, Scale, Activity, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { usePaginatedApi, useApi } from '../hooks/useApi'
import { clientsAPI, routinesAPI, clientRoutinesAPI, progressMetricsAPI } from '../lib/api'
import type { Client, Routine } from '../lib/api'
import { calculateAge } from '../lib/utils'
import toast from 'react-hot-toast'
import { 
  SUBSCRIPTION_TYPES, 
  AVAILABLE_GOALS,
  DAYS_OF_WEEK
} from '../definitions'

// Tipos para el formulario
interface ClientFormValues {
  name: string
  email: string
  phone: string
  birthDate: string
  weight: string
  height: string
  goals: string[]
  subscriptionType: 'standard' | 'premium' | 'personalized'
  startDate: string
  endDate: string
  notes: string
  emergencyContact: string
  medicalConditions: string
  bodyFat: string
  muscleMass: string
  measurements: {
    chest: string
    waist: string
    biceps: string
    forearms: string
    thighs: string
    calves: string
    neck: string
    shoulders: string
    hips: string
  }
  selectedRoutines: number[]
  selectedDays: string[]
}

// Tipo para cliente extendido con datos adicionales
interface ExtendedClient extends Client {
  subscription?: {
    type: 'standard' | 'premium' | 'personalized'
    startDate: string
    endDate: string
  }
  emergencyContact?: string
  medicalConditions?: string
  bodyFat?: number
  muscleMass?: number
  measurements?: {
    chest?: number
    waist?: number
    biceps?: number
    forearms?: number
    thighs?: number
    calves?: number
    neck?: number
    shoulders?: number
    hips?: number
  }
  assignedRoutines?: number[]
}

interface ClientCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: Client) => void
  clientToEdit?: ExtendedClient
  clientId?: string | number // ID del cliente para cargar desde API
}

// Función para crear esquema de validación dinámico
const createValidationSchema = (isEditMode: boolean = false) => {
  return Yup.object().shape({
    // Información personal
    name: Yup.string()
      .trim()
      .required('El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    
    email: Yup.string()
      .trim()
      .required('El email es requerido')
      .email('El email no es válido')
      .max(255, 'El email no puede exceder 255 caracteres'),
    
    phone: Yup.string()
      .trim()
      .required('El teléfono es requerido')
      .matches(/^[\+]?[0-9\s\-\(\)]+$/, 'El teléfono no es válido'),
    
    birthDate: Yup.date()
      .max(new Date(), 'La fecha de nacimiento no puede ser en el futuro')
      .test('age', 'La edad debe ser al menos 13 años', function(value) {
        if (!value) return true // Campo opcional
        const age = Math.floor((new Date().getTime() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        return age >= 13
      })
      .test('age', 'La edad no puede exceder 100 años', function(value) {
        if (!value) return true // Campo opcional
        const age = Math.floor((new Date().getTime() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        return age <= 100
      }),
    
    weight: Yup.number()
      .required('El peso es requerido')
      .min(20, 'El peso debe ser al menos 20 kg')
      .max(300, 'El peso no puede exceder 300 kg')
      .typeError('El peso debe ser un número'),
    
    height: Yup.number()
      .required('La altura es requerida')
      .min(100, 'La altura debe ser al menos 100 cm')
      .max(250, 'La altura no puede exceder 250 cm')
      .typeError('La altura debe ser un número'),
    
    // Objetivos
    goals: Yup.array()
      .of(Yup.string())
      .min(1, 'Debe seleccionar al menos un objetivo')
      .required('Debe seleccionar al menos un objetivo'),
    
    // Suscripción
    subscriptionType: Yup.string()
      .oneOf(['standard', 'premium', 'personalized'], 'Tipo de suscripción inválido')
      .required('Debe seleccionar un tipo de suscripción'),
    
    startDate: Yup.date()
      .required('La fecha de inicio es requerida')
      .test('start-date', 'La fecha de inicio no puede ser anterior a hoy', function(value) {
        if (isEditMode) {
          // En modo edición, permitir fechas pasadas
          return true
        }
        if (!value) return false
        
        // Comparar solo las fechas (sin tiempo)
        const today = new Date()
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const selectedDate = new Date(value.getFullYear(), value.getMonth(), value.getDate())
        
        return selectedDate >= todayDate
      }),
    
    endDate: Yup.date()
      .required('La fecha de fin es requerida')
      .min(Yup.ref('startDate'), 'La fecha de fin debe ser posterior a la fecha de inicio'),
    
    // Información adicional
    emergencyContact: Yup.string()
      .trim()
      .max(255, 'El contacto de emergencia no puede exceder 255 caracteres'),
    
    medicalConditions: Yup.string()
      .trim()
      .max(1000, 'Las condiciones médicas no pueden exceder 1000 caracteres'),
    
    notes: Yup.string()
      .trim()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres'),
    
    // Medidas antropométricas (opcionales)
    bodyFat: Yup.mixed()
      .test('body-fat', 'El porcentaje de grasa debe ser un número válido', function(value) {
        if (!value || value === '') return true // Campo opcional
        const num = Number(value)
        return !isNaN(num) && num >= 0 && num <= 50
      }),
    
    muscleMass: Yup.mixed()
      .test('muscle-mass', 'La masa muscular debe ser un número válido', function(value) {
        if (!value || value === '') return true // Campo opcional
        const num = Number(value)
        return !isNaN(num) && num >= 0 && num <= 200
      }),
    
    // Medidas corporales (opcionales)
    measurements: Yup.object().shape({
      chest: Yup.mixed()
        .test('chest', 'La medida del pecho debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 200
        }),
      waist: Yup.mixed()
        .test('waist', 'La medida de la cintura debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 200
        }),
      biceps: Yup.mixed()
        .test('biceps', 'La medida del bíceps debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 100
        }),
      forearms: Yup.mixed()
        .test('forearms', 'La medida del antebrazo debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 100
        }),
      thighs: Yup.mixed()
        .test('thighs', 'La medida del muslo debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 150
        }),
      calves: Yup.mixed()
        .test('calves', 'La medida de la pantorrilla debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 100
        }),
      neck: Yup.mixed()
        .test('neck', 'La medida del cuello debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 100
        }),
      shoulders: Yup.mixed()
        .test('shoulders', 'La medida de los hombros debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 200
        }),
      hips: Yup.mixed()
        .test('hips', 'La medida de la cadera debe ser un número válido', function(value) {
          if (!value || value === '') return true
          const num = Number(value)
          return !isNaN(num) && num >= 0 && num <= 200
        }),
    }),
    
    // Rutinas (opcional en modo edición)
    selectedRoutines: Yup.array()
      .of(Yup.number())
      .test('routines', 'Debe seleccionar al menos una rutina', function(value) {
        if (isEditMode) {
          // En modo edición, las rutinas son opcionales
          return true
        }
        return value && value.length > 0
      }),
  })
}

// Valores iniciales del formulario
const initialValues = {
  // Información personal
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  weight: '',
  height: '',
  goals: [] as string[],
  
  // Suscripción
  subscriptionType: 'standard' as const,
  startDate: '',
  endDate: '',
  
  // Información adicional
  notes: '',
  emergencyContact: '',
  medicalConditions: '',
  
  // Medidas antropométricas
  bodyFat: '',
  muscleMass: '',
  
  // Medidas corporales
  measurements: {
    chest: '',
    waist: '',
    biceps: '',
    forearms: '',
    thighs: '',
    calves: '',
    neck: '',
    shoulders: '',
    hips: ''
  },
  
  // Rutinas
  selectedRoutines: [] as number[],
  selectedDays: [] as string[],

}

// Usar las constantes importadas de definitions.ts

const ClientCreator: React.FC<ClientCreatorProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  clientId
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('personal')
  const [searchRoutine, setSearchRoutine] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks para cargar datos desde la API
  const {
    data: routines,
    execute: loadRoutines
  } = usePaginatedApi(routinesAPI.getAll)

  const {
    execute: createClient,
    loading: creatingClient
  } = useApi(clientsAPI.create)

  const {
    execute: updateClient,
    loading: updatingClient
  } = useApi(clientsAPI.update)

  const isProcessing = isSubmitting || creatingClient || updatingClient

  const {
    execute: createClientRoutine
  } = useApi(clientRoutinesAPI.create)

  const {
    execute: createProgressMetrics
  } = useApi(progressMetricsAPI.create)

  // Hook para cargar cliente desde API
  const {
    data: clientFromApi,
    loading: clientLoading,
    error: clientError,
    execute: loadClient
  } = useApi(clientsAPI.getById)

  // Estado para el cliente que se está editando
  const [editingClient, setEditingClient] = useState<ExtendedClient | null>(null)

  // Cargar rutinas al montar el componente o cuando cambie el término de búsqueda
  useEffect(() => {
    if (isOpen) {
      loadRoutines({ search: searchRoutine })
    }
  }, [isOpen, loadRoutines, searchRoutine])

  // Cargar cliente desde API cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && clientId && !clientToEdit) {
      loadClient(parseInt(clientId.toString()))
    }
  }, [isOpen, clientId, clientToEdit, loadClient])

  // Actualizar cliente de edición cuando se carga desde API
  useEffect(() => {
    if (clientFromApi) {
      // Convertir el cliente de la API al formato ExtendedClient
      const extendedClient: ExtendedClient = {
        ...clientFromApi,
        subscription: clientFromApi.subscription_type ? {
          type: clientFromApi.subscription_type,
          startDate: clientFromApi.subscription_start || '',
          endDate: clientFromApi.subscription_end || ''
        } : undefined,
        emergencyContact: clientFromApi.emergency_contact,
        medicalConditions: clientFromApi.medical_conditions,
        bodyFat: undefined, // Estos campos no están en la API base
        muscleMass: undefined,
        measurements: undefined,
        assignedRoutines: clientFromApi.assigned_routines?.map(routine => 
          typeof routine === 'number' ? routine : routine.id
        ) || []
      }
      setEditingClient(extendedClient)
    }
  }, [clientFromApi])

  // Determinar qué cliente usar para la edición
  const clientToEditFinal = clientToEdit || editingClient

  // Función para convertir número a string de forma segura
  const numberToString = (value: number | undefined): string => 
    value?.toString() || ''

  // Función para obtener medidas corporales
  const getMeasurements = (client: ExtendedClient) => ({
    chest: numberToString(client.measurements?.chest),
    waist: numberToString(client.measurements?.waist),
    biceps: numberToString(client.measurements?.biceps),
    forearms: numberToString(client.measurements?.forearms),
    thighs: numberToString(client.measurements?.thighs),
    calves: numberToString(client.measurements?.calves),
    neck: numberToString(client.measurements?.neck),
    shoulders: numberToString(client.measurements?.shoulders),
    hips: numberToString(client.measurements?.hips)
  })

  // Función para obtener rutinas asignadas
  const getAssignedRoutines = (client: ExtendedClient): number[] => {
    if (!client.assignedRoutines) return []
    return client.assignedRoutines.map(routine => 
      typeof routine === 'number' ? routine : (routine as Routine).id
    )
  }

  // Función para obtener tipo de suscripción válido
  const getSubscriptionType = (client: ExtendedClient): 'standard' | 'premium' | 'personalized' => {
    const type = client.subscription?.type
    if (type === 'premium' || type === 'personalized') return type
    return 'standard'
  }

  // Generar valores iniciales basados en el cliente a editar
  const getInitialValues = (): ClientFormValues => {
    if (!clientToEditFinal) return initialValues

    return {
      // Información personal
      name: clientToEditFinal.name,
      email: clientToEditFinal.email,
      phone: clientToEditFinal.phone,
      birthDate: clientToEditFinal.birth_date || '',
      weight: numberToString(clientToEditFinal.weight),
      height: numberToString(clientToEditFinal.height),
      goals: Array.isArray(clientToEditFinal.goals) ? clientToEditFinal.goals : [],
      
      // Suscripción
      subscriptionType: getSubscriptionType(clientToEditFinal),
      startDate: clientToEditFinal.subscription?.startDate || '',
      endDate: clientToEditFinal.subscription?.endDate || '',
      
      // Información adicional
      notes: clientToEditFinal.notes || '',
      emergencyContact: clientToEditFinal.emergencyContact || '',
      medicalConditions: clientToEditFinal.medicalConditions || '',
      
      // Medidas antropométricas
      bodyFat: numberToString(clientToEditFinal.bodyFat),
      muscleMass: numberToString(clientToEditFinal.muscleMass),
      
      // Medidas corporales
      measurements: getMeasurements(clientToEditFinal),
      
      // Rutinas
      selectedRoutines: getAssignedRoutines(clientToEditFinal),
      selectedDays: [],

    } as ClientFormValues
  }

// Usar las constantes importadas de definitions.ts

  // Función para crear datos del cliente desde valores del formulario
  const createClientData = (values: ClientFormValues, isEditMode: boolean): Partial<Client> => {
    const baseData = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      birth_date: values.birthDate || undefined,
      weight: parseFloat(values.weight),
      height: parseFloat(values.height),
      goals: values.goals,
      subscription_type: values.subscriptionType,
      subscription_start: values.startDate,
      subscription_end: values.endDate,
      notes: values.notes.trim() || undefined,
      emergency_contact: values.emergencyContact.trim() || undefined,
      medical_conditions: values.medicalConditions.trim() || undefined
    }

    return isEditMode 
      ? { ...baseData, join_date: clientToEditFinal!.join_date }
      : { ...baseData, join_date: new Date().toISOString().split('T')[0] }
  }

  // Función para crear datos de progreso
  const createProgressData = (clientId: number, values: ClientFormValues) => ({
    client_id: clientId,
    date: new Date().toISOString().split('T')[0],
    weight: parseFloat(values.weight),
    body_fat: values.bodyFat ? parseFloat(values.bodyFat) : undefined,
    muscle_mass: values.muscleMass ? parseFloat(values.muscleMass) : undefined,
    measurements: Object.fromEntries(
      Object.entries(values.measurements)
        .filter(([, value]) => value !== '')
        .map(([key, value]) => [key, parseFloat(value) || 0])
    )
  })

  // Función para crear rutinas de cliente
  const createClientRoutines = async (clientId: number, routineIds: number[]) => {
    const routinePromises = routineIds.map(routineId => 
      createClientRoutine({
        client_id: clientId,
        routine_id: routineId,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        assigned_days: {}
      })
    )
    await Promise.all(routinePromises)
  }

  // Función para manejar el envío del formulario
  const handleSubmit = async (values: ClientFormValues, { setSubmitting, setFieldError }: { setSubmitting: (isSubmitting: boolean) => void; setFieldError: (field: string, message: string) => void }) => {
    setIsSubmitting(true)

    try {
      const isEditMode = !!clientToEditFinal
      const clientData = createClientData(values, isEditMode)
      
      let updatedClient: Client | null

      if (isEditMode) {
        updatedClient = await updateClient(clientToEditFinal!.id, clientData)
      } else {
        updatedClient = await createClient(clientData)
        
        if (updatedClient) {
          // Crear datos adicionales solo para nuevos clientes
          await createProgressMetrics(createProgressData(updatedClient.id, values))
          await createClientRoutines(updatedClient.id, values.selectedRoutines)
        }
      }

      if (updatedClient) {
        onSave(updatedClient)
        handleClose()
      }
    } catch (error) {
      console.error('Error al procesar cliente:', error)
      setFieldError('submit', `Error al ${clientToEditFinal ? 'actualizar' : 'crear'} el cliente. Intente nuevamente.`)
    } finally {
      setIsSubmitting(false)
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    // Clear client creator params when closing
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
    onClose()
  }



  const filteredRoutines = routines?.results || []

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {clientToEdit ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
            </h2>
            <p className="text-gray-600">
              {clientToEdit ? 'Modifica la información del cliente' : 'Completa la información del cliente'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mostrar estado de carga cuando se está cargando el cliente desde API */}
        {clientLoading && !clientToEdit ? (
          <div className="flex items-center justify-center h-[calc(90vh-120px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando información del cliente...</p>
            </div>
          </div>
        ) : clientError && !clientToEdit ? (
          <div className="flex items-center justify-center h-[calc(90vh-120px)]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar cliente</h3>
              <p className="text-gray-600 mb-4">No se pudo cargar la información del cliente.</p>
              <Button onClick={handleClose} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <Formik
            initialValues={getInitialValues()}
            validationSchema={createValidationSchema(!!clientToEditFinal)}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
          {({ values, errors, touched, setFieldValue, isValid }) => {
            const handleDeleteRoutine = async (routineId: number, event: React.MouseEvent) => {
              event.stopPropagation() // Evitar que se active el onClick de la card
              
              try {
                // Obtener el nombre de la rutina antes de eliminarla
                const routine = routines?.results?.find(r => r.id === routineId)
                const routineName = routine?.name || 'Rutina'
                
                // Eliminar de la selección local
                const updatedRoutines = values.selectedRoutines.filter((r: number) => r !== routineId)
                setFieldValue('selectedRoutines', updatedRoutines)
                
                // Si estamos en modo edición y el cliente ya existe, hacer la llamada DELETE
                if (clientToEditFinal && clientId) {
                  // Nota: Necesitaríamos el clientRoutineId específico para hacer el DELETE
                  // Por ahora solo actualizamos la selección local
                  console.log(`Eliminando rutina ${routineId} del cliente ${clientId}`)
                }
                
                // Mostrar toast de confirmación
                toast.success(`${routineName} eliminada de la selección`)
              } catch (error) {
                console.error('Error al eliminar rutina:', error)
                toast.error('Error al eliminar la rutina')
              }
            }
            
            return (
            <Form>
              <div className="flex h-[calc(90vh-120px)]">
                {/* Left Panel - Form */}
                <div className="w-2/3 border-r overflow-y-auto">
                  <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="measurements">Medidas</TabsTrigger>
                        <TabsTrigger value="subscription">Suscripción</TabsTrigger>
                        <TabsTrigger value="routines">Rutinas</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-6 mt-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo *
                              </label>
                              <Field
                                as={Input}
                                name="name"
                                placeholder="Ej: María González"
                                className={errors.name && touched.name ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="name" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                              </label>
                              <Field
                                as={Input}
                                type="email"
                                name="email"
                                placeholder="maria@email.com"
                                className={errors.email && touched.email ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="email" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono *
                              </label>
                              <Field
                                as={Input}
                                name="phone"
                                placeholder="+34 612 345 678"
                                className={errors.phone && touched.phone ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="phone" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Nacimiento
                              </label>
                              <Field
                                as={Input}
                                type="date"
                                name="birthDate"
                                className={errors.birthDate && touched.birthDate ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="birthDate" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peso (kg) *
                              </label>
                              <Field
                                as={Input}
                                type="number"
                                name="weight"
                                placeholder="65"
                                className={errors.weight && touched.weight ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="weight" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Altura (cm) *
                              </label>
                              <Field
                                as={Input}
                                type="number"
                                name="height"
                                placeholder="165"
                                className={errors.height && touched.height ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="height" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                                {(msg) => (
                                  <span className="text-red-500 text-xs flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {msg}
                                  </span>
                                )}
                              </ErrorMessage>
                            </div>
                          </div>

                          {/* Goals */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Metas de Entrenamiento *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {AVAILABLE_GOALS.map((goal) => (
                                <Button
                                  key={goal}
                                  type="button"
                                  size="sm"
                                  variant={values.goals.includes(goal) ? 'default' : 'outline'}
                                  onClick={() => {
                                    const currentGoals = values.goals
                                    const updatedGoals = currentGoals.includes(goal)
                                      ? currentGoals.filter(g => g !== goal)
                                      : [...currentGoals, goal]
                                    setFieldValue('goals', updatedGoals)
                                  }}
                                  className="justify-start"
                                >
                                  {goal}
                                </Button>
                              ))}
                            </div>
                            <ErrorMessage name="goals" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                              {(msg) => (
                                <span className="text-red-500 text-xs flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {msg}
                                </span>
                              )}
                            </ErrorMessage>
                          </div>

                          {/* Additional Info */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contacto de Emergencia
                              </label>
                              <Field
                                as={Input}
                                name="emergencyContact"
                                placeholder="Nombre y teléfono"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condiciones Médicas
                              </label>
                              <Field
                                as="textarea"
                                name="medicalConditions"
                                placeholder="Alergias, lesiones, condiciones médicas..."
                                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas Adicionales
                              </label>
                              <Field
                                as="textarea"
                                name="notes"
                                placeholder="Información adicional sobre el cliente..."
                                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="measurements" className="space-y-6 mt-6">
                        {/* Anthropometric Measurements */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Medidas Antropométricas</h3>
                          
                          {/* Basic Measurements */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grasa Corporal (%)
                              </label>
                              <Field
                                as={Input}
                                type="number"
                                name="bodyFat"
                                placeholder="25"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Masa Muscular (kg)
                              </label>
                              <Field
                                as={Input}
                                type="number"
                                name="muscleMass"
                                placeholder="45"
                              />
                            </div>
                          </div>

                          {/* Body Measurements */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Medidas Corporales (cm)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Pecho
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.chest"
                                  placeholder="85"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Cintura
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.waist"
                                  placeholder="70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bíceps
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.biceps"
                                  placeholder="28"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Antebrazos
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.forearms"
                                  placeholder="25"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Muslos
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.thighs"
                                  placeholder="55"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Pantorrillas
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.calves"
                                  placeholder="35"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Cuello
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.neck"
                                  placeholder="35"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Hombros
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.shoulders"
                                  placeholder="120"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Cadera
                                </label>
                                <Field
                                  as={Input}
                                  type="number"
                                  name="measurements.hips"
                                  placeholder="95"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="subscription" className="space-y-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900">Suscripción</h3>
                        
                        {/* Subscription Types */}
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Suscripción *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {SUBSCRIPTION_TYPES.map((type) => (
                              <Card 
                                key={type.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  values.subscriptionType === type.id ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                                }`}
                                onClick={() => setFieldValue('subscriptionType', type.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <h4 className="font-semibold text-gray-900">{type.name}</h4>
                                    <p className="text-2xl font-bold text-primary-600 mt-2">
                                      ${type.price.toLocaleString('es-CO')}
                                    </p>
                                    <ul className="text-sm text-gray-600 mt-3 space-y-1">
                                      {type.features.map((feature, index) => (
                                        <li key={index}>• {feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Subscription Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Inicio *
                            </label>
                            <Field
                              as={Input}
                              type="date"
                              name="startDate"
                              className={errors.startDate && touched.startDate ? 'border-red-500' : ''}
                            />
                            <ErrorMessage name="startDate" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                              {(msg) => (
                                <span className="text-red-500 text-xs flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {msg}
                                </span>
                              )}
                            </ErrorMessage>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fecha de Fin *
                            </label>
                            <Field
                              as={Input}
                              type="date"
                              name="endDate"
                              className={errors.endDate && touched.endDate ? 'border-red-500' : ''}
                            />
                            <ErrorMessage name="endDate" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
                              {(msg) => (
                                <span className="text-red-500 text-xs flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {msg}
                                </span>
                              )}
                            </ErrorMessage>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="routines" className="space-y-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900">Asignar Nuevas Rutinas *</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Selecciona las rutinas que quieres asignar al cliente. Haz clic en una rutina seleccionada para deseleccionarla.
                        </p>
                        
                        {/* Routine Search */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar Rutinas
                          </label>
                          <Input
                            placeholder="Buscar rutinas..."
                            value={searchRoutine}
                            onChange={(e) => setSearchRoutine(e.target.value)}
                          />
                        </div>

                        {/* Routines List */}
                        <div className="space-y-3">
                          {filteredRoutines.map((routine) => {
                            const isSelected = values.selectedRoutines.includes(routine.id)
                            return (
                              <Card 
                                key={routine.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                                }`}
                                onClick={() => {
                                  const currentRoutines = values.selectedRoutines
                                  const updatedRoutines = currentRoutines.includes(routine.id)
                                    ? currentRoutines.filter(r => r !== routine.id)
                                    : [...currentRoutines, routine.id]
                                  setFieldValue('selectedRoutines', updatedRoutines)
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{routine.name}</h4>
                                      <p className="text-sm text-gray-600">{routine.description}</p>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {routine.duration} semanas
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {routine.days_per_week} días/semana
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {isSelected && (
                                        <>
                                          <Badge variant="default" className="bg-primary-600">
                                            ✓ Asignada
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeleteRoutine(routine.id, e)}
                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                      {!isSelected && (
                                        <Badge variant="outline" className="text-gray-500">
                                          Clic para asignar
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                        
                        <ErrorMessage name="selectedRoutines" component="div" className="p-3 bg-red-50 border border-red-200 rounded-md">
                          {(msg) => (
                            <p className="text-red-600 text-xs flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {msg}
                            </p>
                          )}
                        </ErrorMessage>

                        {/* Day Selection */}
                        {values.selectedRoutines.length > 0 && (
                          <div className="space-y-4 mt-6">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600">2. Selecciona los Días de la Semana</p>
                              <p className="text-xs text-gray-500">
                                Selecciona los días en los que se asignará la rutina
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {DAYS_OF_WEEK.map((day) => (
                                <Button
                                  key={day.key}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentDays = values.selectedDays || []
                                    const updatedDays = currentDays.includes(day.key)
                                      ? currentDays.filter(d => d !== day.key)
                                      : [...currentDays, day.key]
                                    setFieldValue('selectedDays', updatedDays)
                                  }}
                                  className={`text-xs px-2 py-1 ${
                                    values.selectedDays?.includes(day.key)
                                      ? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {day.short}
                                </Button>
                              ))}
                            </div>
                            {values.selectedDays && values.selectedDays.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Días seleccionados: {values.selectedDays.map(day => {
                                  const dayInfo = DAYS_OF_WEEK.find(d => d.key === day)
                                  return dayInfo ? dayInfo.label : day
                                }).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Right Panel - Summary */}
                <div className="w-1/3 flex flex-col">
                  <div className="p-6 border-b">
                    <h3 className="font-semibold text-gray-900 mb-4">Resumen del Cliente</h3>
                    
                    {values.name && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{values.name}</span>
                        </div>
                        
                        {values.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{values.email}</span>
                          </div>
                        )}
                        
                        {values.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{values.phone}</span>
                          </div>
                        )}
                        
                        {values.birthDate && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {calculateAge(values.birthDate)} años
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Subscription Summary */}
                    {values.subscriptionType && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Suscripción</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {SUBSCRIPTION_TYPES.find(s => s.id === values.subscriptionType)?.name}
                            </span>
                            <span className="text-primary-600 font-bold">
                              ${SUBSCRIPTION_TYPES.find(s => s.id === values.subscriptionType)?.price?.toLocaleString('es-CO')}
                            </span>
                          </div>
                          {values.startDate && (
                            <p className="text-sm text-gray-600 mt-1">
                              Desde: {values.startDate}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Goals Summary */}
                    {values.goals.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Metas</h4>
                        <div className="flex flex-wrap gap-1">
                          {values.goals.map((goal) => (
                            <Badge key={goal} variant="secondary" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Measurements Summary */}
                    {(values.weight || values.bodyFat || values.muscleMass || 
                      Object.values(values.measurements).some(v => v)) && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Medidas Antropométricas</h4>
                        <div className="space-y-2">
                          {values.weight && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Scale className="w-4 h-4 text-gray-400" />
                              <span>Peso: {values.weight} kg</span>
                            </div>
                          )}
                          {values.bodyFat && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <span>Grasa: {values.bodyFat}%</span>
                            </div>
                          )}
                          {values.muscleMass && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span>Masa: {values.muscleMass} kg</span>
                            </div>
                          )}
                          {Object.entries(values.measurements).map(([key, value]) => {
                            if (!value) return null
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
                            return (
                              <div key={key} className="flex items-center space-x-2 text-sm">
                                <Ruler className="w-4 h-4 text-gray-400" />
                                <span>{measurementName}: {value} cm</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Routines Summary */}
                    {values.selectedRoutines.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Rutinas Asignadas</h4>
                        <div className="space-y-2">
                          {values.selectedRoutines.map((routineId) => {
                            const routine = routines?.results?.find(r => r.id === routineId)
                            return routine ? (
                              <div key={routineId} className="p-2 bg-gray-50 rounded text-sm">
                                {routine.name}
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t bg-gray-50">
                    <ErrorMessage name="submit" component="div" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      {(msg) => (
                        <p className="text-red-600 text-xs flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {msg}
                        </p>
                      )}
                    </ErrorMessage>
                    
                    <div className="flex space-x-3">
                      <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isProcessing}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!isValid || isProcessing}
                        className="flex-1 bg-primary-600 hover:bg-primary-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {clientToEditFinal ? 'Actualizando...' : 'Creando...'}
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            {clientToEditFinal ? 'Editar Cliente' : 'Crear Cliente'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
            )
          }}
        </Formik>
        )}
      </div>
    </div>
  )
}

export default ClientCreator 