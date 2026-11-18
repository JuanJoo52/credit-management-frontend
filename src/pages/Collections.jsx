import { useEffect, useRef, useState } from 'react'
import PanelFrame from '../PanelFrame'
import { api } from '../api'

const money = (value) => '$' + Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const day = (value) => new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
const statusClass = { Pendiente: 'pending', 'Con abono': 'partial', Vencida: 'overdue', Pagada: 'paid' }
const cents = (value) => Math.round(Number(value) * 100)

export default function Collections() {
  const [document, setDocument] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const dialog = useRef(null)
  const searchVersion = useRef(0)
  const paymentInFlight = useRef(false)
  const continueButton = useRef(null)
  const receiptHeading = useRef(null)

  const credits = result?.activeCredits || []
  const selectedCredit = credits.find((credit) => credit.pendingInstallments.some((item) => item.installmentId === selectedId))
  const selected = selectedCredit?.pendingInstallments.find((item) => item.installmentId === selectedId)
  const count = credits.reduce((total, credit) => total + credit.pendingInstallments.length, 0)

  useEffect(() => {
    if (confirming) dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [confirming])

  useEffect(() => { if (receipt && !saving) receiptHeading.current?.focus() }, [receipt, saving])
  useEffect(() => () => { searchVersion.current += 1 }, [])

  const load = async (doc) => {
    const version = ++searchVersion.current
    setLoading(true); setError(''); setResult(null)
    setSelectedId(null); setAmount(''); setAmountError('')
    try {
      const { ok, data } = await api(`/collections/customers/${encodeURIComponent(doc)}/pending-installments`)
      if (version !== searchVersion.current) return
      if (ok) { setResult(data.data); setNeedsRefresh(false); setPaymentError('') }
      else setError(data.message || 'No pudimos consultar las cuotas. Intenta buscar de nuevo.')
    } catch {
      if (version === searchVersion.current) setError('No pudimos conectar con el servidor. Intenta buscar de nuevo.')
    } finally { if (version === searchVersion.current) setLoading(false) }
  }

  const search = (event) => {
    event.preventDefault()
    if (saving || !document.trim()) return
    setReceipt(null); setPaymentError('')
    load(document.trim().toUpperCase())
  }

  const choose = (item) => {
    setSelectedId(item.installmentId); setAmount(''); setAmountError(''); setPaymentError('')
  }

  const review = (event) => {
    event.preventDefault()
    if (!selected || saving || needsRefresh) return
    const value = Number(amount.replace(',', '.'))
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount) || !Number.isFinite(value) || value <= 0) {
      setAmountError('Escribe un monto mayor a cero, con máximo dos decimales.'); return
    }
    if (cents(value) > cents(selected.pendingBalance)) {
      setAmountError('El monto no puede superar el saldo pendiente de la cuota.'); return
    }
    setAmountError(''); setConfirming(true)
  }

  const closeConfirmation = () => {
    if (paymentInFlight.current) return
    setConfirming(false)
    continueButton.current?.focus()
  }

  const pay = async () => {
    if (paymentInFlight.current || !selected || needsRefresh) return
    paymentInFlight.current = true
    setSaving(true); setPaymentError(''); setReceipt(null)
    const customer = result.customer
    const creditId = selectedCredit.creditRequestId
    try {
      const { ok, data } = await api('/collections/payments', {
        method: 'POST',
        body: { installmentId: selected.installmentId, amount: Number(amount.replace(',', '.')) },
      })
      if (ok) {
        setReceipt({ ...data.data.receipt, customer, creditId })
        setConfirming(false)
        await load(customer.documentNumber)
      } else {
        setPaymentError(data.message || 'No pudimos registrar el pago. Actualiza las cuotas antes de continuar.')
        setNeedsRefresh(true)
      }
    } catch {
      setPaymentError('No pudimos confirmar el resultado del pago. Actualiza las cuotas y verifica el saldo antes de intentar otro pago.')
      setNeedsRefresh(true)
    } finally {
      paymentInFlight.current = false
      setSaving(false); setConfirming(false)
    }
  }

  return (
    <PanelFrame>
      <h1 className="pn-title">Registro de pagos</h1>
      <p className="pn-sub">Busca un cliente y registra el pago de sus cuotas.</p>

      <form className="co-search" onSubmit={search}>
        <div className="field">
          <label htmlFor="co-document">Número de documento</label>
          <input id="co-document" className="input" autoComplete="off" value={document} disabled={saving || loading} onChange={(event) => {
            setDocument(event.target.value.toUpperCase().replace(/\s/g, ''))
            setResult(null); setSelectedId(null); setReceipt(null); setError(''); setPaymentError('')
          }} />
        </div>
        <button className="sbtn" disabled={!document.trim() || saving || loading}>{loading ? 'Buscando…' : 'Buscar cliente'}</button>
      </form>

      {loading && <p className="note" role="status">Consultando cuotas pendientes…</p>}
      {error && <p className="alert" role="alert">{error}</p>}
      {paymentError && <div className="co-feedback">
        <p className="alert" role="alert">{paymentError}</p>
        <button type="button" className="btn ghost small" disabled={saving || loading} onClick={() => load(result?.customer.documentNumber || document.trim())}>Actualizar cuotas</button>
      </div>}

      {receipt && <section className="co-receipt" aria-labelledby="co-receipt-title">
        <h2 id="co-receipt-title" tabIndex={-1} ref={receiptHeading}>Pago registrado exitosamente</h2>
        <p className="note">Comprobante N.º {receipt.paymentId} · {day(receipt.paidAt)} · {new Date(receipt.paidAt).toLocaleTimeString('es-CO')}</p>
        <dl className="dt-kv">
          <div><dt>Cliente</dt><dd>{receipt.customer.fullName}</dd></div>
          <div><dt>Documento</dt><dd>{receipt.customer.documentNumber}</dd></div>
          <div><dt>Crédito / cuota</dt><dd>N.º {receipt.creditId} / N.º {receipt.installmentNumber}</dd></div>
          <div><dt>Monto pagado</dt><dd>{money(receipt.amountPaid)}</dd></div>
          <div><dt>Saldo de la cuota</dt><dd>{money(receipt.remainingBalance)}</dd></div>
          <div><dt>Estado de la cuota</dt><dd>{receipt.status}</dd></div>
        </dl>
      </section>}

      {result && <>
        <div className="co-customer">
          <div className="cl"><div className="av" aria-hidden="true">{result.customer.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}</div>
            <div><strong>{result.customer.fullName}</strong><div className="sb">Documento {result.customer.documentNumber}</div></div>
          </div>
          <span className="sb">{count} {count === 1 ? 'cuota pendiente' : 'cuotas pendientes'}</span>
        </div>
        {count === 0 ? <p className="okmsg" role="status">Este cliente no tiene cuotas pendientes en sus créditos desembolsados.</p> :
          <div className="co-grid">
            <section className="co-installments" aria-labelledby="co-pending-title">
              <h2 id="co-pending-title">Cuotas pendientes</h2>
              <p className="note">Selecciona la cuota que deseas pagar.</p>
              {credits.filter((credit) => credit.pendingInstallments.length > 0).map((credit) => <section className="co-credit" key={credit.creditRequestId}>
                <h3>Crédito N.º {credit.creditRequestId} <span className="sb">· {money(credit.amount)}</span></h3>
                <div className="tw"><table className="co-table">
                  <caption className="sr-only">Cuotas pendientes del crédito {credit.creditRequestId}</caption>
                  <thead><tr><th>Cuota</th><th>Vencimiento</th><th className="r">Valor</th><th className="r">Saldo pendiente</th><th>Estado</th></tr></thead>
                  <tbody>{credit.pendingInstallments.map((item) => <tr key={item.installmentId} className={selectedId === item.installmentId ? 'co-selected' : ''}>
                    <td><label className="co-radio"><input type="radio" name="installment" checked={selectedId === item.installmentId} disabled={saving || needsRefresh} onChange={() => choose(item)} aria-label={`Seleccionar cuota ${item.installmentNumber} del crédito ${credit.creditRequestId}`} />{item.installmentNumber}</label></td>
                    <td>{day(item.dueDate)}</td><td className="r am">{money(item.totalAmount)}</td><td className="r am">{money(item.pendingBalance)}</td>
                    <td><span className={'bd ' + (statusClass[item.status] || 'pending')}><i aria-hidden="true" />{item.status}</span></td>
                  </tr>)}</tbody>
                </table></div>
              </section>)}
            </section>
            <section className="dt-box co-payment" aria-labelledby="co-payment-title">
              <h2 id="co-payment-title">Registrar pago</h2>
              {!selected ? <p className="note">Selecciona una cuota para registrar un abono o pagar su saldo completo.</p> : <form onSubmit={review} noValidate>
                <dl className="co-summary">
                  <div><dt>Crédito / cuota</dt><dd>N.º {selectedCredit.creditRequestId} / N.º {selected.installmentNumber}</dd></div>
                  <div><dt>Valor de la cuota</dt><dd>{money(selected.totalAmount)}</dd></div>
                  <div><dt>Abonado</dt><dd>{money(selected.paidAmount)}</dd></div>
                  <div><dt>Saldo pendiente</dt><dd className="co-balance">{money(selected.pendingBalance)}</dd></div>
                </dl>
                <div className="field">
                  <label htmlFor="co-amount">Monto a pagar (COP)</label>
                  <input id="co-amount" className="input" inputMode="decimal" placeholder="100000,00" value={amount} disabled={saving || needsRefresh} aria-invalid={!!amountError} aria-describedby={amountError ? 'co-amount-error co-amount-hint' : 'co-amount-hint'} onChange={(event) => { setAmount(event.target.value); setAmountError('') }} />
                  {amountError && <p className="err" id="co-amount-error" role="alert">{amountError}</p>}
                  <button type="button" className="link-btn" disabled={saving || needsRefresh} onClick={() => { setAmount(Number(selected.pendingBalance).toFixed(2).replace('.', ',')); setAmountError('') }}>Usar saldo completo</button>
                </div>
                <p id="co-amount-hint" className="note">Sin separadores de miles. Puedes registrar un abono o pagar el saldo completo, con máximo dos decimales.</p>
                <button className="btn" ref={continueButton} disabled={!amount.trim() || saving || needsRefresh}>Continuar</button>
                <p className="note">Revisa los datos antes de confirmar el pago.</p>
              </form>}
            </section>
          </div>}
      </>}
      {!result && !loading && !error && !receipt && <p className="note">Ingresa el documento del cliente para consultar las cuotas de sus créditos desembolsados.</p>}

      <dialog className="dlg co-dialog" ref={dialog} aria-labelledby="co-confirm-title" onCancel={(event) => { event.preventDefault(); closeConfirmation() }}>
        {confirming && selected && <>
          <h2 id="co-confirm-title">Confirmar pago</h2>
          <p>{result.customer.fullName} · Documento {result.customer.documentNumber}</p>
          <dl className="co-summary">
            <div><dt>Crédito / cuota</dt><dd>N.º {selectedCredit.creditRequestId} / N.º {selected.installmentNumber}</dd></div>
            <div><dt>Monto a registrar</dt><dd className="co-balance">{money(Number(amount.replace(',', '.')))}</dd></div>
            <div><dt>Saldo después del pago</dt><dd>{money((cents(selected.pendingBalance) - cents(amount.replace(',', '.'))) / 100)}</dd></div>
          </dl>
          <p className="note">Confirma que recibiste este monto antes de registrar el pago.</p>
          <div className="row"><button className="btn ghost" type="button" autoFocus disabled={saving} onClick={closeConfirmation}>Volver</button><button type="button" className="btn" disabled={saving} onClick={pay}>{saving ? 'Registrando…' : 'Confirmar pago'}</button></div>
          {saving && <p className="note" role="status">Registrando el pago, espera la confirmación…</p>}
        </>}
      </dialog>
    </PanelFrame>
  )
}
