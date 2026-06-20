import React, { useState, useEffect } from 'react'
import {
  FileText,
  CheckCircle,
  Clock,
  User,
  Shield,
  Home,
  DollarSign,
  Calendar,
  PenTool,
  Users,
  ArrowLeft,
  Mail,
  Download,
  Eye,
  ChevronRight,
  AlertCircle,
  Building2,
  Send,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a flat ordered signatories list from the members[] array.
 * Order: all tenants first (alphabetically stable), then all guarantors.
 * Landlord countersign is handled separately in Screen C.
 */
const buildSignatories = members => {
  if (!members?.length) return []
  const tenants = members.map((m, i) => ({
    id: `tenant-${i}-${m.name.replace(/\s/g, '')}`,
    role: 'tenant',
    name: m.name,
    email: m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
    signed: false,
    signedAt: null,
  }))
  const guarantors = members
    .filter(m => m.guarantor)
    .map((m, i) => ({
      id: `guarantor-${i}-${m.guarantor.name.replace(/\s/g, '')}`,
      role: 'guarantor',
      name: m.guarantor.name,
      email: m.guarantor.email,
      forTenant: m.name,
      signed: false,
      signedAt: null,
    }))
  return [...tenants, ...guarantors]
}

/** Build the distribution list: all tenants + guarantors + landlord. */
const buildDistributionList = (members, landlordName, landlordEmail) => {
  const recipients = []
  members.forEach(m => {
    recipients.push({ name: m.name, email: m.email, role: 'Tenant' })
    if (m.guarantor) {
      recipients.push({
        name: m.guarantor.name,
        email: m.guarantor.email,
        role: `Guarantor for ${m.name}`,
      })
    }
  })
  recipients.push({ name: landlordName || 'Landlord', email: landlordEmail || 'landlord@rentra.com', role: 'Landlord' })
  return recipients
}

// ─── Signature Tracker (shared sub-component) ─────────────────────────────────

const SignatureTracker = ({ signatories, highlightId }) => (
  <div className="space-y-2">
    {signatories.map(s => (
      <div
        key={s.id}
        className={`flex items-center p-3 rounded-xl border transition-colors ${
          s.signed
            ? 'border-green-200 bg-green-50'
            : s.id === highlightId
              ? 'border-brand-300 bg-brand-50'
              : 'border-gray-200 bg-white'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
          s.role === 'guarantor' ? 'bg-purple-100' : 'bg-brand-100'
        }`}>
          {s.role === 'guarantor'
            ? <Shield size={14} className="text-purple-600" />
            : <User size={14} className="text-brand-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{s.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {s.role === 'guarantor' ? `Guarantor for ${s.forTenant}` : 'Tenant'}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {s.signed ? (
            <span className="flex items-center text-xs text-green-600 font-medium">
              <CheckCircle size={14} className="mr-1" />
              {s.signedAt ? new Date(s.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Signed'}
            </span>
          ) : s.id === highlightId ? (
            <span className="flex items-center text-xs text-brand-500 font-medium">
              <Clock size={14} className="mr-1 animate-pulse" /> Signing…
            </span>
          ) : (
            <span className="flex items-center text-xs text-gray-400 font-medium">
              <Clock size={14} className="mr-1" /> Pending
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)

// ─── Screen A: Lease Preview ───────────────────────────────────────────────────

const LeasePreviewScreen = ({ groupApplication, listing, landlordUser, onSend, onBack }) => {
  const [reviewed, setReviewed] = useState(false)
  const moveInDate = new Date()
  moveInDate.setDate(moveInDate.getDate() + 14)

  return (
    <div className="p-4 pb-24 space-y-5">
      <button onClick={onBack} className="flex items-center text-brand-500 text-sm font-medium">
        <ArrowLeft size={16} className="mr-1" /> Back to Chat
      </button>

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Review Lease Before Sending</h2>
        <p className="text-sm text-gray-500 mt-1">
          Verify the auto-populated details below, then send to all {groupApplication.members.length} tenant{groupApplication.members.length !== 1 ? 's' : ''}
          {groupApplication.members.filter(m => m.guarantor).length > 0
            ? ` and ${groupApplication.members.filter(m => m.guarantor).length} guarantor${groupApplication.members.filter(m => m.guarantor).length !== 1 ? 's' : ''}`
            : ''} for signatures.
        </p>
      </div>

      {/* Lease card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Title bar */}
        <div className="bg-gray-900 text-white px-5 py-4">
          <div className="flex items-center mb-1">
            <FileText size={16} className="mr-2" />
            <span className="font-bold">RESIDENTIAL LEASE AGREEMENT</span>
          </div>
          <p className="text-xs text-gray-400">Joint-and-Several Tenancy</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Property */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Property</p>
            <div className="flex items-start">
              <Home size={16} className="text-brand-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{listing?.title || groupApplication.propertyTitle}</p>
                <p className="text-sm text-gray-600">{listing?.location || 'Los Angeles, CA'}</p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Terms</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Monthly Rent', value: `$${(listing?.price || 0).toLocaleString()}/mo` },
                { label: 'Security Deposit', value: `$${((listing?.price || 0) * 2).toLocaleString()}` },
                { label: 'Lease Start', value: moveInDate.toLocaleDateString() },
                { label: 'Lease Term', value: '12 months' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tenants — dynamic */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Tenants ({groupApplication.members.length})
            </p>
            {groupApplication.members.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center">
                  <User size={13} className="text-brand-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                </div>
                {m.guarantor && (
                  <div className="flex items-center text-xs text-purple-600">
                    <Shield size={11} className="mr-1" />
                    {m.guarantor.name}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Landlord */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Landlord</p>
            <div className="flex items-center">
              <Building2 size={13} className="text-gray-600 mr-2" />
              <span className="text-sm font-medium">{landlordUser?.name || 'Landlord'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review confirm */}
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={e => setReviewed(e.target.checked)}
          className="mt-1 w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-gray-700">
          I confirm the details above are accurate and I'm ready to send this lease to all parties for signature.
        </span>
      </label>

      <button
        onClick={onSend}
        disabled={!reviewed}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-colors ${
          reviewed
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send size={18} className="mr-2" />
        Send Lease for Signatures
      </button>
    </div>
  )
}

// ─── Screen B: Signature Progress ─────────────────────────────────────────────

const SignatureProgressScreen = ({ signatories: initialSigs, groupApplication, listing, onAllSigned }) => {
  const [signatories, setSignatories]   = useState(initialSigs)
  const [currentIdx, setCurrentIdx]     = useState(0)  // index of next party to auto-sign
  const [autoRunning, setAutoRunning]   = useState(false)

  const pending  = signatories.filter(s => !s.signed)
  const allDone  = pending.length === 0
  const currentSig = signatories[currentIdx] || null

  // Simulate sequential signing: each party signs after a delay
  const simulateNextSignature = () => {
    setAutoRunning(true)
    const nextUnsigned = signatories.findIndex(s => !s.signed)
    if (nextUnsigned === -1) {
      setAutoRunning(false)
      return
    }
    setCurrentIdx(nextUnsigned)
    setTimeout(() => {
      setSignatories(prev => prev.map((s, i) =>
        i === nextUnsigned ? { ...s, signed: true, signedAt: new Date().toISOString() } : s
      ))
      setCurrentIdx(nextUnsigned + 1)
      setAutoRunning(false)
    }, 2000)
  }

  // Auto-advance when all are signed
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => onAllSigned(signatories), 1500)
      return () => clearTimeout(t)
    }
  }, [allDone])

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center mb-1">
          <FileText size={16} className="text-purple-600 mr-2" />
          <span className="font-semibold text-purple-800">Lease Sent — Awaiting Signatures</span>
        </div>
        <p className="text-sm text-purple-700">
          {listing?.title || groupApplication?.propertyTitle}
        </p>
        <p className="text-xs text-purple-600 mt-1">
          Signing order: Tenants first, then Guarantors, then you (Landlord)
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Signature Progress</span>
          <span className="text-xs text-gray-500">
            {signatories.filter(s => s.signed).length} / {signatories.length} signed
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${(signatories.filter(s => s.signed).length / signatories.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Signature tracker */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">All Signatories</h3>
        <SignatureTracker
          signatories={signatories}
          highlightId={autoRunning ? signatories[currentIdx]?.id : null}
        />
      </div>

      {/* Simulate button for demo */}
      {!allDone && (
        <button
          onClick={simulateNextSignature}
          disabled={autoRunning}
          className={`w-full py-3 rounded-xl font-medium text-sm border-2 transition-colors flex items-center justify-center ${
            autoRunning
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-brand-400 text-brand-500 hover:bg-brand-50'
          }`}
        >
          {autoRunning
            ? <><Clock size={16} className="mr-2 animate-spin" /> Simulating signature…</>
            : <><ChevronRight size={16} className="mr-2" /> Simulate Next Signature</>
          }
        </button>
      )}

      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
          <CheckCircle size={28} className="mx-auto text-green-600" />
          <p className="font-semibold text-green-800">All counterparties have signed!</p>
          <p className="text-sm text-green-700">Taking you to countersign…</p>
        </div>
      )}
    </div>
  )
}

// ─── Screen C: Landlord Countersign ───────────────────────────────────────────

const LandlordCountersignScreen = ({ landlordUser, listing, groupApplication, signatories, onCountersign }) => {
  const [signature, setSignature] = useState('')
  const [reviewed, setReviewed]   = useState(false)
  const [signing, setSigning]     = useState(false)

  const handleSign = () => {
    if (!signature.trim() || !reviewed) return
    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      onCountersign(signature)
    }, 1400)
  }

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Status banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
        <CheckCircle size={20} className="text-green-600 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800">All counterparties have signed</p>
          <p className="text-sm text-green-700 mt-0.5">
            {signatories.length} signature{signatories.length !== 1 ? 's' : ''} collected.
            Your countersignature will fully execute this lease.
          </p>
        </div>
      </div>

      {/* All signatures summary */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Counterparty Signatures</h3>
        <SignatureTracker signatories={signatories} />
      </div>

      {/* Lease summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Lease Summary</h3>
          <button className="flex items-center text-brand-500 text-xs font-medium">
            <Eye size={13} className="mr-1" /> Full PDF
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Property</p>
            <p className="font-semibold text-xs truncate">{listing?.title || groupApplication?.propertyTitle}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Rent</p>
            <p className="font-semibold text-xs">${(listing?.price || 0).toLocaleString()}/mo</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Tenants</p>
            <p className="font-semibold text-xs">{groupApplication?.members?.length || 1}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Guarantors</p>
            <p className="font-semibold text-xs">
              {groupApplication?.members?.filter(m => m.guarantor).length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Countersign form */}
      <div className="bg-white border-2 border-brand-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center">
          <Building2 size={18} className="text-brand-500 mr-2" />
          <div>
            <p className="font-semibold">{landlordUser?.name || 'Landlord'}</p>
            <p className="text-xs text-gray-500">Landlord Countersignature</p>
          </div>
        </div>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={e => setReviewed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-700">
            I have reviewed the fully signed lease and agree to all terms. My countersignature will
            finalize this agreement and the property will be marked as LEASED.
          </span>
        </label>

        {reviewed && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Type your full legal name to countersign
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder={landlordUser?.name || 'Your Full Legal Name'}
                className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                style={{ fontFamily: 'cursive' }}
              />
            </div>
            <button
              onClick={handleSign}
              disabled={!signature.trim() || signing}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-colors ${
                signature.trim() && !signing
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PenTool size={18} className="mr-2" />
              {signing ? 'Countersigning…' : 'Countersign & Execute Lease'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen D: Final Distribution ─────────────────────────────────────────────

const FinalDistributionScreen = ({
  groupApplication,
  listing,
  landlordUser,
  signatories,
  onDone,
  onNavigateToPropertyManagement,
}) => {
  const [emailSent, setEmailSent] = useState(false)

  const distributionList = buildDistributionList(
    groupApplication?.members || [],
    landlordUser?.name,
    landlordUser?.email
  )

  return (
    <div className="p-4 pb-24 space-y-5">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Lease Fully Executed!</h1>
        <p className="text-sm text-gray-600">
          All {signatories.length} signature{signatories.length !== 1 ? 's' : ''} + your countersignature collected.
          The property is now officially <span className="font-semibold text-green-700">LEASED</span>.
        </p>
      </div>

      {/* Property status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
          <Home size={20} className="text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">{listing?.title || groupApplication?.propertyTitle}</p>
          <p className="text-xs text-green-700 mt-0.5">Status updated → LEASED</p>
        </div>
        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">LEASED</span>
      </div>

      {/* Distribution list — dynamic */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Mail size={15} className="text-brand-500 mr-2" />
            <span className="font-semibold text-sm">Distribution List</span>
          </div>
          <span className="text-xs text-gray-500">{distributionList.length} recipient{distributionList.length !== 1 ? 's' : ''}</span>
        </div>
        {distributionList.map((r, i) => (
          <div key={i} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              r.role === 'Landlord'         ? 'bg-brand-100'   :
              r.role.startsWith('Guarantor') ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              {r.role === 'Landlord'
                ? <Building2 size={13} className="text-brand-500" />
                : r.role.startsWith('Guarantor')
                  ? <Shield size={13} className="text-purple-600" />
                  : <User size={13} className="text-gray-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{r.name}</p>
              <p className="text-xs text-gray-400 truncate">{r.email}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">{r.role}</span>
              <CheckCircle size={14} className="text-green-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Send emails CTA */}
      <button
        onClick={() => setEmailSent(true)}
        disabled={emailSent}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-colors ${
          emailSent
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        }`}
      >
        {emailSent ? (
          <><CheckCircle size={18} className="mr-2 text-green-500" /> Executed PDF Sent to All {distributionList.length} Parties</>
        ) : (
          <><Mail size={18} className="mr-2" /> Email Fully Executed PDF to All Parties</>
        )}
      </button>

      {emailSent && (
        <p className="text-center text-xs text-gray-500">
          Each recipient will receive the fully executed lease PDF. The chat thread remains open for
          ongoing communication.
        </p>
      )}

      {/* Navigation */}
      <div className="space-y-3">
        <button
          onClick={onNavigateToPropertyManagement}
          className="w-full py-3 rounded-xl border-2 border-brand-200 text-brand-500 font-semibold hover:bg-brand-50 flex items-center justify-center transition-colors"
        >
          <Building2 size={18} className="mr-2" /> Go to Property Management
        </button>
        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Inbox
        </button>
      </div>
    </div>
  )
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

const LandlordLeaseRouter = ({
  groupApplication,
  listing,
  landlordUser,
  onBack,
  onLeaseExecuted,            // (groupApplication, activeLease) => void
  onNavigateToPropertyManagement,
}) => {
  // Screens: 'preview' | 'progress' | 'countersign' | 'distribution'
  const [screen, setScreen] = useState('preview')
  const [signatories, setSignatories] = useState(() => buildSignatories(groupApplication?.members || []))

  if (!groupApplication) return null

  if (screen === 'preview') {
    return (
      <LeasePreviewScreen
        groupApplication={groupApplication}
        listing={listing}
        landlordUser={landlordUser}
        onBack={onBack}
        onSend={() => setScreen('progress')}
      />
    )
  }

  if (screen === 'progress') {
    return (
      <SignatureProgressScreen
        signatories={signatories}
        groupApplication={groupApplication}
        listing={listing}
        onAllSigned={finalSigs => {
          setSignatories(finalSigs)
          setScreen('countersign')
        }}
      />
    )
  }

  if (screen === 'countersign') {
    return (
      <LandlordCountersignScreen
        landlordUser={landlordUser}
        listing={listing}
        groupApplication={groupApplication}
        signatories={signatories}
        onCountersign={sig => {
          // Build the active lease object and notify parent
          const activeLease = {
            id: `LEASE-${Date.now()}`,
            property: { address: listing?.location || groupApplication.propertyTitle },
            monthlyRent: listing?.price || 0,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            landlord: landlordUser || {},
            tenants: groupApplication.members,
            status: 'fully_executed',
            landlordSignature: sig,
            signatories,
          }
          onLeaseExecuted?.(groupApplication, activeLease)
          setScreen('distribution')
        }}
      />
    )
  }

  if (screen === 'distribution') {
    return (
      <FinalDistributionScreen
        groupApplication={groupApplication}
        listing={listing}
        landlordUser={landlordUser}
        signatories={signatories}
        onDone={onBack}
        onNavigateToPropertyManagement={onNavigateToPropertyManagement}
      />
    )
  }

  return null
}

export default LandlordLeaseRouter
