import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  generateSecureToken,
  verifyPassword,
  verifyToken,
  extractTokenFromHeader,
} from '../utils/auth.js'
import {
  sendCosignerInvitation,
  sendCosignerDeclinedEmail,
  sendCosignerAcceptedEmail,
} from '../utils/email.js'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Fresh token + 7-day expiry for a new or re-sent invitation. */
function newInviteToken() {
  return {
    inviteToken: generateSecureToken(48),
    tokenExpires: new Date(Date.now() + INVITE_TTL_MS),
  }
}

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

    // applicationId is OPTIONAL: without one this is a "floating" invite
    // made at pre-qualification, automatically attached to every
    // application the tenant later submits.
    if (!cosignerEmail || !relationshipType) {
      return res.status(400).json({
        error: {
          message: 'Cosigner email and relationship type are required',
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

    let application = null
    if (applicationId) {
      // Verify application exists and user is the applicant
      application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          listing: {
            select: { id: true, title: true, location: true, price: true },
          },
          applicant: {
            select: { id: true, firstName: true, lastName: true, email: true },
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
    }

    // One active cosigner per application / per floating pre-qual slot.
    const existingCosigner = await prisma.cosigner.findFirst({
      where: {
        applicationId: applicationId || null,
        ...(applicationId ? {} : { tenantId: userId }),
        status: { in: ['pending', 'accepted'] },
      },
    })

    if (existingCosigner) {
      return res.status(400).json({
        error: {
          message: applicationId
            ? 'This application already has a cosigner invitation'
            : 'You already have an active cosigner invitation',
        },
      })
    }

    // Generate invitation token (expires in 7 days)
    const { inviteToken, tokenExpires } = newInviteToken()

    // Create cosigner invitation
    const cosigner = await prisma.cosigner.create({
      data: {
        applicationId: applicationId || null,
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
        tenantName: `${req.user.firstName} ${req.user.lastName}`,
        // Floating pre-qual invites have no listing; the template renders a
        // "backs every application" box instead of property details.
        listingTitle: application?.listing?.title || null,
        listingLocation: application?.listing?.location || null,
        monthlyRent: application?.listing?.price ?? null,
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
 * GET /api/cosigners/mine
 * The tenant's floating (pre-qualification) cosigner invites — the ones
 * that auto-attach to every application they submit.
 */
router.get('/mine', authenticate, async (req, res) => {
  try {
    const cosigners = await prisma.cosigner.findMany({
      where: { tenantId: req.user.id, applicationId: null },
      orderBy: { invitedAt: 'desc' },
      include: {
        cosigner: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })
    res.json({
      cosigners: cosigners.map(c => ({
        id: c.id,
        email: c.inviteEmail,
        name: c.cosigner
          ? `${c.cosigner.firstName} ${c.cosigner.lastName}`
          : null,
        relationshipType: c.relationshipType,
        status: c.status,
        verifiedMonthlyIncome: c.verifiedMonthlyIncome,
        invitedAt: c.invitedAt,
        expiresAt: c.tokenExpires,
      })),
    })
  } catch (error) {
    console.error('Get my cosigners error:', error)
    res.status(500).json({ error: { message: 'Failed to get cosigners' } })
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

    // If the invited email already belongs to a Rentra user (a parent who
    // is also a landlord, say) the accept page asks them to sign in rather
    // than create a duplicate account.
    const existingAccount = await prisma.user.findUnique({
      where: { email: cosigner.inviteEmail },
      select: { id: true },
    })

    res.json({
      invitation: {
        id: cosigner.id,
        email: cosigner.inviteEmail,
        hasAccount: Boolean(existingAccount),
        tenant: cosigner.tenant,
        // Floating (pre-qualification) invites have no application yet.
        listing: cosigner.application?.listing || null,
        relationshipType: cosigner.relationshipType,
        monthlyRent: cosigner.application?.listing?.price || null,
        leaseStart: cosigner.application?.startDate || null,
        leaseEnd: cosigner.application?.endDate || null,
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
 * Accept a cosigner invitation.
 *
 * Two paths, chosen by whether the invited email already has an account:
 *  - New account: body carries firstName/lastName/password (+ optional
 *    phone); a `cosigner` user is created.
 *  - Existing account: the caller proves ownership either with a valid
 *    session token for that user (Authorization header) or with the
 *    account password in the body. No new user is created and their
 *    userType is left alone.
 */
router.post('/accept/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { email, password, firstName, lastName, phone } = req.body

    // Find the invitation
    const cosigner = await prisma.cosigner.findUnique({
      where: { inviteToken: token },
      include: {
        tenant: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        application: {
          select: {
            id: true,
            listing: { select: { title: true } },
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

    const existingUser = await prisma.user.findUnique({
      where: { email: cosigner.inviteEmail },
    })

    if (existingUser) {
      // Existing account: session token for that user, or their password.
      let authorised = false
      const bearer = extractTokenFromHeader(req.headers.authorization)
      if (bearer) {
        const decoded = verifyToken(bearer)
        authorised = decoded?.userId === existingUser.id
      }
      if (!authorised && password) {
        authorised = await verifyPassword(password, existingUser.passwordHash)
      }
      if (!authorised) {
        // 403 rather than 401: the web client drops its stored session on
        // any 401, which would silently sign out a different logged-in user
        // who simply mistyped the invitee's password.
        return res.status(403).json({
          error: {
            message:
              'This email already has a Rentra account. Enter the password for that account to accept.',
            code: 'EXISTING_ACCOUNT',
          },
        })
      }

      cosignerUserId = existingUser.id
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

    // Atomically accept: only flips if still pending, so two concurrent
    // accepts can't both succeed (check-then-update race).
    const accepted = await prisma.cosigner.updateMany({
      where: { id: cosigner.id, status: 'pending' },
      data: {
        cosignerId: cosignerUserId,
        status: 'accepted',
        respondedAt: new Date(),
      },
    })
    if (accepted.count === 0) {
      return res.status(400).json({
        error: { message: 'This invitation has already been responded to' },
      })
    }

    // Cascade: also accept any application-bound clones of this invite
    // (floating pre-qual cosigners are cloned onto each application the
    // tenant submits — same tenant + same invited email).
    await prisma.cosigner.updateMany({
      where: {
        tenantId: cosigner.tenantId,
        inviteEmail: cosigner.inviteEmail,
        status: 'pending',
      },
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

    // Tell the tenant. Failure here must not fail the accept.
    try {
      await sendCosignerAcceptedEmail(
        cosigner.tenant,
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        cosigner.application?.listing?.title || null
      )
    } catch (emailError) {
      console.error('Failed to send cosigner accepted email:', emailError)
    }

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
      applicationId: cosigner.application?.id || null,
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

    // Notify the tenant so they can invite someone else.
    try {
      const withTenant = await prisma.cosigner.findUnique({
        where: { id: cosigner.id },
        include: {
          tenant: { select: { email: true, firstName: true } },
        },
      })
      if (withTenant?.tenant) {
        await sendCosignerDeclinedEmail(
          withTenant.tenant,
          withTenant.inviteEmail
        )
      }
    } catch (emailError) {
      console.error('Failed to send decline notification:', emailError)
    }

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
      // application is null for a floating pre-qual cosigner (backs every
      // application the tenant submits), so everything below is optional.
      responsibilities: cosignedApplications.map(cs => ({
        id: cs.id,
        tenant: cs.tenant,
        listing: cs.application?.listing || null,
        application: cs.application
          ? {
              id: cs.application.id,
              status: cs.application.status,
              startDate: cs.application.startDate,
              endDate: cs.application.endDate,
            }
          : null,
        agreement: cs.application?.agreement || null,
        relationshipType: cs.relationshipType,
        acceptedAt: cs.respondedAt,
        verifiedMonthlyIncome: cs.verifiedMonthlyIncome,
        incomeVerifiedAt: cs.incomeVerifiedAt,
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
 * POST /api/cosigners/resend/:cosignerId
 * Tenant re-sends a pending invitation. The token is rotated with a fresh
 * 7-day expiry, so the previous link stops working. Rate-limited in
 * index.js alongside the other cosigner token routes.
 */
router.post('/resend/:cosignerId', authenticate, async (req, res) => {
  try {
    const cosigner = await prisma.cosigner.findUnique({
      where: { id: req.params.cosignerId },
      include: {
        application: {
          include: {
            listing: { select: { title: true, location: true, price: true } },
          },
        },
      },
    })
    if (!cosigner) {
      return res.status(404).json({ error: { message: 'Cosigner not found' } })
    }
    if (cosigner.tenantId !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You can only resend your own cosigner invitations' },
      })
    }
    if (cosigner.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `Cannot resend an invitation that has been ${cosigner.status}`,
        },
      })
    }

    const fresh = newInviteToken()
    const updated = await prisma.cosigner.update({
      where: { id: cosigner.id },
      data: { ...fresh, invitedAt: new Date() },
    })
    const inviteUrl = `${process.env.CLIENT_URL}/cosigner/accept/${fresh.inviteToken}`

    let emailSent = false
    try {
      const result = await sendCosignerInvitation({
        cosignerEmail: cosigner.inviteEmail,
        cosignerName: 'there',
        tenantName: `${req.user.firstName} ${req.user.lastName}`,
        listingTitle: cosigner.application?.listing?.title || null,
        listingLocation: cosigner.application?.listing?.location || null,
        monthlyRent: cosigner.application?.listing?.price ?? null,
        inviteUrl,
      })
      emailSent = Boolean(result?.success)
    } catch (emailError) {
      console.error('Failed to resend cosigner invitation:', emailError)
    }

    res.json({
      message: emailSent
        ? 'Invitation resent'
        : 'Invitation refreshed, but the email could not be sent',
      emailSent,
      cosigner: {
        id: updated.id,
        email: updated.inviteEmail,
        status: updated.status,
        invitedAt: updated.invitedAt,
        expiresAt: updated.tokenExpires,
      },
    })
  } catch (error) {
    console.error('Resend cosigner invitation error:', error)
    res.status(500).json({ error: { message: 'Failed to resend invitation' } })
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
