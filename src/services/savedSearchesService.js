import { apiClient } from './api'

/**
 * Saved searches — standing search filters that trigger email alerts when a
 * matching listing is posted.
 */
export const savedSearchesService = {
  /** @returns {Promise<object[]>} The current user's saved searches */
  async list() {
    const response = await apiClient.get('/saved-searches')
    return response.searches || []
  },

  /**
   * Save a search. All fields optional but at least one must be set.
   * @param {{location?: string, minPrice?: number, maxPrice?: number, minBeds?: number, propertyType?: string}} filters
   */
  async create(filters) {
    const response = await apiClient.post('/saved-searches', filters)
    return response.search
  },

  /** @param {string} id */
  async remove(id) {
    await apiClient.delete(`/saved-searches/${id}`)
  },
}

export default savedSearchesService
