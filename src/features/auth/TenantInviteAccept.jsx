import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Home,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { tenantInvitesService } from '../../services/tenantInvitesService'
import { useAuth } from '../../contexts/AuthContext'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'

function leaseDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const money = n => `$${Math.round(Number(n) || 0).toLocaleString()}`

/**
 * Public page reached from the tenant invitation email:
 *   /tenant-invite/:token
 * Shows the lease the landlord recorded, creates or links the tenant's
 * account, and records their confirmation that the terms match the lease
 * they signed. On success, stores the session and reloads into the tenant
 * dashboard.
 */
export default function TenantInviteAccept() {
  const { token } = useParams()
  const { user: currentUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    signatureName: '',
    acceptedTerms: false,
    confirm: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    let active = true
    tenantInvitesService
      .getInvitation(token)
      .then(inv => {
        if (!active) return
        setInvitation(inv)
        setForm(prev => ({
          ...prev,
          firstName: inv.firstName || '',
          lastName: inv.lastName || '',
          phone: inv.phone || '',
          signatureName: `${inv.firstName || ''} ${inv.lastName || ''}`.trim(),
        }))
      })
      .catch(err => {
        if (active) setLoadError(err.message || 'Invitation not found')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const handleChange = e => {
    const { name, type, value, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const signedInAsInvitee = Boolean(
    currentUser &&
      invitation &&
      currentUser.email?.toLowerCase() === invitation.email?.toLowerCase()
  )
  const hasAccount = Boolean(invitation?.hasAccount)
  const wrongAccountType =
    hasAccount && invitation.accountType && invitation.accountType !== 'student'

  const handleAccept = async e => {
    e.preventDefault()
    setSubmitError(null)
    if (!form.confirm || !form.signatureName.trim()) {
      setSubmitError(
        'Type your name and confirm that these are the terms of the lease you signed.'
      )
      return
    }
    setSubmitting(true)
    try {
      const base = {
        confirm: true,
        signatureName: form.signatureName.trim(),
      }
      const payload = hasAccount
        ? signedInAsInvitee
          ? base
          : { ...base, password: form.password }
        : {
            ...base,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim() || undefined,
            password: form.password,
            acceptedTerms: form.acceptedTerms,
          }
      const result = await tenantInvitesService.accept(token, payload)
      if (result?.token) {
        localStorage.setItem('authToken', result.token)
      }
      // Reload so the auth context picks up the (possibly new) session and
      // land on the tenant dashboard, where Pay Rent and the lease live.
      window.location.assign('/profile/tenant-dashboard')
    } catch (err) {
      setSubmitError(err.message || 'Could not accept the invitation')
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (
      !window.confirm(
        'Decline this invitation? Your landlord will be told and can resend it if this was a mistake.'
      )
    ) {
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await tenantInvitesService.decline(token)
      setDeclined(true)
    } catch (err) {
      setSubmitError(err.message || 'Could not decline the invitation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <CenteredCard>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Invitation unavailable
        </h1>
        <p className="text-gray-600 mb-6">{loadError}</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium"
        >
          Go to Rentra
        </Link>
      </CenteredCard>
    )
  }

  if (declined) {
    return (
      <CenteredCard>
        <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Invitation declined
        </h1>
        <p className="text-gray-600">
          {invitation.landlord.name} has been told. You can close this page.
        </p>
      </CenteredCard>
    )
  }

  const { listing, lease, landlord, housemates } = invitation
  const address = listing.streetAddress || listing.location

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-brand-600 tracking-wide uppercase">
            Rentra
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {landlord.name} added you as a tenant
          </h1>
          <p className="text-gray-600 mt-1">
            Confirm the lease below to pay rent, split it with housemates and
            send maintenance requests from your Rentra account.
          </p>
        </div>

        {/* Property + lease facts */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-5">
          <img
            src={listing.image || PLACEHOLDER_IMAGE}
            alt={listing.title}
            className="w-full h-40 object-cover"
          />
          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-start gap-2 text-gray-800">
              <Home className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-gray-600">{address}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              {lease.monthToMonth
                ? `Month-to-month since ${leaseDate(lease.startDate)}`
                : `${leaseDate(lease.startDate)} – ${leaseDate(lease.endDate)}`}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-4 h-4 text-gray-400" />
              {money(lease.monthlyRent)}/mo
              {lease.householdSize > 1 && (
                <span className="text-gray-500">
                  · your share {money(lease.share)}, split {lease.householdSize}{' '}
                  ways
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              Deposit on file: {money(lease.securityDeposit)}
            </div>
            {housemates.length > 0 && (
              <div className="flex items-start gap-2 text-gray-700">
                <Users className="w-4 h-4 mt-0.5 text-gray-400" />
                <p>
                  Also on the lease:{' '}
                  {housemates
                    .map(h => `${h.name}${h.confirmed ? ' (confirmed)' : ''}`)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {wrongAccountType ? (
          <div className="bg-white rounded-2xl border p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900">
              This email belongs to a{' '}
              {invitation.accountType === 'owner' ? 'landlord' : 'co-signer'}{' '}
              account
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Tenants need a tenant account. Ask {landlord.name} to resend the
              invitation to a different email address.
            </p>
            <button
              type="button"
              onClick={handleDecline}
              disabled={submitting}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Decline this invitation
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleAccept}
            className="bg-white rounded-2xl border p-6 space-y-4"
          >
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Your email
              </span>
              <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-600 text-sm">
                {invitation.email}
              </div>
            </div>

            {hasAccount ? (
              signedInAsInvitee ? (
                <p className="text-sm text-gray-700 bg-brand-50 rounded-lg p-3">
                  You&apos;re signed in as {currentUser.firstName}. Confirming
                  adds this lease to your account.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-700 bg-brand-50 rounded-lg p-3">
                    This email already has a Rentra account. Enter its password
                    to add the lease to that account.
                  </p>
                  <Field
                    label="Your Rentra password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />
                </>
              )
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="First name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                  <Field
                    label="Last name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Field
                  label="Phone (optional)"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                />
                <Field
                  label="Create a password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <label className="flex items-start gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={form.acceptedTerms}
                    onChange={handleChange}
                    className="mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    required
                  />
                  <span>
                    I agree to Rentra&apos;s{' '}
                    <a
                      href="/legal/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 underline"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 underline"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <Field
                label="Type your full name to confirm"
                name="signatureName"
                value={form.signatureName}
                onChange={handleChange}
                required
              />
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="confirm"
                  checked={form.confirm}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  required
                />
                <span>
                  These are the terms of the lease I signed with {landlord.name}
                  . I understand this confirms Rentra&apos;s record of the lease
                  and is not an electronic signature of it.
                </span>
              </label>
            </div>

            {submitError && (
              <div className="flex items-start text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : hasAccount ? (
                'Confirm lease'
              ) : (
                'Create account & confirm lease'
              )}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={submitting}
              className="w-full py-2.5 text-gray-500 rounded-lg font-medium disabled:opacity-60"
            >
              This isn&apos;t right — decline
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function CenteredCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-6 text-center">
        {children}
      </div>
    </div>
  )
}

CenteredCard.propTypes = { children: PropTypes.node }

function Field({ label, ...props }) {
  const id = useId()
  return (
    <div className="text-left">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
      />
    </div>
  )
}

Field.propTypes = { label: PropTypes.string.isRequired }
