import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import {
  ArrowLeft,
  Check,
  User,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { usePreQualification } from '../../hooks/usePreQualification'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { paymentsService } from '../../services/payments'
import { applicationsService } from '../../services/applicationsService'
import { rentalProfileService } from '../../services/rentalProfileService'
import { groupsService } from '../../services/groupsService'
import { cosignerService } from '../../services/cosignerService'
import InviteCosignerForm from '../cosigner/InviteCosignerForm'

// Verify step removed — now handled once via /pre-qualify
const STEPS = [
  { id: 'info', label: 'Your Info', icon: User },
  { id: 'dates', label: 'Dates', icon: Calendar },
  { id: 'review', label: 'Review', icon: FileText },
]

// Shown after a successful application: confirmation + cosigner status.
// If a floating pre-qual cosigner exists it was auto-attached — show that
// instead of asking the tenant to invite again.
function ApplicationSubmitted({ applicationId, onDone }) {
  const [attachedCosigner, setAttachedCosigner] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    cosignerService
      .mine()
      .then(list => {
        if (active)
          setAttachedCosigner(list.find(c => c.status !== 'declined') || null)
      })
      .catch(() => {})
      .finally(() => active && setChecked(true))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-md mx-auto p-4 pt-10 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Application submitted
          </h1>
          <p className="text-gray-600 mt-1">
            {attachedCosigner
              ? 'The landlord will review it — your co-signer is attached.'
              : 'The landlord will review it. Need a guarantor? Invite a co-signer now to speed up approval.'}
          </p>
        </div>

        {attachedCosigner ? (
          <div className="rounded-xl border bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-900">
                Co-signer attached:{' '}
                {attachedCosigner.name || attachedCosigner.email}
              </p>
              <p className="text-sm text-green-700">
                {attachedCosigner.status === 'accepted'
                  ? attachedCosigner.verifiedMonthlyIncome
                    ? `Accepted — $${Math.round(attachedCosigner.verifiedMonthlyIncome).toLocaleString()}/mo verified income shows on this application.`
                    : 'Accepted — their details show on this application.'
                  : 'Invitation pending — once they accept, their info appears on this application automatically.'}
              </p>
            </div>
          </div>
        ) : (
          checked && <InviteCosignerForm applicationId={applicationId} />
        )}

        <button
          onClick={onDone}
          className="w-full py-3 text-gray-600 font-medium"
        >
          Done — go to home
        </button>
      </div>
    </div>
  )
}

/**
 * Progress indicator
 */
function ProgressSteps({ currentStep, steps }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-between px-4 py-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? <Check size={20} /> : <Icon size={20} />}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-1 mx-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Step 1: Personal Info
 */
function InfoStep({ formData, onChange, onNext, user }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.firstName?.trim()) newErrors.firstName = 'Required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Required'
    if (!formData.email?.trim()) newErrors.email = 'Required'
    if (!formData.phone?.trim()) newErrors.phone = 'Required'
    if (!formData.emergencyContact?.trim())
      newErrors.emergencyContact = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (validate()) onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Personal Information</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={e => onChange({ firstName: e.target.value })}
            className={`w-full p-3 border rounded-lg ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={e => onChange({ lastName: e.target.value })}
            className={`w-full p-3 border rounded-lg ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={e => onChange({ email: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={e => onChange({ phone: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contact
        </label>
        <input
          type="text"
          value={formData.emergencyContact || ''}
          onChange={e => onChange({ emergencyContact: e.target.value })}
          placeholder="Name and phone number"
          className={`w-full p-3 border rounded-lg ${errors.emergencyContact ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employment Status (Optional)
        </label>
        <input
          type="text"
          value={formData.employmentStatus || ''}
          onChange={e => onChange({ employmentStatus: e.target.value })}
          placeholder="e.g. Part-time + financial aid"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          References (Optional)
        </label>
        <textarea
          value={formData.references || ''}
          onChange={e => onChange({ references: e.target.value })}
          rows={2}
          placeholder="One per line, e.g. Prof. Johnson - USC"
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message to Owner (Optional)
        </label>
        <textarea
          value={formData.message || ''}
          onChange={e => onChange({ message: e.target.value })}
          rows={3}
          placeholder="Introduce yourself..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
      >
        Continue
      </button>
    </form>
  )
}

/**
 * Step 2: Dates
 */
function DatesStep({ formData, onChange, onNext, onBack, listing }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.moveInDate) newErrors.moveInDate = 'Required'
    if (!formData.moveOutDate) newErrors.moveOutDate = 'Required'
    if (formData.moveInDate && formData.moveOutDate) {
      if (new Date(formData.moveOutDate) <= new Date(formData.moveInDate)) {
        newErrors.moveOutDate = 'Must be after move-in date'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (validate()) onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Select Dates</h2>

      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-brand-600">
          Available: {listing?.dates || 'Contact owner for availability'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Move-in Date
        </label>
        <input
          type="date"
          value={formData.moveInDate || ''}
          onChange={e => onChange({ moveInDate: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.moveInDate ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.moveInDate && (
          <p className="text-red-500 text-xs mt-1">{errors.moveInDate}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Move-out Date
        </label>
        <input
          type="date"
          value={formData.moveOutDate || ''}
          onChange={e => onChange({ moveOutDate: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.moveOutDate ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.moveOutDate && (
          <p className="text-red-500 text-xs mt-1">{errors.moveOutDate}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  )
}

/**
 * Step 3: Plaid Verification + $50 Application Fee
 */
function VerifyStep({ listingId, onNext, onBack, onVerificationComplete }) {
  const [linkToken, setLinkToken] = useState(null)
  const [plaidStatus, setPlaidStatus] = useState('idle') // idle | loading | connected | error
  const [verifications, setVerifications] = useState({
    bank: null,
    income: null,
    identity: null,
  })
  const [feeStatus, setFeeStatus] = useState('unpaid') // unpaid | charging | paid | error
  const [accessToken, setAccessToken] = useState(null)
  const [error, setError] = useState(null)

  // Fetch Plaid link token on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        setPlaidStatus('loading')
        const data = await paymentsService.createPlaidLinkToken()
        setLinkToken(data.linkToken)
        setPlaidStatus('idle')
      } catch (err) {
        console.error('Failed to get link token:', err)
        setPlaidStatus('error')
        setError('Could not initialize bank verification. Please try again.')
      }
    }
    fetchLinkToken()
  }, [])

  const onPlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      setPlaidStatus('loading')
      setError(null)
      try {
        // Exchange public token
        const exchangeData = await paymentsService.exchangePlaidToken(
          publicToken,
          metadata?.accounts?.[0]?.id
        )
        // Token is stored server-side; verify endpoints look it up.
        setAccessToken(true)
        setVerifications(prev => ({
          ...prev,
          bank: {
            verified: true,
            accountName: exchangeData.accounts?.[0]?.name || 'Bank Account',
            mask: exchangeData.accounts?.[0]?.mask,
          },
        }))

        // Run income + identity in parallel
        const [incomeRes, identityRes] = await Promise.allSettled([
          paymentsService.verifyIncome(),
          paymentsService.verifyIdentity(),
        ])

        setVerifications(prev => ({
          ...prev,
          income:
            incomeRes.status === 'fulfilled'
              ? {
                  verified: true,
                  monthlyIncome:
                    incomeRes.value?.income?.totalMonthlyIncome || null,
                }
              : { verified: false },
          identity:
            identityRes.status === 'fulfilled'
              ? { verified: true }
              : { verified: false },
        }))

        setPlaidStatus('connected')
        onVerificationComplete?.(true, {
          income:
            incomeRes.status === 'fulfilled' ? incomeRes.value?.income : null,
          identity:
            identityRes.status === 'fulfilled' ? identityRes.value : null,
        })
      } catch (err) {
        console.error('Plaid verification error:', err)
        setPlaidStatus('error')
        setError('Verification failed. Please try again.')
      }
    },
    [onVerificationComplete]
  )

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      if (plaidStatus === 'loading') setPlaidStatus('idle')
    },
  })

  const handleChargeFee = async () => {
    setFeeStatus('charging')
    setError(null)
    try {
      await paymentsService.chargeApplicationFee(listingId)
      setFeeStatus('paid')
    } catch (err) {
      setFeeStatus('error')
      setError('Failed to process application fee. Please try again.')
    }
  }

  const bankDone = verifications.bank?.verified
  const incomeDone = verifications.income?.verified
  const identityDone = verifications.identity?.verified
  const allVerified = bankDone && (incomeDone || identityDone)
  const canProceed = allVerified && feeStatus === 'paid'

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Verify Your Application</h2>
        <p className="text-sm text-gray-500">
          Connect your bank to verify income and identity. A non-refundable $50
          application fee is required.
        </p>
      </div>

      {/* $50 Fee Banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
        <DollarSign size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">$50 Application Fee</p>
          <p className="text-sm text-brand-600 mt-0.5">
            Non-refundable. Covers bank connection, income verification, and
            identity check. Charged after successful bank connection.
          </p>
        </div>
      </div>

      {/* Step 1: Bank Connection */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                bankDone ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {bankDone ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <Building2 size={18} className="text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Bank Account</p>
              {bankDone ? (
                <p className="text-xs text-green-600">
                  Connected — {verifications.bank.accountName}
                  {verifications.bank.mask
                    ? ` (...${verifications.bank.mask})`
                    : ''}
                </p>
              ) : (
                <p className="text-xs text-gray-400">Connect via Plaid</p>
              )}
            </div>
          </div>
          {!bankDone && (
            <button
              onClick={() => openPlaid()}
              disabled={!plaidReady || plaidStatus === 'loading'}
              className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              {plaidStatus === 'loading' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Connecting…
                </>
              ) : (
                'Connect'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Income Verification */}
      <div
        className={`bg-white border rounded-xl p-4 ${
          !bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              incomeDone
                ? 'bg-green-100'
                : bankDone
                  ? 'bg-brand-50'
                  : 'bg-gray-100'
            }`}
          >
            {incomeDone ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : bankDone && plaidStatus === 'loading' ? (
              <Loader2 size={18} className="text-brand-500 animate-spin" />
            ) : (
              <TrendingUp size={18} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">Income Verification</p>
            {incomeDone ? (
              <p className="text-xs text-green-600">
                Verified
                {verifications.income.monthlyIncome
                  ? ` — $${verifications.income.monthlyIncome.toLocaleString()}/mo`
                  : ''}
              </p>
            ) : verifications.income?.verified === false ? (
              <p className="text-xs text-yellow-600">
                Unable to verify — you may still proceed
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Auto-run after bank connection
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Identity Check */}
      <div
        className={`bg-white border rounded-xl p-4 ${
          !bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              identityDone
                ? 'bg-green-100'
                : bankDone
                  ? 'bg-brand-50'
                  : 'bg-gray-100'
            }`}
          >
            {identityDone ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : bankDone && plaidStatus === 'loading' ? (
              <Loader2 size={18} className="text-brand-500 animate-spin" />
            ) : (
              <Fingerprint size={18} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">Identity Check</p>
            {identityDone ? (
              <p className="text-xs text-green-600">Identity verified</p>
            ) : verifications.identity?.verified === false ? (
              <p className="text-xs text-yellow-600">
                Unable to verify — you may still proceed
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Auto-run after bank connection
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step 4: Charge Fee */}
      {allVerified && (
        <div
          className={`bg-white border rounded-xl p-4 ${
            feeStatus === 'paid'
              ? 'border-green-200 bg-green-50'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  feeStatus === 'paid' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                {feeStatus === 'paid' ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <DollarSign size={18} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Application Fee</p>
                {feeStatus === 'paid' ? (
                  <p className="text-xs text-green-600">
                    $50 charged successfully
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    $50 non-refundable fee
                  </p>
                )}
              </div>
            </div>
            {feeStatus !== 'paid' && (
              <button
                onClick={handleChargeFee}
                disabled={feeStatus === 'charging'}
                className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                {feeStatus === 'charging' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Charging…
                  </>
                ) : (
                  'Pay $50'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle
            size={16}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-gray-400">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <p>
          Your banking data is securely handled by Plaid and never stored on
          Rentra servers.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/**
 * Step 4: Payment
 */
function PaymentStep({ formData, onChange, onNext, onBack, listing }) {
  const serviceFee = Math.round((listing?.price || 0) * 0.03)
  const total = (listing?.price || 0) + serviceFee

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Payment Details</h2>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span>First Month&apos;s Rent</span>
          <span className="font-medium">${listing?.price || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Fee</span>
          <span className="font-medium">${serviceFee}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold">Due Now</span>
          <span className="font-bold text-lg">${total}</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle
            className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5\"
            size={18}
          />
          <p className="text-sm text-yellow-700">
            Security deposit of ${(listing?.price || 0) * 2} will be due before
            move-in.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <select
          value={formData.paymentMethod || ''}
          onChange={e => onChange({ paymentMethod: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select payment method</option>
          <option value="card">Credit/Debit Card</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      {formData.paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.paymentMethod}
          className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/**
 * Step 4: Review
 */
function ReviewStep({
  formData,
  onBack,
  onSubmit,
  listing,
  isSubmitting,
  groups = [],
  selectedGroupId = null,
  onSelectGroup,
}) {
  const serviceFee = Math.round((listing?.price || 0) * 0.03)
  const total = (listing?.price || 0) + serviceFee

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Review Application</h2>

      {/* Property Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Property</h3>
        <div className="flex items-center">
          <img
            src={listing?.images?.[0] || 'https://via.placeholder.com/80'}
            alt={listing?.title}
            className="w-16 h-16 rounded-lg object-cover mr-3"
          />
          <div>
            <p className="font-medium">{listing?.title}</p>
            <p className="text-sm text-gray-500">{listing?.location}</p>
            <p className="text-green-600 font-semibold">${listing?.price}/mo</p>
          </div>
        </div>
      </div>

      {/* Applicant Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Your Information</h3>
        <p>
          {formData.firstName} {formData.lastName}
        </p>
        <p className="text-sm text-gray-500">{formData.email}</p>
        <p className="text-sm text-gray-500">{formData.phone}</p>
      </div>

      {/* Dates */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Dates</h3>
        <p>Move-in: {formData.moveInDate}</p>
        <p>Move-out: {formData.moveOutDate}</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>First Month&apos;s Rent</span>
            <span>${listing?.price || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Fee</span>
            <span>${serviceFee}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Due Now</span>
            <span>${total}</span>
          </div>
        </div>
      </div>

      {/* Apply solo or as a roommate group */}
      {groups.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-1">Apply as</h3>
          <p className="text-xs text-gray-500 mb-3">
            Applying as a group submits an application for every member, so the
            landlord reviews you together.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectGroup?.(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                selectedGroupId === null
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Just me
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGroup?.(g.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                  selectedGroupId === g.id
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {g.name} (
                {(g.members || []).filter(m => m.status === 'active').length}{' '}
                members)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="text-sm text-gray-500">
        By submitting, you agree to our Terms of Service and Privacy Policy.
        Payment will be processed once the owner approves your application.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

/**
 * Application Flow - Multi-step application
 */
function ApplicationFlow() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { getListingById, selectedListing, isLoading } = useListings()
  const { user } = useAuth()
  const { isPreQualified, preQualData } = usePreQualification()

  // Guard: must be pre-qualified before applying
  useEffect(() => {
    if (!isPreQualified) {
      navigate(`/pre-qualify?returnTo=/apply/${listingId}`, { replace: true })
    }
  }, [isPreQualified, listingId, navigate])

  const [currentStep, setCurrentStep] = useState('info')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergencyContact: '',
    employmentStatus: '',
    references: '',
    message: '',
    moveInDate: '',
    moveOutDate: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedAppId, setSubmittedAppId] = useState(null)
  const [rentalProfile, setRentalProfile] = useState(null)
  // Roommate groups the tenant belongs to — enables "apply as a group"
  // (one application per member, reviewed together by the landlord).
  const [myGroups, setMyGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)

  useEffect(() => {
    let active = true
    groupsService
      .listMy()
      .then(groups => {
        if (active) setMyGroups(groups)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Prefill from the universal rental application saved at pre-qualification
  // (the whole point: answer once, apply anywhere). Never overwrites what the
  // user already typed.
  useEffect(() => {
    let active = true
    rentalProfileService
      .get()
      .then(p => {
        if (!active || !p) return
        setRentalProfile(p)
        const emergency = [
          p.emergencyName,
          p.emergencyRelation,
          p.emergencyPhone,
        ]
          .filter(Boolean)
          .join(' — ')
        const employment = [p.jobTitle, p.employer].filter(Boolean).join(' at ')
        const refs = [
          [p.reference1Name, p.reference1Relation, p.reference1Phone]
            .filter(Boolean)
            .join(' — '),
          [p.reference2Name, p.reference2Relation, p.reference2Phone]
            .filter(Boolean)
            .join(' — '),
        ]
          .filter(Boolean)
          .join('\n')

        setFormData(prev => ({
          ...prev,
          emergencyContact: prev.emergencyContact || emergency,
          employmentStatus: prev.employmentStatus || employment,
          references: prev.references || refs,
        }))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (listingId) {
      getListingById(listingId)
    }
  }, [listingId, getListingById])

  const handleChange = updates => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id)
    }
  }

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Group application: one application per member, linked by groupId.
      if (selectedGroupId) {
        const res = await applicationsService.submitGroupApplication({
          groupId: selectedGroupId,
          listingId,
          startDate: formData.moveInDate,
          endDate: formData.moveOutDate,
          message: formData.message,
        })
        const mine = (res?.applications || []).find(
          a => a.applicantId === user?.id
        )
        if (mine?.id) {
          setSubmittedAppId(mine.id)
        } else {
          navigate('/')
        }
        return
      }
      // Attach pre-qualification data so landlords can see it was verified,
      // plus the universal rental application answers (residence history,
      // employment, disclosures) filled once at pre-qualification.
      const verificationData =
        preQualData || rentalProfile
          ? {
              ...(preQualData && {
                preQualified: true,
                preQualifiedAt: preQualData.completedAt,
                bankConnected: !!preQualData.verifications?.bank?.verified,
                incomeVerified: !!preQualData.verifications?.income?.verified,
                monthlyIncome:
                  preQualData.verifications?.income?.monthlyIncome || null,
                identityVerified:
                  !!preQualData.verifications?.identity?.verified,
                applicationFeePaid: true,
              }),
              ...(rentalProfile && { rentalProfile }),
            }
          : null
      const res = await applicationsService.submitApplication({
        listingId,
        startDate: formData.moveInDate,
        endDate: formData.moveOutDate,
        message: formData.message,
        emergencyContact: formData.emergencyContact,
        employmentStatus: formData.employmentStatus,
        references: (formData.references || '')
          .split('\n')
          .map(r => r.trim())
          .filter(Boolean),
        ...(verificationData && { verificationData }),
      })
      // Show the success screen (with cosigner invite) if we got an id back.
      if (res?.application?.id) {
        setSubmittedAppId(res.application.id)
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('Application submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (submittedAppId) {
    return (
      <ApplicationSubmitted
        applicationId={submittedAppId}
        onDone={() => navigate('/')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Apply for Rental</h1>
        </div>
        <ProgressSteps currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Step Content */}
      {currentStep === 'info' && (
        <InfoStep
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          user={user}
        />
      )}
      {currentStep === 'dates' && (
        <DatesStep
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          listing={selectedListing}
        />
      )}
      {currentStep === 'review' && (
        <ReviewStep
          formData={formData}
          onBack={handleBack}
          onSubmit={handleSubmit}
          groups={myGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          listing={selectedListing}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

export default ApplicationFlow
