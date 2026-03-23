import React, { useState, useEffect } from 'react';
import { Send, Calendar, Clock, Check, X, Bell, Phone, Video, MapPin, AlertCircle, Users } from 'lucide-react';

const EnhancedMessaging = ({ 
  property, 
  messages, 
  onSendMessage, 
  onScheduleTour, 
  onVideoCall,
  currentUser,
  showAddFriendsButton = false,
  onAddFriends
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('');
  const [tourType, setTourType] = useState('in-person'); // 'in-person' or 'virtual'
  const [reminderSet, setReminderSet] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messageContainer = document.getElementById('messages-container');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage({
        text: newMessage,
        timestamp: new Date().toISOString(),
        sender: currentUser.id,
        type: 'text'
      });
      setNewMessage('');
    }
  };

  const handleScheduleTour = () => {
    if (tourDate && tourTime) {
      const tourMessage = {
        text: `Tour request: ${tourType === 'virtual' ? 'Virtual' : 'In-person'} tour on ${new Date(tourDate).toLocaleDateString()} at ${tourTime}`,
        timestamp: new Date().toISOString(),
        sender: currentUser.id,
        type: 'tour-request',
        tourDetails: {
          date: tourDate,
          time: tourTime,
          type: tourType,
          status: 'pending'
        }
      };
      
      onSendMessage(tourMessage);
      onScheduleTour(tourDate, tourTime, tourType);
      setShowScheduler(false);
      setTourDate('');
      setTourTime('');
      
      // Set reminder for 1 hour before tour
      setReminderSet(true);
      setTimeout(() => {
        // This would integrate with push notifications in a real app
        console.log(`Reminder: Tour in 1 hour at ${property.location}`);
      }, 1000); // Simulated reminder
    }
  };

  const quickResponseOptions = [
    "Is this still available?",
    "Can I schedule a tour?",
    "What's included in the rent?",
    "When can I move in?",
    "Are pets allowed?",
    "Is parking included?"
  ];

  const handleQuickResponse = (response) => {
    onSendMessage({
      text: response,
      timestamp: new Date().toISOString(),
      sender: currentUser.id,
      type: 'text'
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full">
      {/* Property Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center space-x-3">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{property.title}</h3>
            <p className="text-xs text-gray-600">${property.price}/month • {property.location}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onVideoCall(property)}
              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
            >
              <Video size={16} />
            </button>
            <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
              <Phone size={16} />
            </button>
          </div>
        </div>

        {/* Tour Reminder */}
        {reminderSet && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <Bell size={16} className="text-blue-600 mr-2" />
              <span className="text-sm text-blue-800 font-medium">
                Tour reminder set! We'll notify you 1 hour before.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        id="messages-container"
        className="flex-1 p-4 overflow-y-auto space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Start the conversation!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Ask questions about the property or schedule a tour
            </p>
            
            {/* Quick Response Options */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">QUICK RESPONSES:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickResponseOptions.slice(0, 3).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickResponse(option)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === currentUser.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {/* Tour Request Message */}
                {message.type === 'tour-request' && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar size={14} className="mr-1" />
                      <span className="font-medium">Tour Request</span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      message.tourDetails.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : message.tourDetails.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {message.tourDetails.status.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Regular Text Message */}
                {message.type === 'text' && (
                  <p>{message.text}</p>
                )}

                <p className={`text-xs mt-1 ${
                  message.sender === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex space-x-2 overflow-x-auto">
            {quickResponseOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickResponse(option)}
                className="whitespace-nowrap px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tour Scheduler */}
      {showScheduler && (
        <div className="p-4 bg-blue-50 border-t">
          <h4 className="font-semibold mb-3">Schedule a Tour</h4>
          
          {/* Tour Type Selection */}
          <div className="mb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setTourType('in-person')}
                className={`flex-1 p-2 rounded-lg text-sm font-medium ${
                  tourType === 'in-person'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <MapPin size={14} className="inline mr-1" />
                In-Person
              </button>
              <button
                onClick={() => setTourType('virtual')}
                className={`flex-1 p-2 rounded-lg text-sm font-medium ${
                  tourType === 'virtual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <Video size={14} className="inline mr-1" />
                Virtual Tour
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="date"
              min={today}
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <select
              value={tourTime}
              onChange={(e) => setTourTime(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select time</option>
              <option value="9:00 AM">9:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="3:00 PM">3:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="5:00 PM">5:00 PM</option>
              <option value="6:00 PM">6:00 PM</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowScheduler(false)}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleTour}
              disabled={!tourDate || !tourTime}
              className={`flex-1 p-2 rounded-lg font-medium ${
                tourDate && tourTime
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              Schedule Tour
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
          >
            <Calendar size={16} className="mr-1" />
            Schedule Tour
          </button>
          <button
            onClick={() => onVideoCall(property)}
            className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
          >
            <Video size={16} className="mr-1" />
            Video Call
          </button>
          {showAddFriendsButton && onAddFriends && (
            <button
              onClick={() => onAddFriends(property)}
              className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
            >
              <Users size={16} className="mr-1" />
              Add Friends
            </button>
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-lg ${
              newMessage.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Tour Status Notifications */}
      <TourNotifications />
    </div>
  );
};

// Component for tour status notifications
const TourNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate tour confirmations/updates
    const timer = setTimeout(() => {
      setNotifications([
        {
          id: 1,
          type: 'tour-approved',
          message: 'Your tour has been approved for tomorrow at 2:00 PM',
          timestamp: new Date(),
          property: 'Cozy 1BR near USC Campus'
        }
      ]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-green-100 border border-green-200 rounded-lg p-4 mb-2 max-w-sm shadow-lg"
        >
          <div className="flex items-center mb-2">
            <Check size={16} className="text-green-600 mr-2" />
            <span className="font-semibold text-green-800">Tour Confirmed</span>
          </div>
          <p className="text-sm text-green-700 mb-1">{notification.message}</p>
          <p className="text-xs text-green-600">{notification.property}</p>
          
          {/* Reminder Option */}
          <button className="mt-2 text-xs text-green-600 hover:underline flex items-center">
            <Bell size={12} className="mr-1" />
            Set reminder
          </button>
        </div>
      ))}
    </div>
  );
};

export default EnhancedMessaging;