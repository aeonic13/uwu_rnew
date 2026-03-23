import { apiClient } from './api'

/**
 * Authentication service for handling auth-related API calls
 */
export const authService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password })
    return response
  },

  /**
   * Register new user
   * @param {object} userData - Registration data
   * @returns {Promise<{token: string, user: object}>}
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData)
    return response
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore errors on logout
    }
  },

  /**
   * Validate token and get current user
   * @param {string} token - JWT token
   * @returns {Promise<object|null>}
   */
  async validateToken(token) {
    try {
      const response = await apiClient.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.user
    } catch {
      return null
    }
  },

  /**
   * Update user profile
   * @param {object} updates - Profile updates
   * @returns {Promise<object>}
   */
  async updateProfile(updates) {
    const response = await apiClient.put('/users/profile', updates)
    return response.user
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<object>}
   */
  async verifyEmail(token) {
    const response = await apiClient.post('/auth/verify-email', { token })
    return response
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<object>}
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<object>}
   */
  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
    return response
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{token: string}>}
   */
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh-token', {
      refreshToken,
    })
    return response
  },
}

export default authService
