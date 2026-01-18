import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Password hashing configuration
const SALT_ROUNDS = 12

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const JWT_REFRESH_EXPIRES_IN = '30d'

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} Whether password matches
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false
  }

  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
export function generateAccessToken(payload) {
  const tokenPayload = {
    userId: payload.userId || payload.id,
    email: payload.email,
    userType: payload.userType,
    verified: payload.verified || false,
  }

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'rentra',
    audience: 'rentra-users',
  })
}

/**
 * Generate a refresh token with longer expiry
 * @param {object} payload - Token payload
 * @returns {string} Refresh token
 */
export function generateRefreshToken(payload) {
  const tokenPayload = {
    userId: payload.userId || payload.id,
    type: 'refresh',
  }

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'rentra',
  })
}

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object
 * @returns {object} Object containing accessToken and refreshToken
 */
export function generateTokens(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRES_IN,
  }
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'rentra',
    })
  } catch (error) {
    return null
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch {
    return null
  }
}

/**
 * Generate a secure random token for email verification, password reset, etc.
 * @param {number} length - Token length (default 32)
 * @returns {string} Random token
 */
export function generateSecureToken(length = 32) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // Use crypto for better randomness if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }

  return result
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validatePasswordStrength(password) {
  const errors = []

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  }
}

/**
 * Calculate password strength score (0-4)
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score
 */
function calculatePasswordStrength(password) {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  return Math.min(score, 4)
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

export default {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  generateSecureToken,
  validatePasswordStrength,
  extractTokenFromHeader,
}
