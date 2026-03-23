import React, { useState } from 'react'
import {
  Users,
  User,
  Plus,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone,
  Bell,
  ArrowLeft,
  Shield,
  Home,
  DollarSign,
  AlertTriangle,
  X,
  UserPlus,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GUARANTEE_REQUIRED_INCOME_MULTIPLE = 4

const memberStatusIcon = verificationStatus => {
  if (verificationStatus === 'verified')
    return <CheckCircle size={16} className="text-green-500" />
  if (verificationStatus === 'pending')
    return <Clock size={16} className="text-yellow-500" />
  return <XCircle size={16} className="text-red-400" />
}

const memberStatusLabel = (appStatus, guarantorStatus) => {
  if (appStatus !== 'complete') return { text: 'Application Pending', color: 'text-red-500' }
  if (guarantorStatus === 'verified') return { text: 'Guarantor Verified', color: 'text-green-600' }
  if (guarantorStatus === 'pending') return { text: 'Guarantor Pending Verification', color: 'text-yellow-600' }
  if (guarantorStatus === 'not_invited') return { text: 'Guarantor Not Invited Yet', color: 'text-red-500' }
  return { text: 'No Guarantor Required', color: 'text-green-600' }
}

// ─── Screen 1: Kickoff & Group Selection ────────────────────────────────────

const KickoffScreen = ({ listing, roommateGroups, onSolo, onSelectGroup, onCreateGroup }) => {
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmails, setNewGroupEmails] = useState('')

  const handleCreate = () => {
    if (!newGroupName.trim()) return
    const emails = newGroupEmails.split(',').map(e => e.trim()).filter(Boolean)
    onCreateGroup({ name: newGroupName, inviteEmails: emails })
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Property banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-1">
          <Home size={16} className="text-blue-600 mr-2" />
          <span className="font-semibold text-blue-800">{listing.title}</span>
        </div>
        <div className="flex items-center text-sm text-blue-700">
          <DollarSign size={14} className="mr-1" />
          <span>${listing.price}/mo &nbsp;·&nbsp; {listing.location}</span>
        </div>
      </div>

      {/* Income requirement notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
        <AlertTriangle size={18} className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-800">
          This property requires <strong>{GUARANTEE_REQUIRED_INCOME_MULTIPLE}× monthly rent</strong> in
          verified income. Students who don't meet this individually may add a guarantor.
        </p>
      </div>

      <h2 className="text-lg font-bold">Who is applying for this property?</h2>

      {/* Solo */}
      <button
        onClick={onSolo}
        className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
      >
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
          <User size={20} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Just Me (Solo)</p>
          <p className="text-sm text-gray-500">Apply individually with your own guarantor if needed</p>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </button>

      {/* Existing groups */}
      {roommateGroups.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Select an Existing Group</p>
          {roommateGroups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Users size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{group.name}</p>
                <p className="text-sm text-gray-500">
                  {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                  {group.members?.length > 0 &&
                    ` · ${group.members.map(m => m.name || m.userId).join(', ')}`}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Create new group */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <Plus size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700">Create a New Group</p>
            <p className="text-sm text-gray-500">Invite roommates by email — group is saved for future applications</p>
          </div>
        </button>
      ) : (
        <div className="border-2 border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50">
          <div className="flex justify-between items-center">
            <p className="font-semibold">New Group</p>
            <button onClick={() => setShowCreate(false)}>
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder='e.g. "The Senior Year Squad"'
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Roommate Emails <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={newGroupEmails}
              onChange={e => setNewGroupEmails(e.target.value)}
              placeholder="sarah@usc.edu, mike@usc.edu"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newGroupName.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              newGroupName.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Create Group & Continue
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Screen 2: Guarantor Invite ───────────────────────────────────────────────

const GuarantorInviteScreen = ({ member, savedGuarantors, onSave, onSkip }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [useSaved, setUseSaved] = useState(false)

  const handleSelectSaved = g => {
    setForm({ name: g.name, phone: g.phone, email: g.email })
    setUseSaved(true)
  }

  const handleSubmit = () => {
    if (!form.name || !form.email) return
    onSave(form)
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>{member.name}</strong>, this property requires income verification. Add a guarantor
          (parent or sponsor) to co-sign if you don't independently meet the income requirement.
        </p>
      </div>

      {/* Saved guarantors */}
      {savedGuarantors && savedGuarantors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Previously Saved Guarantors</p>
          {savedGuarantors.map((g, i) => (
            <button
              key={i}
              onClick={() => handleSelectSaved(g)}
              className={`w-full flex items-center p-3 border-2 rounded-lg transition-colors text-left ${
                useSaved && form.email === g.email
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <User size={18} className="text-gray-500 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{g.name}</p>
                <p className="text-xs text-gray-500">{g.email} · {g.phone}</p>
              </div>
              {useSaved && form.email === g.email && (
                <CheckCircle size={16} className="text-blue-600 ml-auto" />
              )}
            </button>
          ))}
          <p className="text-xs text-gray-400 text-center">— or enter a new guarantor below —</p>
        </div>
      )}

      {/* Manual form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Guarantor Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Jane Smith"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="(555) 000-0000"
              className="w-full pl-9 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="guarantor@email.com"
              className="w-full pl-9 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SMS preview */}
      {form.name && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">SMS Preview (sent to guarantor)</p>
          <p className="text-sm text-gray-700 italic">
            "Hi {form.name}, {member.name} is applying for a lease with their roommates. Tap here to
            securely verify your identity and income: rentra.app/verify/[token]"
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!form.name || !form.email}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          form.name && form.email
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <UserPlus size={18} className="inline mr-2" />
        Send Guarantor Invite
      </button>

      <button
        onClick={onSkip}
        className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
      >
        I meet the income requirement — Skip
      </button>
    </div>
  )
}

// ─── Screen 3: Group Application Tracker ─────────────────────────────────────

const GroupTrackerScreen = ({ groupApplication, listing, onRemind, onSubmit, onNavigateToVerify }) => {
  const allReady = groupApplication.members.every(m => {
    if (m.applicationStatus !== 'complete') return false
    const g = m.guarantor
    if (!g) return true // no guarantor needed
    return g.verificationStatus === 'verified'
  })

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Property */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-semibold text-blue-800">{listing.title}</p>
        <p className="text-sm text-blue-700">{listing.location} · ${listing.price}/mo</p>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <span className="flex items-center"><CheckCircle size={13} className="text-green-500 mr-1" /> Verified</span>
        <span className="flex items-center"><Clock size={13} className="text-yellow-500 mr-1" /> Pending</span>
        <span className="flex items-center"><XCircle size={13} className="text-red-400 mr-1" /> Action needed</span>
      </div>

      {/* Members */}
      <div className="space-y-3">
        {groupApplication.members.map((member, i) => {
          const statusInfo = memberStatusLabel(member.applicationStatus, member.guarantor?.verificationStatus || null)
          const appDone = member.applicationStatus === 'complete'
          const guarDone = !member.guarantor || member.guarantor.verificationStatus === 'verified'

          return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
                  </div>
                </div>
                {/* Remind button if something pending */}
                {(!appDone || (member.guarantor && !guarDone)) && (
                  <button
                    onClick={() => onRemind(member)}
                    className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-200 transition-colors flex items-center"
                  >
                    <Bell size={12} className="mr-1" /> Remind
                  </button>
                )}
              </div>

              {/* Status rows */}
              <div className="space-y-2 ml-12">
                <div className="flex items-center">
                  {appDone
                    ? <CheckCircle size={14} className="text-green-500 mr-2" />
                    : <Clock size={14} className="text-yellow-500 mr-2" />}
                  <span className="text-sm text-gray-700">Application {appDone ? 'Complete' : 'Pending'}</span>
                </div>

                {member.guarantor ? (
                  <div className="flex items-center">
                    {memberStatusIcon(member.guarantor.verificationStatus)}
                    <span className="text-sm text-gray-700 ml-2">
                      Guarantor ({member.guarantor.name}):{' '}
                      {member.guarantor.verificationStatus === 'verified'
                        ? 'Verified ✓'
                        : member.guarantor.verificationStatus === 'pending'
                        ? 'Pending Verification'
                        : 'Not Invited Yet'}
                    </span>
                    {/* Demo: let user trigger verifier */}
                    {member.guarantor.verificationStatus === 'pending' && (
                      <button
                        onClick={() => onNavigateToVerify(member)}
                        className="ml-auto text-xs text-blue-600 underline"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">No Guarantor Required</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submission gate */}
      {!allReady && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            Application cannot be submitted until <strong>all roommates</strong> and their{' '}
            <strong>guarantors</strong> have completed verification.
          </p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!allReady}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          allReady
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {allReady ? 'Submit Group Application to Landlord' : 'Waiting on Group Members…'}
      </button>
    </div>
  )
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

const GroupApplicationFlow = ({
  listing,
  currentUser,
  roommateGroups = [],
  savedGuarantors = [],
  onBack,
  onSubmitApplication,
  onNavigateToGuarantorVerify,
}) => {
  const [screen, setScreen] = useState('kickoff') // 'kickoff' | 'guarantor' | 'tracker'
  const [groupApplication, setGroupApplication] = useState(null)
  const [guarantorMemberIndex, setGuarantorMemberIndex] = useState(0)

  // ── Build initial group app from a group or solo ──────────────────────────

  const buildSoloApp = () => {
    const app = {
      id: `ga-${Date.now()}`,
      propertyId: listing.id,
      type: 'solo',
      groupId: null,
      members: [
        {
          userId: 'me',
          name: currentUser?.name || 'You',
          applicationStatus: 'complete',
          guarantor: null,
        },
      ],
      overallStatus: 'pending_submission',
      lease: null,
    }
    setGroupApplication(app)
    setGuarantorMemberIndex(0)
    setScreen('guarantor')
  }

  const buildGroupApp = group => {
    const memberList = [
      {
        userId: 'me',
        name: currentUser?.name || 'You',
        applicationStatus: 'complete',
        guarantor: null,
      },
      ...(group.members || [])
        .filter(m => m.userId !== 'me')
        .map(m => ({
          userId: m.userId,
          name: m.name || m.userId,
          applicationStatus: Math.random() > 0.4 ? 'complete' : 'pending', // mock other members
          guarantor:
            Math.random() > 0.5
              ? {
                  name: `${m.name || m.userId}'s Parent`,
                  phone: '(555) 000-0001',
                  email: `parent@email.com`,
                  verificationStatus: Math.random() > 0.5 ? 'verified' : 'pending',
                }
              : null,
        })),
    ]

    const app = {
      id: `ga-${Date.now()}`,
      propertyId: listing.id,
      type: 'group',
      groupId: group.id,
      groupName: group.name,
      members: memberList,
      overallStatus: 'pending_submission',
      lease: null,
    }
    setGroupApplication(app)
    setGuarantorMemberIndex(0)
    setScreen('guarantor')
  }

  const handleCreateGroup = ({ name, inviteEmails }) => {
    const newGroup = {
      id: `grp-${Date.now()}`,
      name,
      members: inviteEmails.map((email, i) => ({
        userId: `invited-${i}`,
        name: email.split('@')[0],
        applicationStatus: 'pending',
        guarantor: null,
      })),
    }
    buildGroupApp(newGroup)
  }

  // ── Guarantor save / skip ─────────────────────────────────────────────────

  const handleGuarantorSave = guarantorForm => {
    setGroupApplication(prev => {
      const members = [...prev.members]
      members[guarantorMemberIndex] = {
        ...members[guarantorMemberIndex],
        guarantor: {
          ...guarantorForm,
          verificationStatus: 'pending',
        },
      }
      return { ...prev, members }
    })
    goNextGuarantor()
  }

  const handleGuarantorSkip = () => {
    goNextGuarantor()
  }

  const goNextGuarantor = () => {
    // Only ask guarantor for "me" (current user). Then go straight to tracker.
    setScreen('tracker')
  }

  // ── Tracker actions ───────────────────────────────────────────────────────

  const handleRemind = member => {
    alert(`Reminder sent to ${member.name} and their guarantor!`)
  }

  const handleSubmit = () => {
    const finalApp = { ...groupApplication, overallStatus: 'submitted' }
    onSubmitApplication(finalApp)
  }

  // ── Back navigation ───────────────────────────────────────────────────────

  const handleBack = () => {
    if (screen === 'guarantor') setScreen('kickoff')
    else if (screen === 'tracker') setScreen('guarantor')
    else onBack()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Sub-header breadcrumb */}
      <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button onClick={handleBack} className="mr-3 p-1">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="text-xs text-gray-500">
            {screen === 'kickoff' && 'Step 1 of 3 · Select Applicants'}
            {screen === 'guarantor' && 'Step 2 of 3 · Add Your Guarantor'}
            {screen === 'tracker' && 'Step 3 of 3 · Group Status Tracker'}
          </p>
        </div>
      </div>

      {screen === 'kickoff' && (
        <KickoffScreen
          listing={listing}
          roommateGroups={roommateGroups}
          onSolo={buildSoloApp}
          onSelectGroup={buildGroupApp}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {screen === 'guarantor' && groupApplication && (
        <GuarantorInviteScreen
          member={groupApplication.members[guarantorMemberIndex]}
          savedGuarantors={savedGuarantors}
          onSave={handleGuarantorSave}
          onSkip={handleGuarantorSkip}
        />
      )}

      {screen === 'tracker' && groupApplication && (
        <GroupTrackerScreen
          groupApplication={groupApplication}
          listing={listing}
          onRemind={handleRemind}
          onSubmit={handleSubmit}
          onNavigateToVerify={member => {
            onNavigateToGuarantorVerify({
              studentName: member.name,
              guarantorName: member.guarantor?.name,
              propertyAddress: listing.title,
            })
          }}
        />
      )}
    </div>
  )
}

export default GroupApplicationFlow
