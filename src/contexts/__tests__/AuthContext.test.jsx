import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateToken: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

import { authService } from '../../services/authService'

// Wrapper component for testing hooks
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('should start with no user after initialization completes', async () => {
      authService.validateToken.mockResolvedValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After initialization, should have no user
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should restore user from valid token in localStorage', async () => {
      const mockUser = {
        id: '123',
        email: 'test@university.edu',
        userType: 'student',
      }

      localStorage.setItem('authToken', 'valid-token')
      authService.validateToken.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear invalid token from localStorage', async () => {
      localStorage.setItem('authToken', 'invalid-token')
      authService.validateToken.mockResolvedValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(localStorage.getItem('authToken')).toBe(null)
      expect(result.current.user).toBe(null)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      authService.validateToken.mockResolvedValue(null)

      const mockResponse = {
        token: 'new-token',
        user: {
          id: '123',
          email: 'test@university.edu',
          userType: 'student',
        },
      }
      authService.login.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@university.edu', 'password123')
      })

      expect(loginResult.success).toBe(true)
      expect(result.current.user).toEqual(mockResponse.user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(localStorage.getItem('authToken')).toBe('new-token')
    })

    it('should handle login error', async () => {
      authService.validateToken.mockResolvedValue(null)
      authService.login.mockRejectedValue(new Error('Invalid credentials'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login('test@university.edu', 'wrong')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
      expect(result.current.error).toBe('Invalid credentials')
      expect(result.current.user).toBe(null)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      authService.validateToken.mockResolvedValue(null)

      const mockResponse = {
        token: 'new-token',
        user: {
          id: '456',
          email: 'new@university.edu',
          userType: 'student',
        },
      }
      authService.register.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const userData = {
        email: 'new@university.edu',
        password: 'password123',
        userType: 'student',
        firstName: 'John',
        lastName: 'Doe',
      }

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      expect(registerResult.success).toBe(true)
      expect(result.current.user).toEqual(mockResponse.user)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('should logout and clear state', async () => {
      const mockUser = { id: '123', email: 'test@university.edu' }
      localStorage.setItem('authToken', 'valid-token')
      authService.validateToken.mockResolvedValue(mockUser)
      authService.logout.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('authToken')).toBe(null)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      authService.validateToken.mockResolvedValue(null)
      authService.login.mockRejectedValue(new Error('Some error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@test.com', 'wrong')
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})

describe('useAuth hook', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
