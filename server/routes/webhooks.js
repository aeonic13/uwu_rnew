import express from 'express'

const router = express.Router()

// PLAID: Webhook handler for Plaid events
router.post('/plaid', async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id, error } = req.body

    // TODO: Verify webhook signature/authentication
    // TODO: Process webhook based on type

    console.log('Plaid webhook received:', {
      type: webhook_type,
      code: webhook_code,
      item_id,
    })

    switch (webhook_type) {
      case 'INCOME':
        // Handle income verification webhooks
        if (webhook_code === 'INCOME_VERIFICATION_STATUS') {
          // TODO: Update application verification status
          // TODO: Notify user if verification completed
          console.log('Income verification status update')
        }
        break

      case 'TRANSACTIONS':
        // Handle transaction updates
        if (webhook_code === 'DEFAULT_UPDATE') {
          // TODO: Fetch new transactions
          // TODO: Update payment history
          console.log('New transactions available')
        }
        break

      case 'ITEM':
        // Handle item-level events
        if (webhook_code === 'ERROR') {
          // TODO: Handle item errors (e.g., re-authentication required)
          // TODO: Notify user to reconnect account
          console.log('Item error:', error)
        } else if (webhook_code === 'PENDING_EXPIRATION') {
          // TODO: Notify user that access will expire soon
          console.log('Item access expiring soon')
        }
        break

      case 'AUTH':
        // Handle Auth product webhooks
        if (webhook_code === 'AUTOMATICALLY_VERIFIED') {
          // TODO: Mark account as verified
          console.log('Account automatically verified')
        }
        break

      case 'PAYMENT_INITIATION':
        // Handle payment status updates
        if (webhook_code === 'PAYMENT_STATUS_UPDATE') {
          // TODO: Update payment status in database
          // TODO: Notify user of payment completion/failure
          console.log('Payment status update')
        }
        break

      default:
        console.log('Unhandled webhook type:', webhook_type)
    }

    // Always respond with 200 to acknowledge receipt
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: { message: error.message } })
  }
})

// PLAID: Specific webhook for income verification
router.post('/plaid/income', async (req, res) => {
  try {
    const { webhook_code, verification_status, item_id, user_id } = req.body

    // TODO: Verify webhook authenticity
    // TODO: Update application with income verification results

    // PLAID: Fetch income verification report
    // if (verification_status === 'VERIFICATION_STATUS_PROCESSING_COMPLETE') {
    //   const incomeReport = await plaidClient.incomeVerificationGet({
    //     access_token: userAccessToken
    //   })
    //   // Store income data, update application status
    // }

    console.log('Income verification webhook:', {
      code: webhook_code,
      status: verification_status,
    })

    res.json({ received: true })
  } catch (error) {
    console.error('Income webhook error:', error)
    res.status(500).json({ error: { message: error.message } })
  }
})

// STRIPE: Webhook handler for Stripe events
router.post('/stripe', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']

    // STRIPE: Verify webhook signature
    // const event = stripe.webhooks.constructEvent(
    //   req.body,
    //   sig,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // )

    const event = req.body // Mock for now

    console.log('Stripe webhook received:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        // TODO: Mark payment as successful
        // TODO: Update application/lease status
        // TODO: Send confirmation email
        console.log('Payment succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        // TODO: Mark payment as failed
        // TODO: Notify user to retry payment
        console.log('Payment failed:', event.data.object.id)
        break

      case 'customer.subscription.created':
        // TODO: Set up recurring rent payment tracking
        console.log('Subscription created:', event.data.object.id)
        break

      case 'customer.subscription.deleted':
        // TODO: Cancel recurring payment tracking
        console.log('Subscription cancelled:', event.data.object.id)
        break

      case 'invoice.payment_succeeded':
        // TODO: Record recurring payment
        // TODO: Send receipt
        console.log('Invoice paid:', event.data.object.id)
        break

      case 'invoice.payment_failed':
        // TODO: Handle failed recurring payment
        // TODO: Notify landlord and tenant
        // TODO: Apply late fees if configured
        console.log('Invoice payment failed:', event.data.object.id)
        break

      default:
        console.log('Unhandled Stripe event:', event.type)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    res.status(400).json({ error: { message: error.message } })
  }
})

export default router
