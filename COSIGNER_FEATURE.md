# Cosigner Feature Implementation

## ✅ What Was Added

The cosigner functionality allows tenants to invite cosigners (parents, guardians, relatives, etc.) to their rental applications, automatically connecting them to the tenant's account.

---

## 🗄️ Database Changes

### New Enum Types
- **`UserType.cosigner`** - New user type for cosigners
- **`CosignerStatus`** - Track invitation status (pending, accepted, declined)

### New Cosigner Model
Tracks cosigner relationships with:
- Invitation details (email, token, expiration)
- Relationship type (parent, guardian, relative, friend)
- Status tracking (pending → accepted/declined)
- Automatic linking to tenant and application

### Schema Relationships
- **User → Cosigner** (one-to-many)
  - Users can be cosigners for multiple tenants
  - Users can have multiple cosigners
- **Application → Cosigner** (one-to-many)
  - Applications can have one active cosigner
- **Cosigner → User** (optional, after acceptance)

---

## 🔌 API Endpoints

### For Tenants

#### POST `/api/cosigners/invite`
Invite a cosigner for an application
```json
{
  "applicationId": "app-id",
  "cosignerEmail": "parent@example.com",
  "cosignerName": "John Parent",
  "relationshipType": "parent"
}
```

#### GET `/api/cosigners/application/:applicationId`
Get all cosigners for an application

#### DELETE `/api/cosigners/:cosignerId`
Cancel a pending cosigner invitation

---

### For Cosigners

#### GET `/api/cosigners/invitation/:token` (Public)
View invitation details without authentication
```json
{
  "invitation": {
    "tenant": { "firstName": "...", "lastName": "..." },
    "listing": { "title": "...", "price": 1500 },
    "relationshipType": "parent",
    "leaseStart": "2026-03-01",
    "leaseEnd": "2027-03-01"
  }
}
```

#### POST `/api/cosigners/accept/:token` (Public)
Accept invitation and create/link cosigner account
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Parent",
  "phone": "+1234567890"
}
```
**OR** link existing account:
```json
{
  "existingUserId": "user-id"
}
```

#### POST `/api/cosigners/decline/:token` (Public)
Decline a cosigner invitation
```json
{
  "reason": "Unable to commit at this time"
}
```

#### GET `/api/cosigners/my-responsibilities` (Authenticated)
Get all applications the cosigner is responsible for

---

## 📧 Email Notifications

### Cosigner Invitation Email
Sent automatically when tenant invites a cosigner:
- Property details (title, location, monthly rent)
- Explanation of cosigner responsibilities
- Secure invitation link with 7-day expiration
- Review and accept/decline options

### Email Template Includes:
- Property information
- Tenant name
- Financial responsibility explanation
- Next steps (review, create account, sign agreement)
- Expiration warning (7 days)

---

## 🔒 Security Features

1. **Token-Based Invitations**
   - Secure 48-character random tokens
   - 7-day expiration
   - One-time use (cannot accept twice)

2. **Email Verification**
   - Must match invitation email
   - Cannot be changed after invitation

3. **Auto-Verification**
   - Cosigners are automatically verified (trusted via invitation)

4. **Access Control**
   - Tenants can only invite for their own applications
   - Only applicant or owner can view cosigners
   - Cosigners only see their responsibilities

---

## 🔄 User Flows

### Flow 1: New Cosigner (No Account)
1. Tenant submits application
2. Tenant invites cosigner via email
3. Cosigner receives invitation email
4. Cosigner clicks link → views invitation details
5. Cosigner creates new account (auto-verified)
6. Cosigner is immediately linked to tenant
7. Cosigner can view tenant's application and lease

### Flow 2: Existing Cosigner (Has Account)
1. Tenant invites cosigner
2. Cosigner receives invitation
3. Cosigner logs into existing account
4. Cosigner accepts invitation
5. Existing account is linked to new tenant
6. Cosigner can now see both responsibilities

### Flow 3: Cosigner Declines
1. Cosigner receives invitation
2. Cosigner clicks decline
3. Tenant is notified (future feature)
4. Tenant can invite a different cosigner

---

## 🎯 Use Cases

### For Students
- **Parent as Cosigner**: Student invites parent to cosign lease
- **Guardian Support**: Students with guardians get support
- **Income Requirements**: Meet landlord income requirements with cosigner

### For Property Owners
- **Risk Mitigation**: Additional financial security
- **Verification**: See cosigner information in applications
- **Legal Protection**: Cosigner agreement ensures payment

### For Cosigners
- **View Responsibilities**: See all properties they're cosigning
- **Monitor Payments**: Track tenant's payment status
- **Direct Communication**: Contact property owners if needed

---

## 📋 Database Migration

Applied migration: `20260225003506_add_cosigner_support`

### Migration Includes:
- Added `cosigner` user type
- Created `CosignerStatus` enum
- Created `Cosigner` table with all fields and indexes
- Added foreign key relationships
- Updated User model with cosigner relations

---

## 🚀 Frontend Integration (Next Steps)

### Student Application Flow
1. Add "Add Cosigner" button during application
2. Create cosigner invitation modal/form
3. Display cosigner status on application page
4. Show linked cosigner information

### Cosigner Invitation Flow
1. Create public invitation page `/cosigner/accept/:token`
2. Show property details and responsibilities
3. Registration form or login option
4. Success page with dashboard access

### Cosigner Dashboard
1. Create "My Responsibilities" page
2. Show all properties cosigning for
3. Display tenant information
4. Show payment status and lease details

---

## 🧪 Testing

### Test Scenarios

**Tenant Tests:**
- ✅ Invite cosigner for application
- ✅ View cosigner status
- ✅ Cancel pending invitation
- ✅ Cannot invite multiple cosigners for same application

**Cosigner Tests:**
- ✅ View invitation details (public)
- ✅ Create new account and accept
- ✅ Link existing account
- ✅ Decline invitation
- ✅ Cannot accept expired invitation
- ✅ Cannot accept already-accepted invitation

**Integration Tests:**
- ✅ Email delivery
- ✅ Token expiration
- ✅ Access control
- ✅ Relationship creation

---

## 🔧 Configuration

### Environment Variables
Already configured:
- `SENDGRID_API_KEY` - For sending invitation emails
- `CLIENT_URL` - For generating invitation links

### Email Template
Located in: `server/utils/email.js`
Function: `sendCosignerInvitation()`

---

## 📝 Future Enhancements

1. **Multiple Cosigners**
   - Allow more than one cosigner per application
   - Primary and secondary cosigner roles

2. **Cosigner Documents**
   - Upload income verification
   - Credit check integration
   - ID verification

3. **Notifications**
   - Notify tenant when cosigner accepts/declines
   - Remind cosigner of pending invitations
   - Alert cosigner of late payments

4. **Payment Responsibility**
   - Allow cosigners to make payments directly
   - Payment split between tenant and cosigner
   - Automatic billing to cosigner if tenant misses payment

5. **Legal Agreements**
   - Separate cosigner agreement document
   - Digital signature for cosigners
   - State-specific legal templates

---

## 📚 Code References

### Key Files
- **Schema**: `server/prisma/schema.prisma` (lines 16-18, 85-86, 159, 284-312)
- **Routes**: `server/routes/cosigners.js` (650 lines)
- **Email**: `server/utils/email.js` (sendCosignerInvitation function)
- **Server**: `server/index.js` (added cosigner routes)

### Database Tables
- `User` - Extended with cosigner relations
- `Cosigner` - New table for cosigner relationships
- `Application` - Extended with cosigners relation

---

## ✨ Summary

The cosigner feature is **fully implemented on the backend** with:
- ✅ Complete database schema
- ✅ All API endpoints functional
- ✅ Email notifications configured
- ✅ Security measures in place
- ✅ Migration applied to database

**Ready for frontend integration!**

Next step: Build the UI components for inviting, accepting, and managing cosigners.
