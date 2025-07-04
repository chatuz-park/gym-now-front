import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, User, Lock, Activity, Users, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/'

  // Mock users for demonstration
  const mockUsers = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
    { username: 'trainer', password: 'trainer123', role: 'trainer', name: 'Entrenador' },
    { username: 'maria', password: 'maria123', role: 'client', name: 'María González', clientId: '1' },
    { username: 'carlos', password: 'carlos123', role: 'client', name: 'Carlos Rodríguez', clientId: '2' },
    { username: 'ana', password: 'ana123', role: 'client', name: 'Ana Martínez', clientId: '3' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(formData.username, formData.password)
      
      if (result.success) {
        // Navigate based on role
        const user = mockUsers.find(u => u.username === formData.username)
        if (user?.role === 'client') {
          navigate(`/my-routine`)
        } else {
          navigate(from)
        }
      } else {
        setError(result.error || 'Error de autenticación')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (role: string) => {
    let demoUser
    switch (role) {
      case 'admin':
        demoUser = mockUsers.find(u => u.role === 'admin')
        break
      case 'trainer':
        demoUser = mockUsers.find(u => u.role === 'trainer')
        break
      case 'client':
        demoUser = mockUsers.find(u => u.role === 'client')
        break
    }

    if (demoUser) {
      setFormData({
        username: demoUser.username,
        password: demoUser.password
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Gym Now</CardTitle>
              <p className="text-gray-600">Inicia sesión en tu cuenta</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3 text-center">Cuentas de demostración:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('admin')}
                    className="text-xs"
                  >
                    Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('trainer')}
                    className="text-xs"
                  >
                    Trainer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin('client')}
                    className="text-xs"
                  >
                    Cliente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Gestiona tu gimnasio de manera inteligente
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Plataforma completa para la gestión de clientes, rutinas y seguimiento de progreso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Gestión de Clientes</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Administra perfiles, suscripciones y seguimiento personalizado de cada cliente
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Rutinas Personalizadas</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Crea y asigna rutinas específicas según los objetivos y nivel de cada cliente
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Seguimiento de Progreso</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Monitorea el avance con medidas antropométricas y métricas de rendimiento
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Dashboard Intuitivo</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Interfaz moderna y responsive para una experiencia de usuario excepcional
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">500+</div>
              <div className="text-sm text-gray-600">Clientes Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">50+</div>
              <div className="text-sm text-gray-600">Rutinas Creadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">95%</div>
              <div className="text-sm text-gray-600">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 