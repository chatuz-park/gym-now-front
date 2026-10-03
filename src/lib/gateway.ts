export const DEFAULT_GATEWAY_URL = 'ws://127.0.0.1:8080/ws'

export const ACCESS_STATION_STORAGE_KEY = 'gymnow.access-control.settings'

export interface AccessStationSettings {
  gatewayUrl: string
  readerDeviceId: string
  doorDeviceId: string
  autoOpenDoor: boolean
  connected: boolean
  controlActive: boolean
}

export const DEFAULT_ACCESS_SETTINGS: AccessStationSettings = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  readerDeviceId: '',
  doorDeviceId: '',
  autoOpenDoor: true,
  connected: false,
  controlActive: false,
}

function isGatewayUrl(value: string) {
  return value.startsWith('ws://') || value.startsWith('wss://')
}

export function loadAccessSettings(): AccessStationSettings {
  try {
    const raw = localStorage.getItem(ACCESS_STATION_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ACCESS_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AccessStationSettings>
    const gatewayUrl = parsed.gatewayUrl?.trim() || DEFAULT_GATEWAY_URL
    const readerDeviceId = parsed.readerDeviceId?.trim() || ''
    const controlActive = parsed.controlActive === true && readerDeviceId.length > 0
    return {
      gatewayUrl: isGatewayUrl(gatewayUrl) ? gatewayUrl : DEFAULT_GATEWAY_URL,
      readerDeviceId,
      doorDeviceId: parsed.doorDeviceId?.trim() || '',
      autoOpenDoor: parsed.autoOpenDoor !== false,
      connected: parsed.connected === true || controlActive,
      controlActive,
    }
  } catch {
    return { ...DEFAULT_ACCESS_SETTINGS }
  }
}

export function saveAccessSettings(settings: AccessStationSettings) {
  localStorage.setItem(ACCESS_STATION_STORAGE_KEY, JSON.stringify(settings))
}

export type GatewayCommand =
  | { action: 'list_ports' }
  | { action: 'listen'; device_id: string }
  | { action: 'stop_listen'; device_id: string }
  | { action: 'open_door'; device_id: string }
  | { action: 'write'; device_id: string; payload: string }

export interface HardwareRead {
  data: string
  device_id: string
}

export type GatewayStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

interface GatewayMessage {
  event?: string
  data?: string
  device_id?: string
  ports?: string[]
  error?: string
  action?: string
}

export function parseGatewayMessage(raw: string): GatewayMessage | null {
  try {
    const parsed = JSON.parse(raw) as GatewayMessage
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}
