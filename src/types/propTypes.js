import PropTypes from 'prop-types'

/**
 * Shared PropTypes shapes for consistent type checking across components
 */

// User shape
export const UserShape = PropTypes.shape({
  id: PropTypes.string,
  email: PropTypes.string,
  name: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  userType: PropTypes.oneOf(['student', 'owner']),
  university: PropTypes.string,
  major: PropTypes.string,
  phone: PropTypes.string,
  bio: PropTypes.string,
  avatarUrl: PropTypes.string,
  verified: PropTypes.bool,
})

// Owner/Landlord shape
export const OwnerShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  rating: PropTypes.number,
  verified: PropTypes.bool,
  bio: PropTypes.string,
  responseTime: PropTypes.string,
  reviewCount: PropTypes.number,
})

// Listing shape
export const ListingShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  price: PropTypes.number.isRequired,
  location: PropTypes.string.isRequired,
  university: PropTypes.string,
  dates: PropTypes.string,
  moveInDate: PropTypes.string,
  propertyType: PropTypes.oneOf([
    'Apartment',
    'House',
    'Studio',
    'Single Room',
    'Condo',
  ]),
  bedrooms: PropTypes.number,
  bathrooms: PropTypes.number,
  images: PropTypes.arrayOf(PropTypes.string),
  amenities: PropTypes.arrayOf(PropTypes.string),
  owner: OwnerShape,
})

// Message shape
export const MessageShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  text: PropTypes.string,
  content: PropTypes.string,
  sender: PropTypes.string.isRequired,
  timestamp: PropTypes.string,
  read: PropTypes.bool,
  type: PropTypes.string,
})

// Conversation shape
export const ConversationShape = PropTypes.shape({
  propertyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  property: ListingShape,
  messages: PropTypes.arrayOf(MessageShape),
  lastMessage: MessageShape,
  unreadCount: PropTypes.number,
  tourScheduled: PropTypes.bool,
})

// Application shape
export const ApplicationShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  listing: ListingShape,
  status: PropTypes.oneOf(['pending', 'approved', 'rejected', 'cancelled']),
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  message: PropTypes.string,
  emergencyContact: PropTypes.string,
  createdAt: PropTypes.string,
})

// Transaction shape
export const TransactionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  amount: PropTypes.number.isRequired,
  serviceFee: PropTypes.number,
  total: PropTypes.number.isRequired,
  status: PropTypes.oneOf([
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
  ]),
  date: PropTypes.string,
  landlord: PropTypes.string,
  paymentMethod: PropTypes.string,
})

// Agreement shape
export const AgreementShape = PropTypes.shape({
  id: PropTypes.string,
  property: PropTypes.shape({
    address: PropTypes.string,
    description: PropTypes.string,
  }),
  tenant: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }),
  landlord: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }),
  terms: PropTypes.shape({
    monthlyRent: PropTypes.number,
    securityDeposit: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    utilities: PropTypes.string,
    petPolicy: PropTypes.string,
  }),
  status: PropTypes.string,
})

// Lease shape
export const LeaseShape = PropTypes.shape({
  id: PropTypes.string,
  property: PropTypes.shape({
    address: PropTypes.string,
  }),
  monthlyRent: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  landlord: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
  }),
})

// Filter shape
export const FiltersShape = PropTypes.shape({
  searchTerm: PropTypes.string,
  university: PropTypes.string,
  minRent: PropTypes.number,
  maxRent: PropTypes.number,
  propertyType: PropTypes.string,
  bedrooms: PropTypes.number,
  bathrooms: PropTypes.number,
  amenities: PropTypes.arrayOf(PropTypes.string),
  moveInDate: PropTypes.string,
})

// Bank account shape
export const BankAccountShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bankName: PropTypes.string,
  accountType: PropTypes.string,
  lastFour: PropTypes.string,
  verified: PropTypes.bool,
})

// Roommate shape
export const RoommateShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  university: PropTypes.string,
  major: PropTypes.string,
  bio: PropTypes.string,
  photos: PropTypes.arrayOf(PropTypes.string),
  budget: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  compatibilityScore: PropTypes.number,
  verificationStatus: PropTypes.string,
})

// Navigation callback shapes
export const NavigationCallbacks = {
  onBack: PropTypes.func,
  onNavigate: PropTypes.func,
}

// Common component props
export const CommonProps = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
}

export default {
  UserShape,
  OwnerShape,
  ListingShape,
  MessageShape,
  ConversationShape,
  ApplicationShape,
  TransactionShape,
  AgreementShape,
  LeaseShape,
  FiltersShape,
  BankAccountShape,
  RoommateShape,
  NavigationCallbacks,
  CommonProps,
}
