import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Users,
  FileText,
  Send,
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { propertiesService } from '../../../services/propertiesService'
import { documentsService } from '../../../services/documentsService'
import { listingsService } from '../../../services/listingsService'
import { money, shortDate } from './statusMeta'

const STEPS = [
  { key: 'lease', label: 'Lease', Icon: FileText },
  { key: 'tenants', label: 'Tenants', Icon: Users },
  { key: 'review', label: 'Review & send', Icon: Send },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_HOUSEHOLD = 12

const emptyTenant = () => ({
  key: Math.random().toString(36).slice(2),
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

/** Problems with the lease step, keyed by field. */
export function validateLease(lease) {
  const errors = {}
  if (!lease.startDate) errors.startDate = 'Enter the lease start date.'
  if (!lease.monthToMonth) {
    if (!lease.endDate) {
      errors.endDate = 'Enter the end date, or mark the lease month-to-month.'
    } else if (lease.startDate && lease.endDate <= lease.startDate) {
      errors.endDate = 'The end date must be after the start date.'
    }
  }
  if (!(Number(lease.monthlyRent) > 0)) {
    errors.monthlyRent = 'Enter the monthly rent.'
  }
  if (lease.securityDeposit === '' || Number(lease.securityDeposit) < 0) {
    errors.securityDeposit = 'Enter the deposit you hold (0 if none).'
  }
  return errors
}

/** Problems with the tenants step, keyed by row key then field. */
export function validateTenants(tenants, ownerEmail) {
  const errors = {}
  const seen = new Set()
  tenants.forEach(t => {
    const e = {}
    if (!t.firstName.trim()) e.firstName = 'Required'
    if (!t.lastName.trim()) e.lastName = 'Required'
    const email = t.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email'
    else if (seen.has(email)) e.email = 'Listed twice'
    else if (ownerEmail && email === ownerEmail.toLowerCase()) {
      e.email = 'That is your own email'
    }
    seen.add(email)
    if (Object.keys(e).length) errors[t.key] = e
  })
  return errors
}

function Field({ label, error, hint, children }) {
  // The control sits inside the label so the two are associated; the hint
  // and error live outside it so the label text stays just the label.
  return (
    <div>
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </span>
        {children}
      </label>
      {hint && !error && (
        <span className="block text-xs text-gray-500 mt-1">{hint}</span>
      )}
      {error && (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      )}
    </div>
  )
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  hint: PropTypes.string,
  children: PropTypes.node,
}

const inputClass = err =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

/**
 * Landlord flow at /dashboard/properties/:id/onboard: record the lease
 * that already exists on an occupied property and invite its current
 * household. Three steps on one page; POST /api/properties/:id/onboard
 * at the end.
 */
export default function OnboardTenantsFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [property, setProperty] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState(0)
  const [lease, setLease] = useState({
    startDate: '',
    endDate: '',
    monthToMonth: false,
    monthlyRent: '',
    securityDeposit: '',
  })
  const [leaseFile, setLeaseFile] = useState(null)
  const [tenants, setTenants] = useState([emptyTenant()])
  const [attest, setAttest] = useState(false)
  const [touched, setTouched] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [delisting, setDelisting] = useState(false)
  const [delisted, setDelisted] = useState(false)

  useEffect(() => {
    let cancelled = false
    propertiesService
      .getProperty(id)
      .then(res => {
        if (cancelled) return
        setProperty(res.property)
        setBlocked(
          res.leases.some(l => l.current || l.awaitingTenants || !l.fullySigned)
        )
        setLease(prev => ({
          ...prev,
          monthlyRent: prev.monthlyRent || String(res.property.price || ''),
          securityDeposit:
            prev.securityDeposit || String(res.property.price || ''),
        }))
      })
      .catch(err => {
        if (!cancelled)
          setLoadError(err?.message || 'Could not load this property.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const leaseErrors = useMemo(() => validateLease(lease), [lease])
  const tenantErrors = useMemo(
    () => validateTenants(tenants, user?.email),
    [tenants, user?.email]
  )

  const setLeaseField = (field, value) =>
    setLease(prev => ({ ...prev, [field]: value }))
  const setTenantField = (key, field, value) =>
    setTenants(prev =>
      prev.map(t => (t.key === key ? { ...t, [field]: value } : t))
    )

  const next = () => {
    setTouched(true)
    if (step === 0 && Object.keys(leaseErrors).length) return
    if (step === 1 && Object.keys(tenantErrors).length) return
    setTouched(false)
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  const back = () => {
    setTouched(false)
    setStep(s => Math.max(s - 1, 0))
  }

  const submit = useCallback(async () => {
    if (!attest) {
      setSubmitError('Confirm that these terms match the signed lease.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      let documentUrl
      if (leaseFile) {
        const doc = await documentsService.upload(leaseFile, {
          name: `Signed lease – ${property.title}`,
          category: 'lease',
          listingId: id,
        })
        documentUrl = doc?.url
      }
      const res = await propertiesService.onboard(id, {
        lease: {
          startDate: lease.startDate,
          endDate: lease.monthToMonth ? undefined : lease.endDate,
          monthToMonth: lease.monthToMonth,
          monthlyRent: Number(lease.monthlyRent),
          securityDeposit: Number(lease.securityDeposit),
          documentUrl,
        },
        tenants: tenants.map(t => ({
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          email: t.email.trim(),
          phone: t.phone.trim() || undefined,
        })),
        attest: true,
      })
      setResult(res)
    } catch (err) {
      setSubmitError(err?.message || 'Could not send the invitations.')
    } finally {
      setSubmitting(false)
    }
  }, [attest, leaseFile, property, id, lease, tenants])

  const stopApplications = async () => {
    setDelisting(true)
    try {
      await listingsService.toggleListingStatus(id, false)
      setDelisted(true)
    } catch (err) {
      setSubmitError(err?.message || 'Could not update the listing.')
    } finally {
      setDelisting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-64 bg-white border border-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (loadError || !property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">
          {loadError || 'Property not found.'}
        </p>
        <Link
          to="/dashboard"
          className="text-brand-600 font-medium hover:underline"
        >
          Back to your properties
        </Link>
      </div>
    )
  }

  const backLink = `/dashboard/properties/${id}/tenants`

  if (blocked) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> {property.title}
        </Link>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">
            This property already has a lease
          </h1>
          <p className="text-gray-600 mt-2">
            Current tenants can only be added to a property with no lease in
            progress. Manage the existing household from the Tenants tab.
          </p>
          <Link
            to={backLink}
            className="inline-block mt-5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
          >
            Open the Tenants tab
          </Link>
        </div>
      </div>
    )
  }

  if (result) {
    const sentCount = result.invites.filter(i => i.emailSent).length
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Invitations sent
            </h1>
            <p className="text-gray-600 mt-2">
              {result.invites.length === 1
                ? 'Your tenant will get an email'
                : `Each of your ${result.invites.length} tenants will get an email`}{' '}
              with the lease facts and a link to confirm. The property shows as
              Leased once everyone has confirmed.
            </p>
            {sentCount < result.invites.length && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mt-4">
                {result.invites.length - sentCount} email
                {result.invites.length - sentCount === 1 ? '' : 's'} could not
                be delivered right now. You can resend from the Tenants tab.
              </p>
            )}
          </div>

          <ul className="mt-6 divide-y divide-gray-100 border-t border-b border-gray-100">
            {result.invites.map(inv => (
              <li
                key={inv.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <span className="text-gray-900 font-medium">
                  {inv.firstName} {inv.lastName}
                  <span className="text-gray-500 font-normal ml-2">
                    {inv.email}
                  </span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Invited
                </span>
              </li>
            ))}
          </ul>

          {property.active && !delisted && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-700 flex-1">
                This listing is still taking applications. Stop that now the
                unit is occupied?
              </p>
              <button
                type="button"
                onClick={stopApplications}
                disabled={delisting}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                {delisting ? 'Updating…' : 'Stop taking applications'}
              </button>
            </div>
          )}
          {delisted && (
            <p className="mt-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              The listing is no longer taking applications.
            </p>
          )}
          {submitError && (
            <p className="mt-4 text-sm text-red-600">{submitError}</p>
          )}

          <div className="mt-6 text-center">
            <Link
              to={backLink}
              className="inline-block px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
            >
              Go to the Tenants tab
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const showLeaseErrors = touched && step === 0
  const showTenantErrors = touched && step === 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> {property.title}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Add current tenants
        </h1>
        <p className="text-gray-600 mt-1">
          Record the lease you already have and invite the household. No
          screening, no fee, nothing to e-sign: each tenant confirms the terms
          and lands in their Rentra account.
        </p>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mt-6 mb-5" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                  i === step
                    ? 'bg-brand-500 text-white'
                    : i < step
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                }`}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <CheckCircle2 size={14} /> : <s.Icon size={14} />}
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="w-6 h-px bg-gray-300" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Lease start"
                  error={showLeaseErrors && leaseErrors.startDate}
                >
                  <input
                    type="date"
                    value={lease.startDate}
                    onChange={e => setLeaseField('startDate', e.target.value)}
                    className={inputClass(
                      showLeaseErrors && leaseErrors.startDate
                    )}
                  />
                </Field>
                <Field
                  label="Lease end"
                  error={showLeaseErrors && leaseErrors.endDate}
                  hint={
                    lease.monthToMonth
                      ? 'Rolls forward automatically.'
                      : undefined
                  }
                >
                  <input
                    type="date"
                    value={lease.endDate}
                    disabled={lease.monthToMonth}
                    onChange={e => setLeaseField('endDate', e.target.value)}
                    className={`${inputClass(
                      showLeaseErrors && leaseErrors.endDate
                    )} disabled:bg-gray-100 disabled:text-gray-400`}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={lease.monthToMonth}
                  onChange={e =>
                    setLeaseField('monthToMonth', e.target.checked)
                  }
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                This lease is month-to-month
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Monthly rent"
                  error={showLeaseErrors && leaseErrors.monthlyRent}
                  hint="Total for the unit. Split equally between tenants for now."
                >
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={lease.monthlyRent}
                      onChange={e =>
                        setLeaseField('monthlyRent', e.target.value)
                      }
                      className={`${inputClass(
                        showLeaseErrors && leaseErrors.monthlyRent
                      )} pl-7`}
                    />
                  </div>
                </Field>
                <Field
                  label="Security deposit held"
                  error={showLeaseErrors && leaseErrors.securityDeposit}
                >
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={lease.securityDeposit}
                      onChange={e =>
                        setLeaseField('securityDeposit', e.target.value)
                      }
                      className={`${inputClass(
                        showLeaseErrors && leaseErrors.securityDeposit
                      )} pl-7`}
                    />
                  </div>
                </Field>
              </div>

              <Field
                label="Signed lease (optional)"
                hint="PDF, Word or image. Saved to this property's Documents and linked from the lease."
              >
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer hover:border-brand-500 hover:text-brand-600">
                    <Upload size={14} />
                    {leaseFile ? 'Change file' : 'Choose file'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      className="sr-only"
                      onChange={e => setLeaseFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {leaseFile && (
                    <span className="text-sm text-gray-600 truncate">
                      {leaseFile.name}
                    </span>
                  )}
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                One row per person on the lease. Each gets their own email
                invitation.
              </p>
              {tenants.map((t, i) => {
                const errs = (showTenantErrors && tenantErrors[t.key]) || {}
                return (
                  <div
                    key={t.key}
                    className="border border-gray-200 rounded-lg p-4"
                    data-testid={`tenant-row-${i}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Tenant {i + 1}
                      </p>
                      {tenants.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setTenants(prev =>
                              prev.filter(x => x.key !== t.key)
                            )
                          }
                          className="p-1 text-gray-400 hover:text-red-600"
                          aria-label={`Remove tenant ${i + 1}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="First name" error={errs.firstName}>
                        <input
                          value={t.firstName}
                          onChange={e =>
                            setTenantField(t.key, 'firstName', e.target.value)
                          }
                          className={inputClass(errs.firstName)}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Last name" error={errs.lastName}>
                        <input
                          value={t.lastName}
                          onChange={e =>
                            setTenantField(t.key, 'lastName', e.target.value)
                          }
                          className={inputClass(errs.lastName)}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Email" error={errs.email}>
                        <input
                          type="email"
                          value={t.email}
                          onChange={e =>
                            setTenantField(t.key, 'email', e.target.value)
                          }
                          className={inputClass(errs.email)}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Phone (optional)">
                        <input
                          type="tel"
                          value={t.phone}
                          onChange={e =>
                            setTenantField(t.key, 'phone', e.target.value)
                          }
                          className={inputClass(false)}
                          autoComplete="off"
                        />
                      </Field>
                    </div>
                  </div>
                )
              })}
              {tenants.length < MAX_HOUSEHOLD && (
                <button
                  type="button"
                  onClick={() => setTenants(prev => [...prev, emptyTenant()])}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
                >
                  <Plus size={15} /> Add another tenant
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <section>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Lease
                </h2>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-gray-500">Property</dt>
                  <dd className="text-gray-900">{property.title}</dd>
                  <dt className="text-gray-500">Term</dt>
                  <dd className="text-gray-900">
                    {shortDate(lease.startDate)} –{' '}
                    {lease.monthToMonth
                      ? 'Month-to-month'
                      : shortDate(lease.endDate)}
                  </dd>
                  <dt className="text-gray-500">Monthly rent</dt>
                  <dd className="text-gray-900">
                    {money(lease.monthlyRent)}
                    {tenants.length > 1 &&
                      ` · ${money(
                        Math.floor(Number(lease.monthlyRent) / tenants.length)
                      )} each`}
                  </dd>
                  <dt className="text-gray-500">Deposit held</dt>
                  <dd className="text-gray-900">
                    {money(lease.securityDeposit)}
                  </dd>
                  <dt className="text-gray-500">Signed lease</dt>
                  <dd className="text-gray-900">
                    {leaseFile ? leaseFile.name : 'Not attached'}
                  </dd>
                </dl>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Household
                </h2>
                <ul className="divide-y divide-gray-100 border-t border-b border-gray-100">
                  {tenants.map(t => (
                    <li key={t.key} className="py-2 text-sm">
                      <span className="font-medium text-gray-900">
                        {t.firstName} {t.lastName}
                      </span>
                      <span className="text-gray-500 ml-2">{t.email}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={attest}
                  onChange={e => setAttest(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  These terms match the lease my tenants signed. I understand
                  each tenant will be asked to confirm them, and that Rentra
                  keeps this as a record of the lease, not as an e-signature.
                </span>
              </label>
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  {submitError}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={step === 0 ? () => navigate(backLink) : back}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Send invites
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
