import api from './api'

export const usersService = {
  /**
   * Get current user profile
   * @returns {Promise} User profile data
   */
  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  /**
   * Update current user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Updated user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response.data
  },

  /**
   * Get user by ID (public profile)
   * @param {string} id - User ID
   * @returns {Promise} User profile
   */
  getById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
}

export default usersService
