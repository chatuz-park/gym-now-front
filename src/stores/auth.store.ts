import { create } from 'zustand'
import { isAxiosError } from 'axios'
import { authAPI, clientsAPI, clearAuthStorage } from '../lib/api'
import { queryClient } from '../lib/query-client'
import { asUserRole, isMember, type UserRole } from '../lib/rbac'

export type { UserRole }

export interface User {
  username: string
  role: UserRole
  name: string
  clientId?: string
}

export interface LoginResult {
  success: boolean
  error?: string
  user?: User | null
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  hydrate: () => Promise<void>
  clearSession: () => void
}

function mapProfileToUser(userProfile: {
  username: string
  role: string
  first_name?: string
  last_name?: string
}): User {
  return {
    username: userProfile.username,
    role: asUserRole(userProfile.role),
    name:
      userProfile.first_name && userProfile.last_name
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile.username,
    clientId: undefined,
  }
}

function extractClientId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  if ('id' in payload && typeof (payload as { id: unknown }).id === 'number') {
    return String((payload as { id: number }).id)
  }
  if ('results' in payload && Array.isArray((payload as { results: { id?: number }[] }).results)) {
    const first = (payload as { results: { id?: number }[] }).results[0]
    return first?.id !== undefined ? String(first.id) : undefined
  }
  return undefined
}

async function loadUserProfile(): Promise<User | null> {
  try {
    const userProfile = await authAPI.getUserProfile()
    const user = mapProfileToUser(userProfile)

    if (isMember(user.role)) {
      try {
        const me = await clientsAPI.getMe()
        user.clientId = extractClientId(me)
      } catch (meError) {
        console.error('Error loading client profile:', meError)
      }
    }

    localStorage.setItem('user', JSON.stringify(user))
    return user
  } catch (error: unknown) {
    console.error('Error loading user profile:', error)

    if (isAxiosError(error) && error.response?.status === 401) {
      return null
    }

    throw error
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  clearSession: () => {
    set({ user: null, isLoading: false })
    clearAuthStorage()
    queryClient.clear()
  },

  hydrate: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ user: null, isLoading: false })
      return
    }

    try {
      const user = await loadUserProfile()
      set({ user, isLoading: false })
    } catch (error) {
      console.error('Failed to load user profile:', error)

      if (!localStorage.getItem('token')) {
        set({ user: null, isLoading: false })
        return
      }

      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          set({ user: JSON.parse(storedUser) as User, isLoading: false })
          return
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError)
          localStorage.removeItem('user')
        }
      }

      set({ user: null, isLoading: false })
    }
  },

  login: async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      if (!response.success) {
        return { success: false, error: 'Error de autenticación' }
      }

      const { token, refreshToken } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('username', username)

      try {
        const profile = await loadUserProfile()
        if (!profile) {
          clearAuthStorage()
          set({ user: null, isLoading: false })
          return { success: false, error: 'No se pudo cargar el perfil del usuario' }
        }
        set({ user: profile, isLoading: false })
        return { success: true, user: profile }
      } catch (profileError) {
        console.error('Error loading user profile after login:', profileError)
        clearAuthStorage()
        set({ user: null, isLoading: false })
        return { success: false, error: 'No se pudo cargar el perfil del usuario' }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de conexión'
      return { success: false, error: message }
    }
  },

  logout: async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      set({ user: null, isLoading: false })
      clearAuthStorage()
      queryClient.clear()
    }
  },

  refreshUserProfile: async () => {
    const user = await loadUserProfile()
    set({ user })
  },
}))
