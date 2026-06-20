import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  FileText,
  Calendar,
  User,
  Shield,
  Users,
  Home,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  X,
  Clock,
  Phone,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the initial system message that opens the group thread. Fully dynamic. */
const buildOpeningMessage = (groupApplication, landlordName) => {
  const tenantNames = groupApplication.members.map(m => m.name).join(', ')
  const guarantorNames = groupApplication.members
    .filter(m => m.guarantor)
    .map(m => m.guarantor.name)
    .join(', ')

  let body = `Hi ${tenantNames}! 👋\n\nCongratulations — your application for **${groupApplication.propertyTitle}** has been approved!\n\nI'm ${landlordName || 'your landlord'} and I've created this group thread so we can coordinate the next steps: confirm move-in date, schedule a walkthrough, and finalise the lease.`

  if (guarantorNames) {
    body += `\n\n${guarantorNames} (guarantor${groupApplication.members.filter(m => m.guarantor).length > 1 ? 's' : ''}) — you'll also receive a separate email to co-sign the lease.`
  }

  body += `\n\nLooking forward to welcoming you all! Feel free to ask any questions here.`
  return body
}

// ─── Tour Scheduling Card ──────────────────────────────────────────────────────

const TourScheduleCard = ({ onSchedule, onDismiss }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('in-person') // 'in-person' | 'virtual'

  return (
    <div className="border-2 border-brand-200 rounded-xl p-4 bg-brand-50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar size={16} className="text-brand-500 mr-2" />
          <span className="font-semibold text-blue-800 text-sm">Schedule Walkthrough</span>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {['in-person', 'virtual'].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              type === t
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-gray-300 text-gray-600 hover:border-brand-300'
            }`}
          >
            {t === 'in-person' ? '🏠 In-Person' : '💻 Virtual'}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          if (!date || !time) return
          onSchedule({ date, time, type })
        }}
        disabled={!date || !time}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
          date && time
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Send Tour Invite
      </button>
    </div>
  )
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isLandlord }) => {
  const isSystem = msg.type === 'system'
  const isMe = isLandlord && msg.sender === 'landlord'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-gray-100 rounded-xl px-4 py-3 max-w-xs text-center">
          <p className="text-xs text-gray-500 whitespace-pre-line">{msg.text}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'tour') {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 max-w-xs">
          <div className="flex items-center mb-1">
            <Calendar size={14} className="text-brand-500 mr-1" />
            <span className="text-xs font-semibold text-blue-800">Walkthrough Scheduled</span>
          </div>
          <p className="text-xs text-brand-600">{msg.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isMe && (
        <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-auto">
          <User size={13} className="text-purple-600" />
        </div>
      )}
      <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${
        isMe
          ? 'bg-brand-500 text-white rounded-br-sm'
          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
      }`}>
        {!isMe && (
          <p className="text-xs font-semibold mb-1 text-purple-700">{msg.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-line">{msg.text}</p>
        <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>{msg.time}</p>
      </div>
    </div>
  )
}

// ─── Participants Bar ──────────────────────────────────────────────────────────

const ParticipantsBar = ({ groupApplication, landlordName }) => {
  const [expanded, setExpanded] = useState(false)

  const tenants    = groupApplication.members
  const guarantors = groupApplication.members.filter(m => m.guarantor).map(m => m.guarantor)

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center text-xs text-gray-500 font-medium"
      >
        <Users size={13} className="mr-1 text-gray-400" />
        {tenants.length + guarantors.length + 1} participants
        <span className="ml-1 text-gray-300">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          {/* Landlord */}
          <div className="flex items-center">
            <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center mr-2">
              <Home size={11} className="text-brand-500" />
            </div>
            <span className="text-xs font-medium">{landlordName || 'Landlord'}</span>
            <span className="ml-2 text-xs text-brand-500 bg-brand-50 px-1.5 rounded">You</span>
          </div>
          {/* Tenants */}
          {tenants.map((m, i) => (
            <div key={i} className="flex items-center">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                <User size={11} className="text-purple-600" />
              </div>
              <span className="text-xs">{m.name}</span>
              <span className="ml-2 text-xs text-gray-400">{m.email}</span>
            </div>
          ))}
          {/* Guarantors */}
          {guarantors.map((g, i) => (
            <div key={i} className="flex items-center">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <Shield size={11} className="text-green-600" />
              </div>
              <span className="text-xs">{g.name}</span>
              <span className="ml-2 text-xs text-gray-400">Guarantor</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LandlordApplicationChat = ({
  groupApplication,
  listing,
  landlordUser,
  onBack,
  onSendLease,    // () => void — navigate to lease router
}) => {
  const landlordName = landlordUser?.name || 'Landlord'

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      type: 'system',
      text: `Group thread created for ${groupApplication?.groupName}`,
      time: 'Just now',
    },
    {
      id: 2,
      type: 'text',
      sender: 'landlord',
      senderName: landlordName,
      text: buildOpeningMessage(groupApplication, landlordName),
      time: 'Just now',
    },
  ])
  const [input, setInput] = useState('')
  const [showTourCard, setShowTourCard] = useState(false)
  const [tourScheduled, setTourScheduled] = useState(
    groupApplication?.tourStatus === 'scheduled'
  )
  const [leaseSent, setLeaseSent] = useState(
    ['lease_sent', 'pending_signatures', 'fully_executed'].includes(groupApplication?.status)
  )

  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const now = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'text', sender: 'landlord', senderName: landlordName, text: input.trim(), time: now() },
    ])
    setInput('')

    // Simulate a tenant reply after a short delay (demo)
    const firstTenant = groupApplication?.members?.[0]
    if (firstTenant) {
      setTimeout(() => {
        const replies = [
          'Thanks for reaching out! We\'re very excited about the place.',
          'Sounds great! When would be a good time for a walkthrough?',
          'We\'re available most evenings and weekends. Just let us know!',
        ]
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'text',
            sender: 'tenant',
            senderName: firstTenant.name,
            text: replies[Math.floor(Math.random() * replies.length)],
            time: now(),
          },
        ])
      }, 1800)
    }
  }

  const handleScheduleTour = ({ date, time, type }) => {
    setTourScheduled(true)
    setShowTourCard(false)
    const label = `${type === 'virtual' ? 'Virtual' : 'In-person'} walkthrough confirmed for ${date} at ${time}`
    setMessages(prev => [
      ...prev,
      { id: Date.now(), type: 'tour', sender: 'landlord', senderName: landlordName, text: label, time: now() },
    ])
  }

  const handleSendLease = () => {
    setLeaseSent(true)
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'text',
        sender: 'landlord',
        senderName: landlordName,
        text: `📄 I've just sent the lease for review and signatures. Each of you will receive it in signing order. Please sign at your earliest convenience!`,
        time: now(),
      },
    ])
    setTimeout(() => onSendLease(), 800)
  }

  if (!groupApplication) return null

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 flex-shrink-0">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Users size={17} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{groupApplication.groupName}</p>
          <p className="text-xs text-gray-500 truncate">{groupApplication.propertyTitle}</p>
        </div>
        {/* Send Lease CTA */}
        {!leaseSent ? (
          <button
            onClick={handleSendLease}
            className="flex items-center bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-green-700 transition-colors flex-shrink-0"
          >
            <FileText size={14} className="mr-1" />
            Send Lease
          </button>
        ) : (
          <span className="flex items-center text-xs text-green-600 font-medium flex-shrink-0">
            <CheckCircle size={14} className="mr-1" /> Lease Sent
          </span>
        )}
      </div>

      {/* ── Participants bar ── */}
      <ParticipantsBar
        groupApplication={groupApplication}
        landlordName={landlordName}
      />

      {/* ── Property pill ── */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-600">
            <Home size={13} className="mr-1 text-brand-500" />
            <span className="font-medium">{listing?.title || groupApplication.propertyTitle}</span>
            {listing?.price && (
              <span className="ml-2 text-gray-400">· ${listing.price}/mo</span>
            )}
          </div>
          <button
            onClick={() => setShowTourCard(v => !v)}
            className={`flex items-center text-xs px-2 py-1 rounded-lg border transition-colors ${
              tourScheduled
                ? 'border-green-300 text-green-600 bg-green-50'
                : 'border-brand-300 text-brand-500 hover:bg-brand-50'
            }`}
          >
            <Calendar size={12} className="mr-1" />
            {tourScheduled ? 'Tour Scheduled ✓' : 'Schedule Tour'}
          </button>
        </div>

        {showTourCard && !tourScheduled && (
          <div className="mt-2">
            <TourScheduleCard
              onSchedule={handleScheduleTour}
              onDismiss={() => setShowTourCard(false)}
            />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isLandlord />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0">
        {!leaseSent && (
          <div className="mb-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <div className="flex items-center">
              <FileText size={14} className="text-green-600 mr-2" />
              <span className="text-xs text-green-800 font-medium">
                Ready to send the lease to {groupApplication.members.length} tenant{groupApplication.members.length !== 1 ? 's' : ''}
                {groupApplication.members.filter(m => m.guarantor).length > 0
                  ? ` + ${groupApplication.members.filter(m => m.guarantor).length} guarantor${groupApplication.members.filter(m => m.guarantor).length !== 1 ? 's' : ''}`
                  : ''}
              </span>
            </div>
            <button
              onClick={handleSendLease}
              className="text-xs font-semibold text-green-600 hover:underline"
            >
              Send →
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message the group…"
            className="flex-1 p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className={`p-3 rounded-xl transition-colors ${
              input.trim()
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandlordApplicationChat
