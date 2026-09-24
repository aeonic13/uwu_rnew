import { useState } from 'react'
import { Mail, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/authService'

const KEY = 'rentra.verifyBannerDismissed'

function readDismissed() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Slim reminder under the header for signed-in users who have not confirmed
 * their email, with a one-click resend. Cosigners are auto-verified on
 * accept, so it never shows for them.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(readDismissed)
  const [state, setState] = useState('idle') // idle | sending | sent | error

  if (!user || user.verified || user.userType === 'cosigner' || dismissed) {
    return null
  }

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // ignore
    }
  }

  const resend = async () => {
    setState('sending')
    try {
      await authService.resendVerification()
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <div
      role="status"
      className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <Mail size={16} className="shrink-0 text-amber-600" />
        <span className="flex-1">
          {state === 'sent'
            ? `Verification email sent to ${user.email}. Check your inbox.`
            : state === 'error'
              ? 'Could not send the verification email. Try again in a moment.'
              : 'Please confirm your email address to secure your account.'}
        </span>
        {state !== 'sent' && (
          <button
            type="button"
            onClick={resend}
            disabled={state === 'sending'}
            className="inline-flex items-center font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950 disabled:opacity-60"
          >
            {state === 'sending' && (
              <Loader2 size={14} className="mr-1 animate-spin" />
            )}
            Resend email
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 rounded hover:bg-amber-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
