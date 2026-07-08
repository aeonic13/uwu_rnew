import { apiClient } from './api'

/**
 * Security-deposit compliance service. Backed by server/routes/deposits.js
 * (owner-only). Deposits are auto-created from signed leases on first list.
 */
export const depositsService = {
  /** All of the owner's deposits with countdown + deduction math. */
  async list() {
    const res = await apiClient.get('/deposits')
    return res.deposits || []
  },

  /** Set move-out date (starts the statutory clock), state, or notes. */
  async update(id, data) {
    const res = await apiClient.put(`/deposits/${id}`, data)
    return res.deposit
  },

  /** Add an itemized deduction line. */
  async addDeduction(id, deduction) {
    const res = await apiClient.post(`/deposits/${id}/deductions`, deduction)
    return res.deposit
  },

  /** Remove a deduction line. */
  async removeDeduction(id, deductionId) {
    const res = await apiClient.delete(
      `/deposits/${id}/deductions/${deductionId}`
    )
    return res.deposit
  },

  /** Data for the printable itemized disposition letter. */
  async getLetter(id) {
    const res = await apiClient.get(`/deposits/${id}/letter`)
    return res.letter
  },

  /** Record the refund (held − deductions). */
  async recordRefund(id, refundMethod) {
    const res = await apiClient.post(`/deposits/${id}/refund`, { refundMethod })
    return res.deposit
  },
}

export default depositsService
