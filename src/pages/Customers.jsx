import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { getUser } from '../auth'
import PanelFrame from '../PanelFrame'
import CustomerDialog from '../CustomerDialog'

const DOC = { CC: 'CC', CE: 'CE', PASSPORT: 'Pasaporte' }
const cop = (n) => '$' + Number(n).toLocaleString('es-CO')
const day = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')
const title = (s = '') => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())
const initials = (c = {}) => ((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase()

export default function Customers() {
  const canEdit = ['ADMIN', 'ADVISOR'].includes(getUser()?.role)
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const { ok, data } = await api('/customers')
      if (ok) setRows(data.data || [])
      else setError(data.message || 'No pudimos cargar los clientes.')
    } catch { setError('No pudimos conectar con el servidor.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((c) => `${c.firstName} ${c.lastName} ${c.documentNumber}`.toLowerCase().includes(t))
  }, [rows, q])

  return (
    <PanelFrame>
      <div className="us-top">
        <div>
          <h1 className="pn-title">Clientes</h1>
          <p className="pn-sub">Consulta, registra y corrige los datos de los clientes.</p>
        </div>
        {canEdit && <button type="button" className="btn mk" onClick={() => setDialog({ mode: 'create' })}>Crear cliente</button>}
      </div>

      <div className="tb">
        <input className="input srch" type="search" aria-label="Buscar por nombre o documento" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <p className="alert" role="alert">{error}</p>}
      {loading && <p className="note">Cargando clientes...</p>}
      {!loading && !error && shown.length === 0 && <p className="note">No hay clientes con esa búsqueda.</p>}

      {!loading && !error && shown.length > 0 && <>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Cliente</th><th className="r">Ingresos al mes</th><th>Teléfono</th><th>Dirección</th><th>Registrado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cl">
                      <div className="av" aria-hidden="true">{initials(c)}</div>
                      <div>
                        <div className="nm">{title(c.firstName)} {title(c.lastName)}</div>
                        <div className="sb">{DOC[c.documentType] || c.documentType} {c.documentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="r am nm">{cop(c.monthlyIncome)}</td>
                  <td>{c.phone || '—'}</td>
                  <td className="dst">{c.address === 'No registrada' ? <span className="sb">No registrada</span> : c.address}</td>
                  <td>{day(c.createdAt)}</td>
                  <td className="r">
                    {canEdit && <button type="button" className="u-ed" onClick={() => setDialog({ mode: 'edit', customer: c })}>Editar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ft">{q ? `${shown.length} de ${rows.length} clientes` : `${rows.length} clientes`}</p>
      </>}

      {dialog && <CustomerDialog mode={dialog.mode} customer={dialog.customer} onClose={() => setDialog(null)} onDone={() => { setDialog(null); load() }} />}
    </PanelFrame>
  )
}