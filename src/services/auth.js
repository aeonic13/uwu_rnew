import api from './api'

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with user and token
   */
  register: async userData => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} Response with user and token
   */
  login: async credentials => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise} Verification response
   */
  verifyEmail: async token => {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Response
   */
  forgotPassword: async email => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Response
   */
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  /**
   * Logout (clear local storage)
   */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export default authService
