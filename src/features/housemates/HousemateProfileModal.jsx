import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  X,
  CheckCircle,
  Briefcase,
  Star,
  MapPin,
  User,
  MessageCircle,
  Loader2,
  Ban,
  Flag,
  Users,
  GraduationCap,
  CalendarDays,
  Check,
  Minus,
  ArrowLeftRight,
} from 'lucide-react'
import {
  genderLabels,
  lifestyleSummary,
  reportReasons,
  optionLabel,
  dimensionLabel,
  formatMoveIn,
} from './housemateConfig'
import GroupInvitePicker from './GroupInvitePicker'
import SafetyNote from './SafetyNote'

/**
 * Side-by-side view of a match: what you both answered, where you are close,
 * and where you are opposed. This is the "why" behind the percentage.
 */
function MatchBreakdown({ breakdown, firstName }) {
  if (!breakdown) return null
  const rows = [
    ...breakdown.shared.map(d => ({ ...d, kind: 'shared' })),
    ...breakdown.partial.map(d => ({ ...d, kind: 'partial' })),
    ...breakdown.differs.map(d => ({ ...d, kind: 'differs' })),
  ]
  if (breakdown.budget) {
    rows.push({
      key: 'budget',
      kind:
        breakdown.budget === 'full'
          ? 'shared'
          : breakdown.budget === 'partial'
            ? 'partial'
            : 'differs',
    })
  }
  if (rows.length === 0) return null

  const icon = kind =>
    kind === 'shared' ? (
      <Check size={14} className="text-green-600" />
    ) : kind === 'partial' ? (
      <ArrowLeftRight size={14} className="text-amber-500" />
    ) : (
      <Minus size={14} className="text-gray-400" />
    )

  const cell = (d, side) => {
    if (d.key === 'budget') {
      return breakdown.budget === 'full'
        ? 'Overlaps'
        : breakdown.budget === 'partial'
          ? 'Partly overlaps'
          : 'No overlap'
    }
    if (d.kind === 'shared') return optionLabel(d.key, d.value)
    return optionLabel(d.key, side === 'you' ? d.viewer : d.candidate)
  }

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-800 mb-2">
        Why you match
      </h3>
      <div className="rounded-lg border border-gray-100 overflow-hidden text-sm">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 px-3 py-1.5">
          <span />
          <span>You</span>
          <span>{firstName}</span>
        </div>
        {rows.map(d => (
          <div
            key={d.key}
            className="grid grid-cols-[1.2fr_1fr_1fr] items-center px-3 py-1.5 border-t border-gray-100"
          >
            <span className="flex items-center gap-1.5 text-gray-600">
              {icon(d.kind)}
              {dimensionLabel(d.key)}
            </span>
            <span
              className={
                d.kind === 'shared'
                  ? 'text-green-700 font-medium'
                  : 'text-gray-800'
              }
            >
              {cell(d, 'you')}
            </span>
            <span
              className={
                d.kind === 'shared'
                  ? 'text-green-700 font-medium'
                  : 'text-gray-800'
              }
            >
              {cell(d, 'them')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

MatchBreakdown.propTypes = {
  breakdown: PropTypes.object,
  firstName: PropTypes.string,
}

/**
 * Full housemate profile view, shown as a modal when a card is opened.
 * Renders everything the card summarizes plus the match breakdown and the
 * lifestyle answers, and hosts Message, Invite to a group, Block and Report.
 */
export default function HousemateProfileModal({
  profile,
  onClose,
  onMessage,
  onBlock,
  onReport,
  onTakeQuiz,
  messaging,
  error,
  preview = false,
}) {
  // The parent renders this modal with key={profile.id}, so a different
  // profile remounts it and resets all of this naturally.
  const [blockConfirm, setBlockConfirm] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  if (!profile) return null
  const u = profile.user || {}
  const lifestyle = lifestyleSummary(profile)
  const budget =
    profile.budgetMin && profile.budgetMax
      ? `$${profile.budgetMin}–$${profile.budgetMax}/mo`
      : null
  const university = profile.university || u.university || null
  const moveIn = formatMoveIn(profile.moveInMonth)
  // Safety controls and messaging need a real user behind the profile.
  const isReal = !preview && Boolean(u.id)

  const handleBlockClick = async () => {
    if (!blockConfirm) {
      setBlockConfirm(true)
      return
    }
    setBlocking(true)
    await onBlock(profile)
    setBlocking(false)
  }

  const handleReportSubmit = async () => {
    setReporting(true)
    try {
      await onReport(profile, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      })
      setReportSent(true)
    } catch {
      // Leave the form open; the shared error line explains.
    }
    setReporting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={
        preview
          ? 'Your profile preview'
          : `${u.firstName || 'Housemate'} profile`
      }
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <img
              src={u.avatarUrl || 'https://via.placeholder.com/96?text=%20'}
              alt={u.firstName || 'Housemate'}
              className="w-20 h-20 rounded-full object-cover bg-white/20"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="text-xl font-bold truncate">
                  {u.firstName} {u.lastName}
                  {profile.age ? `, ${profile.age}` : ''}
                </h2>
                {u.verified && (
                  <span title="Email confirmed">
                    <CheckCircle size={18} className="flex-shrink-0" />
                  </span>
                )}
              </div>
              {profile.occupation && (
                <div className="flex items-center text-sm text-blue-50">
                  <Briefcase size={14} className="mr-1" />
                  {profile.occupation}
                </div>
              )}
              <div className="mt-1 inline-flex items-center bg-white/20 rounded-full px-2 py-0.5 text-sm font-medium">
                {preview ? (
                  'This is how others see you'
                ) : profile.compatibilityScore != null ? (
                  <>
                    <Star size={13} className="fill-current mr-1" />
                    {profile.compatibilityScore}% match
                  </>
                ) : (
                  <button
                    onClick={onTakeQuiz}
                    className="underline underline-offset-2"
                  >
                    Take the quiz to see your match
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {university && (
              <span
                className={`flex items-center ${
                  profile.sameUniversity ? 'text-green-700 font-medium' : ''
                }`}
              >
                <GraduationCap size={14} className="mr-1" />
                {university}
                {profile.sameUniversity ? ' · same as you' : ''}
              </span>
            )}
            <span className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {profile.location || 'Location flexible'}
            </span>
            {moveIn && (
              <span className="flex items-center">
                <CalendarDays size={14} className="mr-1" />
                Move in {moveIn}
              </span>
            )}
            {budget && (
              <span className="font-medium text-gray-800">{budget}</span>
            )}
            {profile.gender && genderLabels[profile.gender] && (
              <span className="flex items-center">
                <User size={14} className="mr-1" />
                {genderLabels[profile.gender]}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {!preview && (
            <MatchBreakdown
              breakdown={profile.matchBreakdown}
              firstName={u.firstName || 'Them'}
            />
          )}

          {lifestyle.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2">
                {preview ? 'How you live' : 'How they live'}
              </h3>
              <div className="space-y-1.5">
                {lifestyle.map(row => (
                  <div
                    key={row.id}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{row.question}</span>
                    <span className="font-medium text-gray-800 text-right flex-shrink-0">
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {preview ? (
            <button
              onClick={onClose}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close preview
            </button>
          ) : inviteOpen && isReal ? (
            <GroupInvitePicker
              candidate={profile}
              onClose={() => setInviteOpen(false)}
            />
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onMessage(profile)}
                disabled={messaging}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg flex items-center justify-center font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {messaging ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <MessageCircle size={16} className="mr-1" />
                )}
                Message for free
              </button>
              {isReal && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="flex-1 border border-blue-600 text-blue-600 py-2.5 rounded-lg flex items-center justify-center font-medium hover:bg-blue-50 transition-colors"
                >
                  <Users size={16} className="mr-1" />
                  Invite to a group
                </button>
              )}
            </div>
          )}

          {/* Safety controls: real profiles only */}
          {isReal && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              {reportSent ? (
                <p className="text-sm text-green-700">
                  Thanks. Our team will review this report.
                </p>
              ) : reportOpen ? (
                <div className="space-y-2">
                  <label
                    htmlFor="report-reason"
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Why are you reporting this profile?
                  </label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {reportReasons.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    maxLength={1000}
                    placeholder="Anything that helps us review (optional)"
                    onChange={e => setReportDetails(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReportSubmit}
                      disabled={reporting}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {reporting ? 'Sending…' : 'Submit report'}
                    </button>
                    <button
                      onClick={() => setReportOpen(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-6 text-sm">
                  <button
                    onClick={handleBlockClick}
                    disabled={blocking}
                    className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
                      blockConfirm
                        ? 'text-red-600 font-semibold hover:text-red-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Ban size={14} />
                    {blocking
                      ? 'Blocking…'
                      : blockConfirm
                        ? 'Confirm block'
                        : 'Block'}
                  </button>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Flag size={14} />
                    Report
                  </button>
                </div>
              )}
              <SafetyNote compact />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

HousemateProfileModal.propTypes = {
  profile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  onTakeQuiz: PropTypes.func.isRequired,
  messaging: PropTypes.bool,
  error: PropTypes.string,
  preview: PropTypes.bool,
}
