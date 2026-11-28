import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Schedules from './pages/Schedules'
import Leave from './pages/Leave'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import { Toaster } from 'sonner'

function Protected({ children, allowedRoles }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'pegawai') return <Navigate to="/attendance" replace />
    return <Navigate to="/" replace />
  }
  return <Layout>{children}</Layout>
}

export default function App() {
  const { currentUser } = useApp()
  return (
    <>
    <Toaster richColors position="top-right" />
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected allowedRoles={['admin','yayasan','kepsek','wakasek','tu']}><Dashboard /></Protected>} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/employees" element={<Protected allowedRoles={['admin','tu']}><Employees /></Protected>} />
      <Route path="/schedules" element={<Protected allowedRoles={['admin','tu','kepsek','wakasek']}><Schedules /></Protected>} />
      <Route path="/leave" element={<Protected allowedRoles={['admin','yayasan','kepsek','wakasek','tu','pegawai']}><Leave /></Protected>} />
      <Route path="/reports" element={<Protected allowedRoles={['admin','yayasan','kepsek','wakasek','tu']}><Reports /></Protected>} />
      <Route path="/settings" element={<Protected allowedRoles={['admin']}><Settings /></Protected>} />
      <Route path="/profile" element={<Protected allowedRoles={['admin','yayasan','kepsek','wakasek','tu','pegawai']}><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}