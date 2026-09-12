import React, { useState, useEffect } from 'react'
import { Plus, Clock, Users, Target, Play, Search, RefreshCw, Edit, Trash2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import ExerciseSelector from '../components/ExerciseSelector'
import { useDebounce } from '../hooks/useDebounce'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import {
  useRoutinesQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useDeleteRoutineMutation,
} from '../hooks/useRoutines'
import { handleApiError } from '../lib/api'
import type { Routine } from '../lib/api'
import toast from 'react-hot-toast'

interface ExerciseSet {
  exerciseId: string
  exercise: any
  sets: number
  reps: number
  weight: number
  restTime: number
}

const Routines: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null)
  const [searchInputValue, setSearchInputValue] = useState('')

  // Get modal state from URL params
  const isExerciseSelectorOpen = searchParams.get('modal') === 'create-routine'
  const isEditModalOpen = searchParams.get('modal') === 'edit-routine'
  const isDeleteModalOpen = searchParams.get('modal') === 'delete-routine'
  useLockBodyScroll(isDeleteModalOpen)
  const searchTerm = searchParams.get('search') || ''
  const activeFilter = searchParams.get('filter') || 'all'

  // Debounce the search input value
  const debouncedSearchValue = useDebounce(searchInputValue, 500)

  const routinesQuery = useRoutinesQuery({ search: searchTerm, filter: activeFilter })
  const createRoutineMutation = useCreateRoutineMutation()
  const updateRoutineMutation = useUpdateRoutineMutation()
  const deleteRoutineMutation = useDeleteRoutineMutation()

  const routines = routinesQuery.data ?? { count: 0, next: null, previous: null, results: [] }
  const routinesLoading = routinesQuery.isPending
  const routinesError = routinesQuery.error ? handleApiError(routinesQuery.error) : null
  const creatingRoutine = createRoutineMutation.isPending
  const updatingRoutine = updateRoutineMutation.isPending
  const deletingRoutine = deleteRoutineMutation.isPending

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'default'
      case 'cardio': return 'destructive'
      case 'flexibility': return 'success'
      case 'mixed': return 'secondary'
      default: return 'outline'
    }
  }

  const openExerciseSelector = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'create-routine')
    setSearchParams(newParams)
  }

  const closeExerciseSelector = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
  }

  const openEditModal = (routine: Routine) => {
    if (!routine || !routine.id) {
      toast.error('Error: No se pudo cargar la rutina para editar')
      return
    }
    setRoutineToEdit(routine)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'edit-routine')
    setSearchParams(newParams)
  }

  const closeEditModal = () => {
    setRoutineToEdit(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
  }

  const handleCreateRoutine = async (selectedExercises: ExerciseSet[], routineName: string, routineDescription: string) => {
    try {
      // Convert selected exercises to workout format
      const exercises = selectedExercises.map((exerciseSet) => ({
        exercise: parseInt(exerciseSet.exerciseId),
        reps: exerciseSet.reps,
        weight: exerciseSet.weight,
        rest_time: exerciseSet.restTime,
        completed: false
      }))

      // Create new workout
      const newWorkout = {
        name: `Nuevo Entrenamiento`,
        description: 'Entrenamiento personalizado',
        sets: exercises,
        estimated_duration: Math.ceil(selectedExercises.length * 5), // 5 min per exercise
        difficulty: 'intermediate' as const,
        category: 'mixed' as const
      }

      // Create new routine
      const newRoutine = {
        name: routineName,
        description: routineDescription,
        workouts: [newWorkout],
        frequency: 'weekly' as const,
        days_per_week: 3,
        duration: 4
      }

      await createRoutineMutation.mutateAsync(newRoutine)
      toast.success('Rutina creada exitosamente')
      closeExerciseSelector()
    } catch {
      toast.error('Error al crear la rutina')
    }
  }

  const handleUpdateRoutine = async (selectedExercises: ExerciseSet[], routineName: string, routineDescription: string) => {
    if (!routineToEdit || !routineToEdit.id) {
      toast.error('Error: No se pudo identificar la rutina a editar')
      return
    }

    try {
      // Convert selected exercises to workout format
      const exercises = selectedExercises.map((exerciseSet) => ({
        exercise: parseInt(exerciseSet.exerciseId),
        reps: exerciseSet.reps,
        weight: exerciseSet.weight,
        rest_time: exerciseSet.restTime,
        completed: false
      }))

      // Create updated workout
      const updatedWorkout = {
        name: routineToEdit.workouts?.[0]?.name || 'Entrenamiento Actualizado',
        description: routineToEdit.workouts?.[0]?.description || 'Entrenamiento personalizado',
        sets: exercises,
        estimated_duration: Math.ceil(selectedExercises.length * 5), // 5 min per exercise
        difficulty: routineToEdit.workouts?.[0]?.difficulty || 'intermediate' as const,
        category: routineToEdit.workouts?.[0]?.category || 'mixed' as const
      }

      // Update routine
      const updatedRoutine = {
        name: routineName,
        description: routineDescription,
        workouts: [updatedWorkout],
        frequency: routineToEdit.frequency,
        days_per_week: routineToEdit.days_per_week,
        duration: routineToEdit.duration
      }

      await updateRoutineMutation.mutateAsync({ id: routineToEdit.id, data: updatedRoutine })
      toast.success('Rutina actualizada exitosamente')
      closeEditModal()
    } catch {
      toast.error('Error al actualizar la rutina')
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value)
  }

  const handleFilterChange = (filterId: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (filterId === 'all') {
      newParams.delete('filter')
    } else {
      newParams.set('filter', filterId)
    }
    setSearchParams(newParams)
  }

  const handleDeleteRoutine = (routine: Routine) => {
    setRoutineToDelete(routine)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('modal', 'delete-routine')
    setSearchParams(newParams)
  }

  const handleCloseDeleteModal = () => {
    setRoutineToDelete(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    setSearchParams(newParams)
  }

  const handleConfirmDeleteRoutine = async () => {
    if (!routineToDelete) return

    try {
      await deleteRoutineMutation.mutateAsync(routineToDelete.id)
      toast.success('Rutina eliminada exitosamente')
      handleCloseDeleteModal()
    } catch {
      toast.error('Error al eliminar la rutina')
    }
  }

  const getFilteredRoutines = () => {
    return routines.results
  }

  const filteredRoutines = getFilteredRoutines()

  // Filter options - counts are based on total counts from API
  const filterOptions = [
    { id: 'all', label: 'Todas', count: routines.count },
    { id: 'active', label: 'Activas', count: routines.results.filter(r => r.frequency === 'weekly').length },
    { id: 'completed', label: 'Completadas', count: 0 }, // This would need backend support
    { id: 'templates', label: 'Plantillas', count: routines.results.filter(r => r.frequency === 'daily').length }
  ]

  if (routinesError) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Rutinas</h1>
          <p className="text-gray-600">Gestiona las rutinas de entrenamiento</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar las rutinas: {routinesError}</p>
              <Button onClick={() => void routinesQuery.refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Rutinas</h1>
        <p className="text-gray-600">Gestiona las rutinas de entrenamiento</p>
      </div>

      {/* Search and Add Routine */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar rutinas..."
            value={searchInputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={openExerciseSelector}
          disabled={creatingRoutine}
        >
          {creatingRoutine ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Crear Nueva Rutina
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.id}
            variant={activeFilter === option.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(option.id)}
            className="flex items-center gap-2"
          >
            {option.label}
            <Badge variant="secondary" className="ml-1">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {routinesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredRoutines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron rutinas</p>
            </div>
          ) : (
            filteredRoutines.map((routine) => (
              <Card 
                key={routine.id}
                className="transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{routine.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{routine.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(routine)
                          }}
                          disabled={updatingRoutine}
                        >
                          {updatingRoutine ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Edit className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRoutine(routine)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{routine.duration} semanas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{routine.days_per_week} días/semana</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{routine.workouts.length} entrenamientos</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {routine.frequency === 'weekly' ? 'Semanal' : routine.frequency === 'daily' ? 'Diario' : 'Personalizado'}
                      </Badge>
                      {routine.workouts.map((workout, index) => (
                        <Badge 
                          key={index} 
                          variant={getCategoryColor(workout.category) as any}
                          className="text-xs"
                        >
                          {workout.category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          <div className="text-center py-8 text-gray-500">
            <p>No hay rutinas activas en este momento</p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          <div className="text-center py-8 text-gray-500">
            <p>No hay rutinas completadas</p>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="text-center py-8 text-gray-500">
            <p>No hay plantillas disponibles</p>
          </div>
        </TabsContent>
      </Tabs>



      {/* Edit Routine Modal */}
      {isEditModalOpen && routineToEdit && (
        <ExerciseSelector
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={handleUpdateRoutine}
          initialExercises={routineToEdit.workouts?.[0]?.sets?.map(set => ({
            exerciseId: (set.exercise_id || '').toString(),
            exercise: set.exercise || {
              id: 0,
              name: 'Ejercicio no encontrado',
              description: '',
              muscle_groups: [],
              equipment: [],
              difficulty: 'beginner',
              instructions: []
            },
            sets: 1, // Default value since sets is not in the API response
            reps: set.reps || 0,
            weight: set.weight || 0,
            restTime: set.rest_time || 0
          })) || []}
          routineName={routineToEdit.name || ''}
          routineDescription={routineToEdit.description || ''}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && routineToDelete && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>¿Estás seguro de que quieres eliminar la rutina "{routineToDelete.name}"?</p>
              <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCloseDeleteModal}
                  disabled={deletingRoutine}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmDeleteRoutine}
                  disabled={deletingRoutine}
                >
                  {deletingRoutine ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exercise Selector Modal */}
      <ExerciseSelector
        isOpen={isExerciseSelectorOpen}
        onClose={closeExerciseSelector}
        onSave={handleCreateRoutine}
      />

    </div>
  )
}

export default Routines 