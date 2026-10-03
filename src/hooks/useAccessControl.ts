import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accessAPI } from '../lib/api'
import type { AccessModality } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { AccessCredentialsQuery } from '../lib/query-keys'

export function useAccessCredentialsQuery(params?: AccessCredentialsQuery) {
  return useQuery({
    queryKey: queryKeys.access.credentials(params),
    queryFn: () => accessAPI.listCredentials(params),
  })
}

export function useAccessLogsQuery(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.access.logs(),
    queryFn: () => accessAPI.listLogs(),
    refetchInterval: options?.refetchInterval,
  })
}

export function useCreateAccessCredentialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      client_id: number
      modality: AccessModality
      identifier: string
      label?: string
    }) => accessAPI.createCredential(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.access.all })
    },
  })
}

export function usePatchAccessCredentialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      accessAPI.patchCredential(id, { is_active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.access.all })
    },
  })
}

export function useDeleteAccessCredentialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => accessAPI.deleteCredential(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.access.all })
    },
  })
}
