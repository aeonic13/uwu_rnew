import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react'
import { authService } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'
import AuthShell from './AuthShell'

/**
 * Landing page for the verification email link (?token=...). Verifies on
 * load, refreshes the signed-in user so the badge flips immediately, and
 * offers a resend when the link has expired.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { user, refreshUser } = useAuth()

  const [status, setStatus] = useState(token ? 'verifying' : 'missing')
  const [error, setError] = useState(null)
  const [resend, setResend] = useState('idle') // idle | sending | sent | error
  // StrictMode mounts twice in dev; the token is single-use, so guard.
  const attempted = useRef(false)

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success')
        refreshUser?.()
      })
      .catch(err => {
        setError(err.message || 'This verification link is invalid or expired.')
        setStatus('error')
      })
  }, [token, refreshUser])

  const handleResend = async () => {
    setResend('sending')
    try {
      await authService.resendVerification()
      setResend('sent')
    } catch {
      setResend('error')
    }
  }

  const continueTo = user
    ? user.userType === 'owner'
      ? '/dashboard'
      : user.userType === 'cosigner'
        ? '/cosigner'
        : '/'
    : '/login'

  if (status === 'verifying') {
    return (
      <AuthShell title="Verifying your email">
        <div className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </AuthShell>
    )
  }

  if (status === 'success') {
    return (
      <AuthShell title="Email verified">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">
            Thanks. Your email address is confirmed.
          </p>
          <Link
            to={continueTo}
            className="inline-block bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600"
          >
            {user ? 'Continue' : 'Sign in'}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={
        status === 'missing' ? 'This link is incomplete' : 'Could not verify'
      }
    >
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">
          {status === 'missing'
            ? 'The link is missing its token. Open it from your email again.'
            : error}
        </p>
        {user && !user.verified ? (
          resend === 'sent' ? (
            <p className="text-green-700 text-sm">
              A fresh link is on its way to {user.email}.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resend === 'sending'}
              className="inline-flex items-center bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {resend === 'sending' ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Mail size={16} className="mr-2" />
              )}
              Send a new link
            </button>
          )
        ) : (
          <Link
            to="/login"
            className="inline-block bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600"
          >
            Sign in to request a new link
          </Link>
        )}
        {resend === 'error' && (
          <p className="text-red-600 text-sm mt-3">
            Could not send a new link. Try again in a moment.
          </p>
        )}
      </div>
    </AuthShell>
  )
}
