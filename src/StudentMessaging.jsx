import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Image, Plus, Users, Instagram, MapPin, Star, ArrowLeft, Paperclip, Smile, Info } from 'lucide-react';

// STUDENT-ONLY Enhanced Messaging with Group Chat Support
const StudentMessaging = ({ 
  conversation, 
  currentUser, 
  onBack, 
  onVideoCall, 
  onAddToGroup,
  onInviteFriend 
}) => {
  const [messages, setMessages] = useState(conversation?.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const messagesEndRef = useRef(null);
  
  const isGroupChat = conversation?.isGroup || false;
  const otherPerson = !isGroupChat ? conversation : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate response in individual chats
    if (!isGroupChat) {
      setTimeout(() => {
        const response = {
          id: Date.now() + 1,
          text: getRandomResponse(),
          sender: otherPerson.id,
          senderName: otherPerson.name,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'text'
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const getRandomResponse = () => {
    const responses = [
      "That sounds great! 😊",
      "I'm interested! Tell me more.",
      "When would be a good time to meet?",
      "Thanks for reaching out!",
      "Let's schedule a video call to discuss.",
      "I'd love to see the place!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleInstagramConnect = () => {
    if (otherPerson?.instagramHandle) {
      window.open(`https://instagram.com/${otherPerson.instagramHandle.replace('@', '')}`);
    }
  };

  const handleInviteToGroup = () => {
    onAddToGroup?.(otherPerson);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} />
          </button>
          
          {isGroupChat ? (
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                {conversation.members?.slice(0, 3).map((member, index) => (
                  <img
                    key={index}
                    src={member.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                    alt={member.name}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <div>
                <h3 className="font-semibold">Group Chat</h3>
                <p className="text-blue-200 text-sm">{conversation.members?.length} members</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <img 
                src={otherPerson?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                alt={otherPerson?.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h3 className="font-semibold">{otherPerson?.name}</h3>
                <p className="text-blue-200 text-sm">{otherPerson?.university}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {!isGroupChat && (
            <>
              <button 
                onClick={() => onVideoCall?.(otherPerson)}
                className="p-2 rounded-full hover:bg-blue-700"
              >
                <Video size={20} />
              </button>
              
              {otherPerson?.instagramHandle && (
                <button 
                  onClick={handleInstagramConnect}
                  className="p-2 rounded-full hover:bg-blue-700 bg-pink-500"
                >
                  <Instagram size={20} />
                </button>
              )}
              
              <button 
                onClick={handleInviteToGroup}
                className="p-2 rounded-full hover:bg-blue-700"
              >
                <Users size={20} />
              </button>
            </>
          )}
          
          {isGroupChat && (
            <button 
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="p-2 rounded-full hover:bg-blue-700"
            >
              <Info size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Profile Info for Individual Chats */}
      {!isGroupChat && otherPerson && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={otherPerson.photos?.[0]} 
                alt={otherPerson.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h4 className="font-semibold">{otherPerson.name}</h4>
                <p className="text-sm text-gray-600">{otherPerson.university} • {otherPerson.major}</p>
                {otherPerson.compatibilityScore && (
                  <div className="flex items-center">
                    <Star size={12} className="text-yellow-400 fill-current mr-1" />
                    <span className="text-xs text-gray-600">{otherPerson.compatibilityScore}% Compatible</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin size={12} className="mr-1" />
                <span>${otherPerson.budget?.min}-${otherPerson.budget?.max}/mo</span>
              </div>
              {otherPerson.instagramHandle && (
                <div className="flex items-center mt-1">
                  <Instagram size={12} className="mr-1 text-pink-500" />
                  <button 
                    onClick={handleInstagramConnect}
                    className="text-pink-500 hover:underline"
                  >
                    {otherPerson.instagramHandle}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Info Panel */}
      {isGroupChat && showGroupInfo && (
        <GroupInfoPanel 
          conversation={conversation}
          currentUser={currentUser}
          onClose={() => setShowGroupInfo(false)}
          onAddMembers={() => setShowAddMembers(true)}
          onInviteFriend={onInviteFriend}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender === currentUser.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {isGroupChat && !isOwnMessage && (
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {message.senderName}
                  </p>
                )}
                
                {message.type === 'text' && (
                  <p className="text-sm">{message.text}</p>
                )}
                
                {message.type === 'system' && (
                  <p className="text-xs italic">{message.text}</p>
                )}
                
                <p className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isGroupChat ? "Message the group..." : `Message ${otherPerson?.name}...`}
              className="w-full p-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <button 
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Paperclip size={16} />
              </button>
              <button 
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Smile size={16} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full ${
              newMessage.trim() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </form>

        {/* Quick Actions */}
        <div className="flex space-x-2 mt-3">
          {!isGroupChat && (
            <>
              <QuickActionButton 
                text="Schedule Tour" 
                onClick={() => {
                  const tourMessage = {
                    id: Date.now(),
                    text: "I'd like to schedule a property tour. When works best for you?",
                    sender: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: new Date().toISOString(),
                    read: true,
                    type: 'text'
                  };
                  setMessages(prev => [...prev, tourMessage]);
                }}
              />
              <QuickActionButton 
                text="Share Budget" 
                onClick={() => {
                  const budgetMessage = {
                    id: Date.now(),
                    text: `My budget range is $${currentUser.budget?.min || 800}-$${currentUser.budget?.max || 1200}/month. How does that work for you?`,
                    sender: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: new Date().toISOString(),
                    read: true,
                    type: 'text'
                  };
                  setMessages(prev => [...prev, budgetMessage]);
                }}
              />
            </>
          )}
          
          {isGroupChat && (
            <>
              <QuickActionButton 
                text="Start Lease Search" 
                onClick={() => {
                  const leaseMessage = {
                    id: Date.now(),
                    text: "Hey everyone! Should we start looking at properties together? I found a few good options to check out.",
                    sender: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: new Date().toISOString(),
                    read: true,
                    type: 'text'
                  };
                  setMessages(prev => [...prev, leaseMessage]);
                }}
              />
              <QuickActionButton 
                text="Plan Meetup" 
                onClick={() => {
                  const meetupMessage = {
                    id: Date.now(),
                    text: "Want to meet up in person? We could grab coffee and discuss our housing plans!",
                    sender: currentUser.id,
                    senderName: currentUser.name,
                    timestamp: new Date().toISOString(),
                    read: true,
                    type: 'text'
                  };
                  setMessages(prev => [...prev, meetupMessage]);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Group Info Panel Component
const GroupInfoPanel = ({ conversation, currentUser, onClose, onAddMembers, onInviteFriend }) => {
  return (
    <div className="bg-gray-50 border-b p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Group Members</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 mb-4">
        {conversation.members?.map((member, index) => (
          <div key={index} className="flex items-center space-x-3">
            <img
              src={member.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
              alt={member.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{member.name}</p>
              <p className="text-xs text-gray-600">{member.university}</p>
            </div>
            {member.instagramHandle && (
              <button 
                onClick={() => window.open(`https://instagram.com/${member.instagramHandle.replace('@', '')}`)}
                className="text-pink-500"
              >
                <Instagram size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={onAddMembers}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center"
        >
          <Plus size={16} className="mr-1" />
          Add Members
        </button>
        <button 
          onClick={onInviteFriend}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm"
        >
          Invite Friend
        </button>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 whitespace-nowrap"
  >
    {text}
  </button>
);

// Group Chat Creation Component
export const GroupChatCreator = ({ 
  availableStudents, 
  currentUser, 
  onCreateGroup, 
  onBack 
}) => {
  const [selectedMembers, setSelectedMembers] = useState([currentUser]);
  const [groupName, setGroupName] = useState('');

  const handleToggleMember = (student) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === student.id);
      if (isSelected) {
        return prev.filter(m => m.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleCreateGroup = () => {
    if (selectedMembers.length < 2) {
      alert('Please select at least one other person to create a group.');
      return;
    }

    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: groupName || `Group with ${selectedMembers.slice(1).map(m => m.name).join(', ')}`,
      members: selectedMembers,
      isGroup: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      messages: [{
        id: 1,
        text: `${currentUser.name} created the group`,
        sender: 'system',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]
    };

    onCreateGroup(newGroup);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Create Group Chat</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Group Name (optional)</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name..."
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">
          Selected Members ({selectedMembers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map(member => (
            <div key={member.id} className="flex items-center bg-blue-100 rounded-full px-3 py-1">
              <img
                src={member.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                alt={member.name}
                className="w-6 h-6 rounded-full mr-2"
              />
              <span className="text-sm">{member.name}</span>
              {member.id !== currentUser.id && (
                <button 
                  onClick={() => handleToggleMember(member)}
                  className="ml-2 text-blue-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="font-semibold mb-2">Available Students</h3>
        <div className="space-y-2">
          {availableStudents
            .filter(student => student.id !== currentUser.id)
            .map(student => {
              const isSelected = selectedMembers.some(m => m.id === student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleMember(student)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={student.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                    alt={student.name}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.university} • {student.major}</p>
                  </div>
                  {isSelected && (
                    <div className="text-blue-600">✓</div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <button
        onClick={handleCreateGroup}
        disabled={selectedMembers.length < 2}
        className={`w-full py-3 rounded-lg font-semibold mt-4 ${
          selectedMembers.length >= 2
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Create Group ({selectedMembers.length} members)
      </button>
    </div>
  );
};

export default StudentMessaging;