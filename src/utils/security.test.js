import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateInput,
  sanitizeUserContent,
  RateLimiter,
  validateFileUpload,
} from './security'

describe('Security Utils', () => {
  describe('validateInput', () => {
    it('should validate email addresses', () => {
      expect(validateInput('test@university.edu', 'email')).toBe('test@university.edu')
      expect(() => validateInput('invalid-email', 'email')).toThrow('Invalid email format')
      expect(() => validateInput('', 'email')).toThrow('Invalid email format')
    })

    it('should validate phone numbers', () => {
      expect(validateInput('123-456-7890', 'phone')).toBe('1234567890')
      expect(validateInput('(123) 456-7890', 'phone')).toBe('1234567890')
      expect(() => validateInput('not-a-phone', 'phone')).toThrow('Invalid phone number format')
    })

    it('should validate numbers', () => {
      expect(validateInput('123', 'number')).toBe(123)
      expect(validateInput('123.45', 'number')).toBe(123.45)
      expect(() => validateInput('abc', 'number')).toThrow('Invalid number')
    })
  })

  describe('sanitizeUserContent', () => {
    it('should sanitize HTML content', () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeUserContent(malicious)
      expect(result).not.toContain('<script>')
      expect(result).toContain('Safe content')
    })

    it('should preserve safe HTML tags', () => {
      const safe = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeUserContent(safe, 'general')
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })
  })

  describe('RateLimiter', () => {
    let rateLimiter

    beforeEach(() => {
      rateLimiter = new RateLimiter()
    })

    it('should allow requests within limit', () => {
      const result1 = rateLimiter.checkLimit('127.0.0.1', { action: 'login' })
      expect(result1.allowed).toBe(true)

      const result2 = rateLimiter.checkLimit('127.0.0.1', { action: 'login' })
      expect(result2.allowed).toBe(true)
    })

    it('should block requests exceeding limit', () => {
      const ip = '127.0.0.1'
      const options = { action: 'login', maxRequests: 5 }

      // Make multiple requests to exceed limit (5 for login)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(ip, options)
      }

      const result = rateLimiter.checkLimit(ip, options)
      expect(result.allowed).toBe(false)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should track remaining attempts', () => {
      const ip = '127.0.0.1'
      const options = { action: 'message', maxRequests: 5 }

      const result1 = rateLimiter.checkLimit(ip, options)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = rateLimiter.checkLimit(ip, options)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })
  })

  describe('validateFileUpload', () => {
    it('should validate file size', () => {
      const validFile = { size: 1024 * 1024, name: 'test.jpg', type: 'image/jpeg' } // 1MB
      expect(validateFileUpload(validFile).valid).toBe(true)

      const tooLarge = { size: 15 * 1024 * 1024, name: 'large.jpg', type: 'image/jpeg' } // 15MB
      expect(validateFileUpload(tooLarge, { maxSize: 5 * 1024 * 1024 }).valid).toBe(
        false
      )
    })

    it('should validate file types', () => {
      const imageFile = { size: 1024, name: 'photo.jpg', type: 'image/jpeg' }
      expect(validateFileUpload(imageFile, { allowedTypes: ['image/jpeg'] }).valid).toBe(
        true
      )

      const textFile = { size: 1024, name: 'doc.txt', type: 'text/plain' }
      expect(validateFileUpload(textFile, { allowedTypes: ['image/jpeg'] }).valid).toBe(
        false
      )
    })

    it('should validate file extensions', () => {
      const file = { size: 1024, name: 'document.pdf', type: 'application/pdf' }
      expect(
        validateFileUpload(file, { allowedExtensions: ['.pdf', '.doc'] }).valid
      ).toBe(true)
      expect(
        validateFileUpload(file, { allowedExtensions: ['.jpg', '.png'] }).valid
      ).toBe(false)
    })
  })
})
