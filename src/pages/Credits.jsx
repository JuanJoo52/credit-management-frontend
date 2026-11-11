import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { Link } from 'react-router-dom'

const STATUS = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada', DISBURSED: 'Desembolsada' }
const FILTERS = [['', 'Todas'], ['PENDING', 'Pendientes'], ['APPROVED', 'Aprobadas'], ['DISBURSED', 'Desembolsadas'], ['REJECTED', 'Rechazadas']]
const cop = (n) => '$' + Number(n).toLocaleString('es-CO')
const day = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
const title = (s = '') => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
const initials = (c = {}) => ((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase()

export default function Credits() {
  const [status, setStatus] = useState('PENDING')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    api('/credits' + (status ? `?status=${status}` : ''))
      .then(({ ok, data }) => {
        if (cancelled) return
        if (ok) setRows(data.data || [])
        else setError(data.message || 'No pudimos cargar las solicitudes.')
      })
      .catch(() => { if (!cancelled) setError('No pudimos conectar con el servidor.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((r) => {
      const c = r.customer || {}
      return `${c.firstName} ${c.lastName} ${c.documentNumber}`.toLowerCase().includes(t)
    })
  }, [rows, q])

  return (
    <section>
      <div className="tb">
        <div className="seg" role="group" aria-label="Filtrar por estado">
          {FILTERS.map(([v, l]) => (
            <button key={v} type="button" className={status === v ? 'on' : ''} aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
        <input className="input srch" type="search" aria-label="Buscar por nombre o documento" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <p className="alert" role="alert">{error}</p>}
      {loading && <p className="note">Cargando solicitudes...</p>}
      {!loading && !error && shown.length === 0 && <p className="note">No hay solicitudes con este filtro. Prueba con otro estado o borra la búsqueda.</p>}

      {!loading && !error && shown.length > 0 && <>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Cliente</th><th className="r">Monto y plazo</th><th>Destino</th>
                <th className="r">Ingresos al mes</th><th>Recibida</th><th>Estado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const c = r.customer || {}
                const st = String(r.status).toLowerCase()
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="cl">
                        <div className="av">{initials(c)}</div>
                        <div>
                          <div className="nm">{title(c.firstName)} {title(c.lastName)}</div>
                          <div className="sb">N.º {r.id} · Doc. {c.documentNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="r"><div className="am">{cop(r.amount)}</div><div className="sb">{r.termMonths} meses</div></td>
                    <td className="dst">{r.destination || 'Sin destino'}</td>
                    <td className="r am">{cop(c.monthlyIncome)}</td>
                    <td>{day(r.createdAt)}</td>
                    <td><span className={'bd ' + st}><i />{STATUS[r.status] || r.status}</span></td>
                    <td className="r">
                      <Link className={'rv' + (['PENDING', 'APPROVED'].includes(r.status) ? '' : ' alt')} to={`/panel/credits/${r.id}`}>
                        {['PENDING', 'APPROVED'].includes(r.status) ? 'Revisar' : 'Ver detalle'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="ft">Mostrando {shown.length} {shown.length === 1 ? 'solicitud' : 'solicitudes'}</p>
      </>}
    </section>
  )
}