import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { routinesAPI } from '../lib/api'
import type { RoutineInput } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { ListQuery } from '../lib/query-keys'

export function useRoutinesQuery(params?: ListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.routines.list(params),
    queryFn: () => routinesAPI.getAll({
      search: params?.search,
      ordering: params?.ordering,
    }),
    enabled: options?.enabled ?? true,
  })
}

export function useCreateRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RoutineInput>) => routinesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all })
    },
  })
}

export function useUpdateRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoutineInput> }) =>
      routinesAPI.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all })
    },
  })
}

export function useDeleteRoutineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => routinesAPI.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all })
    },
  })
}
