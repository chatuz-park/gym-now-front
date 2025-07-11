import React, { useState, useEffect } from 'react'
import { clientsAPI } from '../lib/api'
import type { Client } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await clientsAPI.getMe()
        
        // El endpoint devuelve un array con un solo cliente (el autenticado)
        if (response.results && response.results.length > 0) {
          setProfile(response.results[0])
        } else {
          setError('No se encontró información del perfil')
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        setError(err.response?.data?.detail || 'Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSubscriptionTypeLabel = (type?: string) => {
    switch (type) {
      case 'standard':
        return 'Estándar'
      case 'premium':
        return 'Premium'
      case 'personalized':
        return 'Personalizada'
      default:
        return 'No especificada'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando perfil...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg">No se encontró información del perfil</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <Button variant="outline">Editar Perfil</Button>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profile_image} alt={profile.name} />
              <AvatarFallback className="text-lg">
                {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-bold">{profile.name}</div>
              <div className="text-sm text-gray-500">{profile.email}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p className="text-lg">{profile.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
              <p className="text-lg">{profile.birth_date ? formatDate(profile.birth_date) : 'No especificada'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Ingreso</label>
              <p className="text-lg">{formatDate(profile.join_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Suscripción</label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {getSubscriptionTypeLabel(profile.subscription_type)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Física */}
      <Card>
        <CardHeader>
          <CardTitle>Información Física</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Peso</label>
              <p className="text-lg font-semibold">{profile.weight} kg</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Altura</label>
              <p className="text-lg font-semibold">{profile.height} cm</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">IMC</label>
              <p className="text-lg font-semibold">
                {((profile.weight / Math.pow(profile.height / 100, 2))).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Suscripción */}
      {profile.subscription_start && (
        <Card>
          <CardHeader>
            <CardTitle>Información de Suscripción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Inicio de Suscripción</label>
                <p className="text-lg">{formatDate(profile.subscription_start)}</p>
              </div>
              {profile.subscription_end && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Fin de Suscripción</label>
                  <p className="text-lg">{formatDate(profile.subscription_end)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Médica */}
      {(profile.medical_conditions || profile.emergency_contact) && (
        <Card>
          <CardHeader>
            <CardTitle>Información Médica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.emergency_contact && (
              <div>
                <label className="text-sm font-medium text-gray-500">Contacto de Emergencia</label>
                <p className="text-lg">{profile.emergency_contact}</p>
              </div>
            )}
            {profile.medical_conditions && (
              <div>
                <label className="text-sm font-medium text-gray-500">Condiciones Médicas</label>
                <p className="text-lg">{profile.medical_conditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {profile.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{profile.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metas */}
      {profile.goals && Object.keys(profile.goals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(profile.goals).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Profile 