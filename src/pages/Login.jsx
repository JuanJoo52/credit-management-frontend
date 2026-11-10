import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Shell from '../Shell'
import { api } from '../api'
import { setSession, isLoggedIn } from '../auth'

export default function Login() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  if (isLoggedIn()) return <Navigate to="/panel" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSending(true)
    try {
      const { ok, data } = await api('/auth/login', { method: 'POST', body: { email: email.trim(), password: pass } })
      if (ok && data.data?.token) { setSession(data.data.token, data.data.user); nav('/panel', { replace: true }) }
      else setError(data.message || 'No pudimos iniciar sesión. Intenta de nuevo.')
    } catch { setError('No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.') }
    finally { setSending(false) }
  }

  return (
    <Shell headline="Gestiona tus solicitudes de crédito" tagline="Acceso para el equipo interno.">
      <form className="form" onSubmit={submit} noValidate>
        <h2 className="title">Iniciar sesión</h2>
        {params.get('expired') && !error && <p className="note">Tu sesión venció. Ingresa de nuevo.</p>}
        {error && <p className="alert" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
        </div>
        <div className="field">
          <label htmlFor="pass">Contraseña</label>
          <div className="pw">
            <input id="pass" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
            <button type="button" className="toggle" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </div>
        <button className="btn" disabled={sending || !email || !pass}>{sending ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </Shell>
  )
}
