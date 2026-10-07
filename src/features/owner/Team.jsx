import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Loader2,
} from 'lucide-react'
import { teamService } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'
import { shortDate } from './property/statusMeta'
import PortfolioSwitcher from './PortfolioSwitcher'

const ROLE_LABEL = { manager: 'Property manager', co_owner: 'Co-owner' }

/**
 * Who works this portfolio. The owner invites people by email and removes
 * them; a member sees whose portfolio they manage and can leave. Members
 * get the whole landlord workspace; leases are still signed by the owner.
 */
export default function Team() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      teamService
        .get()
        .then(setData)
        .catch(err => setError(err?.message || 'Could not load your team.')),
    []
  )
  useEffect(() => {
    load()
  }, [load])

  const invite = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await teamService.invite({ email: email.trim(), role })
      setNotice(`Invitation sent to ${email.trim()}.`)
      setEmail('')
      await load()
    } catch (err) {
      setError(err?.message || 'Could not send the invitation.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async member => {
    const verb =
      member.status === 'active' ? 'Remove' : 'Cancel the invitation for'
    if (!window.confirm(`${verb} ${member.name || member.email}?`)) return
    setBusy(true)
    setError('')
    try {
      await teamService.remove(member.id)
      await load()
    } catch (err) {
      setError(err?.message || 'Could not update the team.')
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    if (
      !window.confirm(
        `Leave ${data.portfolio.ownerName}'s portfolio? You will lose access to its properties.`
      )
    )
      return
    setBusy(true)
    try {
      await teamService.leave()
      // The next request resolves to the member's own (empty) portfolio;
      // a fresh sign-in keeps every screen consistent.
      logout()
      navigate('/login')
    } catch (err) {
      setError(err?.message || 'Could not leave the team.')
      setBusy(false)
    }
  }

  if (!data && !error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading team…
      </div>
    )
  }

  const portfolio = data?.portfolio
  const members = data?.members || []

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users size={22} className="text-brand-500" /> Team
          </h2>
          <p className="text-gray-600">
            People who can work this portfolio with you. They see every
            property, applicant, lease, ledger, ticket and document; leases are
            still signed by the owner.
          </p>
        </div>
        <PortfolioSwitcher />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          {notice}
        </p>
      )}

      {portfolio && !portfolio.isOwner && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="font-semibold text-gray-900">
            You manage {portfolio.ownerName}&apos;s portfolio
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Role: {ROLE_LABEL[portfolio.role] || portfolio.role}. Only the owner
            can invite or remove people.
          </p>
          <button
            type="button"
            onClick={leave}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-red-400 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={14} /> Leave this portfolio
          </button>
        </div>
      )}

      {portfolio?.isOwner && (
        <form
          onSubmit={invite}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3"
        >
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={16} /> Invite someone
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="their@email.com"
              aria-label="Email to invite"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              aria-label="Role"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="manager">Property manager</option>
              <option value="co_owner">Co-owner</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              Send invite
            </button>
          </div>
          <p className="text-xs text-gray-500">
            They need a landlord account on that email with no listings of its
            own. The invitation expires in 14 days.
          </p>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-900">
          {portfolio?.isOwner ? 'Your team' : 'Team'}
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500 text-center">
            Nobody else yet. Invite a co-owner or a property manager above.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map(m => (
              <li
                key={m.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {m.name || m.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {m.name ? `${m.email} · ` : ''}
                    {ROLE_LABEL[m.role] || m.role}
                    {m.status === 'invited'
                      ? ` · invited, expires ${shortDate(m.expiresAt)}`
                      : m.acceptedAt
                        ? ` · joined ${shortDate(m.acceptedAt)}`
                        : ''}
                  </p>
                </div>
                {portfolio?.isOwner && (
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    disabled={busy}
                    className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    aria-label={
                      m.status === 'active'
                        ? 'Remove member'
                        : 'Cancel invitation'
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
