import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, User, MessageCircle, Heart, Plus, ArrowLeft, Send, Star, Mail, Shield, Eye, Clock, CheckCircle, XCircle, Building2, Sliders, Home, Scale, BarChart3, FileText, Users, AlertTriangle } from 'lucide-react';
import RoommateDiscovery from './RoommateDiscovery';
import StudentMessaging, { GroupChatCreator } from './StudentMessaging';
import AddToConversation from './AddToConversation';
import RoommateQuestionnaire from './RoommateQuestionnaire';
import RoommateMatching from './RoommateMatching';
import { 
  EditProfileView, 
  MyListingsView, 
  SavedPropertiesView, 
  ApplicationHistoryView, 
  NotificationSettingsView, 
  PrivacySettingsView, 
  HelpCenterView, 
  ContactSupportView, 
  BankAccountManager, 
  MapView, 
  OwnerPaymentCenter, 
  TourRequestModal, 
  ApplicationFlow 
} from './ProfileComponents';
import UniversitySearch from './UniversitySearch';
import EnhancedRegistration from './EnhancedRegistration';
import AdvancedSearch from './AdvancedSearch';
import EnhancedPropertyDetails from './EnhancedPropertyDetails';
import EnhancedMessaging from './EnhancedMessaging';
import MessagesList from './MessagesList';
import PaymentReminders from './PaymentReminders';
import MoveInConfirmation from './MoveInConfirmation';
import StudentListingForm from './StudentListingForm';
import LandlordListingForm from './LandlordListingForm';
import LandlordInbox from './LandlordInbox';
import LandlordUtilityManager from './LandlordUtilityManager';
import OwnerApprovalDashboard from './OwnerApprovalDashboard';
import LegalTemplateSystem from './LegalTemplateSystem';
import TenantRightsCenter from './TenantRightsCenter';
import PropertyInspectionTools from './PropertyInspectionTools';
import RoommateManagement from './RoommateManagement';
import SecurityDepositManager from './SecurityDepositManager';
import OwnerDashboard from './OwnerDashboard';
import BankingBookkeeping from './BankingBookkeeping';
import RentCollectionSystem from './RentCollectionSystem';
import TaxCenter from './TaxCenter';
import ParentGuardianManager from './ParentGuardianManager';
import LeaseContractManager from './LeaseContractManager';
import GroupApplicationFlow from './GroupApplicationFlow';
import GuarantorVerificationFlow from './GuarantorVerificationFlow';
import MultiPartyLeaseExecution from './MultiPartyLeaseExecution';
import OwnerApprovalSystem from './OwnerApprovalSystem';
import DisputeResolutionCenter from './DisputeResolutionCenter';
import OwnerDocumentManager from './OwnerDocumentManager';
import SecurityDepositProtection from './SecurityDepositProtection';
import UtilitiesManagementView from './UtilitiesManagement';
import ReportMaintenanceView from './ReportMaintenance';
import ViewLeaseView from './ViewLease';
import RentersInsuranceView from './RentersInsurance';
import LoginScreen from './LoginScreen';
import { usersApi, setAuthToken, getAuthToken, normalizeUser } from './api';
import ApplicationWaitingRoom from './ApplicationWaitingRoom';
import LandlordApplicationChat from './LandlordApplicationChat';
import LandlordLeaseRouter from './LandlordLeaseRouter';

// Sample data
const sampleListings = [
  {
    id: 1,
    title: "Cozy 1BR near USC Campus",
    price: 1200,
    location: "University Park, LA",
    university: "USC",
    dates: "Jan 2024 - June 2024",
    moveInDate: "2024-01-15",
    propertyType: "Apartment",
    bedrooms: 1,
    bathrooms: 1,
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
    moveInDate: "2024-02-01",
    propertyType: "House",
    bedrooms: 4,
    bathrooms: 2,
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
    moveInDate: "2024-03-10",
    propertyType: "Studio",
    bedrooms: 0,
    bathrooms: 1,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
    description: "Modern studio in the heart of NYC. Perfect for someone who wants the full city experience!",
    amenities: ["WiFi", "Gym", "Doorman", "AC"],
    owner: {
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      rating: 4.7,
      verified: true
    }
  },
  {
    id: 4,
    title: "Spacious 3BR House - Stanford",
    price: 2400,
    location: "Palo Alto, CA",
    university: "Stanford",
    dates: "Jan 2024 - Dec 2024",
    moveInDate: "2024-01-01",
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 2.5,
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400"],
    description: "Beautiful house near Stanford campus with backyard and modern amenities.",
    amenities: ["WiFi", "Parking", "Laundry", "Garden", "Furnished"],
    owner: {
      name: "David Park",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 5,
    title: "Single Room in Condo - MIT",
    price: 950,
    location: "Cambridge, MA",
    university: "MIT",
    dates: "Feb 2024 - June 2024",
    moveInDate: "2024-02-15",
    propertyType: "Single Room",
    bedrooms: 1,
    bathrooms: 1,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
    description: "Private room in shared condo, walking distance to MIT. Great roommates!",
    amenities: ["WiFi", "Laundry", "Kitchen", "Study Space"],
    owner: {
      name: "Lisa Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      rating: 4.6,
      verified: true
    }
  },
  {
    id: 6,
    title: "Luxury 2BR Apartment - Harvard",
    price: 2200,
    location: "Cambridge, MA",
    university: "Harvard",
    dates: "Jan 2024 - May 2024",
    moveInDate: "2024-01-10",
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
    description: "Upscale apartment with Harvard Square views. Fully renovated and furnished.",
    amenities: ["WiFi", "Gym", "AC", "Parking", "Furnished", "Doorman"],
    owner: {
      name: "Robert Williams",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      rating: 4.8,
      verified: true
    }
  }
];

const universities = ["All Universities", "USC", "UCLA", "NYU", "Stanford", "Harvard", "MIT"];

const RentraApp = () => {
  const [currentView, setCurrentView] = useState('browse');
  const [listings, setListings] = useState(sampleListings);
  const [favorites, setFavorites] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('All Universities');
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true while checking stored token
  // Sample conversations data for Instagram-like messages list
  const [conversations, setConversations] = useState([
    {
      propertyId: 1,
      property: sampleListings[0],
      messages: [
        {
          id: 1,
          text: "Hi! Is this property still available?",
          sender: "me",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: true,
          type: "text"
        },
        {
          id: 2,
          text: "Yes, it's still available! Are you interested in scheduling a tour?",
          sender: "owner",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
          read: false,
          type: "text"
        }
      ],
      lastMessage: {
        id: 2,
        text: "Yes, it's still available! Are you interested in scheduling a tour?",
        sender: "owner",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        read: false,
        type: "text"
      },
      unreadCount: 1,
      tourScheduled: false
    },
    {
      propertyId: 2,
      property: sampleListings[1],
      messages: [
        {
          id: 3,
          text: "When would be a good time to view the apartment?",
          sender: "me",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          read: true,
          type: "text"
        },
        {
          id: 4,
          text: "How about tomorrow at 2 PM? I can show you around the house and neighborhood.",
          sender: "owner",
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
          read: true,
          type: "text"
        },
        {
          id: 5,
          text: "Perfect! See you then.",
          sender: "me",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: true,
          type: "text"
        }
      ],
      lastMessage: {
        id: 5,
        text: "Perfect! See you then.",
        sender: "me",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        type: "text"
      },
      unreadCount: 0,
      tourScheduled: true // Tour confirmed in conversation
    },
    {
      propertyId: 3,
      property: sampleListings[2],
      messages: [
        {
          id: 6,
          text: "Is the gym access included in the rent?",
          sender: "me",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: true,
          type: "text"
        },
        {
          id: 7,
          text: "Yes, gym and all building amenities are included!",
          sender: "owner",
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
          read: true,
          type: "text"
        },
        {
          id: 8,
          text: "I'd like to schedule a virtual tour if possible",
          sender: "me",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          read: true,
          type: "tour-request"
        }
      ],
      lastMessage: {
        id: 8,
        text: "I'd like to schedule a virtual tour if possible",
        sender: "me",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        read: true,
        type: "tour-request"
      },
      unreadCount: 0,
      tourScheduled: false // Tour requested but not confirmed yet
    }
  ]);
  
  // Legacy messages state for backward compatibility
  const [messages, setMessages] = useState([]);
  const [activeMessageProperty, setActiveMessageProperty] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeApplication, setActiveApplication] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tourRequests, setTourRequests] = useState([]);
  
  // Roommate compatibility state
  const [roommateQuestionnaireAnswers, setRoommateQuestionnaireAnswers] = useState(null);
  const [potentialRoommates, setPotentialRoommates] = useState([
    {
      id: 1,
      name: 'Alex Johnson',
      university: 'USC',
      bio: 'Computer Science major, love cooking and gaming. Looking for a clean and chill roommate!',
      answers: {
        billPayment: 'byDueDate',
        utilities: 'splitEvenly',
        borrowing: 'askFirst',
        commonItems: 'splitCosts',
        foodSharing: 'buyOwn',
        tidiness: 'organized',
        kitchen: 'cleanTidy',
        bathroom: 'weekly',
        dishes: 'dailyClean',
        cleaningSchedule: 'rotate',
        cleaningFrequency: 'weekly',
        smoking: 'no',
        smokingTolerance: 'yes',
        pets: ['none'],
        petTolerance: ['dogs', 'cats'],
        internetUse: 'heavy',
        occupation: ['student'],
        noiseAcceptable: 'dayEvening',
        musicFrequency: 'often',
        musicVolume: 'comfortable',
        bedtime: 'moderate',
        studyHabits: 'someDistractions',
        comingGoing: 'onceTwice',
        guestPolicy: 'headsUp',
        overnightGuests: 'occasionally',
        parties: 'withNotice',
        frequentGuests: 'none',
        dietaryRestrictions: ['none'],
        cookingFrequency: 'dinners',
        alcoholUse: 'weekends',
        roommateRelationship: 'friendly',
        additionalOccupants: 'no'
      }
    },
    {
      id: 2,
      name: 'Sarah Martinez',
      university: 'UCLA',
      bio: 'Pre-med student, early bird, very organized. Looking for someone responsible and quiet.',
      answers: {
        billPayment: 'immediate',
        utilities: 'splitEvenly',
        borrowing: 'emergencyOnly',
        commonItems: 'splitCosts',
        foodSharing: 'buyOwn',
        tidiness: 'spotless',
        kitchen: 'sparklingClean',
        bathroom: 'spotless',
        dishes: 'dailyClean',
        cleaningSchedule: 'rotate',
        cleaningFrequency: 'daily',
        smoking: 'no',
        smokingTolerance: 'yes',
        pets: ['none'],
        petTolerance: ['noPets'],
        internetUse: 'moderate',
        occupation: ['student'],
        noiseAcceptable: 'daytimeOnly',
        musicFrequency: 'rarely',
        musicVolume: 'headphones',
        bedtime: 'early',
        studyHabits: 'quiet',
        comingGoing: 'onceTwice',
        guestPolicy: 'rare',
        overnightGuests: 'notComfortable',
        parties: 'noParties',
        frequentGuests: 'none',
        dietaryRestrictions: ['vegMeatOk'],
        cookingFrequency: 'allMeals',
        alcoholUse: 'noDrinkOkWithIt',
        roommateRelationship: 'billsChores',
        additionalOccupants: 'no'
      }
    },
    {
      id: 3,
      name: 'Jordan Lee',
      university: 'USC',
      bio: 'Business major, social butterfly, love hosting friends. Looking for an outgoing roommate!',
      answers: {
        billPayment: 'byDueDate',
        utilities: 'splitEvenly',
        borrowing: 'shareEverything',
        commonItems: 'takeTurns',
        foodSharing: 'takeTurns',
        tidiness: 'organized',
        kitchen: 'cleanTidy',
        bathroom: 'weekly',
        dishes: 'overnight',
        cleaningSchedule: 'rotate',
        cleaningFrequency: 'weekly',
        smoking: 'no',
        smokingTolerance: 'no',
        pets: ['dog'],
        petTolerance: ['dogs', 'cats', 'furry'],
        internetUse: 'moderate',
        occupation: ['student', 'partTime'],
        noiseAcceptable: 'anytime',
        musicFrequency: 'always',
        musicVolume: 'comfortable',
        bedtime: 'late',
        studyHabits: 'elsewhere',
        comingGoing: 'constantly',
        guestPolicy: 'allTheTime',
        overnightGuests: 'regularly',
        parties: 'loveThem',
        frequentGuests: 'frequent',
        dietaryRestrictions: ['none'],
        cookingFrequency: 'never',
        alcoholUse: 'weekdays',
        roommateRelationship: 'hangOut',
        additionalOccupants: 'no'
      }
    }
  ]);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({});
  const [currentLease, setCurrentLease] = useState({
    id: 'lease-001',
    property: { address: '123 University Ave, Los Angeles, CA' },
    monthlyRent: 1200,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    landlord: { name: 'Sarah Chen', phone: '(555) 123-4567' }
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showSavedProperties, setShowSavedProperties] = useState(false);
  const [showApplicationHistory, setShowApplicationHistory] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showReportMaintenance, setShowReportMaintenance] = useState(false);
  const [showViewLease, setShowViewLease] = useState(false);
  const [showUtilitiesManagement, setShowUtilitiesManagement] = useState(false);
  const [showRentersInsurance, setShowRentersInsurance] = useState(false);
  const [isAcceptedRenter, setIsAcceptedRenter] = useState(true); // Mock: Set to true to simulate accepted status
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showBankLinking, setShowBankLinking] = useState(false);
  const [showLegalTemplate, setShowLegalTemplate] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [activeLeases, setActiveLeases] = useState([]);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [showPropertyInspection, setShowPropertyInspection] = useState(false);
  const [inspectionType, setInspectionType] = useState('move-in');

  // Group application & guarantor state
  const [groupApplication, setGroupApplication] = useState(null);
  const [guarantorVerifyContext, setGuarantorVerifyContext] = useState(null);
  const [savedGuarantors] = useState([
    { name: 'Robert Johnson', phone: '(555) 123-4567', email: 'robert.johnson@email.com' },
  ]);
  const [multiPartyLeaseListing, setMultiPartyLeaseListing] = useState(null);

  // Landlord pipeline flow state
  const [landlordWaitingRoomApp, setLandlordWaitingRoomApp] = useState(null);
  const [landlordChatApp, setLandlordChatApp] = useState(null);
  const [landlordLeaseContext, setLandlordLeaseContext] = useState(null); // { groupApplication, listing }
  
  // Roommate social platform state (STUDENT ONLY)
  const [roommateGroups, setRoommateGroups] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [showAddToConversation, setShowAddToConversation] = useState(false);
  const [conversationToAddTo, setConversationToAddTo] = useState(null);
  
  // Sample roommates/friends that can be added to conversations
  const [userConnections, setUserConnections] = useState([
    {
      id: 'conn1',
      name: 'Sarah Kim',
      userType: 'student',
      university: 'USC',
      major: 'Business',
      budget: { min: 800, max: 1200 },
      photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300'],
      verificationStatus: 'verified',
      compatibilityScore: 92,
      relationshipType: 'Matched Roommate'
    },
    {
      id: 'conn2',
      name: 'Maya Patel',
      userType: 'student',
      university: 'USC',
      major: 'Engineering', 
      budget: { min: 900, max: 1400 },
      photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300'],
      verificationStatus: 'verified',
      compatibilityScore: 87,
      relationshipType: 'Friend'
    },
    {
      id: 'conn3',
      name: 'Alex Johnson',
      userType: 'student',
      university: 'USC',
      major: 'Computer Science',
      budget: { min: 1000, max: 1300 },
      photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'],
      verificationStatus: 'verified',
      relationshipType: 'College Friend'
    }
  ]);

  // On mount: restore session from stored JWT
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setAuthLoading(false)
      return
    }
    usersApi.getProfile()
      .then(({ data }) => {
        setUser(normalizeUser(data.user))
        setShowLogin(false)
      })
      .catch(() => {
        // Token invalid/expired — clear it and show login
        setAuthToken(null)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  // Filter listings based on search, university, and advanced filters
  const filteredListings = listings.filter(listing => {
    // Basic search and university
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = selectedUniversity === 'All Universities' || 
                             listing.university === selectedUniversity;
    
    // Advanced filters
    let matchesFilters = true;
    
    if (Object.keys(searchFilters).length > 0) {
      // Price range
      if (searchFilters.minRent && listing.price < Number(searchFilters.minRent)) {
        matchesFilters = false;
      }
      if (searchFilters.maxRent && listing.price > Number(searchFilters.maxRent)) {
        matchesFilters = false;
      }
      
      // Keywords
      if (searchFilters.keywords) {
        const keywords = searchFilters.keywords.toLowerCase();
        const matchesKeywords = listing.title.toLowerCase().includes(keywords) ||
                               listing.location.toLowerCase().includes(keywords) ||
                               listing.description.toLowerCase().includes(keywords);
        if (!matchesKeywords) matchesFilters = false;
      }
      
      // Amenities (listing must have all selected amenities)
      if (searchFilters.amenities && searchFilters.amenities.length > 0) {
        const hasAllAmenities = searchFilters.amenities.every(amenity => 
          listing.amenities.includes(amenity)
        );
        if (!hasAllAmenities) matchesFilters = false;
      }
      
      // Move-in date with ±2 weeks flexibility
      if (searchFilters.moveInDate && listing.moveInDate) {
        const filterDate = new Date(searchFilters.moveInDate);
        const listingDate = new Date(listing.moveInDate);
        const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
        const dateDiff = Math.abs(listingDate - filterDate);
        
        if (dateDiff > twoWeeksInMs) {
          matchesFilters = false;
        }
      }
      
      // Property type
      if (searchFilters.propertyType && searchFilters.propertyType !== 'any') {
        if (listing.propertyType !== searchFilters.propertyType) {
          matchesFilters = false;
        }
      }
      
      // Bedrooms
      if (searchFilters.bedrooms && searchFilters.bedrooms !== 'any') {
        if (searchFilters.bedrooms === '5+') {
          if (listing.bedrooms < 5) matchesFilters = false;
        } else {
          if (listing.bedrooms !== Number(searchFilters.bedrooms)) {
            matchesFilters = false;
          }
        }
      }
      
      // Bathrooms
      if (searchFilters.bathrooms && searchFilters.bathrooms !== 'any') {
        if (searchFilters.bathrooms === '4+') {
          if (listing.bathrooms < 4) matchesFilters = false;
        } else {
          if (listing.bathrooms !== Number(searchFilters.bathrooms)) {
            matchesFilters = false;
          }
        }
      }
    }
    
    return matchesSearch && matchesUniversity && matchesFilters;
  });

  // Count unread messages from conversations
  const unreadMessageCount = conversations.reduce((total, conversation) => {
    return total + conversation.unreadCount;
  }, 0);

  const toggleFavorite = (listingId) => {
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };


  const handleSignOut = () => {
    setAuthToken(null);
    setUser(null);
    setShowLogin(true);
    setShowRegister(false);
    setCurrentView('browse');
    setFavorites([]);
    setMessages([]);
    setTransactions([]);
    setTourRequests([]);
  };

  const startApplication = (listing) => {
    // Route to the new group application kickoff screen first
    setSelectedListing(listing);
    setGroupApplication(null);
    setCurrentView('group-application');
  };

  const proceedToPayment = () => {
    setActiveApplication(prev => ({ ...prev, step: 'payment' }));
  };

  const generateLeaseAgreement = (application, approvalData) => {
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
    // Store the approval data for the legal template system
    setPendingApproval({ applicationId, approvalData });
    setShowLegalTemplate(true);
  };

  const handleLegalAgreementGenerated = (agreement) => {
    // Use the state-compliant agreement instead of basic template
    setCurrentView('agreement');
    setActiveApplication(prev => ({ ...prev, agreement, step: 'agreement' }));
    setShowLegalTemplate(false);
    setPendingApproval(null);
  };

  const handleAgreementSigned = () => {
    // When both parties sign, create an active lease
    const activeLease = {
      id: `LEASE-${Date.now()}`,
      property: activeApplication.listing,
      agreement: activeApplication.agreement,
      tenant: activeApplication.agreement.tenant || activeApplication.agreement.sublessee,
      landlord: activeApplication.agreement.landlord || activeApplication.agreement.sublessor,
      startDate: activeApplication.agreement.terms.startDate,
      endDate: activeApplication.agreement.terms.endDate,
      monthlyRent: activeApplication.agreement.terms.monthlyRent,
      status: 'active',
      createdDate: new Date().toISOString()
    };
    
    setActiveLeases(prev => [...prev, activeLease]);
    setCurrentProperty(activeLease);
    setActiveApplication(null);
    
    // Navigate to property management for active lease
    setCurrentView('property-management');
  };

  const markMessagesAsRead = () => {
    setMessages(prev => prev.map(message => ({ ...message, read: true })));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: newMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString(),
        read: true
      }]);
      setNewMessage('');
    }
  };

  const requestTour = (date, time, message) => {
    const tourRequest = {
      id: Date.now(),
      propertyId: activeMessageProperty.id,
      date,
      time,
      message,
      status: 'pending', // pending, approved, declined
      requestedAt: new Date().toLocaleString()
    };
    
    setTourRequests(prev => [...prev, tourRequest]);
    
    // Add a message to the chat about the tour request
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      text: `Tour requested for ${date} at ${time}${message ? ` - ${message}` : ''}`,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString(),
      read: true,
      type: 'tour_request',
      tourRequestId: tourRequest.id
    }]);
    
    setShowTourModal(false);
    
    // Simulate owner response after 3 seconds
    setTimeout(() => {
      const responses = ['approved', 'declined'];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setTourRequests(prev => prev.map(req => 
        req.id === tourRequest.id ? { ...req, status: randomResponse } : req
      ));
      
      // Update conversation tourScheduled status if approved
      if (randomResponse === 'approved') {
        setConversations(prev => prev.map(conv => 
          conv.propertyId === activeMessageProperty.id 
            ? { ...conv, tourScheduled: true }
            : conv
        ));
      }
      
      const responseText = randomResponse === 'approved' 
        ? `Great! Tour approved for ${date} at ${time}. I'll send you the address details.`
        : `Sorry, that time doesn't work. Can you suggest alternative times?`;
      
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: responseText,
        sender: 'owner',
        timestamp: new Date().toLocaleTimeString(),
        read: false,
        type: 'tour_response',
        tourStatus: randomResponse
      }]);
    }, 3000);
  };

  const viewPropertyDetails = () => {
    setSelectedListing(activeMessageProperty);
    setCurrentView('detail');
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading&hellip;</p>
        </div>
      </div>
    )
  }

  if (showLogin) {
    if (showRegister) {
      return <EnhancedRegistration onComplete={userData => {
        setUser(userData);
        setShowLogin(false);
        setShowRegister(false);
        setCurrentView(userData.userType === 'owner' ? 'owner-dashboard' : 'browse');
      }} />;
    }
    return <LoginScreen
      onLogin={userData => {
        setUser(userData);
        setShowLogin(false);
        setCurrentView(userData.userType === 'owner' ? 'owner-dashboard' : 'browse');
      }}
      onShowRegister={() => setShowRegister(true)}
    />;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-brand-500 text-white p-4">
        <div className="flex items-center justify-between">
          {currentView !== 'browse' && currentView !== 'owner-dashboard' && (
            <button 
              onClick={() => {
                // Smart navigation based on user type and current view
                if (user?.userType === 'owner') {
                  if (['post', 'landlord-listing', 'student-listing'].includes(currentView)) {
                    setCurrentView('post');
                  } else {
                    setCurrentView('owner-dashboard');
                  }
                } else {
                  // Student navigation
                  if (['roommates', 'roommate-discovery', 'roommate-questionnaire', 'roommate-matching', 'group-creator', 'add-to-conversation'].includes(currentView)) {
                    if (roommateQuestionnaireAnswers) {
                      setCurrentView('roommate-matching');
                    } else {
                      setCurrentView('roommate-questionnaire');
                    }
                  } else if (['edit-profile', 'my-listings', 'saved-properties', 'application-history',
                           'notifications', 'privacy-settings', 'help-center', 'contact-support',
                           'report-maintenance', 'view-lease', 'utilities-management', 'renters-insurance',
                           'bank-accounts', 'tenant-rights', 'parent-guardian', 'lease-contract',
                           'dispute-resolution', 'deposit-protection', 'document-vault'].includes(currentView)) {
                    setCurrentView('profile');
                  } else {
                    setCurrentView('browse');
                  }
                }
              }}
              className="p-1"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold flex-1 text-center">
            {currentView === 'browse' && 'Rentra'}
            {currentView === 'university-search' && 'University Search'}
            {currentView === 'roommates' && 'Find Roommates'}
            {currentView === 'roommate-discovery' && 'Find Roommates'}
            {currentView === 'roommate-questionnaire' && 'Compatibility Quiz'}
            {currentView === 'roommate-matching' && 'Your Matches'}
            {currentView === 'group-creator' && 'Create Group'}
            {currentView === 'add-to-conversation' && 'Add Friends'}
            {currentView === 'detail' && 'Property Details'}
            {currentView === 'post' && 'Post Listing'}
            {currentView === 'messages' && 'Messages'}
            {currentView === 'profile' && 'Profile'}
            {currentView === 'application' && 'Apply Now'}
            {currentView === 'agreement' && 'Lease Agreement'}
            {currentView === 'confirmation' && 'Booking Confirmed'}
            {currentView === 'payments' && 'Payment Center'}
            {currentView === 'parent-guardian' && 'Family Management'}
            {currentView === 'lease-contract' && 'Lease Contracts'}
            {currentView === 'owner-approval' && 'Lease Approvals'}
            {currentView === 'dispute-resolution' && 'Dispute Resolution'}
            {currentView === 'deposit-protection' && 'Deposit Protection'}
            {currentView === 'group-application' && 'Apply for Property'}
            {currentView === 'guarantor-verify' && 'Guarantor Verification'}
            {currentView === 'multi-party-lease' && 'Sign Lease'}
            {currentView === 'document-vault' && 'My Documents'}
            {currentView === 'landlord-waiting-room' && 'Application Waiting Room'}
            {currentView === 'landlord-app-chat' && 'Group Chat'}
            {currentView === 'landlord-lease-router' && 'Lease Execution'}
          </h1>
          {/* Messages Button with Unread Count */}
          <button
            onClick={() => {
              setActiveMessageProperty(null); // Reset to show conversations list
              setCurrentView('messages');
            }}
            className="relative p-1"
          >
            <MessageCircle size={24} />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* University Search View */}
      {currentView === 'university-search' && (
        <UniversitySearch 
          onBack={() => setCurrentView('browse')}
          onSelectListing={(listing) => {
            setSelectedListing(listing);
            setCurrentView('detail');
          }}
        />
      )}
      
      {/* Roommate Questionnaire - Students Only */}
      {currentView === 'roommate-questionnaire' && user?.userType === 'student' && (
        <RoommateQuestionnaire
          existingAnswers={roommateQuestionnaireAnswers}
          onComplete={(answers) => {
            setRoommateQuestionnaireAnswers(answers);
            setCurrentView('roommate-matching');
          }}
          onBack={() => setCurrentView('browse')}
        />
      )}
      
      {/* Roommate Matching - Students Only */}
      {currentView === 'roommate-matching' && user?.userType === 'student' && roommateQuestionnaireAnswers && (
        <RoommateMatching
          userAnswers={roommateQuestionnaireAnswers}
          potentialRoommates={potentialRoommates}
          onBack={() => setCurrentView('browse')}
          onMessageUser={(match) => {
            // Create a conversation with the matched roommate
            const newConversation = {
              propertyId: match.id,
              property: {
                ...match,
                title: `Chat with ${match.name}`,
                owner: {
                  name: match.name,
                  avatar: match.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
                  verified: true
                }
              },
              messages: [],
              lastMessage: null,
              unreadCount: 0
            };
            setConversations(prev => {
              const existing = prev.find(c => c.propertyId === match.id);
              if (!existing) {
                return [...prev, newConversation];
              }
              return prev;
            });
            setActiveMessageProperty(newConversation.property);
            setCurrentView('messages');
          }}
        />
      )}
      
      {/* Roommate Discovery View - Students Only */}
      {(currentView === 'roommates' || currentView === 'roommate-discovery') && user?.userType === 'student' && (
        <RoommateDiscovery
          currentUser={user}
          onBack={() => setCurrentView('browse')}
          onMessage={(roommate) => {
            if (roommate.isGroup) {
              // Handle group message
              setActiveMessageProperty(roommate);
              setCurrentView('messages');
            } else {
              // Handle individual roommate message
              const newConversation = {
                propertyId: roommate.id,
                property: roommate,
                messages: [],
                lastMessage: null,
                unreadCount: 0
              };
              setConversations(prev => {
                const existing = prev.find(c => c.propertyId === roommate.id);
                if (!existing) {
                  return [...prev, newConversation];
                }
                return prev;
              });
              setActiveMessageProperty(roommate);
              setCurrentView('messages');
            }
          }}
          onCreateGroup={(group) => {
            setRoommateGroups(prev => [...prev, group]);
            // Add group conversation
            const groupConversation = {
              propertyId: group.id,
              property: group,
              messages: group.messages || [],
              lastMessage: null,
              unreadCount: 0
            };
            setConversations(prev => [...prev, groupConversation]);
          }}
        />
      )}
      
      {/* Group Chat Creator - Students Only */}
      {currentView === 'group-creator' && user?.userType === 'student' && (
        <GroupChatCreator 
          availableStudents={[
            {
              id: 'student1',
              name: 'Sarah Kim',
              userType: 'student',
              university: 'USC',
              major: 'Business',
              photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300']
            },
            {
              id: 'student2', 
              name: 'Maya Patel',
              userType: 'student',
              university: 'USC',
              major: 'Engineering',
              photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300']
            }
          ]}
          currentUser={user}
          onCreateGroup={(group) => {
            setRoommateGroups(prev => [...prev, group]);
            const groupConversation = {
              propertyId: group.id,
              property: group,
              messages: group.messages || [],
              lastMessage: null,
              unreadCount: 0
            };
            setConversations(prev => [...prev, groupConversation]);
            setCurrentView('roommate-discovery');
          }}
          onBack={() => setCurrentView('roommate-discovery')}
        />
      )}
      
      {/* Add to Conversation View - Students Only */}
      {currentView === 'add-to-conversation' && user?.userType === 'student' && conversationToAddTo && (
        <AddToConversation 
          currentConversation={conversationToAddTo}
          currentUser={user}
          availableRoommates={userConnections}
          onAddMembers={(selectedMembers, systemMessage) => {
            // Add members to the conversation
            const updatedConversation = {
              ...conversationToAddTo,
              members: [...(conversationToAddTo.members || [user]), ...selectedMembers],
              isGroup: true
            };
            
            // Update the conversation in state
            setConversations(prev => prev.map(conv => 
              conv.propertyId === conversationToAddTo.propertyId 
                ? {
                    ...conv,
                    property: updatedConversation,
                    messages: [...conv.messages, systemMessage]
                  }
                : conv
            ));
            
            // Update active conversation
            setActiveMessageProperty(updatedConversation);
            
            // Go back to messages
            setCurrentView('messages');
            setShowAddToConversation(false);
            setConversationToAddTo(null);
          }}
          onBack={() => {
            setCurrentView('messages');
            setShowAddToConversation(false);
            setConversationToAddTo(null);
          }}
        />
      )}

      {/* Browse View - Students Only */}
      {currentView === 'browse' && user?.userType !== 'owner' && (
        <div className="p-4 pb-20">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="absolute right-3 top-2 p-1 text-gray-400 hover:text-brand-500"
            >
              <Sliders size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mb-4">
            <button
              onClick={() => setCurrentView('university-search')}
              className="w-full p-3 border-2 border-brand-200 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 hover:border-brand-300 transition-colors flex items-center justify-center font-medium"
            >
              <Building2 size={20} className="mr-2" />
              University Search
            </button>
          </div>

          {/* University Filter (Original) */}
          <div className="mb-4">
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                      <Shield size={16} className="ml-1 text-brand-500" />
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
        <EnhancedPropertyDetails 
          listing={{
            ...selectedListing,
            // Enhanced listing data
            additionalDetails: [
              "5-minute walk to campus",
              "Quiet neighborhood perfect for studying",
              "Recently renovated kitchen",
              "High-speed internet included"
            ],
            houseRules: [
              "No smoking inside",
              "Quiet hours after 10 PM",
              "No overnight guests without permission",
              "Keep common areas clean"
            ],
            owner: {
              ...selectedListing.owner,
              bio: "Graduate student rentalting my apartment while studying abroad. I understand student needs and want to make this process smooth for everyone!",
              responseTime: "2 hours",
              reviewCount: 15
            }
          }}
          onBack={() => setCurrentView('browse')}
          onMessage={(listing) => {
            setActiveMessageProperty(listing);
            setCurrentView('messages');
          }}
          onApply={(listing) => startApplication(listing)}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.includes(selectedListing.id)}
        />
      )}

      {/* Messages View */}
      {currentView === 'messages' && !activeMessageProperty && (
        <div className="h-screen flex flex-col">
          <MessagesList 
            conversations={conversations}
            onSelectConversation={(conversation) => {
              setActiveMessageProperty(conversation.property);
              // Mark messages as read when opening conversation
              setConversations(prev => prev.map(conv => 
                conv.propertyId === conversation.propertyId 
                  ? { ...conv, unreadCount: 0, messages: conv.messages.map(msg => ({ ...msg, read: true })) }
                  : conv
              ));
            }}
            currentUser={{ id: 'me', name: user?.name || 'User' }}
          />
        </div>
      )}

      {/* Individual Conversation View */}
      {currentView === 'messages' && activeMessageProperty && (
        <div className="h-screen flex flex-col">
          {/* Use StudentMessaging for roommate/group chats, EnhancedMessaging for property chats */}
          {(activeMessageProperty.userType === 'student' || activeMessageProperty.isGroup) ? (
            <StudentMessaging 
              conversation={activeMessageProperty}
              currentUser={user}
              onBack={() => setActiveMessageProperty(null)}
              onVideoCall={(person) => {
                alert(`Starting video call with ${person.name}`);
              }}
              onAddToGroup={(person) => {
                // Add person to a group or create new group
                setCurrentView('group-creator');
              }}
              onInviteFriend={(groupId) => {
                // Handle friend invitation to group
                alert('Friend invitation feature coming soon!');
              }}
            />
          ) : (
            <>
              <div className="bg-brand-500 text-white p-4 flex items-center">
                <button 
                  onClick={() => setActiveMessageProperty(null)}
                  className="p-1 mr-3"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Messages</h1>
              </div>
              <EnhancedMessaging 
                property={activeMessageProperty}
                messages={conversations.find(conv => conv.propertyId === activeMessageProperty.id)?.messages || []}
                showAddFriendsButton={user?.userType === 'student'}
                onAddFriends={(property) => {
                  const conversation = conversations.find(conv => conv.propertyId === property.id);
                  if (conversation) {
                    setConversationToAddTo(conversation);
                    setCurrentView('add-to-conversation');
                  }
                }}
            onSendMessage={(message) => {
              const newMessage = {
                ...message,
                id: Date.now(),
                sender: 'me',
                read: true
              };
              
              // Update the conversation with the new message
              setConversations(prev => prev.map(conv => 
                conv.propertyId === activeMessageProperty.id
                  ? {
                      ...conv,
                      messages: [...conv.messages, newMessage],
                      lastMessage: newMessage
                    }
                  : conv
              ));
              
              // Simulate owner response after a delay
              setTimeout(() => {
                const ownerResponse = {
                  id: Date.now() + 1,
                  text: "Thanks for your message! I'll get back to you soon.",
                  sender: 'owner',
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: 'text'
                };
                
                setConversations(prev => prev.map(conv => 
                  conv.propertyId === activeMessageProperty.id
                    ? {
                        ...conv,
                        messages: [...conv.messages, ownerResponse],
                        lastMessage: ownerResponse,
                        unreadCount: conv.unreadCount + 1
                      }
                    : conv
                ));
              }, 2000);
            }}
            onScheduleTour={(date, time, type) => {
              // Handle tour scheduling
              console.log(`Tour scheduled: ${type} on ${date} at ${time}`);
            }}
            onVideoCall={(property) => {
              // Handle video call initiation
              alert(`Starting video call for ${property.title}`);
              }}
              currentUser={{ id: 'me', name: user?.name || 'User' }}
            />
            </>
          )}
        </div>
      )}

      {/* Group Application Flow (Phase 1) */}
      {currentView === 'group-application' && selectedListing && (
        <GroupApplicationFlow
          listing={selectedListing}
          currentUser={user}
          roommateGroups={roommateGroups}
          savedGuarantors={savedGuarantors}
          onBack={() => setCurrentView('detail')}
          onSubmitApplication={submittedApp => {
            setGroupApplication(submittedApp);
            setCurrentView('browse');
            alert('Application submitted! The landlord will review and get back to you.');
          }}
          onNavigateToGuarantorVerify={ctx => {
            setGuarantorVerifyContext(ctx);
            setCurrentView('guarantor-verify');
          }}
        />
      )}

      {/* Guarantor Verification Flow (Screens 4-7) */}
      {currentView === 'guarantor-verify' && (
        <GuarantorVerificationFlow
          studentName={guarantorVerifyContext?.studentName || 'Your Student'}
          guarantorName={guarantorVerifyContext?.guarantorName}
          propertyAddress={guarantorVerifyContext?.propertyAddress || selectedListing?.title || 'the property'}
          onComplete={() => setCurrentView('group-application')}
          onBack={() => setCurrentView('group-application')}
        />
      )}

      {/* Multi-Party Lease Execution (Phase 2 - Screens 9-11) */}
      {currentView === 'multi-party-lease' && (groupApplication || multiPartyLeaseListing) && (
        <MultiPartyLeaseExecution
          groupApplication={groupApplication}
          listing={multiPartyLeaseListing || selectedListing}
          currentUser={user}
          onComplete={destination => {
            const activeLease = {
              id: `LEASE-${Date.now()}`,
              property: { address: (multiPartyLeaseListing || selectedListing)?.location || '' },
              monthlyRent: (multiPartyLeaseListing || selectedListing)?.price || 0,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
              landlord: (multiPartyLeaseListing || selectedListing)?.owner || {},
              status: 'active',
            };
            setCurrentLease(activeLease);
            setCurrentView(destination === 'view-lease' ? 'view-lease' : 'property-management');
          }}
          onBack={() => setCurrentView('landlord-inbox')}
        />
      )}

      {/* Application & Payment Flow (legacy solo path) */}
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
        <LeaseAgreementView 
          agreement={activeApplication.agreement}
          onSign={handleAgreementSigned}
          onBack={() => setCurrentView('confirmation')}
        />
      )}

      {/* Confirmation View */}
      {currentView === 'confirmation' && (
        <div className="p-4 pb-20 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your application has been submitted and payment secured.</p>
            
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
              <p className="text-sm text-brand-600">
                When you're ready to move in, use our move-in confirmation process to document the property condition and set up utilities.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setCurrentView('move-in')}
              className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 flex items-center justify-center"
            >
              <Home size={20} className="mr-2" />
              Start Move-In Process
            </button>
            <button
              onClick={() => setCurrentView('browse')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}

      {/* Payment Center */}
      {currentView === 'payments' && (
        user?.userType === 'owner' ? (
          <OwnerPaymentCenter 
            user={user}
            transactions={transactions}
            bankAccounts={bankAccounts}
            onSendReminder={(tenantId, message) => {
              console.log('Payment reminder sent to:', tenantId, message);
              // Handle sending payment reminder
            }}
            onRespondToMaintenance={(requestId, response) => {
              console.log('Maintenance response:', requestId, response);
              // Handle maintenance request response
            }}
          />
        ) : (
          <PaymentReminders 
            user={user}
            currentLease={currentLease}
            bankAccounts={bankAccounts}
            onPayRent={(payment) => {
              console.log('Rent payment processed:', payment);
              // Add to transaction history
              setTransactions(prev => [...prev, {
                id: Date.now(),
                ...payment,
                status: 'completed',
                type: 'rent'
              }]);
            }}
            onReportIssue={(issue) => {
              console.log('Issue reported:', issue);
              // Handle issue reporting
            }}
            onNavigateToBankAccounts={() => setCurrentView('bank-accounts')}
          />
        )
      )}

      {/* Move-in Confirmation */}
      {currentView === 'move-in' && activeApplication && (
        <MoveInConfirmation 
          lease={{
            id: 'lease-001',
            property: { address: activeApplication.listing.location },
            landlord: activeApplication.listing.owner
          }}
          onConfirm={(confirmationRecord) => {
            console.log('Move-in confirmed:', confirmationRecord);
            setCurrentLease({
              id: 'lease-001',
              property: { address: activeApplication.listing.location },
              monthlyRent: activeApplication.listing.price,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
              landlord: activeApplication.listing.owner
            });
            setCurrentView('payments');
          }}
          onBack={() => setCurrentView('confirmation')}
        />
      )}

      {/* Post Listing View */}
      {currentView === 'post' && (
        <div className="p-4 pb-20">
          <h2 className="text-2xl font-bold mb-6">Create a Listing</h2>
          
          {/* Listing Type Selection */}
          <div className="space-y-4 mb-6">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">Choose Your Listing Type</h3>
              <p className="text-sm text-brand-600">Select how you want to list your property</p>
            </div>

            <button
              onClick={() => setCurrentView('landlord-listing')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-brand-300 text-left"
            >
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <Home size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">I'm a Property Owner/Landlord</h4>
                  <p className="text-sm text-gray-600">List your property with full control and management</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentView('student-listing')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-brand-300 text-left"
            >
              <div className="flex items-center">
                <div className="bg-brand-100 rounded-full p-3 mr-4">
                  <User size={24} className="text-brand-500" />
                </div>
                <div>
                  <h4 className="font-semibold">I'm a Student/Renter</h4>
                  <p className="text-sm text-gray-600">Rental your room or space (requires owner approval)</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Landlord Listing Form */}
      {currentView === 'landlord-listing' && (
        <LandlordListingForm 
          onSubmit={(listingData) => {
            console.log('New landlord listing:', listingData);
            // Add to listings and go back to post view for owners
            const newListing = {
              id: Date.now(),
              ...listingData,
              owner: {
                name: user?.name || 'Owner',
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
                rating: 4.8,
                verified: true
              }
            };
            setListings(prev => [newListing, ...prev]);
            setCurrentView('post');
          }}
          onBack={() => setCurrentView('post')}
        />
      )}

      {/* Student Listing Form */}
      {currentView === 'student-listing' && (
        <StudentListingForm 
          currentUser={user}
          onSubmit={(listingData) => {
            console.log('New student listing:', listingData);
            // Show success message and guide to contract creation
            alert(
              'Listing submitted successfully! \n\n' +
              'Next Steps:\n' +
              '1. Your listing will be reviewed within 24 hours\n' +
              '2. Consider creating a lease contract to protect yourself\n' +
              '3. Set up parent/guardian payment support if needed\n\n' +
              'You can access these features in your Profile under "Student Features"'
            );
            setCurrentView('browse');
          }}
          onBack={() => setCurrentView('post')}
        />
      )}

      {/* Landlord Inbox */}
      {currentView === 'landlord-inbox' && (
        <LandlordInbox 
          properties={[]}
          onSelectApplicant={(applicant) => console.log('Selected:', applicant)}
          onSendMessage={(applicant) => {
            setActiveMessageProperty({ 
              id: applicant.propertyId, 
              title: applicant.propertyTitle,
              price: 1200,
              location: 'Los Angeles, CA',
              owner: { name: user?.name || 'Owner' }
            });
            setCurrentView('messages');
          }}
          onScheduleTour={(applicant) => console.log('Schedule tour:', applicant)}
          onSendLease={(applicantId) => console.log('Send lease:', applicantId)}
          onNavigateToApprovals={() => setCurrentView('owner-approvals')}
          onNavigateToUtilities={() => setCurrentView('utility-manager')}
          onApproveGroupApplication={groupApp => {
            const matchedListing = listings.find(l => l.id === groupApp.propertyId) || {
              id: groupApp.propertyId,
              title: groupApp.propertyTitle,
              price: 1200,
              location: 'Los Angeles, CA',
              owner: { name: user?.name || 'Owner' },
            };
            setGroupApplication({ ...groupApp, overallStatus: 'approved' });
            setMultiPartyLeaseListing(matchedListing);
          }}
          onNavigateToMultiPartyLease={() => setCurrentView('multi-party-lease')}
          onOpenWaitingRoom={groupApp => {
            const matchedListing = listings.find(l => l.id === groupApp.propertyId) || {
              id: groupApp.propertyId,
              title: groupApp.propertyTitle,
              price: 1200,
              location: 'Los Angeles, CA',
              owner: { name: user?.name || 'Owner' },
            };
            setLandlordWaitingRoomApp({ ...groupApp, listing: matchedListing });
            setCurrentView('landlord-waiting-room');
          }}
          onOpenGroupChat={groupApp => {
            const matchedListing = listings.find(l => l.id === groupApp.propertyId) || {
              id: groupApp.propertyId,
              title: groupApp.propertyTitle,
              price: 1200,
              location: 'Los Angeles, CA',
              owner: { name: user?.name || 'Owner' },
            };
            setLandlordChatApp({ ...groupApp, listing: matchedListing });
            setCurrentView('landlord-app-chat');
          }}
        />
      )}

      {/* Landlord Waiting Room */}
      {currentView === 'landlord-waiting-room' && landlordWaitingRoomApp && (
        <ApplicationWaitingRoom
          groupApplication={landlordWaitingRoomApp}
          listing={landlordWaitingRoomApp.listing}
          onBack={() => setCurrentView('landlord-inbox')}
          onReviewApplication={groupApp => {
            setLandlordChatApp({ ...groupApp, listing: landlordWaitingRoomApp.listing });
            setCurrentView('landlord-app-chat');
          }}
        />
      )}

      {/* Landlord Application Chat */}
      {currentView === 'landlord-app-chat' && landlordChatApp && (
        <LandlordApplicationChat
          groupApplication={landlordChatApp}
          listing={landlordChatApp.listing}
          landlordUser={user}
          onBack={() => setCurrentView('landlord-inbox')}
          onSendLease={groupApp => {
            setLandlordLeaseContext({
              groupApplication: groupApp,
              listing: landlordChatApp.listing,
            });
            setCurrentView('landlord-lease-router');
          }}
        />
      )}

      {/* Landlord Lease Router (Phases 5-6) */}
      {currentView === 'landlord-lease-router' && landlordLeaseContext && (
        <LandlordLeaseRouter
          groupApplication={landlordLeaseContext.groupApplication}
          listing={landlordLeaseContext.listing}
          landlordUser={user}
          onBack={() => setCurrentView('landlord-app-chat')}
          onLeaseExecuted={(groupApp, activeLease) => {
            setActiveLeases(prev => [...prev, activeLease]);
          }}
          onNavigateToPropertyManagement={() => {
            if (activeLeases.length > 0) {
              setCurrentProperty(activeLeases[activeLeases.length - 1]);
            }
            setCurrentView('property-management');
          }}
        />
      )}

      {/* Landlord Utility Manager */}
      {currentView === 'utility-manager' && (
        <LandlordUtilityManager 
          onRequestPayment={(request) => console.log('Payment requested:', request)}
          onUploadBill={(bill) => console.log('Bill uploaded:', bill)}
          onBack={() => setCurrentView('landlord-inbox')}
        />
      )}

      {/* Owner Approval Dashboard */}
      {currentView === 'owner-approvals' && (
        <OwnerApprovalDashboard 
          onApprove={(listingId) => {
            console.log('Approved listing:', listingId);
            // Here you would typically update the backend
          }}
          onReject={(listingId, reason) => {
            console.log('Rejected listing:', listingId, 'Reason:', reason);
            // Here you would typically update the backend
          }}
          onMessage={(studentInfo) => {
            console.log('Message student:', studentInfo);
            // Navigate to messaging with student
            setCurrentView('messages');
          }}
          onBack={() => setCurrentView('landlord-inbox')}
        />
      )}

      {/* Profile View */}
      {currentView === 'profile' && (
        <ProfileView 
          user={user} 
          onBack={() => {
            // Navigate back to appropriate view based on user type
            if (user?.userType === 'owner') {
              setCurrentView('post');
            } else {
              setCurrentView('browse');
            }
          }} 
          onSignOut={handleSignOut}
          onNavigate={(view) => setCurrentView(view)}
          favorites={favorites}
        />
      )}

      {/* Edit Profile View */}
      {currentView === 'edit-profile' && (
        <EditProfileView user={user} onBack={() => setCurrentView('profile')} onSave={(updatedUser) => {
          setUser(updatedUser);
          setCurrentView('profile');
        }} />
      )}

      {/* My Listings View */}
      {currentView === 'my-listings' && (
        <MyListingsView user={user} onBack={() => setCurrentView('profile')} listings={listings.filter(l => l.owner.name === user.name)} />
      )}

      {/* Saved Properties View */}
      {currentView === 'saved-properties' && (
        <SavedPropertiesView 
          user={user} 
          onBack={() => setCurrentView('profile')} 
          savedListings={listings.filter(l => favorites.includes(l.id))}
          onViewProperty={(listing) => {
            setSelectedListing(listing);
            setCurrentView('property-detail');
          }}
        />
      )}

      {/* Application History View */}
      {currentView === 'application-history' && (
        <ApplicationHistoryView user={user} onBack={() => setCurrentView('profile')} transactions={transactions} />
      )}

      {/* Notification Settings View */}
      {currentView === 'notifications' && (
        <NotificationSettingsView user={user} onBack={() => setCurrentView('profile')} />
      )}

      {/* Privacy Settings View */}
      {currentView === 'privacy-settings' && (
        <PrivacySettingsView user={user} onBack={() => setCurrentView('profile')} />
      )}

      {/* Help Center View */}
      {currentView === 'help-center' && (
        <HelpCenterView onBack={() => setCurrentView('profile')} />
      )}

      {/* Contact Support View */}
      {currentView === 'contact-support' && (
        <ContactSupportView user={user} onBack={() => setCurrentView('profile')} />
      )}

      {/* Report Maintenance View */}
      {currentView === 'report-maintenance' && (
        <ReportMaintenanceView user={user} onBack={() => setCurrentView('profile')} />
      )}

      {/* View Lease */}
      {currentView === 'view-lease' && (
        <ViewLeaseView user={user} lease={currentLease} onBack={() => setCurrentView('profile')} />
      )}

      {/* Utilities Management */}
      {currentView === 'utilities-management' && (
        <UtilitiesManagementView 
          user={user} 
          lease={currentLease} 
          onBack={() => setCurrentView('profile')}
          onPayUtility={(payment) => {
            console.log('Utility payment processed:', payment);
            setTransactions(prev => [...prev, {
              id: Date.now(),
              ...payment,
              status: 'completed',
              type: 'utility'
            }]);
          }}
        />
      )}

      {/* Renters Insurance */}
      {currentView === 'renters-insurance' && isAcceptedRenter && (
        <RentersInsuranceView 
          user={user} 
          lease={currentLease} 
          onBack={() => setCurrentView('profile')}
          onPurchaseInsurance={(payment) => {
            console.log('Insurance payment processed:', payment);
            setTransactions(prev => [...prev, {
              id: Date.now(),
              ...payment,
              status: 'completed',
              type: 'insurance'
            }]);
          }}
        />
      )}

      {/* Bank Account Linking View */}
      {currentView === 'bank-accounts' && (
        <BankAccountManager 
          user={user}
          bankAccounts={bankAccounts}
          onBack={() => setCurrentView('profile')}
          onAddAccount={(account) => {
            setBankAccounts(prev => [...prev, { ...account, id: Date.now(), verified: false }]);
          }}
          onRemoveAccount={(accountId) => {
            setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
          }}
          onVerifyAccount={(accountId) => {
            setBankAccounts(prev => prev.map(acc => 
              acc.id === accountId ? { ...acc, verified: true } : acc
            ));
          }}
        />
      )}

      {/* Property Management View */}
      {currentView === 'property-management' && currentProperty && (
        <RoommateManagement 
          property={currentProperty}
          currentUser={user}
          userType={user?.userType === 'owner' ? 'owner' : 'tenant'}
          onBack={() => {
            setCurrentProperty(null);
            if (user?.userType === 'owner') {
              setCurrentView('post');
            } else {
              setCurrentView('browse');
            }
          }}
          onNavigateToSecurityDeposit={() => setCurrentView('security-deposit')}
        />
      )}

      {/* Tenant Rights Center */}
      {currentView === 'tenant-rights' && (
        <TenantRightsCenter 
          userState={user?.state || 'CA'}
          onBack={() => setCurrentView('profile')}
        />
      )}

      {/* Property Inspection Tools */}
      {currentView === 'property-inspection' && (
        <PropertyInspectionTools 
          lease={currentProperty || currentLease}
          inspectionType={inspectionType}
          onComplete={(report) => {
            console.log('Inspection completed:', report);
            setShowPropertyInspection(false);
            setCurrentView('property-management');
          }}
          onBack={() => {
            setShowPropertyInspection(false);
            setCurrentView('property-management');
          }}
        />
      )}

      {/* Security Deposit Manager */}
      {currentView === 'security-deposit' && (
        <SecurityDepositManager 
          lease={currentProperty || currentLease}
          userType={user?.userType === 'owner' ? 'owner' : 'tenant'}
          onBack={() => {
            if (currentProperty) {
              setCurrentView('property-management');
            } else {
              setCurrentView('payments');
            }
          }}
        />
      )}

      {/* Owner Dashboard */}
      {currentView === 'owner-dashboard' && user?.userType === 'owner' && (
        <OwnerDashboard 
          user={user}
          onBack={() => setCurrentView('post')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Banking & Bookkeeping */}
      {currentView === 'banking-bookkeeping' && user?.userType === 'owner' && (
        <BankingBookkeeping 
          user={user}
          onBack={() => setCurrentView('owner-dashboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Rent Collection System */}
      {currentView === 'rent-collection' && user?.userType === 'owner' && (
        <RentCollectionSystem 
          user={user}
          onBack={() => setCurrentView('owner-dashboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Tax Center */}
      {currentView === 'tax-center' && user?.userType === 'owner' && (
        <TaxCenter 
          user={user}
          onBack={() => setCurrentView('owner-dashboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Parent Guardian Manager */}
      {currentView === 'parent-guardian' && user?.userType === 'student' && (
        <ParentGuardianManager 
          user={user}
          onBack={() => setCurrentView('profile')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Lease Contract Manager */}
      {currentView === 'lease-contract' && user?.userType === 'student' && (
        <LeaseContractManager 
          user={user}
          currentLease={currentLease}
          onBack={() => setCurrentView('profile')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Owner Approval System */}
      {currentView === 'owner-approval' && user?.userType === 'owner' && (
        <OwnerApprovalSystem 
          user={user}
          onBack={() => setCurrentView('owner-dashboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Dispute Resolution Center */}
      {currentView === 'dispute-resolution' && (
        <DisputeResolutionCenter 
          user={user}
          onBack={() => setCurrentView('profile')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Security Deposit Protection */}
      {currentView === 'deposit-protection' && (
        <SecurityDepositProtection 
          user={user}
          onBack={() => setCurrentView('profile')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Owner Document Manager */}
      {currentView === 'document-manager' && user?.userType === 'owner' && (
        <OwnerDocumentManager 
          user={user}
          onBack={() => setCurrentView('profile')}
          onSendToChat={(document) => {
            // Handle sending document to chat
            console.log('Send document to chat:', document);
            // In future, this would open chat selector or directly attach to active conversation
            setCurrentView('landlord-inbox');
          }}
        />
      )}

      {/* Legal Template System Modal */}
      {showLegalTemplate && activeApplication && (
        <div className="fixed inset-0 bg-white z-50">
          <LegalTemplateSystem 
            property={activeApplication.listing}
            application={activeApplication}
            onGenerateAgreement={handleLegalAgreementGenerated}
            onBack={() => {
              setShowLegalTemplate(false);
              setPendingApproval(null);
            }}
          />
        </div>
      )}

      {/* Map View - Students Only */}
      {currentView === 'map' && user?.userType !== 'owner' && (
        <MapView 
          listings={listings}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelectProperty={(listing) => {
            setSelectedListing(listing);
            setCurrentView('property-detail');
          }}
          onBack={() => setCurrentView('browse')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedUniversity={selectedUniversity}
          onUniversityChange={setSelectedUniversity}
        />
      )}

      {/* Owner Fallback - redirect owners away from student views */}
      {(currentView === 'browse' || currentView === 'map' || currentView === 'university-search') && user?.userType === 'owner' && (
        <div className="p-4 pb-20 text-center">
          <div className="mt-20">
            <Building2 size={64} className="mx-auto text-brand-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Property Management Hub</h2>
            <p className="text-gray-600 mb-6">Choose how you'd like to manage your properties</p>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView('owner-dashboard')}
                className="w-full bg-brand-500 text-white py-3 rounded-lg font-medium hover:bg-brand-600 flex items-center justify-center"
              >
                <BarChart3 size={20} className="mr-2" />
                Full Management Dashboard
              </button>
              <button
                onClick={() => setCurrentView('post')}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Create New Listing
              </button>
              <button
                onClick={() => setCurrentView('payments')}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
              >
                Payments & Financials
              </button>
              <button
                onClick={() => setCurrentView('landlord-inbox')}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700"
              >
                Review Applications
              </button>
              {activeLeases.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentProperty(activeLeases[0]); // Use first active lease
                    setCurrentView('property-management');
                  }}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Property Management ({activeLeases.length})
                </button>
              )}
              <button
                onClick={() => setCurrentView('security-deposit')}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 flex items-center justify-center"
              >
                <Shield size={20} className="mr-2" />
                Security Deposits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch 
          onSearch={(filters) => {
            setSearchFilters(filters);
            setShowAdvancedSearch(false);
          }}
          onClose={() => setShowAdvancedSearch(false)}
          initialFilters={searchFilters}
        />
      )}

      {/* Tour Request Modal */}
      {showTourModal && activeMessageProperty && (
        <TourRequestModal 
          property={activeMessageProperty}
          onRequestTour={requestTour}
          onClose={() => setShowTourModal(false)}
        />
      )}

      {/* Fallback View for Unhandled Cases */}
      {!['browse', 'university-search', 'roommates', 'roommate-discovery', 'group-creator', 'add-to-conversation', 'detail', 'post', 'landlord-listing', 'student-listing', 'messages', 'profile', 'application', 'agreement', 'confirmation', 'payments', 'move-in', 'landlord-inbox', 'utility-manager', 'owner-approvals', 'owner-dashboard', 'banking-bookkeeping', 'rent-collection', 'tax-center', 'parent-guardian', 'lease-contract', 'owner-approval', 'dispute-resolution', 'deposit-protection', 'document-manager', 'property-management', 'security-deposit', 'tenant-rights', 'property-inspection', 'edit-profile', 'my-listings', 'saved-properties', 'application-history', 'notifications', 'privacy-settings', 'help-center', 'contact-support', 'report-maintenance', 'view-lease', 'utilities-management', 'renters-insurance', 'bank-accounts', 'map', 'group-application', 'guarantor-verify', 'multi-party-lease', 'document-vault', 'landlord-waiting-room', 'landlord-app-chat', 'landlord-lease-router'].includes(currentView) && (
        <div className="p-4 pb-20 text-center">
          <div className="mt-20">
            <AlertTriangle size={64} className="mx-auto text-orange-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or is under development.</p>
            <button
              onClick={() => setCurrentView(user?.userType === 'owner' ? 'owner-dashboard' : 'browse')}
              className="bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {user?.userType === 'owner' ? (
            // Owner Navigation: Dashboard | Post | Payments | Inbox
            <>
              <button
                onClick={() => setCurrentView('owner-dashboard')}
                className={`flex flex-col items-center py-2 px-2 ${
                  currentView === 'owner-dashboard' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <BarChart3 size={20} />
                <span className="text-xs mt-1">Dashboard</span>
              </button>
              
              <button
                onClick={() => setCurrentView('post')}
                className={`flex flex-col items-center py-2 px-2 ${
                  currentView === 'post' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <Plus size={20} />
                <span className="text-xs mt-1">Post</span>
              </button>
              
              <button
                onClick={() => setCurrentView('payments')}
                className={`flex flex-col items-center py-2 px-2 ${
                  currentView === 'payments' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <DollarSign size={20} />
                <span className="text-xs mt-1">Payments</span>
              </button>
              
              <button
                onClick={() => setCurrentView('landlord-inbox')}
                className={`flex flex-col items-center py-2 px-2 ${
                  currentView === 'landlord-inbox' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <Building2 size={20} />
                <span className="text-xs mt-1">Inbox</span>
              </button>
            </>
          ) : (
            // Student Navigation: Browse | Roommates | Messages | Profile
            <>
              <button
                onClick={() => setCurrentView('browse')}
                className={`flex flex-col items-center py-2 px-3 ${
                  currentView === 'browse' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <Search size={24} />
                <span className="text-xs mt-1">Browse</span>
              </button>
              
              <button
                onClick={() => {
                  // If user hasn't completed questionnaire, go there first
                  if (!roommateQuestionnaireAnswers) {
                    setCurrentView('roommate-questionnaire');
                  } else {
                    setCurrentView('roommate-matching');
                  }
                }}
                className={`flex flex-col items-center py-2 px-3 ${
                  ['roommates', 'roommate-discovery', 'group-creator', 'add-to-conversation', 'roommate-questionnaire', 'roommate-matching'].includes(currentView) ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <Users size={24} />
                <span className="text-xs mt-1">Roommates</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveMessageProperty(null); // Reset to show conversations list
                  setCurrentView('messages');
                }}
                className={`flex flex-col items-center py-2 px-3 relative ${
                  currentView === 'messages' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <MessageCircle size={24} />
                {unreadMessageCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadMessageCount}</span>
                  </div>
                )}
                <span className="text-xs mt-1">Messages</span>
              </button>
              
              <button
                onClick={() => setCurrentView('profile')}
                className={`flex flex-col items-center py-2 px-3 ${
                  currentView === 'profile' ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <User size={24} />
                <span className="text-xs mt-1">Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



// Profile View Component
const ProfileView = ({ user, onBack, onSignOut, onNavigate, favorites = [] }) => {
  const handleEditProfile = () => {
    onNavigate('edit-profile');
  };

  const handleNotifications = () => {
    onNavigate('notifications');
  };

  const handlePrivacySettings = () => {
    onNavigate('privacy-settings');
  };

  const handleBankAccounts = () => {
    onNavigate('bank-accounts');
  };

  const handleMyListings = () => {
    onNavigate('my-listings');
  };

  const handleSavedProperties = () => {
    onNavigate('saved-properties');
  };

  const handleApplicationHistory = () => {
    onNavigate('application-history');
  };

  const handleHelpCenter = () => {
    onNavigate('help-center');
  };

  const handleContactSupport = () => {
    onNavigate('contact-support');
  };

  const handleReportMaintenance = () => {
    onNavigate('report-maintenance');
  };

  const handleViewLease = () => {
    onNavigate('view-lease');
  };

  const handleUtilitiesManagement = () => {
    onNavigate('utilities-management');
  };

  const handleRentersInsurance = () => {
    onNavigate('renters-insurance');
  };

  return (
    <div className="p-4 pb-20">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User size={48} className="text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold">{user?.name}</h2>
        <p className="text-gray-600">{user?.email}</p>
        <div className="flex items-center justify-center mt-2">
          <Shield size={16} className="text-brand-500 mr-1" />
          <span className="text-sm text-brand-500">
            {user?.userType === 'owner' ? 'Verified Owner' : 'Verified Student'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <div className="space-y-2">
            <button 
              onClick={handleEditProfile}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Edit Profile
            </button>
            <button 
              onClick={handleNotifications}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Notification Settings
            </button>
            <button 
              onClick={handlePrivacySettings}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Privacy Settings
            </button>
            <button 
              onClick={handleBankAccounts}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Bank Accounts
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">My Activity</h3>
          <div className="space-y-2">
            <button 
              onClick={handleMyListings}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              My Listings
            </button>
            <button 
              onClick={handleSavedProperties}
              className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center justify-between"
            >
              <span>Saved Properties</span>
              <span className="text-xs bg-brand-100 text-brand-500 px-2 py-1 rounded-full">
                {favorites.length}
              </span>
            </button>
            <button 
              onClick={handleApplicationHistory}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Application History
            </button>
          </div>
        </div>

        {user?.userType !== 'owner' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Student Features</h3>
            <div className="space-y-2">
              <button 
                onClick={handleViewLease}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <FileText size={16} className="mr-2 text-brand-500" />
                View Lease
              </button>
              {/* Renters Insurance - Only show for accepted renters */}
              <button 
                onClick={handleRentersInsurance}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <Shield size={16} className="mr-2 text-orange-600" />
                <div className="flex-1">
                  <span>Renters Insurance</span>
                  <span className="block text-xs text-orange-600">Required by lease</span>
                </div>
              </button>
              <button 
                onClick={handleUtilitiesManagement}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <DollarSign size={16} className="mr-2 text-green-600" />
                Manage Utilities
              </button>
              <button 
                onClick={() => onNavigate('parent-guardian')}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <User size={16} className="mr-2 text-purple-600" />
                Parent & Guardian Management
              </button>
              <button 
                onClick={() => onNavigate('dispute-resolution')}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <Scale size={16} className="mr-2 text-red-600" />
                Dispute Resolution Center
              </button>
              <button 
                onClick={() => onNavigate('deposit-protection')}
                className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
              >
                <Shield size={16} className="mr-2 text-green-600" />
                Security Deposit Protection
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Support & Legal</h3>
          <div className="space-y-2">
            {user?.userType !== 'owner' && (
              <>
                <button 
                  onClick={() => onNavigate('tenant-rights')}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
                >
                  <Scale size={16} className="mr-2 text-brand-500" />
                  Know Your Tenant Rights
                </button>
            <button 
              onClick={() => onNavigate('deposit-protection')}
              className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
            >
              <Shield size={16} className="mr-2 text-green-600" />
              Security Deposit Protection
            </button>
            <button 
              onClick={() => onNavigate('dispute-resolution')}
              className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
            >
              <Scale size={16} className="mr-2 text-red-600" />
              Dispute Resolution Center
            </button>
              </>
            )}
            {user?.userType === 'owner' && (
              <>
                <button 
                  onClick={() => onNavigate('document-manager')}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
                >
                  <FileText size={16} className="mr-2 text-brand-500" />
                  <div className="flex-1">
                    <span>Document Manager</span>
                    <span className="block text-xs text-gray-500">Upload leases & applications</span>
                  </div>
                </button>
                <button 
                  onClick={() => onNavigate('deposit-protection')}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
                >
                  <Shield size={16} className="mr-2 text-green-600" />
                  Manage Security Deposits
                </button>
                <button 
                  onClick={() => onNavigate('dispute-resolution')}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
                >
                  <Scale size={16} className="mr-2 text-red-600" />
                  Dispute Resolution Center
                </button>
              </>
            )}
            <button 
              onClick={handleHelpCenter}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Help Center
            </button>
            <button 
              onClick={handleContactSupport}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              Contact Support
            </button>
            <button 
              onClick={handleReportMaintenance}
              className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center"
            >
              <Building2 size={16} className="mr-2 text-orange-600" />
              Report Maintenance
            </button>
          </div>
        </div>

        <button 
          onClick={onSignOut}
          className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ApplicationFlow is now imported from ProfileComponents.jsx

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
        className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold"
      >
        Continue Browsing
      </button>
    </div>
  );
};

// Lease Agreement View Component
const LeaseAgreementView = ({ agreement, onSign, onBack }) => {
  const [tenantSigned, setTenantSigned] = useState(false);
  
  return (
    <div className="p-4 pb-20">
      <div className="bg-brand-500 text-white p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold">Rentra Legal</h2>
        <p className="text-brand-100 text-sm">AI-Generated Legal Document</p>
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

      <div className="bg-white border-2 border-brand-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Digital Signature Required</h3>
        
        <div className="border-2 rounded-lg p-4 bg-brand-50 border-brand-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{agreement.tenant.name}</p>
              <p className="text-sm text-gray-600">Sublessee (You)</p>
            </div>
            
            {!tenantSigned ? (
              <button
                onClick={() => setTenantSigned(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-medium"
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
            ? 'bg-brand-500 text-white hover:bg-brand-600'
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





export default RentraApp;
