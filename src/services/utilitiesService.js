import { apiClient } from './api'

/**
 * Household utility bills: upload, store, split and settle.
 * Backed by server/routes/utilities.js.
 */
export const utilitiesService = {
  /** Bills the user uploaded or owes a share on. */
  async listBills() {
    const res = await apiClient.get('/utilities/bills')
    return res.bills || []
  },

  /**
   * Consolidated view across every bill: who owes the user, who the user
   * owes, and monthly totals.
   */
  async getSummary() {
    return apiClient.get('/utilities/summary')
  },

  /**
   * Upload a bill (optional file) and split it. `shares` carries
   * { name, userId?, percent? } per participant; the server does the
   * cent-exact math.
   */
  async createBill(data, file = null) {
    const form = new FormData()
    for (const key of [
      'utilityType',
      'provider',
      'dueDate',
      'total',
      'notes',
      'splitMode',
    ]) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        form.append(key, data[key])
      }
    }
    form.append('shares', JSON.stringify(data.shares || []))
    if (file) form.append('file', file)
    const res = await apiClient.post('/utilities/bills', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.bill
  },

  /** Mark a share paid/unpaid (uploader: any share; roommate: their own). */
  async toggleShare(billId, shareId, paid) {
    const res = await apiClient.put(
      `/utilities/bills/${billId}/shares/${shareId}`,
      { paid }
    )
    return res.share
  },

  /** Delete a bill (uploader only). */
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
