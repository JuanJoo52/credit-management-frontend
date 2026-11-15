import { useEffect, useState } from 'react'
import { api } from './api'

const DOC_TYPES = [['CC', 'Cédula de ciudadanía'], ['CE', 'Cédula de extranjería'], ['PASSPORT', 'Pasaporte']]
const DOC_RULES = {
  CC: { re: /^[0-9]{6,10}$/, msg: 'La cédula debe tener entre 6 y 10 dígitos, solo números.' },
  CE: { re: /^[0-9]{6,10}$/, msg: 'La cédula de extranjería debe tener entre 6 y 10 dígitos, solo números.' },
  PASSPORT: { re: /^[A-Z0-9]{6,12}$/, msg: 'El pasaporte debe tener entre 6 y 12 letras mayúsculas o números.' },
}
const MIN_INCOME = 1 // cambia este valor si defines un mínimo en el back
const num = (v) => Number(String(v).replace(/\D/g, ''))
const money = (v) => { const n = String(v).replace(/\D/g, ''); return n ? Number(n).toLocaleString('es-CO') : '' }

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="err">{error}</p>}
    </div>
  )
}

export default function CustomerDialog({ mode, customer, onClose, onDone }) {
  const editing = mode === 'edit'
  const c = customer || {}
  const [f, setF] = useState({
    documentType: c.documentType || 'CC',
    documentNumber: c.documentNumber || '',
    firstName: c.firstName || '',
    lastName: c.lastName || '',
    monthlyIncome: c.monthlyIncome ? money(c.monthlyIncome) : '',
    address: c.address && c.address !== 'No registrada' ? c.address : '',
    phone: c.phone || '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const inp = (k) => ({ id: 'c-' + k, className: 'input', 'aria-invalid': !!errors[k] })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const submit = async (ev) => {
    ev.preventDefault()
    const e = {}
    if (!editing) {
      const r = DOC_RULES[f.documentType]
      if (!r.re.test(f.documentNumber)) e.documentNumber = r.msg
    }
    if (!f.firstName.trim()) e.firstName = 'Escribe los nombres.'
    if (!f.lastName.trim()) e.lastName = 'Escribe los apellidos.'
    if (num(f.monthlyIncome) < MIN_INCOME) e.monthlyIncome = 'Escribe los ingresos mensuales.'
    if (!f.address.trim()) e.address = 'Escribe la dirección.'
    if (!/^\d{7,15}$/.test(f.phone.replace(/\s/g, ''))) e.phone = 'Escribe solo números, entre 7 y 15 dígitos.'
    setErrors(e)
    if (Object.keys(e).length) return

    const common = {
      firstName: f.firstName.trim(), lastName: f.lastName.trim(),
      monthlyIncome: num(f.monthlyIncome), address: f.address.trim(), phone: f.phone.replace(/\s/g, ''),
    }
    setBusy(true); setServerError('')
    try {
      const { ok, data } = editing
        ? await api(`/customers/by-document/${encodeURIComponent(c.documentNumber)}`, { method: 'PATCH', body: common })
        : await api('/customers', { method: 'POST', body: { documentType: f.documentType, documentNumber: f.documentNumber, ...common } })
      if (ok) onDone(data.data)
      else setServerError(data.message || 'No pudimos guardar el cliente.')
    } catch { setServerError('No pudimos conectar con el servidor.') }
    finally { setBusy(false) }
  }

  return (
    <div className="ov">
      <form className="dlg" role="dialog" aria-modal="true" aria-labelledby="cu-title" onSubmit={submit} noValidate>
        <h2 id="cu-title">{editing ? 'Editar cliente' : 'Crear cliente'}</h2>
        {serverError && <p className="alert" role="alert">{serverError}</p>}
        <div className="row">
          <Field id="c-documentType" label="Tipo de documento">
            <select id="c-documentType" className="input" disabled={editing} value={f.documentType} onChange={(e) => set('documentType', e.target.value)}>
              {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field id="c-documentNumber" label="Número de documento" error={errors.documentNumber}>
            <input {...inp('documentNumber')} disabled={editing} autoFocus={!editing} value={f.documentNumber} onChange={(e) => set('documentNumber', e.target.value.replace(/\s/g, '').toUpperCase())} />
          </Field>
        </div>
        {editing && <p className="note">El tipo y el número de documento no se pueden cambiar.</p>}
        <div className="row">
          <Field id="c-firstName" label="Nombres" error={errors.firstName}>
            <input {...inp('firstName')} autoFocus={editing} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field id="c-lastName" label="Apellidos" error={errors.lastName}>
            <input {...inp('lastName')} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
        </div>
        <Field id="c-monthlyIncome" label="Ingresos mensuales (COP)" error={errors.monthlyIncome}>
          <input {...inp('monthlyIncome')} inputMode="numeric" value={f.monthlyIncome} onChange={(e) => set('monthlyIncome', money(e.target.value))} />
        </Field>
        <div className="row">
          <Field id="c-phone" label="Teléfono" error={errors.phone}>
            <input {...inp('phone')} type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field id="c-address" label="Dirección" error={errors.address}>
            <input {...inp('address')} value={f.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <button type="button" className="btn ghost" disabled={busy} onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={busy}>{busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}</button>
        </div>
      </form>
    </div>
  )
}