import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Search, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { messagingService } from '../../services/messagingService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Normalize API conversation shape to component shape
 */
function normalizeConversation(apiConv) {
  const otherUser = apiConv.otherUsers?.[0]
  const lm = apiConv.lastMessage
  return {
    id: apiConv.id,
    listingId: apiConv.listing?.id,
    listing: {
      title: apiConv.listing?.title || 'Listing',
      image: apiConv.listing?.images?.[0] || null,
    },
    participant: {
      name: otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : 'Unknown',
      avatar: otherUser?.avatarUrl || null,
    },
    lastMessage: lm
      ? {
          text: lm.content || '',
          timestamp: lm.timestamp,
          isRead: apiConv.unreadCount === 0,
          sender: lm.isOwn ? 'me' : 'other',
        }
      : null,
    unreadCount: apiConv.unreadCount || 0,
  }
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Conversation card component
 */
function ConversationCard({ conversation, onClick }) {
  const isUnread = conversation.unreadCount > 0
  const lm = conversation.lastMessage
  const isFromMe = lm?.sender === 'me'

  return (
    <button
      onClick={() => onClick(conversation.id)}
      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 ${
        isUnread ? 'bg-brand-50/50' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={
            conversation.participant.avatar || 'https://via.placeholder.com/56'
          }
          alt={conversation.participant.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {conversation.unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span
            className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
          >
            {conversation.participant.name}
          </span>
          {lm && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatRelativeTime(lm.timestamp)}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-500 mb-1 truncate">
          {conversation.listing.title}
        </div>

        <div className="flex items-center gap-1">
          {isFromMe && lm && (
            <span className="flex-shrink-0">
              {lm.isRead ? (
                <CheckCheck size={14} className="text-brand-500" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
          <p
            className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}
          >
            {lm?.text || 'No messages yet'}
          </p>
        </div>
      </div>
    </button>
  )
}

ConversationCard.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    listing: PropTypes.shape({
      title: PropTypes.string.isRequired,
      image: PropTypes.string,
    }).isRequired,
    participant: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    }).isRequired,
    lastMessage: PropTypes.shape({
      text: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      isRead: PropTypes.bool,
      sender: PropTypes.string,
    }).isRequired,
    unreadCount: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

/**
 * Messages View - List of conversations
 */
function MessagesView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if coming from a listing to start new conversation
  const listingId = searchParams.get('listingId')

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        const data = await messagingService.getConversations()
        const normalized = (data.conversations || []).map(normalizeConversation)
        setConversations(normalized)
      } catch (err) {
        console.error('Failed to load conversations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Handle new conversation from listing
  useEffect(() => {
    if (listingId) {
      // Check if conversation already exists
      const existingConvo = conversations.find(
        c => c.listingId === parseInt(listingId)
      )
      if (existingConvo) {
        navigate(`/messages/${existingConvo.id}`, { replace: true })
      } else {
        // Navigate to new conversation
        navigate(`/messages/new?listingId=${listingId}`, { replace: true })
      }
    }
  }, [listingId, conversations, navigate])

  const handleConversationClick = conversationId => {
    navigate(`/messages/${conversationId}`)
  }

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      conversation.participant.name.toLowerCase().includes(term) ||
      conversation.listing.title.toLowerCase().includes(term) ||
      (conversation.lastMessage?.text || '').toLowerCase().includes(term)
    )
  })

  const unreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <MessageCircle size={64} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm ? 'No conversations found' : 'No messages yet'}
          </h3>
          <p className="text-gray-500 text-center">
            {searchTerm
              ? 'Try a different search term'
              : 'Start a conversation by messaging a property owner'}
          </p>
          {!searchTerm && user?.userType === 'student' && (
            <button
              onClick={() => navigate('/listings')}
              className="mt-4 bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Browse Listings
            </button>
          )}
        </div>
      ) : (
        <div>
          {filteredConversations.map(conversation => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onClick={handleConversationClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MessagesView
