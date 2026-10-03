import { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { dashboardService } from './services/dashboardService'
import { applicationsService } from './services/applicationsService'
import {
  MessageCircle,
  User,
  Star,
  Shield,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  Clock,
  ChevronRight,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle,
  Building2,
  Fingerprint,
  CircleDollarSign,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Universal rental application (captured once at pre-qualification) ──────
// Renders the tenant's standard-application answers when present. Older
// applications (pre-feature) simply won't have this data.
const RENTAL_PROFILE_SECTIONS = [
  {
    title: 'Residence history',
    rows: [
      ['Current address', 'currentAddress'],
      ['Time at address', 'timeAtAddress'],
      ['Current landlord', 'currentLandlordName'],
      ['Landlord phone', 'currentLandlordPhone'],
      ['Current rent', 'currentRent'],
      ['Reason for leaving', 'reasonForLeaving'],
      ['Previous address', 'previousAddress'],
    ],
  },
  {
    title: 'Employment & income',
    rows: [
      ['Employer', 'employer'],
      ['Job title', 'jobTitle'],
      ['Time with employer', 'employmentLength'],
      ['Work / supervisor phone', 'workPhone'],
      ['Gross monthly income', 'monthlyIncome'],
      ['Other income', 'otherIncome'],
    ],
  },
  {
    title: 'Household',
    rows: [
      ['Occupants', 'occupants'],
      ['Pets', 'pets'],
      ['Vehicles', 'vehicles'],
    ],
  },
]

const RENTAL_PROFILE_DISCLOSURES = [
  ['Ever evicted', 'everEvicted'],
  ['Broken a lease', 'brokenLease'],
  ['Felony conviction', 'felony'],
  ['Smoker', 'smoker'],
]

function RentalApplicationCard({ profile }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-brand-500" />
        <h4 className="font-semibold text-gray-900">Full Rental Application</h4>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Filled at pre-qualification
        </span>
      </div>

      <div className="space-y-4">
        {RENTAL_PROFILE_SECTIONS.map(section => {
          const rows = section.rows.filter(([, key]) => profile[key])
          if (rows.length === 0) return null
          return (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {section.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {rows.map(([label, key]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-500">{label}: </span>
                    <span className="font-medium text-gray-900">
                      {profile[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Disclosures
          </p>
          <div className="flex flex-wrap gap-2">
            {RENTAL_PROFILE_DISCLOSURES.map(([label, key]) => {
              if (typeof profile[key] !== 'boolean') return null
              const yes = profile[key]
              return (
                <span
                  key={key}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    yes
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {label}: {yes ? 'Yes' : 'No'}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline stages ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'pending_verifications', label: 'Verifying', color: 'yellow' },
  { key: 'ready_for_review', label: 'Ready', color: 'blue' },
  { key: 'applicants_approved', label: 'Approved', color: 'green' },
  { key: 'lease_sent', label: 'Lease Sent', color: 'purple' },
  { key: 'pending_signatures', label: 'Signing', color: 'orange' },
  { key: 'fully_executed', label: 'Executed', color: 'green' },
]

const stageBadge = key => {
  const s = PIPELINE_STAGES.find(p => p.key === key)
  if (!s) return null
  const cls = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-brand-100 text-brand-600',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  }[s.color]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {s.label}
    </span>
  )
}

/** Individual vs roommate-group marker, shown on every card and detail. */
function KindBadge({ kind }) {
  if (kind === 'group') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
        <Users size={11} /> Group
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-600">
      <User size={11} /> Individual
    </span>
  )
}

KindBadge.propTypes = { kind: PropTypes.oneOf(['individual', 'group']) }

/**
 * A roommate group's review screen: members, guarantors, combined income,
 * approve-the-household, then the joint lease's signature progress.
 */
function GroupDetail({ app, onBack, onReload }) {
  const navigate = useNavigate()
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)

  const guarStatus = v => {
    if (v === 'verified')
      return (
        <span className="text-green-600 text-xs font-medium">✅ Verified</span>
      )
    if (v === 'pending')
      return (
        <span className="text-yellow-600 text-xs font-medium">⏳ Pending</span>
      )
    return (
      <span className="text-red-500 text-xs font-medium">❌ Not Invited</span>
    )
  }

  // Approving any member approves the whole group on the server and
  // creates the single household lease with a signature block per member.
  const handleApproveApplicants = async app => {
    const lead = app.members.find(m => m.status === 'pending') || app.members[0]
    if (!lead?.applicationId) return
    setApproving(true)
    setApproveError(null)
    try {
      await applicationsService.updateStatus(lead.applicationId, 'approved')
      await onReload()
    } catch (err) {
      setApproveError(err.message || 'Could not approve the group.')
    } finally {
      setApproving(false)
    }
  }

  if (app) {
    const allVerified = app.members.every(
      m => !m.guarantor || m.guarantor.verificationStatus === 'verified'
    )
    const allComplete = app.members.every(
      m => m.applicationStatus === 'complete'
    )
    // Every member must have submitted; income and guarantor shortfalls are
    // shown as warnings, since the approval decision is the landlord's.
    const readyToApprove = allComplete

    // Counts
    const guarantorCount = app.members.filter(m => m.guarantor).length

    return (
      <div className="p-4 pb-24 space-y-5">
        <button
          onClick={onBack}
          className="flex items-center text-brand-500 text-sm font-medium mb-2"
        >
          ← Back to inbox
        </button>

        {/* Header */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Users size={16} className="text-purple-600 mr-2" />
              <span className="font-semibold text-purple-800">
                {app.groupName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <KindBadge kind="group" />
              {stageBadge(app.status)}
            </div>
          </div>
          <p className="text-sm text-purple-700">{app.propertyTitle}</p>
          <div className="flex gap-3 mt-2 text-xs text-purple-600">
            <span>
              {app.members.length} tenant{app.members.length !== 1 ? 's' : ''}
            </span>
            {guarantorCount > 0 && (
              <span>
                · {guarantorCount} guarantor{guarantorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Combined income — dynamic multiplier */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Combined Income Verification</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                ${app.combinedMonthlyIncome.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Combined/mo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">
                ${(app.rentRequired * 3).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">3× Required</p>
            </div>
            <div className="text-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  app.meetsRequirement
                    ? 'text-green-700 bg-green-100'
                    : 'text-red-700 bg-red-100'
                }`}
              >
                {app.meetsRequirement ? '🟢 Meets' : '🔴 Short'}
              </span>
            </div>
          </div>
        </div>

        {/* Member breakdown — fully dynamic */}
        <div className="space-y-3">
          <h3 className="font-semibold">Applicants & Guarantors</h3>
          {app.members.map((m, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.email} · {m.university}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    m.applicationStatus === 'complete'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {m.applicationStatus === 'complete'
                    ? '✅ Complete'
                    : '⏳ Pending'}
                </span>
              </div>
              {/* Plaid verification chips */}
              {m.verificationData && (
                <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                  {m.verificationData.bankConnected && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                      <Building2 size={11} /> Bank Connected
                    </span>
                  )}
                  {m.verificationData.incomeVerified && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                      <TrendingUp size={11} />
                      Income Verified
                      {m.verificationData.monthlyIncome
                        ? ` · $${m.verificationData.monthlyIncome.toLocaleString()}/mo`
                        : ''}
                    </span>
                  )}
                  {m.verificationData.identityVerified && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                      <Fingerprint size={11} /> Identity Verified
                    </span>
                  )}
                  {m.verificationData.applicationFeePaid && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                      <CircleDollarSign size={11} /> $50 Fee Paid
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">
                  ${m.monthlyIncome.toLocaleString()}/mo
                </span>
                {m.guarantor ? (
                  <span className="flex items-center space-x-1">
                    <Shield size={13} className="text-purple-500" />
                    <span className="text-gray-600 text-xs">
                      {m.guarantor.name}:
                    </span>
                    {guarStatus(m.guarantor.verificationStatus)}
                  </span>
                ) : (
                  <span className="text-green-600 text-xs font-medium">
                    No guarantor needed
                  </span>
                )}
              </div>

              {/* Per-member screening snapshot: credit, rental history,
                  and standard disclosures from the rental application. */}
              <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  <CreditCard size={11} />
                  Credit: {m.creditScore ?? 'N/A'}
                </span>
                {m.rentalProfile?.currentAddress && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    Renting at {m.rentalProfile.currentAddress}
                    {m.rentalProfile.currentRent
                      ? ` (${m.rentalProfile.currentRent})`
                      : ''}
                  </span>
                )}
                {m.rentalProfile &&
                  [
                    ['everEvicted', 'Evicted'],
                    ['brokenLease', 'Broke lease'],
                    ['felony', 'Felony'],
                    ['smoker', 'Smoker'],
                  ].map(([key, label]) =>
                    typeof m.rentalProfile[key] === 'boolean' ? (
                      <span
                        key={key}
                        className={`px-2 py-0.5 rounded-full ${
                          m.rentalProfile[key]
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {label}: {m.rentalProfile[key] ? 'Yes' : 'No'}
                      </span>
                    ) : null
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Tour status */}
        <div
          className={`rounded-xl p-3 flex items-center ${
            app.tourStatus === 'scheduled'
              ? 'bg-green-50 border border-green-200'
              : 'bg-brand-50 border border-brand-200'
          }`}
        >
          <Calendar
            size={16}
            className={
              app.tourStatus === 'scheduled'
                ? 'text-green-600 mr-2'
                : 'text-brand-500 mr-2'
            }
          />
          <span className="text-sm font-medium">
            {app.tourStatus === 'scheduled'
              ? `Tour scheduled · ${new Date(app.tourDate).toLocaleDateString()}`
              : app.tourStatus === 'requested'
                ? 'Tour requested — confirm a time'
                : 'No tour scheduled yet'}
          </span>
        </div>

        {/* Action buttons — real pipeline: review → approve → sign */}
        {app.status === 'ready_for_review' && (
          <div className="space-y-2">
            <button
              onClick={() => handleApproveApplicants(app)}
              disabled={!readyToApprove || approving}
              className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
                readyToApprove
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              <CheckCircle size={18} className="mr-2" />
              {approving
                ? 'Approving…'
                : `Approve group & send joint lease (${app.members.length})`}
            </button>
            <p className="text-center text-xs text-gray-500">
              Approves every member and creates one lease that each tenant signs
              individually.
              {!allVerified && ' Some guarantors have not verified yet.'}
              {!app.meetsRequirement &&
                ' Combined income is below your requirement.'}
            </p>
            {approveError && (
              <p className="text-center text-xs text-red-600">{approveError}</p>
            )}
          </div>
        )}

        {[
          'applicants_approved',
          'pending_signatures',
          'fully_executed',
        ].includes(app.status) && (
          <div className="space-y-3">
            <div
              className={`rounded-xl p-3 border ${
                app.status === 'fully_executed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  app.status === 'fully_executed'
                    ? 'text-green-800'
                    : 'text-orange-800'
                }`}
              >
                {app.status === 'fully_executed'
                  ? 'Lease fully executed'
                  : 'Joint lease sent — collecting signatures'}
              </p>
              {(app.signers || []).length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {app.signers.map(s => (
                    <li
                      key={s.userId}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {s.name}
                        <span className="text-gray-400">
                          {' '}
                          · {s.role === 'landlord' ? 'landlord' : 'tenant'}
                        </span>
                      </span>
                      <span
                        className={
                          s.signed ? 'text-green-700' : 'text-orange-700'
                        }
                      >
                        {s.signed ? 'Signed' : 'Not signed'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {app.agreementId && (
              <button
                onClick={() => navigate(`/agreement/${app.agreementId}`)}
                className="w-full py-3 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center"
              >
                <FileText size={18} className="mr-2" />
                {app.signers?.some(s => s.role === 'landlord' && !s.signed)
                  ? 'Review & sign lease'
                  : 'View lease'}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}

GroupDetail.propTypes = {
  app: PropTypes.object,
  onBack: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
}

/** One roommate group on the merged inbox list. */
function GroupCard({ app, onOpen }) {
  const totalGuarantors = app.members.filter(m => m.guarantor).length
  return (
    <div
      onClick={() => onOpen(app)}
      className="bg-white border border-purple-200 rounded-lg p-4 cursor-pointer hover:border-purple-400 transition-colors"
      data-testid={`inbox-group-${app.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
            <Users size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">{app.groupName}</h3>
            <p className="text-sm text-gray-600">
              {app.members.map(m => m.name.split(' ')[0]).join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              {app.propertyTitle} · {app.members.length} tenant
              {app.members.length !== 1 ? 's' : ''}
              {totalGuarantors > 0 &&
                `, ${totalGuarantors} guarantor${totalGuarantors !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <KindBadge kind="group" />
          {stageBadge(app.status)}
        </div>
      </div>

      <div className="flex items-center justify-between bg-purple-50 rounded p-3 mb-3">
        <span
          className={`text-sm font-semibold ${
            app.meetsRequirement ? 'text-green-600' : 'text-red-600'
          }`}
        >
          ${app.combinedMonthlyIncome.toLocaleString()}/mo combined
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            app.meetsRequirement
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {app.meetsRequirement ? '✓ Income met' : '✗ Short'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center">
          <Clock size={12} className="mr-1" />
          Applied {new Date(app.submittedAt).toLocaleDateString()}
        </span>
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </div>
  )
}

GroupCard.propTypes = {
  app: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
}

/**
 * Merge solo applicants and roommate groups into one list, newest first.
 * A group's members appear once, as the group, never also as individuals.
 * The per-listing "pool" entries the API also returns are skipped: their
 * applicants are the individuals.
 */
export function buildInboxEntries(applications, groups) {
  const real = (groups || []).filter(g => g.isRealGroup)
  const memberIds = new Set(
    real.flatMap(g => (g.members || []).map(m => m.applicationId))
  )
  const entries = [
    ...real.map(g => ({
      kind: 'group',
      id: `group:${g.id}`,
      propertyId: g.propertyId,
      propertyTitle: g.propertyTitle,
      date: g.submittedAt,
      group: g,
    })),
    ...(applications || [])
      .filter(a => !memberIds.has(a.id))
      .map(a => ({
        kind: 'individual',
        id: `app:${a.id}`,
        propertyId: a.propertyId,
        propertyTitle: a.propertyTitle,
        date: a.application?.appliedAt,
        application: a,
      })),
  ]
  return entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

/** The properties that have at least one entry, for the filter select. */
export function uniqueProperties(entries) {
  const seen = new Map()
  for (const e of entries) {
    if (e.propertyId && !seen.has(e.propertyId)) {
      seen.set(e.propertyId, e.propertyTitle)
    }
  }
  return [...seen.entries()].map(([id, title]) => ({ id, title }))
}

const getCreditScoreColor = score => {
  if (score == null) return 'text-gray-500 bg-gray-100'
  if (score >= 750) return 'text-green-600 bg-green-100'
  if (score >= 700) return 'text-brand-500 bg-brand-100'
  if (score >= 650) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

const getStatusColor = status => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100'
    case 'approved':
      return 'text-green-600 bg-green-100'
    case 'rejected':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const getTourStatusEmoji = tourStatus => {
  switch (tourStatus) {
    case 'not-requested':
      return '❓' // No tour requested
    case 'requested':
      return '📅' // Tour requested, not scheduled
    case 'scheduled':
      return '✅' // Tour scheduled
    case 'completed':
      return '✔️' // Tour completed
    default:
      return '❓'
  }
}

const getTourStatusText = tourStatus => {
  switch (tourStatus) {
    case 'not-requested':
      return 'No Tour Requested'
    case 'requested':
      return 'Tour Requested'
    case 'scheduled':
      return 'Tour Scheduled'
    case 'completed':
      return 'Tour Completed'
    default:
      return 'No Tour Info'
  }
}

const getTourStatusColor = tourStatus => {
  switch (tourStatus) {
    case 'not-requested':
      return 'text-gray-600 bg-gray-100'
    case 'requested':
      return 'text-brand-500 bg-brand-100'
    case 'scheduled':
      return 'text-green-600 bg-green-100'
    case 'completed':
      return 'text-purple-600 bg-purple-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/** One solo applicant on the merged inbox list. */
function IndividualCard({ application, onOpen }) {
  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors cursor-pointer"
      onClick={() => onOpen(application)}
      data-testid={`inbox-application-${application.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <img
            src={application.applicant.avatar}
            alt={application.applicant.name}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold">{application.applicant.name}</h3>
              {application.applicant.verified && (
                <Shield size={16} className="ml-2 text-brand-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {application.applicant.university} • {application.applicant.year}
            </p>
            <p className="text-xs text-gray-500">{application.propertyTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex justify-end mb-1">
            <KindBadge kind="individual" />
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(application.status)}`}
          >
            {application.status.toUpperCase()}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MessageCircle size={12} className="mr-1" />
            <span>{application.messages} messages</span>
          </div>
        </div>
      </div>

      {/* Credit Score & Key Info */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCreditScoreColor(application.applicant.creditScore)}`}
          >
            <CreditCard size={12} className="mr-1" />
            {application.applicant.creditScore ?? 'N/A'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {application.applicant.creditTier ?? 'Not checked'}
          </p>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium">
            ${application.application.monthlyIncome}
          </div>
          <p className="text-xs text-gray-500">Monthly Income</p>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium">
            {application.application.documents.length}
          </div>
          <p className="text-xs text-gray-500">Documents</p>
        </div>
      </div>

      {/* Application Preview */}
      <div className="bg-gray-50 rounded p-3 mb-3">
        <p className="text-sm text-gray-700 line-clamp-2">
          {application.application.message}
        </p>
      </div>

      {/* Tour Status Badge */}
      <div className="flex items-center mb-3">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTourStatusColor(application.tourStatus)}`}
        >
          <span className="mr-1">
            {getTourStatusEmoji(application.tourStatus)}
          </span>
          {getTourStatusText(application.tourStatus)}
          {application.tourDate && application.tourStatus === 'scheduled' && (
            <span className="ml-2 text-xs">
              • {new Date(application.tourDate).toLocaleDateString()} at{' '}
              {new Date(application.tourDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Move-in Details */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center">
          <Calendar size={12} className="mr-1" />
          <span>
            {new Date(application.application.moveInDate).toLocaleDateString()}{' '}
            -{' '}
            {new Date(application.application.moveOutDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          <span>
            Applied{' '}
            {application.application.appliedAt
              ? new Date(application.application.appliedAt).toLocaleDateString()
              : application.lastMessage}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3">
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </div>
  )
}

IndividualCard.propTypes = {
  application: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
}

const KIND_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'individual', label: 'Individuals', Icon: User },
  { key: 'group', label: 'Groups', Icon: Users },
]

const LandlordInbox = ({
  properties,
  onSelectApplicant,
  onSendMessage,
  onScheduleTour,
  onSendLease,
  onNavigateToApprovals,
  onNavigateToUtilities,
}) => {
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [viewMode, setViewMode] = useState('inbox') // 'inbox', 'applicant-detail'
  const [kindFilter, setKindFilter] = useState('all') // 'all' | 'individual' | 'group'
  const [applications, setApplications] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  // One load feeds both kinds of entry: the flat per-applicant rows and the
  // roommate groups. No demo rows: an empty inbox is an honest empty state.
  const load = useCallback(
    () =>
      dashboardService
        .getInbox()
        .then(data => {
          const nextApps = Array.isArray(data?.applications)
            ? data.applications
            : []
          const nextGroups = (
            Array.isArray(data?.groups) ? data.groups : []
          ).filter(g => g.isRealGroup)
          setApplications(nextApps)
          setGroups(nextGroups)
          setSelectedGroup(prev =>
            prev ? nextGroups.find(g => g.id === prev.id) || null : prev
          )
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  const entries = useMemo(
    () => buildInboxEntries(applications, groups),
    [applications, groups]
  )
  const propertyOptions = useMemo(() => uniqueProperties(entries), [entries])

  const applyStatus = (applicationId, status) => {
    setApplications(prev =>
      prev.map(a => (a.id === applicationId ? { ...a, status } : a))
    )
    setSelectedApplicant(prev =>
      prev && prev.id === applicationId ? { ...prev, status } : prev
    )
  }

  const handleApproveApplication = async applicationId => {
    // Optimistically reflect, then persist via the real status API.
    applyStatus(applicationId, 'approved')
    try {
      await applicationsService.updateStatus(applicationId, 'approved')
      onSendLease?.(applicationId)
    } catch (err) {
      console.error('Approve failed:', err)
      applyStatus(applicationId, 'pending')
    }
  }

  const handleRejectApplication = async applicationId => {
    applyStatus(applicationId, 'rejected')
    try {
      await applicationsService.updateStatus(applicationId, 'rejected')
    } catch (err) {
      console.error('Reject failed:', err)
      applyStatus(applicationId, 'pending')
    }
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        app={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onReload={load}
      />
    )
  }

  // Inbox View
  if (viewMode === 'inbox') {
    const shown = entries.filter(
      e =>
        (kindFilter === 'all' || e.kind === kindFilter) &&
        (!selectedProperty || e.propertyId === selectedProperty)
    )
    const counts = {
      all: entries.length,
      individual: entries.filter(e => e.kind === 'individual').length,
      group: entries.filter(e => e.kind === 'group').length,
    }

    return (
      <div className="pb-20">
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Applicant Inbox</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => onNavigateToUtilities?.()}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Utility Manager"
                >
                  <FileText size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => onNavigateToApprovals?.()}
                  className="p-2 hover:bg-gray-100 rounded-full relative"
                  title="Student Approvals"
                >
                  <Clock size={20} className="text-brand-500" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">2</span>
                  </div>
                </button>
              </div>
            </div>
            <p className="text-gray-600">
              Individual applicants and roommate groups, newest first
            </p>
          </div>

          {/* Kind filter: one list, but individuals and groups stay telling apart */}
          <div
            className="flex items-center gap-2 mb-4"
            role="group"
            aria-label="Show"
          >
            {KIND_FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setKindFilter(f.key)}
                aria-pressed={kindFilter === f.key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  kindFilter === f.key
                    ? f.key === 'group'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }`}
              >
                {f.Icon && <f.Icon size={13} />}
                {f.label}
                <span className="opacity-70">({counts[f.key]})</span>
              </button>
            ))}
          </div>
        </div>
        {/* end p-4 */}

        <div className="p-4">
          {/* Property Filter */}
          {propertyOptions.length > 1 && (
            <div className="mb-6">
              <select
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                aria-label="Property"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All properties</option>
                {propertyOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Applications List */}
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-6">Loading…</p>
          ) : shown.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {entries.length === 0
                  ? 'No applications yet'
                  : 'Nothing matches this filter'}
              </h3>
              <p className="text-gray-500">
                {entries.length === 0
                  ? 'Individual applicants and roommate groups both show up here when they apply to your properties.'
                  : 'Try another filter or property.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shown.map(entry =>
                entry.kind === 'group' ? (
                  <GroupCard
                    key={entry.id}
                    app={entry.group}
                    onOpen={setSelectedGroup}
                  />
                ) : (
                  <IndividualCard
                    key={entry.id}
                    application={entry.application}
                    onOpen={app => {
                      setSelectedApplicant(app)
                      setViewMode('applicant-detail')
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Applicant Detail View
  if (viewMode === 'applicant-detail' && selectedApplicant) {
    return (
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setViewMode('inbox')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h2 className="text-xl font-bold">Application Review</h2>
        </div>

        {/* Applicant Profile */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <img
              src={selectedApplicant.applicant.avatar}
              alt={selectedApplicant.applicant.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-xl font-bold">
                  {selectedApplicant.applicant.name}
                </h3>
                {selectedApplicant.applicant.verified && (
                  <Shield size={20} className="ml-2 text-brand-500" />
                )}
              </div>
              <p className="text-gray-600">
                {selectedApplicant.applicant.email}
              </p>
              <p className="text-gray-600">
                {selectedApplicant.applicant.phone}
              </p>
              <p className="text-sm text-brand-500">
                {selectedApplicant.applicant.university} •{' '}
                {selectedApplicant.applicant.year}
              </p>
            </div>
            <div className="text-right">
              <div className="flex justify-end mb-2">
                <KindBadge kind="individual" />
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedApplicant.status)}`}
              >
                {selectedApplicant.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Credit Score & Financial Info */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Credit Score
                </span>
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  {selectedApplicant.applicant.creditScore ?? 'N/A'}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  ({selectedApplicant.applicant.creditTier ?? 'not checked'})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    selectedApplicant.applicant.creditScore >= 750
                      ? 'bg-green-500'
                      : selectedApplicant.applicant.creditScore >= 700
                        ? 'bg-brand-500'
                        : selectedApplicant.applicant.creditScore >= 650
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{
                    width: `${(selectedApplicant.applicant.creditScore / 850) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Monthly Income
                </span>
                <DollarSign size={16} className="text-green-600" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  ${selectedApplicant.application.monthlyIncome}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Income-to-rent ratio:{' '}
                {Math.round(
                  (selectedApplicant.application.monthlyIncome / 1200) * 100
                )}
                %
              </p>
            </div>
          </div>

          {/* Background Check */}
          <div className="flex items-center p-3 bg-green-50 rounded-lg mb-2">
            <Check size={16} className="text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Background Check: {selectedApplicant.applicant.backgroundCheck}
            </span>
          </div>

          {/* Tour Status */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${getTourStatusColor(selectedApplicant.tourStatus)}`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-2">
                {getTourStatusEmoji(selectedApplicant.tourStatus)}
              </span>
              <div>
                <span className="text-sm font-medium">
                  {getTourStatusText(selectedApplicant.tourStatus)}
                </span>
                {selectedApplicant.tourDate && (
                  <p className="text-xs mt-1">
                    {selectedApplicant.tourStatus === 'scheduled' &&
                      'Scheduled for: '}
                    {selectedApplicant.tourStatus === 'completed' &&
                      'Completed on: '}
                    {new Date(selectedApplicant.tourDate).toLocaleDateString()}{' '}
                    at{' '}
                    {new Date(selectedApplicant.tourDate).toLocaleTimeString(
                      [],
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                )}
              </div>
            </div>
            {selectedApplicant.tourStatus === 'requested' && (
              <button
                onClick={() => onScheduleTour(selectedApplicant)}
                className="px-3 py-1 bg-white rounded text-xs font-medium hover:bg-gray-50"
              >
                Schedule Tour
              </button>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Application Details</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Move-in Date
                </label>
                <p className="font-medium">
                  {new Date(
                    selectedApplicant.application.moveInDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Move-out Date
                </label>
                <p className="font-medium">
                  {new Date(
                    selectedApplicant.application.moveOutDate
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Employment Status
              </label>
              <p className="font-medium">
                {selectedApplicant.application.employmentStatus}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Emergency Contact
              </label>
              <p className="font-medium">
                {selectedApplicant.application.emergencyContact}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                References
              </label>
              <ul className="space-y-1">
                {selectedApplicant.application.references.map((ref, index) => (
                  <li key={index} className="text-sm">
                    • {ref}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Personal Message
              </label>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm">
                  {selectedApplicant.application.message}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Documents Provided
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.application.documents.map((doc, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-brand-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    <FileText size={12} className="mr-1" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {selectedApplicant.application.rentalProfile && (
              <RentalApplicationCard
                profile={selectedApplicant.application.rentalProfile}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {selectedApplicant.status === 'pending' && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => onSendMessage(selectedApplicant)}
              className="flex items-center justify-center py-3 border border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50"
            >
              <MessageCircle size={20} className="mr-2" />
              Message
            </button>
            <button
              onClick={() => handleRejectApplication(selectedApplicant.id)}
              className="flex items-center justify-center py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
            >
              <X size={20} className="mr-2" />
              Decline
            </button>
            <button
              onClick={() => handleApproveApplication(selectedApplicant.id)}
              className="flex items-center justify-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check size={20} className="mr-2" />
              Approve
            </button>
          </div>
        )}

        {/* Schedule Tour */}
        <button
          onClick={() => onScheduleTour(selectedApplicant)}
          className="w-full py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium flex items-center justify-center"
        >
          <Calendar size={20} className="mr-2" />
          Schedule Property Tour
        </button>
      </div>
    )
  }
}

export default LandlordInbox
