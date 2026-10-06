import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Mail,
  Phone,
  Download,
  CheckCircle2,
  Clock,
  Landmark,
  ShieldCheck,
  Repeat,
  MessageSquare,
  PenLine,
  Send,
  Pencil,
  X,
  UserPlus,
  FileText,
} from 'lucide-react'
import { agreementsService } from '../../../services/agreementsService'
import { messagingService } from '../../../services/messagingService'
import { tenantInvitesService } from '../../../services/tenantInvitesService'
import {
  EndLeaseModal,
  RenewLeaseModal,
  LeaseActionButtons,
} from './LeaseActions'
import { useNavigate } from 'react-router-dom'
import {
  money,
  shortDate,
  fullName,
  initials,
  INVITE_STATUS,
} from './statusMeta'

const DEPOSIT_LABEL = {
  holding: 'Held',
  pending_refund: 'Refund pending',
  refunded: 'Refunded',
}

const smallButton =
  'inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50'

/** A household member who has not accepted their invite yet. */
function InvitedRow({ member, onRefresh, onError }) {
  const invite = member.invite
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(invite?.email || '')
  const [notice, setNotice] = useState('')
  const status = INVITE_STATUS[invite?.status] || INVITE_STATUS.pending

  const run = async (fn, okMessage) => {
    setBusy(true)
    setNotice('')
    try {
      const res = await fn()
      if (okMessage) setNotice(okMessage(res))
      await onRefresh()
    } catch (err) {
      onError(err?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const resend = () =>
    run(
      () => tenantInvitesService.resend(invite.id),
      res =>
        res?.emailSent
          ? 'Invitation resent.'
          : 'Link refreshed, but the email could not be sent.'
    )
  const saveEmail = e => {
    e.preventDefault()
    run(
      () => tenantInvitesService.update(invite.id, { email: email.trim() }),
      res =>
        res?.emailSent === false
          ? 'Email updated, but the invitation could not be sent.'
          : 'Email updated and invitation sent.'
    ).then(() => setEditing(false))
  }
  const cancel = () => {
    if (
      !window.confirm(
        `Remove ${invite.firstName} ${invite.lastName} from this household? If they are the only tenant, the imported lease is removed too.`
      )
    ) {
      return
    }
    run(() => tenantInvitesService.cancel(invite.id))
  }

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center justify-center flex-shrink-0">
          {initials(invite)}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 flex items-center gap-2">
            {fullName(invite)}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          </p>
          {editing ? (
            <form onSubmit={saveEmail} className="flex items-center gap-2 mt-1">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs w-56"
                aria-label="New email"
                required
              />
              <button type="submit" disabled={busy} className={smallButton}>
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-gray-500"
              >
                Cancel
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-500 flex flex-wrap gap-x-3">
              <span className="flex items-center gap-1">
                <Mail size={12} /> {invite.email}
              </span>
              {invite.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {invite.phone}
                </span>
              )}
              {invite.status === 'pending' && (
                <span>Expires {shortDate(invite.expiresAt)}</span>
              )}
            </p>
          )}
          {notice && <p className="text-xs text-green-700 mt-1">{notice}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {invite.status !== 'cancelled' && (
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className={smallButton}
          >
            <Send size={13} /> Resend
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          disabled={busy}
          className={smallButton}
        >
          <Pencil size={13} /> Edit email
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className={`${smallButton} hover:border-red-400 hover:text-red-600`}
        >
          <X size={13} /> Remove
        </button>
      </div>
    </li>
  )
}

InvitedRow.propTypes = {
  member: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
}

function MemberRow({ member, lease, listingId, onRefresh, onError }) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const u = member.user
  const owes =
    member.share ?? Math.round(lease.monthlyRent / lease.members.length)

  if (!u) {
    return (
      <InvitedRow member={member} onRefresh={onRefresh} onError={onError} />
    )
  }

  const message = async () => {
    setStarting(true)
    try {
      const res = await messagingService.startConversation(u.id, listingId)
      const convId = res?.conversation?.id || res?.id
      navigate(convId ? `/messages/${convId}` : '/messages')
    } catch {
      navigate('/messages')
    } finally {
      setStarting(false)
    }
  }

  const signedLabel = lease.imported ? 'Confirmed' : 'Signed'
  const waitingLabel = lease.imported ? 'Not confirmed' : 'Waiting'

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center flex-shrink-0">
          {initials(u)}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 flex items-center gap-2">
            {fullName(u)}
            {u.verified && (
              <ShieldCheck
                size={14}
                className="text-green-600"
                aria-label="Email confirmed"
              />
            )}
          </p>
          <p className="text-xs text-gray-500 flex flex-wrap gap-x-3">
            <a
              href={`mailto:${u.email}`}
              className="flex items-center gap-1 hover:text-brand-600"
            >
              <Mail size={12} /> {u.email}
            </a>
            {u.phone && (
              <a
                href={`tel:${u.phone}`}
                className="flex items-center gap-1 hover:text-brand-600"
              >
                <Phone size={12} /> {u.phone}
              </a>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm sm:w-80">
        <div>
          <p className="text-xs text-gray-500">Share</p>
          <p className="font-medium text-gray-900">{money(owes)}/mo</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Paid this month</p>
          <p
            className={`font-medium ${
              member.paidThisMonth >= owes ? 'text-green-700' : 'text-gray-900'
            }`}
          >
            {money(member.paidThisMonth)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">
            {lease.imported ? 'Lease' : 'Signature'}
          </p>
          <p
            className={`font-medium flex items-center gap-1 ${
              member.signed ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            {member.signed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            {member.signed ? signedLabel : waitingLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {member.autopay && (
          <span
            title={`Autopay ${member.autopay.status}: ${money(
              member.autopay.amount
            )} on day ${member.autopay.dayOfMonth}`}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              member.autopay.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Repeat size={11} /> Autopay
          </span>
        )}
        <button
          type="button"
          onClick={message}
          disabled={starting}
          className={smallButton}
        >
          <MessageSquare size={13} /> Message
        </button>
      </div>
    </li>
  )
}

MemberRow.propTypes = {
  member: PropTypes.object.isRequired,
  lease: PropTypes.object.isRequired,
  listingId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
}

function leaseHeading(lease) {
  if (lease.renewsId && !lease.fullySigned) return 'Renewal awaiting signatures'
  if (lease.renewsId && lease.current && new Date(lease.startDate) > new Date())
    return 'Upcoming renewal'
  if (lease.imported) {
    if (lease.current) return 'Current lease · imported'
    if (lease.awaitingTenants) return 'Imported lease · waiting on tenants'
    return 'Past lease · imported'
  }
  if (lease.current) return 'Current lease'
  if (lease.fullySigned) return 'Past lease'
  return 'Lease awaiting signatures'
}

function leaseBadge(lease) {
  if (lease.endedAt && lease.current) {
    return {
      label: `Ending ${shortDate(lease.endDate)}`,
      className: 'bg-amber-100 text-amber-800',
    }
  }
  if (lease.fullySigned) {
    return {
      label: lease.imported ? 'All confirmed' : 'All signed',
      className: 'bg-green-100 text-green-800',
    }
  }
  if (lease.imported) {
    const c = lease.confirmations || { confirmed: 0, total: 0 }
    return {
      label: `${c.confirmed} of ${c.total} confirmed`,
      className: 'bg-purple-100 text-purple-800',
    }
  }
  return {
    label: lease.landlordSigned
      ? 'Waiting on tenants'
      : 'Your signature needed',
    className: 'bg-amber-100 text-amber-800',
  }
}

function LeaseCard({ lease, listingId, onRefresh, onError }) {
  const [downloading, setDownloading] = useState(false)
  const [action, setAction] = useState(null) // 'end' | 'renew'
  const download = async ({ summary = false } = {}) => {
    setDownloading(true)
    try {
      await agreementsService.downloadPdf(lease.id, { summary })
    } catch (err) {
      onError(err?.message || 'Could not download the lease.')
    } finally {
      setDownloading(false)
    }
  }
  const hasSignedCopy = Boolean(lease.imported && lease.documentUrl)
  const paid = lease.members.reduce((s, m) => s + m.paidThisMonth, 0)
  const badge = leaseBadge(lease)
  const confirmedMembers = lease.members.filter(m => m.user)

  return (
    <section className="bg-white border border-gray-200 rounded-xl">
      <header className="p-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {leaseHeading(lease)}
          </p>
          <h2 className="font-semibold text-gray-900 text-lg">
            {shortDate(lease.startDate)} –{' '}
            {lease.monthToMonth ? 'Month-to-month' : shortDate(lease.endDate)}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {money(lease.monthlyRent)}/mo · {money(lease.securityDeposit)}{' '}
            deposit
            {lease.rentSplit &&
              ` · ${lease.rentSplit.splitMode === 'equal' ? 'split equally' : 'custom split'}`}
            {lease.lateFee &&
              ` · late fee ${money(lease.lateFee.amount)} after ${lease.lateFee.graceDays} days`}
          </p>
          {lease.endedAt && (
            <p className="text-xs text-amber-700 mt-1">
              Notice given · tenants move out {shortDate(lease.endDate)}. The
              deposit refund countdown runs from that date.
            </p>
          )}
          {lease.renewalId && (
            <p className="text-xs text-gray-600 mt-1">
              Renewal drafted ·{' '}
              <Link
                to={`/agreement/${lease.renewalId}`}
                className="text-brand-600 hover:underline"
              >
                open the renewal
              </Link>
            </p>
          )}
          {lease.imported && (
            <p className="text-xs text-gray-500 mt-1">
              Signed outside Rentra; tenants confirm the recorded terms.
              {hasSignedCopy ? (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => download({ summary: true })}
                    disabled={downloading}
                    className="text-brand-600 hover:underline inline-flex items-center gap-0.5 disabled:opacity-50"
                  >
                    Lease summary <FileText size={11} />
                  </button>
                </>
              ) : (
                ' No signed copy uploaded.'
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
          <Link
            to={`/agreement/${lease.id}`}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              lease.landlordSigned
                ? 'border border-gray-300 text-gray-700 hover:border-brand-500 hover:text-brand-600'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            <PenLine size={13} />
            {lease.landlordSigned ? 'View agreement' : 'Review & sign'}
          </Link>
          <button
            type="button"
            onClick={() => download()}
            disabled={downloading}
            className={smallButton}
          >
            <Download size={13} />{' '}
            {hasSignedCopy
              ? 'Signed lease'
              : lease.imported
                ? 'Lease summary'
                : 'Lease PDF'}
          </button>
          <LeaseActionButtons
            lease={lease}
            className={smallButton}
            onEnd={() => setAction('end')}
            onRenew={() => setAction('renew')}
          />
        </div>
      </header>

      <ul className="px-5 divide-y divide-gray-100">
        {lease.members.map(m => (
          <MemberRow
            key={m.applicationId}
            member={m}
            lease={lease}
            listingId={listingId}
            onRefresh={onRefresh}
            onError={onError}
          />
        ))}
      </ul>

      <footer className="p-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Collected this month</p>
          <p className="font-semibold text-gray-900">
            {money(paid)}{' '}
            <span className="text-gray-400 font-normal">
              of {money(lease.monthlyRent)}
            </span>
          </p>
          <Link
            to="/dashboard/rent-collection"
            className="text-brand-600 text-xs font-medium hover:underline inline-flex items-center gap-1 mt-1"
          >
            <Landmark size={12} /> Record a payment
          </Link>
        </div>
        <div>
          <p className="text-xs text-gray-500">Security deposit</p>
          <p className="font-semibold text-gray-900">
            {lease.deposit
              ? `${money(lease.deposit.amountHeld)} · ${
                  DEPOSIT_LABEL[lease.deposit.status] || lease.deposit.status
                }`
              : lease.fullySigned
                ? 'Not tracked yet'
                : 'Tracked once everyone confirms'}
          </p>
          <Link
            to="/dashboard/security-deposits"
            className="text-brand-600 text-xs font-medium hover:underline mt-1 inline-block"
          >
            Manage deposit
          </Link>
        </div>
        <div>
          <p className="text-xs text-gray-500">Household</p>
          <p className="font-semibold text-gray-900">
            {lease.members.length} tenant{lease.members.length === 1 ? '' : 's'}
            {lease.imported && confirmedMembers.length < lease.members.length
              ? ` · ${confirmedMembers.length} confirmed`
              : ''}
            {' · '}
            {
              lease.members.filter(m => m.autopay?.status === 'active').length
            }{' '}
            on autopay
          </p>
        </div>
      </footer>
      {action === 'end' && (
        <EndLeaseModal
          lease={lease}
          onClose={() => setAction(null)}
          onDone={async () => {
            setAction(null)
            await onRefresh()
          }}
        />
      )}
      {action === 'renew' && (
        <RenewLeaseModal
          lease={lease}
          onClose={() => setAction(null)}
          onDone={async () => {
            setAction(null)
            await onRefresh()
          }}
        />
      )}
    </section>
  )
}

LeaseCard.propTypes = {
  lease: PropTypes.object.isRequired,
  listingId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
}

export default function TenantsTab({ data, onRefresh }) {
  const { leases, property } = data
  const [error, setError] = useState('')
  const refresh = onRefresh || (() => Promise.resolve())

  if (leases.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center px-6">
        <p className="font-medium text-gray-900">No tenants yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Approving an application creates the lease and moves the household
          here.
        </p>
        <div className="mt-5 pt-5 border-t border-gray-200 max-w-md mx-auto">
          <p className="text-sm text-gray-700">
            Already have tenants living here?
          </p>
          <Link
            to={`/dashboard/properties/${property.id}/onboard`}
            className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
          >
            <UserPlus size={15} /> Add current tenants
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            Record the lease you already have and invite them by email.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-5">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </p>
      )}
      {leases.map(lease => (
        <LeaseCard
          key={lease.id}
          lease={lease}
          listingId={property.id}
          onRefresh={refresh}
          onError={setError}
        />
      ))}
    </div>
  )
}

TenantsTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    leases: PropTypes.array.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func,
}
