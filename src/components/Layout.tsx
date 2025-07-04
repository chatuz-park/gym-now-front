import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Calendar, BarChart3, Settings, LogOut, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const tabs = [
    { id: '/', label: 'Inicio', icon: Home, path: '/' },
    { id: '/clients', label: 'Clientes', icon: Users, path: '/clients' },
    { id: '/routines', label: 'Rutinas', icon: Calendar, path: '/routines' },
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
      <main className="main-content pb-16 md:ml-64 p-4 md:p-6">
        <Outlet />
      </main>
      
      {/* Mobile Navigation */}
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

      {/* Desktop Navigation Sidebar */}
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
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
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
      </nav>
    </div>
  )
}

export default Layout 