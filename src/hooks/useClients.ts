import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsAPI } from '../lib/api'
import type { Client } from '../lib/api'
import { queryKeys } from '../lib/query-keys'
import type { ListQuery } from '../lib/query-keys'

export function resolveMeClient(response: unknown): Client | null {
  if (!response || typeof response !== 'object') return null
  if ('results' in response && Array.isArray((response as { results: Client[] }).results)) {
    return (response as { results: Client[] }).results[0] ?? null
  }
  if ('id' in response) return response as Client
  return null
}

export function useClientsQuery(params?: ListQuery) {
  return useQuery({
    queryKey: queryKeys.clients.list(params),
    queryFn: () => clientsAPI.getAll({
      search: params?.search,
      ordering: params?.ordering,
    }),
  })
}

export function useClientQuery(id: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id!),
    queryFn: () => clientsAPI.getById(id!),
    enabled: options?.enabled ?? !!id,
  })
}

export function useMeQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.clients.me(),
    queryFn: async () => {
      const response = await clientsAPI.getMe()
      const client = resolveMeClient(response)
      if (!client) throw new Error('No se encontró información del perfil')
      return client
    },
    enabled: options?.enabled ?? true,
  })
}

export function useClientProgressQuery(clientId: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.clients.progress(clientId!),
    queryFn: () => clientsAPI.getProgress(clientId!),
    enabled: options?.enabled ?? !!clientId,
  })
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientsAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientsAPI.update(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.me() })
    },
  })
}

export function usePatchClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientsAPI.patch(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.me() })
    },
  })
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientsAPI.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useUploadProfileImageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, file }: { clientId: number; file: File }) =>
      clientsAPI.uploadProfileImage(clientId, file),
    onSuccess: (_result, { clientId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}
