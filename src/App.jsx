import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Request from './pages/Request'
import Login from './pages/Login'
import Panel from './pages/Panel'
import CreditDetail from './pages/CreditDetail'
import Users from './pages/Users'
import { getToken, getUser, tokenExp, clearSession, isLoggedIn, getHomePath } from './auth'
import Customers from './pages/Customers'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NewCredit from './pages/NewCredit'
import Collections from './pages/Collections'

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
  return getUser()?.role === 'ADMIN' ? children : <Navigate to={getHomePath()} replace />
}
function RequireRoles({ roles, children }) {
  return roles.includes(getUser()?.role) ? children : <Navigate to={getHomePath()} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Request />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/panel" element={<RequireAuth><RequireRoles roles={['ADMIN', 'ADVISOR']}><Panel /></RequireRoles></RequireAuth>} />
      <Route path="/panel/collections" element={<RequireAuth><RequireRoles roles={['CASHIER']}><Collections /></RequireRoles></RequireAuth>} />
      <Route path="/panel/credits/new" element={<RequireAuth><RequireRoles roles={['ADMIN', 'ADVISOR']}><NewCredit /></RequireRoles></RequireAuth>} />
      <Route path="/panel/credits/:id" element={<RequireAuth><RequireRoles roles={['ADMIN', 'ADVISOR']}><CreditDetail /></RequireRoles></RequireAuth>} />
      <Route path="/panel/users" element={<RequireAuth><RequireAdmin><Users /></RequireAdmin></RequireAuth>} />
      <Route path="/panel/customers" element={<RequireAuth><RequireRoles roles={['ADMIN', 'ADVISOR']}><Customers /></RequireRoles></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
