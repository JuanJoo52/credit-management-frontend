import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import PanelFrame from '../PanelFrame'
import CustomerDialog from '../CustomerDialog'
import Simulator from '../Simulator'

const MIN = 100000, MAX = 100000000
const cop = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CO')
const num = (v) => Number(String(v).replace(/\D/g, ''))
const money = (v) => { const n = String(v).replace(/\D/g, ''); return n ? Number(n).toLocaleString('es-CO') : '' }
const title = (s = '') => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
const initials = (c = {}) => ((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase()

export default function NewCredit() {
  const nav = useNavigate()
  const [doc, setDoc] = useState('')
  const [customer, setCustomer] = useState(null)
  const [search, setSearch] = useState({ state: 'idle', message: '' })
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ amount: '', termMonths: '', destination: '' })
  const [errors, setErrors] = useState({})
  const [sim, setSim] = useState(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const buscar = async (e) => {
    e.preventDefault()
    const d = doc.trim().toUpperCase()
    if (!d) return
    setCustomer(null); setSearch({ state: 'loading', message: '' })
    try {
      const { ok, status, data } = await api(`/customers/by-document/${encodeURIComponent(d)}`)
      if (ok) { setCustomer(data.data); setSearch({ state: 'found', message: '' }) }
      else if (status === 404) setSearch({ state: 'notfound', message: data.message || 'No existe un cliente con ese documento.' })
      else setSearch({ state: 'error', message: data.message || 'No pudimos buscar al cliente.' })
    } catch { setSearch({ state: 'error', message: 'No pudimos conectar con el servidor.' }) }
  }

  const guardar = async (e) => {
    e.preventDefault()
    const er = {}
    const a = num(f.amount), t = Number(f.termMonths)
    if (a < MIN || a > MAX) er.amount = `El monto debe estar entre ${cop(MIN)} y ${cop(MAX)}.`
    if (!Number.isInteger(t) || t < 1 || t > 72) er.termMonths = 'El plazo debe ser de 1 a 72 meses.'
    if (!f.destination.trim()) er.destination = 'Escribe el destino del crédito.'
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(true); setServerError('')
    try {
      const { ok, data } = await api('/credits', {
        method: 'POST',
        body: { documentNumber: customer.documentNumber, amount: a, termMonths: t, destination: f.destination.trim() },
      })
      if (ok) nav(data.data?.id ? `/panel/credits/${data.data.id}` : '/panel', { replace: true })
      else setServerError(data.message || 'No pudimos guardar la solicitud.')
    } catch { setServerError('No pudimos conectar con el servidor.') }
    finally { setSaving(false) }
  }

  const capacity = customer ? Number(customer.monthlyIncome) * 0.4 : 0
  const overLimit = customer && sim && sim.monthlyInstallment > capacity

  return (
    <PanelFrame>
      <Link className="dt-back" to="/panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#211B18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Volver a solicitudes
      </Link>
      <div className="dt-ttl"><h1>Nueva solicitud</h1></div>
      <p className="pn-sub">Registra una solicitud para un cliente que llegó en persona.</p>

      <div className="dt-grid">
        <section className="dt-box nr-box">
          <h2 className="nr-h">1. Cliente</h2>
          <form onSubmit={buscar} className="nr-fs">
            <div className="field">
              <label htmlFor="nc-doc">Número de documento</label>
              <div className="srow">
                <input id="nc-doc" className="input" autoComplete="off" value={doc} onChange={(e) => { setDoc(e.target.value.replace(/\s/g, '').toUpperCase()); setCustomer(null); setSearch({ state: 'idle', message: '' }) }} />
                <button className="sbtn" disabled={!doc.trim() || search.state === 'loading'}>{search.state === 'loading' ? 'Buscando...' : 'Buscar'}</button>
              </div>
            </div>
          </form>
          {search.state === 'notfound' && <>
            <p className="alert" role="alert">{search.message}</p>
            <button type="button" className="btn ghost small" onClick={() => setCreating(true)}>Crear cliente</button>
          </>}
          {search.state === 'error' && <p className="alert" role="alert">{search.message}</p>}
          {customer && <>
            <div className="found">
              <div className="av" aria-hidden="true">{initials(customer)}</div>
              <div>
                <div className="nm">{title(customer.firstName)} {title(customer.lastName)} <span className="okc">Encontrado</span></div>
                <div className="sb">{customer.documentType} {customer.documentNumber} · {customer.phone || 'Sin teléfono'}</div>
              </div>
            </div>
            <dl className="sim-kv">
              <div><dt>Ingresos al mes</dt><dd>{cop(customer.monthlyIncome)}</dd></div>
              <div><dt>Capacidad de pago (40 %)</dt><dd>{cop(capacity)}</dd></div>
            </dl>
          </>}
        </section>

        <section className="dt-box nr-box">
          <h2 className="nr-h">2. Crédito</h2>
          {!customer && <p className="note">Primero busca al cliente.</p>}
          <form onSubmit={guardar} noValidate>
            <fieldset className="nr-fs" disabled={!customer || saving}>
              {serverError && <p className="alert" role="alert">{serverError}</p>}
              <div className="row">
                <div className="field">
                  <label htmlFor="nc-amount">Monto (COP)</label>
                  <input id="nc-amount" className="input" inputMode="numeric" aria-invalid={!!errors.amount} value={f.amount} onChange={(e) => set('amount', money(e.target.value))} />
                  {errors.amount && <p className="err">{errors.amount}</p>}
                </div>
                <div className="field">
                  <label htmlFor="nc-term">Plazo en meses</label>
                  <input id="nc-term" className="input" inputMode="numeric" aria-invalid={!!errors.termMonths} value={f.termMonths} onChange={(e) => set('termMonths', e.target.value.replace(/\D/g, '').slice(0, 2))} />
                  {errors.termMonths && <p className="err">{errors.termMonths}</p>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="nc-dest">Destino del crédito</label>
                <input id="nc-dest" className="input" aria-invalid={!!errors.destination} value={f.destination} onChange={(e) => set('destination', e.target.value)} />
                {errors.destination && <p className="err">{errors.destination}</p>}
              </div>
              {customer && <Simulator amount={num(f.amount)} termMonths={Number(f.termMonths)} onResult={setSim} />}
              {overLimit && <p className="warn">La cuota estimada ({cop(sim.monthlyInstallment)}) supera el 40 % de los ingresos del cliente ({cop(capacity)}). Lo más probable es que no se pueda aprobar. La decisión final la toma el sistema al evaluar.</p>}
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => nav('/panel')}>Cancelar</button>
                <button className="btn">{saving ? 'Guardando...' : 'Guardar solicitud'}</button>
              </div>
            </fieldset>
          </form>
        </section>
      </div>

      {creating && (
        <CustomerDialog
          mode="create"
          customer={{ documentNumber: doc.trim().toUpperCase() }}
          onClose={() => setCreating(false)}
          onDone={(c) => {
            setCreating(false)
            if (c) { setCustomer(c); setDoc(c.documentNumber); setSearch({ state: 'found', message: '' }) }
          }}
        />
      )}
    </PanelFrame>
  )
}