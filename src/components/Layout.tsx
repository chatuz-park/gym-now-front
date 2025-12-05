import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Calendar, BarChart3, Settings, LogOut, User, Dumbbell } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import ProfileImageUploadModal from './ProfileImageUploadModal'
import { clientsAPI } from '../lib/api'
import type { Client } from '../lib/api'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [clientProfile, setClientProfile] = useState<Client | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Determinar si el usuario es un cliente o guest
  const isClientOrGuest = user?.role === 'client' || user?.role === 'guest'

  // Cargar perfil del cliente si el usuario es un cliente
  useEffect(() => {
    const loadClientProfile = async () => {
      // Solo intentar cargar si el usuario es cliente o guest
      if (user?.role === 'client' || user?.role === 'guest') {
        try {
          const response = await clientsAPI.getMe()
          
          // Manejar respuesta paginada o directa
          if ('results' in response && Array.isArray(response.results) && response.results.length > 0) {
            setClientProfile(response.results[0])
          } else if ('id' in response) {
            setClientProfile(response as Client)
          }
        } catch (error) {
          // Si falla, simplemente no mostramos la imagen
          console.error('Error loading client profile in Layout:', error)
        }
      }
    }

    if (user) {
      loadClientProfile()
    }
  }, [user])

  const tabs = [
    { id: '/', label: 'Inicio', icon: Home, path: '/' },
    { id: '/clients', label: 'Clientes', icon: Users, path: '/clients' },
    { id: '/routines', label: 'Rutinas', icon: Calendar, path: '/routines' },
    { id: '/exercises', label: 'Ejercicios', icon: Dumbbell, path: '/exercises' },
    { id: '/progress', label: 'Progreso', icon: BarChart3, path: '/progress' },
    { id: '/settings', label: 'Ajustes', icon: Settings, path: '/settings' },
  ]

  const isActiveTab = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout-container min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className={cn(
        "main-content p-4 md:p-6",
        // Solo aplicar margen izquierdo si no es cliente o guest
        !isClientOrGuest && "md:ml-64",
        // Ajustar espaciado para clientes y guests
        isClientOrGuest ? "pt-16 pb-4" : "pb-16"
      )}>
        <Outlet />
      </main>
      
      {/* Mobile Navigation - Solo mostrar si no es cliente o guest */}
      {!isClientOrGuest && (
        <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = isActiveTab(tab.path)
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full py-2 px-1 transition-colors",
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* Desktop Navigation Sidebar - Solo mostrar si no es cliente o guest */}
      {!isClientOrGuest && (
        <nav className="desktop-sidebar hidden md:block fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200">
          <div className="sidebar-content p-6 h-full flex flex-col">
            <div className="sidebar-header flex items-center space-x-2 mb-8">
              <div className="logo-container w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <h1 className="app-title text-xl font-bold text-gray-900">GymNow</h1>
            </div>
            
            <div className="sidebar-menu space-y-2 flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = isActiveTab(tab.path)
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={cn(
                      "sidebar-menu-item flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* User Info and Logout */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={() => {
                    // Solo mostrar modal si hay perfil de cliente, sino navegar a /me
                    if (clientProfile) {
                      setIsUploadModalOpen(true)
                    } else {
                      navigate('/me')
                    }
                  }}
                  className="relative group"
                  type="button"
                >
                  <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent group-hover:ring-primary-500 transition-all">
                    {clientProfile?.profile_image ? (
                      <AvatarImage src={clientProfile.profile_image} alt={user?.name || user?.username || ''} />
                    ) : null}
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/me')}
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header para clientes y guests cuando no hay sidebar */}
      {isClientOrGuest && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="logo-container w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <h1 className="app-title text-lg font-bold text-gray-900">GymNow</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/me')}
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Modal para subir foto de perfil */}
      {clientProfile && (
        <ProfileImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          clientId={clientProfile.id}
          currentImageUrl={clientProfile.profile_image}
          clientName={clientProfile.name}
          onUploadSuccess={(imageUrl) => {
            // Actualizar la imagen en el perfil local
            setClientProfile((prev) => prev ? { ...prev, profile_image: imageUrl } : null)
            // Recargar el perfil completo
            clientsAPI.getMe().then((response) => {
              if ('results' in response && Array.isArray(response.results) && response.results.length > 0) {
                setClientProfile(response.results[0])
              } else if ('id' in response) {
                setClientProfile(response as Client)
              }
            }).catch(console.error)
          }}
        />
      )}
    </div>
  )
}

export default Layout 