import { apiClient } from './api'

/**
 * Listings service for handling listing-related API calls
 */
export const listingsService = {
  /**
   * Get all listings with optional filters
   * @param {object} params - Query parameters
   * @returns {Promise<object[]>}
   */
  async getListings(params = {}) {
    const queryParams = new URLSearchParams()

    if (params.university) queryParams.append('university', params.university)
    if (params.minPrice) queryParams.append('minPrice', params.minPrice)
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice)
    if (params.bedrooms) queryParams.append('bedrooms', params.bedrooms)
    if (params.bathrooms) queryParams.append('bathrooms', params.bathrooms)
    if (params.propertyType)
      queryParams.append('propertyType', params.propertyType)
    if (params.amenities)
      queryParams.append('amenities', params.amenities.join(','))
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)

    const queryString = queryParams.toString()
    const url = queryString ? `/listings?${queryString}` : '/listings'

    const response = await apiClient.get(url)
    return response.listings || []
  },

  /**
   * Get single listing by ID
   * @param {string|number} id - Listing ID
   * @returns {Promise<object>}
   */
  async getListingById(id) {
    const response = await apiClient.get(`/listings/${id}`)
    return response.listing
  },

  /**
   * Create new listing
   * @param {object} listingData - Listing data
   * @returns {Promise<object>}
   */
  async createListing(listingData) {
    const response = await apiClient.post('/listings', listingData)
    return response.listing
  },

  /**
   * Update listing
   * @param {string|number} id - Listing ID
   * @param {object} updates - Update data
   * @returns {Promise<object>}
   */
  async updateListing(id, updates) {
    const response = await apiClient.put(`/listings/${id}`, updates)
    return response.listing
  },

  /**
   * Delete listing
   * @param {string|number} id - Listing ID
   * @returns {Promise<void>}
   */
  async deleteListing(id) {
    await apiClient.delete(`/listings/${id}`)
  },

  /**
   * Search listings near university
   * @param {object} params - Search parameters
   * @returns {Promise<object[]>}
   */
  async searchByUniversity(params) {
    const { universityId, radiusMiles = 5, ...otherParams } = params
    const queryParams = new URLSearchParams({
      universityId,
      radius: radiusMiles,
      ...otherParams,
    })

    const response = await apiClient.get(
      `/listings/search/university?${queryParams}`
    )
    return response.listings || []
  },

  /**
   * Get user's own listings
   * @returns {Promise<object[]>}
   */
  async getMyListings() {
    const response = await apiClient.get('/listings/my-listings')
    return response.listings || []
  },

  /**
   * Toggle listing status (active/inactive)
   * @param {string|number} id - Listing ID
   * @param {boolean} active - New status
   * @returns {Promise<object>}
   */
  async toggleListingStatus(id, active) {
    const response = await apiClient.patch(`/listings/${id}/status`, { active })
    return response.listing
  },

  /**
   * Upload listing images
   * @param {string|number} listingId - Listing ID
   * @param {File[]} files - Image files
   * @returns {Promise<string[]>} - Uploaded image URLs
   */
  async uploadImages(listingId, files) {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))

    const response = await apiClient.post(
      `/listings/${listingId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.imageUrls || []
  },
}

export default listingsService
