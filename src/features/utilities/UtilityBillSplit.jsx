import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  DollarSign,
  Users,
  Check,
  ChevronRight,
  X,
  Plus,
  Zap,
  Droplets,
  Wifi,
  Flame,
  CheckCircle,
  Clock,
  Trash2,
  SplitSquareHorizontal,
} from 'lucide-react'

const UTILITY_TYPES = [
  { value: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-500' },
  { value: 'water', label: 'Water & Sewer', icon: Droplets, color: 'text-brand-500' },
  { value: 'internet', label: 'Internet', icon: Wifi, color: 'text-purple-500' },
  { value: 'gas', label: 'Natural Gas', icon: Flame, color: 'text-orange-500' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-500' },
]

const STEPS = ['upload', 'confirm', 'split', 'summary']

const SAMPLE_CONTACTS = [
  { id: 'c1', name: 'Alex Johnson', role: 'Roommate', avatar: null },
  { id: 'c2', name: 'Maria Rodriguez', role: 'Roommate', avatar: null },
  { id: 'c3', name: 'James Lee', role: 'Roommate', avatar: null },
]

function Avatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div
      className={`${sizeClass} rounded-full bg-brand-100 text-brand-600 font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

function StepIndicator({ currentStep }) {
  const labels = ['Upload', 'Confirm', 'Split', 'Summary']
  const currentIdx = STEPS.indexOf(currentStep)
  return (
    <div className="flex items-center justify-between mb-8">
      {labels.map((label, idx) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                idx < currentIdx
                  ? 'bg-brand-500 text-white'
                  : idx === currentIdx
                  ? 'bg-brand-500 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {idx < currentIdx ? <Check size={14} /> : idx + 1}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                idx <= currentIdx ? 'text-brand-500' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
          {idx < labels.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                idx < currentIdx ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function UtilityBillSplit() {
  const [step, setStep] = useState('upload')
  const [splits, setSplits] = useState([]) // completed splits
  const [showNewSplit, setShowNewSplit] = useState(false)

  // Form state
  const [billFile, setBillFile] = useState(null)
  const [billPreview, setBillPreview] = useState(null)
  const [utilityType, setUtilityType] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [provider, setProvider] = useState('')
  const [participants, setParticipants] = useState([])
  const [splitMode, setSplitMode] = useState('equal') // 'equal' | 'custom'
  const [customShares, setCustomShares] = useState({})
  const [newPersonName, setNewPersonName] = useState('')
  const fileInputRef = useRef(null)

  const reset = () => {
    setStep('upload')
    setBillFile(null)
    setBillPreview(null)
    setUtilityType('')
    setTotalAmount('')
    setDueDate('')
    setProvider('')
    setParticipants([])
    setSplitMode('equal')
    setCustomShares({})
    setNewPersonName('')
    setShowNewSplit(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBillFile(file)
    if (file.type.startsWith('image/')) {
      setBillPreview(URL.createObjectURL(file))
    } else {
      setBillPreview('pdf')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setBillFile(file)
    if (file.type.startsWith('image/')) {
      setBillPreview(URL.createObjectURL(file))
    } else {
      setBillPreview('pdf')
    }
  }

  const toggleParticipant = (contact) => {
    setParticipants((prev) =>
      prev.find((p) => p.id === contact.id)
        ? prev.filter((p) => p.id !== contact.id)
        : [...prev, { ...contact, paid: false }]
    )
  }

  const addCustomPerson = () => {
    if (!newPersonName.trim()) return
    const newP = {
      id: `custom-${Date.now()}`,
      name: newPersonName.trim(),
      role: 'Roommate',
      paid: false,
    }
    setParticipants((prev) => [...prev, newP])
    setNewPersonName('')
  }

  const getShare = (participantId) => {
    const total = parseFloat(totalAmount) || 0
    const count = participants.length
    if (count === 0) return 0
    if (splitMode === 'equal') return total / count
    const pct = parseFloat(customShares[participantId]) || 0
    return (total * pct) / 100
  }

  const customTotal = participants.reduce(
    (sum, p) => sum + (parseFloat(customShares[p.id]) || 0),
    0
  )

  const canProceedFromConfirm =
    utilityType && totalAmount && parseFloat(totalAmount) > 0

  const canProceedFromSplit =
    participants.length > 0 &&
    (splitMode === 'equal' || Math.abs(customTotal - 100) < 0.1)

  const finalizeSplit = () => {
    const total = parseFloat(totalAmount)
    const newSplit = {
      id: Date.now(),
      utilityType,
      provider,
      dueDate,
      total,
      billPreview,
      createdAt: new Date().toISOString(),
      splitMode,
      participants: participants.map((p) => ({
        ...p,
        share: getShare(p.id),
        paid: false,
      })),
    }
    setSplits((prev) => [newSplit, ...prev])
    setStep('summary')
  }

  const togglePaid = (splitId, participantId) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? {
              ...s,
              participants: s.participants.map((p) =>
                p.id === participantId ? { ...p, paid: !p.paid } : p
              ),
            }
          : s
      )
    )
  }

  const deleteSplit = (splitId) => {
    setSplits((prev) => prev.filter((s) => s.id !== splitId))
  }

  const getUtilityIcon = (type) => {
    const found = UTILITY_TYPES.find((u) => u.value === type)
    const Icon = found?.icon || FileText
    return <Icon size={18} className={found?.color || 'text-gray-500'} />
  }

  // ── Main list view ──────────────────────────────────────────────
  if (!showNewSplit && step !== 'summary') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bill Splits</h3>
            <p className="text-sm text-gray-500">
              Upload a bill and split it with your roommates
            </p>
          </div>
          <button
            onClick={() => { setShowNewSplit(true); setStep('upload') }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} /> Split a Bill
          </button>
        </div>

        {splits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <SplitSquareHorizontal size={26} className="text-brand-400" />
            </div>
            <h4 className="font-semibold text-gray-700 mb-1">No bills split yet</h4>
            <p className="text-gray-400 text-sm max-w-xs">
              Upload a utility bill and Rentra will automatically divide it
              among your roommates.
            </p>
            <button
              onClick={() => { setShowNewSplit(true); setStep('upload') }}
              className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
            >
              Split your first bill
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {splits.map((split) => {
              const paidCount = split.participants.filter((p) => p.paid).length
              const allPaid = paidCount === split.participants.length
              return (
                <div
                  key={split.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                        {getUtilityIcon(split.utilityType)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">
                          {UTILITY_TYPES.find((u) => u.value === split.utilityType)?.label || split.utilityType}
                        </p>
                        <p className="text-xs text-gray-400">
                          {split.provider || 'No provider'} •{' '}
                          {split.dueDate
                            ? `Due ${new Date(split.dueDate).toLocaleDateString()}`
                            : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          allPaid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {allPaid ? 'Settled' : `${paidCount}/${split.participants.length} paid`}
                      </span>
                      <button
                        onClick={() => deleteSplit(split.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${split.total.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ${(split.total / split.participants.length).toFixed(2)} / person
                    </span>
                  </div>

                  <div className="space-y-2">
                    {split.participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-t border-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} size="sm" />
                          <span className="text-sm font-medium text-gray-700">
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            ${p.share.toFixed(2)}
                          </span>
                          <button
                            onClick={() => togglePaid(split.id, p.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                              p.paid
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {p.paid ? (
                              <><CheckCircle size={12} /> Paid</>
                            ) : (
                              <><Clock size={12} /> Unpaid</>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── New split wizard ────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {step === 'summary' ? 'Split Created!' : 'Split a Bill'}
        </h3>
        <button
          onClick={reset}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {step !== 'summary' && <StepIndicator currentStep={step} />}

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !billFile && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              billFile
                ? 'border-brand-300 bg-brand-50'
                : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {billFile ? (
              <div className="flex flex-col items-center gap-3">
                {billPreview && billPreview !== 'pdf' ? (
                  <img
                    src={billPreview}
                    alt="Bill preview"
                    className="max-h-40 rounded-lg object-contain border border-brand-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center">
                    <FileText size={32} className="text-brand-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-brand-600">{billFile.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(billFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBillFile(null)
                    setBillPreview(null)
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Upload size={26} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">
                    Drop your bill here or click to browse
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Supports JPG, PNG, PDF
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!billFile}
            onClick={() => setStep('confirm')}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Next: Confirm Amount <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 'confirm' && (
        <div className="space-y-5">
          {billPreview && billPreview !== 'pdf' && (
            <img
              src={billPreview}
              alt="Bill"
              className="w-full max-h-40 object-contain rounded-xl border border-gray-200"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utility Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {UTILITY_TYPES.map((u) => {
                const Icon = u.icon
                return (
                  <button
                    key={u.value}
                    onClick={() => setUtilityType(u.value)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                      utilityType === u.value
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} className={u.color} />
                    {u.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <input
                type="text"
                placeholder="e.g. SDG&E"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              disabled={!canProceedFromConfirm}
              onClick={() => setStep('split')}
              className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next: Split <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Split ── */}
      {step === 'split' && (
        <div className="space-y-5">
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-brand-600 font-medium">Total bill</span>
            <span className="text-xl font-bold text-brand-600">
              ${parseFloat(totalAmount).toFixed(2)}
            </span>
          </div>

          {/* Split mode toggle */}
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
            <button
              onClick={() => setSplitMode('equal')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                splitMode === 'equal'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Equal Split
            </button>
            <button
              onClick={() => setSplitMode('custom')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                splitMode === 'custom'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Custom %
            </button>
          </div>

          {/* Contacts */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Select roommates to split with
            </p>
            <div className="space-y-2">
              {SAMPLE_CONTACTS.map((contact) => {
                const selected = !!participants.find((p) => p.id === contact.id)
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleParticipant(contact)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                      selected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={contact.name} size="sm" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-400">{contact.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selected && splitMode === 'custom' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={customShares[contact.id] || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setCustomShares((prev) => ({
                                ...prev,
                                [contact.id]: e.target.value,
                              }))
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:border-brand-500"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}
                      {selected && splitMode === 'equal' && (
                        <span className="text-sm font-semibold text-brand-600">
                          $
                          {(
                            parseFloat(totalAmount) / participants.length
                          ).toFixed(2)}
                        </span>
                      )}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selected && <Check size={11} className="text-white" />}
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Custom-added participants */}
              {participants
                .filter((p) => p.id.startsWith('custom-'))
                .map((p) => (
                  <div
                    key={p.id}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-brand-500 bg-brand-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <p className="text-sm font-medium text-gray-800">
                        {p.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {splitMode === 'custom' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={customShares[p.id] || ''}
                            onChange={(e) =>
                              setCustomShares((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:border-brand-500"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}
                      {splitMode === 'equal' && (
                        <span className="text-sm font-semibold text-brand-600">
                          ${(parseFloat(totalAmount) / participants.length).toFixed(2)}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          setParticipants((prev) =>
                            prev.filter((x) => x.id !== p.id)
                          )
                        }
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Add custom person */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Add person by name…"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomPerson()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={addCustomPerson}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Custom % validation */}
          {splitMode === 'custom' && participants.length > 0 && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                Math.abs(customTotal - 100) < 0.1
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}
            >
              Total assigned: {customTotal.toFixed(1)}%{' '}
              {Math.abs(customTotal - 100) < 0.1
                ? '✓'
                : `— needs to equal 100%`}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              disabled={!canProceedFromSplit}
              onClick={finalizeSplit}
              className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Split
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Summary ── */}
      {step === 'summary' && splits.length > 0 && (
        <div className="space-y-5">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">
              Bill split created!
            </h4>
            <p className="text-gray-500 text-sm">
              ${splits[0].total.toFixed(2)} split among{' '}
              {splits[0].participants.length} people
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {splits[0].participants.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx !== 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size="sm" />
                  <span className="text-sm font-medium text-gray-800">
                    {p.name}
                  </span>
                </div>
                <span className="text-base font-bold text-gray-900">
                  ${p.share.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
