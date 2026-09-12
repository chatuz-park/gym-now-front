import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { plansAPI } from '../lib/api'
import type { Plan } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { PlansListQuery } from '../lib/query-keys'

export function usePlansQuery(params?: PlansListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.plans.list(params),
    queryFn: () => plansAPI.getAll(params),
    enabled: options?.enabled ?? true,
  })
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Plan>) => plansAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all })
    },
  })
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Plan> }) =>
      plansAPI.patch(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => plansAPI.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all })
    },
  })
}
