import React, { useState } from 'react'
import { X, User, Mail, Phone, Calendar, CreditCard, Target, Users, Ruler, Scale, Activity } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { mockRoutines } from '../data/mockData'

interface ClientCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (clientData: any) => void
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
  const [selectedRoutines, setSelectedRoutines] = useState<string[]>([])
  const [searchRoutine, setSearchRoutine] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    email: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    goals: [] as string[],
    
    // Subscription Info
    subscriptionType: 'standard',
    startDate: '',
    endDate: '',
    
    // Additional Info
    notes: '',
    emergencyContact: '',
    medicalConditions: '',
    
    // Anthropometric Measurements
    bodyFat: '',
    muscleMass: '',
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
    }
  })

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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMeasurementChange = (measurement: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [measurement]: value
      }
    }))
  }

  const handleGoalToggle = (goal: string) => {
    const currentGoals = formData.goals
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal]
    handleInputChange('goals', updatedGoals)
  }

  const handleRoutineToggle = (routineId: string) => {
    const currentRoutines = selectedRoutines
    const updatedRoutines = currentRoutines.includes(routineId)
      ? currentRoutines.filter(r => r !== routineId)
      : [...currentRoutines, routineId]
    setSelectedRoutines(updatedRoutines)
  }

  const handleClose = () => {
    // Clear client creator params when closing
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
    onClose()
  }

  const handleSave = () => {
    if (formData.name && formData.email && formData.subscriptionType) {
      const clientData = {
        ...formData,
        assignedRoutines: selectedRoutines,
        joinDate: new Date(),
        id: `client-${Date.now()}`,
        // Convert measurements to numbers and filter out empty values
        measurements: Object.fromEntries(
          Object.entries(formData.measurements)
            .filter(([_, value]) => value !== '')
            .map(([key, value]) => [key, parseFloat(value) || 0])
        ),
        bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
        muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined
      }
      onSave(clientData)
      handleClose()
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: '',
        weight: '',
        height: '',
        goals: [],
        subscriptionType: 'standard',
        startDate: '',
        endDate: '',
        notes: '',
        emergencyContact: '',
        medicalConditions: '',
        bodyFat: '',
        muscleMass: '',
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
        }
      })
      setSelectedRoutines([])
    }
  }

  const filteredRoutines = mockRoutines.filter(routine =>
    routine.name.toLowerCase().includes(searchRoutine.toLowerCase()) ||
    routine.description.toLowerCase().includes(searchRoutine.toLowerCase())
  )

  const isFormValid = formData.name && formData.email && formData.subscriptionType

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
                        <Input
                          placeholder="Ej: María González"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          placeholder="maria@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <Input
                          placeholder="+34 612 345 678"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Edad
                        </label>
                        <Input
                          type="number"
                          placeholder="28"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peso (kg)
                        </label>
                        <Input
                          type="number"
                          placeholder="65"
                          value={formData.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Altura (cm)
                        </label>
                        <Input
                          type="number"
                          placeholder="165"
                          value={formData.height}
                          onChange={(e) => handleInputChange('height', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Goals */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Metas de Entrenamiento
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableGoals.map((goal) => (
                          <Button
                            key={goal}
                            size="sm"
                            variant={formData.goals.includes(goal) ? 'default' : 'outline'}
                            onClick={() => handleGoalToggle(goal)}
                            className="justify-start"
                          >
                            {goal}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contacto de Emergencia
                        </label>
                        <Input
                          placeholder="Nombre y teléfono"
                          value={formData.emergencyContact}
                          onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condiciones Médicas
                        </label>
                        <textarea
                          placeholder="Alergias, lesiones, condiciones médicas..."
                          value={formData.medicalConditions}
                          onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas Adicionales
                        </label>
                        <textarea
                          placeholder="Información adicional sobre el cliente..."
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
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
                        <Input
                          type="number"
                          placeholder="25"
                          value={formData.bodyFat}
                          onChange={(e) => handleInputChange('bodyFat', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Masa Muscular (kg)
                        </label>
                        <Input
                          type="number"
                          placeholder="45"
                          value={formData.muscleMass}
                          onChange={(e) => handleInputChange('muscleMass', e.target.value)}
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
                          <Input
                            type="number"
                            placeholder="85"
                            value={formData.measurements.chest}
                            onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cintura
                          </label>
                          <Input
                            type="number"
                            placeholder="70"
                            value={formData.measurements.waist}
                            onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bíceps
                          </label>
                          <Input
                            type="number"
                            placeholder="28"
                            value={formData.measurements.biceps}
                            onChange={(e) => handleMeasurementChange('biceps', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Antebrazos
                          </label>
                          <Input
                            type="number"
                            placeholder="25"
                            value={formData.measurements.forearms}
                            onChange={(e) => handleMeasurementChange('forearms', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Muslos
                          </label>
                          <Input
                            type="number"
                            placeholder="55"
                            value={formData.measurements.thighs}
                            onChange={(e) => handleMeasurementChange('thighs', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pantorrillas
                          </label>
                          <Input
                            type="number"
                            placeholder="35"
                            value={formData.measurements.calves}
                            onChange={(e) => handleMeasurementChange('calves', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuello
                          </label>
                          <Input
                            type="number"
                            placeholder="35"
                            value={formData.measurements.neck}
                            onChange={(e) => handleMeasurementChange('neck', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hombros
                          </label>
                          <Input
                            type="number"
                            placeholder="95"
                            value={formData.measurements.shoulders}
                            onChange={(e) => handleMeasurementChange('shoulders', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cadera
                          </label>
                          <Input
                            type="number"
                            placeholder="90"
                            value={formData.measurements.hips}
                            onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Suscripción</h3>
                  
                  {/* Subscription Types */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionTypes.map((subscription) => (
                      <Card 
                        key={subscription.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.subscriptionType === subscription.id 
                            ? 'ring-2 ring-primary-500 bg-primary-50' 
                            : ''
                        }`}
                        onClick={() => handleInputChange('subscriptionType', subscription.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="text-center">
                              <h4 className="font-semibold text-gray-900">{subscription.name}</h4>
                              <p className="text-2xl font-bold text-primary-600">${subscription.price.toLocaleString('es-CO')}</p>
                              <p className="text-sm text-gray-600">por mes</p>
                            </div>
                            
                            <div className="space-y-2">
                              {subscription.features.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                            
                            {formData.subscriptionType === subscription.id && (
                              <Badge className="w-full justify-center bg-primary-600">
                                Seleccionado
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Subscription Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Fin
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="routines" className="space-y-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Asignar Rutinas</h3>
                  
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
                      const isSelected = selectedRoutines.includes(routine.id)
                      return (
                        <Card 
                          key={routine.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                          }`}
                          onClick={() => handleRoutineToggle(routine.id)}
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
                                    {routine.daysPerWeek} días/semana
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
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Summary */}
          <div className="w-1/3 flex flex-col">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen del Cliente</h3>
              
              {formData.name && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  
                  {formData.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formData.email}</span>
                    </div>
                  )}
                  
                  {formData.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formData.phone}</span>
                    </div>
                  )}
                  
                  {formData.age && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formData.age} años</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Subscription Summary */}
              {formData.subscriptionType && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Suscripción</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {subscriptionTypes.find(s => s.id === formData.subscriptionType)?.name}
                      </span>
                      <span className="text-primary-600 font-bold">
                        ${subscriptionTypes.find(s => s.id === formData.subscriptionType)?.price?.toLocaleString('es-CO')}
                      </span>
                    </div>
                    {formData.startDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        Desde: {formData.startDate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Goals Summary */}
              {formData.goals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Metas</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.goals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Measurements Summary */}
              {(formData.weight || formData.bodyFat || formData.muscleMass || 
                Object.values(formData.measurements).some(v => v)) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Medidas Antropométricas</h4>
                  <div className="space-y-2">
                    {formData.weight && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Scale className="w-4 h-4 text-gray-400" />
                        <span>Peso: {formData.weight} kg</span>
                      </div>
                    )}
                    {formData.bodyFat && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span>Grasa: {formData.bodyFat}%</span>
                      </div>
                    )}
                    {formData.muscleMass && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>Masa: {formData.muscleMass} kg</span>
                      </div>
                    )}
                    {Object.entries(formData.measurements).map(([key, value]) => {
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
              {selectedRoutines.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Rutinas Asignadas</h4>
                  <div className="space-y-2">
                    {selectedRoutines.map((routineId) => {
                      const routine = mockRoutines.find(r => r.id === routineId)
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
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Crear Cliente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientCreator 