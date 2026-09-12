import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsAPI, progressMetricsAPI, routineProgressAPI } from '../lib/api'
import type { ProgressMetrics } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { ListQuery } from '../lib/query-keys'

export function useGoalsQuery(params?: ListQuery) {
  return useQuery({
    queryKey: queryKeys.goals.list(params),
    queryFn: () => goalsAPI.getAll(params),
  })
}

export function useProgressMetricsQuery(params?: { ordering?: string }) {
  return useQuery({
    queryKey: queryKeys.progress.list(params),
    queryFn: () => progressMetricsAPI.getAll(params),
  })
}

export function useClientProgressMetricsQuery(
  params?: { ordering?: string; client_id?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.progress.clientProgress(params),
    queryFn: () => progressMetricsAPI.getClientProgress(params),
    enabled: options?.enabled ?? !!params?.client_id,
  })
}

export function useRoutineProgressQuery(params?: { ordering?: string }) {
  return useQuery({
    queryKey: queryKeys.routineProgress.list(params),
    queryFn: () => routineProgressAPI.getAll(params),
  })
}

export function useCreateProgressMetricsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ProgressMetrics>) => progressMetricsAPI.create(data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      if (variables.client_id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.clients.progress(variables.client_id),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.progress.byClient(variables.client_id),
        })
      }
    },
  })
}
