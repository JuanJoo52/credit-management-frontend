import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { getUser } from '../auth'
import PanelFrame from '../PanelFrame'

const ROLES = { ADMIN: 'Administrador', ADVISOR: 'Asesor', CASHIER: 'Cajero' }
const ROLE_OPTIONS = ['ADVISOR', 'CASHIER', 'ADMIN']
const PASS_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const day = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')
const initials = (name = '') => name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

function useEsc(onClose, disabled) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !disabled) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, disabled])
}

function UserDialog({ mode, user, isSelf, onClose, onDone }) {
  const editing = mode === 'edit'
  const [f, setF] = useState({ name: user?.name || '', email: '', password: '', role: user?.role || 'ADVISOR' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  useEsc(onClose, busy)

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!f.name.trim()) er.name = 'Escribe el nombre.'
    if (!editing) {
      if (!EMAIL_RE.test(f.email.trim())) er.email = 'Escribe un correo válido.'
      if (!PASS_RE.test(f.password)) er.password = 'Mínimo 8 caracteres, una mayúscula y un número.'
    }
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true); setServerError('')
    try {
      const { ok, data } = editing
        ? await api(`/users/${user.id}`, { method: 'PATCH', body: { name: f.name.trim(), role: f.role } })
        : await api('/users', { method: 'POST', body: { name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, role: f.role } })
      if (ok) onDone()
      else setServerError(/already exists/i.test(data.message || '') ? 'Ya existe un usuario con ese correo.' : data.message || 'No pudimos guardar el usuario.')
    } catch { setServerError('No pudimos conectar con el servidor.') }
    finally { setBusy(false) }
  }

  return (
    <div className="ov">
      <form className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" onSubmit={submit} noValidate>
        <h2 id="dlg-title">{editing ? 'Editar usuario' : 'Crear usuario'}</h2>
        {serverError && <p className="alert" role="alert">{serverError}</p>}
        <div className="field">
          <label htmlFor="u-name">Nombre completo</label>
          <input id="u-name" className="input" autoFocus aria-invalid={!!errors.name} value={f.name} onChange={(e) => set('name', e.target.value)} />
          {errors.name && <p className="err">{errors.name}</p>}
        </div>
        {editing && <p className="note">Correo: {user.email}</p>}
        {!editing && <>
          <div className="field">
            <label htmlFor="u-email">Correo electrónico</label>
            <input id="u-email" className="input" type="email" autoComplete="off" aria-invalid={!!errors.email} value={f.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <p className="err">{errors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="u-pass">Contraseña</label>
            <input id="u-pass" className="input" type="password" autoComplete="new-password" aria-invalid={!!errors.password} value={f.password} onChange={(e) => set('password', e.target.value)} />
            {errors.password ? <p className="err">{errors.password}</p> : <p className="note">Mínimo 8 caracteres, una mayúscula y un número.</p>}
          </div>
        </>}
        <div className="field">
          <label htmlFor="u-role">Rol</label>
          <select id="u-role" className="input" value={f.role} disabled={isSelf} onChange={(e) => set('role', e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
          </select>
          {isSelf && <p className="note">No puedes cambiar tu propio rol.</p>}
        </div>
        <div className="row">
          <button type="button" className="btn ghost" disabled={busy} onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={busy}>{busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </div>
  )
}

function Confirm({ user, busy, onCancel, onConfirm }) {
  useEsc(onCancel, busy)
  return (
    <div className="ov">
      <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">
        <h2 id="cf-title">Desactivar usuario</h2>
        <p>¿Desactivar a <strong>{user.name}</strong>? No podrá iniciar sesión hasta que lo actives de nuevo.</p>
        <div className="row">
          <button type="button" className="btn ghost" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn danger" disabled={busy} onClick={onConfirm}>{busy ? 'Desactivando...' : 'Desactivar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const me = getUser()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const { ok, data } = await api('/users')
      if (ok) setUsers(data.data || [])
      else setError(data.message || 'No pudimos cargar los usuarios.')
    } catch { setError('No pudimos conectar con el servidor.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const setStatus = async (u, status) => {
    setBusyId(u.id); setActionError('')
    try {
      const { ok, data } = await api(`/users/${u.id}`, { method: 'PATCH', body: { status } })
      if (ok) await load()
      else setActionError(data.message || 'No pudimos actualizar el usuario.')
    } catch { setActionError('No pudimos conectar con el servidor.') }
    finally { setBusyId(null); setConfirm(null) }
  }

  return (
    <PanelFrame>
      <div className="us-top">
        <div>
          <h1 className="pn-title">Usuarios</h1>
          <p className="pn-sub">Crea cuentas para tu equipo y controla quién puede entrar.</p>
        </div>
        <button type="button" className="btn mk" onClick={() => setDialog({ mode: 'create' })}>Crear usuario</button>
      </div>

      {error && <p className="alert" role="alert" style={{ marginTop: 20 }}>{error}</p>}
      {actionError && <p className="alert" role="alert" style={{ marginTop: 20 }}>{actionError}</p>}
      {loading && <p className="note" style={{ marginTop: 20 }}>Cargando usuarios...</p>}

      {!loading && !error && (
        <>
          <div className="tw" style={{ marginTop: 24 }}>
            <table>
              <thead>
                <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th className="r">Acciones</th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.id === me?.id
                  const active = u.status === 'ACTIVE'
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="cl">
                          <div className="av" aria-hidden="true">{initials(u.name)}</div>
                          <div>
                            <div className="nm">{u.name}{self && <span className="you">Tú</span>}</div>
                            <div className="sb">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="rl">{ROLES[u.role] || u.role}</span></td>
                      <td><span className={'bd ' + (active ? 'active' : 'inactive')}><i />{active ? 'Activo' : 'Inactivo'}</span></td>
                      <td>{day(u.createdAt)}</td>
                      <td>
                        <div className="u-acts">
                          <button type="button" className="u-ed" onClick={() => setDialog({ mode: 'edit', user: u })}>Editar</button>
                          {active
                            ? <button type="button" className="u-tg de" disabled={self} title={self ? 'No puedes desactivar tu propia cuenta' : undefined} onClick={() => setConfirm(u)}>Desactivar</button>
                            : <button type="button" className="u-tg ac" disabled={busyId === u.id} onClick={() => setStatus(u, 'ACTIVE')}>Activar</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="ft">{users.length} {users.length === 1 ? 'usuario' : 'usuarios'}. Un usuario inactivo no puede iniciar sesión.</p>
        </>
      )}

      {dialog && (
        <UserDialog
          mode={dialog.mode}
          user={dialog.user}
          isSelf={dialog.user?.id === me?.id}
          onClose={() => setDialog(null)}
          onDone={() => { setDialog(null); load() }}
        />
      )}
      {confirm && <Confirm user={confirm} busy={busyId === confirm.id} onCancel={() => setConfirm(null)} onConfirm={() => setStatus(confirm, 'INACTIVE')} />}
    </PanelFrame>
  )
}