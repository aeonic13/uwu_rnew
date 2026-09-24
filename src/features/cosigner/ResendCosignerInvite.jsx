import { useState } from 'react'
import PropTypes from 'prop-types'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cosignerService } from '../../services/cosignerService'

/** True when an invite's expiry timestamp is in the past. */
export function inviteExpired(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt).getTime() < Date.now()
}

/**
 * Small control shown next to a pending cosigner invite: says when the link
 * expires (or that it has), and re-sends it with a fresh 7-day token.
 */
export default function ResendCosignerInvite({
  cosignerId,
  expiresAt,
  onResent,
}) {
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null)

  const expiry = expiresAt ? new Date(expiresAt) : null
  const expired = inviteExpired(expiresAt)

  const handleResend = async () => {
    setState('sending')
    setError(null)
    try {
      const res = await cosignerService.resend(cosignerId)
      setState('sent')
      onResent?.(res?.cosigner || null)
    } catch (err) {
      setState('error')
      setError(err.message || 'Could not resend the invitation')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className={expired ? 'text-amber-600' : 'text-gray-500'}>
        {expiry
          ? expired
            ? `Invite link expired ${expiry.toLocaleDateString()}`
            : `Invite link expires ${expiry.toLocaleDateString()}`
          : 'Invite sent'}
      </span>
      {state === 'sent' ? (
        <span className="inline-flex items-center text-green-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Resent
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={state === 'sending'}
          className="inline-flex items-center text-brand-500 font-medium hover:underline disabled:opacity-60"
        >
          {state === 'sending' ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
          )}
          Resend invite
        </button>
      )}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  )
}

ResendCosignerInvite.propTypes = {
  cosignerId: PropTypes.string.isRequired,
  expiresAt: PropTypes.string,
  onResent: PropTypes.func,
}
