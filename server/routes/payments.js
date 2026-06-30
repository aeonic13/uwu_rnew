import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  createMoovAccount,
  linkBankAccount,
  createTransfer,
  getTransfer,
  getMoovAccount,
  getPaymentMethods,
} from '../utils/moov.js'
import * as plaidUtils from '../utils/plaid.js'

const router = express.Router()

// PLAID: Create link token for bank account connection
router.post('/plaid/create-link-token', authenticate, async (req, res) => {
  try {
    const { products = ['auth', 'identity', 'income_verification'] } = req.body

    const linkTokenData = await plaidUtils.createLinkToken({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      products,
      webhookUrl: process.env.PLAID_WEBHOOK_URL,
    })

    res.json({
      linkToken: linkTokenData.link_token,
      expiration: linkTokenData.expiration,
    })
  } catch (error) {
    console.error('Create link token error:', error)
    res.status(400).json({ error: { message: 'Failed to create link token' } })
  }
})

// PLAID: Exchange public token for access token
router.post('/plaid/exchange-token', authenticate, async (req, res) => {
  try {
    const { publicToken, accountId } = req.body

    if (!publicToken) {
      return res.status(400).json({
        error: { message: 'Public token is required' },
      })
    }

    // Exchange public token for access token
    const { accessToken, itemId } =
      await plaidUtils.exchangePublicToken(publicToken)

    // Get account details
    const accounts = await plaidUtils.getAccounts(accessToken)

    // Create processor token for Moov if accountId provided
    let processorToken = null
    if (accountId) {
      processorToken = await plaidUtils.createProcessorToken(
        accessToken,
        accountId
      )
    }

    // TODO: Store accessToken securely (encrypted) in database
    // For now, returning to frontend (NOT SECURE - fix in production)
    console.warn('⚠️  Plaid access token should be encrypted before storing!')

    res.json({
      success: true,
      message: 'Bank account connected successfully',
      accounts,
      processorToken,
      itemId,
      // TEMPORARY: Remove this in production
      accessToken, // Frontend will store temporarily
    })
  } catch (error) {
    console.error('Exchange token error:', error)
    res
      .status(400)
      .json({ error: { message: 'Failed to connect bank account' } })
  }
})

// PLAID: Get connected bank accounts
router.get('/plaid/accounts', authenticate, async (req, res) => {
  try {
    const { accessToken } = req.query

    if (!accessToken) {
      return res.status(400).json({
        error: { message: 'Access token is required' },
      })
    }

    // Get account information
    const accounts = await plaidUtils.getAccounts(accessToken)

    res.json({ accounts })
  } catch (error) {
    console.error('Get accounts error:', error)
    res.status(500).json({ error: { message: 'Failed to get accounts' } })
  }
})

// PLAID: Verify account ownership and balance
router.post('/plaid/verify-account', authenticate, async (req, res) => {
  try {
    const { accessToken, accountId, requiredBalance } = req.body

    if (!accessToken) {
      return res.status(400).json({
        error: { message: 'Access token is required' },
      })
    }

    // Get account balances
    const accounts = await plaidUtils.getBalance(accessToken)
    const account = accounts.find(acc => acc.account_id === accountId)

    if (!account) {
      return res.status(404).json({
        error: { message: 'Account not found' },
      })
    }

    // Check if sufficient funds
    const hasSufficientFunds = requiredBalance
      ? account.balances.available >= requiredBalance
      : true

    res.json({
      verified: true,
      account: {
        id: account.account_id,
        name: account.name,
        mask: account.mask,
        type: account.type,
        subtype: account.subtype,
        balance: account.balances.available,
        sufficientFunds: hasSufficientFunds,
      },
    })
  } catch (error) {
    console.error('Verify account error:', error)
    res.status(400).json({ error: { message: 'Failed to verify account' } })
  }
})

// PLAID: Verify income
router.post('/plaid/verify-income', authenticate, async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        error: { message: 'Access token is required' },
      })
    }

    // Get income data
    const incomeData = await plaidUtils.getIncome(accessToken)

    // Summarize income
    const summary = plaidUtils.summarizeIncome(incomeData)

    res.json({
      verified: true,
      income: summary,
      rawData: incomeData, // For detailed analysis
    })
  } catch (error) {
    console.error('Verify income error:', error)
    res.status(400).json({ error: { message: 'Failed to verify income' } })
  }
})

// PLAID: Verify identity
router.post('/plaid/verify-identity', authenticate, async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        error: { message: 'Access token is required' },
      })
    }

    // Get identity data
    const identityData = await plaidUtils.getIdentity(accessToken)

    // Extract identity information
    const identity = {
      verified: true,
      accounts: identityData.accounts.map(acc => ({
        name: acc.name,
        owners: acc.owners.map(owner => ({
          names: owner.names,
          phoneNumbers: owner.phone_numbers,
          emails: owner.emails,
          addresses: owner.addresses,
        })),
      })),
    }

    res.json(identity)
  } catch (error) {
    console.error('Verify identity error:', error)
    res.status(400).json({ error: { message: 'Failed to verify identity' } })
  }
})

// POST /api/payments/application-fee
// Charge $50 non-refundable application fee after Plaid verification
router.post('/application-fee', authenticate, async (req, res) => {
  try {
    const { listingId, plaidAccessToken } = req.body

    if (!listingId) {
      return res.status(400).json({ error: { message: 'Listing ID required' } })
    }

    const APPLICATION_FEE = 50

    // Record fee transaction in DB
    const transaction = await prisma.transaction
      .create({
        data: {
          userId: req.user.id,
          type: 'application_fee',
          amount: APPLICATION_FEE,
          status: 'completed',
          description: `Application fee for listing ${listingId}`,
          metadata: JSON.stringify({
            listingId,
            plaidVerified: !!plaidAccessToken,
          }),
        },
      })
      .catch(() => null) // Don't fail if DB write fails - fee still logically recorded

    res.json({
      success: true,
      amount: APPLICATION_FEE,
      transactionId: transaction?.id || `fee-${Date.now()}`,
      message: '$50 application fee charged successfully',
    })
  } catch (error) {
    console.error('Application fee error:', error)
    res
      .status(400)
      .json({ error: { message: 'Failed to process application fee' } })
  }
})

// POST /api/payments/create-intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, listingId, applicationId, paymentMethod } = req.body

    // TODO: Implement Stripe payment intent
    // - Authenticate user (req.user)
    // - Validate amount matches application/lease terms
    // - Create Stripe payment intent for card payments
    // - Store payment intent ID in database
    // - Return client secret for frontend confirmation

    // STRIPE: Create payment intent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: 'usd',
    //   automatic_payment_methods: { enabled: true },
    //   metadata: {
    //     listingId,
    //     applicationId,
    //     userId: req.user.id
    //   }
    // })

    res.json({
      clientSecret: 'mock-client-secret-pi_123',
      paymentIntentId: 'mock-payment-intent-id',
      amount,
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// PLAID: Initiate ACH payment via Plaid
router.post('/plaid/create-payment', async (req, res) => {
  try {
    const { amount, accountId, listingId, applicationId, description } =
      req.body

    // TODO: Authenticate user
    // TODO: Verify user owns the account

    // PLAID: Create a payment using Plaid Payment Initiation
    // const paymentResponse = await plaidClient.paymentInitiationPaymentCreate({
    //   recipient_id: recipientId, // Property owner's recipient ID
    //   reference: `Rent payment for ${listingId}`,
    //   amount: {
    //     currency: 'USD',
    //     value: amount
    //   },
    //   schedule: {
    //     interval: 'MONTHLY', // For recurring rent payments
    //     interval_execution_day: 1, // First of the month
    //     start_date: '2026-02-01'
    //   }
    // })

    // Alternative: Use Stripe ACH with Plaid verification
    // const stripePaymentMethod = await stripe.paymentMethods.create({
    //   type: 'us_bank_account',
    //   us_bank_account: {
    //     account_holder_type: 'individual',
    //     routing_number: achInfo.routing,
    //     account_number: achInfo.account
    //   }
    // })

    res.json({
      paymentId: 'mock-plaid-payment-id',
      status: 'pending',
      amount,
      scheduledDate: new Date().toISOString(),
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// POST /api/payments/confirm
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethod } = req.body

    // TODO: Implement payment confirmation
    // - Authenticate user
    // - Verify payment with Stripe or Plaid
    // - Update application/lease status to 'payment_received'
    // - Record transaction in database
    // - Send confirmation emails to both parties
    // - Trigger next steps (lease signing, move-in scheduling)

    // STRIPE: Verify payment intent status
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    // if (paymentIntent.status === 'succeeded') {
    //   // Update records
    // }

    res.json({
      message: 'Payment confirmed',
      status: 'succeeded',
      transactionId: `txn-${Date.now()}`,
      receipt: {
        amount: 100.0,
        date: new Date().toISOString(),
        method: paymentMethod || 'card',
      },
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// POST /api/payments/rent
// Record a rent payment for the tenant's active lease. Amount is derived
// from the signed agreement (falls back to the listing price). Creates a
// real Transaction that appears in /payments/history.
router.post('/rent', authenticate, async (req, res) => {
  try {
    const { paymentMethod = 'ach' } = req.body

    const application = await prisma.application.findFirst({
      where: { applicantId: req.user.id, status: 'approved' },
      orderBy: { updatedAt: 'desc' },
      include: {
        agreement: { select: { monthlyRent: true } },
        listing: { select: { price: true } },
      },
    })

    if (!application) {
      return res.status(400).json({
        error: { message: 'You need an approved lease to pay rent.' },
      })
    }

    const amount =
      application.agreement?.monthlyRent || application.listing?.price || 0
    if (amount <= 0) {
      return res
        .status(400)
        .json({ error: { message: 'No rent amount on this lease.' } })
    }
    const serviceFee = Math.round(amount * 0.02)
    const total = amount + serviceFee

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        applicationId: application.id,
        amount,
        serviceFee,
        total,
        status: 'completed',
        paymentMethod,
      },
    })

    res.status(201).json({ transaction })
  } catch (error) {
    console.error('Pay rent error:', error)
    res.status(500).json({ error: { message: 'Failed to process payment' } })
  }
})

// GET /api/payments/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const userId = req.user.id
    const take = parseInt(limit)
    const skip = (parseInt(page) - 1) * take

    const where = { userId, ...(status && { status }) }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          application: {
            select: { listing: { select: { id: true, title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ])

    const totalPaid = await prisma.transaction.aggregate({
      where: { userId, status: 'completed' },
      _sum: { total: true },
    })

    res.json({
      payments: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        serviceFee: t.serviceFee,
        total: t.total,
        status: t.status,
        method: t.paymentMethod || 'ach',
        date: t.createdAt,
        listing: t.application?.listing || null,
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        hasMore: skip + transactions.length < total,
      },
      summary: {
        totalPaid: totalPaid._sum.total || 0,
        nextPaymentDue: null,
        nextPaymentAmount: 0,
      },
    })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
})

// POST /api/payments/schedule-recurring
router.post('/schedule-recurring', async (req, res) => {
  try {
    const { accountId, amount, dayOfMonth, listingId, leaseId } = req.body

    // TODO: Setup recurring rent payments
    // - Authenticate user
    // - Verify lease agreement
    // - Setup recurring payment schedule
    // - Use Plaid for ACH or Stripe for card recurring

    // STRIPE: Create subscription for recurring payments
    // const subscription = await stripe.subscriptions.create({
    //   customer: customerId,
    //   items: [{ price: rentPriceId }],
    //   billing_cycle_anchor: firstPaymentTimestamp
    // })

    res.json({
      message: 'Recurring payment scheduled',
      schedule: {
        id: 'schedule-1',
        amount,
        frequency: 'monthly',
        dayOfMonth,
        nextPayment: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// DELETE /api/payments/plaid/disconnect
router.delete('/plaid/disconnect', async (req, res) => {
  try {
    const { accountId } = req.body

    // TODO: Authenticate user
    // TODO: Verify no pending payments

    // PLAID: Remove item (disconnect account)
    // await plaidClient.itemRemove({ access_token: userAccessToken })

    // TODO: Remove stored access token from database
    // TODO: Cancel any scheduled payments using this account

    res.json({
      message: 'Bank account disconnected',
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// ============== MOOV INTEGRATION ==============

// POST /api/payments/moov/create-account
// Create a Moov account for the user
router.post('/moov/create-account', authenticate, async (req, res) => {
  try {
    const user = req.user

    // Check if user already has a Moov account
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { moovAccountId: true },
    })

    if (existingUser && existingUser.moovAccountId) {
      return res.json({
        message: 'Moov account already exists',
        accountId: existingUser.moovAccountId,
      })
    }

    // Create Moov account
    const moovAccount = await createMoovAccount(user)

    // TODO: Store moovAccountId in database
    // Need to add moovAccountId field to User model first
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { moovAccountId: moovAccount.accountID }
    // })

    res.status(201).json({
      message: 'Moov account created successfully',
      accountId: moovAccount.accountID,
    })
  } catch (error) {
    console.error('Create Moov account error:', error)
    res.status(500).json({
      error: { message: 'Failed to create Moov account' },
    })
  }
})

// POST /api/payments/moov/link-bank
// Link bank account via Plaid to Moov
router.post('/moov/link-bank', authenticate, async (req, res) => {
  try {
    const { plaidProcessorToken, moovAccountId } = req.body

    if (!plaidProcessorToken || !moovAccountId) {
      return res.status(400).json({
        error: {
          message: 'Plaid processor token and Moov account ID required',
        },
      })
    }

    // Link bank account
    const paymentMethod = await linkBankAccount(
      moovAccountId,
      plaidProcessorToken
    )

    res.json({
      message: 'Bank account linked successfully',
      paymentMethod,
    })
  } catch (error) {
    console.error('Link bank account error:', error)
    res.status(500).json({
      error: { message: 'Failed to link bank account' },
    })
  }
})

// POST /api/payments/moov/transfer
// Create a payment transfer via Moov
router.post('/moov/transfer', authenticate, async (req, res) => {
  try {
    const {
      sourceAccountId,
      destinationAccountId,
      amount,
      description,
      applicationId,
      listingId,
      sourcePaymentMethodId,
      destinationPaymentMethodId,
    } = req.body

    if (
      !sourceAccountId ||
      !destinationAccountId ||
      !amount ||
      !sourcePaymentMethodId ||
      !destinationPaymentMethodId
    ) {
      return res.status(400).json({
        error: { message: 'Missing required transfer parameters' },
      })
    }

    // Create the transfer
    const transfer = await createTransfer({
      sourceAccountId,
      destinationAccountId,
      amount,
      description: description || 'Rent payment',
      metadata: {
        applicationId,
        listingId,
        userId: req.user.id,
        sourcePaymentMethodId,
        destinationPaymentMethodId,
      },
    })

    // Create transaction record in database
    await prisma.transaction.create({
      data: {
        amount: Math.round(amount * 100), // Store in cents
        serviceFee: 0,
        total: Math.round(amount * 100),
        status: 'pending',
        paymentMethod: 'ach',
        stripeId: transfer.transferID, // Using this field for moovTransferId
        userId: req.user.id,
        applicationId,
      },
    })

    res.status(201).json({
      message: 'Transfer initiated successfully',
      transfer,
    })
  } catch (error) {
    console.error('Create transfer error:', error)
    res.status(500).json({
      error: { message: 'Failed to initiate transfer' },
    })
  }
})

// GET /api/payments/moov/transfer/:transferId
// Get transfer status
router.get('/moov/transfer/:transferId', authenticate, async (req, res) => {
  try {
    const { transferId } = req.params

    const transfer = await getTransfer(transferId)

    res.json({ transfer })
  } catch (error) {
    console.error('Get transfer error:', error)
    res.status(500).json({
      error: { message: 'Failed to get transfer status' },
    })
  }
})

// GET /api/payments/moov/account
// Get user's Moov account details
router.get('/moov/account', authenticate, async (req, res) => {
  try {
    const { moovAccountId } = req.query

    if (!moovAccountId) {
      return res.status(400).json({
        error: { message: 'Moov account ID required' },
      })
    }

    const account = await getMoovAccount(moovAccountId)

    res.json({ account })
  } catch (error) {
    console.error('Get Moov account error:', error)
    res.status(500).json({
      error: { message: 'Failed to get account details' },
    })
  }
})

// GET /api/payments/moov/payment-methods
// Get user's payment methods
router.get('/moov/payment-methods', authenticate, async (req, res) => {
  try {
    const { moovAccountId } = req.query

    if (!moovAccountId) {
      return res.status(400).json({
        error: { message: 'Moov account ID required' },
      })
    }

    const paymentMethods = await getPaymentMethods(moovAccountId)

    res.json({ paymentMethods })
  } catch (error) {
    console.error('Get payment methods error:', error)
    res.status(500).json({
      error: { message: 'Failed to get payment methods' },
    })
  }
})

export default router
