import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Routines from './pages/Routines'
import Exercises from './pages/Exercises'
import Progress from './pages/Progress'
import GlobalProgress from './pages/GlobalProgress'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Login from './pages/Login'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes for owner/trainer */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['owner', 'trainer']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="routines" element={<Routines />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="progress" element={<GlobalProgress />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Protected routes for all authenticated users */}
          <Route path="clients/:id" element={
            <ProtectedRoute>
              <ClientDetail />
            </ProtectedRoute>
          } />
          
          {/* Profile route for all authenticated users */}
          <Route path="me" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<ClientDetail />} />
          </Route>
          
          {/* Client/Guest-specific routes */}
          <Route path="my-routine" element={
            <ProtectedRoute allowedRoles={['client', 'guest']}>
              <ClientDetail />
            </ProtectedRoute>
          } />
          <Route path="my-routine/progress" element={
            <ProtectedRoute allowedRoles={['client', 'guest']}>
              <Progress />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
