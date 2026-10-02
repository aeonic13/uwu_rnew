import { apiClient } from './api'

/**
 * Landlord property workspace. Backed by server/routes/properties.js
 * (owner-only). One property = one listing plus everything managed for it.
 */
export const propertiesService = {
  /**
   * Portfolio: card summary per property plus totals.
   * @returns {Promise<{properties: object[], totals: object}>}
   */
  async getPortfolio() {
    return apiClient.get('/properties')
  },

  /**
   * Full workspace for one property: listing, stats, leases with household
   * members, applications, maintenance tickets, documents and this year's
   * expenses.
   * @param {string} id listing id
   */
  async getProperty(id) {
    return apiClient.get(`/properties/${id}`)
  },
}

export default propertiesService
