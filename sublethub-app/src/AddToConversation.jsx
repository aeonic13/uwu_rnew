import React, { useState } from 'react';
import { Users, Plus, ArrowLeft, CheckCircle, MessageCircle, Search } from 'lucide-react';

const AddToConversation = ({ 
  currentConversation, 
  currentUser, 
  availableRoommates, 
  onAddMembers, 
  onBack 
}) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available roommates/friends (exclude current user and those already in conversation)
  const existingMemberIds = currentConversation.members?.map(m => m.id) || [currentUser.id];
  const filteredRoommates = availableRoommates.filter(roommate => 
    !existingMemberIds.includes(roommate.id) &&
    (searchQuery === '' || 
     roommate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     roommate.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleMember = (roommate) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === roommate.id);
      if (isSelected) {
        return prev.filter(m => m.id !== roommate.id);
      } else {
        return [...prev, roommate];
      }
    });
  };

  const handleAddMembers = () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one person to add to the conversation.');
      return;
    }

    // Create system message about new members being added
    const systemMessage = {
      id: Date.now(),
      text: `${currentUser.name} added ${selectedMembers.map(m => m.name).join(', ')} to the conversation`,
      sender: 'system',
      timestamp: new Date().toISOString(),
      type: 'system'
    };

    onAddMembers(selectedMembers, systemMessage);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Add to Conversation</h2>
          <p className="text-sm text-gray-600">
            Property: {currentConversation.property?.title}
          </p>
        </div>
      </div>

      {/* Current Conversation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <MessageCircle size={16} className="mr-2" />
          Current Conversation
        </h3>
        <div className="flex items-center space-x-3">
          <img 
            src={currentConversation.property?.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100'}
            alt={currentConversation.property?.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium">{currentConversation.property?.title}</p>
            <p className="text-sm text-gray-600">{currentConversation.property?.location}</p>
            <p className="text-sm text-green-600 font-semibold">
              ${currentConversation.property?.price}/month
            </p>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-blue-700">
            <strong>Landlord:</strong> {currentConversation.property?.owner?.name}
          </p>
          {currentConversation.members && currentConversation.members.length > 1 && (
            <p className="text-sm text-blue-700">
              <strong>Current members:</strong> {currentConversation.members.map(m => m.name).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search friends and roommates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-green-700">
            Selected to Add ({selectedMembers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(member => (
              <div key={member.id} className="flex items-center bg-green-100 border border-green-300 rounded-full px-3 py-1">
                <img
                  src={member.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                  alt={member.name}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="text-sm font-medium text-green-800">{member.name}</span>
                <button 
                  onClick={() => handleToggleMember(member)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Roommates/Friends */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="font-semibold mb-3">Available Roommates & Friends</h3>
        
        {filteredRoommates.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No matches found' : 'No available roommates'}
            </h4>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Connect with roommates through the Find Roommates feature first'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoommates.map(roommate => {
              const isSelected = selectedMembers.some(m => m.id === roommate.id);
              return (
                <div
                  key={roommate.id}
                  onClick={() => handleToggleMember(roommate)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={roommate.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                    alt={roommate.name}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-semibold">{roommate.name}</h4>
                      {roommate.verificationStatus === 'verified' && (
                        <CheckCircle size={16} className="ml-2 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {roommate.university} • {roommate.major}
                    </p>
                    {roommate.compatibilityScore && (
                      <p className="text-xs text-green-600">
                        {roommate.compatibilityScore}% compatible with you
                      </p>
                    )}
                    {roommate.relationshipType && (
                      <p className="text-xs text-blue-600 font-medium">
                        {roommate.relationshipType}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {roommate.budget && (
                      <p className="text-xs text-gray-500">
                        ${roommate.budget.min}-${roommate.budget.max}/mo
                      </p>
                    )}
                    {isSelected ? (
                      <div className="text-green-600 mt-1">✓</div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded mt-1"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Members Button */}
      <div className="pt-4 border-t">
        <button
          onClick={handleAddMembers}
          disabled={selectedMembers.length === 0}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
            selectedMembers.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus size={20} className="mr-2" />
          Add {selectedMembers.length} {selectedMembers.length === 1 ? 'Person' : 'People'} to Conversation
        </button>
        
        {selectedMembers.length > 0 && (
          <p className="text-sm text-gray-600 text-center mt-2">
            This will create a group conversation with the landlord
          </p>
        )}
      </div>
    </div>
  );
};

export default AddToConversation;