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

  /** Create a Plaid Link token. Returns { linkToken, expiration }. */
  createPlaidLinkToken: async (
    products = ['auth', 'identity', 'income_verification']
  ) => {
    return api.post('/payments/plaid/create-link-token', { products })
  },

  /**
   * Exchange a Plaid public token. The access token is stored server-side;
   * the response contains accounts/processorToken only.
   */
  exchangePlaidToken: async (publicToken, accountId) => {
    return api.post('/payments/plaid/exchange-token', {
      publicToken,
      accountId,
    })
  },

  /** Verify income via the server-held Plaid token. Returns { income }. */
  verifyIncome: async () => {
    return api.post('/payments/plaid/verify-income', {})
  },

  /** Verify identity via the server-held Plaid token. */
  verifyIdentity: async () => {
    return api.post('/payments/plaid/verify-identity', {})
  },

  /** Charge the one-time $50 application fee (at pre-qualification). */
  chargeApplicationFee: async (listingId = undefined) => {
    return api.post('/payments/application-fee', listingId ? { listingId } : {})
  },

  /**
   * Get user's payment methods
   * @returns {Promise} List of payment methods
   */
  getPaymentMethods: async () => {
    return api.get('/payments/moov/payment-methods')
  },

  /** Landlord records an offline rent payment (cash/check) on a lease. */
  recordPayment: async ({ applicationId, amount, paymentMethod, note }) => {
    return api.post('/payments/record', {
      applicationId,
      amount,
      paymentMethod,
      note,
    })
  },

  /** Landlord emails the tenant a rent reminder. */
  sendReminder: async ({ applicationId, balance }) => {
    return api.post('/payments/remind', { applicationId, balance })
  },
}

export default paymentsService
