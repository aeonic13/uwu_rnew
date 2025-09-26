import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, User, MessageCircle, Heart, Plus, ArrowLeft, Send, Star, Mail, Shield } from 'lucide-react';

// Sample data
const sampleListings = [
  {
    id: 1,
    title: "Cozy 1BR near USC Campus",
    price: 1200,
    location: "University Park, LA",
    university: "USC",
    dates: "Jan 2024 - June 2024",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400"],
    description: "Perfect for exchange students! Fully furnished apartment just 5 minutes walk to campus.",
    amenities: ["WiFi", "Laundry", "Parking", "Furnished"],
    owner: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      rating: 4.8,
      verified: true
    }
  },
  {
    id: 2,
    title: "Shared House - UCLA Area",
    price: 850,
    location: "Westwood, LA",
    university: "UCLA",
    dates: "Feb 2024 - July 2024",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
    description: "Looking for a clean, responsible student to share my house while I study in Barcelona!",
    amenities: ["WiFi", "Kitchen", "Garden", "Pet-friendly"],
    owner: {
      name: "Mike Rodriguez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 3,
    title: "Studio Apartment - NYU",
    price: 1800,
    location: "Greenwich Village, NYC",
    university: "NYU",
    dates: "March 2024 - Aug 2024",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
    description: "Modern studio in the heart of NYC. Perfect for someone who wants the full city experience!",
    amenities: ["WiFi", "Gym", "Doorman", "AC"],
    owner: {
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      rating: 4.7,
      verified: true
    }
  }
];

const universities = ["All Universities", "USC", "UCLA", "NYU", "Stanford", "Harvard", "MIT"];

const SubletApp = () => {
  const [currentView, setCurrentView] = useState('browse');
  const [listings, setListings] = useState(sampleListings);
  const [favorites, setFavorites] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('All Universities');
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeApplication, setActiveApplication] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Filter listings based on search and university
  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = selectedUniversity === 'All Universities' || 
                             listing.university === selectedUniversity;
    return matchesSearch && matchesUniversity;
  });

  const toggleFavorite = (listingId) => {
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleLogin = (email) => {
    setUser({ email, name: email.split('@')[0], verified: true });
    setShowLogin(false);
  };

  const startApplication = (listing) => {
    setActiveApplication({
      listing: listing,
      step: 'application',
      applicationData: {
        startDate: '',
        endDate: '',
        message: '',
        emergencyContact: ''
      }
    });
    setCurrentView('application');
  };

  const proceedToPayment = () => {
    setActiveApplication(prev => ({ ...prev, step: 'payment' }));
  };

  const generateSubleaseAgreement = (application, approvalData) => {
    const agreement = {
      id: `AGREEMENT-${Date.now()}`,
      propertyId: application.listing.id,
      tenant: {
        name: application.tenant || 'John Student',
        email: application.tenantEmail || 'student@university.edu',
        phone: application.tenantPhone || '(555) 123-4567',
        emergencyContact: application.applicationData.emergencyContact
      },
      landlord: {
        name: application.listing.owner.name,
        email: application.landlordEmail || 'owner@email.com',
        phone: application.landlordPhone || '(555) 987-6543'
      },
      property: {
        address: application.listing.location,
        description: application.listing.title
      },
      terms: {
        startDate: application.applicationData.startDate,
        endDate: application.applicationData.endDate,
        monthlyRent: application.listing.price,
        securityDeposit: approvalData.securityDeposit || application.listing.price,
        utilities: approvalData.utilities || 'Included',
        petPolicy: approvalData.petPolicy || 'No pets allowed',
        smokingPolicy: 'No smoking allowed',
        occupancyLimit: approvalData.occupancyLimit || '1 person'
      },
      createdDate: new Date().toLocaleDateString(),
      status: 'pending_signatures'
    };
    
    return agreement;
  };

  const submitPayment = (paymentData) => {
    const transaction = {
      id: Date.now(),
      listingId: activeApplication.listing.id,
      amount: activeApplication.listing.price,
      serviceFee: Math.round(activeApplication.listing.price * 0.05), // 5% service fee
      total: activeApplication.listing.price + Math.round(activeApplication.listing.price * 0.05),
      status: 'processing',
      date: new Date().toLocaleDateString(),
      tenant: user.name,
      landlord: activeApplication.listing.owner.name,
      paymentMethod: paymentData
    };
    
    setTransactions(prev => [...prev, transaction]);
    
    // Simulate owner approval after payment (in real app, owner would approve separately)
    setTimeout(() => {
      const approvalData = {
        securityDeposit: activeApplication.listing.price,
        utilities: 'Included in rent',
        petPolicy: 'No pets allowed',
        occupancyLimit: '1 person'
      };
      approveApplication(activeApplication.listing.id, approvalData);
    }, 2000);
    
    setCurrentView('confirmation');
  };

  const approveApplication = (applicationId, approvalData) => {
    // In a real app, this would update the application status
    const agreement = generateSubleaseAgreement(activeApplication, approvalData);
    setCurrentView('agreement');
    setActiveApplication(prev => ({ ...prev, agreement, step: 'agreement' }));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: newMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
    }
  };

  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          {currentView !== 'browse' && (
            <button 
              onClick={() => setCurrentView('browse')}
              className="p-1"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold">
            {currentView === 'browse' && 'SubletHub'}
            {currentView === 'detail' && 'Property Details'}
            {currentView === 'post' && 'Post Listing'}
            {currentView === 'messages' && 'Messages'}
            {currentView === 'profile' && 'Profile'}
            {currentView === 'application' && 'Apply Now'}
            {currentView === 'agreement' && 'Sublease Agreement'}
            {currentView === 'confirmation' && 'Booking Confirmed'}
            {currentView === 'payments' && 'Payment Center'}
          </h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Browse View */}
      {currentView === 'browse' && (
        <div className="p-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* University Filter */}
          <div className="mb-4">
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          {/* Listings */}
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                onClick={() => {
                  setSelectedListing(listing);
                  setCurrentView('detail');
                }}
              >
                <div className="relative">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(listing.id);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md"
                  >
                    <Heart
                      size={20}
                      className={favorites.includes(listing.id) ? 'text-red-500 fill-current' : 'text-gray-400'}
                    />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{listing.title}</h3>
                    <span className="text-xl font-bold text-green-600">${listing.price}/mo</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{listing.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-sm">{listing.dates}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <img
                      src={listing.owner.avatar}
                      alt={listing.owner.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{listing.owner.name}</span>
                    {listing.owner.verified && (
                      <Shield size={16} className="ml-1 text-blue-500" />
                    )}
                    <div className="ml-auto flex items-center">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="text-sm ml-1">{listing.owner.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail View */}
      {currentView === 'detail' && selectedListing && (
        <div className="pb-20">
          <div className="relative">
            <img
              src={selectedListing.images[0]}
              alt={selectedListing.title}
              className="w-full h-64 object-cover"
            />
            <button
              onClick={() => toggleFavorite(selectedListing.id)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md"
            >
              <Heart
                size={24}
                className={favorites.includes(selectedListing.id) ? 'text-red-500 fill-current' : 'text-gray-400'}
              />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{selectedListing.title}</h1>
              <span className="text-2xl font-bold text-green-600">${selectedListing.price}/mo</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={18} className="mr-2" />
              <span>{selectedListing.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-4">
              <Calendar size={18} className="mr-2" />
              <span>{selectedListing.dates}</span>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{selectedListing.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedListing.amenities.map(amenity => (
                  <span key={amenity} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <img
                  src={selectedListing.owner.avatar}
                  alt={selectedListing.owner.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <div className="flex items-center">
                    <span className="font-semibold">{selectedListing.owner.name}</span>
                    {selectedListing.owner.verified && (
                      <Shield size={16} className="ml-1 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm ml-1">{selectedListing.owner.rating} rating</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => startApplication(selectedListing)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center mb-2"
              >
                <DollarSign size={20} className="mr-2" />
                Apply & Pay Securely
              </button>
              
              <button
                onClick={() => setCurrentView('messages')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold flex items-center justify-center"
              >
                <MessageCircle size={20} className="mr-2" />
                Ask Questions First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages View */}
      {currentView === 'messages' && (
        <div className="flex flex-col h-96">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Start a conversation with the property owner!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg max-w-xs ${
                      message.sender === 'me'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white p-2 rounded-lg"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Application & Payment Flow */}
      {currentView === 'application' && activeApplication && (
        <ApplicationFlow 
          application={activeApplication}
          onProceedToPayment={proceedToPayment}
          onSubmitPayment={submitPayment}
          onBack={() => setCurrentView('detail')}
        />
      )}

      {/* Legal Agreement View */}
      {currentView === 'agreement' && activeApplication && activeApplication.agreement && (
        <SubleaseAgreementView 
          agreement={activeApplication.agreement}
          onSign={() => {
            setActiveApplication(null);
            setCurrentView('browse');
          }}
          onBack={() => setCurrentView('confirmation')}
        />
      )}

      {/* Confirmation View */}
      {currentView === 'confirmation' && (
        <ConfirmationView onContinue={() => setCurrentView('browse')} />
      )}

      {/* Payment Center */}
      {currentView === 'payments' && (
        <PaymentCenter 
          transactions={transactions}
          onBack={() => setCurrentView('profile')}
        />
      )}

      {/* Post Listing View */}
      {currentView === 'post' && (
        <PostListingForm onBack={() => setCurrentView('browse')} />
      )}

      {/* Profile View */}
      {currentView === 'profile' && (
        <ProfileView user={user} onBack={() => setCurrentView('browse')} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setCurrentView('browse')}
            className={`flex flex-col items-center py-2 px-4 ${
              currentView === 'browse' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Search size={24} />
            <span className="text-xs mt-1">Browse</span>
          </button>
          
          <button
            onClick={() => setCurrentView('post')}
            className={`flex flex-col items-center py-2 px-4 ${
              currentView === 'post' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Plus size={24} />
            <span className="text-xs mt-1">Post</span>
          </button>
          
          <button
            onClick={() => setCurrentView('messages')}
            className={`flex flex-col items-center py-2 px-4 ${
              currentView === 'messages' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Messages</span>
          </button>
          
          <button
            onClick={() => setCurrentView('payments')}
            className={`flex flex-col items-center py-2 px-4 ${
              currentView === 'payments' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <DollarSign size={24} />
            <span className="text-xs mt-1">Payments</span>
          </button>
          
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center py-2 px-4 ${
              currentView === 'profile' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Login Screen Component
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email) => {
    const universityDomains = [
      '.edu', 'usc.edu', 'ucla.edu', 'nyu.edu', 'stanford.edu', 'harvard.edu', 'mit.edu'
    ];
    return universityDomains.some(domain => email.toLowerCase().includes(domain));
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValid(validateEmail(newEmail));
  };

  const handleLogin = () => {
    if (isValid) {
      onLogin(email);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">SubletHub</h1>
        <p className="text-gray-600">Connect with fellow students for subletting</p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-4 p-4 bg-blue-50 rounded-lg">
          <Shield className="text-blue-600 mr-3" size={24} />
          <div>
            <h3 className="font-semibold text-blue-800">University Email Required</h3>
            <p className="text-sm text-blue-600">We verify all users with their .edu email</p>
          </div>
        </div>
        
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your university email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {email && !isValid && (
          <p className="text-red-500 text-sm mt-2">Please use a valid university email (.edu)</p>
        )}
      </div>
      
      <button
        onClick={handleLogin}
        disabled={!isValid}
        className={`w-full py-3 rounded-lg font-semibold ${
          isValid
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue with University Email
      </button>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

// Post Listing Form Component
const PostListingForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    university: '',
    startDate: '',
    endDate: '',
    description: '',
    amenities: []
  });

  const availableAmenities = ['WiFi', 'Laundry', 'Parking', 'Furnished', 'Kitchen', 'Garden', 'Pet-friendly', 'Gym', 'AC'];

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="p-4 pb-20">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Cozy 1BR near campus"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monthly Rent ($)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="1200"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">University</label>
            <select
              value={formData.university}
              onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {universities.slice(1).map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Westwood, LA"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your property..."
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <div className="grid grid-cols-2 gap-2">
            {availableAmenities.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`p-2 rounded-lg border text-sm ${
                  formData.amenities.includes(amenity)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">
            Post Listing
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile View Component
const ProfileView = ({ user, onBack }) => {
  return (
    <div className="p-4 pb-20">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User size={48} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold">{user?.name}</h2>
        <p className="text-gray-600">{user?.email}</p>
        <div className="flex items-center justify-center mt-2">
          <Shield size={16} className="text-blue-500 mr-1" />
          <span className="text-sm text-blue-600">Verified Student</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Edit Profile</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Notification Settings</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Privacy Settings</button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">My Activity</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">My Listings</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Saved Properties</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Application History</button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Support</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Help Center</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Contact Support</button>
            <button className="w-full text-left p-2 hover:bg-gray-100 rounded">Report an Issue</button>
          </div>
        </div>

        <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold">
          Sign Out
        </button>
      </div>
    </div>
  );
};

// Application Flow Component
const ApplicationFlow = ({ application, onProceedToPayment, onSubmitPayment, onBack }) => {
  const [applicationData, setApplicationData] = useState(application.applicationData);
  const [paymentData, setPaymentData] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    nameOnAccount: '',
    bankName: ''
  });

  if (application.step === 'application') {
    return (
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Apply for Sublease</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold">{application.listing.title}</h3>
            <p className="text-gray-600">{application.listing.location}</p>
            <p className="text-lg font-bold text-green-600">${application.listing.price}/month</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Move-in Date</label>
              <input
                type="date"
                value={applicationData.startDate}
                onChange={(e) => setApplicationData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Move-out Date</label>
              <input
                type="date"
                value={applicationData.endDate}
                onChange={(e) => setApplicationData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact</label>
            <input
              type="text"
              value={applicationData.emergencyContact}
              onChange={(e) => setApplicationData(prev => ({ ...prev, emergencyContact: e.target.value }))}
              placeholder="Name and phone number"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message to Owner</label>
            <textarea
              value={applicationData.message}
              onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell them about yourself..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Secure Payment Process</h4>
            <p className="text-sm text-yellow-700">
              Your payment is held securely by SubletHub. We only release funds to the owner after you confirm move-in.
            </p>
          </div>

          <button
            onClick={onProceedToPayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    );
  }

  if (application.step === 'payment') {
    const monthlyRent = application.listing.price;
    const serviceFee = Math.round(monthlyRent * 0.05);
    const total = monthlyRent + serviceFee;

    return (
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Secure Payment</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Monthly Rent</span>
                <span>${monthlyRent}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>SubletHub Service Fee (5%)</span>
                <span>${serviceFee}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Due Today</span>
                <span>${total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-blue-800">Secure Bank Transfer (ACH)</span>
              </div>
              <p className="text-sm text-blue-700">
                Lower fees than credit cards! Funds are transferred directly from your bank account.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input
                type="text"
                value={paymentData.bankName}
                onChange={(e) => setPaymentData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="e.g., Chase Bank, Wells Fargo"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Routing Number</label>
              <input
                type="text"
                value={paymentData.routingNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                placeholder="9-digit routing number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={9}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                type="text"
                value={paymentData.accountNumber}
                onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                placeholder="Account number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name on Account</label>
              <input
                type="text"
                value={paymentData.nameOnAccount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, nameOnAccount: e.target.value }))}
                placeholder="Full name as it appears on your account"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => onSubmitPayment(paymentData)}
              disabled={!paymentData.routingNumber || !paymentData.accountNumber || !paymentData.nameOnAccount}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                paymentData.routingNumber && paymentData.accountNumber && paymentData.nameOnAccount
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Authorize Payment - ${total}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

// Confirmation View Component
const ConfirmationView = ({ onContinue }) => {
  return (
    <div className="p-4 pb-20 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600">Your application has been submitted and payment secured.</p>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
      >
        Continue Browsing
      </button>
    </div>
  );
};

// Sublease Agreement View Component
const SubleaseAgreementView = ({ agreement, onSign, onBack }) => {
  const [tenantSigned, setTenantSigned] = useState(false);
  
  return (
    <div className="p-4 pb-20">
      <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold">SubletHub Legal</h2>
        <p className="text-blue-100 text-sm">AI-Generated Legal Document</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Agreement Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Property:</span>
            <span>{agreement.property.address}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Rent:</span>
            <span>${agreement.terms.monthlyRent}</span>
          </div>
          <div className="flex justify-between">
            <span>Start Date:</span>
            <span>{agreement.terms.startDate}</span>
          </div>
          <div className="flex justify-between">
            <span>End Date:</span>
            <span>{agreement.terms.endDate}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Digital Signature Required</h3>
        
        <div className="border-2 rounded-lg p-4 bg-blue-50 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{agreement.tenant.name}</p>
              <p className="text-sm text-gray-600">Sublessee (You)</p>
            </div>
            
            {!tenantSigned ? (
              <button
                onClick={() => setTenantSigned(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Sign Here
              </button>
            ) : (
              <div className="text-green-700">Signed</div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onSign}
        disabled={!tenantSigned}
        className={`w-full py-3 rounded-lg font-semibold ${
          tenantSigned
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Complete Agreement
      </button>
    </div>
  );
};

// Payment Center Component  
const PaymentCenter = ({ transactions, onBack }) => {
  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Payment Center</h2>
        <p className="text-gray-600">Track your payments and transaction history</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
          <p className="text-gray-500">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map(transaction => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">Payment to {transaction.landlord}</h3>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${transaction.total}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubletApp;