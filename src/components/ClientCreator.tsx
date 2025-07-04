import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Calendar, CreditCard, Target, Users, Ruler, Scale, Activity, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { usePaginatedApi, useApi } from '../hooks/useApi'
import { clientsAPI, routinesAPI, clientRoutinesAPI, progressMetricsAPI } from '../lib/api'
import type { Client, Routine } from '../lib/api'

interface ClientCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: any) => void
}

// Esquema de validación con Yup
const ClientValidationSchema = Yup.object().shape({
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
  
  age: Yup.number()
    .required('La edad es requerida')
    .min(13, 'La edad debe ser al menos 13 años')
    .max(100, 'La edad no puede exceder 100 años')
    .typeError('La edad debe ser un número'),
  
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
    .min(new Date(), 'La fecha de inicio no puede ser anterior a hoy'),
  
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
  
  // Medidas antropométricas
  bodyFat: Yup.number()
    .min(0, 'El porcentaje de grasa no puede ser negativo')
    .max(50, 'El porcentaje de grasa no puede exceder 50%')
    .typeError('El porcentaje de grasa debe ser un número'),
  
  muscleMass: Yup.number()
    .min(0, 'La masa muscular no puede ser negativa')
    .max(200, 'La masa muscular no puede exceder 200 kg')
    .typeError('La masa muscular debe ser un número'),
  
  // Medidas corporales
  measurements: Yup.object().shape({
    chest: Yup.number()
      .min(0, 'La medida del pecho no puede ser negativa')
      .max(200, 'La medida del pecho no puede exceder 200 cm')
      .typeError('La medida del pecho debe ser un número'),
    waist: Yup.number()
      .min(0, 'La medida de la cintura no puede ser negativa')
      .max(200, 'La medida de la cintura no puede exceder 200 cm')
      .typeError('La medida de la cintura debe ser un número'),
    biceps: Yup.number()
      .min(0, 'La medida del bíceps no puede ser negativa')
      .max(100, 'La medida del bíceps no puede exceder 100 cm')
      .typeError('La medida del bíceps debe ser un número'),
    forearms: Yup.number()
      .min(0, 'La medida del antebrazo no puede ser negativa')
      .max(100, 'La medida del antebrazo no puede exceder 100 cm')
      .typeError('La medida del antebrazo debe ser un número'),
    thighs: Yup.number()
      .min(0, 'La medida del muslo no puede ser negativa')
      .max(150, 'La medida del muslo no puede exceder 150 cm')
      .typeError('La medida del muslo debe ser un número'),
    calves: Yup.number()
      .min(0, 'La medida de la pantorrilla no puede ser negativa')
      .max(100, 'La medida de la pantorrilla no puede exceder 100 cm')
      .typeError('La medida de la pantorrilla debe ser un número'),
    neck: Yup.number()
      .min(0, 'La medida del cuello no puede ser negativa')
      .max(100, 'La medida del cuello no puede exceder 100 cm')
      .typeError('La medida del cuello debe ser un número'),
    shoulders: Yup.number()
      .min(0, 'La medida de los hombros no puede ser negativa')
      .max(200, 'La medida de los hombros no puede exceder 200 cm')
      .typeError('La medida de los hombros debe ser un número'),
    hips: Yup.number()
      .min(0, 'La medida de la cadera no puede ser negativa')
      .max(200, 'La medida de la cadera no puede exceder 200 cm')
      .typeError('La medida de la cadera debe ser un número'),
  }),
  
  // Rutinas (validación personalizada)
  selectedRoutines: Yup.array()
    .of(Yup.number())
    .min(1, 'Debe seleccionar al menos una rutina')
    .required('Debe seleccionar al menos una rutina'),
})

// Valores iniciales del formulario
const initialValues = {
  // Información personal
  name: '',
  email: '',
  phone: '',
  age: '',
  weight: '',
  height: '',
  goals: [] as string[],
  
  // Suscripción
  subscriptionType: 'standard',
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
}

const subscriptionTypes = [
  {
    id: 'standard',
    name: 'Estándar',
    price: 199000,
    features: ['Acceso básico', '2 rutinas', 'Seguimiento básico'],
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299000,
    features: ['Acceso completo', 'Rutinas ilimitadas', 'Seguimiento avanzado', 'Consultas prioritarias'],
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'personalized',
    name: 'Personalizada',
    price: 399000,
    features: ['Todo de Premium', 'Rutinas personalizadas', 'Sesiones 1:1', 'Nutrición incluida'],
    color: 'bg-green-50 text-green-700 border-green-200'
  }
]

const ClientCreator: React.FC<ClientCreatorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('personal')
  const [searchRoutine, setSearchRoutine] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks para cargar datos desde la API
  const {
    data: routines,
    loading: routinesLoading,
    error: routinesError,
    execute: loadRoutines
  } = usePaginatedApi(routinesAPI.getAll)

  const {
    execute: createClient,
    loading: creatingClient
  } = useApi(clientsAPI.create)

  const {
    execute: createClientRoutine
  } = useApi(clientRoutinesAPI.create)

  const {
    execute: createProgressMetrics
  } = useApi(progressMetricsAPI.create)

  // Cargar rutinas al montar el componente
  useEffect(() => {
    if (isOpen) {
      loadRoutines()
    }
  }, [isOpen, loadRoutines])

  const availableGoals = [
    'Perder peso',
    'Ganar masa muscular',
    'Mejorar resistencia',
    'Aumentar fuerza',
    'Mejorar flexibilidad',
    'Mantener peso',
    'Reducir estrés',
    'Mejorar postura'
  ]

  // Función para manejar el envío del formulario
  const handleSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
    setIsSubmitting(true)

    try {
      // Preparar datos del cliente
      const clientData = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        age: parseInt(values.age),
        weight: parseFloat(values.weight),
        height: parseFloat(values.height),
        goals: values.goals,
        join_date: new Date().toISOString().split('T')[0],
        subscription_type: values.subscriptionType,
        subscription_start: values.startDate,
        subscription_end: values.endDate,
        notes: values.notes.trim() || undefined,
        emergency_contact: values.emergencyContact.trim() || undefined,
        medical_conditions: values.medicalConditions.trim() || undefined
      }

      // Crear cliente
      const newClient = await createClient(clientData)
      
      if (newClient) {
        // Crear métricas de progreso iniciales
        const progressData = {
          client_id: newClient.id,
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(values.weight),
          body_fat: values.bodyFat ? parseFloat(values.bodyFat) : undefined,
          muscle_mass: values.muscleMass ? parseFloat(values.muscleMass) : undefined,
          measurements: Object.fromEntries(
            Object.entries(values.measurements)
              .filter(([_, value]) => value !== '')
              .map(([key, value]) => [key, parseFloat(value) || 0])
          )
        }

        await createProgressMetrics(progressData)

        // Asignar rutinas al cliente
        for (const routineId of values.selectedRoutines) {
          await createClientRoutine({
            client_id: newClient.id,
            routine_id: routineId,
            start_date: new Date().toISOString().split('T')[0],
            is_active: true,
            assigned_days: {}
          })
        }

        onSave(newClient)
        handleClose()
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      setFieldError('submit', 'Error al crear el cliente. Intente nuevamente.')
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

  const filteredRoutines = (routines || []).filter(routine => {
    const nameMatch = routine.name.toLowerCase().includes(searchRoutine.toLowerCase())
    const descriptionMatch = routine.description 
      ? routine.description.toLowerCase().includes(searchRoutine.toLowerCase())
      : false
    return nameMatch || descriptionMatch
  })

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Cliente</h2>
            <p className="text-gray-600">Completa la información del cliente</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={ClientValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, isValid }) => (
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
                                Edad *
                              </label>
                              <Field
                                as={Input}
                                type="number"
                                name="age"
                                placeholder="28"
                                className={errors.age && touched.age ? 'border-red-500' : ''}
                              />
                              <ErrorMessage name="age" component="span" className="block text-red-500 text-xs mt-1 flex items-center">
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
                              {availableGoals.map((goal) => (
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
                            {subscriptionTypes.map((type) => (
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
                        <h3 className="text-lg font-semibold text-gray-900">Asignar Rutinas *</h3>
                        
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
                                    {isSelected && (
                                      <Badge variant="default" className="bg-primary-600">
                                        Asignada
                                      </Badge>
                                    )}
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
                        
                        {values.age && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{values.age} años</span>
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
                              {subscriptionTypes.find(s => s.id === values.subscriptionType)?.name}
                            </span>
                            <span className="text-primary-600 font-bold">
                              ${subscriptionTypes.find(s => s.id === values.subscriptionType)?.price?.toLocaleString('es-CO')}
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
                            const routine = routines?.find(r => r.id === routineId)
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
                      <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="flex-1 bg-primary-600 hover:bg-primary-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creando...
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Crear Cliente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default ClientCreator 