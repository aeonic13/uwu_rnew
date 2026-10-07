import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Users,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Inbox,
  GraduationCap,
} from 'lucide-react'
import { applicationsService } from '../../../services/applicationsService'
import {
  money,
  shortDate,
  fullName,
  initials,
  APPLICATION_STATUS,
} from './statusMeta'

const FILTERS = ['pending', 'approved', 'all']

function IncomeChip({ assessment }) {
  if (!assessment?.hasIncomeData) {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        Income not verified
      </span>
    )
  }
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full ${
        assessment.meetsRequirement
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-700'
      }`}
      title={`${money(assessment.monthlyIncome)}/mo vs ${money(
        assessment.requiredIncome
      )} required`}
    >
      {assessment.ratio}× rent{' '}
      {assessment.meetsRequirement ? '· meets rule' : '· below rule'}
    </span>
  )
}

IncomeChip.propTypes = { assessment: PropTypes.object }

export default function ApplicationsTab({ data, onRefresh }) {
  const { applications, property } = data
  const [filter, setFilter] = useState('pending')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const shown = useMemo(() => {
    if (filter === 'all') return applications
    return applications.filter(a => a.status === filter)
  }, [applications, filter])

  const groupSizes = useMemo(() => {
    const m = new Map()
    for (const a of applications) {
      if (a.groupId) m.set(a.groupId, (m.get(a.groupId) || 0) + 1)
    }
    return m
  }, [applications])

  const decide = async (app, status) => {
    setBusyId(app.id)
    setError('')
    try {
      try {
        await applicationsService.updateStatus(app.id, status)
      } catch (err) {
        // Combined verified income is short of the listing's requirement:
        // the landlord may still approve, but only on purpose.
        if (err?.code !== 'INCOME_SHORT') throw err
        const d = err.details || {}
        const money = n => `$${Number(n || 0).toLocaleString()}/mo`
        const ok = window.confirm(
          `${err.message}

Verified household income: ${money(d.effective)}
Your requirement: ${money(d.required)}

Approve anyway?`
        )
        if (!ok) return
        await applicationsService.updateStatus(app.id, status, null, {
          override: true,
        })
      }
      await onRefresh()
    } catch (err) {
      setError(err?.message || 'Could not update the application.')
    } finally {
      setBusyId(null)
    }
  }

  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    all: applications.length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
                filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <Link
          to="/dashboard/inbox"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline"
        >
          <Inbox size={14} /> Full screening view in Inbox
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
          <p className="font-medium text-gray-900">
            {filter === 'pending'
              ? 'No applications waiting'
              : 'No applications here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {property.active
              ? 'Your listing is live and taking applications.'
              : 'This listing is not taking applications right now.'}
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {shown.map(app => {
            const badge = APPLICATION_STATUS[app.status]
            const groupSize = app.groupId ? groupSizes.get(app.groupId) : 0
            const activeCosigners = app.cosigners.filter(
              c => c.status === 'accepted' || c.status === 'approved'
            ).length
            return (
              <li
                key={app.id}
                className="p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-semibold flex items-center justify-center flex-shrink-0">
                    {initials(app.applicant)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 flex flex-wrap items-center gap-2">
                      {fullName(app.applicant)}
                      {app.applicant?.verified && (
                        <ShieldCheck
                          size={14}
                          className="text-green-600"
                          aria-label="Email confirmed"
                        />
                      )}
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${badge?.className}`}
                      >
                        {badge?.label || app.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex flex-wrap gap-x-3 mt-0.5">
                      {app.applicant?.university && (
                        <span className="flex items-center gap-1">
                          <GraduationCap size={12} /> {app.applicant.university}
                        </span>
                      )}
                      <span>
                        Wants {shortDate(app.startDate)} –{' '}
                        {shortDate(app.endDate)}
                      </span>
                      <span>Applied {shortDate(app.createdAt)}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <IncomeChip assessment={app.incomeAssessment} />
                      {groupSize > 1 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Users size={11} /> Group of {groupSize}
                        </span>
                      )}
                      {activeCosigners > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                          <UserCheck size={11} /> {activeCosigners} cosigner
                          {activeCosigners === 1 ? '' : 's'}
                        </span>
                      )}
                      {app.voucherAmount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          Voucher {money(app.voucherAmount)}/mo
                        </span>
                      )}
                    </div>
                    {app.message && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        “{app.message}”
                      </p>
                    )}
                  </div>
                </div>

                {app.status === 'pending' && (
                  <div className="flex items-center gap-2 md:flex-col md:items-stretch">
                    <button
                      type="button"
                      onClick={() => decide(app, 'approved')}
                      disabled={busyId === app.id}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check size={13} /> Approve
                      {groupSize > 1 ? ' group' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(app, 'rejected')}
                      disabled={busyId === app.id}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}
                {app.status === 'approved' && app.agreementId && (
                  <Link
                    to={`/dashboard/properties/${property.id}/tenants`}
                    className="text-xs text-brand-600 font-medium hover:underline whitespace-nowrap"
                  >
                    View lease
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

ApplicationsTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    applications: PropTypes.array.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
}
