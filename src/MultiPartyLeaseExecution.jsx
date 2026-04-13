import React, { useState } from 'react'
import {
  FileText,
  CheckCircle,
  Clock,
  User,
  Shield,
  Home,
  Download,
  Mail,
  PenTool,
  Users,
  ArrowLeft,
  Eye,
  DollarSign,
  Calendar,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildSignatories = groupApplication => {
  if (!groupApplication) return []

  const list = []

  // Tenants
  groupApplication.members.forEach(m => {
    list.push({
      id: `tenant-${m.userId}`,
      role: 'tenant',
      name: m.name,
      email: m.email || `${m.name.toLowerCase().replace(' ', '.')}@university.edu`,
      signed: false,
      signedAt: null,
    })
    // Add guarantor if present
    if (m.guarantor && m.guarantor.verificationStatus === 'verified') {
      list.push({
        id: `guarantor-${m.userId}`,
        role: 'guarantor',
        name: m.guarantor.name,
        email: m.guarantor.email,
        signed: false,
        signedAt: null,
        forTenant: m.name,
      })
    }
  })

  return list
}

// ─── Signature Tracker ────────────────────────────────────────────────────────

const SignatureTracker = ({ signatories }) => (
  <div className="space-y-2">
    {signatories.map(s => (
      <div
        key={s.id}
        className={`flex items-center p-3 rounded-lg border ${
          s.signed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
            s.role === 'guarantor' ? 'bg-purple-100' : 'bg-brand-100'
          }`}
        >
          {s.role === 'guarantor' ? (
            <Shield size={15} className="text-purple-600" />
          ) : (
            <User size={15} className="text-brand-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{s.name}</p>
          <p className="text-xs text-gray-500">
            {s.role === 'guarantor' ? `Guarantor for ${s.forTenant}` : 'Tenant'}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {s.signed ? (
            <span className="flex items-center text-xs text-green-600 font-medium">
              <CheckCircle size={14} className="mr-1" /> Signed
            </span>
          ) : (
            <span className="flex items-center text-xs text-yellow-600 font-medium">
              <Clock size={14} className="mr-1" /> Pending
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
)

// ─── Screen 9: Tenant Lease Review & Sign ────────────────────────────────────

const TenantLeaseScreen = ({ groupApplication, listing, signatories, currentUser, onSign, onBack }) => {
  const [reviewed, setReviewed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signatureInput, setSignatureInput] = useState('')

  const mySignatory = signatories.find(s => s.role === 'tenant' && s.name === (currentUser?.name || 'You'))
  const alreadySigned = mySignatory?.signed

  const handleSign = () => {
    if (!signatureInput.trim()) return
    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      onSign(mySignatory?.id || 'tenant-me', signatureInput)
    }, 1200)
  }

  const pendingCount = signatories.filter(s => !s.signed).length

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Property banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
        <div className="flex items-center mb-1">
          <Home size={16} className="text-brand-500 mr-2" />
          <span className="font-semibold text-blue-800">{listing?.title}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-brand-600 mt-2">
          <span className="flex items-center">
            <DollarSign size={14} className="mr-1" />${listing?.price}/mo
          </span>
          <span className="flex items-center">
            <Users size={14} className="mr-1" />
            {groupApplication?.members?.length || 1} tenant{(groupApplication?.members?.length || 1) !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center">
            <Calendar size={14} className="mr-1" />12-month term
          </span>
        </div>
      </div>

      {/* Signature tracker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Signature Status</h3>
          {pendingCount > 0 && (
            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <SignatureTracker signatories={signatories} />
      </div>

      {/* Lease summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Joint-and-Several Lease</h3>
          <button className="flex items-center text-brand-500 text-sm font-medium">
            <Eye size={14} className="mr-1" /> Full PDF
          </button>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            Each tenant is individually responsible for the full rent amount. Guarantors
            co-sign and are legally responsible if their student defaults.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Monthly Rent', value: `$${listing?.price?.toLocaleString()}/mo` },
              { label: 'Security Deposit', value: `$${((listing?.price || 0) * 2).toLocaleString()}` },
              { label: 'Lease Start', value: 'Upon signing' },
              { label: 'Term', value: '12 months' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-semibold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review checkbox */}
      {!alreadySigned && (
        <>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={e => setReviewed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the joint-and-several lease terms, including all clauses
              regarding rent responsibility, security deposit, and early termination.
            </span>
          </label>

          {reviewed && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type your full legal name to sign
                </label>
                <input
                  type="text"
                  value={signatureInput}
                  onChange={e => setSignatureInput(e.target.value)}
                  placeholder={currentUser?.name || 'Your Full Name'}
                  className="w-full p-3 border border-gray-300 rounded-lg font-signature italic text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  style={{ fontFamily: 'cursive' }}
                />
              </div>
              <button
                onClick={handleSign}
                disabled={!signatureInput.trim() || signing}
                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
                  signatureInput.trim() && !signing
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <PenTool size={18} className="mr-2" />
                {signing ? 'Signing…' : 'Sign Lease'}
              </button>
            </div>
          )}
        </>
      )}

      {alreadySigned && (
        <div className="flex items-center justify-center space-x-2 py-4 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-semibold text-green-700">You've signed! Waiting on others…</span>
        </div>
      )}
    </div>
  )
}

// ─── Screen 10: Guarantor E-Signature ────────────────────────────────────────

const GuarantorLeaseScreen = ({ groupApplication, listing, signatories, onSign }) => {
  const [signatureInput, setSignatureInput] = useState('')
  const [signing, setSigning] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  // Find first unsigned guarantor (demo: just use first guarantor signatory)
  const guarantorSig = signatories.find(s => s.role === 'guarantor' && !s.signed)

  const handleSign = () => {
    if (!signatureInput.trim() || !guarantorSig) return
    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      onSign(guarantorSig.id, signatureInput)
    }, 1200)
  }

  if (!guarantorSig) {
    return (
      <div className="p-4 text-center text-gray-500">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
        <p className="font-semibold text-gray-700">All guarantors have signed!</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="font-semibold text-purple-800 mb-1">Guarantor Co-Signature</p>
        <p className="text-sm text-purple-700">
          Review and co-sign the lease for <strong>{guarantorSig.forTenant}</strong> and
          roommates at{' '}
          <span className="font-medium">{listing?.title}</span>.
        </p>
      </div>

      {/* Signature tracker */}
      <div>
        <h3 className="font-semibold mb-3">All Signatures</h3>
        <SignatureTracker signatories={signatories} />
      </div>

      {/* Key guarantor obligations */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-sm">Guarantor Obligations</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>You guarantee payment if {guarantorSig.forTenant} defaults</li>
          <li>Your liability matches the tenant's rent portion</li>
          <li>You may be contacted for any lease violations</li>
        </ul>
      </div>

      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={e => setReviewed(e.target.checked)}
          className="mt-1 w-4 h-4 accent-purple-600"
        />
        <span className="text-sm text-gray-700">
          I have read and agree to the guarantor terms and understand my obligations.
        </span>
      </label>

      {reviewed && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Type your full legal name to co-sign
            </label>
            <input
              type="text"
              value={signatureInput}
              onChange={e => setSignatureInput(e.target.value)}
              placeholder={guarantorSig.name}
              className="w-full p-3 border border-gray-300 rounded-lg italic text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ fontFamily: 'cursive' }}
            />
          </div>
          <button
            onClick={handleSign}
            disabled={!signatureInput.trim() || signing}
            className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${
              signatureInput.trim() && !signing
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PenTool size={18} className="mr-2" />
            {signing ? 'Signing…' : 'Co-Sign as Guarantor'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Screen 11: Final Confirmation & Document Vault ──────────────────────────

const DocumentVaultScreen = ({ listing, groupApplication, onViewLease, onEmailCopy, onDone }) => (
  <div className="p-4 pb-20 space-y-6 text-center">
    <div className="space-y-2 pt-4">
      <div className="text-5xl">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900">Lease Fully Executed!</h1>
      <p className="text-gray-600 text-sm">
        The group is officially locked in. Your lease has been saved to your Rentra Document
        Vault.
      </p>
    </div>

    {/* Signed parties summary */}
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
      <div className="flex items-center mb-3">
        <CheckCircle size={16} className="text-green-600 mr-2" />
        <p className="font-semibold text-green-800 text-sm">All parties have signed</p>
      </div>
      <div className="space-y-2">
        {groupApplication?.members?.map((m, i) => (
          <div key={i} className="flex items-center text-sm text-green-700">
            <User size={13} className="mr-2 flex-shrink-0" />
            <span className="flex-1">{m.name}</span>
            <CheckCircle size={13} className="text-green-500" />
            {m.guarantor && (
              <>
                <Shield size={13} className="ml-3 mr-1 text-purple-500 flex-shrink-0" />
                <span className="text-purple-700">{m.guarantor.name}</span>
                <CheckCircle size={13} className="ml-1 text-green-500" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Document vault card */}
    <div className="bg-white border-2 border-brand-200 rounded-xl p-5 text-left space-y-3">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mr-3">
          <FileText size={20} className="text-brand-500" />
        </div>
        <div>
          <p className="font-semibold">Active Lease</p>
          <p className="text-xs text-gray-500">Saved to My Documents Vault</p>
        </div>
        <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Active
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Property</p>
          <p className="font-medium truncate">{listing?.title}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Rent</p>
          <p className="font-medium">${listing?.price?.toLocaleString()}/mo</p>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="space-y-3">
      <button
        onClick={onViewLease}
        className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center"
      >
        <Eye size={18} className="mr-2" />
        View Active Lease
      </button>
      <button
        onClick={onEmailCopy}
        className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium"
      >
        <Mail size={16} className="mr-2" />
        Email me a copy
      </button>
      <button
        onClick={onDone}
        className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium"
      >
        <Download size={16} className="mr-2" />
        Download PDF
      </button>
    </div>
  </div>
)

// ─── Main Orchestrator ────────────────────────────────────────────────────────

const MultiPartyLeaseExecution = ({
  groupApplication,
  listing,
  currentUser,
  viewerRole = 'tenant', // 'tenant' | 'guarantor'
  onComplete,
  onBack,
}) => {
  const [screen, setScreen] = useState('tenant-sign') // 'tenant-sign' | 'guarantor-sign' | 'vault'
  const [signatories, setSignatories] = useState(() => buildSignatories(groupApplication))

  const markSigned = (signatoryId, signature) => {
    setSignatories(prev => {
      const updated = prev.map(s =>
        s.id === signatoryId
          ? { ...s, signed: true, signedAt: new Date().toISOString(), signature }
          : s
      )

      const allSigned = updated.every(s => s.signed)
      if (allSigned) {
        setTimeout(() => setScreen('vault'), 400)
      } else {
        // Check if all tenants signed → move to guarantor screen
        const allTenantsSigned = updated
          .filter(s => s.role === 'tenant')
          .every(s => s.signed)
        if (allTenantsSigned && updated.some(s => s.role === 'guarantor' && !s.signed)) {
          setTimeout(() => setScreen('guarantor-sign'), 400)
        }
      }

      return updated
    })
  }

  const handleBack = () => {
    if (screen === 'guarantor-sign') setScreen('tenant-sign')
    else onBack()
  }

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button onClick={handleBack} className="mr-3 p-1">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="font-semibold text-sm">Lease Execution</p>
          <p className="text-xs text-gray-500">
            {screen === 'tenant-sign' && 'Step 1 · Tenant Signatures'}
            {screen === 'guarantor-sign' && 'Step 2 · Guarantor Co-Signatures'}
            {screen === 'vault' && 'Complete · Document Vault'}
          </p>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          {signatories.filter(s => s.signed).length}/{signatories.length} signed
        </div>
      </div>

      {screen === 'tenant-sign' && (
        <TenantLeaseScreen
          groupApplication={groupApplication}
          listing={listing}
          signatories={signatories}
          currentUser={currentUser}
          onSign={markSigned}
          onBack={onBack}
        />
      )}

      {screen === 'guarantor-sign' && (
        <GuarantorLeaseScreen
          groupApplication={groupApplication}
          listing={listing}
          signatories={signatories}
          onSign={markSigned}
        />
      )}

      {screen === 'vault' && (
        <DocumentVaultScreen
          listing={listing}
          groupApplication={groupApplication}
          onViewLease={() => onComplete('view-lease')}
          onEmailCopy={() => alert('Lease PDF emailed to all parties!')}
          onDone={() => onComplete('property-management')}
        />
      )}
    </div>
  )
}

export default MultiPartyLeaseExecution
