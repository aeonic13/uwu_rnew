import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Send, Home, Users, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGroups } from '../../contexts/GroupsContext'
import { groupsService } from '../../services/groupsService'

export default function GroupChat({ groupId: groupIdProp }) {
  const { id: routeGroupId } = useParams()
  const groupId = groupIdProp || routeGroupId
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedGroup, getGroupById } = useGroups()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadError, setLoadError] = useState(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load the group (for the header) when arriving directly at the URL.
  useEffect(() => {
    if (groupId && selectedGroup?.id !== groupId) {
      getGroupById(groupId)
    }
  }, [groupId, selectedGroup?.id, getGroupById])

  // Load group messages
  useEffect(() => {
    if (!groupId) return undefined
    let active = true
    groupsService
      .getMessages(groupId)
      .then(msgs => {
        if (active) setMessages(msgs)
      })
      .catch(err => active && setLoadError(err.message))
    return () => {
      active = false
    }
  }, [groupId])

  const handleSendMessage = async () => {
    const content = newMessage.trim()
    if (!content) return
    setNewMessage('')
    try {
      const message = await groupsService.sendMessage(groupId, content)
      setMessages(prev => [...prev, message])
    } catch (err) {
      console.error('Failed to send message:', err)
      setNewMessage(content) // restore on failure
    }
  }

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = timestamp => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col bg-white h-[calc(100vh-4rem)]">
      {/* Group Header */}
      <div className="bg-brand-500 text-white p-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="p-1 -ml-1 hover:bg-brand-600 rounded-full transition-colors"
            aria-label="Back to group"
          >
            <ArrowLeft size={22} />
          </button>
          <Users size={24} />
          <div>
            <h2 className="font-semibold">
              {selectedGroup?.name || 'Group Chat'}
            </h2>
            <p className="text-sm text-brand-100">
              {selectedGroup?.members?.length || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!loadError && messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              No messages yet — say hi, or share a listing from any property
              page.
            </p>
          </div>
        )}
        {messages.map(message => {
          const isOwnMessage = message.senderId === user.id

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {!isOwnMessage && (
                <img
                  src={message.senderAvatar || 'https://via.placeholder.com/40'}
                  alt={message.senderName}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
              )}

              <div
                className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}
              >
                {/* Sender name */}
                {!isOwnMessage && (
                  <span className="text-sm text-gray-600 mb-1">
                    {message.senderName}
                  </span>
                )}

                {/* Message content */}
                {message.type === 'text' && (
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}

                {/* Listing share — opens the listing */}
                {message.type === 'listing' && message.listingData && (
                  <button
                    onClick={() =>
                      message.listingData.id &&
                      navigate(`/listings/${message.listingData.id}`)
                    }
                    className="max-w-sm text-left border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {message.listingData.image && (
                      <img
                        src={message.listingData.image}
                        alt={message.listingData.title}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {message.listingData.title}
                        </h4>
                        <Home
                          size={16}
                          className="text-brand-500 flex-shrink-0"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {message.listingData.location}
                      </p>
                      {message.listingData.price != null && (
                        <p className="text-lg font-bold text-green-600 mt-2">
                          ${message.listingData.price}/mo
                        </p>
                      )}
                    </div>
                  </button>
                )}

                {/* Timestamp */}
                <span
                  className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : ''}`}
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={20} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

GroupChat.propTypes = {
  groupId: PropTypes.string,
}
