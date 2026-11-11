import PanelFrame from '../PanelFrame'
import Credits from './Credits'

export default function Panel() {
  return (
    <PanelFrame>
      <h1 className="pn-title">Solicitudes de crédito</h1>
      <p className="pn-sub">Revisa las solicitudes que llegaron desde el formulario público.</p>
      <Credits />
    </PanelFrame>
  )
}