import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exercisesAPI } from '../lib/api'
import type { Exercise } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { ListQuery } from '../lib/query-keys'

export function useExercisesQuery(params?: ListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.exercises.list(params),
    queryFn: () => exercisesAPI.getAll(params),
    enabled: options?.enabled ?? true,
  })
}

export function useCreateExerciseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Exercise>) => exercisesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}

export function useUpdateExerciseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Exercise> }) =>
      exercisesAPI.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}

export function useDeleteExerciseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => exercisesAPI.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}

export function useUploadExerciseImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exerciseId, file }: { exerciseId: number; file: File }) =>
      exercisesAPI.uploadImage(exerciseId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    },
  })
}
