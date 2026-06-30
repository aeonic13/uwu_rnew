import { describe, it, expect, beforeEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  generateSecureToken,
  validatePasswordStrength,
  extractTokenFromHeader,
} from '../utils/auth.js'

describe('Password Hashing', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string'
      )
    })

    it('should throw error for null password', async () => {
      await expect(hashPassword(null)).rejects.toThrow(
        'Password must be a non-empty string'
      )
    })

    it('should throw error for password less than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow(
        'Password must be at least 8 characters long'
      )
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('WrongPassword', hash)
      expect(isValid).toBe(false)
    })

    it('should return false for empty password', async () => {
      const isValid = await verifyPassword('', 'somehash')
      expect(isValid).toBe(false)
    })

    it('should return false for empty hash', async () => {
      const isValid = await verifyPassword('password', '')
      expect(isValid).toBe(false)
    })
  })
})

describe('JWT Token Generation', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@university.edu',
    userType: 'student',
    verified: true,
  }

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(mockUser)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
    })

    it('should include user data in token', () => {
      const token = generateAccessToken(mockUser)
      const decoded = verifyToken(token)

      expect(decoded).not.toBeNull()
      expect(decoded.userId).toBe(mockUser.id)
      expect(decoded.email).toBe(mockUser.email)
      expect(decoded.userType).toBe(mockUser.userType)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken(mockUser)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should have type "refresh" in payload', () => {
      const token = generateRefreshToken(mockUser)
      const decoded = verifyToken(token)

      expect(decoded.type).toBe('refresh')
    })
  })

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockUser)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.expiresIn).toBeDefined()
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockUser)
      const decoded = verifyToken(token)

      expect(decoded).not.toBeNull()
      expect(decoded.userId).toBe(mockUser.id)
    })

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here')
      expect(decoded).toBeNull()
    })

    it('should return null for empty token', () => {
      const decoded = verifyToken('')
      expect(decoded).toBeNull()
    })
  })
})

describe('Password Strength Validation', () => {
  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongP@ss123')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.strength).toBeGreaterThanOrEqual(3)
    })

    it('should reject empty password', () => {
      const result = validatePasswordStrength('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('should reject short password', () => {
      const result = validatePasswordStrength('Short1')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      )
    })

    it('should require a letter', () => {
      const result = validatePasswordStrength('12345678')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one letter'
      )
    })

    it('should accept a password with letters and numbers regardless of case', () => {
      expect(validatePasswordStrength('UPPERCASE123').isValid).toBe(true)
      expect(validatePasswordStrength('lowercase123').isValid).toBe(true)
    })

    it('should require number', () => {
      const result = validatePasswordStrength('NoNumbers!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
    })

    it('should calculate strength score correctly', () => {
      // Weak password
      const weak = validatePasswordStrength('weak')
      expect(weak.strength).toBeLessThanOrEqual(1)

      // Medium password
      const medium = validatePasswordStrength('Medium12')
      expect(medium.strength).toBeGreaterThanOrEqual(2)

      // Strong password
      const strong = validatePasswordStrength('StrongP@ss123!')
      expect(strong.strength).toBe(4)
    })
  })
})

describe('Token Extraction', () => {
  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = extractTokenFromHeader('Bearer my-token-123')
      expect(token).toBe('my-token-123')
    })

    it('should return null for missing header', () => {
      const token = extractTokenFromHeader(null)
      expect(token).toBeNull()
    })

    it('should return null for non-Bearer header', () => {
      const token = extractTokenFromHeader('Basic abc123')
      expect(token).toBeNull()
    })

    it('should return null for empty header', () => {
      const token = extractTokenFromHeader('')
      expect(token).toBeNull()
    })
  })
})

describe('Secure Token Generation', () => {
  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(16)
      expect(token.length).toBe(16)
    })

    it('should generate default length of 32', () => {
      const token = generateSecureToken()
      expect(token.length).toBe(32)
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      expect(token1).not.toBe(token2)
    })

    it('should only contain alphanumeric characters', () => {
      const token = generateSecureToken(100)
      expect(token).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })
})
