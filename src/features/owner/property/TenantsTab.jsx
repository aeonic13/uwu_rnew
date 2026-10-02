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
} from 'lucide-react'
import { agreementsService } from '../../../services/agreementsService'
import { messagingService } from '../../../services/messagingService'
import { useNavigate } from 'react-router-dom'
import { money, shortDate, fullName, initials } from './statusMeta'

const DEPOSIT_LABEL = {
  holding: 'Held',
  pending_refund: 'Refund pending',
  refunded: 'Refunded',
}

function MemberRow({ member, lease, listingId }) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const u = member.user
  const owes =
    member.share ?? Math.round(lease.monthlyRent / lease.members.length)

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
          <p className="text-xs text-gray-500">Signature</p>
          <p
            className={`font-medium flex items-center gap-1 ${
              member.signed ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            {member.signed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            {member.signed ? 'Signed' : 'Waiting'}
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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
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
}

function LeaseCard({ lease, listingId }) {
  const [downloading, setDownloading] = useState(false)
  const download = async () => {
    setDownloading(true)
    try {
      await agreementsService.downloadPdf(lease.id)
    } finally {
      setDownloading(false)
    }
  }
  const paid = lease.members.reduce((s, m) => s + m.paidThisMonth, 0)

  return (
    <section className="bg-white border border-gray-200 rounded-xl">
      <header className="p-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {lease.current
              ? 'Current lease'
              : lease.fullySigned
                ? 'Past lease'
                : 'Lease awaiting signatures'}
          </p>
          <h2 className="font-semibold text-gray-900 text-lg">
            {shortDate(lease.startDate)} – {shortDate(lease.endDate)}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {money(lease.monthlyRent)}/mo · {money(lease.securityDeposit)}{' '}
            deposit
            {lease.rentSplit &&
              ` · ${lease.rentSplit.splitMode === 'equal' ? 'split equally' : 'custom split'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              lease.fullySigned
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {lease.fullySigned
              ? 'All signed'
              : lease.landlordSigned
                ? 'Waiting on tenants'
                : 'Your signature needed'}
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
            onClick={download}
            disabled={downloading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
          >
            <Download size={13} /> Lease PDF
          </button>
        </div>
      </header>

      <ul className="px-5 divide-y divide-gray-100">
        {lease.members.map(m => (
          <MemberRow
            key={m.applicationId}
            member={m}
            lease={lease}
            listingId={listingId}
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
              : 'Not tracked yet'}
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
            {' · '}
            {
              lease.members.filter(m => m.autopay?.status === 'active').length
            }{' '}
            on autopay
          </p>
        </div>
      </footer>
    </section>
  )
}

LeaseCard.propTypes = {
  lease: PropTypes.object.isRequired,
  listingId: PropTypes.string.isRequired,
}

export default function TenantsTab({ data }) {
  const { leases, property } = data
  if (leases.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
        <p className="font-medium text-gray-900">No tenants yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Approving an application creates the lease and moves the household
          here.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-5">
      {leases.map(lease => (
        <LeaseCard key={lease.id} lease={lease} listingId={property.id} />
      ))}
    </div>
  )
}

TenantsTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    leases: PropTypes.array.isRequired,
  }).isRequired,
}
