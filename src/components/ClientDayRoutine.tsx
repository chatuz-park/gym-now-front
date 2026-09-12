import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, Target, Play, Activity, Square, X, Loader2, CheckCircle2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DAYS_OF_WEEK } from '../definitions'
import { handleApiError } from '../lib/api'
import type { ClientRoutine, Exercise, RoutineProgress, Workout, WorkoutSet } from '../lib/api'
import { useClientRoutineProgressQuery, useCompleteWorkoutMutation } from '../hooks/useClientRoutines'
import ExerciseHowToModal from './ExerciseHowToModal'

interface ClientDayRoutineProps {
  currentDay: string
  currentRoutine: ClientRoutine | undefined
}

interface LocalSession {
  assignmentId: number
  workoutId: number
  startedAt: string
}

const SESSION_STORAGE_KEY = 'gym-now:workout-session'

function readSession(): LocalSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalSession
    if (!parsed.assignmentId || !parsed.workoutId || !parsed.startedAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: LocalSession | null) {
  if (!session) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatElapsed(startedAt: string, nowMs: number) {
  const totalSec = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function isSameLocalDay(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

const ClientDayRoutine: React.FC<ClientDayRoutineProps> = ({ currentDay, currentRoutine }) => {
  const dayLabel = DAYS_OF_WEEK.find((day) => day.key === currentDay)?.label
  const assignmentId = currentRoutine?.id
  const [session, setSession] = useState<LocalSession | null>(() => readSession())
  const [nowMs, setNowMs] = useState(Date.now())
  const [openProgressId, setOpenProgressId] = useState<number | null>(null)
  const [howToExercise, setHowToExercise] = useState<Exercise | null>(null)

  const progressQuery = useClientRoutineProgressQuery(assignmentId, {
    enabled: !!assignmentId,
  })
  const completeMutation = useCompleteWorkoutMutation()
  const sessions = progressQuery.data ?? []

  useEffect(() => {
    if (!session) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [session])

  useEffect(() => {
    if (session && assignmentId && session.assignmentId !== assignmentId) {
      setSession(null)
    }
  }, [assignmentId, session])

  const persistSession = (next: LocalSession | null) => {
    writeSession(next)
    setSession(next)
    if (next) setNowMs(Date.now())
  }

  const sessionsByWorkout = useMemo(() => {
    const grouped = new Map<number, RoutineProgress[]>()
    sessions.forEach((item) => {
      const workoutId = item.workout?.id ?? item.workout_id
      if (!workoutId) return
      const list = grouped.get(workoutId) ?? []
      list.push(item)
      grouped.set(workoutId, list)
    })
    return grouped
  }, [sessions])

  const startWorkout = (workoutId: number) => {
    if (!assignmentId) {
      toast.error('No se pudo identificar la rutina asignada')
      return
    }
    persistSession({
      assignmentId,
      workoutId,
      startedAt: new Date().toISOString(),
    })
  }

  const cancelWorkout = () => {
    persistSession(null)
  }

  const finishWorkout = async (workout: Workout) => {
    if (!assignmentId || !session || session.workoutId !== workout.id) return
    try {
      await completeMutation.mutateAsync({
        id: assignmentId,
        data: {
          workout_id: workout.id,
          started_at: session.startedAt,
        },
      })
      persistSession(null)
      toast.success(`${workout.name} registrado`)
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Mi Rutina para {dayLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentRoutine ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">{currentRoutine.routine?.name}</h4>
              <p className="text-gray-600 mb-3">{currentRoutine.routine?.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentRoutine.routine?.duration} semanas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{currentRoutine.routine?.days_per_week} días/semana</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-semibold">Mis Entrenamientos del día:</h5>
              {currentRoutine.routine?.workouts?.map((workout: Workout) => {
                const workoutSessions = sessionsByWorkout.get(workout.id) ?? []
                const lastSession = workoutSessions[0]
                const completedToday = workoutSessions.some((item) => isSameLocalDay(item.completed_at))
                const isActive = session?.workoutId === workout.id && session.assignmentId === assignmentId
                const anotherActive = !!session && !isActive
                const showHistory = openProgressId === workout.id

                return (
                  <Card key={workout.id} className="border-l-4 border-l-primary-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h6 className="font-semibold">{workout.name}</h6>
                          <p className="text-sm text-gray-600">{workout.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {completedToday && (
                            <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completado hoy
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {workout.estimated_duration} min
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              workout.difficulty === 'beginner'
                                ? 'border-green-200 text-green-700 bg-green-50'
                                : workout.difficulty === 'intermediate'
                                  ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                  : 'border-red-200 text-red-700 bg-red-50'
                            }`}
                          >
                            {workout.difficulty === 'beginner'
                              ? 'Principiante'
                              : workout.difficulty === 'intermediate'
                                ? 'Intermedio'
                                : 'Avanzado'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {workout.sets.map((exerciseSet: WorkoutSet) => {
                          const exercise = exerciseSet.exercise
                          return (
                            <div key={exerciseSet.id} className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                {exercise?.image_url && (
                                  <img
                                    src={exercise.image_url}
                                    alt={exercise.name}
                                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium">{exercise?.name}</p>
                                  <p className="text-sm text-gray-600">{exercise?.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="text-center">
                                  <p className="font-medium">{exerciseSet.reps}</p>
                                  <p className="text-gray-500">Reps</p>
                                </div>
                                {exerciseSet.weight > 0 && (
                                  <div className="text-center">
                                    <p className="font-medium">{exerciseSet.weight}kg</p>
                                    <p className="text-gray-500">Peso</p>
                                  </div>
                                )}
                                <div className="text-center">
                                  <p className="font-medium">{exerciseSet.rest_time}s</p>
                                  <p className="text-gray-500">Descanso</p>
                                </div>
                                {exercise && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setHowToExercise(exercise)
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Cómo se hace
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {isActive && session && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                          En curso · Inicio {formatClock(session.startedAt)} · {formatElapsed(session.startedAt, nowMs)}
                        </div>
                      )}
                      {lastSession && !isActive && (
                        <p className="mt-3 text-xs text-gray-500">
                          Última sesión: {formatClock(lastSession.completed_at)}
                          {lastSession.started_at ? ` · Inicio ${formatClock(lastSession.started_at)}` : ''}
                        </p>
                      )}
                      <div className="flex space-x-2 mt-4">
                        {isActive ? (
                          <>
                            <Button
                              className="flex-1 bg-primary-600 hover:bg-primary-700"
                              onClick={() => void finishWorkout(workout)}
                              disabled={completeMutation.isPending}
                            >
                              {completeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Square className="w-4 h-4 mr-2" />
                              )}
                              Terminar Entrenamiento
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={cancelWorkout} disabled={completeMutation.isPending}>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              className="flex-1 bg-primary-600 hover:bg-primary-700"
                              onClick={() => startWorkout(workout.id)}
                              disabled={anotherActive}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Iniciar Entrenamiento
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setOpenProgressId(showHistory ? null : workout.id)}
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              Ver Progreso
                            </Button>
                          </>
                        )}
                      </div>
                      {showHistory && (
                        <div className="mt-3 space-y-2">
                          {progressQuery.isPending ? (
                            <p className="text-xs text-gray-500">Cargando sesiones...</p>
                          ) : workoutSessions.length === 0 ? (
                            <p className="text-xs text-gray-500">Aún no hay sesiones registradas de este entrenamiento.</p>
                          ) : (
                            workoutSessions.map((item) => (
                              <div key={item.id} className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600">
                                {item.started_at ? `Inicio ${formatClock(item.started_at)} · ` : ''}
                                Fin {formatClock(item.completed_at)}
                                {item.started_at ? ` · ${formatElapsed(item.started_at, new Date(item.completed_at).getTime())}` : ''}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin rutina programada</h4>
            <p className="text-gray-600 mb-4">No hay rutina asignada para {dayLabel}</p>
            <Button variant="outline">
              <Target className="w-4 h-4 mr-2" />
              Asignar Rutina
            </Button>
          </div>
        )}
      </CardContent>
      {howToExercise && (
        <ExerciseHowToModal
          exercise={howToExercise}
          onClose={() => setHowToExercise(null)}
        />
      )}
    </Card>
  )
}

export default ClientDayRoutine
