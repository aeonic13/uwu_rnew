import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * POST /api/applications
 * Submit a new application for a listing (student only)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, startDate, endDate, message, emergencyContact, verificationData } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!listingId || !startDate || !endDate) {
      return res.status(400).json({
        error: { message: 'Listing ID, start date, and end date are required' },
      })
    }

    // Check if listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!listing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    if (!listing.active) {
      return res.status(400).json({
        error: { message: 'This listing is no longer available' },
      })
    }

    // Check if user already has a pending application for this listing
    const existingApplication = await prisma.application.findFirst({
      where: {
        listingId,
        applicantId: userId,
        status: { in: ['pending', 'approved'] },
      },
    })

    if (existingApplication) {
      return res.status(400).json({
        error: { message: 'You already have an active application for this listing' },
      })
    }

    // Cannot apply to own listing
    if (listing.ownerId === userId) {
      return res.status(400).json({
        error: { message: 'You cannot apply to your own listing' },
      })
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        listingId,
        applicantId: userId,
        ownerId: listing.ownerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        message,
        emergencyContact,
        status: 'pending',
        ...(verificationData && { verificationData }),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            images: true,
          },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            university: true,
            verified: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Application submitted successfully',
      application,
    })
  } catch (error) {
    console.error('Create application error:', error)
    res.status(500).json({ error: { message: 'Failed to submit application' } })
  }
})

/**
 * GET /api/applications
 * Get applications - students see their own, owners see applications for their listings
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, listingId, page = 1, limit = 20 } = req.query
    const userId = req.user.id
    const userType = req.user.userType
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build where clause based on user type
    const where = {}

    if (userType === 'student') {
      // Students see their own applications
      where.applicantId = userId
    } else {
      // Owners see applications for their listings
      where.ownerId = userId
    }

    // Filter by status if provided
    if (status) {
      where.status = status
    }

    // Filter by listing if provided
    if (listingId) {
      where.listingId = listingId
    }

    // Get applications
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              images: true,
            },
          },
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              university: true,
              major: true,
              avatarUrl: true,
              verified: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          agreement: {
            select: {
              id: true,
              tenantSigned: true,
              landlordSigned: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.application.count({ where }),
    ])

    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + applications.length < total,
      },
    })
  } catch (error) {
    console.error('Get applications error:', error)
    res.status(500).json({ error: { message: 'Failed to get applications' } })
  }
})

/**
 * GET /api/applications/:id
 * Get a single application (applicant or listing owner only)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            location: true,
            images: true,
            amenities: true,
            bedrooms: true,
            bathrooms: true,
          },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            university: true,
            major: true,
            bio: true,
            avatarUrl: true,
            verified: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        agreement: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!application) {
      return res.status(404).json({
        error: { message: 'Application not found' },
      })
    }

    // Only applicant or owner can view
    if (application.applicantId !== userId && application.ownerId !== userId) {
      return res.status(403).json({
        error: { message: 'You do not have permission to view this application' },
      })
    }

    res.json({ application })
  } catch (error) {
    console.error('Get application error:', error)
    res.status(500).json({ error: { message: 'Failed to get application' } })
  }
})

/**
 * PUT /api/applications/:id/status
 * Update application status (owner only for approve/reject, applicant for withdraw)
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { status, message: statusMessage } = req.body
    const userId = req.user.id

    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      })
    }

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!application) {
      return res.status(404).json({
        error: { message: 'Application not found' },
      })
    }

    // Permission check
    const isOwner = application.ownerId === userId
    const isApplicant = application.applicantId === userId

    if (!isOwner && !isApplicant) {
      return res.status(403).json({
        error: { message: 'You do not have permission to update this application' },
      })
    }

    // Status transition rules
    if (status === 'approved' || status === 'rejected') {
      if (!isOwner) {
        return res.status(403).json({
          error: { message: 'Only the property owner can approve or reject applications' },
        })
      }
      if (application.status !== 'pending') {
        return res.status(400).json({
          error: { message: 'Can only approve or reject pending applications' },
        })
      }
    }

    if (status === 'cancelled') {
      if (!isApplicant) {
        return res.status(403).json({
          error: { message: 'Only the applicant can cancel their application' },
        })
      }
      if (application.status === 'approved') {
        return res.status(400).json({
          error: { message: 'Cannot cancel an approved application. Please contact the owner.' },
        })
      }
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        message: statusMessage || application.message,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
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
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // If approved, create an agreement
    if (status === 'approved') {
      await prisma.agreement.create({
        data: {
          applicationId: id,
          monthlyRent: updatedApplication.listing.price,
          securityDeposit: updatedApplication.listing.price, // Default to 1 month
          startDate: application.startDate,
          endDate: application.endDate,
          terms: {
            petPolicy: 'No pets allowed',
            utilities: 'Tenant responsible for utilities',
            lateFee: '5% after 5 days',
          },
        },
      })
    }

    res.json({
      message: `Application ${status}`,
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Update application status error:', error)
    res.status(500).json({ error: { message: 'Failed to update application status' } })
  }
})

/**
 * GET /api/applications/listing/:listingId
 * Get all applications for a specific listing (owner only)
 */
router.get('/listing/:listingId', authenticate, async (req, res) => {
  try {
    const { listingId } = req.params
    const { status } = req.query
    const userId = req.user.id

    // Verify user owns this listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return res.status(404).json({
        error: { message: 'Listing not found' },
      })
    }

    if (listing.ownerId !== userId) {
      return res.status(403).json({
        error: { message: 'You do not have permission to view applications for this listing' },
      })
    }

    // Build where clause
    const where = { listingId }
    if (status) {
      where.status = status
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            university: true,
            major: true,
            avatarUrl: true,
            verified: true,
            createdAt: true,
          },
        },
        agreement: {
          select: {
            id: true,
            tenantSigned: true,
            landlordSigned: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get counts by status
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: { listingId },
      _count: { status: true },
    })

    const counts = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
    )

    res.json({
      applications,
      counts,
      total: applications.length,
    })
  } catch (error) {
    console.error('Get listing applications error:', error)
    res.status(500).json({ error: { message: 'Failed to get applications' } })
  }
})

/**
 * DELETE /api/applications/:id
 * Withdraw/cancel an application (applicant only, if not approved)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return res.status(404).json({
        error: { message: 'Application not found' },
      })
    }

    // Only applicant can withdraw
    if (application.applicantId !== userId) {
      return res.status(403).json({
        error: { message: 'You can only withdraw your own applications' },
      })
    }

    // Cannot withdraw approved application
    if (application.status === 'approved') {
      return res.status(400).json({
        error: { message: 'Cannot withdraw an approved application. Please contact the property owner.' },
      })
    }

    // Update status to cancelled instead of deleting
    await prisma.application.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    res.json({
      message: 'Application withdrawn successfully',
    })
  } catch (error) {
    console.error('Withdraw application error:', error)
    res.status(500).json({ error: { message: 'Failed to withdraw application' } })
  }
})

/**
 * GET /api/applications/stats
 * Get application statistics for the current user
 */
router.get('/user/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.userType

    let stats = {}

    if (userType === 'student') {
      // Student stats - their applications
      const statusCounts = await prisma.application.groupBy({
        by: ['status'],
        where: { applicantId: userId },
        _count: { status: true },
      })

      stats = {
        total: statusCounts.reduce((sum, item) => sum + item._count.status, 0),
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {}),
      }
    } else {
      // Owner stats - applications for their listings
      const statusCounts = await prisma.application.groupBy({
        by: ['status'],
        where: { ownerId: userId },
        _count: { status: true },
      })

      // Count by listing
      const byListing = await prisma.application.groupBy({
        by: ['listingId'],
        where: { ownerId: userId, status: 'pending' },
        _count: { listingId: true },
      })

      stats = {
        total: statusCounts.reduce((sum, item) => sum + item._count.status, 0),
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {}),
        pendingByListing: byListing.length,
      }
    }

    res.json({ stats })
  } catch (error) {
    console.error('Get application stats error:', error)
    res.status(500).json({ error: { message: 'Failed to get statistics' } })
  }
})

export default router
