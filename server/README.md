# Rentra Backend API

Express.js REST API server for the Rentra application.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The server will run on **http://localhost:5000**

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-email` - Email verification
- `POST /forgot-password` - Password reset request

### Listings (`/api/listings`)

- `GET /` - Get all listings (with filters)
- `GET /:id` - Get single listing
- `POST /` - Create new listing
- `PUT /:id` - Update listing
- `DELETE /:id` - Delete listing

### Applications (`/api/applications`)

- `POST /` - Submit application
- `GET /:id` - Get application details
- `PUT /:id/status` - Update application status

### Messages (`/api/messages`)

- `GET /conversations` - Get user conversations
- `GET /conversation/:userId` - Get messages with user
- `POST /` - Send message
- `PUT /mark-read` - Mark messages as read

### Payments (`/api/payments`)

- `POST /create-intent` - Create payment intent
- `POST /confirm` - Confirm payment
- `GET /history` - Get payment history

### Users (`/api/users`)

- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /:id` - Get user by ID

### Health Check

- `GET /health` - Server health status

## Current Status

⚠️ **This is a skeleton API with mock responses**

All endpoints currently return mock data with TODO comments indicating where real implementation is needed.

## Next Steps for Production

1. **Database Integration**
   - Add PostgreSQL or MongoDB
   - Create database models/schemas
   - Implement connection pooling

2. **Authentication**
   - Implement JWT token generation and validation
   - Create authentication middleware
   - Add refresh token support

3. **Payment Integration**
   - Integrate Stripe API
   - Implement webhook handlers
   - Add payment verification

4. **File Storage**
   - Set up AWS S3 or Cloudinary
   - Implement image upload endpoints
   - Add file validation and processing

5. **Real-time Features**
   - Add Socket.io for messaging
   - Implement real-time notifications
   - Add presence tracking

6. **Email Service**
   - Integrate SendGrid or AWS SES
   - Create email templates
   - Add verification emails

## Environment Variables

See `.env.example` for all available configuration options.

Required for production:

- `JWT_SECRET` - Secure random string
- `DATABASE_URL` - Database connection string
- `STRIPE_SECRET_KEY` - Stripe API key

## Middleware Stack

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Express Rate Limit** - API rate limiting (100 req/15min)
- **Express JSON/URL parser** - Request body parsing (10MB limit)

## Error Handling

All routes use try-catch blocks with consistent error responses:

```json
{
  "error": {
    "message": "Error description"
  }
}
```

In development mode, stack traces are included in error responses.
