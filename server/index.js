// Catch startup errors early
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err)
  process.exit(1)
})
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err)
  process.exit(1)
})

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import authRoutes from './routes/auth.js'
import listingsRoutes from './routes/listings.js'
import applicationsRoutes from './routes/applications.js'
import messagesRoutes from './routes/messages.js'
import paymentsRoutes from './routes/payments.js'
import usersRoutes from './routes/users.js'
import webhooksRoutes from './routes/webhooks.js'
import uploadsRoutes from './routes/uploads.js'
import cosignersRoutes from './routes/cosigners.js'
import dashboardRoutes from './routes/dashboard.js'
import housematesRoutes from './routes/housemates.js'
import agreementsRoutes from './routes/agreements.js'
import maintenanceRoutes from './routes/maintenance.js'
import groupsRoutes from './routes/groups.js'
import utilitiesRoutes from './routes/utilities.js'
import depositsRoutes from './routes/deposits.js'
import expensesRoutes from './routes/expenses.js'
import documentsRoutes from './routes/documents.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://myrentra.com',
      'https://www.myrentra.com',
      'https://rentra-poko65k4v-aeonic13s-projects.vercel.app',
      'http://localhost:3001',
    ],
    credentials: true,
  })
)

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Strict limiter for credential endpoints (brute-force protection) and the
// public cosigner token endpoints (token guessing).
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again later.',
})
app.use('/api/auth/login', strictLimiter)
app.use('/api/auth/register', strictLimiter)
app.use('/api/auth/forgot-password', strictLimiter)
app.use('/api/auth/reset-password', strictLimiter)
app.use('/api/cosigners/invitation', strictLimiter)
app.use('/api/cosigners/accept', strictLimiter)
app.use('/api/cosigners/decline', strictLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Rentra API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      listings: '/api/listings',
      applications: '/api/applications',
      messages: '/api/messages',
      payments: '/api/payments',
      users: '/api/users',
      webhooks: '/api/webhooks',
      cosigners: '/api/cosigners',
      dashboard: '/api/dashboard',
      housemates: '/api/housemates',
    },
  })
})

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/listings', listingsRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/webhooks', webhooksRoutes)
app.use('/api/uploads', uploadsRoutes)
app.use('/api/cosigners', cosignersRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/housemates', housematesRoutes)
app.use('/api/agreements', agreementsRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/utilities', utilitiesRoutes)
app.use('/api/deposits', depositsRoutes)
app.use('/api/expenses', expensesRoutes)
app.use('/api/documents', documentsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } })
})

// Start server
console.log(`Attempting to listen on port ${PORT}...`)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 API available at http://localhost:${PORT}/api`)
})

export default app
