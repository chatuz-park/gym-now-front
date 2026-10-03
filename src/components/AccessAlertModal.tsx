import { useEffect } from 'react'
import { Fingerprint, CreditCard, ShieldCheck, ShieldX } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import type { AccessDecision, AccessDenialReason } from '../lib/api'

const DENIAL_COPY: Record<Exclude<AccessDenialReason, ''>, string> = {
  unknown: 'Esta huella o tarjeta no está emparejada con ningún cliente.',
  inactive_credential: 'La credencial está desactivada.',
  no_subscription: 'El cliente no tiene una suscripción activa.',
  not_started: 'La suscripción todavía no comienza.',
  expired: 'La suscripción está vencida.',
}

export function formatDaysRemaining(days: number | null, authorized: boolean): string {
  if (days === null) {
    return authorized ? 'Suscripción sin fecha de vencimiento' : 'Sin días de suscripción'
  }
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Le queda 1 día'
  if (days > 1) return `Le quedan ${days} días`
  const elapsed = Math.abs(days)
  return elapsed === 1 ? 'Venció hace 1 día' : `Venció hace ${elapsed} días`
}

function modalityLabel(modality: AccessDecision['modality']) {
  if (modality === 'card') return 'Tarjeta'
  if (modality === 'fingerprint') return 'Huella'
  return 'Credencial'
}

interface AccessAlertModalProps {
  decision: AccessDecision
  detail?: string
  onClose: () => void
}

const AccessAlertModal: React.FC<AccessAlertModalProps> = ({ decision, detail, onClose }) => {
  useLockBodyScroll(true)

  useEffect(() => {
    const timer = window.setTimeout(onClose, 8000)
    return () => window.clearTimeout(timer)
  }, [decision, onClose])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const authorized = decision.authorized
  const client = decision.client
  const title = detail
    ? 'No se pudo verificar'
    : authorized
      ? 'Acceso autorizado'
      : 'Acceso denegado'
  const reason = detail
    || (decision.denial_reason
      ? DENIAL_COPY[decision.denial_reason] || 'No se pudo autorizar el acceso.'
      : '')
  const initials = (client?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="access-alert-title"
      aria-describedby="access-alert-days"
    >
      <Card className="w-full max-w-md overflow-hidden shadow-2xl">
        <div className={authorized ? 'bg-green-600 px-6 py-4 text-white' : 'bg-red-600 px-6 py-4 text-white'}>
          <div className="flex items-center gap-3">
            {authorized ? <ShieldCheck className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />}
            <h2 id="access-alert-title" className="text-xl font-semibold">
              {title}
            </h2>
          </div>
        </div>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {client?.profile_image ? (
                <AvatarImage src={client.profile_image} alt={client.name} />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-gray-900">
                {client?.name || 'Credencial desconocida'}
              </p>
              <p className="text-sm text-gray-500">
                {client?.plan_name || client?.subscription_type || modalityLabel(decision.modality)}
              </p>
            </div>
          </div>

          <div
            id="access-alert-days"
            className={
              authorized
                ? 'rounded-xl bg-green-50 px-4 py-5 text-center'
                : 'rounded-xl bg-red-50 px-4 py-5 text-center'
            }
          >
            <p className={`text-3xl font-bold ${authorized ? 'text-green-700' : 'text-red-700'}`}>
              {decision.days_remaining === null ? '—' : decision.days_remaining}
            </p>
            <p className={`mt-1 text-sm font-medium ${authorized ? 'text-green-800' : 'text-red-800'}`}>
              {formatDaysRemaining(decision.days_remaining, authorized)}
            </p>
          </div>

          {!authorized && reason && (
            <p className="text-center text-sm text-gray-600">{reason}</p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            {decision.modality === 'card' ? (
              <CreditCard className="h-3.5 w-3.5" />
            ) : (
              <Fingerprint className="h-3.5 w-3.5" />
            )}
            <span>
              {modalityLabel(decision.modality)}
              {decision.device_id ? ` · ${decision.device_id}` : ''}
              {!client ? ` · ${decision.identifier}` : ''}
            </span>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccessAlertModal
