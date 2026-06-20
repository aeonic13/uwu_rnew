import { apiClient } from './api'

/**
 * Housemates service - compatibility-based housemate matching API calls.
 */
export const housematesService = {
  /**
   * Get housemate profiles ranked by compatibility.
   * @param {object} params - Optional filters (audience, lookingForRoom)
   * @returns {Promise<object[]>}
   */
  async getMatches(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.audience && params.audience !== 'all') {
      queryParams.append('audience', params.audience)
    }
    if (params.lookingForRoom) {
      queryParams.append('lookingForRoom', 'true')
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/housemates?${queryString}` : '/housemates'

    const response = await apiClient.get(url)
    return response.profiles || []
  },

  /**
   * Get the current user's housemate profile.
   * @returns {Promise<object|null>}
   */
  async getMyProfile() {
    const response = await apiClient.get('/housemates/me')
    return response.profile || null
  },

  /**
   * Create or update the current user's housemate profile.
   * @param {object} profileData - Lifestyle answers and discovery fields
   * @returns {Promise<object>}
   */
  async saveMyProfile(profileData) {
    const response = await apiClient.put('/housemates/me', profileData)
    return response.profile
  },

  /**
   * Get a single housemate profile by ID with compatibility score.
   * @param {string} id - Housemate profile ID
   * @returns {Promise<object>}
   */
  async getProfileById(id) {
    const response = await apiClient.get(`/housemates/${id}`)
    return response.profile
  },
}

export default housematesService
