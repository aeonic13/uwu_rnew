import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Repeat, Pause, Play, Trash2, Pencil, Info } from 'lucide-react'
import { rentService } from '../../services/rentService'

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

function ordinal(n) {
  const v = n % 100
  const suffix =
    v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'
  return `${n}${suffix}`
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * A tenant's rent autopay. The schedule is real and persisted; money
 * movement waits on Moov, so on each run day Rentra emails a reminder
 * instead of charging. The copy says so plainly.
 */
function AutopayCard({ agreementId, autopay, defaultAmount, onChange }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = async (fn, next) => {
    setBusy(true)
    setError(null)
    try {
      const result = await fn()
      onChange(next === undefined ? result : next)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const notice = (
    <p className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <Info size={14} className="mt-0.5 flex-shrink-0 text-brand-500" />
      <span>
        Bank transfers through Rentra aren&apos;t live yet. On your autopay day
        we email you a reminder; once ACH launches, this schedule pays
        automatically from your linked bank.
      </span>
    </p>
  )

  if (editing || !autopay) {
    return (
      <AutopayEditor
        agreementId={agreementId}
        autopay={autopay}
        defaultAmount={defaultAmount}
        notice={notice}
        onCancel={autopay ? () => setEditing(false) : null}
        onSaved={saved => {
          setEditing(false)
          onChange(saved)
        }}
      />
    )
  }

  const paused = autopay.status === 'paused'

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
      data-testid="autopay-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Repeat size={18} className="text-brand-500" />
          <h3 className="font-semibold">Autopay</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              paused
                ? 'bg-gray-100 text-gray-600'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {paused ? 'Paused' : 'On'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-brand-500 rounded"
            aria-label="Edit autopay"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() =>
              run(() =>
                rentService.setAutopayStatus(
                  autopay.id,
                  paused ? 'active' : 'paused'
                )
              )
            }
            disabled={busy}
            className="p-1.5 text-gray-400 hover:text-brand-500 rounded disabled:opacity-40"
            aria-label={paused ? 'Resume autopay' : 'Pause autopay'}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button
            onClick={() =>
              run(() => rentService.deleteAutopay(autopay.id), null)
            }
            disabled={busy}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-40"
            aria-label="Turn off autopay"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Amount</p>
          <p className="font-semibold">${autopay.amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Every month on</p>
          <p className="font-semibold">the {ordinal(autopay.dayOfMonth)}</p>
        </div>
        <div>
          <p className="text-gray-500">Next</p>
          <p className="font-semibold">
            {paused ? 'Paused' : formatDate(autopay.nextRunAt)}
          </p>
        </div>
      </div>

      {notice}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

const autopayShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  dayOfMonth: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  nextRunAt: PropTypes.string,
})

AutopayCard.propTypes = {
  agreementId: PropTypes.string.isRequired,
  autopay: autopayShape,
  defaultAmount: PropTypes.number,
  onChange: PropTypes.func.isRequired,
}

function AutopayEditor({
  agreementId,
  autopay,
  defaultAmount,
  notice,
  onCancel,
  onSaved,
}) {
  const [day, setDay] = useState(autopay?.dayOfMonth || 1)
  const [amount, setAmount] = useState(
    String(autopay?.amount ?? (defaultAmount ? Math.round(defaultAmount) : ''))
  )
  // Until the tenant types an amount, keep following their rent share so
  // changing the split above updates this default too.
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched && !autopay && defaultAmount) {
      setAmount(String(Math.round(defaultAmount)))
    }
  }, [defaultAmount, touched, autopay])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const amountNum = Math.round(Number(amount))
  const canSave = Number.isFinite(amountNum) && amountNum > 0

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const saved = await rentService.saveAutopay({
        agreementId,
        dayOfMonth: day,
        amount: amountNum,
        paymentMethod: 'ach',
      })
      onSaved(saved)
    } catch (err) {
      setError(err.message || 'Could not save autopay.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
      data-testid="autopay-editor"
    >
      <div className="flex items-center gap-2">
        <Repeat size={18} className="text-brand-500" />
        <h3 className="font-semibold">
          {autopay ? 'Edit autopay' : 'Set up autopay'}
        </h3>
      </div>
      {!autopay && (
        <p className="text-sm text-gray-500">
          Pick a day and Rentra will handle your rent every month.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="autopay-day"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Day of month
          </label>
          <select
            id="autopay-day"
            value={day}
            onChange={e => setDay(Number(e.target.value))}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 bg-white"
          >
            {DAYS.map(d => (
              <option key={d} value={d}>
                {ordinal(d)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="autopay-amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount
          </label>
          <input
            id="autopay-amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={e => {
              setTouched(true)
              setAmount(e.target.value)
            }}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Defaults to your share of rent. Changing the split updates the default,
        not an autopay you already set.
      </p>

      {notice}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={save}
          disabled={!canSave || busy}
          className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Saving…' : autopay ? 'Save changes' : 'Turn on autopay'}
        </button>
      </div>
    </div>
  )
}

AutopayEditor.propTypes = {
  agreementId: PropTypes.string.isRequired,
  autopay: autopayShape,
  defaultAmount: PropTypes.number,
  notice: PropTypes.node,
  onCancel: PropTypes.func,
  onSaved: PropTypes.func.isRequired,
}

export default AutopayCard
