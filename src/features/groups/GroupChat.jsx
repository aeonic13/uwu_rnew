import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Send, Image, Heart, ThumbsUp, Home, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGroups } from '../../contexts/GroupsContext'

export default function GroupChat({ groupId }) {
  const { user } = useAuth()
  const { selectedGroup } = useGroups()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load group messages
  useEffect(() => {
    if (groupId) {
      // TODO: Replace with API call to fetch group messages
      const sampleMessages = [
        {
          id: '1',
          senderId: '1',
          senderName: 'Sarah Chen',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
          content: 'Hey everyone! I found a great place near campus.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
        },
        {
          id: '2',
          senderId: '2',
          senderName: 'Mike Rodriguez',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          content: 'Nice! Can you share the listing?',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          type: 'text',
        },
        {
          id: '3',
          senderId: '1',
          senderName: 'Sarah Chen',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
          content: null,
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          type: 'listing',
          listingData: {
            id: '1',
            title: 'Cozy 4BR near USC Campus',
            price: 3200,
            location: 'University Park, LA',
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
          },
        },
      ]
      setMessages(sampleMessages)
    }
  }, [groupId])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderAvatar: user.avatarUrl,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
    }

    // TODO: Send message via API
    setMessages([...messages, message])
    setNewMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReaction = (messageId, reaction) => {
    // TODO: Add reaction via API
    console.log(`Add reaction ${reaction} to message ${messageId}`)
  }

  const handleShareListing = (listingId) => {
    // TODO: Share listing in chat
    console.log(`Share listing ${listingId}`)
  }

  const formatTime = (timestamp) => {
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
    <div className="flex flex-col h-full bg-white">
      {/* Group Header */}
      <div className="bg-brand-500 text-white p-4 border-b">
        <div className="flex items-center gap-3">
          <Users size={24} />
          <div>
            <h2 className="font-semibold">{selectedGroup?.name || 'Group Chat'}</h2>
            <p className="text-sm text-brand-100">
              {selectedGroup?.members?.length || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
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

              <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
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

                {/* Listing share */}
                {message.type === 'listing' && message.listingData && (
                  <div className="max-w-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <img
                      src={message.listingData.image}
                      alt={message.listingData.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {message.listingData.title}
                        </h4>
                        <Home size={16} className="text-brand-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {message.listingData.location}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ${message.listingData.price}/mo
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamp and reactions */}
                <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  
                  {/* Quick reactions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReaction(message.id, 'like')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Like"
                    >
                      <ThumbsUp size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'heart')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Love"
                    >
                      <Heart size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Attach image"
          >
            <Image size={20} />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
  groupId: PropTypes.string.isRequired,
}
