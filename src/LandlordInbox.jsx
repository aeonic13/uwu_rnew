import React, { useState } from 'react'
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

// ─── Mock group applications data (Screen 8) ─────────────────────────────────
const mockGroupApplications = [
  {
    id: 'ga-001',
    propertyId: 1,
    propertyTitle: 'Cozy 1BR near USC Campus',
    groupName: 'The Senior Year Squad',
    submittedAt: '2024-12-22T09:00:00Z',
    // Pipeline status — all verifications done, ready to review
    status: 'ready_for_review',
    tourStatus: 'scheduled',
    tourDate: '2024-12-26T15:00:00Z',
    combinedMonthlyIncome: 14800,
    rentRequired: 1200,
    meetsRequirement: true,
    members: [
      {
        name: 'Sarah Kim',
        email: 'sarah.k@usc.edu',
        university: 'USC',
        applicationStatus: 'complete',
        guarantor: {
          name: 'Jane Kim',
          email: 'jane@email.com',
          verificationStatus: 'verified',
        },
        monthlyIncome: 3200,
      },
      {
        name: 'Mike Torres',
        email: 'mike.t@usc.edu',
        university: 'USC',
        applicationStatus: 'complete',
        guarantor: {
          name: 'Tom Torres',
          email: 'tom@email.com',
          verificationStatus: 'verified',
        },
        monthlyIncome: 2800,
      },
      {
        name: 'David Park',
        email: 'david.p@usc.edu',
        university: 'USC',
        applicationStatus: 'complete',
        guarantor: null,
        monthlyIncome: 8800,
      },
    ],
  },
  {
    id: 'ga-002',
    propertyId: 2,
    propertyTitle: 'Shared House - UCLA Area',
    groupName: 'UCLA Roomies',
    submittedAt: '2024-12-21T14:30:00Z',
    // Still waiting on one guarantor
    status: 'pending_verifications',
    tourStatus: 'requested',
    combinedMonthlyIncome: 9600,
    rentRequired: 850,
    meetsRequirement: true,
    members: [
      {
        name: 'Emma Chen',
        email: 'emma.c@ucla.edu',
        university: 'UCLA',
        applicationStatus: 'complete',
        guarantor: {
          name: 'Wei Chen',
          email: 'wei@email.com',
          verificationStatus: 'verified',
        },
        monthlyIncome: 4800,
      },
      {
        name: 'Lucas Rivera',
        email: 'lucas.r@ucla.edu',
        university: 'UCLA',
        applicationStatus: 'pending',
        guarantor: {
          name: 'Maria Rivera',
          email: 'maria@email.com',
          verificationStatus: 'not_invited',
        },
        monthlyIncome: 4800,
      },
    ],
  },
  {
    id: 'ga-003',
    propertyId: 1,
    propertyTitle: 'Cozy 1BR near USC Campus',
    groupName: 'The Westside Five',
    submittedAt: '2024-12-20T11:00:00Z',
    status: 'pending_verifications',
    tourStatus: 'not-requested',
    combinedMonthlyIncome: 21000,
    rentRequired: 1200,
    meetsRequirement: true,
    members: [
      {
        name: 'Aisha Johnson',
        email: 'aisha.j@usc.edu',
        university: 'USC',
        applicationStatus: 'complete',
        guarantor: {
          name: 'Derek Johnson',
          email: 'derek@email.com',
          verificationStatus: 'verified',
        },
        monthlyIncome: 5000,
      },
      {
        name: 'Priya Nair',
        email: 'priya.n@usc.edu',
        university: 'USC',
        applicationStatus: 'complete',
        guarantor: {
          name: 'Anand Nair',
          email: 'anand@email.com',
          verificationStatus: 'pending',
        },
        monthlyIncome: 4200,
      },
      {
        name: 'James Wu',
        email: 'james.w@usc.edu',
        university: 'USC',
        applicationStatus: 'pending',
        guarantor: null,
        monthlyIncome: 11800,
      },
    ],
  },
]

const GroupApplicationsTab = ({
  onApproveGroup,
  onNavigateToMultiPartyLease,
  onOpenWaitingRoom,
  onOpenChat,
}) => {
  const [groups, setGroups] = useState(mockGroupApplications)
  const [selectedGroup, setSelectedGroup] = useState(null)

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

  const handleApproveApplicants = app => {
    const updated = { ...app, status: 'applicants_approved' }
    setGroups(prev => prev.map(g => (g.id === app.id ? updated : g)))
    setSelectedGroup(updated)
    onApproveGroup(updated)
  }

  if (selectedGroup) {
    const app = selectedGroup
    const allVerified = app.members.every(
      m => !m.guarantor || m.guarantor.verificationStatus === 'verified'
    )
    const allComplete = app.members.every(
      m => m.applicationStatus === 'complete'
    )
    const readyToApprove = allVerified && allComplete && app.meetsRequirement
    const alreadyApproved = [
      'applicants_approved',
      'lease_sent',
      'pending_signatures',
      'fully_executed',
    ].includes(app.status)

    // Counts
    const guarantorCount = app.members.filter(m => m.guarantor).length

    return (
      <div className="p-4 pb-24 space-y-5">
        <button
          onClick={() => setSelectedGroup(null)}
          className="flex items-center text-brand-500 text-sm font-medium mb-2"
        >
          ← Back to Group Applications
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
            {stageBadge(app.status)}
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

        {/* Action buttons — pipeline-aware */}
        {app.status === 'pending_verifications' && (
          <button
            onClick={() => onOpenWaitingRoom(app)}
            className="w-full py-3 rounded-xl font-semibold border-2 border-brand-500 text-brand-500 hover:bg-brand-50 flex items-center justify-center transition-colors"
          >
            <Clock size={18} className="mr-2" />
            View Verification Waiting Room
          </button>
        )}

        {app.status === 'ready_for_review' && (
          <button
            onClick={() => handleApproveApplicants(app)}
            disabled={!readyToApprove}
            className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
              readyToApprove
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={18} className="mr-2" />
            Approve Applicants
          </button>
        )}

        {app.status === 'applicants_approved' && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <CheckCircle size={16} className="inline text-green-600 mr-1" />
              <span className="text-sm font-semibold text-green-800">
                Applicants approved!
              </span>
              <p className="text-xs text-green-700 mt-1">
                Open the group chat to communicate and send the lease when
                ready.
              </p>
            </div>
            <button
              onClick={() => onOpenChat(app)}
              className="w-full py-3 rounded-xl font-semibold bg-brand-500 text-white hover:bg-brand-600 flex items-center justify-center transition-colors"
            >
              <MessageCircle size={18} className="mr-2" />
              Open Group Chat Thread
            </button>
          </div>
        )}

        {['lease_sent', 'pending_signatures'].includes(app.status) && (
          <button
            onClick={() => onNavigateToMultiPartyLease(app)}
            className="w-full py-3 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center"
          >
            <FileText size={18} className="mr-2" />
            View Lease Signatures
          </button>
        )}

        {app.status === 'fully_executed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
            <p className="font-semibold text-green-800">Lease Fully Executed</p>
            <p className="text-xs text-green-700 mt-1">
              All parties have signed. Property is now LEASED.
            </p>
          </div>
        )}

        {!alreadyApproved &&
          !readyToApprove &&
          app.status !== 'pending_verifications' && (
            <p className="text-center text-xs text-gray-500">
              {!allComplete && 'Waiting for all applications to complete. '}
              {!allVerified && 'Some guarantors have not yet verified. '}
              {!app.meetsRequirement &&
                'Combined income does not meet the requirement.'}
            </p>
          )}
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="font-semibold text-purple-800 mb-1">Group Applications</p>
        <p className="text-sm text-purple-700">
          Track verifications, review combined income &amp; guarantors, then
          approve and send a joint lease.
        </p>
      </div>

      {groups.map(app => {
        const totalGuarantors = app.members.filter(m => m.guarantor).length
        return (
          <div
            key={app.id}
            onClick={() => setSelectedGroup(app)}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Users size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">{app.groupName}</p>
                  <p className="text-xs text-gray-500">
                    {app.propertyTitle} · {app.members.length} tenant
                    {app.members.length !== 1 ? 's' : ''}
                    {totalGuarantors > 0 &&
                      `, ${totalGuarantors} guarantor${totalGuarantors !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              {stageBadge(app.status)}
            </div>

            <div className="flex items-center justify-between">
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
                {app.meetsRequirement ? '✓ Income Met' : '✗ Short'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LandlordInbox = ({
  properties,
  onSelectApplicant,
  onSendMessage,
  onScheduleTour,
  onSendLease,
  onNavigateToApprovals,
  onNavigateToUtilities,
  onApproveGroupApplication,
  onNavigateToMultiPartyLease,
  onOpenWaitingRoom,
  onOpenGroupChat,
}) => {
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [viewMode, setViewMode] = useState('inbox') // 'inbox', 'applicant-detail'
  const [activeTab, setActiveTab] = useState('individual') // 'individual' | 'group'

  // Mock applicant data with credit scores and details
  const mockApplications = [
    {
      id: 1,
      propertyId: 1,
      propertyTitle: 'Cozy 1BR near USC Campus',
      applicant: {
        id: 'app1',
        name: 'Emily Rodriguez',
        email: 'emily.r@usc.edu',
        phone: '(555) 123-4567',
        university: 'USC',
        year: 'Senior',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
        creditScore: 742,
        creditTier: 'Excellent',
        verified: true,
        backgroundCheck: 'Passed',
      },
      application: {
        moveInDate: '2024-01-15',
        moveOutDate: '2024-06-15',
        monthlyIncome: 3500,
        employmentStatus: 'Part-time + Financial Aid',
        emergencyContact: 'Maria Rodriguez (Mother) - (555) 987-6543',
        references: ['Prof. Johnson - USC', 'Previous Landlord - John Smith'],
        message:
          "Hi! I'm a responsible senior at USC looking for a quiet place to study. I have excellent references and have never missed a rent payment.",
        appliedAt: '2024-12-20T10:30:00Z',
        documents: ['Student ID', 'Income Verification', 'References'],
      },
      status: 'pending', // 'pending', 'approved', 'rejected'
      tourStatus: 'scheduled', // 'not-requested', 'requested', 'scheduled', 'completed'
      tourDate: '2024-12-25T14:00:00Z',
      messages: 3,
      lastMessage: '2 hours ago',
    },
    {
      id: 2,
      propertyId: 1,
      propertyTitle: 'Cozy 1BR near USC Campus',
      applicant: {
        id: 'app2',
        name: 'Michael Chen',
        email: 'mchen@ucla.edu',
        phone: '(555) 234-5678',
        university: 'UCLA',
        year: 'Graduate Student',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        creditScore: 678,
        creditTier: 'Good',
        verified: true,
        backgroundCheck: 'Passed',
      },
      application: {
        moveInDate: '2024-02-01',
        moveOutDate: '2024-08-01',
        monthlyIncome: 2800,
        employmentStatus: 'Graduate Research Assistant',
        emergencyContact: 'Lisa Chen (Sister) - (555) 876-5432',
        references: ['Dr. Kim - UCLA', 'Current Roommate - Alex Wong'],
        message:
          "I'm a quiet graduate student focusing on my research. Looking for a peaceful place close to campus with good study environment.",
        appliedAt: '2024-12-19T14:20:00Z',
        documents: [
          'Student ID',
          'Research Assistant Contract',
          'Bank Statements',
        ],
      },
      status: 'pending',
      tourStatus: 'requested',
      messages: 1,
      lastMessage: '1 day ago',
    },
    {
      id: 3,
      propertyId: 2,
      propertyTitle: 'Shared House - UCLA Area',
      applicant: {
        id: 'app3',
        name: 'Sarah Johnson',
        email: 'sarah.j@berkeley.edu',
        phone: '(555) 345-6789',
        university: 'UC Berkeley',
        year: 'Junior',
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        creditScore: 695,
        creditTier: 'Good',
        verified: true,
        backgroundCheck: 'Passed',
      },
      application: {
        moveInDate: '2024-01-20',
        moveOutDate: '2024-05-20',
        monthlyIncome: 3200,
        employmentStatus: 'Student + Part-time job',
        emergencyContact: 'Robert Johnson (Father) - (555) 765-4321',
        references: ['Manager at Starbucks', 'Professor Williams'],
        message:
          'Clean, responsible student looking for a place during my semester abroad program. Non-smoker, no parties.',
        appliedAt: '2024-12-18T16:45:00Z',
        documents: ['Student ID', 'Pay Stubs', 'Parent Guarantor Form'],
      },
      status: 'approved',
      tourStatus: 'completed',
      tourDate: '2024-12-18T10:00:00Z',
      messages: 5,
      lastMessage: '30 minutes ago',
    },
  ]

  const getPropertyApplications = propertyId => {
    return mockApplications.filter(
      app => !propertyId || app.propertyId === propertyId
    )
  }

  const getCreditScoreColor = score => {
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

  const handleApproveApplication = applicationId => {
    // Update application status and trigger lease sending
    console.log('Approving application:', applicationId)
    onSendLease?.(applicationId)
  }

  const handleRejectApplication = applicationId => {
    console.log('Rejecting application:', applicationId)
  }

  // Inbox View
  if (viewMode === 'inbox') {
    const applications = getPropertyApplications(selectedProperty)

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
              Review applications and manage your properties
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === 'individual'
                  ? 'bg-white text-brand-500 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <User size={14} className="mr-1" /> Individual
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === 'group'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <Users size={14} className="mr-1" /> Group
              <span className="ml-1 bg-purple-100 text-purple-700 text-xs px-1.5 rounded-full">
                {mockGroupApplications.length}
              </span>
            </button>
          </div>
        </div>
        {/* end p-4 */}

        {/* Group Applications Tab */}
        {activeTab === 'group' && (
          <GroupApplicationsTab
            onApproveGroup={app => onApproveGroupApplication?.(app)}
            onNavigateToMultiPartyLease={app =>
              onNavigateToMultiPartyLease?.(app)
            }
            onOpenWaitingRoom={app => onOpenWaitingRoom?.(app)}
            onOpenChat={app => onOpenGroupChat?.(app)}
          />
        )}

        {activeTab === 'individual' && (
          <div className="p-4">
            {/* Property Filter */}
            <div className="mb-6">
              <select
                value={selectedProperty || ''}
                onChange={e =>
                  setSelectedProperty(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Properties</option>
                <option value={1}>Cozy 1BR near USC Campus</option>
                <option value={2}>Shared House - UCLA Area</option>
                <option value={3}>Studio Apartment - NYU</option>
              </select>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Applications Yet
                </h3>
                <p className="text-gray-500">
                  Applications will appear here when people apply to your
                  properties
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(application => (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedApplicant(application)
                      setViewMode('applicant-detail')
                    }}
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
                            <h3 className="font-semibold">
                              {application.applicant.name}
                            </h3>
                            {application.applicant.verified && (
                              <Shield
                                size={16}
                                className="ml-2 text-brand-500"
                              />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {application.applicant.university} •{' '}
                            {application.applicant.year}
                          </p>
                          <p className="text-xs text-gray-500">
                            {application.propertyTitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
                          {application.applicant.creditScore}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {application.applicant.creditTier}
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
                        {application.tourDate &&
                          application.tourStatus === 'scheduled' && (
                            <span className="ml-2 text-xs">
                              •{' '}
                              {new Date(
                                application.tourDate
                              ).toLocaleDateString()}{' '}
                              at{' '}
                              {new Date(
                                application.tourDate
                              ).toLocaleTimeString([], {
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
                          {new Date(
                            application.application.moveInDate
                          ).toLocaleDateString()}{' '}
                          -{' '}
                          {new Date(
                            application.application.moveOutDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        <span>Applied {application.lastMessage}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-3">
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
                  {selectedApplicant.applicant.creditScore}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  ({selectedApplicant.applicant.creditTier})
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
