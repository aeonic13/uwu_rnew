# 🚀 Deployment Roadmap - Getting Rentra on the Web

**Current Status**: Backend 95% complete, Frontend needs API integration  
**Goal**: Live web application accessible to users  
**Timeline**: 2-3 weeks to production

---

## Phase 1: Frontend API Integration (Week 1)

### Priority: Critical - Must Complete First

Your backend is production-ready, but the frontend still uses mock data. This MUST be done before deployment.

#### Day 1-2: Setup API Service Layer

**Create API client** (`src/services/api.js`):

```javascript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

**Create API service modules** (`src/services/`):

```javascript
// src/services/auth.js
import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
}

// src/services/listings.js
export const listingsService = {
  getAll: (filters) => api.get('/listings', { params: filters }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  toggleFavorite: (id) => api.post(`/listings/${id}/favorite`),
}

// src/services/applications.js
export const applicationsService = {
  submit: (data) => api.post('/applications', data),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
}

// src/services/messages.js
export const messagesService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/conversation/${userId}`),
  send: (data) => api.post('/messages', data),
  markRead: (conversationId) => api.put('/messages/mark-read', { conversationId }),
}
```

#### Day 3-4: Integrate Authentication

**Update login/registration flows** in `RentraApp.jsx`:

```javascript
// Replace mock login
const handleLogin = async (email, password) => {
  try {
    setLoading(true)
    const response = await authService.login({ email, password })
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
    setCurrentView('browse')
  } catch (error) {
    setError(error.response?.data?.error?.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

// Replace mock registration
const handleRegister = async (userData) => {
  try {
    setLoading(true)
    const response = await authService.register(userData)
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
    // Show email verification prompt
    setShowVerificationModal(true)
  } catch (error) {
    setError(error.response?.data?.error?.message || 'Registration failed')
  } finally {
    setLoading(false)
  }
}
```

#### Day 5: Connect Listings

**Replace mock data with API calls**:

```javascript
// Load listings from API
useEffect(() => {
  const fetchListings = async () => {
    try {
      const response = await listingsService.getAll({
        university,
        minPrice,
        maxPrice,
        propertyType,
        page: currentPage,
      })
      setListings(response.data.listings)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to load listings:', error)
    }
  }
  fetchListings()
}, [university, minPrice, maxPrice, propertyType, currentPage])
```

#### Day 6-7: Integrate Applications & Messages

- Connect application submission to API
- Load real messages from backend
- Implement image uploads with Cloudinary
- Add loading states and error handling

### Checklist: Frontend Integration

- [ ] Create API service layer
- [ ] Replace mock authentication with real API
- [ ] Load listings from database
- [ ] Connect application workflow
- [ ] Integrate messaging system
- [ ] Add image uploads
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test all user flows

---

## Phase 2: Deployment Setup (Week 2)

### Backend Deployment (Railway or Render)

#### Option A: Railway (Recommended - Easiest)

**Steps:**

1. **Create Railway account**: https://railway.app
2. **Create new project** → "Deploy from GitHub repo"
3. **Select repository**: `rentra` → Select `server/` as root directory
4. **Set environment variables**:
   ```bash
   DOTENV_PRIVATE_KEY=d0bc43c3f25f8a5bdd94409a8761cbb158e25a33eb4d93364b1bf786c8801059
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```
5. **Deploy**: Railway auto-detects Node.js and deploys
6. **Get URL**: Something like `rentra-backend.up.railway.app`

**Cost**: $5/month for hobby plan

#### Option B: Render

1. **Create account**: https://render.com
2. **New Web Service** → Connect GitHub
3. **Settings**:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment**: Node
4. **Add environment variables** (same as Railway)
5. **Deploy**

**Cost**: Free tier available (spins down with inactivity)

### Frontend Deployment (Vercel - Recommended)

**Steps:**

1. **Create Vercel account**: https://vercel.com
2. **Import Git Repository** → Select `rentra`
3. **Configure**:
   - **Framework**: Vite
   - **Root Directory**: `.` (project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   ```bash
   DOTENV_PRIVATE_KEY=6bc4ba77b99fb62a1ce15f5ea3dfac6c1842b1611e7b61ef11bd17dec8816145
   VITE_API_URL=https://rentra-backend.up.railway.app/api
   ```
5. **Deploy**: Automatic on push to main

**Cost**: Free for hobby projects

### Alternative Frontend: Netlify

Similar to Vercel, also has generous free tier.

---

## Phase 3: Pre-Launch Testing (Week 2-3)

### Testing Checklist

#### Functionality Tests
- [ ] User registration with .edu email
- [ ] Email verification flow
- [ ] Login/logout
- [ ] Browse and search properties
- [ ] View property details
- [ ] Submit rental application
- [ ] Send/receive messages
- [ ] Upload property images (landlords)
- [ ] Payment flow (test mode)
- [ ] Application approval workflow

#### Cross-Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox
- [ ] Edge

#### Mobile Testing
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Responsive layouts
- [ ] Touch interactions

#### Performance
- [ ] Page load times < 3 seconds
- [ ] Image optimization
- [ ] API response times

#### Security
- [ ] HTTPS enabled
- [ ] Auth tokens working
- [ ] Rate limiting active
- [ ] CORS configured correctly

---

## Phase 4: Domain & Production Setup

### Domain Setup

**Option 1: Custom Domain**

1. **Buy domain**: Namecheap, GoDaddy, or Google Domains
   - Suggested: `rentra.app`, `rentra.io`, `getrentra.com`
2. **Configure DNS**:
   - Point to Vercel (frontend)
   - Point API subdomain to Railway (backend)
   ```
   rentra.com          → Vercel
   api.rentra.com      → Railway
   ```

**Option 2: Use Free Subdomains**

- Vercel: `rentra.vercel.app`
- Railway: `rentra-api.up.railway.app`

### SSL Certificates

Both Vercel and Railway automatically provide SSL certificates (HTTPS).

---

## Phase 5: Launch Preparation

### Pre-Launch Checklist

#### Technical
- [ ] All API endpoints working in production
- [ ] Database backups configured (Supabase handles this)
- [ ] Error monitoring setup (optional: Sentry)
- [ ] Analytics setup (optional: Google Analytics, Plausible)

#### Content
- [ ] Homepage with clear value proposition
- [ ] About page
- [ ] Contact information
- [ ] Privacy policy
- [ ] Terms of service

#### Marketing
- [ ] Landing page optimized
- [ ] Meta tags for SEO
- [ ] Social media preview images
- [ ] Email templates tested

---

## Deployment Commands Quick Reference

### Deploy Backend (Railway)

```bash
# Railway auto-deploys from GitHub
# Just push to main branch
git push origin main

# Or use Railway CLI
npm i -g @railway/cli
railway login
railway link
railway up
```

### Deploy Frontend (Vercel)

```bash
# Vercel auto-deploys from GitHub
# Just push to main branch
git push origin main

# Or use Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

### Manual Deployment Testing

Before going live, test locally with production settings:

```bash
# Backend (simulate production)
cd server
NODE_ENV=production npm start

# Frontend (production build)
npm run build
npm run preview
```

---

## Environment Variables Summary

### Backend (Railway/Render)

```bash
# Required
DOTENV_PRIVATE_KEY=d0bc43c3f25f8a5bdd94409a8761cbb158e25a33eb4d93364b1bf786c8801059
NODE_ENV=production
CLIENT_URL=https://rentra.vercel.app
PORT=5001

# Database (already in encrypted .env)
DATABASE_URL=<from-supabase>

# All other vars are in encrypted .env
# Just need DOTENV_PRIVATE_KEY to decrypt them
```

### Frontend (Vercel/Netlify)

```bash
DOTENV_PRIVATE_KEY=6bc4ba77b99fb62a1ce15f5ea3dfac6c1842b1611e7b61ef11bd17dec8816145
VITE_API_URL=https://your-backend-url.railway.app/api
```

---

## Cost Breakdown (Monthly)

### Minimal Setup (Free Tier)
- **Backend**: Render Free ($0) - sleeps after inactivity
- **Frontend**: Vercel Free ($0)
- **Database**: Supabase Free ($0) - 500MB limit
- **Total**: **$0/month**

### Recommended Setup (Always On)
- **Backend**: Railway Hobby ($5)
- **Frontend**: Vercel Pro ($20) - optional, free tier is fine for MVP
- **Database**: Supabase Free ($0) or Pro ($25) if you need more
- **Domain**: ~$12/year
- **Total**: **$5-30/month**

### Production Setup (Scale)
- **Backend**: Railway Pro ($20)
- **Frontend**: Vercel Pro ($20)
- **Database**: Supabase Pro ($25)
- **Email**: SendGrid ($15 for 40k emails/month)
- **Cloudinary**: Free tier (10GB)
- **Total**: **$80-100/month**

---

## Timeline Summary

| Week | Focus | Tasks |
|------|-------|-------|
| 1 | Frontend Integration | API layer, auth, listings, apps, messages |
| 2 | Deployment | Deploy backend + frontend, configure domains |
| 3 | Testing & Launch | Cross-browser testing, bug fixes, go live |

---

## Quick Start: Deploy Today (Minimal)

If you want to deploy quickly without frontend integration:

1. **Deploy backend** to Railway (15 minutes)
2. **Deploy frontend** to Vercel as-is (10 minutes)
3. **Test** basic functionality with mock data

Then iterate on API integration while backend is live.

---

## Monitoring & Maintenance

### Post-Launch

**Week 1**: Monitor errors, fix critical bugs  
**Week 2-4**: Gather user feedback, iterate  
**Month 2+**: Add features based on usage

### Tools to Consider

- **Error Tracking**: Sentry (free tier)
- **Analytics**: Plausible, Google Analytics
- **Uptime Monitoring**: UptimeRobot (free)
- **User Feedback**: Typeform, Google Forms

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy

---

## Next Immediate Steps

1. ✅ **Complete frontend API integration** (Week 1)
2. **Create Railway account** and deploy backend
3. **Create Vercel account** and deploy frontend
4. **Test deployed app** with real data
5. **Share with beta users** and gather feedback

---

**You're very close! The hard backend work is done. Focus on connecting the frontend, then deployment is straightforward.** 🚀

**Estimated Time to Production**: 2-3 weeks
