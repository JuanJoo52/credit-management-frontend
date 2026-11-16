import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Shell from '../Shell'
import { api } from '../api'
import { tokenExp } from '../auth'

const PASS_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export default function ResetPassword() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [token, setToken] = useState(() => params.get('token') || '')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  // Guarda el token en memoria y lo quita de la barra de direcciones
  useEffect(() => {
    const t = params.get('token')
    if (t) { setToken(t); nav('/reset-password', { replace: true }) }
  }, [params, nav])

  const exp = tokenExp(token)
  const expired = !token || (exp && exp * 1000 < Date.now())

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!PASS_RE.test(pass)) { setFieldError('Mínimo 8 caracteres, una mayúscula y un número.'); return }
    if (pass !== confirm) { setFieldError('Las contraseñas no coinciden.'); return }
    setFieldError(''); setSending(true)
    try {
      const { ok, data } = await api('/auth/reset-password', { method: 'POST', body: { token, newPassword: pass } })
      if (ok) nav('/login?reset=1', { replace: true })
      else setError(data.message || 'No pudimos cambiar la contraseña. Pide un enlace nuevo.')
    } catch { setError('No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.') }
    finally { setSending(false) }
  }

  return (
    <Shell headline="Crea tu nueva contraseña" tagline="Elige una contraseña segura.">
      {expired ? (
        <div className="form">
          <h2 className="title">Enlace no válido</h2>
          <p>Este enlace venció o no es válido. Pide uno nuevo para continuar.</p>
          <Link className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} to="/forgot-password">Pedir un enlace nuevo</Link>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <h2 className="title">Nueva contraseña</h2>
          {error && <p className="alert" role="alert">{error}</p>}
          <div className="field">
            <label htmlFor="rp-pass">Nueva contraseña</label>
            <div className="pw">
              <input id="rp-pass" className="input" type={show ? 'text' : 'password'} autoComplete="new-password" autoFocus aria-invalid={!!fieldError} value={pass} onChange={(e) => setPass(e.target.value)} />
              <button type="button" className="toggle" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            {!fieldError && <p className="note">Mínimo 8 caracteres, una mayúscula y un número.</p>}
          </div>
          <div className="field">
            <label htmlFor="rp-confirm">Confirma la contraseña</label>
            <input id="rp-confirm" className="input" type={show ? 'text' : 'password'} autoComplete="new-password" aria-invalid={!!fieldError} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {fieldError && <p className="err">{fieldError}</p>}
          </div>
          <button className="btn" disabled={sending || !pass || !confirm}>{sending ? 'Guardando...' : 'Guardar contraseña'}</button>
          <Link className="lnk" to="/forgot-password">¿El enlace no funciona? Pide uno nuevo</Link>
        </form>
      )}
    </Shell>
  )
}