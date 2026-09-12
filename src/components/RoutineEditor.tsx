import React, { useState, useEffect } from 'react'
import { X, Target, Calendar, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useClientQuery } from '../hooks/useClients'
import { useDeleteClientRoutineMutation, usePatchClientRoutineMutation } from '../hooks/useClientRoutines'
import { DAYS_OF_WEEK } from '../definitions'
import { normalizeAssignedDays } from '../lib/api'
import type { Routine } from '../lib/api'
import toast from 'react-hot-toast'

interface RoutineEditorProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | number
  onRoutinesUpdated: () => void
}

interface AssignedRoutine {
  id: number
  routine: Routine
  start_date: string
  end_date?: string
  is_active: boolean
  assigned_days?: string[] | Record<string, boolean>
}

interface RoutineWithDays {
  routine: Routine
  selectedDays: string[]
  assignedRoutineId: number
}

const RoutineEditor: React.FC<RoutineEditorProps> = ({
  isOpen,
  onClose,
  clientId,
  onRoutinesUpdated
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [routinesWithDays, setRoutinesWithDays] = useState<RoutineWithDays[]>([])
  useLockBodyScroll(isOpen)

  const parsedClientId = parseInt(clientId.toString())
  const deleteRoutineMutation = useDeleteClientRoutineMutation()
  const patchRoutineMutation = usePatchClientRoutineMutation()
  const clientQuery = useClientQuery(Number.isNaN(parsedClientId) ? undefined : parsedClientId, {
    enabled: isOpen && !!clientId,
  })
  const client = clientQuery.data
  const loadingClient = clientQuery.isPending

  // Inicializar rutinas con sus días asignados cuando se cargan los datos
  useEffect(() => {
    if (client?.assigned_routines) {
      const routinesWithDaysData = (client.assigned_routines as unknown as AssignedRoutine[]).map(assignedRoutine => {
        const selectedDays = normalizeAssignedDays(assignedRoutine.assigned_days)

        return {
          routine: assignedRoutine.routine,
          selectedDays: selectedDays,
          assignedRoutineId: assignedRoutine.id
        }
      })
      
      setRoutinesWithDays(routinesWithDaysData)
    }
  }, [client, clientId])

  const handleClose = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
    onClose()
  }

  const handleDayToggle = (routineIndex: number, day: string) => {
    setRoutinesWithDays(prev => {
      return prev.map((routineWithDays, index) => {
        if (index === routineIndex) {
          const isSelected = routineWithDays.selectedDays.includes(day)
          const newSelectedDays = isSelected
            ? routineWithDays.selectedDays.filter(d => d !== day)
            : [...routineWithDays.selectedDays, day]
          
          return {
            ...routineWithDays,
            selectedDays: newSelectedDays
          }
        }
        return routineWithDays
      })
    })
  }

  const handleRemoveRoutine = async (routineIndex: number, assignedRoutineId: number) => {
    const routineToRemove = routinesWithDays[routineIndex]
    
    try {
      // Hacer la llamada DELETE al API usando el assignedRoutineId directamente
      await deleteRoutineMutation.mutateAsync(assignedRoutineId)
      
      // Remover de la lista local
      setRoutinesWithDays(prev => prev.filter((_, index) => index !== routineIndex))
      
      toast.success(`${routineToRemove.routine.name} eliminada`)
      onRoutinesUpdated()
    } catch (error) {
      console.error('Error al eliminar rutina:', error)
      toast.error('Error al eliminar la rutina')
    }
  }

  const handleSaveRoutineChanges = async (routineIndex: number, assignedRoutineId: number) => {
    const routineToUpdate = routinesWithDays[routineIndex]
    
    try {
      await patchRoutineMutation.mutateAsync({
        id: assignedRoutineId,
        data: { assigned_days: routineToUpdate.selectedDays },
      })
      
      toast.success(`Días de ${routineToUpdate.routine.name} actualizados`)
      onRoutinesUpdated()
    } catch (error) {
      console.error('Error al actualizar rutina:', error)
      toast.error('Error al actualizar los días de la rutina')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Rutinas Asignadas</h2>
            <p className="text-gray-600">Modifica los días de cada rutina o elimina rutinas completas</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingClient ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Cargando rutinas...</p>
            </div>
          ) : routinesWithDays.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay rutinas asignadas</h3>
              <p className="text-gray-600">No hay rutinas para editar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {routinesWithDays.map((routineWithDays, index) => (
                <Card key={routineWithDays.routine.id} className="border-l-4 border-l-primary-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{routineWithDays.routine.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{routineWithDays.routine.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{routineWithDays.routine.duration} semanas</span>
                          <span>•</span>
                          <span>{routineWithDays.routine.days_per_week} días/semana</span>
                          <span>•</span>
                          <span>{routineWithDays.routine.workouts.length} entrenamientos</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRoutine(index, routineWithDays.assignedRoutineId)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Quitar esta rutina
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Días asignados:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.key}
                            variant={routineWithDays.selectedDays.includes(day.key) ? "outline" : "outline"}
                            size="sm"
                            onClick={() => handleDayToggle(index, day.key)}
                            className={`text-xs px-2 py-1 ${
                              routineWithDays.selectedDays.includes(day.key) 
                                ? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {day.short}
                          </Button>
                        ))}
                      </div>
                      {routineWithDays.selectedDays.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Días seleccionados: {routineWithDays.selectedDays.map(day => {
                            const dayInfo = DAYS_OF_WEEK.find(d => d.key === day)
                            return dayInfo ? dayInfo.label : day
                          }).join(', ')}
                        </p>
                      )}
                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveRoutineChanges(index, routineWithDays.assignedRoutineId)}
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoutineEditor 