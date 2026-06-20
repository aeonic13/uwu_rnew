import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, Filter, Search, Star, MapPin, Instagram, Users, ArrowLeft, Plus, Zap, Shield, CheckCircle } from 'lucide-react';
import { findStableRoommatePairs, createRoommateGroups } from './utils/stableRoommates';

// STUDENT-ONLY FEATURE - Roommate Discovery & Matching Platform
const RoommateDiscovery = ({ currentUser, onBack, onMessage, onCreateGroup }) => {
  // Security check - only students can access this feature
  if (currentUser?.userType === 'owner') {
    return (
      <div className="p-4 text-center">
        <Shield size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-4">The roommate social platform is only available for students.</p>
        <button onClick={onBack} className="bg-gray-600 text-white px-4 py-2 rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const [currentView, setCurrentView] = useState('discover'); // discover, profile-setup, matches, groups
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    university: '',
    budgetRange: { min: 0, max: 2000 },
    lifestyle: '',
    academicLevel: ''
  });
  const [roommateProfile, setRoommateProfile] = useState(null);
  const [potentialRoommates, setPotentialRoommates] = useState([]);
  const [matches, setMatches] = useState([]);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sample roommate profiles (in real app, this would come from backend)
  const sampleRoommates = [
    {
      id: 'rm1',
      name: 'Sarah Kim',
      age: 20,
      gender: 'female',
      userType: 'student',
      university: 'USC',
      academicLevel: 'junior',
      major: 'Business',
      budget: { min: 800, max: 1200 },
      lifestyle: {
        cleanliness: 'neat',
        noiseLevels: 'moderate',
        socialPreference: 'balanced',
        studyHabits: 'evening'
      },
      preferences: {
        hobbies: ['reading', 'yoga', 'cooking'],
        personality: 'balanced'
      },
      photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300'],
      bio: 'Looking for a clean, responsible roommate to share a 2BR near campus. I love cooking and would be happy to share meals!',
      instagramHandle: '@sarahk_student',
      verificationStatus: 'verified',
      compatibilityScore: 92
    },
    {
      id: 'rm2',
      name: 'Maya Patel',
      age: 19,
      gender: 'female',
      userType: 'student',
      university: 'USC',
      academicLevel: 'sophomore',
      major: 'Engineering',
      budget: { min: 900, max: 1400 },
      lifestyle: {
        cleanliness: 'neat',
        noiseLevels: 'quiet',
        socialPreference: 'independent',
        studyHabits: 'morning'
      },
      preferences: {
        hobbies: ['coding', 'gaming', 'movies'],
        personality: 'introverted'
      },
      photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300'],
      bio: 'Engineering student seeking quiet roommate for focused studying. I\'m clean, respectful, and love tech!',
      instagramHandle: '@maya_codes',
      verificationStatus: 'verified',
      compatibilityScore: 87
    },
    {
      id: 'rm3',
      name: 'Jessica Chen',
      age: 21,
      gender: 'female',
      userType: 'student',
      university: 'USC',
      academicLevel: 'senior',
      major: 'Psychology',
      budget: { min: 1000, max: 1500 },
      lifestyle: {
        cleanliness: 'average',
        noiseLevels: 'moderate',
        socialPreference: 'social',
        studyHabits: 'flexible'
      },
      preferences: {
        hobbies: ['photography', 'hiking', 'coffee'],
        personality: 'extroverted'
      },
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'],
      bio: 'Social psychology major looking for someone to explore LA with! Love weekend adventures and good conversations.',
      instagramHandle: '@jessica_explores',
      verificationStatus: 'verified',
      compatibilityScore: 81
    }
  ];

  useEffect(() => {
    setPotentialRoommates(sampleRoommates);
  }, []);

  const handleLikeProfile = (profileId) => {
    if (!likedProfiles.includes(profileId)) {
      setLikedProfiles(prev => [...prev, profileId]);
      
      // Simulate mutual match
      setTimeout(() => {
        const profile = potentialRoommates.find(p => p.id === profileId);
        if (profile && Math.random() > 0.3) { // 70% chance of mutual like
          setMatches(prev => [...prev, profile]);
        }
      }, 1000);
    }
  };

  const handleFindStableMatches = () => {
    try {
      const allStudents = [currentUser, ...potentialRoommates];
      const stablePairs = findStableRoommatePairs(allStudents);
      
      if (stablePairs) {
        setMatches(stablePairs);
        setCurrentView('matches');
      }
    } catch (error) {
      console.error('Matching failed:', error);
    }
  };

  const handleCreateGroup = (members) => {
    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      members: members,
      createdAt: new Date().toISOString(),
      status: 'forming',
      createdBy: currentUser.id
    };
    
    setGroups(prev => [...prev, newGroup]);
    onCreateGroup?.(newGroup);
  };

  // Profile Setup View
  if (currentView === 'profile-setup') {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentView('discover')} className="mr-3">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Setup Roommate Profile</h2>
        </div>

        <RoommateProfileSetup 
          currentUser={currentUser}
          onComplete={(profile) => {
            setRoommateProfile(profile);
            setCurrentView('discover');
          }}
        />
      </div>
    );
  }

  // Matches View
  if (currentView === 'matches') {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentView('discover')} className="flex items-center text-brand-500">
            <ArrowLeft size={20} className="mr-1" />
            Back
          </button>
          <h2 className="text-xl font-bold">Your Matches</h2>
          <div></div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Matches Yet</h3>
            <p className="text-gray-500 mb-6">Keep swiping to find your perfect roommate!</p>
            <button 
              onClick={() => setCurrentView('discover')}
              className="bg-brand-500 text-white px-6 py-3 rounded-lg"
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-3">
                  <img 
                    src={match.person1?.photos?.[0] || match.photos?.[0]} 
                    alt={match.person1?.name || match.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-lg">{match.person1?.name || match.name}</h3>
                      <CheckCircle size={16} className="ml-2 text-green-500" />
                    </div>
                    <p className="text-gray-600">{match.person1?.university || match.university} • {match.person1?.major || match.major}</p>
                    <div className="flex items-center mt-1">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {match.compatibilityScore || match.person1?.compatibilityScore}% Compatible
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{match.person1?.bio || match.bio}</p>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => onMessage(match.person1 || match)}
                    className="flex-1 bg-brand-500 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <MessageCircle size={16} className="mr-1" />
                    Message
                  </button>
                  <button 
                    onClick={() => handleCreateGroup([currentUser, match.person1 || match])}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center"
                  >
                    <Users size={16} className="mr-1" />
                    Start Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Groups View
  if (currentView === 'groups') {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentView('discover')} className="flex items-center text-brand-500">
            <ArrowLeft size={20} className="mr-1" />
            Back
          </button>
          <h2 className="text-xl font-bold">Lease Groups</h2>
          <div></div>
        </div>

        <GroupsManager 
          groups={groups}
          currentUser={currentUser}
          onMessage={onMessage}
          onInviteFriend={(groupId) => {
            // Handle friend invitation
            console.log('Invite friend to group:', groupId);
          }}
        />
      </div>
    );
  }

  // Main Discovery View
  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Find Roommates</h1>
            <p className="text-sm text-gray-600">Algorithm-based matching</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <Filter size={20} />
          </button>
          <button 
            onClick={() => setCurrentView('profile-setup')}
            className="p-2 bg-brand-500 text-white rounded-lg"
          >
            <User size={20} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button 
          onClick={handleFindStableMatches}
          className="bg-purple-600 text-white p-3 rounded-lg flex flex-col items-center"
        >
          <Zap size={20} className="mb-1" />
          <span className="text-xs">Smart Match</span>
        </button>
        <button 
          onClick={() => setCurrentView('matches')}
          className="bg-green-600 text-white p-3 rounded-lg flex flex-col items-center relative"
        >
          <Heart size={20} className="mb-1" />
          <span className="text-xs">Matches</span>
          {matches.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {matches.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setCurrentView('groups')}
          className="bg-orange-600 text-white p-3 rounded-lg flex flex-col items-center"
        >
          <Users size={20} className="mb-1" />
          <span className="text-xs">Groups</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, university, major..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">University</label>
              <select 
                value={filters.university}
                onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Universities</option>
                <option value="USC">USC</option>
                <option value="UCLA">UCLA</option>
                <option value="NYU">NYU</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Academic Level</label>
              <select 
                value={filters.academicLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, academicLevel: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Levels</option>
                <option value="freshman">Freshman</option>
                <option value="sophomore">Sophomore</option>
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Roommate Cards */}
      <div className="space-y-4">
        {potentialRoommates
          .filter(roommate => {
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              return roommate.name.toLowerCase().includes(query) ||
                     roommate.university.toLowerCase().includes(query) ||
                     roommate.major.toLowerCase().includes(query);
            }
            return true;
          })
          .filter(roommate => {
            if (filters.university && roommate.university !== filters.university) return false;
            if (filters.academicLevel && roommate.academicLevel !== filters.academicLevel) return false;
            return true;
          })
          .map(roommate => (
            <RoommateCard 
              key={roommate.id}
              roommate={roommate}
              onLike={() => handleLikeProfile(roommate.id)}
              onMessage={() => onMessage(roommate)}
              isLiked={likedProfiles.includes(roommate.id)}
              isMatched={matches.some(m => (m.person1?.id || m.id) === roommate.id)}
            />
          ))}
      </div>
    </div>
  );
};

// Individual Roommate Card Component
const RoommateCard = ({ roommate, onLike, onMessage, isLiked, isMatched }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="relative">
        <img 
          src={roommate.photos[0]} 
          alt={roommate.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center">
          <Star size={12} className="text-yellow-400 fill-current mr-1" />
          <span className="text-xs font-semibold">{roommate.compatibilityScore}%</span>
        </div>
        {isMatched && (
          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full px-2 py-1">
            <span className="text-xs font-semibold">Match!</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold text-lg">{roommate.name}, {roommate.age}</h3>
              {roommate.verificationStatus === 'verified' && (
                <CheckCircle size={16} className="ml-2 text-brand-500" />
              )}
            </div>
            <p className="text-gray-600 text-sm">{roommate.university} • {roommate.major}</p>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{roommate.bio}</p>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin size={14} className="mr-1" />
          <span>Budget: ${roommate.budget.min}-${roommate.budget.max}/month</span>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="flex space-x-1">
            {roommate.preferences.hobbies.slice(0, 3).map((hobby, index) => (
              <span key={index} className="bg-brand-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {hobby}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={onLike}
            disabled={isLiked}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center ${
              isLiked 
                ? 'bg-pink-100 text-pink-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart size={16} className={`mr-1 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </button>
          <button 
            onClick={onMessage}
            className="flex-1 bg-brand-500 text-white py-2 rounded-lg flex items-center justify-center"
          >
            <MessageCircle size={16} className="mr-1" />
            Message
          </button>
          {roommate.instagramHandle && (
            <button 
              onClick={() => window.open(`https://instagram.com/${roommate.instagramHandle.replace('@', '')}`)}
              className="bg-pink-500 text-white p-2 rounded-lg"
            >
              <Instagram size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Roommate Profile Setup Component
const RoommateProfileSetup = ({ currentUser, onComplete }) => {
  const [profile, setProfile] = useState({
    budget: { min: 800, max: 1200 },
    lifestyle: {
      cleanliness: '',
      noiseLevels: '',
      socialPreference: '',
      studyHabits: ''
    },
    preferences: {
      hobbies: [],
      personality: ''
    },
    bio: '',
    instagramHandle: ''
  });

  const hobbiesOptions = [
    'reading', 'movies', 'fitness', 'cooking', 'gaming', 'music', 
    'photography', 'hiking', 'yoga', 'coding', 'art', 'dancing'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget Range */}
      <div>
        <label className="block text-sm font-medium mb-2">Budget Range (per month)</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-600">Min</label>
            <input
              type="number"
              value={profile.budget.min}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                budget: { ...prev.budget, min: parseInt(e.target.value) }
              }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Max</label>
            <input
              type="number"
              value={profile.budget.max}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                budget: { ...prev.budget, max: parseInt(e.target.value) }
              }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Lifestyle Preferences */}
      <div>
        <h3 className="font-semibold mb-3">Lifestyle Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cleanliness Level</label>
            <select 
              value={profile.lifestyle.cleanliness}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                lifestyle: { ...prev.lifestyle, cleanliness: e.target.value }
              }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="neat">Very neat</option>
              <option value="average">Average</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Noise Levels</label>
            <select 
              value={profile.lifestyle.noiseLevels}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                lifestyle: { ...prev.lifestyle, noiseLevels: e.target.value }
              }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="quiet">Prefer quiet</option>
              <option value="moderate">Moderate</option>
              <option value="lively">Don't mind noise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Social Preference</label>
            <select 
              value={profile.lifestyle.socialPreference}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                lifestyle: { ...prev.lifestyle, socialPreference: e.target.value }
              }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="social">Very social</option>
              <option value="balanced">Balanced</option>
              <option value="independent">Prefer independence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium mb-2">Hobbies & Interests</label>
        <div className="grid grid-cols-3 gap-2">
          {hobbiesOptions.map(hobby => (
            <button
              key={hobby}
              type="button"
              onClick={() => {
                const hobbies = profile.preferences.hobbies.includes(hobby)
                  ? profile.preferences.hobbies.filter(h => h !== hobby)
                  : [...profile.preferences.hobbies, hobby];
                setProfile(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, hobbies }
                }));
              }}
              className={`p-2 text-xs rounded-lg border ${
                profile.preferences.hobbies.includes(hobby)
                  ? 'bg-brand-100 border-brand-300 text-blue-800'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              {hobby}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell potential roommates about yourself..."
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Instagram Handle */}
      <div>
        <label className="block text-sm font-medium mb-1">Instagram Handle (optional)</label>
        <input
          type="text"
          value={profile.instagramHandle}
          onChange={(e) => setProfile(prev => ({ ...prev, instagramHandle: e.target.value }))}
          placeholder="@username"
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold"
      >
        Complete Profile
      </button>
    </form>
  );
};

// Groups Manager Component
const GroupsManager = ({ groups, currentUser, onMessage, onInviteFriend }) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Groups Yet</h3>
        <p className="text-gray-500 mb-6">Start by finding matches and creating your first lease group!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Lease Group</h3>
            <span className="text-xs bg-brand-100 text-blue-800 px-2 py-1 rounded-full">
              {group.status}
            </span>
          </div>
          
          <div className="flex -space-x-2 mb-3">
            {group.members.map((member, index) => (
              <img
                key={index}
                src={member.photos?.[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'}
                alt={member.name}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            ))}
            <button 
              onClick={() => onInviteFriend(group.id)}
              className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {group.members.length} members • Created {new Date(group.createdAt).toLocaleDateString()}
          </div>
          
          <button 
            onClick={() => onMessage({ id: group.id, isGroup: true, members: group.members })}
            className="w-full bg-brand-500 text-white py-2 rounded-lg flex items-center justify-center"
          >
            <MessageCircle size={16} className="mr-1" />
            Group Chat
          </button>
        </div>
      ))}
    </div>
  );
};

export default RoommateDiscovery;