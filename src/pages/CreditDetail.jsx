import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { getUser } from '../auth'
import PanelFrame from '../PanelFrame'

const STATUS = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada', DISBURSED: 'Desembolsada' }
const INST = { PENDING: 'Pendiente', PAID: 'Pagada', OVERDUE: 'Vencida' }
const cop = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CO')
const day = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')
const title = (s = '') => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
const initials = (c = {}) => ((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase()
const CAPACITY_REASON = 'La cuota mensual excede el 40% de la capacidad de pago del cliente.'

function Back() {
  return (
    <Link className="dt-back" to="/panel">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#211B18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      Volver a solicitudes
    </Link>
  )
}

export default function CreditDetail() {
  const { id } = useParams()
  const isAdmin = getUser()?.role === 'ADMIN'
  const [credit, setCredit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmDisburse, setConfirmDisburse] = useState(false)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const { ok, data } = await api(`/credits/${id}`)
      if (ok) setCredit(data.data)
      else setLoadError(data.message || 'No pudimos cargar la solicitud.')
    } catch { setLoadError('No pudimos conectar con el servidor.') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { setLoading(true); load() }, [load])

  const run = async (path, method, body) => {
    setBusy(true); setActionError('')
    try {
      const { ok, data } = await api(path, { method, body })
      if (ok) { setRejecting(false); setReason(''); setConfirmDisburse(false); await load() }
      else setActionError(data.message || 'No pudimos completar la acción.')
    } catch { setActionError('No pudimos conectar con el servidor.') }
    finally { setBusy(false) }
  }
  const approve = () => run(`/credits/${id}/evaluate`, 'PATCH', { status: 'APPROVED' })
  const reject = () => {
    if (reason.trim().length < 5) { setActionError('Escribe el motivo del rechazo (mínimo 5 caracteres).'); return }
    run(`/credits/${id}/evaluate`, 'PATCH', { status: 'REJECTED', rejectionReason: reason.trim() })
  }
  const disburse = () => run(`/credits/${id}/disburse`, 'POST')
  const rejectForCapacity = () => { setActionError(''); setReason(CAPACITY_REASON); setRejecting(true) }

  if (loading) return <PanelFrame><p className="note">Cargando solicitud...</p></PanelFrame>
  if (loadError || !credit) {
    return <PanelFrame><Back /><p className="alert" role="alert" style={{ marginTop: 18 }}>{loadError || 'No encontramos la solicitud.'}</p></PanelFrame>
  }

  const c = credit.customer || {}
  const st = credit.status
  const inst = credit.installments || []
  const capacityError = /capacidad de pago/i.test(actionError)

  return (
    <PanelFrame>
      <Back />
      <div className="dt-ttl">
        <h1>Solicitud N.º {credit.id}</h1>
        <span className={'bd ' + String(st).toLowerCase()}><i />{STATUS[st] || st}</span>
      </div>
      <div className="sb">Recibida el {day(credit.createdAt)}</div>

      <div className="dt-grid">
        <section className="dt-box dt-main">
          <div className="dt-k">{st === 'DISBURSED' ? 'Monto desembolsado' : 'Monto solicitado'}</div>
          <div className="dt-amt">{cop(credit.amount)}</div>
          <div className="sb">{credit.termMonths} meses</div>
          <div className="dt-hr" />
          <div className="cl">
            <div className="av" aria-hidden="true">{initials(c)}</div>
            <div><div className="nm">{title(c.firstName)} {title(c.lastName)}</div><div className="sb">Cliente</div></div>
          </div>
          <dl className="dt-kv">
            <div><dt>Documento</dt><dd>{c.documentNumber}</dd></div>
            <div><dt>Teléfono</dt><dd>{c.phone || 'Sin registrar'}</dd></div>
            <div><dt>Ingresos al mes</dt><dd>{cop(c.monthlyIncome)}</dd></div>
            <div><dt>Destino</dt><dd>{credit.destination || 'Sin destino'}</dd></div>
          </dl>
        </section>

        <aside className="dt-box dt-act">
          {st === 'PENDING' && <>
            <h2>Decisión</h2>
            {!isAdmin && <p>Esta solicitud espera evaluación. Solo un administrador puede aprobarla o rechazarla.</p>}
            {isAdmin && <>
              <p>Esta solicitud espera evaluación.</p>
              {actionError && <p className="alert" role="alert">{actionError}</p>}
              {capacityError && !rejecting && <button type="button" className="link-btn" onClick={rejectForCapacity}>Rechazar por capacidad de pago</button>}
              {!rejecting ? <>
                <button type="button" className="dt-ok" disabled={busy} onClick={approve}>{busy ? 'Procesando...' : 'Aprobar solicitud'}</button>
                <button type="button" className="dt-no" disabled={busy} onClick={() => { setRejecting(true); setActionError('') }}>Rechazar</button>
                <div className="sb">Al rechazar tendrás que escribir un motivo.</div>
              </> : <>
                <label htmlFor="reason">Motivo del rechazo</label>
                <textarea id="reason" className="ta" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button type="button" className="dt-danger" disabled={busy} onClick={reject}>{busy ? 'Procesando...' : 'Confirmar rechazo'}</button>
                <button type="button" className="btn ghost small" disabled={busy} onClick={() => { setRejecting(false); setActionError('') }}>Cancelar</button>
              </>}
            </>}
          </>}

          {st === 'APPROVED' && <>
            <h2>Solicitud aprobada</h2>
            {!isAdmin && <p>Solo un administrador puede desembolsarla.</p>}
            {isAdmin && <>
              <p>Al desembolsar se genera el cronograma de pagos y ya no podrás modificar la solicitud.</p>
              {actionError && <p className="alert" role="alert">{actionError}</p>}
              {!confirmDisburse
                ? <button type="button" className="dt-ok" onClick={() => setConfirmDisburse(true)}>Desembolsar</button>
                : <>
                  <p><strong>¿Confirmas el desembolso de {cop(credit.amount)}?</strong></p>
                  <button type="button" className="dt-ok" disabled={busy} onClick={disburse}>{busy ? 'Procesando...' : 'Sí, desembolsar'}</button>
                  <button type="button" className="btn ghost small" disabled={busy} onClick={() => { setConfirmDisburse(false); setActionError('') }}>Cancelar</button>
                </>}
            </>}
          </>}

          {st === 'REJECTED' && <>
            <h2>Solicitud rechazada</h2>
            <p><strong>Motivo:</strong> {credit.rejectionReason || 'Sin motivo registrado'}</p>
          </>}

          {st === 'DISBURSED' && <>
            <h2>Crédito desembolsado</h2>
            <p>El cronograma de pagos se generó{inst[0] ? ` el ${day(inst[0].createdAt)}` : ''}. Esta solicitud ya no admite cambios.</p>
            <div className="sb">{inst.length} cuotas.</div>
          </>}
        </aside>
      </div>

      {st === 'DISBURSED' && inst.length > 0 && (
        <section className="dt-sec">
          <h2>Cronograma de pagos</h2>
          <div className="tw sched">
            <table>
              <thead><tr><th>Cuota</th><th>Vence</th><th className="r">Capital</th><th className="r">Interés</th><th className="r">Total</th><th>Estado</th></tr></thead>
              <tbody>
                {inst.map((i) => (
                  <tr key={i.id}>
                    <td className="am"><strong>{i.installmentNumber}</strong></td>
                    <td>{day(i.dueDate)}</td>
                    <td className="r am">{cop(i.principal)}</td>
                    <td className="r am">{cop(i.interest)}</td>
                    <td className="r am"><strong>{cop(i.totalAmount)}</strong></td>
                    <td><span className={'bd ' + String(i.status).toLowerCase()}><i />{INST[i.status] || i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PanelFrame>
  )
}