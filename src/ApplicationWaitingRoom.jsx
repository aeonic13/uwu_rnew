import React, { useState } from 'react'
import {
  CheckCircle,
  Clock,
  XCircle,
  User,
  Shield,
  Bell,
  ArrowLeft,
  Users,
  DollarSign,
  Home,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a flat checklist from the members[] array.
 * Each member contributes 1-3 items: ID check, App complete, Guarantor (if present).
 * Fully dynamic — works for any group size and any mix of guarantors.
 */
const buildChecklist = members =>
  members.flatMap(member => {
    const items = [
      {
        id: `id-${member.name}`,
        memberName: member.name,
        type: 'id',
        label: 'Government ID Verified',
        // Treat complete apps as having passed ID (mock)
        status:
          member.applicationStatus === 'complete' ? 'verified' : 'pending',
      },
      {
        id: `app-${member.name}`,
        memberName: member.name,
        type: 'application',
        label: 'Application Complete',
        status:
          member.applicationStatus === 'complete' ? 'verified' : 'pending',
      },
    ]

    if (member.guarantor) {
      items.push({
        id: `guar-${member.name}`,
        memberName: member.guarantor.name,
        forTenant: member.name,
        type: 'guarantor',
        label: 'Income & ID Verified',
        status:
          member.guarantor.verificationStatus === 'verified'
            ? 'verified'
            : member.guarantor.verificationStatus === 'pending'
              ? 'pending'
              : 'not_started',
      })
    }

    return items
  })

const statusIcon = status => {
  if (status === 'verified')
    return <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
  if (status === 'pending')
    return <Clock size={18} className="text-yellow-500 flex-shrink-0" />
  return <XCircle size={18} className="text-red-400 flex-shrink-0" />
}

const statusLabel = status => {
  if (status === 'verified')
    return { text: 'Verified', cls: 'bg-green-100 text-green-700' }
  if (status === 'pending')
    return { text: 'In Progress', cls: 'bg-yellow-100 text-yellow-700' }
  return { text: 'Not Started', cls: 'bg-red-100 text-red-600' }
}

const PIPELINE_STAGES = [
  { key: 'pending_verifications', label: 'Verifying' },
  { key: 'ready_for_review', label: 'Ready' },
  { key: 'applicants_approved', label: 'Approved' },
  { key: 'lease_sent', label: 'Lease Sent' },
  { key: 'fully_executed', label: 'Executed' },
]

const PipelineStepper = ({ currentStage }) => {
  const idx = PIPELINE_STAGES.findIndex(s => s.key === currentStage)
  return (
    <div className="flex items-center overflow-x-auto py-1">
      {PIPELINE_STAGES.map((stage, i) => (
        <React.Fragment key={stage.key}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < idx
                  ? 'bg-green-500 border-green-500 text-white'
                  : i === idx
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {i < idx ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs mt-1 ${i === idx ? 'text-brand-500 font-semibold' : 'text-gray-400'}`}
            >
              {stage.label}
            </span>
          </div>
          {i < PIPELINE_STAGES.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 mt-[-14px] ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ApplicationWaitingRoom = ({
  groupApplication,
  listing,
  onBack,
  onReviewApplication, // called when status = ready_for_review
}) => {
  const [nudgedIds, setNudgedIds] = useState(new Set())
  const [appData, setAppData] = useState({
    ...groupApplication,
    // Ensure status field exists
    status: groupApplication?.status || 'pending_verifications',
  })

  const checklist = buildChecklist(appData.members || [])
  const pendingItems = checklist.filter(c => c.status !== 'verified')
  const allVerified = pendingItems.length === 0

  // Effective status
  const effectiveStatus =
    allVerified && appData.status === 'pending_verifications'
      ? 'ready_for_review'
      : appData.status

  // Nudge simulation: mark item as pending (would send SMS/email in prod)
  const handleNudge = itemId => {
    setNudgedIds(prev => new Set([...prev, itemId]))
    // Simulate gradual verification for demo
    setTimeout(() => {
      setAppData(prev => ({
        ...prev,
        members: prev.members.map(m => {
          if (`guar-${m.name}` === itemId && m.guarantor) {
            return {
              ...m,
              guarantor: { ...m.guarantor, verificationStatus: 'pending' },
            }
          }
          if (`app-${m.name}` === itemId || `id-${m.name}` === itemId) {
            return { ...m, applicationStatus: 'complete' }
          }
          return m
        }),
      }))
    }, 2000)
  }

  // Simulate a single item completing (for demo "refresh")
  const handleSimulateProgress = () => {
    const firstPending = checklist.find(c => c.status !== 'verified')
    if (!firstPending) return
    setAppData(prev => ({
      ...prev,
      members: prev.members.map(m => {
        if (
          firstPending.type === 'guarantor' &&
          firstPending.forTenant === m.name &&
          m.guarantor
        ) {
          return {
            ...m,
            guarantor: { ...m.guarantor, verificationStatus: 'verified' },
          }
        }
        if (
          (firstPending.type === 'application' || firstPending.type === 'id') &&
          firstPending.memberName === m.name
        ) {
          return { ...m, applicationStatus: 'complete' }
        }
        return m
      }),
    }))
  }

  const incomeMultiple = listing?.requirements?.incomeMultiple || 3
  const rentRequired = listing?.price || appData.rentRequired || 0
  const incomeThreshold = rentRequired * incomeMultiple
  const combinedIncome =
    appData.members?.reduce((s, m) => s + (m.monthlyIncome || 0), 0) || 0

  // Counts
  const totalMembers = appData.members?.length || 0
  const totalGuarantors = appData.members?.filter(m => m.guarantor).length || 0

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center text-brand-500 text-sm font-medium"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Applications
      </button>

      {/* Group header */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center mb-1">
          <Users size={16} className="text-purple-600 mr-2" />
          <span className="font-semibold text-purple-800">
            {appData.groupName}
          </span>
        </div>
        <div className="flex items-center text-sm text-purple-700 mt-1">
          <Home size={13} className="mr-1" />
          <span>{listing?.title || appData.propertyTitle}</span>
        </div>
        <div className="flex gap-3 mt-2 text-xs text-purple-600">
          <span>
            {totalMembers} tenant{totalMembers !== 1 ? 's' : ''}
          </span>
          {totalGuarantors > 0 && (
            <span>
              · {totalGuarantors} guarantor{totalGuarantors !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Application Pipeline
        </p>
        <PipelineStepper currentStage={effectiveStatus} />
      </div>

      {/* Overall status banner */}
      {allVerified ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
          <CheckCircle
            size={20}
            className="text-green-600 mr-3 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-semibold text-green-800">
              All verifications complete!
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              This application is ready for your review and approval.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
          <AlertTriangle
            size={20}
            className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-semibold text-yellow-800">
              {pendingItems.length} verification
              {pendingItems.length !== 1 ? 's' : ''} pending
            </p>
            <p className="text-sm text-yellow-700 mt-0.5">
              The system sends automatic reminders. You can also nudge
              individuals below.
            </p>
          </div>
        </div>
      )}

      {/* Income check */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold mb-3 text-sm">Combined Income Check</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-brand-500">
              ${combinedIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Combined/mo</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700">
              ${incomeThreshold.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{incomeMultiple}× required</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                combinedIncome >= incomeThreshold
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {combinedIncome >= incomeThreshold ? '✓ Meets' : '✗ Short'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic checklist — one section per member */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Verification Checklist</h3>
          {!allVerified && (
            <button
              onClick={handleSimulateProgress}
              className="flex items-center text-xs text-brand-500 font-medium hover:underline"
            >
              <RefreshCw size={13} className="mr-1" /> Simulate update
            </button>
          )}
        </div>

        {appData.members?.map((member, mi) => {
          const memberItems = checklist.filter(
            c => c.memberName === member.name || c.forTenant === member.name
          )

          return (
            <div
              key={mi}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Member header */}
              <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                  <User size={15} className="text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span className="text-xs text-gray-500">
                  ${(member.monthlyIncome || 0).toLocaleString()}/mo
                </span>
              </div>

              {/* Per-item rows */}
              {memberItems.map(item => {
                const sl = statusLabel(item.status)
                const isNudgeable = item.status !== 'verified'
                const nudged = nudgedIds.has(item.id)

                return (
                  <div
                    key={item.id}
                    className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0"
                  >
                    {/* Role icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        item.type === 'guarantor'
                          ? 'bg-purple-100'
                          : 'bg-brand-50'
                      }`}
                    >
                      {item.type === 'guarantor' ? (
                        <Shield size={13} className="text-purple-600" />
                      ) : (
                        <User size={13} className="text-brand-500" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.type === 'guarantor'
                          ? `Guarantor: ${item.memberName}`
                          : item.label}
                      </p>
                      {item.type === 'guarantor' && (
                        <p className="text-xs text-gray-400">{item.label}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.cls}`}
                      >
                        {sl.text}
                      </span>
                      {statusIcon(item.status)}
                    </div>

                    {/* Nudge */}
                    {isNudgeable && (
                      <button
                        onClick={() => handleNudge(item.id)}
                        disabled={nudged}
                        className={`ml-3 flex items-center text-xs px-2 py-1 rounded-lg border transition-colors flex-shrink-0 ${
                          nudged
                            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-default'
                            : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        <Bell size={11} className="mr-1" />
                        {nudged ? 'Sent' : 'Nudge'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => onReviewApplication(appData)}
        disabled={!allVerified}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-colors ${
          allVerified
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {allVerified ? (
          <>
            <CheckCircle size={18} className="mr-2" /> Review Application
          </>
        ) : (
          <>
            <Clock size={18} className="mr-2" /> Waiting for verifications…
          </>
        )}
      </button>
      {!allVerified && (
        <p className="text-center text-xs text-gray-400">
          Once all {checklist.length} items are verified, you can review and
          approve.
        </p>
      )}
    </div>
  )
}

export default ApplicationWaitingRoom
