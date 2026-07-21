import { apiClient } from './api'

/**
 * Reviews service — tenants reviewing listings/landlords after an approved
 * application.
 */
export const reviewsService = {
  /**
   * Can the current user review this listing?
   * @param {string} listingId
   * @returns {Promise<{eligible: boolean, alreadyReviewed: boolean}>}
   */
  async getEligibility(listingId) {
    return apiClient.get(`/reviews/eligibility/${listingId}`)
  },

  /**
   * Submit a review for a listing.
   * @param {string} listingId
   * @param {number} rating - 1-5
   * @param {string} [comment]
   * @returns {Promise<object>} The created review
   */
  async create(listingId, rating, comment) {
    const response = await apiClient.post('/reviews', {
      listingId,
      rating,
      comment,
    })
    return response.review
  },
}

export default reviewsService
