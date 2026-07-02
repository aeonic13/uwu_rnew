import api from './api'

// Note: the api response interceptor already returns response.data (the
// body), so methods return the api call directly — no second unwrap.
export const paymentsService = {
  /**
   * Create Moov account for user
   * @param {Object} accountData - User account details
   * @returns {Promise} Created Moov account
   */
  createAccount: async accountData => {
    return api.post('/payments/moov/create-account', accountData)
  },

  /**
   * Link bank account using Plaid
   * @param {Object} data - Plaid public token and account ID
   * @returns {Promise} Linked bank account
   */
  linkBankAccount: async data => {
    return api.post('/payments/moov/link-bank', data)
  },

  /**
   * Create a payment/transfer
   * @param {Object} transferData - Payment details
   * @returns {Promise} Transfer confirmation
   */
  createTransfer: async transferData => {
    return api.post('/payments/moov/transfer', transferData)
  },

  /**
   * Get transfer status
   * @param {string} transferId - Transfer ID
   * @returns {Promise} Transfer details
   */
  getTransferStatus: async transferId => {
    return api.get(`/payments/moov/transfer/${transferId}`)
  },

  /**
   * Get payment history
   * @param {Object} params - Filter params
   * @returns {Promise} List of transactions
   */
  getHistory: async (params = {}) => {
    return api.get('/payments/history', { params })
  },

  /** Pay rent for the tenant's active lease. Returns { transaction }. */
  payRent: async (data = {}) => {
    return api.post('/payments/rent', data)
  },

  /**
   * Get user's payment methods
   * @returns {Promise} List of payment methods
   */
  getPaymentMethods: async () => {
    return api.get('/payments/moov/payment-methods')
  },
}

export default paymentsService
