import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  Users,
  FileText,
  Wrench,
  DollarSign,
  Receipt,
  Heart,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  PenLine,
} from 'lucide-react'
import {
  money,
  shortDate,
  fullName,
  TICKET_STATUS,
  APPLICATION_STATUS,
} from './statusMeta'

const GUARANTOR_LABELS = {
  always: 'Always required',
  'students-only': 'If income is short',
  never: 'Not required',
}

function Stat({ label, value, Icon, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 text-left flex items-start gap-3 ${
        onClick ? 'hover:border-brand-300 hover:shadow-sm' : ''
      }`}
    >
      <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </Tag>
  )
}

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func,
}

/** What needs the landlord's hand right now, derived from the workspace. */
export function attentionItems(data) {
  const items = []
  const { stats, leases, tickets, applications } = data
  if (stats.pendingApplications > 0) {
    items.push({
      key: 'apps',
      tab: 'applications',
      text: `${stats.pendingApplications} application${
        stats.pendingApplications === 1 ? '' : 's'
      } waiting for a decision`,
    })
  }
  const unsigned = leases.filter(l => !l.fullySigned)
  for (const lease of unsigned) {
    const waiting = lease.members
      .filter(m => !m.signed)
      .map(m => fullName(m.user || m.invite))
    if (lease.imported) {
      items.push({
        key: `lease-${lease.id}`,
        tab: 'tenants',
        text: `Waiting on ${waiting.join(', ')} to confirm the lease`,
      })
      continue
    }
    if (!lease.landlordSigned) waiting.push('you')
    items.push({
      key: `lease-${lease.id}`,
      tab: 'tenants',
      text: `Lease starting ${shortDate(lease.startDate)} still needs signatures from ${waiting.join(', ')}`,
    })
  }
  const urgent = tickets.filter(
    t => t.status !== 'completed' && t.priority === 'high'
  )
  if (urgent.length) {
    items.push({
      key: 'urgent',
      tab: 'maintenance',
      text: `${urgent.length} high-priority maintenance ticket${
        urgent.length === 1 ? '' : 's'
      } open`,
    })
  } else if (stats.openTickets > 0) {
    items.push({
      key: 'tickets',
      tab: 'maintenance',
      text: `${stats.openTickets} maintenance ticket${
        stats.openTickets === 1 ? '' : 's'
      } open`,
    })
  }
  for (const lease of leases) {
    const dep = lease.deposit
    if (dep && dep.status === 'pending_refund' && dep.refundDeadline) {
      items.push({
        key: `dep-${lease.id}`,
        tab: 'tenants',
        text: `Security deposit refund due by ${shortDate(dep.refundDeadline)}`,
      })
    }
  }
  if (!items.length && applications.length === 0 && stats.status === 'listed') {
    items.push({
      key: 'noapps',
      tab: null,
      text: 'Listed and waiting for the first application',
      quiet: true,
    })
    items.push({
      key: 'onboard',
      tab: null,
      to: `/dashboard/properties/${data.property.id}/onboard`,
      text: 'Already have tenants here? Add them',
    })
  }
  return items
}

export default function OverviewTab({ data, onGoTo }) {
  const { property, stats, leases, applications, tickets } = data
  const current = leases.find(l => l.current) || leases[0] || null
  const attention = attentionItems(data)

  const recent = [
    ...applications.slice(0, 4).map(a => ({
      key: `a-${a.id}`,
      when: a.createdAt,
      Icon: FileText,
      text: `${fullName(a.applicant)} applied`,
      badge: APPLICATION_STATUS[a.status],
      tab: 'applications',
    })),
    ...tickets.slice(0, 4).map(t => ({
      key: `t-${t.id}`,
      when: t.createdAt,
      Icon: Wrench,
      text: `${fullName(t.tenant)} reported ${t.category}`,
      badge: TICKET_STATUS[t.status],
      tab: 'maintenance',
    })),
  ]
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 6)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Tenants"
            value={stats.tenants}
            Icon={Users}
            onClick={() => onGoTo('tenants')}
          />
          <Stat
            label="Pending applications"
            value={stats.pendingApplications}
            Icon={FileText}
            onClick={() => onGoTo('applications')}
          />
          <Stat
            label="Open maintenance"
            value={stats.openTickets}
            Icon={Wrench}
            onClick={() => onGoTo('maintenance')}
          />
          <Stat
            label="Collected this month"
            value={money(stats.collectedThisMonth)}
            Icon={DollarSign}
          />
        </div>

        {/* Needs attention */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Needs
            attention
          </h2>
          {attention.length === 0 ? (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" /> Nothing
              waiting on you.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {attention.map(item => (
                <li key={item.key}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className="w-full flex items-center justify-between gap-3 py-2.5 text-sm text-left text-brand-600 font-medium hover:underline"
                    >
                      {item.text}
                      <ChevronRight size={15} className="text-gray-400" />
                    </Link>
                  ) : item.tab ? (
                    <button
                      type="button"
                      onClick={() => onGoTo(item.tab)}
                      className="w-full flex items-center justify-between gap-3 py-2.5 text-sm text-left text-gray-800 hover:text-brand-600"
                    >
                      {item.text}
                      <ChevronRight size={15} className="text-gray-400" />
                    </button>
                  ) : (
                    <p className="py-2.5 text-sm text-gray-500">{item.text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map(({ key, when, Icon, text, badge, tab }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onGoTo(tab)}
                    className="w-full flex items-center gap-3 py-2.5 text-left text-sm hover:text-brand-600"
                  >
                    <Icon size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-gray-800">
                      {text}
                    </span>
                    {badge && (
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {shortDate(when)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-5">
        {/* Current lease */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PenLine size={16} className="text-gray-400" /> Lease
          </h2>
          {current ? (
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Term</dt>
                <dd className="text-gray-900 font-medium text-right">
                  {shortDate(current.startDate)} –{' '}
                  {current.monthToMonth
                    ? 'Month-to-month'
                    : shortDate(current.endDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Rent</dt>
                <dd className="text-gray-900 font-medium">
                  {money(current.monthlyRent)}/mo
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Deposit</dt>
                <dd className="text-gray-900 font-medium">
                  {money(current.securityDeposit)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Household</dt>
                <dd className="text-gray-900 font-medium">
                  {current.members.length} tenant
                  {current.members.length === 1 ? '' : 's'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Signatures</dt>
                <dd
                  className={`font-medium ${
                    current.fullySigned ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {current.fullySigned ? 'Complete' : 'Incomplete'}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => onGoTo('tenants')}
                className="mt-2 text-brand-600 text-sm font-medium hover:underline"
              >
                View tenants
              </button>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">
              No lease yet. Approve an application to create one.
            </p>
          )}
        </section>

        {/* Listing facts */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Listing</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Asking rent</dt>
              <dd className="text-gray-900 font-medium">
                {money(property.price)}/mo
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Available</dt>
              <dd className="text-gray-900 font-medium">
                {shortDate(property.moveInDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Income rule</dt>
              <dd className="text-gray-900 font-medium">
                {property.incomeMultiplier}× rent
              </dd>
            </div>
            {property.screeningCriteria?.minCreditScore ? (
              <div className="flex justify-between">
                <dt className="text-gray-500">Min credit score</dt>
                <dd className="text-gray-900 font-medium">
                  {property.screeningCriteria.minCreditScore}
                </dd>
              </div>
            ) : null}
            {property.screeningCriteria?.guarantorPolicy ? (
              <div className="flex justify-between">
                <dt className="text-gray-500">Co-signer</dt>
                <dd className="text-gray-900 font-medium">
                  {GUARANTOR_LABELS[property.screeningCriteria.guarantorPolicy]}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-gray-500 flex items-center gap-1">
                <Heart size={13} /> Saved by
              </dt>
              <dd className="text-gray-900 font-medium">
                {stats.favorites} tenant{stats.favorites === 1 ? '' : 's'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 flex items-center gap-1">
                <Receipt size={13} /> Expenses YTD
              </dt>
              <dd className="text-gray-900 font-medium">
                {money(stats.expensesYtd)}
              </dd>
            </div>
          </dl>
          {property.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {property.amenities.map(a => (
                <span
                  key={a}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

OverviewTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    stats: PropTypes.object.isRequired,
    leases: PropTypes.array.isRequired,
    applications: PropTypes.array.isRequired,
    tickets: PropTypes.array.isRequired,
  }).isRequired,
  onGoTo: PropTypes.func.isRequired,
}
