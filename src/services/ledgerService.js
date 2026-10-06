import { apiClient } from './api'

/**
 * Rent ledger: charges other than rent (late fees, utilities, repairs,
 * credits) and each tenant's balance for the month.
 * Backed by server/routes/ledger.js.
 */
export const ledgerService = {
  /** The month's ledger for a lease (landlord or any tenant on it). */
  async get(agreementId) {
    const res = await apiClient.get(`/ledger/${agreementId}`)
    return res.ledger
  },

  /** Landlord adds a charge or credit. userId pins it to one tenant. */
  async addCharge(agreementId, { type, amount, description, dueDate, userId }) {
    const res = await apiClient.post(`/ledger/${agreementId}/charges`, {
      type,
      amount,
      description,
      dueDate,
      userId,
    })
    return res.charge
  },

  /** Landlord removes a charge. */
  async removeCharge(chargeId) {
    return apiClient.delete(`/ledger/charges/${chargeId}`)
  },

  /** Landlord applies this month's late fee from the lease's rule. */
  async applyLateFee(agreementId) {
    const res = await apiClient.post(`/ledger/${agreementId}/late-fee`)
    return res.charge
  },
}

export default ledgerService
