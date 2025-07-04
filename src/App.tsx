import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Routines from './pages/Routines'
import Progress from './pages/Progress'
import GlobalProgress from './pages/GlobalProgress'
import Settings from './pages/Settings'
import Login from './pages/Login'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes for admin/trainer */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin', 'trainer']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="routines" element={<Routines />} />
            <Route path="progress" element={<GlobalProgress />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Protected routes for all authenticated users */}
          <Route path="clients/:id" element={
            <ProtectedRoute>
              <ClientDetail />
            </ProtectedRoute>
          } />
          
          {/* Client-specific routes */}
          <Route path="my-routine" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDetail />
            </ProtectedRoute>
          } />
          <Route path="my-routine/progress" element={
            <ProtectedRoute allowedRoles={['client']}>
              <Progress />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
