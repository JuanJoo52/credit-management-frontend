import { useEffect, useState } from 'react'
import { api } from './api'

const MIN = 100000, MAX = 100000000
const cop = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CO')

export default function Simulator({ amount, termMonths, onResult }) {
  const valid = amount >= MIN && amount <= MAX && Number.isInteger(termMonths) && termMonths >= 1 && termMonths <= 72
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!valid) { setRes(null); setError(''); onResult?.(null); return }
    let cancelled = false
    setLoading(true); setError('')
    const t = setTimeout(async () => {
      try {
        const { ok, data } = await api('/credits/simulate', { method: 'POST', body: { amount, termMonths } })
        if (cancelled) return
        if (ok) { setRes(data.data); onResult?.(data.data) }
        else { setRes(null); onResult?.(null); setError(data.message || 'No pudimos calcular la cuota.') }
      } catch {
        if (!cancelled) { setRes(null); onResult?.(null); setError('No pudimos calcular la cuota. Intenta de nuevo.') }
      } finally { if (!cancelled) setLoading(false) }
    }, 500)
    return () => { cancelled = true; clearTimeout(t) }
  }, [amount, termMonths, valid])

  if (!valid) return <p className="note">Escribe un monto entre $100.000 y $100.000.000 y un plazo de 1 a 72 meses para ver la cuota estimada.</p>
  if (error) return <p className="alert" role="alert">{error}</p>
  if (!res) return <p className="note">Calculando la cuota...</p>

  const rate = (res.monthlyInterestRate * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })
  return (
    <div className="sim" aria-live="polite" style={{ opacity: loading ? 0.6 : 1 }}>
      <div className="sim-k">Cuota estimada</div>
      <div><span className="sim-big">{cop(res.monthlyInstallment)}</span> <span className="sim-k">al mes</span></div>
      <dl className="sim-kv">
        <div><dt>Interés mensual</dt><dd>{rate} %</dd></div>
        <div><dt>Total de intereses</dt><dd>{cop(res.totalInterest)}</dd></div>
        <div><dt>Total a pagar</dt><dd>{cop(res.totalPayment)}</dd></div>
      </dl>
      <details>
        <summary>Ver cronograma ({res.schedule.length} cuotas)</summary>
        <div className="sim-sc">
          <table>
            <thead><tr><th>Cuota</th><th className="r">Pago</th><th className="r">Interés</th><th className="r">Capital</th><th className="r">Saldo</th></tr></thead>
            <tbody>
              {res.schedule.map((r) => (
                <tr key={r.installmentNumber}>
                  <td>{r.installmentNumber}</td>
                  <td className="r">{cop(r.payment)}</td>
                  <td className="r">{cop(r.interest)}</td>
                  <td className="r">{cop(r.principal)}</td>
                  <td className="r">{cop(r.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="note">Valor estimado. La aprobación depende de la evaluación de la solicitud.</p>
    </div>
  )
}