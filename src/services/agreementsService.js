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

  /** Download the agreement PDF and save it via the browser. */
  async downloadPdf(id) {
    const blob = await apiClient.get(`/agreements/${id}/pdf`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rentra-lease-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

export default agreementsService
