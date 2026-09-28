import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { legalService } from '../../services/legalService'

const LABELS = { terms: 'Terms of Service', privacy: 'Privacy Policy' }
const PATHS = { terms: '/terms', privacy: '/privacy' }

/**
 * Asks a signed-in user to accept the current Terms / Privacy Policy when
 * they never have (accounts from before the consent trail existed) or when
 * the published version changed. Explicit acceptance is recorded with the
 * version, instead of relying on "continued use".
 */
export default function PolicyUpdateBanner() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [state, setState] = useState('idle') // idle | saving | error

  useEffect(() => {
    if (!user) return undefined
    let active = true
    legalService
      .acceptances()
      .then(res => active && setPending(res?.pending || []))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  if (!user || pending.length === 0) return null

  const accept = async () => {
    setState('saving')
    try {
      const res = await legalService.accept(pending, { source: 'banner' })
      setPending(res?.pending || [])
      setState('idle')
    } catch {
      setState('error')
    }
  }

  const links = pending.map((p, i) => (
    <span key={p}>
      {i > 0 && ' and '}
      <Link
        to={PATHS[p] || '/legal'}
        className="underline underline-offset-2 font-medium"
      >
        {LABELS[p] || p}
      </Link>
    </span>
  ))

  return (
    <div
      role="status"
      data-testid="policy-update-banner"
      className="bg-brand-50 border-b border-brand-200 text-brand-900 text-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <Scale size={16} className="shrink-0 text-brand-600" />
        <span className="flex-1">
          {state === 'error'
            ? 'Could not save your acceptance. Please try again.'
            : 'Please review and accept our updated '}
          {state !== 'error' && links}
          {state !== 'error' && ' to keep using Rentra.'}
        </span>
        <button
          type="button"
          onClick={accept}
          disabled={state === 'saving'}
          className="inline-flex items-center px-3 py-1 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {state === 'saving' && (
            <Loader2 size={14} className="mr-1 animate-spin" />
          )}
          I accept
        </button>
      </div>
    </div>
  )
}
