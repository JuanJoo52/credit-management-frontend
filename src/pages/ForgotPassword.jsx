import { useState } from 'react'
import { Link } from 'react-router-dom'
import Shell from '../Shell'
import { api } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSending(true)
    try {
      const { ok, data } = await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } })
      if (ok) setSent(true)
      else setError(data.message || 'No pudimos procesar la solicitud. Intenta de nuevo.')
    } catch { setError('No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.') }
    finally { setSending(false) }
  }

  return (
    <Shell headline="Recupera el acceso a tu cuenta" tagline="Te enviaremos un enlace a tu correo.">
      {sent ? (
        <div className="form">
          <h2 className="title">Revisa tu correo</h2>
          <p>Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Vence en 15 minutos.</p>
          <p className="note">Si no lo ves, revisa la carpeta de spam.</p>
          <Link className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} to="/login">Volver a iniciar sesión</Link>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <h2 className="title">¿Olvidaste tu contraseña?</h2>
          <p className="note">Escribe tu correo y te enviaremos un enlace para crear una nueva.</p>
          {error && <p className="alert" role="alert">{error}</p>}
          <div className="field">
            <label htmlFor="fp-email">Correo electrónico</label>
            <input id="fp-email" className="input" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
          </div>
          <button className="btn" disabled={sending || !email.trim()}>{sending ? 'Enviando...' : 'Enviar enlace'}</button>
          <Link className="lnk" to="/login">Volver a iniciar sesión</Link>
        </form>
      )}
    </Shell>
  )
}