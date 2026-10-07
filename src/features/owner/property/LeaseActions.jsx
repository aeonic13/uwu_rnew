import { useState } from 'react'
import PropTypes from 'prop-types'
import { CalendarX, RefreshCw, FileEdit, X, LogOut } from 'lucide-react'
import { agreementsService } from '../../../services/agreementsService'
import { money, shortDate } from './statusMeta'

const END_REASONS = [
  { value: 'move_out', label: 'Tenant is moving out' },
  { value: 'nonrenewal', label: 'Not renewing at the end of the term' },
  { value: 'early_termination', label: 'Early termination' },
  { value: 'other', label: 'Other' },
]

const toInput = value => (value ? String(value).slice(0, 10) : '')

const addDays = (value, days) => {
  const d = new Date(value)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const addMonths = (value, months) => {
  const d = new Date(value)
  d.setUTCMonth(d.getUTCMonth() + months)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const NOTICE_REASON_LABEL = {
  moving: 'moving away',
  end_of_term: 'leaving at the end of the term',
  buying: 'bought a home',
  cost: 'cost',
}

/**
 * Mirrors utils/agreements.js rentIncreaseNotice for the form hint: null
 * when rent does not rise, else { percent, days }.
 */
export function rentIncreaseHint(currentRent, newRent) {
  const from = Number(currentRent) || 0
  const to = Number(newRent) || 0
  if (!(to > from) || from <= 0) return null
  const percent = Math.round(((to - from) / from) * 1000) / 10
  return { percent, days: percent > 10 ? 90 : 30 }
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
}

const field =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white'

/** Give notice: the lease ends on the move-out date. */
export function EndLeaseModal({ lease, onClose, onDone }) {
  const notice = lease.tenantNotice || null
  const [moveOutDate, setMoveOutDate] = useState(() =>
    notice?.moveOutDate
      ? toInput(notice.moveOutDate)
      : lease.monthToMonth
        ? addDays(new Date(), 30)
        : toInput(lease.endDate)
  )
  const [reason, setReason] = useState(
    notice ? 'move_out' : lease.monthToMonth ? 'move_out' : 'nonrenewal'
  )
  const [relist, setRelist] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await agreementsService.endLease(lease.id, {
        moveOutDate,
        reason,
        relist,
      })
      await onDone()
    } catch (err) {
      setError(err?.message || 'Could not end the lease.')
      setBusy(false)
    }
  }

  return (
    <Modal
      title={notice ? 'Confirm the move-out' : 'End this lease'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {notice && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {notice.byName || 'A tenant'} gave notice on {shortDate(notice.at)}{' '}
            to move out {shortDate(notice.moveOutDate)}
            {notice.reason && notice.reason !== 'other'
              ? ` (${NOTICE_REASON_LABEL[notice.reason] || notice.reason})`
              : ''}
            {notice.message ? `: “${notice.message}”` : '.'}
          </p>
        )}
        <p className="text-sm text-gray-600">
          Sets the date this lease ends. Every tenant is emailed, and the
          security deposit&apos;s refund countdown starts from the move-out
          date.
        </p>
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Move-out date</span>
          <input
            type="date"
            required
            value={moveOutDate}
            min={toInput(lease.startDate)}
            onChange={e => setMoveOutDate(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Reason</span>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className={`${field} mt-1`}
          >
            {END_REASONS.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={relist}
            onChange={e => setRelist(e.target.checked)}
            className="mt-0.5 accent-brand-500"
          />
          <span>
            Relist the property now so new applicants can apply before the
            move-out date.
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Ending…' : notice ? 'Confirm move-out' : 'End lease'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

EndLeaseModal.propTypes = {
  lease: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
}

/** Draft a renewal for the same household; tenants sign in Rentra. */
export function RenewLeaseModal({ lease, onClose, onDone }) {
  const defaultStart = addDays(lease.endDate, 1)
  const [startDate, setStartDate] = useState(defaultStart)
  const [term, setTerm] = useState('12')
  const [monthlyRent, setMonthlyRent] = useState(lease.monthlyRent)
  const [securityDeposit, setSecurityDeposit] = useState(lease.securityDeposit)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const monthToMonth = term === 'm2m'
  const endDate = monthToMonth ? null : addMonths(startDate, Number(term))

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const renewal = await agreementsService.renewLease(lease.id, {
        startDate,
        endDate,
        monthToMonth,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
      })
      await onDone(renewal)
    } catch (err) {
      setError(err?.message || 'Could not create the renewal.')
      setBusy(false)
    }
  }

  const change = Number(monthlyRent) - lease.monthlyRent

  return (
    <Modal title="Renew this lease" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Drafts a new lease for the same household with these terms. Each
          tenant gets an email to review and e-sign; you sign too. The current
          lease stays in force until its end date.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Starts</span>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Term</span>
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
              className={`${field} mt-1`}
            >
              <option value="12">12 months</option>
              <option value="6">6 months</option>
              <option value="m2m">Month-to-month</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Monthly rent ($)</span>
            <input
              type="number"
              min="1"
              required
              value={monthlyRent}
              onChange={e => setMonthlyRent(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Deposit ($)</span>
            <input
              type="number"
              min="0"
              required
              value={securityDeposit}
              onChange={e => setSecurityDeposit(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          {monthToMonth
            ? `Month-to-month from ${shortDate(startDate)}`
            : `${shortDate(startDate)} – ${shortDate(endDate)}`}
          {change !== 0 &&
            ` · rent ${change > 0 ? 'up' : 'down'} ${money(Math.abs(change))} from ${money(lease.monthlyRent)}`}
          {lease.rentSplit &&
            ' · the household split carries over in the same proportions'}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Send renewal for signatures'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

RenewLeaseModal.propTypes = {
  lease: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
}

/** Change a signed lease mid-term; everyone signs the amendment. */
export function AmendLeaseModal({ lease, onClose, onDone }) {
  const [effectiveDate, setEffectiveDate] = useState(() =>
    addDays(new Date(), 30)
  )
  const [monthlyRent, setMonthlyRent] = useState(lease.monthlyRent)
  const [endDate, setEndDate] = useState(toInput(lease.endDate))
  const [addEmail, setAddEmail] = useState('')
  const [removeIds, setRemoveIds] = useState([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Tenants with an account can be taken off the lease; at least one
  // must stay (or a new roommate must be added).
  const household = (lease.members || []).filter(m => m.user?.id)
  const staying = household.filter(m => !removeIds.includes(m.user.id))
  const canRemoveMore = staying.length > 1 || addEmail.trim().length > 0
  const toggleRemove = id =>
    setRemoveIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    )

  // Statutory notice for a rent increase (CA Civil Code §827: 30 days up
  // to 10%, 90 days above). The server enforces it; this sets the date
  // picker's floor and explains it.
  const increase = rentIncreaseHint(lease.monthlyRent, monthlyRent)
  const earliest = increase ? addDays(new Date(), increase.days) : null
  const minDate =
    earliest && earliest > addDays(lease.startDate, 1)
      ? earliest
      : addDays(lease.startDate, 1)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await agreementsService.amendLease(lease.id, {
        effectiveDate,
        monthlyRent: Number(monthlyRent),
        endDate: lease.monthToMonth ? undefined : endDate,
        addTenantEmails: addEmail.trim() ? [addEmail.trim()] : [],
        removeTenantIds: removeIds,
        note: note.trim() || undefined,
      })
      await onDone()
    } catch (err) {
      setError(err?.message || 'Could not create the amendment.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Amend this lease" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Drafts a replacement lease that takes over on the effective date.
          Every tenant and you sign it; until then the current lease stands. The
          deposit, household split and autopay carry over.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Effective date</span>
            <input
              type="date"
              required
              value={effectiveDate}
              min={minDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
          {increase && (
            <p className="col-span-2 -mt-1 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              A {increase.percent}% rent increase needs {increase.days}{' '}
              days&apos; written notice
              {increase.days === 90 ? ' in California (over 10%)' : ''}.
              Earliest effective date: {shortDate(earliest)}. Each tenant gets a
              notice-of-increase email with the amendment.
            </p>
          )}
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Monthly rent ($)</span>
            <input
              type="number"
              min="1"
              required
              value={monthlyRent}
              onChange={e => setMonthlyRent(e.target.value)}
              className={`${field} mt-1`}
            />
          </label>
          {!lease.monthToMonth && (
            <label className="block text-sm col-span-2">
              <span className="text-gray-700 font-medium">Lease end date</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`${field} mt-1`}
              />
            </label>
          )}
          {household.length > 0 && (
            <fieldset className="col-span-2 text-sm">
              <legend className="text-gray-700 font-medium">
                Remove a tenant{' '}
                <span className="font-normal text-gray-500">
                  (they leave on the effective date and do not sign)
                </span>
              </legend>
              <ul className="mt-1 space-y-1">
                {household.map(m => {
                  const checked = removeIds.includes(m.user.id)
                  return (
                    <li key={m.user.id}>
                      <label className="flex items-center gap-2 text-gray-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && !canRemoveMore}
                          onChange={() => toggleRemove(m.user.id)}
                          className="accent-brand-500"
                        />
                        <span>
                          {m.user.firstName} {m.user.lastName}
                        </span>
                        {checked && (
                          <span className="text-xs text-red-600">
                            leaves {shortDate(effectiveDate)}
                          </span>
                        )}
                      </label>
                    </li>
                  )
                })}
              </ul>
              {!canRemoveMore && removeIds.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  The only tenant cannot be removed; end the lease instead, or
                  add a roommate first.
                </p>
              )}
            </fieldset>
          )}
          <label className="block text-sm col-span-2">
            <span className="text-gray-700 font-medium">
              Add a roommate{' '}
              <span className="font-normal text-gray-500">
                (their Rentra tenant email, optional)
              </span>
            </span>
            <input
              type="email"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              placeholder="new.roommate@email.com"
              className={`${field} mt-1`}
            />
          </label>
          <label className="block text-sm col-span-2">
            <span className="text-gray-700 font-medium">
              Note to tenants{' '}
              <span className="font-normal text-gray-500">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Rent increase per the annual review; everything else unchanged."
              className={`${field} mt-1`}
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Send amendment for signatures'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

AmendLeaseModal.propTypes = {
  lease: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
}

/** The Amend / Renew / End buttons for a signed lease in force. */
export function LeaseActionButtons({
  lease,
  onEnd,
  onRenew,
  onAmend,
  className,
}) {
  if (!lease.fullySigned || !lease.current || lease.endedAt) return null
  const notice = lease.tenantNotice || null
  return (
    <>
      {notice && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 text-xs font-medium"
          title={
            notice.message
              ? `${notice.byName || 'Tenant'}: ${notice.message}`
              : undefined
          }
        >
          <LogOut size={12} /> {notice.byName || 'Tenant'} gave notice for{' '}
          {shortDate(notice.moveOutDate)}
        </span>
      )}
      {!lease.amendmentId && onAmend && (
        <button
          type="button"
          onClick={onAmend}
          className={className}
          title="Change rent, dates, terms or roommates mid-term"
        >
          <FileEdit size={13} /> Amend
        </button>
      )}
      {!lease.renewalId && (
        <button
          type="button"
          onClick={onRenew}
          className={className}
          title="Draft a renewal for the same tenants"
        >
          <RefreshCw size={13} /> Renew
        </button>
      )}
      <button
        type="button"
        onClick={onEnd}
        className={`${className} hover:border-red-400 hover:text-red-600`}
        title={
          notice
            ? 'Confirm the move-out date the tenant gave'
            : 'Set the date this lease ends'
        }
      >
        <CalendarX size={13} /> {notice ? 'Confirm move-out' : 'End lease'}
      </button>
    </>
  )
}

LeaseActionButtons.propTypes = {
  lease: PropTypes.object.isRequired,
  onEnd: PropTypes.func.isRequired,
  onRenew: PropTypes.func.isRequired,
  onAmend: PropTypes.func,
  className: PropTypes.string,
}
