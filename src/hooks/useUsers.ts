import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../lib/api'
import type { UserRole } from '../lib/rbac'
import { queryKeys } from '../lib/query-keys'
import type { UsersListQuery } from '../lib/query-keys'

export function useUsersQuery(params?: UsersListQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersAPI.getAll(params),
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      usersAPI.updateRole(id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}
