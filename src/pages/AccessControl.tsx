import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CreditCard,
  DoorOpen,
  Fingerprint,
  Loader2,
  Plug,
  Radio,
  RefreshCw,
  Trash2,
  Unplug,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import AccessAlertModal from '../components/AccessAlertModal'
import { useDebounce } from '../hooks/useDebounce'
import { useClientsQuery } from '../hooks/useClients'
import { useGateway } from '../hooks/useGateway'
import {
  useAccessCredentialsQuery,
  useAccessLogsQuery,
  useCreateAccessCredentialMutation,
  useDeleteAccessCredentialMutation,
  usePatchAccessCredentialMutation,
} from '../hooks/useAccessControl'
import { accessAPI, handleApiError } from '../lib/api'
import type { AccessDecision, AccessModality, Client } from '../lib/api'
import {
  loadAccessSettings,
  saveAccessSettings,
  type AccessStationSettings,
  type HardwareRead,
} from '../lib/gateway'
import { queryKeys } from '../lib/query-keys'
import { useQueryClient } from '@tanstack/react-query'

const MODALITIES: { id: AccessModality; label: string }[] = [
  { id: 'fingerprint', label: 'Huella' },
  { id: 'card', label: 'Tarjeta' },
]

function modalityLabel(modality: string) {
  return modality === 'card' ? 'Tarjeta' : modality === 'fingerprint' ? 'Huella' : modality || '—'
}

function gatewayStatusLabel(status: string) {
  switch (status) {
    case 'open':
      return 'Conectado'
    case 'connecting':
      return 'Conectando'
    case 'error':
      return 'Error'
    case 'closed':
      return 'Reconectando'
    default:
      return 'Desconectado'
  }
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'

const AccessControl: React.FC = () => {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<AccessStationSettings>(() => loadAccessSettings())
  const [gatewayUrlDraft, setGatewayUrlDraft] = useState(() => settings.gatewayUrl)
  const [connectedWanted, setConnectedWanted] = useState(() => settings.connected)
  const [controlActive, setControlActive] = useState(() => settings.controlActive)
  const [capturing, setCapturing] = useState(false)
  const [modality, setModality] = useState<AccessModality>('fingerprint')
  const [identifier, setIdentifier] = useState('')
  const [label, setLabel] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [alert, setAlert] = useState<{ decision: AccessDecision; detail?: string } | null>(null)
  const [credentialToDelete, setCredentialToDelete] = useState<number | null>(null)

  const debouncedSearch = useDebounce(clientSearch, 400)
  const clientsQuery = useClientsQuery({ search: debouncedSearch || undefined })
  const credentialsQuery = useAccessCredentialsQuery()
  const logsQuery = useAccessLogsQuery({ refetchInterval: controlActive ? 15000 : false })
  const createCredential = useCreateAccessCredentialMutation()
  const patchCredential = usePatchAccessCredentialMutation()
  const deleteCredential = useDeleteAccessCredentialMutation()

  const controlRef = useRef(controlActive)
  const capturingRef = useRef(capturing)
  const settingsRef = useRef(settings)
  const sendRef = useRef<(command: { action: 'open_door'; device_id: string }) => boolean>(() => false)
  const lastRead = useRef({ key: '', at: 0 })
  const pendingListPorts = useRef(false)

  controlRef.current = controlActive
  capturingRef.current = capturing
  settingsRef.current = {
    ...settings,
    connected: connectedWanted,
    controlActive,
  }

  const closeAlert = useCallback(() => setAlert(null), [])

  const handleHardwareRead = useCallback((read: HardwareRead) => {
    const station = settingsRef.current
    if (station.readerDeviceId && read.device_id !== station.readerDeviceId) return

    const key = `${read.device_id}:${read.data}`
    const now = Date.now()
    if (lastRead.current.key === key && now - lastRead.current.at < 2500) return
    lastRead.current = { key, at: now }

    if (capturingRef.current) {
      setIdentifier(read.data)
      setCapturing(false)
      toast.success('Lectura capturada. Confirma el emparejamiento.')
      return
    }

    if (!controlRef.current) return

    void (async () => {
      try {
        const decision = await accessAPI.identify({
          identifier: read.data,
          device_id: read.device_id,
        })
        setAlert({ decision })
        if (decision.authorized && station.autoOpenDoor && station.doorDeviceId) {
          sendRef.current({ action: 'open_door', device_id: station.doorDeviceId })
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.access.logs() })
      } catch (error) {
        setAlert({
          decision: {
            authorized: false,
            result: 'denied',
            denial_reason: '',
            days_remaining: null,
            identifier: read.data,
            device_id: read.device_id,
            modality: null,
            client: null,
          },
          detail: handleApiError(error),
        })
      }
    })()
  }, [queryClient])

  const listenDeviceId = (controlActive || capturing) ? settings.readerDeviceId : ''
  const gateway = useGateway({
    url: settings.gatewayUrl,
    enabled: connectedWanted,
    listenDeviceId,
    onHardwareRead: handleHardwareRead,
  })
  sendRef.current = gateway.send

  useEffect(() => {
    const next = settingsRef.current
    saveAccessSettings(next)
    setSettings((current) => {
      if (current.connected === next.connected && current.controlActive === next.controlActive) {
        return current
      }
      return { ...current, connected: next.connected, controlActive: next.controlActive }
    })
  }, [settings.gatewayUrl, settings.readerDeviceId, settings.doorDeviceId, settings.autoOpenDoor, connectedWanted, controlActive])

  useEffect(() => {
    const persist = () => saveAccessSettings(settingsRef.current)
    window.addEventListener('pagehide', persist)
    return () => window.removeEventListener('pagehide', persist)
  }, [])

  useEffect(() => {
    if (gateway.status !== 'open') return
    pendingListPorts.current = false
    gateway.send({ action: 'list_ports' })
  }, [gateway.status, gateway.send])

  const updateSettings = (patch: Partial<AccessStationSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }

  const portOptions = useMemo(() => {
    const values = new Set(gateway.ports)
    if (settings.readerDeviceId) values.add(settings.readerDeviceId)
    if (settings.doorDeviceId) values.add(settings.doorDeviceId)
    return Array.from(values)
  }, [gateway.ports, settings.readerDeviceId, settings.doorDeviceId])

  const clientOptions = clientsQuery.data?.results ?? []
  const credentials = credentialsQuery.data ?? []
  const logs = logsQuery.data ?? []
  const readerListening = gateway.listening.includes(settings.readerDeviceId)

  const connectGateway = () => {
    const url = gatewayUrlDraft.trim()
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      toast.error('La dirección del gateway debe empezar por ws:// o wss://.')
      return
    }
    setGatewayUrlDraft(url)
    updateSettings({ gatewayUrl: url })
    setConnectedWanted(true)
  }

  const disconnectGateway = () => {
    if (settings.readerDeviceId) {
      gateway.send({ action: 'stop_listen', device_id: settings.readerDeviceId })
    }
    setControlActive(false)
    setCapturing(false)
    setConnectedWanted(false)
  }

  const listPorts = () => {
    if (gateway.status !== 'open') {
      pendingListPorts.current = true
      connectGateway()
      return
    }
    const sent = gateway.send({ action: 'list_ports' })
    if (!sent) toast.error('El gateway no está conectado.')
  }

  const toggleControl = () => {
    if (controlActive) {
      setControlActive(false)
      return
    }
    if (!settings.readerDeviceId) {
      toast.error('Elige el puerto del lector antes de activar el control.')
      return
    }
    connectGateway()
    setControlActive(true)
  }

  const startCapture = () => {
    if (!settings.readerDeviceId) {
      toast.error('Elige el puerto del lector para capturar la lectura.')
      return
    }
    connectGateway()
    setCapturing(true)
  }

  const pairCredential = async () => {
    if (!selectedClient) {
      toast.error('Selecciona el cliente a emparejar.')
      return
    }
    if (!identifier.trim()) {
      toast.error('Captura o escribe el identificador de la huella o tarjeta.')
      return
    }
    try {
      await createCredential.mutateAsync({
        client_id: selectedClient.id,
        modality,
        identifier: identifier.trim(),
        label: label.trim(),
      })
      toast.success(`${selectedClient.name} quedó emparejado.`)
      setIdentifier('')
      setLabel('')
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const toggleCredential = async (id: number, isActive: boolean) => {
    try {
      await patchCredential.mutateAsync({ id, is_active: !isActive })
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const confirmDelete = async () => {
    if (credentialToDelete == null) return
    try {
      await deleteCredential.mutateAsync(credentialToDelete)
      toast.success('Credencial eliminada.')
      setCredentialToDelete(null)
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de acceso</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Empareja huellas y tarjetas con cada cliente. Con el control activo, el lector
            abre la puerta solo si la suscripción sigue vigente.
          </p>
        </div>
        <Button
          type="button"
          onClick={toggleControl}
          className={controlActive ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          <Radio className="mr-2 h-4 w-4" />
          {controlActive ? 'Detener control' : 'Activar control'}
        </Button>
      </div>

      {controlActive && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Radio className="h-4 w-4" />
          {readerListening
            ? 'Escuchando el lector. Cada huella o tarjeta muestra quién entró y cuántos días le quedan.'
            : 'Control activo. Esperando la conexión con el lector.'}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plug className="h-5 w-5" />
              Gateway local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={gateway.status === 'open' ? 'success' : gateway.status === 'error' ? 'destructive' : 'secondary'}>
                {gatewayStatusLabel(gateway.status)}
              </Badge>
              {gateway.status === 'open' ? (
                <Button type="button" variant="outline" size="sm" onClick={disconnectGateway}>
                  <Unplug className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={connectGateway} disabled={gateway.status === 'connecting'}>
                  {gateway.status === 'connecting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Conectar
                </Button>
              )}
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Dirección</span>
              <Input
                value={gatewayUrlDraft}
                onChange={(event) => setGatewayUrlDraft(event.target.value)}
                placeholder="ws://127.0.0.1:8080/ws"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Puerto del lector</span>
                <select
                  className={selectClassName}
                  value={settings.readerDeviceId}
                  onChange={(event) => updateSettings({ readerDeviceId: event.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {portOptions.map((port) => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Puerto de la puerta</span>
                <select
                  className={selectClassName}
                  value={settings.doorDeviceId}
                  onChange={(event) => updateSettings({ doorDeviceId: event.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {portOptions.map((port) => (
                    <option key={`door-${port}`} value={port}>{port}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={listPorts}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Listar puertos
              </Button>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={settings.autoOpenDoor}
                  onChange={(event) => updateSettings({ autoOpenDoor: event.target.checked })}
                />
                Abrir la puerta si la suscripción está vigente
              </label>
            </div>

            {gateway.lastError && (
              <p className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {gateway.lastError}
              </p>
            )}
            {gateway.doorOpenedDevice && (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <DoorOpen className="h-4 w-4" />
                Pulso de apertura enviado a {gateway.doorOpenedDevice}.
              </p>
            )}
            <p className="text-xs text-gray-500">
              El gateway corre en este equipo y habla con el lector por el puerto serial.
              La nube solo comprueba la suscripción.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Fingerprint className="h-5 w-5" />
              Emparejar credencial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {MODALITIES.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={modality === item.id ? 'default' : 'outline'}
                  onClick={() => setModality(item.id)}
                >
                  {item.id === 'card' ? <CreditCard className="mr-2 h-4 w-4" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                  {item.label}
                </Button>
              ))}
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Cliente</span>
              <Input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Buscar por nombre, correo o teléfono"
              />
            </label>
            {selectedClient && (
              <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm">
                <span className="font-medium text-primary-800">{selectedClient.name}</span>
                <button type="button" className="text-primary-700" onClick={() => setSelectedClient(null)}>
                  Cambiar
                </button>
              </div>
            )}
            {!selectedClient && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200">
                {clientsQuery.isPending && (
                  <p className="px-3 py-2 text-sm text-gray-500">Buscando clientes…</p>
                )}
                {!clientsQuery.isPending && clientOptions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No hay clientes con esa búsqueda.</p>
                )}
                {clientOptions.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      setSelectedClient(client)
                      setClientSearch('')
                    }}
                  >
                    <span className="font-medium text-gray-900">{client.name}</span>
                    <span className="ml-2 text-gray-500">{client.email}</span>
                  </button>
                ))}
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Identificador</span>
              <div className="flex gap-2">
                <Input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Se llena al leer la huella o la tarjeta"
                />
                <Button type="button" variant={capturing ? 'default' : 'outline'} onClick={startCapture}>
                  {capturing ? 'Esperando…' : 'Capturar'}
                </Button>
              </div>
            </label>
            {capturing && (
              <p className="text-sm text-primary-700">
                La próxima lectura se usará para emparejar y no abrirá la puerta.
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Etiqueta</span>
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Ej. índice derecho"
              />
            </label>

            <Button type="button" onClick={pairCredential} disabled={createCredential.isPending}>
              {createCredential.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Emparejar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Credenciales</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => credentialsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {credentialsQuery.isPending && <p className="text-sm text-gray-500">Cargando credenciales…</p>}
          {credentialsQuery.isError && (
            <p className="text-sm text-red-600">{handleApiError(credentialsQuery.error)}</p>
          )}
          {!credentialsQuery.isPending && credentials.length === 0 && (
            <p className="text-sm text-gray-500">Todavía no hay huellas ni tarjetas emparejadas.</p>
          )}
          {credentials.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Identificador</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((credential) => (
                    <tr key={credential.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{credential.client.name}</p>
                        <p className="text-xs text-gray-500">{credential.label || credential.client.email}</p>
                      </td>
                      <td className="py-3 pr-4">{modalityLabel(credential.modality)}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{credential.identifier}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={credential.is_active ? 'success' : 'secondary'}>
                          {credential.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCredential(credential.id, credential.is_active)}
                          >
                            {credential.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Eliminar credencial de ${credential.client.name}`}
                            onClick={() => setCredentialToDelete(credential.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos accesos</CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isPending && <p className="text-sm text-gray-500">Cargando registros…</p>}
          {logsQuery.isError && <p className="text-sm text-red-600">{handleApiError(logsQuery.error)}</p>}
          {!logsQuery.isPending && logs.length === 0 && (
            <p className="text-sm text-gray-500">Aún no hay intentos de entrada.</p>
          )}
          {logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Cuándo</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">Resultado</th>
                    <th className="py-2 font-medium">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(log.created_at).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{log.client_name || 'Desconocido'}</p>
                        <p className="text-xs text-gray-500">
                          {modalityLabel(log.modality)}
                          {log.device_id ? ` · ${log.device_id}` : ''}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={log.result === 'granted' ? 'success' : 'destructive'}>
                          {log.result === 'granted' ? 'Autorizado' : 'Denegado'}
                        </Badge>
                      </td>
                      <td className="py-3">{log.days_remaining ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {credentialToDelete != null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg">Eliminar credencial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta huella o tarjeta dejará de abrir el acceso.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCredentialToDelete(null)}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteCredential.isPending}>
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {controlActive && alert && (
        <AccessAlertModal decision={alert.decision} detail={alert.detail} onClose={closeAlert} />
      )}
    </div>
  )
}

export default AccessControl
