import { apiClient } from './api'

/**
 * Housemates service - compatibility-based housemate matching API calls.
 */
export const housematesService = {
  /**
   * Get housemate profiles ranked by compatibility.
   * @param {object} params - Optional filters: ageMin, ageMax (omit for open
   *   ends), genders (array of preference ids), location, lookingForRoom
   *   ('true' | 'false'), limit, offset.
   * @returns {Promise<{profiles: object[], total: number, hasMore: boolean, viewerHasQuiz: boolean}>}
   */
  async getMatches(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.ageMin != null) {
      queryParams.append('ageMin', String(params.ageMin))
    }
    if (params.ageMax != null) {
      queryParams.append('ageMax', String(params.ageMax))
    }
    if (Array.isArray(params.genders) && params.genders.length > 0) {
      queryParams.append('gender', params.genders.join(','))
    }
    if (params.location && params.location.trim()) {
      queryParams.append('location', params.location.trim())
    }
    if (params.lookingForRoom === 'true' || params.lookingForRoom === 'false') {
      queryParams.append('lookingForRoom', params.lookingForRoom)
    }
    if (params.limit != null) {
      queryParams.append('limit', String(params.limit))
    }
    if (params.offset != null) {
      queryParams.append('offset', String(params.offset))
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/housemates?${queryString}` : '/housemates'

    const response = await apiClient.get(url)
    return {
      profiles: response.profiles || [],
      total: response.total ?? (response.profiles || []).length,
      hasMore: Boolean(response.hasMore),
      viewerHasQuiz: Boolean(response.viewerHasQuiz),
    }
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
   * Create or update the current user's housemate profile. Also used to pause
   * or resume discoverability via { active: boolean }.
   * @param {object} profileData - Lifestyle answers and discovery fields
   * @returns {Promise<object>}
   */
  async saveMyProfile(profileData) {
    const response = await apiClient.put('/housemates/me', profileData)
    return response.profile
  },

  /**
   * Permanently delete the current user's housemate profile.
   * @returns {Promise<void>}
   */
  async deleteMyProfile() {
    await apiClient.delete('/housemates/me')
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

  /**
   * Block the user behind a housemate profile (hides both people from each
   * other and stops messaging between them).
   * @param {string} id - Housemate profile ID
   * @returns {Promise<void>}
   */
  async blockProfile(id) {
    await apiClient.post(`/housemates/${id}/block`)
  },

  /**
   * Report the user behind a housemate profile.
   * @param {string} id - Housemate profile ID
   * @param {{reason: string, details?: string}} report
   * @returns {Promise<void>}
   */
  async reportProfile(id, report) {
    await apiClient.post(`/housemates/${id}/report`, report)
  },
}

export default housematesService
