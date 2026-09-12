import { useAuthStore } from '../stores/auth.store'
import type { LoginResult, User, UserRole } from '../stores/auth.store'

export type { LoginResult, User, UserRole }

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile)

  return {
    user,
    login,
    logout,
    refreshUserProfile,
    isAuthenticated: !!user,
    isLoading,
  }
}
