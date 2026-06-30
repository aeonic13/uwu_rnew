import { apiClient } from './api'

/**
 * Dashboard service for landlord/owner analytics endpoints.
 * Backed by server/routes/dashboard.js (owner-only).
 */
export const dashboardService = {
  /**
   * Get the portfolio rent roll: per-property tenants, occupancy, and
   * this-month collection figures, plus portfolio totals.
   * @returns {Promise<{rentRoll: object[], totals: object, month: string}>}
   */
  async getRentRoll() {
    return apiClient.get('/dashboard/landlord/rent-roll')
  },

  /**
   * Get application + group status breakdown for a single listing.
   * @param {string} listingId
   */
  async getGroupStatus(listingId) {
    return apiClient.get(`/dashboard/landlord/group-status/${listingId}`)
  },

  /**
   * Get applications (with stats) for a single listing.
   * @param {string} listingId
   */
  async getListingApplications(listingId) {
    return apiClient.get(`/dashboard/landlord/applications/${listingId}`)
  },
}

export default dashboardService
