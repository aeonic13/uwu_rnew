import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Send,
  Calendar,
  MoreVertical,
  Phone,
  Info,
  Image,
  Paperclip,
} from 'lucide-react'
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

  useEffect(() => {
    const fetchConversation = async () => {
      setIsLoading(true)
      try {
        const data = await messagingService.getConversation(conversationId)
        const normalized = normalizeConversationDetail(data, user?.id)
        setConversation(normalized)
      } catch (err) {
        console.error('Failed to load conversation:', err)
        setConversation(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (conversationId) {
      fetchConversation()
    }
  }, [conversationId, user?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages])

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

  const handleScheduleTour = () => {
    // TODO: Implement tour scheduling
    navigate(`/listings/${conversation?.listing?.id}`)
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
            <p className="text-xs text-gray-500">
              {conversation.participant.online ? (
                <span className="text-green-500">Online</span>
              ) : (
                'Offline'
              )}
            </p>
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
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isMe={message.sender === 'me'}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <div className="flex items-end gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Attach image"
          >
            <Image size={20} className="text-gray-500" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Attach file"
          >
            <Paperclip size={20} className="text-gray-500" />
          </button>

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
            <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center">
              <Phone size={18} className="mr-3 text-gray-500" />
              Call Owner
            </button>
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
              onClick={handleScheduleTour}
            >
              <Calendar size={18} className="mr-3 text-gray-500" />
              Schedule Tour
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationView
