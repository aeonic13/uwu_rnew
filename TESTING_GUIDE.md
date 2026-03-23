# 🧪 Rentra MVP Testing Guide

**Last Updated**: February 27, 2026  
**Integration Status**: 95% Complete - Ready for Testing!

---

## 🚀 Quick Start

### 1. Start Both Servers

**Option A: Start Both Simultaneously** (Recommended)
```bash
npm run dev:all
```

**Option B: Start Separately**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### Expected Output:
- **Backend**: Running on `http://localhost:5001`
- **Frontend**: Running on `http://localhost:3000`
- Database: Connected to Supabase PostgreSQL

---

## 📋 Test Checklist

### ✅ Phase 1: Authentication Flow

#### Test 1.1: User Registration (Student)
- [ ] Navigate to registration page
- [ ] Fill out form with `.edu` email address
- [ ] Submit registration
- [ ] Verify email sent (check SendGrid logs or email)
- [ ] Check JWT token stored in localStorage (`authToken`)
- [ ] Verify user redirected to dashboard/browse

**Test Data:**
- Email: `test.student@stanford.edu`
- Password: `Test123!@#`
- Name: `Test Student`
- User Type: `Student`

#### Test 1.2: User Registration (Owner/Landlord)
- [ ] Register with owner account
- [ ] Verify different dashboard/features appear

**Test Data:**
- Email: `landlord@university.edu`
- Password: `Owner123!@#`
- Name: `Test Landlord`
- User Type: `Owner`

#### Test 1.3: Login Flow
- [ ] Logout from current session
- [ ] Login with registered credentials
- [ ] Verify JWT token refreshed
- [ ] Verify user data loaded correctly
- [ ] Check auto-login on page refresh

#### Test 1.4: Session Persistence
- [ ] Login successfully
- [ ] Refresh the page
- [ ] Verify still logged in
- [ ] Close browser and reopen
- [ ] Verify session restored (if localStorage persists)

---

### ✅ Phase 2: Listings Management

#### Test 2.1: Browse Listings (Student View)
- [ ] Navigate to browse/listings page
- [ ] Verify listings load from API
- [ ] Check loading spinner appears while fetching
- [ ] Verify listing cards display correctly

**What to Check:**
- Property images
- Price, bedrooms, bathrooms
- University/location
- Amenities
- Landlord name

#### Test 2.2: Search & Filter
- [ ] Use university filter
- [ ] Filter by price range
- [ ] Filter by number of bedrooms
- [ ] Filter by amenities (e.g., "parking", "wifi")
- [ ] Test combined filters
- [ ] Verify filtered results update correctly

#### Test 2.3: View Listing Details
- [ ] Click on a listing
- [ ] Verify detail page loads
- [ ] Check all property information displays
- [ ] View image gallery
- [ ] Check owner information
- [ ] Verify "Apply" or "Contact Owner" button present

#### Test 2.4: Create Listing (Owner)
- [ ] Login as owner
- [ ] Navigate to create listing
- [ ] Fill out listing form:
  - Address
  - Price, bedrooms, bathrooms
  - Description
  - Amenities
  - Available from/to dates
- [ ] Upload property images (test Cloudinary integration)
- [ ] Submit listing
- [ ] Verify listing appears in owner's listings
- [ ] Verify listing appears in browse for students

#### Test 2.5: Edit Listing (Owner)
- [ ] View own listing as owner
- [ ] Click edit
- [ ] Modify price or description
- [ ] Save changes
- [ ] Verify updates appear immediately

#### Test 2.6: Delete Listing (Owner)
- [ ] Select a test listing
- [ ] Delete listing
- [ ] Verify listing removed from list
- [ ] Verify listing no longer appears for students

---

### ✅ Phase 3: Applications Workflow

#### Test 3.1: Submit Application (Student)
- [ ] Login as student
- [ ] View a listing
- [ ] Click "Apply"
- [ ] Fill out application form:
  - Move-in date
  - Lease length
  - Income verification
  - Employment details
  - References
  - Emergency contact
- [ ] Submit application
- [ ] Verify success message
- [ ] Check application appears in "My Applications"

#### Test 3.2: View Applications (Student)
- [ ] Navigate to "My Applications"
- [ ] Verify all submitted applications listed
- [ ] Check application status (pending, approved, rejected)
- [ ] Click on application to view details
- [ ] Verify all submitted information displays

#### Test 3.3: View Applications (Owner)
- [ ] Login as owner
- [ ] Navigate to "Applications" or "Inbox"
- [ ] Verify applications for your listings appear
- [ ] Check applicant information
- [ ] Review application details

#### Test 3.4: Update Application Status (Owner)
- [ ] View an application
- [ ] Change status to "Approved"
- [ ] Verify status updates
- [ ] Check if student sees updated status
- [ ] Test other statuses: "Rejected", "Under Review"

#### Test 3.5: Withdraw Application (Student)
- [ ] Login as student
- [ ] View one of your applications
- [ ] Withdraw application
- [ ] Verify status changes to "Withdrawn"
- [ ] Check owner sees updated status

---

### ✅ Phase 4: Messaging System

#### Test 4.1: Start Conversation (Student → Owner)
- [ ] Login as student
- [ ] View a listing
- [ ] Click "Contact Owner" or "Message"
- [ ] Type initial message
- [ ] Send message
- [ ] Verify conversation created
- [ ] Check message appears in conversation

#### Test 4.2: View Conversations
- [ ] Navigate to Messages/Inbox
- [ ] Verify conversation list loads
- [ ] Check unread count badge
- [ ] Click on conversation
- [ ] Verify messages load

#### Test 4.3: Send Messages
- [ ] Open a conversation
- [ ] Type and send multiple messages
- [ ] Verify messages appear in order
- [ ] Check timestamp displays
- [ ] Verify sender identification

#### Test 4.4: Mark as Read
- [ ] Open conversation with unread messages
- [ ] Verify unread count decreases
- [ ] Check conversation marked as read
- [ ] Verify read status persists on refresh

#### Test 4.5: Tour Request (Optional Feature)
- [ ] In a conversation about a listing
- [ ] Send tour request with proposed times
- [ ] Verify tour request message type appears
- [ ] (If owner) Accept or decline tour request

#### Test 4.6: Real-Time Updates (Manual)
- [ ] Open same conversation in two browsers (student & owner)
- [ ] Send message from one side
- [ ] Refresh other side or implement polling
- [ ] Verify message appears

---

### ✅ Phase 5: Image Uploads

#### Test 5.1: Property Images
- [ ] Create or edit a listing
- [ ] Upload single image
- [ ] Verify upload progress/loading
- [ ] Verify image appears in form
- [ ] Upload multiple images (up to 10)
- [ ] Verify all images upload to Cloudinary
- [ ] Check images display in listing view

#### Test 5.2: Avatar Upload
- [ ] Go to profile settings
- [ ] Upload profile picture
- [ ] Verify upload succeeds
- [ ] Check avatar displays in profile
- [ ] Verify avatar appears in messages/applications

#### Test 5.3: Image Validation
- [ ] Try uploading file > 5MB
- [ ] Verify error message
- [ ] Try uploading non-image file (PDF, TXT)
- [ ] Verify format validation
- [ ] Try uploading valid formats (JPEG, PNG, WebP)

---

### ✅ Phase 6: Error Handling & Edge Cases

#### Test 6.1: Network Errors
- [ ] Stop backend server
- [ ] Try to load listings
- [ ] Verify error message displays
- [ ] Check no app crash
- [ ] Restart server, verify recovery

#### Test 6.2: Invalid Input
- [ ] Submit application with missing required fields
- [ ] Verify validation messages
- [ ] Try registering with invalid email format
- [ ] Try registering with weak password

#### Test 6.3: Unauthorized Access
- [ ] Logout
- [ ] Try accessing protected route (e.g., /applications)
- [ ] Verify redirect to login
- [ ] Try accessing owner-only features as student
- [ ] Verify appropriate error or redirect

#### Test 6.4: Token Expiration
- [ ] Login successfully
- [ ] Wait for token expiration (or manually expire in localStorage)
- [ ] Try making API request
- [ ] Verify auto-redirect to login
- [ ] Login again and verify normal operation

---

### ✅ Phase 7: Loading States

#### Test 7.1: Verify Loading Indicators
- [ ] Check listings page shows loading spinner
- [ ] Application submission shows loading
- [ ] Messages show loading while fetching
- [ ] Login button shows loading state
- [ ] Image uploads show progress

#### Test 7.2: Verify Loading Completes
- [ ] All loading states disappear after data loads
- [ ] No infinite loading states
- [ ] Loading doesn't block UI unnecessarily

---

### ✅ Phase 8: User Experience

#### Test 8.1: Navigation
- [ ] Test all navigation links
- [ ] Verify back button works
- [ ] Check breadcrumbs (if applicable)
- [ ] Verify mobile-responsive navigation

#### Test 8.2: Forms
- [ ] All forms validate input
- [ ] Success messages appear after submission
- [ ] Forms clear or redirect appropriately
- [ ] Required fields marked clearly

#### Test 8.3: Mobile Responsiveness
- [ ] Resize browser to mobile width
- [ ] Verify layout adapts
- [ ] Check touch targets are large enough
- [ ] Test on actual mobile device if possible

---

## 🐛 Bug Tracking Template

When you find a bug, document it:

```markdown
### Bug: [Short Description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:

**Actual Behavior**:

**Console Errors** (if any):

**Screenshots**:
```

---

## ✅ Success Criteria

### MVP is ready for deployment if:
- [ ] ✅ Users can register and login
- [ ] ✅ Students can browse and search listings
- [ ] ✅ Students can submit applications
- [ ] ✅ Owners can create and manage listings
- [ ] ✅ Owners can view and manage applications
- [ ] ✅ Messaging works between users
- [ ] ✅ Images upload successfully
- [ ] ✅ No critical bugs or crashes
- [ ] ✅ Loading states work properly
- [ ] ✅ Error handling is user-friendly

### Nice to Have (Not Blockers):
- [ ] Payment processing UI (backend ready)
- [ ] Real-time message updates (polling/WebSocket)
- [ ] Advanced dashboard analytics
- [ ] Email notifications working
- [ ] Mobile app-like PWA features

---

## 🔍 Debugging Tips

### Check Console Logs
```javascript
// Frontend console (browser)
- Check for JavaScript errors
- Look for failed API requests (red in Network tab)
- Verify localStorage has 'authToken'

// Backend console (terminal)
- Check for server errors
- Verify database connections
- Check API request logs
```

### Common Issues

**Issue: "Network Error" in frontend**
- Check backend is running on port 5001
- Verify API base URL in `src/services/api.js`
- Check CORS settings in backend

**Issue: "Unauthorized" errors**
- Check JWT token in localStorage
- Verify token not expired
- Check authentication middleware in backend

**Issue: Images not uploading**
- Verify Cloudinary credentials in `.env`
- Check file size < 5MB
- Check file format (JPEG, PNG, WebP)

**Issue: Database errors**
- Verify Supabase connection string
- Check database migrations applied
- Verify Prisma schema matches database

**Issue: Contexts not working**
- Check provider hierarchy in `src/contexts/index.jsx`
- Verify context import path
- Check component wrapped in provider

---

## 📊 Testing Progress Tracker

Use this to track your testing progress:

| Feature Area | Status | Blocker Issues | Notes |
|--------------|--------|---------------|-------|
| Authentication | ⏳ | | |
| Listings | ⏳ | | |
| Applications | ⏳ | | |
| Messaging | ⏳ | | |
| Image Uploads | ⏳ | | |
| Error Handling | ⏳ | | |
| Loading States | ⏳ | | |

**Status Key**: ⏳ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## 🎯 Next Steps After Testing

1. **Fix Critical Bugs**: Address any show-stoppers first
2. **Polish UI/UX**: Improve any rough edges found
3. **Add Missing Loading States**: If any were missed
4. **Improve Error Messages**: Make them more user-friendly
5. **Performance Testing**: Test with more data
6. **Deploy to Staging**: Test on Railway/Vercel
7. **Final Production Deploy**: Launch! 🚀

---

## 📞 Need Help?

If you encounter issues during testing:
1. Check the console for error messages
2. Review the INTEGRATION_STATUS.md for context
3. Check backend logs for API errors
4. Verify environment variables are set correctly
5. Restart both servers with `npm run dev:all`

---

**Happy Testing! You're almost ready to launch! 🎉**
