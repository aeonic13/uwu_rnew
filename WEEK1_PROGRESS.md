# Week 1: Frontend API Integration Progress

**Goal**: Replace all mock data with real API calls  
**Started**: February 25, 2026

---

## ✅ Day 1: API Service Layer (COMPLETE)

### Created Services
- ✅ `src/services/api.js` - Base axios client with auth interceptors
- ✅ `src/services/auth.js` - Authentication endpoints
- ✅ `src/services/listings.js` - Property listings CRUD
- ✅ `src/services/applications.js` - Rental applications
- ✅ `src/services/messages.js` - Messaging system
- ✅ `src/services/payments.js` - Payment/transfer operations
- ✅ `src/services/uploads.js` - Image upload to Cloudinary
- ✅ `src/services/users.js` - User profile management
- ✅ `src/services/index.js` - Central exports

### Features
- Automatic JWT token injection
- Auto-redirect on 401 (expired token)
- 30-second timeout
- Error handling interceptors
- FormData support for uploads

---

## 🔄 Day 2-3: Authentication Integration (IN PROGRESS)

### Tasks

#### 1. Update Login Flow
**File**: `src/RentraApp.jsx`

Find and replace the mock login function with:

```javascript
const handleLogin = async (email, password) => {
  try {
    setLoading(true)
    setError(null)
    
    const response = await authService.login({ email, password })
    
    // Store token and user
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    setUser(response.user)
    setCurrentView('browse')
  } catch (error) {
    setError(error.response?.data?.error?.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}
```

#### 2. Update Registration Flow
**File**: `src/RentraApp.jsx`

Replace mock registration:

```javascript
const handleRegister = async (userData) => {
  try {
    setLoading(true)
    setError(null)
    
    const response = await authService.register(userData)
    
    // Store token and user
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    setUser(response.user)
    
    // Show email verification message
    alert('Registration successful! Please check your email to verify your account.')
    
    setCurrentView('browse')
  } catch (error) {
    setError(error.response?.data?.error?.message || 'Registration failed')
  } finally {
    setLoading(false)
  }
}
```

#### 3. Add Token Persistence on Load
**File**: `src/RentraApp.jsx`

Add useEffect to check for existing token:

```javascript
useEffect(() => {
  // Check for stored token on app load
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  
  if (token && storedUser) {
    try {
      setUser(JSON.parse(storedUser))
      setCurrentView('browse')
    } catch (error) {
      // Invalid stored data, clear it
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
}, [])
```

#### 4. Update Logout Function
```javascript
const handleLogout = () => {
  authService.logout()
  setUser(null)
  setCurrentView('login')
}
```

#### Checklist
- [ ] Import authService at top of RentraApp.jsx
- [ ] Replace handleLogin function
- [ ] Replace handleRegister function  
- [ ] Add token persistence useEffect
- [ ] Update logout function
- [ ] Add loading state to login/register buttons
- [ ] Test login/registration flow

---

## 📅 Day 4-5: Listings Integration

### Tasks

#### 1. Load Listings from API
**File**: `src/RentraApp.jsx`

Replace `sampleListings` with API call:

```javascript
const [listings, setListings] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

// Fetch listings on mount and when filters change
useEffect(() => {
  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        university: selectedUniversity !== 'All Universities' ? selectedUniversity : undefined,
        minPrice,
        maxPrice,
        propertyType: selectedPropertyType !== 'All Types' ? selectedPropertyType : undefined,
        bedrooms: selectedBedrooms,
        page: currentPage,
        limit: 20,
      }
      
      const response = await listingsService.getAll(filters)
      setListings(response.listings)
      setTotalPages(response.totalPages)
    } catch (error) {
      setError('Failed to load listings')
      console.error('Listings error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  fetchListings()
}, [selectedUniversity, minPrice, maxPrice, selectedPropertyType, selectedBedrooms, currentPage])
```

#### 2. Load Single Listing
**File**: Property detail view

```javascript
const [listing, setListing] = useState(null)

useEffect(() => {
  const fetchListing = async () => {
    try {
      const response = await listingsService.getById(listingId)
      setListing(response.listing)
    } catch (error) {
      setError('Failed to load property details')
    }
  }
  
  fetchListing()
}, [listingId])
```

#### 3. Toggle Favorite
```javascript
const handleToggleFavorite = async (listingId) => {
  try {
    await listingsService.toggleFavorite(listingId)
    // Refresh listings or update local state
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  } catch (error) {
    setError('Failed to update favorite')
  }
}
```

#### Checklist
- [ ] Import listingsService
- [ ] Replace sampleListings with API call
- [ ] Add loading spinner while fetching
- [ ] Show error message if fetch fails
- [ ] Connect filters to API parameters
- [ ] Implement favorite toggle
- [ ] Test browsing and filtering

---

## 📅 Day 6: Applications Integration

### Tasks

#### 1. Submit Application
**File**: Application form component

```javascript
const handleSubmitApplication = async (applicationData) => {
  try {
    setLoading(true)
    
    const response = await applicationsService.submit({
      listingId: selectedListing.id,
      startDate: applicationData.moveInDate,
      endDate: applicationData.moveOutDate,
      message: applicationData.message,
      emergencyContact: applicationData.emergencyContact,
    })
    
    // Show success message
    alert('Application submitted successfully!')
    setCurrentView('confirmation')
  } catch (error) {
    setError(error.response?.data?.error?.message || 'Failed to submit application')
  } finally {
    setLoading(false)
  }
}
```

#### 2. Load User Applications (Students)
```javascript
useEffect(() => {
  const fetchApplications = async () => {
    try {
      const response = await applicationsService.getUserApplications()
      setApplications(response.applications)
    } catch (error) {
      console.error('Failed to load applications:', error)
    }
  }
  
  if (user?.userType === 'student') {
    fetchApplications()
  }
}, [user])
```

#### 3. Owner Approval (Landlords)
```javascript
const handleApproveApplication = async (applicationId) => {
  try {
    await applicationsService.updateStatus(applicationId, 'approved')
    // Refresh applications list
    fetchOwnerApplications()
  } catch (error) {
    setError('Failed to approve application')
  }
}
```

#### Checklist
- [ ] Connect application submission form
- [ ] Load user's applications
- [ ] Load owner's received applications
- [ ] Implement approve/reject actions
- [ ] Show application status
- [ ] Test full application flow

---

## 📅 Day 7: Messages Integration

### Tasks

#### 1. Load Conversations
```javascript
useEffect(() => {
  const fetchConversations = async () => {
    try {
      const response = await messagesService.getConversations()
      setConversations(response.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }
  
  fetchConversations()
  
  // Poll for new messages every 10 seconds
  const interval = setInterval(fetchConversations, 10000)
  return () => clearInterval(interval)
}, [])
```

#### 2. Send Message
```javascript
const handleSendMessage = async (messageContent) => {
  try {
    await messagesService.send({
      recipientId: selectedConversation.otherUser.id,
      conversationId: selectedConversation.id,
      content: messageContent,
      listingId: selectedListing?.id,
    })
    
    // Refresh messages
    fetchMessages()
  } catch (error) {
    setError('Failed to send message')
  }
}
```

#### Checklist
- [ ] Load conversations list
- [ ] Load messages in conversation
- [ ] Implement send message
- [ ] Add message polling (or WebSocket later)
- [ ] Mark messages as read
- [ ] Test messaging flow

---

## 📋 Additional Tasks

### Error Handling
- [ ] Create error notification component
- [ ] Add toast/snackbar for errors
- [ ] Handle network errors gracefully
- [ ] Show user-friendly error messages

### Loading States
- [ ] Add spinner for page loads
- [ ] Show skeleton screens for lists
- [ ] Disable buttons while loading
- [ ] Add progress indicators

### Image Uploads
- [ ] Connect property image upload form
- [ ] Use uploadsService.uploadPropertyImages()
- [ ] Show upload progress
- [ ] Handle upload errors

---

## Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login with credentials
- [ ] Token persists on refresh
- [ ] Logout clears token
- [ ] Invalid credentials show error

### Listings
- [ ] Browse all properties
- [ ] Filter by university
- [ ] Filter by price range
- [ ] View property details
- [ ] Toggle favorites

### Applications
- [ ] Submit application
- [ ] View submitted applications
- [ ] Owner sees applications
- [ ] Owner can approve/reject
- [ ] Status updates correctly

### Messages
- [ ] Send message
- [ ] Receive messages
- [ ] Conversations list updates
- [ ] Read status works

---

## Quick Reference

### Import Services
```javascript
import { 
  authService, 
  listingsService, 
  applicationsService, 
  messagesService 
} from './services'
```

### Error Handling Pattern
```javascript
try {
  setLoading(true)
  const response = await service.method(data)
  // Handle success
} catch (error) {
  setError(error.response?.data?.error?.message || 'Operation failed')
} finally {
  setLoading(false)
}
```

### Token Check
```javascript
const token = localStorage.getItem('token')
if (!token) {
  // Redirect to login
}
```

---

## Next Week Preview

**Week 2: Deployment**
- Deploy backend to Railway
- Deploy frontend to Vercel
- Configure environment variables
- Test production deployment

---

**Current Status**: Day 1 Complete ✅  
**Next**: Update authentication in RentraApp.jsx  
**Blocked By**: None - ready to continue!
