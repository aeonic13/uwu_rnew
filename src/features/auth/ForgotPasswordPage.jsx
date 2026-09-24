import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { authService } from '../../services/authService'
import AuthShell from './AuthShell'

/**
 * Request a password reset link. The response is the same whether or not
 * the address has an account, so this page cannot be used to probe emails.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await authService.forgotPassword(trimmed)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset email. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <>
      Remembered it?{' '}
      <Link
        to="/login"
        className="text-brand-500 font-semibold hover:underline"
      >
        Sign in
      </Link>
    </>
  )

  if (sent) {
    return (
      <AuthShell title="Check your email" footer={footer}>
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700">
            If an account exists for{' '}
            <span className="font-medium">{email}</span>, a reset link is on its
            way. It expires in one hour.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Nothing after a few minutes? Check spam, or{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-brand-500 hover:underline"
            >
              try another address
            </button>
            .
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot your password?"
      lead="Enter the email you signed up with and we will send a reset link."
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
