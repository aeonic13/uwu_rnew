import api from './api'

export const paymentsService = {
  /**
   * Create Moov account for user
   * @param {Object} accountData - User account details
   * @returns {Promise} Created Moov account
   */
  createAccount: async accountData => {
    const response = await api.post('/payments/create-account', accountData)
    return response.data
  },

  /**
   * Link bank account using Plaid
   * @param {Object} data - Plaid public token and account ID
   * @returns {Promise} Linked bank account
   */
  linkBankAccount: async data => {
    const response = await api.post('/payments/link-bank', data)
    return response.data
  },

  /**
   * Create a payment/transfer
   * @param {Object} transferData - Payment details
   * @returns {Promise} Transfer confirmation
   */
  createTransfer: async transferData => {
    const response = await api.post('/payments/transfer', transferData)
    return response.data
  },

  /**
   * Get transfer status
   * @param {string} transferId - Transfer ID
   * @returns {Promise} Transfer details
   */
  getTransferStatus: async transferId => {
    const response = await api.get(`/payments/transfer/${transferId}`)
    return response.data
  },

  /**
   * Get payment history
   * @param {Object} params - Filter params
   * @returns {Promise} List of transactions
   */
  getHistory: async (params = {}) => {
    const response = await api.get('/payments/history', { params })
    return response.data
  },

  /**
   * Get user's payment methods
   * @returns {Promise} List of payment methods
   */
  getPaymentMethods: async () => {
    const response = await api.get('/payments/methods')
    return response.data
  },
}

export default paymentsService
