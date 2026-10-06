import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { teamService } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_LABEL = { manager: 'property manager', co_owner: 'co-owner' }

/**
 * /team-invite/:token — accept an invitation to work a landlord's
 * portfolio. The invitee needs a landlord account on the invited email:
 * signed in as that account → accept; otherwise sign in or sign up first
 * and come back to this link.
 */
export default function TeamInviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    let active = true
    teamService
      .getInvitation(token)
      .then(inv => active && setInvitation(inv))
      .catch(err => active && setError(err?.message || 'Invitation not found'))
    return () => {
      active = false
    }
  }, [token])

  const accept = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await teamService.accept(token)
      setDone(res.portfolio)
    } catch (err) {
      setError(err?.message || 'Could not accept the invitation.')
      setBusy(false)
    }
  }

  if (!invitation && !error) {
    return (
      <Card>
        <Loader2 size={22} className="animate-spin mx-auto text-gray-400" />
      </Card>
    )
  }

  if (done) {
    return (
      <Card>
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-gray-900">
          You&apos;re on the team
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          You now manage {done.ownerName}&apos;s portfolio as a{' '}
          {ROLE_LABEL[done.role] || done.role}.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-5 w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
        >
          Open the dashboard
        </button>
      </Card>
    )
  }

  if (!invitation) {
    return (
      <Card>
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-gray-900">
          Invitation not found
        </h1>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
      </Card>
    )
  }

  const closed = invitation.status !== 'invited'
  const signedInAsInvitee =
    user && user.email?.toLowerCase() === invitation.email.toLowerCase()
  const wrongType = invitation.hasAccount && invitation.accountType !== 'owner'
  const next = encodeURIComponent(`/team-invite/${token}`)

  return (
    <Card>
      <Users className="w-10 h-10 text-brand-500 mx-auto mb-3" />
      <h1 className="text-lg font-semibold text-gray-900">
        {invitation.inviter.name} invited you
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        To work their rental portfolio on Rentra as a{' '}
        {ROLE_LABEL[invitation.role] || invitation.role}: every property,
        applicant, lease, ledger, ticket and document. Leases stay signed by the
        owner.
      </p>
      <p className="text-xs text-gray-500 mt-2">Sent to {invitation.email}</p>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="mt-5">
        {closed ? (
          <p className="text-sm text-gray-700">
            This invitation is {invitation.status}. Ask{' '}
            {invitation.inviter.name} to send a new one.
          </p>
        ) : wrongType ? (
          <p className="text-sm text-gray-700">
            This email belongs to a{' '}
            {invitation.accountType === 'cosigner' ? 'co-signer' : 'tenant'}{' '}
            account. Team members need a landlord account; ask{' '}
            {invitation.inviter.name} to invite a different email.
          </p>
        ) : signedInAsInvitee ? (
          <button
            type="button"
            onClick={accept}
            disabled={busy}
            className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? 'Joining…' : 'Accept and join'}
          </button>
        ) : invitation.hasAccount ? (
          <>
            <p className="text-sm text-gray-700 mb-3">
              {user
                ? `You are signed in as ${user.email}. Sign in with ${invitation.email} to accept.`
                : 'Sign in with this email to accept.'}
            </p>
            <Link
              to={`/login?next=${next}`}
              className="block w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-3">
              Create a landlord account with this email, then open this link
              again to accept.
            </p>
            <Link
              to={`/register?type=owner&email=${encodeURIComponent(invitation.email)}&next=${next}`}
              className="block w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
            >
              Create a landlord account
            </Link>
          </>
        )}
      </div>
    </Card>
  )
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

Card.propTypes = { children: PropTypes.node }
