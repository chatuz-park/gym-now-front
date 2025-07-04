import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Routines from './pages/Routines'
import Progress from './pages/Progress'
import GlobalProgress from './pages/GlobalProgress'
import Settings from './pages/Settings'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="routines" element={<Routines />} />
          <Route path="progress" element={<GlobalProgress />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="my-routine" element={<ClientDetail />} />
        <Route path="my-routine/progress" element={<Progress />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
