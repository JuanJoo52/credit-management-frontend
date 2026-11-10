import { useState } from 'react'
import Shell from '../Shell'
import { api } from '../api'

const DOC_TYPES = [['CC', 'Cédula de ciudadanía'], ['CE', 'Cédula de extranjería'], ['PASSPORT', 'Pasaporte']]
const STEPS = ['Tus datos', 'Contacto e ingresos', 'Tu crédito']
const MIN = 100000, MAX = 100000000
const empty = { documentType: 'CC', documentNumber: '', firstName: '', lastName: '', phone: '', address: '', monthlyIncome: '', amount: '', termMonths: '', destination: '', consent: false, website: '' }
const num = (v) => Number(String(v).replace(/\D/g, ''))
const money = (v) => { const n = String(v).replace(/\D/g, ''); return n ? Number(n).toLocaleString('es-CO') : '' }
const cop = (n) => '$' + n.toLocaleString('es-CO')

function validate(step, f) {
  const e = {}
  if (step === 0) {
    if (f.documentNumber.trim().length < 5) e.documentNumber = 'Escribe tu número de documento.'
    if (!f.firstName.trim()) e.firstName = 'Escribe tu nombre.'
    if (!f.lastName.trim()) e.lastName = 'Escribe tu apellido.'
  }
  if (step === 1) {
    if (f.phone && !/^\d{7,15}$/.test(f.phone.replace(/\s/g, ''))) e.phone = 'Escribe solo números, entre 7 y 15 dígitos.'
    if (num(f.monthlyIncome) <= 0) e.monthlyIncome = 'Escribe tus ingresos mensuales.'
  }
  if (step === 2) {
    const a = num(f.amount)
    if (a < MIN || a > MAX) e.amount = `El monto debe estar entre ${cop(MIN)} y ${cop(MAX)}.`
    const t = Number(f.termMonths)
    if (!Number.isInteger(t) || t < 1 || t > 72) e.termMonths = 'El plazo debe ser de 1 a 72 meses.'
    if (!f.consent) e.consent = 'Debes autorizar el tratamiento de tus datos para enviar la solicitud.'
  }
  return e
}

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="err" id={id + '-err'}>{error}</p>}
    </div>
  )
}

export default function Request() {
  const [f, setF] = useState(empty)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(null)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const inp = (k) => ({ id: k, className: 'input', 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? k + '-err' : undefined })

  const next = () => { const e = validate(step, f); setErrors(e); if (!Object.keys(e).length) setStep(step + 1) }

  const submit = async (ev) => {
    ev.preventDefault()
    const e = validate(2, f); setErrors(e)
    if (Object.keys(e).length) return
    if (f.website) { setDone({}); return } // campo trampa: solo lo llenan los bots
    const body = {
      documentType: f.documentType, documentNumber: f.documentNumber.trim(),
      firstName: f.firstName.trim(), lastName: f.lastName.trim(),
      monthlyIncome: num(f.monthlyIncome), amount: num(f.amount), termMonths: Number(f.termMonths),
    }
    if (f.phone.trim()) body.phone = f.phone.replace(/\s/g, '')
    if (f.address.trim()) body.address = f.address.trim()
    if (f.destination.trim()) body.destination = f.destination.trim()
    setSending(true); setServerError('')
    try {
      const { ok, data } = await api('/credits/public', { method: 'POST', body })
      if (ok) setDone(data.data || {})
      else setServerError(data.message || 'No pudimos registrar tu solicitud. Revisa los datos e intenta de nuevo.')
    } catch { setServerError('No pudimos conectar con el servidor. Intenta de nuevo en unos minutos.') }
    finally { setSending(false) }
  }

  const again = () => { setF(empty); setStep(0); setErrors({}); setDone(null) }

  return (
    <Shell headline="Solicita tu crédito en línea" tagline="Sin filas ni papeleo. Te respondemos tras revisar tu solicitud.">
      {done ? (
        <div className="form">
          <h2 className="title">Recibimos tu solicitud</h2>
          {done.id && <p className="big">Número de solicitud: {done.id}</p>}
          <p>Quedó en estado pendiente de evaluación. Guarda este número por si necesitas consultarla.</p>
          <button className="btn" onClick={again}>Hacer otra solicitud</button>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <div>
            <div className="progress" role="img" aria-label={`Paso ${step + 1} de 3`}>
              {STEPS.map((s, i) => <span key={s} className={i <= step ? 'on' : ''} />)}
            </div>
            <h2 className="title">{STEPS[step]}</h2>
            <p className="note">Paso {step + 1} de 3</p>
          </div>
          {serverError && <p className="alert" role="alert">{serverError}</p>}

          {step === 0 && <>
            <Field id="documentType" label="Tipo de documento">
              <select id="documentType" className="input" value={f.documentType} onChange={(e) => set('documentType', e.target.value)}>
                {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field id="documentNumber" label="Número de documento" error={errors.documentNumber}>
              <input {...inp('documentNumber')} inputMode="numeric" value={f.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} />
            </Field>
            <div className="row">
              <Field id="firstName" label="Nombres" error={errors.firstName}>
                <input {...inp('firstName')} autoComplete="given-name" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </Field>
              <Field id="lastName" label="Apellidos" error={errors.lastName}>
                <input {...inp('lastName')} autoComplete="family-name" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </Field>
            </div>
          </>}

          {step === 1 && <>
            <Field id="phone" label="Teléfono (opcional)" error={errors.phone}>
              <input {...inp('phone')} type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field id="address" label="Dirección (opcional)">
              <input {...inp('address')} autoComplete="street-address" value={f.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field id="monthlyIncome" label="Ingresos mensuales (COP)" error={errors.monthlyIncome}>
              <input {...inp('monthlyIncome')} inputMode="numeric" placeholder="3.800.000" value={f.monthlyIncome} onChange={(e) => set('monthlyIncome', money(e.target.value))} />
            </Field>
          </>}

          {step === 2 && <>
            <Field id="amount" label="Monto que necesitas (COP)" error={errors.amount}>
              <input {...inp('amount')} inputMode="numeric" placeholder="8.000.000" value={f.amount} onChange={(e) => set('amount', money(e.target.value))} />
            </Field>
            <Field id="termMonths" label="Plazo en meses (1 a 72)" error={errors.termMonths}>
              <input {...inp('termMonths')} inputMode="numeric" placeholder="12" value={f.termMonths} onChange={(e) => set('termMonths', e.target.value.replace(/\D/g, '').slice(0, 2))} />
            </Field>
            <Field id="destination" label="¿Para qué lo usarás? (opcional)">
              <input {...inp('destination')} placeholder="Libre inversión" value={f.destination} onChange={(e) => set('destination', e.target.value)} />
            </Field>
            <div>
              <label className="check"><input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} /><span>Autorizo el tratamiento de mis datos personales para evaluar esta solicitud.</span></label>
              {errors.consent && <p className="err">{errors.consent}</p>}
            </div>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={(e) => set('website', e.target.value)} />
          </>}

          <div className="row">
            {step > 0 && <button type="button" className="btn ghost" onClick={() => { setErrors({}); setStep(step - 1) }}>Atrás</button>}
            {step < 2
              ? <button type="button" className="btn" onClick={next}>Continuar</button>
              : <button className="btn" disabled={sending}>{sending ? 'Enviando...' : 'Enviar solicitud'}</button>}
          </div>
        </form>
      )}
    </Shell>
  )
}
