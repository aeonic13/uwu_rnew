import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Search,
  MessageCircle,
  Check,
  CheckCheck,
  Users,
  Home,
  Inbox,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { messagingService } from '../../services/messagingService'
import { groupsService } from '../../services/groupsService'
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
      userType: otherUser?.userType || null,
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
    // Listing thread with no application yet — lives in the Inquiries tab
    // until the tenant applies, then moves to Direct automatically.
    isInquiry: !!apiConv.isInquiry,
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
 * Who-am-I-talking-to chip: landlord threads look different from
 * tenant/housemate threads at a glance.
 */
function RoleChip({ userType, viewerType }) {
  if (!userType) return null
  const isLandlord = userType === 'owner'
  const label = isLandlord
    ? 'Landlord'
    : viewerType === 'owner'
      ? 'Tenant'
      : 'Housemate'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
        isLandlord
          ? 'bg-brand-100 text-brand-600'
          : 'bg-purple-100 text-purple-700'
      }`}
    >
      <Home size={10} className="mr-1" />
      {label}
    </span>
  )
}

RoleChip.propTypes = {
  userType: PropTypes.string,
  viewerType: PropTypes.string,
}

/**
 * Conversation card component
 */
function ConversationCard({ conversation, viewerType, onClick }) {
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
          <span className="flex items-center gap-2 min-w-0">
            <span
              className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
            >
              {conversation.participant.name}
            </span>
            <RoleChip
              userType={conversation.participant.userType}
              viewerType={viewerType}
            />
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
      userType: PropTypes.string,
    }).isRequired,
    lastMessage: PropTypes.shape({
      text: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      isRead: PropTypes.bool,
      sender: PropTypes.string,
    }),
    unreadCount: PropTypes.number,
  }).isRequired,
  viewerType: PropTypes.string,
  onClick: PropTypes.func.isRequired,
}

/**
 * Rental group chat card — distinct look from direct threads.
 */
function GroupChatCard({ group, onClick }) {
  const lm = group.lastMessage
  return (
    <button
      onClick={() => onClick(group.id)}
      className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
    >
      <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Users size={24} className="text-brand-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-700 truncate">
              {group.name}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 flex-shrink-0">
              <Users size={10} className="mr-1" />
              Rental group
            </span>
          </span>
          {lm && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatRelativeTime(lm.timestamp)}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-500 mb-1">
          {group.members?.length || 0} members
        </div>

        <p className="text-sm text-gray-600 truncate">
          {lm ? `${lm.senderName}: ${lm.content}` : 'No messages yet'}
        </p>
      </div>
    </button>
  )
}

GroupChatCard.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    members: PropTypes.array,
    lastMessage: PropTypes.shape({
      content: PropTypes.string,
      senderName: PropTypes.string,
      timestamp: PropTypes.string,
    }),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

/**
 * Messages View - direct conversations and rental-group chats
 */
function MessagesView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isStudent = user?.userType === 'student'

  const [activeTab, setActiveTab] = useState('direct')
  const [conversations, setConversations] = useState([])
  const [groups, setGroups] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchAll = async (silent = false) => {
      if (!silent) setIsLoading(true)
      try {
        const [convData, groupData] = await Promise.all([
          messagingService.getConversations(),
          // Groups are a tenant feature; owners only have direct threads.
          isStudent ? groupsService.listMy().catch(() => []) : [],
        ])
        if (!active) return
        const normalized = (convData.conversations || []).map(
          normalizeConversation
        )
        setConversations(normalized)
        setGroups(groupData || [])
        // First load: land on Inquiries when that's all there is, so the
        // list doesn't open on an empty Direct tab.
        if (
          !silent &&
          normalized.length > 0 &&
          normalized.every(c => c.isInquiry)
        ) {
          setActiveTab('inquiries')
        }
      } catch (err) {
        console.error('Failed to load conversations:', err)
      } finally {
        if (!silent && active) setIsLoading(false)
      }
    }

    fetchAll()
    // Refresh the lists quietly so new conversations/unreads show up.
    const timer = setInterval(() => fetchAll(true), 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [isStudent])

  const handleConversationClick = conversationId => {
    navigate(`/messages/${conversationId}`)
  }

  const handleGroupClick = groupId => {
    navigate(`/groups/${groupId}/chat`)
  }

  const term = searchTerm.toLowerCase()
  const matchesSearch = conversation => {
    if (!term) return true
    return (
      conversation.participant.name.toLowerCase().includes(term) ||
      conversation.listing.title.toLowerCase().includes(term) ||
      (conversation.lastMessage?.text || '').toLowerCase().includes(term)
    )
  }
  const inquiries = conversations.filter(c => c.isInquiry)
  const directConversations = conversations.filter(c => !c.isInquiry)
  const filteredInquiries = inquiries.filter(matchesSearch)
  const filteredDirect = directConversations.filter(matchesSearch)
  const filteredGroups = groups.filter(group => {
    if (!term) return true
    return (
      group.name.toLowerCase().includes(term) ||
      (group.lastMessage?.content || '').toLowerCase().includes(term)
    )
  })

  const unreadOf = list =>
    list.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  const unreadCount = unreadOf(conversations)
  const inquiryUnread = unreadOf(inquiries)
  const directUnread = unreadOf(directConversations)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const showGroupsTab = isStudent
  const tabUnread = { inquiries: inquiryUnread, direct: directUnread }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="p-4 pb-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
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

        {/* Inquiries vs Direct vs Rental Groups */}
        <div className="flex border-t">
          {[
            {
              id: 'inquiries',
              label: 'Inquiries',
              icon: Inbox,
              count: inquiries.length,
            },
            {
              id: 'direct',
              label: 'Direct',
              icon: MessageCircle,
              count: directConversations.length,
            },
            ...(showGroupsTab
              ? [
                  {
                    id: 'groups',
                    label: 'Rental Groups',
                    icon: Users,
                    count: groups.length,
                  },
                ]
              : []),
          ].map(tab => {
            const Icon = tab.icon
            const badge = tabUnread[tab.id] || 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <Icon size={16} />
                {tab.label} ({tab.count})
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Inquiries — listing threads with no application yet */}
      {activeTab === 'inquiries' &&
        (filteredInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Inbox size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No inquiries found' : 'No open inquiries'}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {searchTerm
                ? 'Try a different search term'
                : isStudent
                  ? 'Message a landlord from any listing to ask questions. Once you apply, the conversation moves to Direct.'
                  : 'When renters message you about a listing before applying, they show up here. Once they apply, the thread moves to Direct.'}
            </p>
            {!searchTerm && isStudent && (
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
            {filteredInquiries.map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                viewerType={user?.userType}
                onClick={handleConversationClick}
              />
            ))}
          </div>
        ))}

      {/* Direct — applied conversations and everything non-listing */}
      {activeTab === 'direct' &&
        (filteredDirect.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageCircle size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No conversations found' : 'No direct messages yet'}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {searchTerm
                ? 'Try a different search term'
                : isStudent
                  ? 'Conversations move here automatically once you apply to a place. Housemate chats live here too.'
                  : 'Conversations with your applicants and tenants appear here.'}
            </p>
          </div>
        ) : (
          <div>
            {filteredDirect.map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                viewerType={user?.userType}
                onClick={handleConversationClick}
              />
            ))}
          </div>
        ))}

      {/* Rental group chats */}
      {showGroupsTab &&
        activeTab === 'groups' &&
        (filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Users size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No groups found' : 'No rental groups yet'}
            </h3>
            <p className="text-gray-500 text-center">
              {searchTerm
                ? 'Try a different search term'
                : 'Create a group with friends to chat, share listings, and apply together'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/groups/create')}
                className="mt-4 bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Create a Group
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredGroups.map(group => (
              <GroupChatCard
                key={group.id}
                group={group}
                onClick={handleGroupClick}
              />
            ))}
          </div>
        ))}
    </div>
  )
}

export default MessagesView
