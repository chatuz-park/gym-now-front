import { useCallback, useEffect, useRef, useState } from 'react'
import type { GatewayCommand, GatewayStatus, HardwareRead } from '../lib/gateway'
import { parseGatewayMessage } from '../lib/gateway'

interface UseGatewayOptions {
  url: string
  enabled: boolean
  listenDeviceId: string
  onHardwareRead: (read: HardwareRead) => void
}

export function useGateway({ url, enabled, listenDeviceId, onHardwareRead }: UseGatewayOptions) {
  const socketRef = useRef<WebSocket | null>(null)
  const listenDeviceRef = useRef(listenDeviceId)
  const onReadRef = useRef(onHardwareRead)
  const [status, setStatus] = useState<GatewayStatus>('idle')
  const [ports, setPorts] = useState<string[]>([])
  const [listening, setListening] = useState<string[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [doorOpenedDevice, setDoorOpenedDevice] = useState<string | null>(null)

  listenDeviceRef.current = listenDeviceId
  onReadRef.current = onHardwareRead

  const send = useCallback((command: GatewayCommand) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(command))
    return true
  }, [])

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      setListening([])
      return
    }

    let stopped = false
    let socket: WebSocket | null = null
    let retryTimer: number | undefined
    let attempt = 0

    const connect = () => {
      if (stopped) return
      setStatus('connecting')
      const ws = new WebSocket(url)
      socket = ws
      socketRef.current = ws

      ws.onopen = () => {
        if (stopped || socketRef.current !== ws) return
        attempt = 0
        setStatus('open')
        setLastError(null)
      }

      ws.onmessage = (event) => {
        if (stopped || socketRef.current !== ws) return
        const message = parseGatewayMessage(String(event.data))
        if (!message?.event) return

        switch (message.event) {
          case 'hello': {
            const deviceId = listenDeviceRef.current
            if (deviceId) {
              ws.send(JSON.stringify({ action: 'listen', device_id: deviceId }))
            }
            break
          }
          case 'ports':
            setPorts(Array.isArray(message.ports) ? message.ports : [])
            break
          case 'listening':
            if (message.device_id) {
              setListening((current) =>
                current.includes(message.device_id as string)
                  ? current
                  : [...current, message.device_id as string],
              )
            }
            break
          case 'listen_stopped':
            if (message.device_id) {
              setListening((current) => current.filter((id) => id !== message.device_id))
            }
            break
          case 'door_opened':
            setDoorOpenedDevice(message.device_id || null)
            break
          case 'hardware_read':
            if (message.data && message.device_id) {
              onReadRef.current({ data: message.data, device_id: message.device_id })
            }
            break
          case 'error':
            setLastError(message.error || 'El gateway rechazó el comando.')
            setStatus((current) => (current === 'connecting' ? 'error' : current))
            break
          default:
            break
        }
      }

      ws.onerror = () => {
        if (stopped || socketRef.current !== ws) return
        setLastError('No se pudo conectar con el gateway en este equipo.')
        setStatus('error')
      }

      ws.onclose = () => {
        if (socketRef.current === ws) socketRef.current = null
        if (stopped) return
        setListening([])
        setStatus('closed')
        const delay = Math.min(5000, 500 * 2 ** attempt)
        attempt += 1
        retryTimer = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      socket?.close()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [enabled, url])

  useEffect(() => {
    if (status !== 'open') return
    if (!listenDeviceId) return
    send({ action: 'listen', device_id: listenDeviceId })
  }, [status, listenDeviceId, send])

  const previousListen = useRef('')
  useEffect(() => {
    if (status !== 'open') return
    const previous = previousListen.current
    if (previous && previous !== listenDeviceId) {
      send({ action: 'stop_listen', device_id: previous })
    }
    previousListen.current = listenDeviceId
  }, [status, listenDeviceId, send])

  return {
    status,
    ports,
    listening,
    lastError,
    doorOpenedDevice,
    send,
  }
}
