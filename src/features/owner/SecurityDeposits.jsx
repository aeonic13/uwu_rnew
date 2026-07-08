import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Printer,
  Loader2,
} from 'lucide-react'
import { depositsService } from '../../services/depositsService'

const money = n => `$${Number(n || 0).toLocaleString()}`
const DEDUCTION_LABELS = {
  unpaid_rent: 'Unpaid rent',
  cleaning: 'Cleaning',
  repairs: 'Repairs (beyond normal wear)',
  other: 'Other',
}

function DeadlineBadge({ deposit }) {
  if (deposit.status === 'refunded') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" /> Refunded{' '}
        {deposit.refundedAt &&
          new Date(deposit.refundedAt).toLocaleDateString()}
      </span>
    )
  }
  if (deposit.daysRemaining == null) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
        <Shield size={12} className="mr-1" /> Holding
      </span>
    )
  }
  const overdue = deposit.daysRemaining < 0
  const urgent = deposit.daysRemaining <= 7
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
        overdue
          ? 'bg-red-100 text-red-800'
          : urgent
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-brand-100 text-brand-700'
      }`}
    >
      {overdue ? (
        <AlertTriangle size={12} className="mr-1" />
      ) : (
        <Clock size={12} className="mr-1" />
      )}
      {overdue
        ? `${Math.abs(deposit.daysRemaining)} days OVERDUE`
        : `${deposit.daysRemaining} days to refund`}
    </span>
  )
}

/** Printable itemized disposition letter (opens the browser print dialog). */
function printLetter(letter) {
  const win = window.open('', '_blank', 'width=700,height=800')
  if (!win) return
  const rows = letter.deductions
    .map(
      d =>
        `<tr><td style="padding:6px;border-bottom:1px solid #eee;">${
          DEDUCTION_LABELS[d.category] || d.category
        }</td><td style="padding:6px;border-bottom:1px solid #eee;">${
          d.description
        }</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right;">-$${d.amount.toLocaleString()}</td></tr>`
    )
    .join('')
  win.document
    .write(`<!doctype html><html><head><title>Security Deposit Itemized Statement</title></head>
  <body style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#222;line-height:1.5;">
    <h2 style="margin-bottom:0;">Security Deposit Itemized Statement</h2>
    <p style="color:#666;margin-top:4px;">Issued ${new Date().toLocaleDateString()} • per ${letter.statuteCite}</p>
    <p><strong>From:</strong> ${letter.landlord.name} (${letter.landlord.email})<br/>
    <strong>To:</strong> ${letter.tenant.firstName} ${letter.tenant.lastName} (${letter.tenant.email})<br/>
    <strong>Property:</strong> ${letter.property.title}, ${letter.property.location}</p>
    <p>Move-out date: <strong>${letter.moveOutDate ? new Date(letter.moveOutDate).toLocaleDateString() : '—'}</strong><br/>
    Statutory refund deadline (${letter.returnWindowDays} days, ${letter.state}): <strong>${letter.refundDeadline ? new Date(letter.refundDeadline).toLocaleDateString() : '—'}</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px;font-weight:bold;">Deposit held</td><td></td><td style="padding:6px;text-align:right;font-weight:bold;">$${letter.amountHeld.toLocaleString()}</td></tr>
      ${rows || '<tr><td style="padding:6px;" colspan="3">No deductions — full refund.</td></tr>'}
      <tr><td style="padding:6px;font-weight:bold;border-top:2px solid #222;">Refund due</td><td style="border-top:2px solid #222;"></td><td style="padding:6px;text-align:right;font-weight:bold;border-top:2px solid #222;">$${letter.refundDue.toLocaleString()}</td></tr>
    </table>
    <p>This statement itemizes deductions from your security deposit as required by ${letter.statuteCite}. If you have questions, reply to ${letter.landlord.email}.</p>
    <p style="margin-top:32px;">${letter.landlord.name}</p>
    <script>window.print()</script>
  </body></html>`)
  win.document.close()
}

function DepositCard({ deposit, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [moveOut, setMoveOut] = useState(
    deposit.moveOutDate ? deposit.moveOutDate.slice(0, 10) : ''
  )
  const [showDeduction, setShowDeduction] = useState(false)
  const [dCategory, setDCategory] = useState('cleaning')
  const [dDescription, setDDescription] = useState('')
  const [dAmount, setDAmount] = useState('')

  const run = async fn => {
    setBusy(true)
    setError(null)
    try {
      const updated = await fn()
      if (updated) onChanged(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const saveMoveOut = () =>
    run(() => depositsService.update(deposit.id, { moveOutDate: moveOut }))

  const addDeduction = e => {
    e.preventDefault()
    run(async () => {
      const updated = await depositsService.addDeduction(deposit.id, {
        category: dCategory,
        description: dDescription,
        amount: Number(dAmount),
      })
      setShowDeduction(false)
      setDDescription('')
      setDAmount('')
      return updated
    })
  }

  const refunded = deposit.status === 'refunded'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">
            {deposit.tenant?.firstName} {deposit.tenant?.lastName}
          </div>
          <div className="text-sm text-gray-500">
            {deposit.listing?.title} • lease ends{' '}
            {deposit.lease?.endDate
              ? new Date(deposit.lease.endDate).toLocaleDateString()
              : '—'}
          </div>
        </div>
        <DeadlineBadge deposit={deposit} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="font-semibold">{money(deposit.amountHeld)}</div>
          <div className="text-xs text-gray-600">Held</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="font-semibold text-red-600">
            -{money(deposit.totalDeductions)}
          </div>
          <div className="text-xs text-gray-600">Deductions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="font-semibold text-green-700">
            {money(refunded ? deposit.refundAmount : deposit.refundDue)}
          </div>
          <div className="text-xs text-gray-600">
            {refunded ? 'Refunded' : 'Refund due'}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {deposit.state} law: itemized statement + refund within{' '}
        {deposit.returnWindowDays} days of move-out ({deposit.statuteCite}).
      </p>

      {!refunded && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">
              Move-out date {deposit.moveOutDate ? '' : '(starts the clock)'}
            </label>
            <input
              type="date"
              value={moveOut}
              onChange={e => setMoveOut(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={saveMoveOut}
            disabled={busy || !moveOut}
            className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {deposit.deductions.length > 0 && (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {deposit.deductions.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {DEDUCTION_LABELS[d.category] || d.category}
                </div>
                <div className="text-xs text-gray-500">{d.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-600">
                  -{money(d.amount)}
                </span>
                {!refunded && (
                  <button
                    onClick={() =>
                      run(() =>
                        depositsService.removeDeduction(deposit.id, d.id)
                      )
                    }
                    className="text-gray-400 hover:text-red-600"
                    title="Remove deduction"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!refunded && showDeduction && (
        <form
          onSubmit={addDeduction}
          className="border border-gray-200 rounded-lg p-3 space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <select
              value={dCategory}
              onChange={e => setDCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              {Object.entries(DEDUCTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              required
              placeholder="Amount ($)"
              value={dAmount}
              onChange={e => setDAmount(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <input
            type="text"
            required
            placeholder="Description (shown on the itemized statement)"
            value={dDescription}
            onChange={e => setDDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeduction(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-1.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-brand-500 text-white py-1.5 rounded-lg text-sm hover:bg-brand-600 disabled:opacity-50"
            >
              Add deduction
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        {!refunded && !showDeduction && (
          <button
            onClick={() => setShowDeduction(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Plus size={14} className="mr-1" /> Deduction
          </button>
        )}
        <button
          onClick={() =>
            run(async () => {
              const letter = await depositsService.getLetter(deposit.id)
              printLetter(letter)
              return null
            })
          }
          disabled={busy}
          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Printer size={14} className="mr-1" /> Itemized letter
        </button>
        {!refunded && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Record refund of ${money(deposit.refundDue)} to ${
                    deposit.tenant?.firstName
                  }? Generate and send the itemized letter with the refund.`
                )
              ) {
                run(() => depositsService.recordRefund(deposit.id, 'check'))
              }
            }}
            disabled={busy}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={14} className="mr-1" /> Mark refunded
          </button>
        )}
      </div>
    </div>
  )
}

export default function SecurityDeposits() {
  const navigate = useNavigate()
  const [deposits, setDeposits] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    depositsService
      .list()
      .then(setDeposits)
      .catch(err => setError(err.message))
  }, [])

  const replaceDeposit = updated =>
    setDeposits(list => list.map(d => (d.id === updated.id ? updated : d)))

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Security Deposits</h2>
        <p className="text-gray-600">
          State-compliant deposit tracking: refund countdown, itemized
          deductions, and the disposition letter.
        </p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!deposits && !error && (
        <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading deposits…
        </div>
      )}
      {deposits && deposits.length === 0 && (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">
            No deposits yet. A deposit record is created automatically when a
            lease is signed.
          </p>
        </div>
      )}
      <div className="space-y-4">
        {(deposits || []).map(deposit => (
          <DepositCard
            key={deposit.id}
            deposit={deposit}
            onChanged={replaceDeposit}
          />
        ))}
      </div>
    </div>
  )
}
