import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  TrendingUp,
  Fingerprint,
  DollarSign,
  Loader2,
  AlertCircle,
  Info,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react'
import { usePlaidLink } from 'react-plaid-link'
import { usePreQualification } from '../../hooks/usePreQualification'
import { paymentsService } from '../../services/payments'
import { cosignerService } from '../../services/cosignerService'
import RentalProfileForm from './RentalProfileForm'
import InviteCosignerForm from '../cosigner/InviteCosignerForm'
import ResendCosignerInvite, {
  inviteExpired,
} from '../cosigner/ResendCosignerInvite'

/**
 * Standalone Pre-Qualification Flow
 *
 * Tenants complete this ONCE. It covers:
 *   1. Bank account connection (Plaid)
 *   2. Income verification (auto-run)
 *   3. Identity check (auto-run)
 *   4. $50 non-refundable application fee
 *
 * On completion the status is stored in localStorage so the user can
 * apply to any listing without repeating the process.
 */
export default function PreQualificationFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/listings'
  const { isPreQualified, completePreQual } = usePreQualification()

  // If already pre-qualified, skip straight to where they came from
  useEffect(() => {
    if (isPreQualified) navigate(returnTo, { replace: true })
  }, [isPreQualified, navigate, returnTo])

  const [linkToken, setLinkToken] = useState(null)
  const [plaidStatus, setPlaidStatus] = useState('idle')
  const [verifications, setVerifications] = useState({
    bank: null,
    income: null,
    identity: null,
  })
  const [feeStatus, setFeeStatus] = useState('unpaid')
  const [error, setError] = useState(null)
  // The universal rental application (residence, employment, references,
  // disclosures) — saved once here, reused to prefill every application.
  const [profileDone, setProfileDone] = useState(false)
  const [profileOpen, setProfileOpen] = useState(true)
  // Optional floating cosigner (auto-attaches to every future application).
  const [myCosigner, setMyCosigner] = useState(null)
  const [cosignerOpen, setCosignerOpen] = useState(false)

  useEffect(() => {
    let active = true
    cosignerService
      .mine()
      .then(list => {
        if (active)
          setMyCosigner(list.find(c => c.status !== 'declined') || null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Fetch Plaid link token
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

  const onPlaidSuccess = useCallback(async (publicToken, metadata) => {
    setPlaidStatus('loading')
    setError(null)
    try {
      const exchangeData = await paymentsService.exchangePlaidToken(
        publicToken,
        metadata?.accounts?.[0]?.id
      )
      // The access token is stored server-side; verify endpoints look it
      // up from the authenticated user.
      setVerifications(prev => ({
        ...prev,
        bank: {
          verified: true,
          accountName: exchangeData.accounts?.[0]?.name || 'Bank Account',
          mask: exchangeData.accounts?.[0]?.mask,
        },
      }))

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
    } catch (err) {
      console.error('Plaid verification error:', err)
      setPlaidStatus('error')
      setError('Verification failed. Please try again.')
    }
  }, [])

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
      await paymentsService.chargeApplicationFee()
      setFeeStatus('paid')
    } catch (err) {
      setFeeStatus('error')
      setError('Failed to process application fee. Please try again.')
    }
  }

  const handleComplete = () => {
    completePreQual(verifications)
    navigate(returnTo)
  }

  const bankDone = verifications.bank?.verified
  const incomeDone = verifications.income?.verified
  const identityDone = verifications.identity?.verified
  const allVerified = bankDone && (incomeDone || identityDone)
  const canComplete = profileDone && allVerified && feeStatus === 'paid'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Get Pre-Qualified</h1>
            <p className="text-xs text-gray-500">
              One-time verification — applies to all listings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Intro card */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="text-brand-500 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-semibold text-gray-900">
              Complete this once, apply anywhere
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Every landlord&apos;s rental application asks the same questions.
              Answer them once here, verify your income and identity, pay the
              one-time $50 screening fee — and every application on Rentra is
              prefilled from your profile.
            </p>
          </div>
        </div>

        {/* Fee banner */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <DollarSign
            size={20}
            className="text-brand-500 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-semibold text-gray-900">
              $50 One-Time Screening Fee
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Non-refundable. Covers bank connection, income verification, and
              identity check. Charged after a successful bank connection.
            </p>
          </div>
        </div>

        {/* Step 1: Universal rental application */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <button
            onClick={() => setProfileOpen(open => !open)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${profileDone ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                {profileDone ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <ClipboardList size={18} className="text-gray-500" />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Rental Application</p>
                <p
                  className={`text-xs ${profileDone ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {profileDone
                    ? 'Saved — prefills every application'
                    : 'The standard questions every landlord asks, once'}
                </p>
              </div>
            </div>
            <span className="text-xs text-brand-500 font-medium">
              {profileOpen ? 'Hide' : profileDone ? 'Edit' : 'Fill out'}
            </span>
          </button>
          {profileOpen && (
            <div className="mt-4 border-t pt-4">
              <RentalProfileForm
                onSaved={() => {
                  setProfileDone(true)
                  setProfileOpen(false)
                }}
              />
            </div>
          )}
        </div>

        {/* Optional: invite a co-signer once — attaches to every application */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <button
            onClick={() => setCosignerOpen(open => !open)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${myCosigner ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                {myCosigner ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <ShieldCheck size={18} className="text-gray-500" />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  Co-signer{' '}
                  <span className="text-xs text-gray-400 font-normal">
                    (optional)
                  </span>
                </p>
                {myCosigner ? (
                  <p className="text-xs text-green-600">
                    {myCosigner.name || myCosigner.email} —{' '}
                    {myCosigner.status === 'accepted'
                      ? myCosigner.verifiedMonthlyIncome
                        ? `accepted, $${Math.round(myCosigner.verifiedMonthlyIncome).toLocaleString()}/mo verified`
                        : 'accepted'
                      : inviteExpired(myCosigner.expiresAt)
                        ? 'invite link expired'
                        : 'invited'}{' '}
                    · attaches to every application
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Invite a guarantor once — they attach to every application
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-brand-500 font-medium">
              {cosignerOpen ? 'Hide' : myCosigner ? 'View' : 'Invite'}
            </span>
          </button>
          {cosignerOpen && !myCosigner && (
            <div className="mt-4 border-t pt-4">
              <InviteCosignerForm
                onInvited={email => {
                  setMyCosigner({ email, status: 'pending' })
                }}
              />
            </div>
          )}
          {cosignerOpen &&
            myCosigner?.status === 'pending' &&
            myCosigner.id && (
              <div className="mt-4 border-t pt-4">
                <ResendCosignerInvite
                  cosignerId={myCosigner.id}
                  expiresAt={myCosigner.expiresAt}
                  onResent={c =>
                    c &&
                    setMyCosigner(prev => ({ ...prev, expiresAt: c.expiresAt }))
                  }
                />
              </div>
            )}
        </div>

        {/* Step 2: Bank Connection */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${bankDone ? 'bg-green-100' : 'bg-gray-100'}`}
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
                  <p className="text-xs text-gray-400">
                    Connect securely via Plaid
                  </p>
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
          className={`bg-white border rounded-xl p-4 ${!bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${incomeDone ? 'bg-green-100' : bankDone ? 'bg-brand-50' : 'bg-gray-100'}`}
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
          className={`bg-white border rounded-xl p-4 ${!bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${identityDone ? 'bg-green-100' : bankDone ? 'bg-brand-50' : 'bg-gray-100'}`}
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

        {/* Step 4: Pay Fee */}
        {allVerified && (
          <div
            className={`bg-white border rounded-xl p-4 ${feeStatus === 'paid' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${feeStatus === 'paid' ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  {feeStatus === 'paid' ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : (
                    <DollarSign size={18} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Screening Fee</p>
                  {feeStatus === 'paid' ? (
                    <p className="text-xs text-green-600">
                      $50 paid — you&apos;re pre-qualified!
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">$50 non-refundable</p>
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
                      <Loader2 size={14} className="animate-spin" /> Processing…
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

        {/* Plaid note */}
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <p>
            Your banking data is handled securely by Plaid and never stored on
            Rentra servers.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleComplete}
          disabled={!canComplete}
          className="w-full bg-brand-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canComplete
            ? '🎉 Complete Pre-Qualification'
            : 'Complete the steps above to continue'}
        </button>
      </div>
    </div>
  )
}
