import fs from 'fs'
import https from 'https'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Teller API Service
 * 
 * Provides secure banking data access using Teller's API with mTLS authentication.
 * Documentation: https://teller.io/docs/api
 */
class TellerService {
  constructor() {
    this.baseURL = process.env.TELLER_API_URL || 'https://api.teller.io'
    this.applicationId = process.env.TELLER_APPLICATION_ID
    
    // Load certificates for mTLS authentication
    const certPath = path.resolve(__dirname, '..', process.env.TELLER_CERT_PATH || './certs/certificate.pem')
    const keyPath = path.resolve(__dirname, '..', process.env.TELLER_KEY_PATH || './certs/private_key.pem')
    
    try {
      const cert = fs.readFileSync(certPath)
      const key = fs.readFileSync(keyPath)
      
      // Create HTTPS agent with mTLS certificates
      this.httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: true
      })
      
      // Create axios instance with mTLS agent
      this.client = axios.create({
        baseURL: this.baseURL,
        httpsAgent: this.httpsAgent,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Teller API service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Teller API service:', error.message)
      throw new Error(`Teller certificate loading failed: ${error.message}`)
    }
  }

  /**
   * Get all connected accounts for a user
   * @param {string} userId - Teller enrollment ID
   * @returns {Promise<Array>} List of connected bank accounts
   */
  async getAccounts(userId) {
    try {
      const response = await this.client.get(`/accounts/${userId}`)
      return response.data
    } catch (error) {
      this.handleError('getAccounts', error)
    }
  }

  /**
   * Get account details by account ID
   * @param {string} accountId - Teller account ID
   * @returns {Promise<Object>} Account details including balance
   */
  async getAccountDetails(accountId) {
    try {
      const response = await this.client.get(`/accounts/${accountId}`)
      return response.data
    } catch (error) {
      this.handleError('getAccountDetails', error)
    }
  }

  /**
   * Get account balance
   * @param {string} accountId - Teller account ID
   * @returns {Promise<Object>} Current balance information
   */
  async getBalance(accountId) {
    try {
      const response = await this.client.get(`/accounts/${accountId}/balances`)
      return response.data
    } catch (error) {
      this.handleError('getBalance', error)
    }
  }

  /**
   * Get transactions for an account
   * @param {string} accountId - Teller account ID
   * @param {Object} options - Query parameters (from_id, count)
   * @returns {Promise<Array>} List of transactions
   */
  async getTransactions(accountId, options = {}) {
    try {
      const response = await this.client.get(`/accounts/${accountId}/transactions`, {
        params: options
      })
      return response.data
    } catch (error) {
      this.handleError('getTransactions', error)
    }
  }

  /**
   * Get a specific transaction by ID
   * @param {string} accountId - Teller account ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(accountId, transactionId) {
    try {
      const response = await this.client.get(`/accounts/${accountId}/transactions/${transactionId}`)
      return response.data
    } catch (error) {
      this.handleError('getTransaction', error)
    }
  }

  /**
   * Get account holder information
   * @param {string} accountId - Teller account ID
   * @returns {Promise<Object>} Account holder details
   */
  async getAccountHolder(accountId) {
    try {
      const response = await this.client.get(`/accounts/${accountId}/details`)
      return response.data
    } catch (error) {
      this.handleError('getAccountHolder', error)
    }
  }

  /**
   * Get identity information for an enrollment
   * @param {string} enrollmentId - Teller enrollment ID
   * @returns {Promise<Object>} User identity information
   */
  async getIdentity(enrollmentId) {
    try {
      const response = await this.client.get(`/enrollments/${enrollmentId}/identity`)
      return response.data
    } catch (error) {
      this.handleError('getIdentity', error)
    }
  }

  /**
   * Verify account ownership via micro-deposits
   * @param {string} accountId - Teller account ID
   * @param {Array<number>} amounts - Micro-deposit amounts in cents
   * @returns {Promise<Object>} Verification result
   */
  async verifyAccount(accountId, amounts) {
    try {
      const response = await this.client.post(`/accounts/${accountId}/verify`, {
        amounts
      })
      return response.data
    } catch (error) {
      this.handleError('verifyAccount', error)
    }
  }

  /**
   * Delete an enrollment (disconnect bank account)
   * @param {string} enrollmentId - Teller enrollment ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteEnrollment(enrollmentId) {
    try {
      const response = await this.client.delete(`/enrollments/${enrollmentId}`)
      return response.data
    } catch (error) {
      this.handleError('deleteEnrollment', error)
    }
  }

  /**
   * Get ACH payment capabilities for an account
   * @param {string} accountId - Teller account ID
   * @returns {Promise<Object>} Payment capabilities
   */
  async getPaymentCapabilities(accountId) {
    try {
      const response = await this.client.get(`/accounts/${accountId}/payment`)
      return response.data
    } catch (error) {
      this.handleError('getPaymentCapabilities', error)
    }
  }

  /**
   * Verify rent payment from transaction history
   * Useful for verifying tenant payment capability
   * @param {string} accountId - Teller account ID
   * @param {number} rentAmount - Expected monthly rent amount
   * @param {number} months - Number of months to check (default 3)
   * @returns {Promise<Object>} Verification result
   */
  async verifyRentPaymentHistory(accountId, rentAmount, months = 3) {
    try {
      const transactions = await this.getTransactions(accountId, { count: 100 })
      
      // Look for recurring payments similar to rent amount
      const rentPayments = transactions.filter(tx => 
        tx.amount && 
        Math.abs(Math.abs(tx.amount) - rentAmount) < rentAmount * 0.1 && // Within 10%
        tx.type === 'payment'
      )
      
      return {
        verified: rentPayments.length >= months,
        paymentCount: rentPayments.length,
        averageAmount: rentPayments.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / rentPayments.length || 0,
        payments: rentPayments.slice(0, 5) // Return first 5 as examples
      }
    } catch (error) {
      this.handleError('verifyRentPaymentHistory', error)
    }
  }

  /**
   * Check if account has sufficient balance for deposit + first month
   * @param {string} accountId - Teller account ID
   * @param {number} depositAmount - Security deposit amount
   * @param {number} rentAmount - First month rent amount
   * @returns {Promise<Object>} Balance verification result
   */
  async verifyMoveInFunds(accountId, depositAmount, rentAmount) {
    try {
      const balance = await this.getBalance(accountId)
      const requiredAmount = depositAmount + rentAmount
      const available = balance.available || balance.current || 0
      
      return {
        hasSufficientFunds: available >= requiredAmount,
        availableBalance: available,
        requiredAmount,
        shortfall: Math.max(0, requiredAmount - available)
      }
    } catch (error) {
      this.handleError('verifyMoveInFunds', error)
    }
  }

  /**
   * Handle API errors
   * @param {string} method - Method name where error occurred
   * @param {Error} error - Error object
   */
  handleError(method, error) {
    const errorMessage = error.response?.data?.error?.message || error.message
    const statusCode = error.response?.status
    
    console.error(`Teller API Error [${method}]:`, {
      status: statusCode,
      message: errorMessage,
      details: error.response?.data
    })
    
    throw {
      method,
      status: statusCode || 500,
      message: errorMessage,
      tellerError: error.response?.data
    }
  }
}

// Export singleton instance
export default new TellerService()
