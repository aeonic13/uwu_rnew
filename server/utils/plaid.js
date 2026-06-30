import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)

/**
 * Create a link token for Plaid Link
 * @param {Object} params - Link token parameters
 * @returns {Promise<Object>} Link token response
 */
export async function createLinkToken({
  userId,
  userName,
  products = ['auth', 'identity', 'income_verification'],
  webhookUrl,
}) {
  try {
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Rentra',
      products: products,
      country_codes: ['US'],
      language: 'en',
    }

    // Add webhook if provided
    if (webhookUrl) {
      request.webhook = webhookUrl
    }

    // Add income verification settings if included
    if (products.includes('income_verification')) {
      request.income_verification = {
        income_source_types: ['bank', 'payroll'],
        bank_income: {
          days_requested: 180, // Last 6 months
        },
      }
    }

    const response = await plaidClient.linkTokenCreate(request)
    return response.data
  } catch (error) {
    console.error(
      'Plaid link token creation error:',
      error.response?.data || error
    )
    throw error
  }
}

/**
 * Exchange public token for access token
 * @param {String} publicToken - Public token from Plaid Link
 * @returns {Promise<Object>} Access token and item ID
 */
export async function exchangePublicToken(publicToken) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    }
  } catch (error) {
    console.error('Plaid token exchange error:', error.response?.data || error)
    throw error
  }
}

/**
 * Get account information
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Account details
 */
export async function getAccounts(accessToken) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    return response.data.accounts
  } catch (error) {
    console.error('Plaid get accounts error:', error.response?.data || error)
    throw error
  }
}

/**
 * Get identity information
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Identity details
 */
export async function getIdentity(accessToken) {
  try {
    const response = await plaidClient.identityGet({
      access_token: accessToken,
    })

    return {
      accounts: response.data.accounts,
      item: response.data.item,
    }
  } catch (error) {
    console.error('Plaid identity error:', error.response?.data || error)
    throw error
  }
}

/**
 * Get income verification data
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Income details
 */
export async function getIncome(accessToken) {
  try {
    const response = await plaidClient.incomeGet({
      access_token: accessToken,
    })

    return response.data.income
  } catch (error) {
    console.error('Plaid income error:', error.response?.data || error)
    throw error
  }
}

/**
 * Get income verification (Payroll/Bank based)
 * @param {String} incomeVerificationId - Income verification ID from webhook
 * @returns {Promise<Object>} Detailed income verification
 */
export async function getIncomeVerification(incomeVerificationId) {
  try {
    const response = await plaidClient.incomeVerificationGet({
      income_verification_id: incomeVerificationId,
    })

    return response.data
  } catch (error) {
    console.error(
      'Plaid income verification error:',
      error.response?.data || error
    )
    throw error
  }
}

/**
 * Get account balances
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Account balances
 */
export async function getBalance(accessToken) {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    })

    return response.data.accounts
  } catch (error) {
    console.error('Plaid balance error:', error.response?.data || error)
    throw error
  }
}

/**
 * Get auth data (routing/account numbers for ACH)
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Auth data with routing/account numbers
 */
export async function getAuth(accessToken) {
  try {
    const response = await plaidClient.authGet({
      access_token: accessToken,
    })

    return {
      accounts: response.data.accounts,
      numbers: response.data.numbers,
    }
  } catch (error) {
    console.error('Plaid auth error:', error.response?.data || error)
    throw error
  }
}

/**
 * Create processor token for Moov integration
 * @param {String} accessToken - Plaid access token
 * @param {String} accountId - Plaid account ID
 * @returns {Promise<String>} Processor token
 */
export async function createProcessorToken(accessToken, accountId) {
  try {
    const response = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountId,
      processor: 'moov', // For Moov integration
    })

    return response.data.processor_token
  } catch (error) {
    console.error('Plaid processor token error:', error.response?.data || error)
    throw error
  }
}

/**
 * Remove an item (disconnect bank account)
 * @param {String} accessToken - Plaid access token
 * @returns {Promise<Object>} Removal confirmation
 */
export async function removeItem(accessToken) {
  try {
    const response = await plaidClient.itemRemove({
      access_token: accessToken,
    })

    return response.data
  } catch (error) {
    console.error('Plaid item remove error:', error.response?.data || error)
    throw error
  }
}

/**
 * Calculate income summary from income data
 * @param {Object} incomeData - Income data from Plaid
 * @returns {Object} Summarized income information
 */
export function summarizeIncome(incomeData) {
  const streams = incomeData.income_streams || []

  const summary = {
    totalMonthlyIncome: 0,
    totalAnnualIncome: 0,
    employmentStatus: 'unknown',
    hasMultipleIncomeStreams: streams.length > 1,
    incomeStreams: [],
  }

  streams.forEach(stream => {
    const monthlyIncome = stream.monthly_income || 0
    summary.totalMonthlyIncome += monthlyIncome
    summary.totalAnnualIncome += monthlyIncome * 12

    summary.incomeStreams.push({
      name: stream.name,
      monthlyIncome: monthlyIncome,
      frequency: stream.frequency,
      confidence: stream.confidence,
    })
  })

  // Determine employment status
  if (streams.some(s => s.confidence === 'HIGH')) {
    summary.employmentStatus = 'employed'
  } else if (streams.length > 0) {
    summary.employmentStatus = 'partial_verification'
  }

  return summary
}

export default {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getIdentity,
  getIncome,
  getIncomeVerification,
  getBalance,
  getAuth,
  createProcessorToken,
  removeItem,
  summarizeIncome,
}
