import React, { useState } from 'react';
import { Search, MessageCircle, Check, CheckCheck, Calendar, CalendarCheck } from 'lucide-react';

const MessagesList = ({ 
  conversations, 
  onSelectConversation, 
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conversation =>
    conversation.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (text, maxLength = 45) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getMessageStatus = (message) => {
    if (message.sender === currentUser.id) {
      return message.read ? 'read' : 'sent';
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm">
              Start browsing properties and send messages to property owners to see conversations here.
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isUnread = !conversation.lastMessage.read && conversation.lastMessage.sender !== currentUser.id;
            
            return (
              <div
                key={conversation.propertyId}
                onClick={() => onSelectConversation(conversation)}
                className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                {/* Property Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conversation.property.images[0]}
                    alt={conversation.property.title}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  {conversation.property.owner.verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium text-sm truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conversation.property.title}
                    </h3>
                    <div className="flex items-center space-x-1.5">
                      {/* Tour Scheduled Indicator */}
                      {conversation.tourScheduled ? (
                        <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full" title="Tour scheduled">
                          <CalendarCheck size={12} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full" title="No tour scheduled">
                          <Calendar size={12} className="text-gray-400" />
                        </div>
                      )}
                      {getMessageStatus(conversation.lastMessage) === 'read' && (
                        <CheckCheck size={14} className="text-blue-500" />
                      )}
                      {getMessageStatus(conversation.lastMessage) === 'sent' && (
                        <Check size={14} className="text-gray-400" />
                      )}
                      <span className={`text-xs ${isUnread ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {formatTimestamp(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs text-gray-500 mb-1 truncate`}>
                        ${conversation.property.price}/mo • {conversation.property.location}
                      </p>
                      <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {conversation.lastMessage.sender === currentUser.id ? 'You: ' : ''}
                        {conversation.lastMessage.type === 'tour-request' 
                          ? '📅 Tour request' 
                          : truncateMessage(conversation.lastMessage.text)
                        }
                      </p>
                    </div>
                    
                    {/* Unread Indicator */}
                    {isUnread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions Footer */}
      {filteredConversations.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500 text-center">
            {filteredConversations.filter(conv => 
              !conv.lastMessage.read && conv.lastMessage.sender !== currentUser.id
            ).length} unread conversations
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesList;