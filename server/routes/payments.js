import express from 'express'

const router = express.Router()

// PLAID: Create link token for bank account connection
router.post('/plaid/create-link-token', async (req, res) => {
  try {
    const { userId } = req.body

    // PLAID: Create a link token for Plaid Link initialization
    // const linkTokenResponse = await plaidClient.linkTokenCreate({
    //   user: { client_user_id: userId },
    //   client_name: 'Rentra',
    //   products: ['auth', 'transactions', 'identity'],
    //   country_codes: ['US'],
    //   language: 'en',
    //   webhook: `${process.env.API_URL}/api/webhooks/plaid`,
    //   redirect_uri: process.env.PLAID_REDIRECT_URI,
    //   account_filters: {
    //     depository: {
    //       account_subtypes: ['checking', 'savings']
    //     }
    //   }
    // })

    res.json({
      linkToken: 'mock-link-token-123',
      expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// PLAID: Exchange public token for access token
router.post('/plaid/exchange-token', async (req, res) => {
  try {
    const { publicToken } = req.body

    // PLAID: Exchange public token for access token
    // const tokenResponse = await plaidClient.itemPublicTokenExchange({
    //   public_token: publicToken
    // })
    // const accessToken = tokenResponse.access_token
    // const itemId = tokenResponse.item_id

    // TODO: Store access token securely (encrypted in database)
    // TODO: Associate with user's payment profile

    res.json({
      success: true,
      message: 'Bank account connected successfully',
      accountId: 'mock-account-id',
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// PLAID: Get connected bank accounts
router.get('/plaid/accounts', async (req, res) => {
  try {
    // TODO: Authenticate user
    // TODO: Retrieve user's stored Plaid access token

    // PLAID: Get account information
    // const accountsResponse = await plaidClient.accountsGet({
    //   access_token: userAccessToken
    // })

    res.json({
      accounts: [
        // Mock account structure
        // {
        //   id: 'acc-1',
        //   name: 'Chase Checking',
        //   mask: '1234',
        //   type: 'depository',
        //   subtype: 'checking',
        //   balances: {
        //     available: 5000.00,
        //     current: 5200.00
        //   }
        // }
      ],
    })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
})

// PLAID: Verify account ownership and balance
router.post('/plaid/verify-account', async (req, res) => {
  try {
    const { accountId } = req.body

    // PLAID: Verify account using Auth or Identity endpoints
    // const authResponse = await plaidClient.authGet({
    //   access_token: userAccessToken
    // })

    // PLAID: Check balance for rent payment verification
    // const balanceResponse = await plaidClient.accountsBalanceGet({
    //   access_token: userAccessToken
    // })

    res.json({
      verified: true,
      account: {
        id: accountId,
        verified: true,
        sufficientFunds: true,
      },
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
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

// GET /api/payments/history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query

    // TODO: Implement payment history
    // - Authenticate user (req.user)
    // - Query user's payment transactions
    // - Filter by status (pending, succeeded, failed, refunded)
    // - Filter by type (rent, deposit, application_fee, utility)
    // - Include listing and recipient information
    // - Sort by date (newest first)
    // - Implement pagination

    res.json({
      payments: [
        // Mock payment structure
        // {
        //   id: 'txn-1',
        //   amount: 1500.00,
        //   type: 'rent',
        //   status: 'succeeded',
        //   method: 'ach',
        //   date: '2026-01-01T00:00:00Z',
        //   listing: { id: 'listing-1', title: '2BR Apartment' },
        //   recipient: { name: 'John Doe' }
        // }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        hasMore: false,
      },
      summary: {
        totalPaid: 0,
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

export default router
