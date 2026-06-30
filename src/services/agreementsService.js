import { apiClient } from './api'

/**
 * Lease agreement service. Backed by server/routes/agreements.js.
 */
export const agreementsService = {
  /** Fetch one agreement (tenant or landlord on the application). */
  async getAgreement(id) {
    const res = await apiClient.get(`/agreements/${id}`)
    return res.agreement
  },

  /** List the authenticated user's agreements. */
  async listAgreements() {
    const res = await apiClient.get('/agreements')
    return res.agreements || []
  },

  /** Record the viewer's signature; returns the updated agreement. */
  async sign(id) {
    const res = await apiClient.post(`/agreements/${id}/sign`)
    return res.agreement
  },
}

export default agreementsService
