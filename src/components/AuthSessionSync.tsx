import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setOnSessionExpired } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'

export default function AuthSessionSync() {
  const navigate = useNavigate()
  const hydrate = useAuthStore((state) => state.hydrate)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    setOnSessionExpired(() => {
      clearSession()
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    })
    return () => setOnSessionExpired(null)
  }, [clearSession, navigate])

  return null
}
