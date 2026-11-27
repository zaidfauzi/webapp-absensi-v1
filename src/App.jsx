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
import SecuritySchedule from './pages/SecuritySchedule'
import { Toaster } from 'sonner'

function Protected({ children }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { currentUser } = useApp()
  return (
    <>
    <Toaster richColors position="top-right" />
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/employees" element={<Protected><Employees /></Protected>} />
      <Route path="/schedules" element={<Protected><Schedules /></Protected>} />
      <Route path="/leave" element={<Protected><Leave /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/security-schedule" element={<Protected><SecuritySchedule /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}