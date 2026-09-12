/** Roles del contrato OpenAPI (`UserProfile.role` / `x-required-roles`). */
export const USER_ROLES = ['client', 'guest', 'trainer', 'owner'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const STAFF_ROLES: readonly UserRole[] = ['owner', 'trainer']
export const MEMBER_ROLES: readonly UserRole[] = ['client', 'guest']
export const OWNER_ROLES: readonly UserRole[] = ['owner']

export function isUserRole(value: string | undefined | null): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value)
}

export function asUserRole(value: string | undefined | null): UserRole {
  if (isUserRole(value)) return value
  return 'guest'
}

export function isStaff(role: UserRole | undefined | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

export function isMember(role: UserRole | undefined | null): boolean {
  return !!role && (MEMBER_ROLES as readonly string[]).includes(role)
}

export function isOwner(role: UserRole | undefined | null): boolean {
  return role === 'owner'
}

export function canDeleteClient(role: UserRole | undefined | null): boolean {
  return isOwner(role)
}

export function canViewCredentials(role: UserRole | undefined | null): boolean {
  return isOwner(role)
}

export function canManageRoles(role: UserRole | undefined | null): boolean {
  return isOwner(role)
}

export function canManagePlans(role: UserRole | undefined | null): boolean {
  return isOwner(role)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  trainer: 'Entrenador',
  client: 'Socio',
  guest: 'Invitado',
}

export function getHomePath(role: UserRole | undefined | null): string {
  return isMember(role) ? '/me' : '/'
}
