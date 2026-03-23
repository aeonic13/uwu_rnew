import axios from 'axios'

const MOOV_API_URL = process.env.MOOV_API_URL || 'https://api.moov.io'
const MOOV_ACCOUNT_ID = process.env.MOOV_ACCOUNT_ID
const MOOV_PUBLIC_KEY = process.env.MOOV_PUBLIC_KEY
const MOOV_SECRET_KEY = process.env.MOOV_SECRET_KEY

// Cache for access token
let cachedToken = null
let tokenExpiry = null

/**
 * Get OAuth access token for Moov API
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await axios.post(
      `${MOOV_API_URL}/oauth2/token`,
      {
        grant_type: 'client_credentials',
        scope: '/accounts.write /accounts.read /transfers.write /transfers.read /payment-methods.write /payment-methods.read',
      },
      {
        auth: {
          username: MOOV_PUBLIC_KEY,
          password: MOOV_SECRET_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    cachedToken = response.data.access_token
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000

    return cachedToken
  } catch (error) {
    console.error('Moov authentication error:', error.response?.data || error.message)
    throw new Error('Failed to authenticate with Moov')
  }
}

/**
 * Make authenticated request to Moov API
 */
async function moovRequest(method, endpoint, data = null) {
  const token = await getAccessToken()

  try {
    const response = await axios({
      method,
      url: `${MOOV_API_URL}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Account-ID': MOOV_ACCOUNT_ID,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Moov API error (${method} ${endpoint}):`, error.response?.data || error.message)
    throw error
  }
}

/**
 * Create a Moov account for a user
 */
export async function createMoovAccount(userData) {
  const accountData = {
    accountType: userData.userType === 'owner' ? 'business' : 'individual',
    profile: {
      individual: {
        name: {
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        email: userData.email,
        phone: userData.phone,
      },
    },
    capabilities: ['transfers', 'send-funds', 'collect-funds'],
  }

  return await moovRequest('POST', '/accounts', accountData)
}

/**
 * Link bank account using Plaid token
 */
export async function linkBankAccount(moovAccountId, plaidProcessorToken) {
  const paymentMethodData = {
    plaidProcessorToken,
  }

  return await moovRequest(
    'POST',
    `/accounts/${moovAccountId}/bank-accounts/plaid`,
    paymentMethodData
  )
}

/**
 * Create a transfer (payment)
 */
export async function createTransfer(transferData) {
  const {
    sourceAccountId,
    destinationAccountId,
    amount,
    description,
    metadata,
  } = transferData

  const transfer = {
    source: {
      accountID: sourceAccountId,
      paymentMethodID: metadata.sourcePaymentMethodId,
    },
    destination: {
      accountID: destinationAccountId,
      paymentMethodID: metadata.destinationPaymentMethodId,
    },
    amount: {
      currency: 'USD',
      value: Math.round(amount * 100), // Convert to cents
    },
    description,
    metadata,
  }

  return await moovRequest('POST', '/transfers', transfer)
}

/**
 * Get transfer status
 */
export async function getTransfer(transferId) {
  return await moovRequest('GET', `/transfers/${transferId}`)
}

/**
 * Get account details
 */
export async function getMoovAccount(accountId) {
  return await moovRequest('GET', `/accounts/${accountId}`)
}

/**
 * List payment methods for an account
 */
export async function getPaymentMethods(accountId) {
  return await moovRequest('GET', `/accounts/${accountId}/payment-methods`)
}

/**
 * Create a micro-deposit verification for bank account
 */
export async function initiateMicroDeposits(accountId, paymentMethodId) {
  return await moovRequest(
    'POST',
    `/accounts/${accountId}/payment-methods/${paymentMethodId}/micro-deposits`
  )
}

/**
 * Complete micro-deposit verification
 */
export async function completeMicroDeposits(
  accountId,
  paymentMethodId,
  amounts
) {
  return await moovRequest(
    'PUT',
    `/accounts/${accountId}/payment-methods/${paymentMethodId}/micro-deposits`,
    { amounts }
  )
}

export default {
  createMoovAccount,
  linkBankAccount,
  createTransfer,
  getTransfer,
  getMoovAccount,
  getPaymentMethods,
  initiateMicroDeposits,
  completeMicroDeposits,
}
