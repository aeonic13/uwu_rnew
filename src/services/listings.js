import api from './api'

export const listingsService = {
  /**
   * Get all listings with optional filters
   * @param {Object} filters - Search and filter parameters
   * @returns {Promise} List of listings
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/listings', { params: filters })
    return response.data
  },

  /**
   * Get single listing by ID
   * @param {string} id - Listing ID
   * @returns {Promise} Listing details
   */
  getById: async (id) => {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },

  /**
   * Create new listing
   * @param {Object} listingData - Listing information
   * @returns {Promise} Created listing
   */
  create: async (listingData) => {
    const response = await api.post('/listings', listingData)
    return response.data
  },

  /**
   * Update existing listing
   * @param {string} id - Listing ID
   * @param {Object} listingData - Updated listing data
   * @returns {Promise} Updated listing
   */
  update: async (id, listingData) => {
    const response = await api.put(`/listings/${id}`, listingData)
    return response.data
  },

  /**
   * Delete listing
   * @param {string} id - Listing ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/listings/${id}`)
    return response.data
  },

  /**
   * Toggle favorite status for a listing
   * @param {string} id - Listing ID
   * @returns {Promise} Updated favorite status
   */
  toggleFavorite: async (id) => {
    const response = await api.post(`/listings/${id}/favorite`)
    return response.data
  },

  /**
   * Get user's favorite listings
   * @returns {Promise} List of favorited listings
   */
  getFavorites: async () => {
    const response = await api.get('/listings/favorites')
    return response.data
  },
}

export default listingsService
