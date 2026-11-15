import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_NAME } from './Shell'
import { getUser, clearSession } from './auth'

const ROLES = { ADMIN: 'Administrador', CASHIER: 'Cajero', ADVISOR: 'Asesor' }

export default function PanelFrame({ children }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'
  const onUsers = pathname.startsWith('/panel/users')
  const onCustomers = pathname.startsWith('/panel/customers')
  const ini = (user?.name || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const salir = () => { clearSession(); nav('/login', { replace: true }) }
  return (
    <div className="outer"><div className="card pn">
      <header className="pn-head">
        <div className="brand"><span className="dot" aria-hidden="true" /><span>{APP_NAME}</span></div>
        <div className="pn-me">
          <div className="av" aria-hidden="true">{ini}</div>
          <div><strong>{user?.name}</strong><div className="sb">{ROLES[user?.role] || user?.role}</div></div>
          <button className="btn ghost small" onClick={salir}>Cerrar sesión</button>
        </div>
      </header>
      <nav className="tabs" aria-label="Secciones">
        <Link to="/panel" aria-current={!onUsers && !onCustomers ? 'page' : undefined}>Solicitudes</Link>
        <Link to="/panel/customers" aria-current={onCustomers ? 'page' : undefined}>Clientes</Link>
        {isAdmin && <Link to="/panel/users" aria-current={onUsers ? 'page' : undefined}>Usuarios</Link>}
      </nav>
      <main className="pn-main">{children}</main>
    </div></div>
  )
}