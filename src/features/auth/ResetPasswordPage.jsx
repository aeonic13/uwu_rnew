import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { authService } from '../../services/authService'
import AuthShell from './AuthShell'

// Mirrors the server's validatePasswordStrength so the user hears about a
// weak password before the round trip, not after.
function passwordProblem(pw) {
  if (pw.length < 8) return 'At least 8 characters'
  if (!/[a-zA-Z]/.test(pw)) return 'Include at least one letter'
  if (!/[0-9]/.test(pw)) return 'Include at least one number'
  return null
}

/**
 * Set a new password from the emailed reset link (?token=...).
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const signIn = (
    <Link to="/login" className="text-brand-500 font-semibold hover:underline">
      Sign in
    </Link>
  )

  if (!token) {
    return (
      <AuthShell title="This reset link is incomplete">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">
            The link is missing its token. Open the link from your email again,
            or request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">
            Your password has been reset. Sign in with the new one.
          </p>
          <Link
            to="/login"
            className="inline-block bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600"
          >
            Sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const problem = passwordProblem(password)
    if (problem) {
      setError(problem)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not reset your password. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (id, label, value, onChange, autoComplete) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  )

  return (
    <AuthShell
      title="Choose a new password"
      lead="At least 8 characters with a letter and a number."
      footer={<>Changed your mind? {signIn}</>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {field(
          'new-password',
          'New password',
          password,
          setPassword,
          'new-password'
        )}
        {field(
          'confirm-password',
          'Confirm password',
          confirm,
          setConfirm,
          'new-password'
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Reset password'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
