import express from 'express'

const router = express.Router()

// POST /api/applications
router.post('/', async (req, res) => {
  try {
    const applicationData = req.body

    // TODO: Implement application submission
    // - Authenticate user (req.user from JWT middleware)
    // - Validate application data (income, credit score, references)
    // - Process documents (ID, pay stubs, etc.)
    // - Store in database
    // - Notify property owner via email/push notification

    // PLAID: Verify income using Plaid Income verification
    // const plaidIncomeVerification = await plaidClient.incomeVerification.create({
    //   access_token: applicationData.plaidAccessToken,
    //   webhook: process.env.PLAID_WEBHOOK_URL
    // })

    const mockApplication = {
      id: `app-${Date.now()}`,
      ...applicationData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      verifications: {
        income: 'pending', // Will be 'verified' after Plaid check
        identity: 'pending',
        background: 'pending',
      },
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: mockApplication,
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// GET /api/applications (list user's applications)
router.get('/', async (req, res) => {
  try {
    const { status, listingId } = req.query

    // TODO: Implement get applications list
    // - Authenticate user
    // - Query applications by user (student view) or by listing (owner view)
    // - Filter by status if provided
    // - Include listing details and applicant info

    res.json({
      applications: [],
      total: 0,
    })
  } catch (error) {
    res.status(500).json({ error: { message: error.message } })
  }
})

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // TODO: Implement get application details
    // - Authenticate user (owner or applicant only)
    // - Fetch application with all details
    // - Include verification statuses
    // - Include Plaid income report if available

    res.json({
      application: {
        id,
        status: 'pending',
        listingId: 'mock-listing-id',
        applicantId: 'mock-user-id',
        submittedAt: new Date().toISOString(),
        verifications: {
          income: 'verified',
          identity: 'verified',
          background: 'pending',
        },
      },
    })
  } catch (error) {
    res.status(404).json({ error: { message: 'Application not found' } })
  }
})

// PUT /api/applications/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, message, rejectionReason } = req.body

    // TODO: Implement status update
    // - Authenticate owner (verify they own the listing)
    // - Validate status transition (pending -> approved/rejected)
    // - Update application status in database
    // - If approved, initiate lease agreement generation
    // - Send notification to applicant (email + push)
    // - Log status change for audit trail

    const validStatuses = ['pending', 'approved', 'rejected', 'withdrawn']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } })
    }

    res.json({
      message: 'Application status updated',
      application: {
        id,
        status,
        updatedAt: new Date().toISOString(),
        statusMessage: message,
      },
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// POST /api/applications/:id/verify-income
router.post('/:id/verify-income', async (req, res) => {
  try {
    const { id } = req.params
    const { publicToken } = req.body

    // PLAID: Exchange public token for access token
    // const tokenResponse = await plaidClient.itemPublicTokenExchange({
    //   public_token: publicToken
    // })
    // const accessToken = tokenResponse.access_token

    // PLAID: Request income verification
    // const incomeVerification = await plaidClient.incomeVerificationCreate({
    //   access_token: accessToken,
    //   webhook: `${process.env.API_URL}/api/webhooks/plaid/income`
    // })

    // TODO: Store access token securely (encrypted)
    // TODO: Update application with verification request ID
    // TODO: Handle webhook callback when verification completes

    res.json({
      message: 'Income verification initiated',
      verificationId: 'mock-verification-id',
      status: 'pending',
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// POST /api/applications/:id/documents
router.post('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params
    // Assuming file upload middleware (multer) processes req.files

    // TODO: Implement document upload
    // - Authenticate user (applicant only)
    // - Validate file types (PDF, JPG, PNG)
    // - Scan for malware
    // - Upload to S3/Cloudinary
    // - Store document references in database
    // - Update application documents list

    res.status(201).json({
      message: 'Documents uploaded successfully',
      documents: [
        {
          id: 'doc-1',
          type: 'id_verification',
          uploadedAt: new Date().toISOString(),
        },
      ],
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

// DELETE /api/applications/:id (withdraw application)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // TODO: Implement application withdrawal
    // - Authenticate user (applicant only)
    // - Verify application is not already approved
    // - Update status to 'withdrawn'
    // - Notify property owner
    // - Refund application fee if applicable

    res.json({
      message: 'Application withdrawn successfully',
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message } })
  }
})

export default router
