import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientRoutinesAPI } from '../lib/api'
import type { ClientRoutine, CompleteWorkoutInput } from '../lib/api'
import { queryKeys } from '../lib/query-keys'

export function useClientRoutinesQuery(params?: { ordering?: string }) {
  return useQuery({
    queryKey: queryKeys.clientRoutines.list(params),
    queryFn: () => clientRoutinesAPI.getAll(params),
  })
}

export function useClientRoutinesByClientQuery(
  clientId: number | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.clientRoutines.byClient(clientId!),
    queryFn: () => clientRoutinesAPI.getByClientId(clientId!),
    enabled: options?.enabled ?? !!clientId,
  })
}

function invalidateClientRoutineCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId?: number
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.clientRoutines.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
  if (clientId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.clientRoutines.byClient(clientId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) })
  }
}

export function useCreateClientRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ClientRoutine>) => clientRoutinesAPI.create(data),
    onSuccess: (_result, variables) => {
      invalidateClientRoutineCaches(queryClient, variables.client_id)
    },
  })
}

export function usePatchClientRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClientRoutine> }) =>
      clientRoutinesAPI.patch(id, data),
    onSuccess: (result) => {
      invalidateClientRoutineCaches(queryClient, result.client_id)
    },
  })
}

export function useClientRoutineProgressQuery(
  clientRoutineId: number | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.clientRoutines.progress(clientRoutineId!),
    queryFn: () => clientRoutinesAPI.getProgress(clientRoutineId!),
    enabled: options?.enabled ?? !!clientRoutineId,
  })
}

export function useCompleteWorkoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompleteWorkoutInput }) =>
      clientRoutinesAPI.completeWorkout(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clientRoutines.progress(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.routineProgress.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useDeleteClientRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientRoutinesAPI.delete(id),
    onSuccess: () => {
      invalidateClientRoutineCaches(queryClient)
    },
  })
}
