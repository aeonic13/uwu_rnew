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
} from 'lucide-react'
import { usePlaidLink } from 'react-plaid-link'
import { usePreQualification } from '../../hooks/usePreQualification'
import api from '../../services/api'

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
  const [accessToken, setAccessToken] = useState(null)
  const [error, setError] = useState(null)

  // Fetch Plaid link token
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        setPlaidStatus('loading')
        const data = await api.post('/payments/plaid/create-link-token', {
          products: ['auth', 'identity', 'income_verification'],
        })
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
      const exchangeData = await api.post('/payments/plaid/exchange-token', {
        publicToken,
        accountId: metadata?.accounts?.[0]?.id,
      })
      const token = exchangeData.accessToken
      setAccessToken(token)
      setVerifications(prev => ({
        ...prev,
        bank: {
          verified: true,
          accountName: exchangeData.accounts?.[0]?.name || 'Bank Account',
          mask: exchangeData.accounts?.[0]?.mask,
        },
      }))

      const [incomeRes, identityRes] = await Promise.allSettled([
        api.post('/payments/plaid/verify-income', { accessToken: token }),
        api.post('/payments/plaid/verify-identity', { accessToken: token }),
      ])

      setVerifications(prev => ({
        ...prev,
        income:
          incomeRes.status === 'fulfilled'
            ? {
                verified: true,
                monthlyIncome: incomeRes.value?.income?.totalMonthlyIncome || null,
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
      await api.post('/payments/application-fee', {
        plaidAccessToken: accessToken,
      })
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
  const canComplete = allVerified && feeStatus === 'paid'

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
            <p className="text-xs text-gray-500">One-time verification — applies to all listings</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Intro card */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck size={22} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Complete this once, apply anywhere</p>
            <p className="text-sm text-gray-600 mt-1">
              Pre-qualify now by verifying your income and identity and paying the
              one-time $50 screening fee. After that, you can instantly apply to any
              listing on Rentra.
            </p>
          </div>
        </div>

        {/* Fee banner */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <DollarSign size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">$50 One-Time Screening Fee</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Non-refundable. Covers bank connection, income verification, and
              identity check. Charged after a successful bank connection.
            </p>
          </div>
        </div>

        {/* Step 1: Bank Connection */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bankDone ? 'bg-green-100' : 'bg-gray-100'}`}>
                {bankDone
                  ? <CheckCircle2 size={20} className="text-green-600" />
                  : <Building2 size={18} className="text-gray-500" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">Bank Account</p>
                {bankDone
                  ? <p className="text-xs text-green-600">
                      Connected — {verifications.bank.accountName}
                      {verifications.bank.mask ? ` (...${verifications.bank.mask})` : ''}
                    </p>
                  : <p className="text-xs text-gray-400">Connect securely via Plaid</p>}
              </div>
            </div>
            {!bankDone && (
              <button
                onClick={() => openPlaid()}
                disabled={!plaidReady || plaidStatus === 'loading'}
                className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                {plaidStatus === 'loading'
                  ? <><Loader2 size={14} className="animate-spin" /> Connecting…</>
                  : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Income Verification */}
        <div className={`bg-white border rounded-xl p-4 ${!bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${incomeDone ? 'bg-green-100' : bankDone ? 'bg-brand-50' : 'bg-gray-100'}`}>
              {incomeDone
                ? <CheckCircle2 size={20} className="text-green-600" />
                : bankDone && plaidStatus === 'loading'
                  ? <Loader2 size={18} className="text-brand-500 animate-spin" />
                  : <TrendingUp size={18} className="text-gray-500" />}
            </div>
            <div>
              <p className="font-medium text-gray-900">Income Verification</p>
              {incomeDone
                ? <p className="text-xs text-green-600">
                    Verified{verifications.income.monthlyIncome ? ` — $${verifications.income.monthlyIncome.toLocaleString()}/mo` : ''}
                  </p>
                : verifications.income?.verified === false
                  ? <p className="text-xs text-yellow-600">Unable to verify — you may still proceed</p>
                  : <p className="text-xs text-gray-400">Auto-run after bank connection</p>}
            </div>
          </div>
        </div>

        {/* Step 3: Identity Check */}
        <div className={`bg-white border rounded-xl p-4 ${!bankDone ? 'opacity-40 pointer-events-none' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${identityDone ? 'bg-green-100' : bankDone ? 'bg-brand-50' : 'bg-gray-100'}`}>
              {identityDone
                ? <CheckCircle2 size={20} className="text-green-600" />
                : bankDone && plaidStatus === 'loading'
                  ? <Loader2 size={18} className="text-brand-500 animate-spin" />
                  : <Fingerprint size={18} className="text-gray-500" />}
            </div>
            <div>
              <p className="font-medium text-gray-900">Identity Check</p>
              {identityDone
                ? <p className="text-xs text-green-600">Identity verified</p>
                : verifications.identity?.verified === false
                  ? <p className="text-xs text-yellow-600">Unable to verify — you may still proceed</p>
                  : <p className="text-xs text-gray-400">Auto-run after bank connection</p>}
            </div>
          </div>
        </div>

        {/* Step 4: Pay Fee */}
        {allVerified && (
          <div className={`bg-white border rounded-xl p-4 ${feeStatus === 'paid' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${feeStatus === 'paid' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {feeStatus === 'paid'
                    ? <CheckCircle2 size={20} className="text-green-600" />
                    : <DollarSign size={18} className="text-gray-500" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Screening Fee</p>
                  {feeStatus === 'paid'
                    ? <p className="text-xs text-green-600">$50 paid — you&apos;re pre-qualified!</p>
                    : <p className="text-xs text-gray-400">$50 non-refundable</p>}
                </div>
              </div>
              {feeStatus !== 'paid' && (
                <button
                  onClick={handleChargeFee}
                  disabled={feeStatus === 'charging'}
                  className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {feeStatus === 'charging'
                    ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    : 'Pay $50'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Plaid note */}
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <p>Your banking data is handled securely by Plaid and never stored on Rentra servers.</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleComplete}
          disabled={!canComplete}
          className="w-full bg-brand-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canComplete ? '🎉 Complete Pre-Qualification' : 'Complete the steps above to continue'}
        </button>
      </div>
    </div>
  )
}
