import { apiClient } from './api'

/**
 * Tenant rent plan: household split and autopay schedule for a lease.
 * Backed by server/routes/rent.js. Money movement is not live yet; these
 * calls store the plan that will drive it.
 */
export const rentService = {
  /**
   * { agreementId, monthlyRent, listingTitle, household, split, myShare,
   *   autopay }
   */
  async getPlan(agreementId) {
    return apiClient.get('/rent/plan', { params: { agreementId } })
  },

  /** Create or replace the household split. Returns { split, myShare }. */
  async saveSplit({ agreementId, total, splitMode, shares }) {
    return apiClient.put('/rent/split', {
      agreementId,
      total,
      splitMode,
      shares,
    })
  },

  async deleteSplit(splitId) {
    return apiClient.delete(`/rent/split/${splitId}`)
  },

  /** Create or replace the caller's autopay. Returns the schedule. */
  async saveAutopay({ agreementId, dayOfMonth, amount, paymentMethod }) {
    const res = await apiClient.put('/rent/autopay', {
      agreementId,
      dayOfMonth,
      amount,
      paymentMethod,
    })
    return res.autopay
  },

  /** Pause or resume. Returns the schedule. */
  async setAutopayStatus(autopayId, status) {
    const res = await apiClient.patch(`/rent/autopay/${autopayId}`, { status })
    return res.autopay
  },

  async deleteAutopay(autopayId) {
    return apiClient.delete(`/rent/autopay/${autopayId}`)
  },
}

export default rentService
