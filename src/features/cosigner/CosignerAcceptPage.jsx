import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Shield,
  Home,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cosignerService } from '../../services/cosignerService'
import CosignerIncomeStep from './CosignerIncomeStep'

/**
 * Public page reached from the cosigner invitation email:
 *   /cosigner/accept/:token
 * Fetches the invitation, then lets the cosigner create an account and
 * accept (or decline). On accept, stores the returned session and reloads
 * into the app as the new cosigner.
 */
export default function CosignerAcceptPage() {
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [declined, setDeclined] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    let active = true
    cosignerService
      .getInvitation(token)
      .then(inv => {
        if (active) setInvitation(inv)
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

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleAccept = async e => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await cosignerService.accept(token, {
        email: invitation.email,
        ...form,
      })
      // Establish the session, then move to the income-verification step.
      // The api client reads authToken from localStorage on each request, so
      // the authenticated Plaid calls work without a full reload.
      if (result?.token) {
        localStorage.setItem('authToken', result.token)
      }
      setAccepted(true)
    } catch (err) {
      setSubmitError(err.message || 'Could not accept the invitation')
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await cosignerService.decline(token)
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
          You&apos;ve declined to co-sign for {invitation.tenant.firstName}. You
          can close this page.
        </p>
      </CenteredCard>
    )
  }

  if (accepted) {
    return <CosignerIncomeStep onDone={() => window.location.assign('/')} />
  }

  const { tenant, listing } = invitation

  return (
    <CenteredCard wide>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Co-sign for {tenant.firstName} {tenant.lastName}
        </h1>
        <p className="text-gray-600 mt-1">
          {tenant.firstName} invited you to be a guarantor on their rental
          application.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
        {listing ? (
          <>
            <div className="flex items-center text-gray-700">
              <Home className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">{listing.title}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2 text-gray-400" />$
              {listing.price?.toLocaleString()}/mo
              {invitation.relationshipType ? (
                <span className="ml-2 text-gray-400">
                  · {invitation.relationshipType}
                </span>
              ) : null}
            </div>
            {invitation.leaseStart && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {new Date(invitation.leaseStart).toLocaleDateString()} –{' '}
                {invitation.leaseEnd
                  ? new Date(invitation.leaseEnd).toLocaleDateString()
                  : 'TBD'}
              </div>
            )}
          </>
        ) : (
          // Floating pre-qualification invite: no specific property yet.
          <div className="flex items-center text-gray-700">
            <Home className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              You&apos;ll back {tenant.firstName}&apos;s rental applications on
              Rentra — your verified income attaches to each one they submit.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleAccept} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your email
          </label>
          <div className="flex items-center px-3 py-2.5 bg-gray-100 rounded-lg text-gray-600">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            {invitation.email}
          </div>
        </div>

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
          required
          minLength={8}
        />

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
          ) : (
            'Accept & Create Account'
          )}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={submitting}
          className="w-full py-2.5 text-gray-500 rounded-lg font-medium disabled:opacity-60"
        >
          Decline invitation
        </button>
      </form>
    </CenteredCard>
  )
}

function CenteredCard({ children, wide }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div
        className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} bg-white rounded-2xl shadow-sm border p-6 text-center`}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div className="text-left">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
      />
    </div>
  )
}
