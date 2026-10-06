import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  BellRing,
  Plus,
  ChevronDown,
  ChevronUp,
  Building2,
  Loader2,
} from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { paymentsService } from '../../services/payments'
import { ledgerService } from '../../services/ledgerService'

const money = n => `$${Number(n || 0).toLocaleString()}`

function StatCard({ label, value, tone = 'gray' }) {
  const tones = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  )
}

function tenantStatus(t) {
  const due = t.due ?? t.monthlyRent
  if (due > 0 && t.paidThisMonth >= due) return 'paid'
  if (t.pendingThisMonth > 0) return 'processing'
  return 'due'
}

const STATUS_BADGE = {
  paid: {
    classes: 'bg-green-100 text-green-800',
    label: 'Paid',
    Icon: CheckCircle,
  },
  processing: {
    classes: 'bg-yellow-100 text-yellow-800',
    label: 'Processing',
    Icon: Clock,
  },
  due: {
    classes: 'bg-red-100 text-red-800',
    label: 'Due',
    Icon: AlertTriangle,
  },
}

/** Record an offline payment (cash/check) against a tenant's lease. */
function RecordPaymentModal({ tenant, onClose, onSaved }) {
  const [amount, setAmount] = useState(tenant.monthlyRent || '')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await paymentsService.recordPayment({
        applicationId: tenant.applicationId,
        amount: Number(amount),
        paymentMethod: method,
        note: note || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
      >
        <h3 className="font-semibold text-lg">Record payment</h3>
        <p className="text-sm text-gray-600">
          {tenant.name} — logs an offline payment (cash, check, external
          transfer) to the ledger. No money moves through Rentra.
        </p>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount ($)</label>
          <input
            type="number"
            min="1"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="external-transfer">External transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Check #204"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Record'}
          </button>
        </div>
      </form>
    </div>
  )
}

const CHARGE_TYPES = [
  { value: 'utility', label: 'Utility' },
  { value: 'repair', label: 'Repair' },
  { value: 'late_fee', label: 'Late fee' },
  { value: 'other', label: 'Other charge' },
  { value: 'credit', label: 'Credit (reduces what they owe)' },
]

/** Add a charge or credit to a tenant's ledger for this month. */
function ChargeModal({ tenant, onClose, onSaved }) {
  const [type, setType] = useState('utility')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [scope, setScope] = useState('tenant')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await ledgerService.addCharge(tenant.agreementId, {
        type,
        amount: Number(amount),
        description,
        dueDate,
        userId: scope === 'tenant' ? tenant.id : undefined,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
      >
        <h3 className="font-semibold text-lg">Add a charge</h3>
        <p className="text-sm text-gray-600">
          Lands on {tenant.name}&apos;s ledger for the month it is due and is
          emailed to them. A credit reduces what they owe.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">
            Type
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
            >
              {CHARGE_TYPES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-600">
            Amount ($)
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </label>
        </div>
        <label className="block text-sm text-gray-600">
          Description
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Water bill, September"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">
            Due
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </label>
          <label className="block text-sm text-gray-600">
            Applies to
            <select
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
            >
              <option value="tenant">{tenant.name} only</option>
              <option value="household">Whole household (split)</option>
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Expandable per-tenant payment history, from the payment-status API. */
function PaymentHistory({ applicationId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    dashboardService
      .getPaymentStatus(applicationId)
      .then(res => active && setData(res))
      .catch(err => active && setError(err.message))
    return () => {
      active = false
    }
  }, [applicationId])

  if (error) return <p className="text-sm text-red-600 py-2">{error}</p>
  if (!data)
    return (
      <div className="py-3 flex items-center text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading history…
      </div>
    )

  return (
    <div className="pt-3 space-y-2">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-green-50 rounded-lg p-2">
          <div className="font-semibold text-green-700">
            {money(data.stats?.totalPaid)}
          </div>
          <div className="text-xs text-gray-600">Paid to date</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2">
          <div className="font-semibold text-yellow-700">
            {money(data.stats?.totalPending)}
          </div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div
            className={`font-semibold ${
              (data.stats?.balance || 0) > 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {money(Math.max(0, data.stats?.balance || 0))}
          </div>
          <div className="text-xs text-gray-600">Balance</div>
        </div>
      </div>
      {(data.transactions || []).length === 0 ? (
        <p className="text-sm text-gray-500">No payments recorded yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.transactions.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div>
                <div className="font-medium">{money(t.amount)}</div>
                <div className="text-xs text-gray-500">
                  {new Date(t.createdAt).toLocaleDateString()} •{' '}
                  {t.paymentMethod || 'ach'}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  t.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : t.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RentCollection() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [recordingFor, setRecordingFor] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [remindStatus, setRemindStatus] = useState({}) // applicationId -> 'sending' | 'sent' | error
  const [chargingFor, setChargingFor] = useState(null)
  const [feeStatus, setFeeStatus] = useState({}) // agreementId -> 'applying' | error

  const load = useCallback(() => {
    dashboardService
      .getRentRoll()
      .then(setData)
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sendReminder = async tenant => {
    setRemindStatus(s => ({ ...s, [tenant.applicationId]: 'sending' }))
    try {
      await paymentsService.sendReminder({
        applicationId: tenant.applicationId,
        balance: Math.max(0, (tenant.monthlyRent || 0) - tenant.paidThisMonth),
      })
      setRemindStatus(s => ({ ...s, [tenant.applicationId]: 'sent' }))
    } catch (err) {
      setRemindStatus(s => ({ ...s, [tenant.applicationId]: err.message }))
    }
  }

  const applyLateFee = async tenant => {
    setFeeStatus(s => ({ ...s, [tenant.agreementId]: 'applying' }))
    try {
      await ledgerService.applyLateFee(tenant.agreementId)
      setFeeStatus(s => ({ ...s, [tenant.agreementId]: null }))
      load()
    } catch (err) {
      setFeeStatus(s => ({ ...s, [tenant.agreementId]: err.message }))
    }
  }

  const removeCharge = async chargeId => {
    try {
      await ledgerService.removeCharge(chargeId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading rent roll…
      </div>
    )
  }

  const { rentRoll = [], totals = {}, month } = data

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Rent Collection</h2>
        <p className="text-gray-600">{month}</p>
      </div>

      {rentRoll.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4">
            No occupied properties yet. Rent tracking starts once a lease is
            signed.
          </p>
          <button
            onClick={() => navigate('/dashboard/listings/new')}
            className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600"
          >
            Create a listing
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Expected" value={money(totals.monthlyExpected)} />
            <StatCard
              label="Collected"
              value={money(totals.monthlyCollected)}
              tone="green"
            />
            <StatCard
              label="Outstanding"
              value={money(
                Math.max(
                  0,
                  (totals.monthlyExpected || 0) - (totals.monthlyCollected || 0)
                )
              )}
              tone="red"
            />
            <StatCard
              label="Collection rate"
              value={`${
                totals.monthlyExpected > 0
                  ? (
                      ((totals.monthlyCollected || 0) /
                        totals.monthlyExpected) *
                      100
                    ).toFixed(0)
                  : 0
              }%`}
            />
          </div>

          <div className="space-y-4">
            {rentRoll.map(property => (
              <div
                key={property.listing.id}
                className="bg-white border border-gray-200 rounded-lg"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{property.listing.title}</h3>
                    <p className="text-sm text-gray-500">
                      {property.listing.address}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {money(property.financials.monthlyCollected)} /{' '}
                      {money(property.financials.monthlyExpected)}
                    </div>
                    <div className="text-gray-500">collected</div>
                  </div>
                </div>

                {property.tenants.map(tenant => {
                  const status = tenantStatus(tenant)
                  const badge = STATUS_BADGE[status]
                  const remind = remindStatus[tenant.applicationId]
                  const isOpen = expanded === tenant.applicationId
                  return (
                    <div
                      key={tenant.applicationId}
                      className="p-4 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">
                            {money(tenant.monthlyRent)}/mo
                            {tenant.otherCharges > 0 &&
                              ` + ${money(tenant.otherCharges)} charges`}
                            {tenant.credits > 0 &&
                              ` − ${money(tenant.credits)} credit`}
                            {tenant.leaseEnding && (
                              <span className="ml-2 text-amber-700">
                                · lease ending
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${badge.classes}`}
                        >
                          <badge.Icon size={12} className="mr-1" />
                          {badge.label}
                          {status === 'paid'
                            ? ''
                            : ` — ${money(
                                tenant.balance ??
                                  Math.max(
                                    0,
                                    (tenant.monthlyRent || 0) -
                                      tenant.paidThisMonth
                                  )
                              )}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => setRecordingFor(tenant)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                        >
                          <Plus size={14} className="mr-1" /> Record payment
                        </button>
                        <button
                          onClick={() => sendReminder(tenant)}
                          disabled={remind === 'sending' || remind === 'sent'}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                        >
                          <BellRing size={14} className="mr-1" />
                          {remind === 'sending'
                            ? 'Sending…'
                            : remind === 'sent'
                              ? 'Reminder sent ✓'
                              : 'Send reminder'}
                        </button>
                        {tenant.agreementId && (
                          <button
                            onClick={() => setChargingFor(tenant)}
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            <Plus size={14} className="mr-1" /> Add charge
                          </button>
                        )}
                        {tenant.lateFee && (
                          <button
                            onClick={() => applyLateFee(tenant)}
                            disabled={
                              !tenant.lateFee.applicable ||
                              feeStatus[tenant.agreementId] === 'applying'
                            }
                            title={
                              tenant.lateFee.applicable
                                ? `Adds the ${money(tenant.lateFee.amount)} late fee from the lease`
                                : tenant.lateFee.reason
                            }
                            className="inline-flex items-center px-3 py-1.5 text-sm border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 disabled:opacity-50"
                          >
                            <AlertTriangle size={14} className="mr-1" />
                            {tenant.lateFee.appliedThisMonth
                              ? 'Late fee applied'
                              : `Apply ${money(tenant.lateFee.amount)} late fee`}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setExpanded(isOpen ? null : tenant.applicationId)
                          }
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <DollarSign size={14} className="mr-1" /> History
                          {isOpen ? (
                            <ChevronUp size={14} className="ml-1" />
                          ) : (
                            <ChevronDown size={14} className="ml-1" />
                          )}
                        </button>
                      </div>
                      {remind && remind !== 'sending' && remind !== 'sent' && (
                        <p className="text-xs text-red-600 mt-1">{remind}</p>
                      )}
                      {feeStatus[tenant.agreementId] &&
                        feeStatus[tenant.agreementId] !== 'applying' && (
                          <p className="text-xs text-red-600 mt-1">
                            {feeStatus[tenant.agreementId]}
                          </p>
                        )}
                      {tenant.charges?.length > 0 && (
                        <ul className="mt-3 text-sm divide-y divide-gray-100 border border-gray-100 rounded-lg">
                          {tenant.charges.map(c => (
                            <li
                              key={c.id}
                              className="flex items-center justify-between px-3 py-1.5"
                            >
                              <span className="text-gray-700">
                                <span className="font-medium">{c.label}</span>
                                {' · '}
                                {c.description}
                                {c.household && (
                                  <span className="text-gray-400">
                                    {' '}
                                    (household, their share)
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <span
                                  className={
                                    c.type === 'credit'
                                      ? 'text-green-700'
                                      : 'text-gray-900'
                                  }
                                >
                                  {c.type === 'credit' ? '−' : '+'}
                                  {money(c.amount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCharge(c.id)}
                                  className="text-xs text-gray-400 hover:text-red-600"
                                  aria-label="Remove charge"
                                >
                                  Remove
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {isOpen && (
                        <PaymentHistory applicationId={tenant.applicationId} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {recordingFor && (
        <RecordPaymentModal
          tenant={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSaved={() => {
            setRecordingFor(null)
            load()
          }}
        />
      )}
      {chargingFor && (
        <ChargeModal
          tenant={chargingFor}
          onClose={() => setChargingFor(null)}
          onSaved={() => {
            setChargingFor(null)
            load()
          }}
        />
      )}
    </div>
  )
}
