import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authAPI, clearAuthStorage, setOnSessionExpired } from '../lib/api'
import { useNavigate } from 'react-router-dom'

interface User {
  username: string
  role: 'client' | 'guest' | 'trainer' | 'owner'
  name: string
  clientId?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null)
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    })
    return () => setOnSessionExpired(null)
  }, [navigate])

  // Función para cargar el perfil del usuario desde la API
  const loadUserProfile = async () => {
    try {
      const userProfile = await authAPI.getUserProfile()
      const user: User = {
        username: userProfile.username,
        role: userProfile.role as 'client' | 'guest' | 'trainer' | 'owner',
        name: userProfile.first_name && userProfile.last_name 
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : userProfile.username,
        clientId: undefined
      }
      
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      return user
    } catch (error: any) {
      console.error('Error loading user profile:', error)
      
      // El interceptor ya limpia la sesión en 401; no restaurar usuario en memoria
      if (error.response?.status === 401) {
        setUser(null)
        return null
      }
      
      throw error
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }

    loadUserProfile()
      .catch((error) => {
        console.error('Failed to load user profile:', error)
        // Si el token ya no existe, la sesión expiró: no restaurar el usuario cacheado
        if (!localStorage.getItem('token')) {
          setUser(null)
          return
        }

        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError)
            localStorage.removeItem('user')
          }
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password)
      if (response.success) {
        const { token, refreshToken } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('username', username)
        
        // Cargar el perfil del usuario desde la API
        try {
          await loadUserProfile()
          return { success: true }
        } catch (profileError) {
          console.error('Error loading user profile after login:', profileError)
          // Si falla la carga del perfil, crear un usuario básico
          const user: User = {
            username,
            role: 'owner', // Por defecto
            name: username,
            clientId: undefined
          }
          
          localStorage.setItem('user', JSON.stringify(user))
          setUser(user)
          return { success: true }
        }
      } else {
        return { success: false, error: 'Error de autenticación' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de conexión' }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setUser(null)
      clearAuthStorage()
    }
  }

  const refreshUserProfile = async () => {
    await loadUserProfile()
  }

  const value = {
    user,
    login,
    logout,
    refreshUserProfile,
    isAuthenticated: !!user,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 