import React, { useState } from 'react'
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Lock,
  Smartphone,
  CreditCard,
  Building,
  User,
  Star,
  Download,
  Mail,
} from 'lucide-react'

// ─── Plaid-style badge ────────────────────────────────────────────────────────

const PlaidBadge = () => (
  <div className="flex items-center justify-center space-x-1 text-xs text-gray-400 mt-2">
    <Lock size={11} />
    <span>Secured by</span>
    <span className="font-semibold text-gray-600">Plaid</span>
    <span>· bank-level encryption</span>
  </div>
)

// ─── Screen 4: Landing Page ───────────────────────────────────────────────────

const LandingScreen = ({ studentName, propertyAddress, onStart }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8">
    {/* Logo / Brand */}
    <div className="space-y-1">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
        <Shield size={32} className="text-white" />
      </div>
      <p className="text-xl font-bold text-blue-600">Rentra</p>
    </div>

    <div className="space-y-3 max-w-xs">
      <h1 className="text-2xl font-bold text-gray-900">
        Help {studentName} get pre-approved
      </h1>
      <p className="text-gray-500 text-sm leading-relaxed">
        Rentra uses banking-level encryption (Plaid) to instantly verify your identity and
        income as a guarantor for{' '}
        <span className="font-medium text-gray-700">{propertyAddress}</span>.
      </p>
    </div>

    {/* Trust pillars */}
    <div className="grid grid-cols-3 gap-4 w-full max-w-xs text-center">
      {[
        { icon: <Lock size={18} className="text-blue-600" />, label: 'Bank-level\nSecurity' },
        { icon: <Star size={18} className="text-yellow-500" />, label: 'Trusted by\n500k+ users' },
        { icon: <CheckCircle size={18} className="text-green-500" />, label: 'Instant\nVerification' },
      ].map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
          {item.icon}
          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line leading-tight">{item.label}</p>
        </div>
      ))}
    </div>

    <button
      onClick={onStart}
      className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
    >
      Start Verification
      <ArrowRight size={20} className="ml-2" />
    </button>

    <p className="text-xs text-gray-400 max-w-xs">
      No app download required. Your data is never sold and is used solely for this
      verification.
    </p>
    <PlaidBadge />
  </div>
)

// ─── Screen 5: Plaid IDV ──────────────────────────────────────────────────────

const PlaidIDVScreen = ({ onVerified }) => {
  const [method, setMethod] = useState('instant') // 'instant' | 'dl'
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [done, setDone] = useState(false)

  const handleVerify = () => {
    if (!phone || !dob) return
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setDone(true)
      setTimeout(onVerified, 1200)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 space-y-6">
      {/* Modal header (Plaid-style) */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Verify Your Identity</p>
            <p className="text-xs text-gray-500">Step 1 of 2 · Identity</p>
          </div>
        </div>

        {/* Method toggle */}
        <div className="flex space-x-2">
          {['instant', 'dl'].map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                method === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m === 'instant' ? 'Phone + DOB' : 'Driver\'s License'}
            </button>
          ))}
        </div>

        {method === 'instant' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Mobile Phone</label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full pl-9 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-xl p-8 text-center space-y-3">
            <div className="w-16 h-10 bg-white border-2 border-dashed border-gray-300 rounded mx-auto flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Tap to upload front of Driver's License</p>
            <button className="text-sm text-blue-600 font-medium">Upload Photo</button>
          </div>
        )}

        {done ? (
          <div className="flex items-center justify-center space-x-2 py-3 bg-green-50 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-semibold text-green-700">Identity Verified!</span>
          </div>
        ) : (
          <button
            onClick={handleVerify}
            disabled={verifying || (method === 'instant' && (!phone || !dob))}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              !verifying && (method === 'dl' || (phone && dob))
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {verifying ? 'Verifying…' : 'Verify Identity'}
          </button>
        )}
      </div>
      <PlaidBadge />
    </div>
  )
}

// ─── Screen 6: Plaid Income ───────────────────────────────────────────────────

const PlaidIncomeScreen = ({ onVerified }) => {
  const [selected, setSelected] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [done, setDone] = useState(false)

  const providers = [
    { id: 'bank', label: 'Link Bank Account', icon: <Building size={20} className="text-blue-600" /> },
    { id: 'payroll', label: 'Connect Payroll', icon: <CreditCard size={20} className="text-green-600" /> },
  ]

  const handleConnect = () => {
    if (!selected) return
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setDone(true)
      setTimeout(onVerified, 1200)
    }, 2200)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Verify Your Income</p>
            <p className="text-xs text-gray-500">Step 2 of 2 · Income / Assets</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Link your primary bank account or payroll provider. Rentra only reads balances and
          income — it cannot move money.
        </p>

        <div className="space-y-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full flex items-center p-4 border-2 rounded-xl transition-colors ${
                selected === p.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                {p.icon}
              </div>
              <span className="font-medium">{p.label}</span>
              {selected === p.id && <CheckCircle size={16} className="text-blue-600 ml-auto" />}
            </button>
          ))}
        </div>

        {done ? (
          <div className="flex items-center justify-center space-x-2 py-3 bg-green-50 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
            <span className="font-semibold text-green-700">Income Verified!</span>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={!selected || connecting}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              selected && !connecting
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {connecting ? 'Connecting…' : 'Connect & Verify'}
          </button>
        )}
      </div>
      <PlaidBadge />
    </div>
  )
}

// ─── Screen 7: Guarantor Pre-Approval Success ─────────────────────────────────

const SuccessScreen = ({ studentName, onDone }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
      {/* Confetti emoji + checkmark */}
      <div className="text-5xl">🎉</div>

      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle size={40} className="text-green-600" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h1 className="text-2xl font-bold text-gray-900">You're Verified!</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          <strong>{studentName}'s</strong> portion of the application is complete. Once the whole
          group finishes, the application goes to the property manager.
        </p>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed">
          If everyone agrees to move forward, we will notify you to co-sign the official
          lease.
        </p>
      </div>

      {/* What's next */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-xs w-full text-left space-y-2">
        <p className="text-sm font-semibold text-blue-800">What happens next?</p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Group application submitted to landlord</li>
          <li>Landlord reviews combined income</li>
          <li>If approved, you'll receive a lease to co-sign</li>
        </ul>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onDone}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
        <button className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium">
          <Download size={16} className="mr-2" />
          Download Verification Summary
        </button>
        <button className="w-full flex items-center justify-center border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium">
          <Mail size={16} className="mr-2" />
          Email me a copy
        </button>
      </div>
    </div>
  )
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

const GuarantorVerificationFlow = ({
  studentName = 'Your Student',
  guarantorName,
  propertyAddress = 'the property',
  onComplete,
  onBack,
}) => {
  const [step, setStep] = useState('landing') // 'landing' | 'idv' | 'income' | 'success'

  return (
    <div className="max-w-md mx-auto">
      {step === 'landing' && (
        <LandingScreen
          studentName={studentName}
          propertyAddress={propertyAddress}
          onStart={() => setStep('idv')}
        />
      )}
      {step === 'idv' && (
        <PlaidIDVScreen onVerified={() => setStep('income')} />
      )}
      {step === 'income' && (
        <PlaidIncomeScreen onVerified={() => setStep('success')} />
      )}
      {step === 'success' && (
        <SuccessScreen
          studentName={studentName}
          onDone={onComplete}
        />
      )}
    </div>
  )
}

export default GuarantorVerificationFlow
