import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CreditCard, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useAuth } from '../hooks/useAuth'
import { useMeQuery } from '../hooks/useClients'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { isMember } from '../lib/rbac'
import { isSubscriptionExpired, parseLocalDate } from '../definitions'
import { formatDate } from '../lib/utils'

const MEMBER_HOME = '/me'

function formatEndDate(endDate: string): string {
  const local = parseLocalDate(endDate)
  return formatDate(local ?? endDate)
}

const SubscriptionExpiredOverlay: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const memberView = isAuthenticated && isMember(user?.role)
  const { data: client } = useMeQuery({ enabled: memberView })
  const expired = memberView && isSubscriptionExpired(client?.subscription_end)

  useLockBodyScroll(!!expired)

  useEffect(() => {
    const shell = document.getElementById('app-shell')
    if (!shell) return
    if (expired) {
      shell.setAttribute('inert', '')
    } else {
      shell.removeAttribute('inert')
    }
    return () => shell.removeAttribute('inert')
  }, [expired])

  useEffect(() => {
    if (!expired) return
    if (location.pathname !== MEMBER_HOME && location.pathname !== '/login') {
      navigate(MEMBER_HOME, { replace: true })
    }
  }, [expired, location.pathname, navigate])

  if (!expired || !client) return null

  const planName = client.plan?.name || client.subscription_type
  const endLabel = client.subscription_end ? formatEndDate(client.subscription_end) : ''

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="subscription-expired-title"
      aria-describedby="subscription-expired-description"
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <CreditCard className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle id="subscription-expired-title" className="text-xl text-gray-900">
            Tu suscripción ha vencido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p id="subscription-expired-description" className="text-sm text-gray-600 text-center">
            El acceso a Gym Now está bloqueado porque{' '}
            {planName ? (
              <>
                tu plan <span className="font-semibold text-gray-900">{planName}</span>
              </>
            ) : (
              'tu suscripción'
            )}
            {endLabel ? (
              <>
                {' '}terminó el <span className="font-semibold text-gray-900">{endLabel}</span>.
              </>
            ) : (
              ' ya terminó.'
            )}
            {' '}No puedes ver tu rutina ni tu progreso hasta que el gimnasio la renueve.
          </p>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Habla con recepción o con tu entrenador para reactivar el plan. Cuando lo hagan, vuelve a iniciar sesión.
          </div>
          <Button variant="outline" className="w-full" onClick={() => void handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubscriptionExpiredOverlay
