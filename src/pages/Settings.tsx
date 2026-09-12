import React, { useEffect, useState } from 'react'
import { AlertCircle, Loader2, Search, Shield, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useDebounce } from '../hooks/useDebounce'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useAuth } from '../hooks/useAuth'
import { useUpdateUserRoleMutation, useUsersQuery } from '../hooks/useUsers'
import { handleApiError } from '../lib/api'
import type { ManagedUser } from '../lib/api'
import {
  ROLE_LABELS,
  USER_ROLES,
  canManageRoles,
  type UserRole,
} from '../lib/rbac'
import toast from 'react-hot-toast'

function displayName(user: ManagedUser) {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username
}

function roleBadgeVariant(role: UserRole) {
  switch (role) {
    case 'owner':
      return 'default' as const
    case 'trainer':
      return 'warning' as const
    case 'client':
      return 'success' as const
    default:
      return 'secondary' as const
  }
}

const ROLE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...USER_ROLES.map((role) => ({ id: role, label: ROLE_LABELS[role] })),
]

const Settings: React.FC = () => {
  const { user, refreshUserProfile } = useAuth()
  const canEditRoles = canManageRoles(user?.role)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInputValue, setSearchInputValue] = useState('')
  const [pendingChange, setPendingChange] = useState<{
    target: ManagedUser
    role: UserRole
  } | null>(null)
  useLockBodyScroll(!!pendingChange)

  const searchTerm = searchParams.get('search') || ''
  const roleFilter = searchParams.get('role') || 'all'
  const debouncedSearchValue = useDebounce(searchInputValue, 500)

  const usersQuery = useUsersQuery(
    {
      search: searchTerm || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
    },
    { enabled: canEditRoles },
  )
  const updateRoleMutation = useUpdateUserRoleMutation()

  const users = usersQuery.data ?? []
  const usersLoading = usersQuery.isPending
  const usersError = usersQuery.error ? handleApiError(usersQuery.error) : null

  useEffect(() => {
    setSearchInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      if (debouncedSearchValue) {
        newParams.set('search', debouncedSearchValue)
      } else {
        newParams.delete('search')
      }
      return newParams
    })
  }, [debouncedSearchValue, setSearchParams])

  const handleFilterChange = (filterId: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (filterId === 'all') {
      newParams.delete('role')
    } else {
      newParams.set('role', filterId)
    }
    setSearchParams(newParams)
  }

  const requestRoleChange = (target: ManagedUser, nextRole: UserRole) => {
    if (nextRole === target.role) return
    if (target.is_last_owner && nextRole !== 'owner') return
    setPendingChange({ target, role: nextRole })
  }

  const confirmRoleChange = async () => {
    if (!pendingChange) return
    const { target, role } = pendingChange
    try {
      await updateRoleMutation.mutateAsync({ id: target.id, role })
      toast.success(`Rol de ${displayName(target)} actualizado a ${ROLE_LABELS[role]}`)
      setPendingChange(null)
      if (user?.username === target.username) {
        await refreshUserProfile()
      }
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-600">Asigna roles a los usuarios de la aplicación</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Usuarios y roles</h2>
        <p className="text-sm text-gray-600">
          Los roles definen qué puede ver y hacer cada persona. Solo un propietario puede cambiarlos.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchInputValue}
            onChange={(event) => setSearchInputValue(event.target.value)}
            placeholder="Buscar por nombre, usuario o email"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            size="sm"
            variant={roleFilter === filter.id ? 'default' : 'outline'}
            onClick={() => handleFilterChange(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {usersError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {usersError}
        </div>
      )}

      {usersLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Cargando usuarios…
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No hay usuarios que coincidan con la búsqueda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {users.map((managedUser) => {
            const isCurrentUser = user?.username === managedUser.username
            const roleLocked = managedUser.is_last_owner

            return (
              <Card key={managedUser.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{displayName(managedUser)}</CardTitle>
                      <p className="truncate text-sm text-gray-500">@{managedUser.username}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
                      {isCurrentUser && (
                        <Badge variant="outline">Tú</Badge>
                      )}
                      <Badge variant={roleBadgeVariant(managedUser.role)}>
                        {ROLE_LABELS[managedUser.role]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {managedUser.email && (
                    <p className="truncate text-sm text-gray-600">{managedUser.email}</p>
                  )}
                  {managedUser.client_id != null && (
                    <p className="flex items-center text-sm text-gray-500">
                      <UserRound className="mr-1.5 h-4 w-4" />
                      Tiene ficha de socio
                    </p>
                  )}
                  {roleLocked && (
                    <p className="flex items-center text-sm text-amber-700">
                      <Shield className="mr-1.5 h-4 w-4" />
                      Último propietario: no se puede cambiar este rol
                    </p>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Rol
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={managedUser.role}
                      disabled={!canEditRoles || roleLocked || updateRoleMutation.isPending}
                      onChange={(event) =>
                        requestRoleChange(managedUser, event.target.value as UserRole)
                      }
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {pendingChange && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar cambio de rol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 text-amber-500" />
                <div>
                  <p>
                    ¿Cambiar el rol de <strong>{displayName(pendingChange.target)}</strong> de{' '}
                    {ROLE_LABELS[pendingChange.target.role]} a {ROLE_LABELS[pendingChange.role]}?
                  </p>
                  {user?.username === pendingChange.target.username &&
                    pendingChange.role !== 'owner' && (
                      <p className="mt-2 text-sm text-gray-600">
                        Si dejas de ser propietario, saldrás de Ajustes.
                      </p>
                    )}
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPendingChange(null)}
                  disabled={updateRoleMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => void confirmRoleChange()}
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Settings
