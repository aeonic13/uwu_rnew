import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { ArrowLeft, Send, Calendar, MoreVertical, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { messagingService } from '../../services/messagingService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Normalize API message shape to component shape
 */
function normalizeMessage(apiMsg, currentUserId) {
  return {
    id: apiMsg.id,
    text: apiMsg.content || '',
    type: apiMsg.type || 'text',
    metadata: apiMsg.metadata || null,
    sender:
      apiMsg.sender?.id === currentUserId || apiMsg.senderId === currentUserId
        ? 'me'
        : 'other',
    timestamp: apiMsg.createdAt,
    read: apiMsg.read ?? true,
  }
}

/**
 * Normalize API conversation detail to component shape
 */
function normalizeConversationDetail(apiData, currentUserId) {
  const conv = apiData.conversation
  const otherUserEntry = conv.users?.find(u => u.user?.id !== currentUserId)
  const otherUser = otherUserEntry?.user

  // Messages come newest-first from API — reverse for chronological display
  const messages = (apiData.messages || [])
    .slice()
    .reverse()
    .map(m => normalizeMessage(m, currentUserId))

  return {
    id: conv.id,
    listing: {
      id: conv.listing?.id,
      title: conv.listing?.title || 'Listing',
      price: conv.listing?.price,
      image: conv.listing?.images?.[0] || null,
    },
    participant: {
      id: otherUser?.id,
      name: otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : 'Unknown',
      avatar: otherUser?.avatarUrl || null,
      online: false,
    },
    messages,
  }
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * Message bubble component
 */
function MessageBubble({ message, isMe }) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isMe
            ? 'bg-brand-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <span
          className={`text-xs mt-1 block ${
            isMe ? 'text-brand-200' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
  }).isRequired,
  isMe: PropTypes.bool.isRequired,
}

/** Human-readable date + time for a proposed tour slot. */
function formatSlot(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Tour request card. The recipient of a pending request can confirm one of
 * the proposed times or decline; everyone else sees the current status.
 */
function TourRequestCard({ message, isMe, onRespond, responding }) {
  const meta = message.metadata || {}
  const times = Array.isArray(meta.proposedTimes) ? meta.proposedTimes : []
  const status = meta.status || 'pending'

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className="max-w-[85%] w-full sm:w-auto rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <div className="flex items-center gap-2 mb-2 text-brand-600 font-semibold text-sm">
          <Calendar size={16} />
          Tour request
        </div>
        {message.text && (
          <p className="text-sm text-gray-700 mb-2">{message.text}</p>
        )}

        {status === 'pending' && !isMe ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Pick a time to confirm:</p>
            {times.map(t => (
              <button
                key={t}
                disabled={responding}
                onClick={() => onRespond(message.id, 'confirmed', t)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-brand-300 text-sm font-medium text-brand-600 hover:bg-brand-100 transition-colors disabled:opacity-50"
              >
                {formatSlot(t)}
              </button>
            ))}
            <button
              disabled={responding}
              onClick={() => onRespond(message.id, 'declined', null)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {times.map(t => (
              <div
                key={t}
                className={`text-sm px-3 py-1.5 rounded-lg ${
                  status === 'confirmed' && meta.confirmedTime === t
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'bg-white text-gray-600'
                }`}
              >
                {formatSlot(t)}
              </div>
            ))}
            <p className="text-xs mt-1 font-medium text-gray-500">
              {status === 'pending'
                ? 'Waiting for a response…'
                : status === 'confirmed'
                  ? '✓ Tour confirmed'
                  : 'Declined'}
            </p>
          </div>
        )}
        <span className="text-xs mt-2 block text-gray-400">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

TourRequestCard.propTypes = {
  message: PropTypes.object.isRequired,
  isMe: PropTypes.bool.isRequired,
  onRespond: PropTypes.func.isRequired,
  responding: PropTypes.bool,
}

/**
 * Modal for proposing tour times: up to three datetime slots + a note.
 */
function ScheduleTourModal({ onClose, onSend, sending }) {
  const [slots, setSlots] = useState([''])
  const [note, setNote] = useState('')

  const validSlots = slots.filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a tour"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-1">Schedule a tour</h2>
        <p className="text-sm text-gray-600 mb-4">
          Propose up to three times — they confirm one, and it's set.
        </p>

        <div className="space-y-3 mb-4">
          {slots.map((slot, i) => (
            <input
              key={i}
              type="datetime-local"
              value={slot}
              aria-label={`Proposed time ${i + 1}`}
              onChange={e =>
                setSlots(prev =>
                  prev.map((s, idx) => (idx === i ? e.target.value : s))
                )
              }
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          ))}
          {slots.length < 3 && (
            <button
              type="button"
              onClick={() => setSlots(prev => [...prev, ''])}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              + Add another time
            </button>
          )}
        </div>

        <textarea
          rows={2}
          value={note}
          maxLength={300}
          placeholder="Anything they should know? (optional)"
          onChange={e => setNote(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={validSlots.length === 0 || sending}
            onClick={() =>
              onSend(
                validSlots.map(s => new Date(s).toISOString()),
                note.trim()
              )
            }
            className="flex-1 bg-brand-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}

ScheduleTourModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  sending: PropTypes.bool,
}

/**
 * Date separator
 */
function DateSeparator({ date }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        {formatDate(date)}
      </span>
    </div>
  )
}

DateSeparator.propTypes = {
  date: PropTypes.string.isRequired,
}

/**
 * Conversation View - Individual chat
 */
function ConversationView() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [conversation, setConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showTourModal, setShowTourModal] = useState(false)
  const [tourSending, setTourSending] = useState(false)
  const [tourResponding, setTourResponding] = useState(false)

  // Shared fetcher: initial load shows the spinner; silent refreshes
  // (polling, post-action) never do.
  const fetchConversation = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      try {
        const data = await messagingService.getConversation(conversationId)
        const normalized = normalizeConversationDetail(data, user?.id)
        setConversation(normalized)
      } catch (err) {
        console.error('Failed to load conversation:', err)
        if (!silent) setConversation(null)
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [conversationId, user?.id]
  )

  useEffect(() => {
    if (!conversationId) return undefined
    fetchConversation()
    // Lightweight polling so replies appear without a manual refresh.
    const timer = setInterval(() => fetchConversation(true), 15000)
    return () => clearInterval(timer)
  }, [conversationId, fetchConversation])

  // Scroll to bottom on new messages. Keyed on the count (not array
  // identity) so silent polling refreshes don't yank the scroll position.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages?.length])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: 'me',
      timestamp: new Date().toISOString(),
      read: false,
    }

    // Optimistically add message
    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
    setNewMessage('')

    // Send via API (optimistic update already applied)
    try {
      await messagingService.sendMessage(conversationId, newMessage.trim())
    } catch (err) {
      console.error('Failed to send message:', err)
      // Revert optimistic update and restore the text so it isn't lost
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== message.id),
      }))
      setNewMessage(message.text)
    }

    setIsSending(false)
    inputRef.current?.focus()
  }

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Tour scheduling — real flow over the tour-request/response endpoints.
  const handleScheduleTour = () => setShowTourModal(true)

  const handleSendTourRequest = async (proposedTimes, note) => {
    setTourSending(true)
    try {
      await messagingService.sendTourRequest(
        conversationId,
        conversation?.listing?.id,
        proposedTimes,
        note || null
      )
      setShowTourModal(false)
      await fetchConversation(true)
    } catch (err) {
      console.error('Failed to send tour request:', err)
    } finally {
      setTourSending(false)
    }
  }

  const handleTourRespond = async (messageId, status, confirmedTime) => {
    setTourResponding(true)
    try {
      await messagingService.respondToTourRequest(
        messageId,
        status,
        confirmedTime
      )
      await fetchConversation(true)
    } catch (err) {
      console.error('Failed to respond to tour request:', err)
    } finally {
      setTourResponding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Conversation not found
        </h2>
        <button
          onClick={() => navigate('/messages')}
          className="text-brand-500 hover:underline"
        >
          Back to messages
        </button>
      </div>
    )
  }

  // Group messages by date
  const groupedMessages = conversation.messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>

          <img
            src={conversation.participant.avatar}
            alt={conversation.participant.name}
            className="w-10 h-10 rounded-full mr-3"
          />

          <div className="flex-1">
            <h2 className="font-semibold">{conversation.participant.name}</h2>
            {/* Presence indicator removed — it was hardcoded to "Offline"
                (no real presence system exists). */}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScheduleTour}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Schedule tour"
            >
              <Calendar size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Property Info Bar */}
        <div
          className="flex items-center px-4 py-2 bg-gray-50 border-t cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => navigate(`/listings/${conversation.listing.id}`)}
        >
          <img
            src={conversation.listing.image}
            alt={conversation.listing.title}
            className="w-12 h-12 rounded-lg object-cover mr-3"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {conversation.listing.title}
            </p>
            <p className="text-sm text-green-600 font-semibold">
              ${conversation.listing.price}/mo
            </p>
          </div>
          <Info size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date}>
            <DateSeparator date={messages[0].timestamp} />
            {messages.map(message =>
              message.type === 'tour-request' ? (
                <TourRequestCard
                  key={message.id}
                  message={message}
                  isMe={message.sender === 'me'}
                  onRespond={handleTourRespond}
                  responding={tourResponding}
                />
              ) : (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMe={message.sender === 'me'}
                />
              )
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <div className="flex items-end gap-2">
          {/* Dead attach buttons removed — attachments aren't supported yet. */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none max-h-32"
              style={{ minHeight: '40px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-colors ${
              newMessage.trim() && !isSending
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-100 text-gray-400'
            }`}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Options Menu */}
      {showOptions && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* "Call Owner" removed — it was a dead button (no phone flow). */}
            <button
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
              onClick={() => {
                navigate(`/listings/${conversation.listing.id}`)
                setShowOptions(false)
              }}
            >
              <Info size={18} className="mr-3 text-gray-500" />
              View Listing
            </button>
            <button
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
              onClick={() => {
                setShowOptions(false)
                handleScheduleTour()
              }}
            >
              <Calendar size={18} className="mr-3 text-gray-500" />
              Schedule Tour
            </button>
          </div>
        </div>
      )}

      {/* Tour scheduling modal */}
      {showTourModal && (
        <ScheduleTourModal
          onClose={() => setShowTourModal(false)}
          onSend={handleSendTourRequest}
          sending={tourSending}
        />
      )}
    </div>
  )
}

export default ConversationView
