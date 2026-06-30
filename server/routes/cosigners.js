import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { generateSecureToken } from '../utils/auth.js'
import { sendCosignerInvitation } from '../utils/email.js'

const router = express.Router()

/**
 * POST /api/cosigners/invite
 * Invite a cosigner for an application (tenant only)
 */
router.post('/invite', authenticate, async (req, res) => {
  try {
    const { applicationId, cosignerEmail, cosignerName, relationshipType } =
      req.body
    const userId = req.user.id

    // Validate required fields
    if (!applicationId || !cosignerEmail || !relationshipType) {
      return res.status(400).json({
        error: {
          message:
            'Application ID, cosigner email, and relationship type are required',
        },
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cosignerEmail)) {
      return res.status(400).json({
        error: { message: 'Invalid email address' },
      })
    }

    // Verify application exists and user is the applicant
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
          },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!application) {
      return res.status(404).json({
        error: { message: 'Application not found' },
      })
    }

    if (application.applicantId !== userId) {
      return res.status(403).json({
        error: {
          message: 'You can only invite cosigners for your own applications',
        },
      })
    }

    // Check if application already has a cosigner
    const existingCosigner = await prisma.cosigner.findFirst({
      where: {
        applicationId,
        status: { in: ['pending', 'accepted'] },
      },
    })

    if (existingCosigner) {
      return res.status(400).json({
        error: {
          message: 'This application already has a cosigner invitation',
        },
      })
    }

    // Generate invitation token (expires in 7 days)
    const inviteToken = generateSecureToken(48)
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Create cosigner invitation
    const cosigner = await prisma.cosigner.create({
      data: {
        applicationId,
        tenantId: userId,
        inviteEmail: cosignerEmail.toLowerCase(),
        inviteToken,
        tokenExpires,
        relationshipType,
        status: 'pending',
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        application: {
          include: {
            listing: {
              select: {
                title: true,
                location: true,
                price: true,
              },
            },
          },
        },
      },
    })

    // Send invitation email
    try {
      await sendCosignerInvitation({
        cosignerEmail,
        cosignerName: cosignerName || 'there',
        tenantName: `${application.applicant.firstName} ${application.applicant.lastName}`,
        listingTitle: application.listing.title,
        listingLocation: application.listing.location,
        monthlyRent: application.listing.price,
        inviteToken,
        inviteUrl: `${process.env.CLIENT_URL}/cosigner/accept/${inviteToken}`,
      })
    } catch (emailError) {
      console.error('Failed to send cosigner invitation email:', emailError)
      // Continue even if email fails - user can still use the token
    }

    res.status(201).json({
      message: 'Cosigner invitation sent successfully',
      cosigner: {
        id: cosigner.id,
        email: cosigner.inviteEmail,
        relationshipType: cosigner.relationshipType,
        status: cosigner.status,
        invitedAt: cosigner.invitedAt,
        expiresAt: cosigner.tokenExpires,
      },
      inviteUrl: `${process.env.CLIENT_URL}/cosigner/accept/${inviteToken}`,
    })
  } catch (error) {
    console.error('Invite cosigner error:', error)
    res.status(500).json({
      error: { message: 'Failed to invite cosigner' },
    })
  }
})

/**
 * GET /api/cosigners/invitation/:token
 * Get cosigner invitation details (public endpoint)
 */
router.get('/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params

    const cosigner = await prisma.cosigner.findUnique({
      where: { inviteToken: token },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            university: true,
          },
        },
        application: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
                price: true,
                images: true,
                bedrooms: true,
                bathrooms: true,
                amenities: true,
              },
            },
          },
        },
      },
    })

    if (!cosigner) {
      return res.status(404).json({
        error: { message: 'Invitation not found' },
      })
    }

    // Check if token has expired
    if (new Date() > cosigner.tokenExpires) {
      return res.status(400).json({
        error: { message: 'This invitation has expired' },
      })
    }

    // Check if already accepted or declined
    if (cosigner.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `This invitation has already been ${cosigner.status}`,
        },
      })
    }

    res.json({
      invitation: {
        id: cosigner.id,
        email: cosigner.inviteEmail,
        tenant: cosigner.tenant,
        listing: cosigner.application.listing,
        relationshipType: cosigner.relationshipType,
        monthlyRent: cosigner.application.listing.price,
        leaseStart: cosigner.application.startDate,
        leaseEnd: cosigner.application.endDate,
        invitedAt: cosigner.invitedAt,
        expiresAt: cosigner.tokenExpires,
      },
    })
  } catch (error) {
    console.error('Get invitation error:', error)
    res.status(500).json({
      error: { message: 'Failed to get invitation details' },
    })
  }
})

/**
 * POST /api/cosigners/accept/:token
 * Accept a cosigner invitation (creates/links cosigner account)
 */
router.post('/accept/:token', async (req, res) => {
  try {
    const { token } = req.params
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      // If user already has account, provide their userId
      existingUserId,
    } = req.body

    // Find the invitation
    const cosigner = await prisma.cosigner.findUnique({
      where: { inviteToken: token },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        application: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!cosigner) {
      return res.status(404).json({
        error: { message: 'Invitation not found' },
      })
    }

    // Verify token hasn't expired
    if (new Date() > cosigner.tokenExpires) {
      return res.status(400).json({
        error: { message: 'This invitation has expired' },
      })
    }

    // Check if already accepted
    if (cosigner.status === 'accepted') {
      return res.status(400).json({
        error: { message: 'This invitation has already been accepted' },
      })
    }

    let cosignerUserId

    if (existingUserId) {
      // Link existing user as cosigner
      const existingUser = await prisma.user.findUnique({
        where: { id: existingUserId },
      })

      if (!existingUser) {
        return res.status(404).json({
          error: { message: 'User not found' },
        })
      }

      // Verify email matches
      if (existingUser.email.toLowerCase() !== cosigner.inviteEmail) {
        return res.status(400).json({
          error: { message: 'Email does not match invitation' },
        })
      }

      cosignerUserId = existingUserId
    } else {
      // Create new cosigner account
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: {
            message: 'Email, password, first name, and last name are required',
          },
        })
      }

      // Verify email matches invitation
      if (email.toLowerCase() !== cosigner.inviteEmail) {
        return res.status(400).json({
          error: { message: 'Email must match the invitation email' },
        })
      }

      // Check if user already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        return res.status(400).json({
          error: {
            message:
              'An account with this email already exists. Please log in instead.',
          },
        })
      }

      // Hash password
      const { hashPassword } = await import('../utils/auth.js')
      const passwordHash = await hashPassword(password)

      // Create cosigner user account
      const newCosigner = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          userType: 'cosigner',
          firstName,
          lastName,
          phone,
          verified: true, // Auto-verify cosigners
        },
      })

      cosignerUserId = newCosigner.id
    }

    // Update cosigner record with user ID and accept status
    await prisma.cosigner.update({
      where: { id: cosigner.id },
      data: {
        cosignerId: cosignerUserId,
        status: 'accepted',
        respondedAt: new Date(),
      },
    })

    // Generate tokens for the cosigner
    const { generateTokens } = await import('../utils/auth.js')
    const user = await prisma.user.findUnique({
      where: { id: cosignerUserId },
    })
    const tokens = generateTokens(user)

    res.json({
      message: 'Cosigner invitation accepted successfully',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      tenant: {
        firstName: cosigner.tenant.firstName,
        lastName: cosigner.tenant.lastName,
      },
      applicationId: cosigner.application.id,
    })
  } catch (error) {
    console.error('Accept cosigner invitation error:', error)
    res.status(500).json({
      error: { message: 'Failed to accept invitation' },
    })
  }
})

/**
 * POST /api/cosigners/decline/:token
 * Decline a cosigner invitation
 */
router.post('/decline/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { reason } = req.body

    const cosigner = await prisma.cosigner.findUnique({
      where: { inviteToken: token },
    })

    if (!cosigner) {
      return res.status(404).json({
        error: { message: 'Invitation not found' },
      })
    }

    if (cosigner.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `This invitation has already been ${cosigner.status}`,
        },
      })
    }

    // Update status to declined
    await prisma.cosigner.update({
      where: { id: cosigner.id },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      },
    })

    // TODO: Notify tenant that cosigner declined

    res.json({
      message: 'Cosigner invitation declined',
    })
  } catch (error) {
    console.error('Decline cosigner invitation error:', error)
    res.status(500).json({
      error: { message: 'Failed to decline invitation' },
    })
  }
})

/**
 * GET /api/cosigners/application/:applicationId
 * Get cosigners for an application (applicant or owner only)
 */
router.get('/application/:applicationId', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.params
    const userId = req.user.id

    // Verify user has access to this application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return res.status(404).json({
        error: { message: 'Application not found' },
      })
    }

    if (application.applicantId !== userId && application.ownerId !== userId) {
      return res.status(403).json({
        error: {
          message:
            'You do not have permission to view cosigners for this application',
        },
      })
    }

    // Get cosigners
    const cosigners = await prisma.cosigner.findMany({
      where: { applicationId },
      include: {
        cosigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    })

    res.json({ cosigners })
  } catch (error) {
    console.error('Get cosigners error:', error)
    res.status(500).json({
      error: { message: 'Failed to get cosigners' },
    })
  }
})

/**
 * GET /api/cosigners/my-responsibilities
 * Get applications the current user is cosigning (cosigner only)
 */
router.get('/my-responsibilities', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const cosignedApplications = await prisma.cosigner.findMany({
      where: {
        cosignerId: userId,
        status: 'accepted',
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            university: true,
          },
        },
        application: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
                price: true,
                images: true,
              },
            },
            agreement: {
              select: {
                id: true,
                monthlyRent: true,
                securityDeposit: true,
                startDate: true,
                endDate: true,
                tenantSigned: true,
                landlordSigned: true,
              },
            },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    })

    res.json({
      responsibilities: cosignedApplications.map(cs => ({
        id: cs.id,
        tenant: cs.tenant,
        listing: cs.application.listing,
        agreement: cs.application.agreement,
        relationshipType: cs.relationshipType,
        acceptedAt: cs.respondedAt,
      })),
    })
  } catch (error) {
    console.error('Get cosigner responsibilities error:', error)
    res.status(500).json({
      error: { message: 'Failed to get responsibilities' },
    })
  }
})

/**
 * DELETE /api/cosigners/:cosignerId
 * Cancel/remove a cosigner invitation (tenant only, before acceptance)
 */
router.delete('/:cosignerId', authenticate, async (req, res) => {
  try {
    const { cosignerId } = req.params
    const userId = req.user.id

    const cosigner = await prisma.cosigner.findUnique({
      where: { id: cosignerId },
    })

    if (!cosigner) {
      return res.status(404).json({
        error: { message: 'Cosigner not found' },
      })
    }

    // Only tenant can cancel their own cosigner invitation
    if (cosigner.tenantId !== userId) {
      return res.status(403).json({
        error: {
          message: 'You can only cancel your own cosigner invitations',
        },
      })
    }

    // Can only cancel pending invitations
    if (cosigner.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `Cannot cancel a cosigner invitation that has been ${cosigner.status}`,
        },
      })
    }

    // Delete the invitation
    await prisma.cosigner.delete({
      where: { id: cosignerId },
    })

    res.json({
      message: 'Cosigner invitation cancelled successfully',
    })
  } catch (error) {
    console.error('Delete cosigner error:', error)
    res.status(500).json({
      error: { message: 'Failed to cancel cosigner invitation' },
    })
  }
})

/**
 * POST /api/cosigners/verify-income
 * Store the logged-in cosigner's Plaid-verified monthly income on their
 * accepted cosigner record(s). The Plaid flow runs client-side via the
 * existing /payments/plaid endpoints; this persists the result.
 */
router.post('/verify-income', authenticate, async (req, res) => {
  try {
    const { monthlyIncome } = req.body
    const income = Number(monthlyIncome)

    if (!Number.isFinite(income) || income < 0) {
      return res.status(400).json({
        error: { message: 'A valid monthly income is required' },
      })
    }

    const result = await prisma.cosigner.updateMany({
      where: { cosignerId: req.user.id, status: 'accepted' },
      data: {
        verifiedMonthlyIncome: income,
        incomeVerifiedAt: new Date(),
      },
    })

    if (result.count === 0) {
      return res.status(404).json({
        error: { message: 'No accepted cosigner record found for this user' },
      })
    }

    res.json({ verifiedMonthlyIncome: income, updated: result.count })
  } catch (error) {
    console.error('Cosigner verify-income error:', error)
    res.status(500).json({ error: { message: 'Failed to save income' } })
  }
})

export default router
