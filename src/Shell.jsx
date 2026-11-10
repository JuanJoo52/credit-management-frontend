export const APP_NAME = 'Sistema de Gestion De Creditos'

export default function Shell({ headline, tagline, children }) {
  return (
    <div className="outer"><div className="card">
      <div className="left">
        <p>{tagline}</p>
        <div className="ring" aria-hidden="true" />
        <h1 className="headline">{headline}</h1>
        <div className="phone" aria-hidden="true">
          <div className="notch" />
          <div className="screen">{[40, 65, 50, 85, 60].map((h, i) => <i key={i} style={{ height: h + '%' }} />)}</div>
        </div>
      </div>
      <div className="right">
        <div className="brand"><span className="dot" aria-hidden="true" /><span>{APP_NAME}</span></div>
        {children}
        <div className="foot"><span>© 2026 {APP_NAME}</span></div>
      </div>
    </div></div>
  )
}
