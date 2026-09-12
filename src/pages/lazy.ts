import { lazy } from 'react'

export const Dashboard = lazy(() => import('./Dashboard'))
export const Clients = lazy(() => import('./Clients'))
export const ClientDetail = lazy(() => import('./ClientDetail'))
export const Routines = lazy(() => import('./Routines'))
export const Exercises = lazy(() => import('./Exercises'))
export const GlobalProgress = lazy(() => import('./GlobalProgress'))
export const Progress = lazy(() => import('./Progress'))
export const Settings = lazy(() => import('./Settings'))
export const Plans = lazy(() => import('./Plans'))

export const prefetchPage: Record<string, () => Promise<unknown>> = {
  '/': () => import('./Dashboard'),
  '/clients': () => import('./Clients'),
  '/routines': () => import('./Routines'),
  '/exercises': () => import('./Exercises'),
  '/plans': () => import('./Plans'),
  '/progress': () => import('./GlobalProgress'),
  '/settings': () => import('./Settings'),
  '/me': () => import('./ClientDetail'),
  '/my-routine': () => import('./ClientDetail'),
  '/my-routine/progress': () => import('./Progress'),
}
