import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PortalConsultores from './pages/PortalConsultores'

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<PortalConsultores />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}