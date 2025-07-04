import React, { useState, useEffect } from 'react'
import { Plus, Clock, Users, Target, Play } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import ExerciseSelector from '../components/ExerciseSelector'
import { mockRoutines, mockWorkouts } from '../data/mockData'

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
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null)
  const [routines, setRoutines] = useState(mockRoutines)

  // Get modal state from URL params
  const isExerciseSelectorOpen = searchParams.get('modal') === 'create-routine'

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'destructive'
      default: return 'secondary'
    }
  }

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

  const handleCreateRoutine = (selectedExercises: ExerciseSet[]) => {
    // Convert selected exercises to workout format
    const exercises = selectedExercises.map((exerciseSet, index) => ({
      id: `${Date.now()}-${index}`,
      exerciseId: exerciseSet.exerciseId,
      reps: exerciseSet.reps,
      weight: exerciseSet.weight,
      restTime: exerciseSet.restTime,
      completed: false
    }))

    // Create new workout
    const newWorkout = {
      id: `workout-${Date.now()}`,
      name: `Nuevo Entrenamiento`,
      description: 'Entrenamiento personalizado',
      exercises,
      estimatedDuration: Math.ceil(selectedExercises.length * 5), // 5 min per exercise
      difficulty: 'intermediate' as const,
      category: 'mixed' as const
    }

    // Create new routine
    const newRoutine = {
      id: `routine-${Date.now()}`,
      name: `Nueva Rutina`,
      description: 'Rutina personalizada',
      workouts: [newWorkout],
      frequency: 'weekly' as const,
      daysPerWeek: 3,
      duration: 4
    }

    setRoutines([...routines, newRoutine as any])
    closeExerciseSelector()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Rutinas</h1>
        <p className="text-gray-600">Gestiona las rutinas de entrenamiento</p>
      </div>

      {/* Add Routine Button */}
      <Button 
        className="w-full bg-primary-600 hover:bg-primary-700"
        onClick={openExerciseSelector}
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Nueva Rutina
      </Button>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {routines.map((routine) => (
            <Card 
              key={routine.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRoutine === routine.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedRoutine(selectedRoutine === routine.id ? null : routine.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{routine.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{routine.description}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{routine.duration} semanas</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{routine.daysPerWeek} días/semana</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{routine.workouts.length} entrenamientos</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {routine.frequency === 'weekly' ? 'Semanal' : 'Diario'}
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
          ))}
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

      {/* Routine Details Modal */}
      {selectedRoutine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalles de la Rutina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const routine = routines.find(r => r.id === selectedRoutine)
                if (!routine) return null
                
                return (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{routine.name}</h3>
                      <p className="text-gray-600 text-sm">{routine.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Duración</p>
                        <p className="text-lg font-semibold">{routine.duration} semanas</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Frecuencia</p>
                        <p className="text-lg font-semibold">{routine.daysPerWeek} días/semana</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Entrenamientos</p>
                      <div className="space-y-2">
                        {routine.workouts.map((workout, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{workout.name}</p>
                              <p className="text-xs text-gray-600">{workout.estimatedDuration} min</p>
                            </div>
                            <Badge variant={getDifficultyColor(workout.difficulty) as any}>
                              {workout.difficulty}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" className="flex-1">
                        Editar
                      </Button>
                      <Button className="flex-1 bg-primary-600 hover:bg-primary-700">
                        Asignar Cliente
                      </Button>
                    </div>
                  </>
                )
              })()}
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