import React, { Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/query-client'
import AuthSessionSync from './components/AuthSessionSync'
import SubscriptionExpiredOverlay from './components/SubscriptionExpiredOverlay'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import PageFallback from './components/PageFallback'
import DocumentTitle from './components/DocumentTitle'
import Login from './pages/Login'
import {
  Dashboard,
  Clients,
  ClientDetail,
  Routines,
  Exercises,
  GlobalProgress,
  Progress,
  Settings,
  Plans,
} from './pages/lazy'
import { MEMBER_ROLES, OWNER_ROLES, STAFF_ROLES } from './lib/rbac'

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthSessionSync />
        <DocumentTitle />
        <Toaster position="top-right" />
        <div id="app-shell">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={
                <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="routines" element={<Routines />} />
                <Route path="exercises" element={<Exercises />} />
                <Route path="plans" element={<Plans />} />
                <Route path="progress" element={<GlobalProgress />} />
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={[...OWNER_ROLES]}>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="clients/:id" element={
                <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
                  <ClientDetail />
                </ProtectedRoute>
              } />

              <Route path="me" element={
                <ProtectedRoute allowedRoles={[...MEMBER_ROLES]}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<ClientDetail />} />
              </Route>

              <Route path="my-routine" element={<Navigate to="/me" replace />} />
              <Route path="my-routine/progress" element={
                <ProtectedRoute allowedRoles={[...MEMBER_ROLES]}>
                  <Progress />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
        <SubscriptionExpiredOverlay />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </QueryClientProvider>
  )
}

export default App
