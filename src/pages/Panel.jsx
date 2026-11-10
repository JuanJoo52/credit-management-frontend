import { useNavigate } from 'react-router-dom'
import { APP_NAME } from '../Shell'
import { getUser, clearSession } from '../auth'
import Credits from './Credits'

const ROLES = { ADMIN: 'Administrador', CASHIER: 'Cajero', ADVISOR: 'Asesor' }

export default function Panel() {
  const nav = useNavigate()
  const user = getUser()
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
      <main className="pn-main">
        <h1 className="pn-title">Solicitudes de crédito</h1>
        <p className="pn-sub">Revisa las solicitudes que llegaron desde el formulario público.</p>
        <Credits />
      </main>
    </div></div>
  )
}