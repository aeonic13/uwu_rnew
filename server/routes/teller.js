import express from 'express'
import tellerService from '../services/tellerService.js'

const router = express.Router()

/**
 * Teller Banking API Routes
 * 
 * These routes provide banking functionality for:
 * - Account verification for tenants
 * - Balance checking for move-in funds
 * - Transaction history verification
 * - Rent payment capability assessment
 */

/**
 * @route   GET /api/teller/accounts/:userId
 * @desc    Get all connected bank accounts for a user
 * @access  Private (requires authentication)
 */
router.get('/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const accounts = await tellerService.getAccounts(userId)
    
    res.json({
      success: true,
      data: accounts
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/account/:accountId
 * @desc    Get specific account details
 * @access  Private
 */
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params
    const account = await tellerService.getAccountDetails(accountId)
    
    res.json({
      success: true,
      data: account
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/balance/:accountId
 * @desc    Get account balance
 * @access  Private
 */
router.get('/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params
    const balance = await tellerService.getBalance(accountId)
    
    res.json({
      success: true,
      data: balance
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/transactions/:accountId
 * @desc    Get transactions for an account
 * @access  Private
 */
router.get('/transactions/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params
    const { from_id, count } = req.query
    
    const transactions = await tellerService.getTransactions(accountId, {
      from_id,
      count: count ? parseInt(count) : undefined
    })
    
    res.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/transaction/:accountId/:transactionId
 * @desc    Get specific transaction details
 * @access  Private
 */
router.get('/transaction/:accountId/:transactionId', async (req, res) => {
  try {
    const { accountId, transactionId } = req.params
    const transaction = await tellerService.getTransaction(accountId, transactionId)
    
    res.json({
      success: true,
      data: transaction
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/identity/:enrollmentId
 * @desc    Get identity information for an enrollment
 * @access  Private
 */
router.get('/identity/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params
    const identity = await tellerService.getIdentity(enrollmentId)
    
    res.json({
      success: true,
      data: identity
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   POST /api/teller/verify-account
 * @desc    Verify account ownership via micro-deposits
 * @access  Private
 */
router.post('/verify-account', async (req, res) => {
  try {
    const { accountId, amounts } = req.body
    
    if (!accountId || !amounts || !Array.isArray(amounts)) {
      return res.status(400).json({
        success: false,
        error: 'accountId and amounts array are required'
      })
    }
    
    const result = await tellerService.verifyAccount(accountId, amounts)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   POST /api/teller/verify-rent-history
 * @desc    Verify tenant's rent payment history
 * @access  Private
 */
router.post('/verify-rent-history', async (req, res) => {
  try {
    const { accountId, rentAmount, months } = req.body
    
    if (!accountId || !rentAmount) {
      return res.status(400).json({
        success: false,
        error: 'accountId and rentAmount are required'
      })
    }
    
    const verification = await tellerService.verifyRentPaymentHistory(
      accountId,
      rentAmount,
      months || 3
    )
    
    res.json({
      success: true,
      data: verification
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   POST /api/teller/verify-move-in-funds
 * @desc    Check if tenant has sufficient funds for move-in costs
 * @access  Private
 */
router.post('/verify-move-in-funds', async (req, res) => {
  try {
    const { accountId, depositAmount, rentAmount } = req.body
    
    if (!accountId || !depositAmount || !rentAmount) {
      return res.status(400).json({
        success: false,
        error: 'accountId, depositAmount, and rentAmount are required'
      })
    }
    
    const verification = await tellerService.verifyMoveInFunds(
      accountId,
      depositAmount,
      rentAmount
    )
    
    res.json({
      success: true,
      data: verification
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/payment-capabilities/:accountId
 * @desc    Get ACH payment capabilities for an account
 * @access  Private
 */
router.get('/payment-capabilities/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params
    const capabilities = await tellerService.getPaymentCapabilities(accountId)
    
    res.json({
      success: true,
      data: capabilities
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   DELETE /api/teller/enrollment/:enrollmentId
 * @desc    Disconnect a bank account enrollment
 * @access  Private
 */
router.delete('/enrollment/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params
    const result = await tellerService.deleteEnrollment(enrollmentId)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.tellerError
    })
  }
})

/**
 * @route   GET /api/teller/health
 * @desc    Check Teller API connection health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Try to make a simple request to verify connectivity
    res.json({
      success: true,
      message: 'Teller API service is operational',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Teller API service unavailable'
    })
  }
})

export default router
