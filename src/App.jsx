import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Request from './pages/Request'
import Login from './pages/Login'
import Panel from './pages/Panel'
import CreditDetail from './pages/CreditDetail'
import Users from './pages/Users'
import { getToken, getUser, tokenExp, clearSession, isLoggedIn } from './auth'
import Customers from './pages/Customers'

function RequireAuth({ children }) {
  const nav = useNavigate()
  useEffect(() => {
    const exp = tokenExp(getToken())
    if (!exp) return
    const t = setTimeout(() => { clearSession(); nav('/login?expired=1', { replace: true }) }, Math.max(exp * 1000 - Date.now(), 0))
    return () => clearTimeout(t)
  }, [nav])
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  return getUser()?.role === 'ADMIN' ? children : <Navigate to="/panel" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Request />} />
      <Route path="/login" element={<Login />} />
      <Route path="/panel" element={<RequireAuth><Panel /></RequireAuth>} />
      <Route path="/panel/credits/:id" element={<RequireAuth><CreditDetail /></RequireAuth>} />
      <Route path="/panel/users" element={<RequireAuth><RequireAdmin><Users /></RequireAdmin></RequireAuth>} />
      <Route path="/panel/customers" element={<RequireAuth><Customers /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
