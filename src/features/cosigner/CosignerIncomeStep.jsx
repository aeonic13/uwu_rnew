import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { usePlaidLink } from 'react-plaid-link'
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { paymentsService } from '../../services/payments'
import { cosignerService } from '../../services/cosignerService'

/**
 * Post-accept step for a cosigner: verify income via Plaid so the landlord
 * sees a real income pass/fail. Reuses the existing /payments/plaid flow,
 * then persists the result to the cosigner record. Income verification is
 * optional — the cosigner can skip and verify later.
 */
export default function CosignerIncomeStep({ onDone }) {
  const [linkToken, setLinkToken] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [income, setIncome] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    paymentsService
      .createPlaidLinkToken(['auth', 'income_verification'])
      .then(data => {
        if (active) setLinkToken(data.linkToken)
      })
      .catch(() => {
        if (active) setError('Could not start income verification.')
      })
    return () => {
      active = false
    }
  }, [])

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setStatus('loading')
    setError(null)
    try {
      // Exchange stores the access token server-side; verify-income looks
      // it up from the authenticated user.
      await paymentsService.exchangePlaidToken(
        publicToken,
        metadata?.accounts?.[0]?.id
      )
      const incomeRes = await paymentsService.verifyIncome()
      const monthlyIncome = incomeRes?.income?.totalMonthlyIncome || 0
      await cosignerService.verifyIncome(monthlyIncome)
      setIncome(monthlyIncome)
      setStatus('done')
    } catch (err) {
      console.error('Cosigner income verification error:', err)
      setStatus('error')
      setError('Verification failed. Please try again.')
    }
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => {},
  })

  if (status === 'done') {
    return (
      <Card>
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Income verified
        </h1>
        <p className="text-gray-600 mb-6">
          {income
            ? `$${income.toLocaleString()}/mo verified. The landlord can now see you qualify.`
            : 'Your income has been recorded.'}
        </p>
        <button
          onClick={onDone}
          className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold"
        >
          Continue
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
        <Shield className="w-7 h-7 text-brand-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        Verify your income
      </h1>
      <p className="text-gray-600 mb-6">
        Connect your bank to instantly verify income — no pay stubs. This is how
        the landlord confirms you qualify as a guarantor.
      </p>

      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4 text-left">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={() => open()}
        disabled={!ready || status === 'loading'}
        className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center"
      >
        {status === 'loading' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Verify income with bank'
        )}
      </button>
      <button
        onClick={onDone}
        disabled={status === 'loading'}
        className="w-full py-2.5 text-gray-500 rounded-lg font-medium disabled:opacity-60"
      >
        Skip for now
      </button>
    </Card>
  )
}

CosignerIncomeStep.propTypes = {
  onDone: PropTypes.func.isRequired,
}

function Card({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-6 text-center">
        {children}
      </div>
    </div>
  )
}
