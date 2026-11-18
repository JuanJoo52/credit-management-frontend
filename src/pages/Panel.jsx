import { Link } from 'react-router-dom'
import PanelFrame from '../PanelFrame'
import Credits from './Credits'
import { getUser } from '../auth'

export default function Panel() {
  const canCreate = ['ADMIN', 'ADVISOR'].includes(getUser()?.role)
  return (
    <PanelFrame>
      <div className="us-top">
        <div>
          <h1 className="pn-title">Solicitudes de crédito</h1>
          <p className="pn-sub">Revisa las solicitudes que llegaron desde el formulario público.</p>
        </div>
        {canCreate && <Link className="btn mk" style={{ display: 'inline-flex', alignItems: 'center' }} to="/panel/credits/new">Nueva solicitud</Link>}
      </div>
      <Credits />
    </PanelFrame>
  )
}