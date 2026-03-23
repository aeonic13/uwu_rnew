# Rentra Backend Setup Guide

## 🎉 What's Already Configured

✅ **Supabase Database** - Cloud PostgreSQL database connected  
✅ **Moov Payments** - ACH payment processing ready  
✅ **Plaid Integration** - Bank account linking configured  
✅ **Email Service** - SendGrid integration built  
✅ **File Uploads** - Cloudinary integration built  

## 🔑 API Keys Needed

### 1. SendGrid (Email Service)
**Sign up:** https://sendgrid.com/signup  
**Free tier:** 100 emails/day

1. Create account and verify email
2. Go to **Settings** → **API Keys** → **Create API Key**
3. Copy the API key
4. Add to `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxx
   ```

### 2. Cloudinary (File Storage)
**Sign up:** https://cloudinary.com/users/register_free  
**Free tier:** 25GB storage, 25GB bandwidth/month

1. Create account
2. Go to **Dashboard**
3. Copy: **Cloud Name**, **API Key**, **API Secret**
4. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
   ```

## 🚀 Starting the Server

```bash
cd server
npm run dev
```

Server runs on: **http://localhost:5001**

## 📧 Email Features

- **Verification emails** - Sent on registration
- **Password reset** - Secure token-based reset
- **Application notifications** - Notify owners of new applications
- **Status updates** - Notify applicants of approval/rejection
- **Message notifications** - Alert users of new messages

### Email Functions Available

```javascript
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApplicationNotification,
  sendApplicationStatusEmail,
  sendMessageNotification
} from './utils/email.js'
```

## 📸 File Upload Features

- **Property images** - Up to 10 images per listing
- **User avatars** - Profile pictures
- **Auto-optimization** - Images resized and compressed
- **CDN delivery** - Fast global delivery via Cloudinary

### Upload Endpoints

```
POST   /api/uploads/images   - Upload property images (requires listingId)
POST   /api/uploads/avatar   - Upload user avatar
DELETE /api/uploads/images   - Delete an image (requires imageUrl)
```

### Example Usage

```javascript
// Upload property images
const formData = new FormData()
formData.append('listingId', 'listing-123')
formData.append('images', file1)
formData.append('images', file2)

fetch('/api/uploads/images', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

## 💳 Payment Features (Moov)

### Endpoints

```
POST   /api/payments/moov/create-account      - Create Moov account for user
POST   /api/payments/moov/link-bank           - Link bank account via Plaid
POST   /api/payments/moov/transfer            - Initiate ACH payment
GET    /api/payments/moov/transfer/:id        - Get transfer status
GET    /api/payments/moov/account             - Get account details
GET    /api/payments/moov/payment-methods     - List payment methods
```

## 🗄️ Database

**Supabase PostgreSQL** - Already connected and migrated

View your database: https://supabase.com/dashboard

All tables created:
- Users
- Listings
- Applications
- Messages & Conversations
- Transactions
- Reviews
- Favorites
- Agreements

## 🧪 Testing

Without API keys, the services will run in "mock mode":
- **Email:** Logs to console instead of sending
- **Cloudinary:** Will error until configured
- **Moov:** Already configured with your credentials

## 📝 Environment Variables

All in `server/.env`:

```bash
# Database
DATABASE_URL=postgresql://...  # ✅ Already configured

# Moov Payments
MOOV_ACCOUNT_ID=...            # ✅ Already configured
MOOV_PUBLIC_KEY=...            # ✅ Already configured
MOOV_SECRET_KEY=...            # ✅ Already configured

# Plaid Banking
PLAID_CLIENT_ID=...            # ✅ Already configured
PLAID_SECRET=...               # ✅ Already configured

# SendGrid
SENDGRID_API_KEY=...           # ⚠️ Need to add
EMAIL_FROM=noreply@rentra.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=...      # ⚠️ Need to add
CLOUDINARY_API_KEY=...         # ⚠️ Need to add
CLOUDINARY_API_SECRET=...      # ⚠️ Need to add
```

## 🎯 Next Steps

1. **Get SendGrid API key** (5 mins)
2. **Get Cloudinary credentials** (5 mins)
3. **Add to `.env` file**
4. **Restart server**: `npm run dev`
5. **Test the features!**

## 🆘 Need Help?

- **SendGrid docs:** https://docs.sendgrid.com/
- **Cloudinary docs:** https://cloudinary.com/documentation
- **Moov docs:** https://docs.moov.io/
- **Supabase docs:** https://supabase.com/docs
