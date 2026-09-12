import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const APP_NAME = 'Gym Now'

const ROUTE_TITLES: Record<string, string> = {
  '/login': 'Iniciar sesión',
  '/': 'Inicio',
  '/clients': 'Clientes',
  '/routines': 'Rutinas',
  '/exercises': 'Ejercicios',
  '/plans': 'Planes',
  '/progress': 'Progreso',
  '/settings': 'Ajustes',
  '/me': 'Mi perfil',
  '/my-routine': 'Mi rutina',
  '/my-routine/progress': 'Mi progreso',
}

function titleForPath(pathname: string): string {
  if (pathname.startsWith('/clients/') && pathname !== '/clients') {
    return `Cliente | ${APP_NAME}`
  }
  const page = ROUTE_TITLES[pathname]
  return page ? `${page} | ${APP_NAME}` : APP_NAME
}

const DocumentTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = titleForPath(pathname)
  }, [pathname])

  return null
}

export default DocumentTitle
