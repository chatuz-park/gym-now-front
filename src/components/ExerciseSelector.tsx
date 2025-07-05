import React, { useState, useEffect } from 'react'
import { Search, Plus, X, Dumbbell, Clock, Target } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { mockExercises } from '../data/mockData'
import { 
  EXERCISE_CATEGORIES, 
  getDifficultyColor, 
  getExerciseIcon, 
  getExerciseColor,
  DEFAULT_EXERCISE_SET 
} from '../definitions'

interface ExerciseSet {
  exerciseId: string
  exercise: typeof mockExercises[0]
  sets: number
  reps: number
  weight: number
  restTime: number
}

interface ExerciseSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedExercises: ExerciseSet[]) => void
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedExercises, setSelectedExercises] = useState<ExerciseSet[]>([])
  const [routineName, setRoutineName] = useState('')
  const [routineDescription, setRoutineDescription] = useState('')

  // Get state from URL params
  const searchTerm = searchParams.get('search') || ''
  const selectedCategory = searchParams.get('category') || 'all'

  // Usar las constantes importadas de definitions.ts

  // Update URL params when state changes
  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    setSearchParams(newParams)
  }

  const handleSearchChange = (value: string) => {
    updateSearchParams({ search: value })
  }

  const handleCategoryChange = (category: string) => {
    updateSearchParams({ category })
  }

  const handleClose = () => {
    // Clear exercise selector params when closing
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('modal')
    newParams.delete('search')
    newParams.delete('category')
    setSearchParams(newParams)
    onClose()
  }

  const filteredExercises = mockExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           exercise.muscleGroups.some(group => 
                             group.toLowerCase().includes(selectedCategory)
                           )
    return matchesSearch && matchesCategory
  })

  // Usar las funciones importadas de definitions.ts

  const addExercise = (exercise: typeof mockExercises[0]) => {
    const isAlreadySelected = selectedExercises.some(se => se.exerciseId === exercise.id)
    if (!isAlreadySelected) {
      const newExerciseSet: ExerciseSet = {
        exerciseId: exercise.id,
        exercise,
        sets: DEFAULT_EXERCISE_SET.sets,
        reps: DEFAULT_EXERCISE_SET.reps,
        weight: DEFAULT_EXERCISE_SET.weight,
        restTime: DEFAULT_EXERCISE_SET.restTime
      }
      setSelectedExercises([...selectedExercises, newExerciseSet])
    }
  }

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(se => se.exerciseId !== exerciseId))
  }

  const updateExerciseSet = (exerciseId: string, field: keyof ExerciseSet, value: number) => {
    setSelectedExercises(selectedExercises.map(se => 
      se.exerciseId === exerciseId 
        ? { ...se, [field]: value }
        : se
    ))
  }

  const handleSave = () => {
    if (routineName.trim() && selectedExercises.length > 0) {
      onSave(selectedExercises)
      handleClose()
      // Reset form
      setSelectedExercises([])
      setRoutineName('')
      setRoutineDescription('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] m-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Crear Nueva Rutina</h2>
            <p className="text-gray-600">Selecciona ejercicios y configura los parámetros</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Left Panel - Exercise Selection */}
          <div className="w-2/3 border-r overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar ejercicios..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      size="sm"
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((exercise) => {
                  const isSelected = selectedExercises.some(se => se.exerciseId === exercise.id)
                  return (
                    <Card 
                      key={exercise.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                      }`}
                      onClick={() => addExercise(exercise)}
                    >
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          {/* Exercise Image Placeholder */}
                          <div className="flex-shrink-0">
                                                          <div className={`w-16 h-16 bg-gradient-to-br ${getExerciseColor(exercise.name)} rounded-lg flex items-center justify-center border`}>
                              <span className="text-2xl">{getExerciseIcon(exercise.name)}</span>
                            </div>
                          </div>
                          
                          {/* Exercise Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                              </div>
                              {isSelected && (
                                <Badge variant="default" className="bg-primary-600">
                                  Seleccionado
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscleGroups.map((group, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Dumbbell className="w-4 h-4" />
                                <span>{exercise.equipment.join(', ')}</span>
                              </div>
                              <Badge variant={getDifficultyColor(exercise.difficulty) as any}>
                                {exercise.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Exercises */}
          <div className="w-1/3 flex flex-col">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900 mb-4">Rutina Configuración</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Rutina
                  </label>
                  <Input
                    placeholder="Ej: Rutina Principiante"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    placeholder="Describe la rutina..."
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-medium text-gray-900 mb-4">
                Ejercicios Seleccionados ({selectedExercises.length})
              </h4>
              
              {selectedExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Selecciona ejercicios del panel izquierdo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedExercises.map((exerciseSet) => (
                    <Card key={exerciseSet.exerciseId} className="border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">
                                {exerciseSet.exercise.name}
                              </h5>
                              <p className="text-xs text-gray-600">
                                {exerciseSet.exercise.muscleGroups.join(', ')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(exerciseSet.exerciseId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Series
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={exerciseSet.sets}
                                onChange={(e) => updateExerciseSet(exerciseSet.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Repeticiones
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={exerciseSet.reps}
                                onChange={(e) => updateExerciseSet(exerciseSet.exerciseId, 'reps', parseInt(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Peso (kg)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                value={exerciseSet.weight}
                                onChange={(e) => updateExerciseSet(exerciseSet.exerciseId, 'weight', parseInt(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Descanso (seg)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="15"
                                value={exerciseSet.restTime}
                                onChange={(e) => updateExerciseSet(exerciseSet.exerciseId, 'restTime', parseInt(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                  disabled={!routineName.trim() || selectedExercises.length === 0}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Rutina
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseSelector 