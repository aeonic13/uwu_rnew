import { apiClient } from './api'

/**
 * Utility bill split service. Backed by server/routes/utilities.js.
 */
export const utilitiesService = {
  /** List the user's bill splits. */
  async listBills() {
    const res = await apiClient.get('/utilities/bills')
    return res.bills || []
  },

  /** Create a bill split; returns the created bill (UI shape). */
  async createBill(data) {
    const res = await apiClient.post('/utilities/bills', data)
    return res.bill
  },

  /** Toggle a participant's paid flag. */
  async toggleShare(billId, shareId, paid) {
    const res = await apiClient.put(
      `/utilities/bills/${billId}/shares/${shareId}`,
      { paid }
    )
    return res.share
  },

  /** Delete a bill split. */
  async deleteBill(billId) {
    return apiClient.delete(`/utilities/bills/${billId}`)
  },

  /** Suggested split contacts = the user's active group members. */
  async getContacts() {
    const res = await apiClient.get('/groups/my')
    const seen = new Set()
    const contacts = []
    for (const g of res.groups || []) {
      for (const m of g.members || []) {
        if (m.status === 'active' && m.userId && !seen.has(m.userId)) {
          seen.add(m.userId)
          contacts.push({
            id: m.userId,
            userId: m.userId,
            name: m.name,
            role: 'Roommate',
          })
        }
      }
    }
    return contacts
  },
}

export default utilitiesService
