import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * GET /api/dashboard/landlord/applications/:listingId
 * Get all applications for a specific listing with group status and payment details
 * Owner only
 */
router.get(
  '/landlord/applications/:listingId',
  authenticate,
  requireRole('owner'),
  async (req, res) => {
    try {
      const { listingId } = req.params
      const ownerId = req.user.userId

      // Verify listing belongs to this owner
      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          ownerId,
        },
      })

      if (!listing) {
        return res.status(404).json({
          error: { message: 'Listing not found or unauthorized' },
        })
      }

      // Get all applications for this listing
      const applications = await prisma.application.findMany({
        where: { listingId },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              university: true,
              verified: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5, // Last 5 transactions
          },
          agreement: true,
          cosigners: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Calculate group statistics
      const stats = {
        total: applications.length,
        pending: applications.filter((app) => app.status === 'pending').length,
        approved: applications.filter((app) => app.status === 'approved').length,
        rejected: applications.filter((app) => app.status === 'rejected').length,
        withCosigners: applications.filter((app) => app.cosigners.length > 0).length,
        totalRevenue: applications
          .flatMap((app) => app.transactions)
          .filter((t) => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
      }

      res.json({
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
        },
        applications,
        stats,
      })
    } catch (error) {
      console.error('Get listing applications error:', error)
      res.status(500).json({
        error: { message: 'Failed to get applications' },
      })
    }
  }
)

/**
 * GET /api/dashboard/landlord/group-status/:listingId
 * Get detailed group application breakdown for a listing
 * Shows which applicants are part of groups, pending approvals, etc.
 * Owner only
 */
router.get(
  '/landlord/group-status/:listingId',
  authenticate,
  requireRole('owner'),
  async (req, res) => {
    try {
      const { listingId } = req.params
      const ownerId = req.user.userId

      // Verify ownership
      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          ownerId,
        },
      })

      if (!listing) {
        return res.status(404).json({
          error: { message: 'Listing not found or unauthorized' },
        })
      }

      // Get applications with detailed group info
      const applications = await prisma.application.findMany({
        where: { listingId },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          agreement: {
            select: {
              id: true,
              tenantSigned: true,
              landlordSigned: true,
              monthlyRent: true,
            },
          },
          cosigners: {
            include: {
              cosigner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      // Group applications by status and agreement state
      const breakdown = {
        readyForMove: applications.filter(
          (app) =>
            app.status === 'approved' &&
            app.agreement?.tenantSigned &&
            app.agreement?.landlordSigned
        ),
        pendingTenantSignature: applications.filter(
          (app) =>
            app.status === 'approved' &&
            app.agreement &&
            !app.agreement.tenantSigned
        ),
        pendingLandlordSignature: applications.filter(
          (app) =>
            app.status === 'approved' &&
            app.agreement?.tenantSigned &&
            !app.agreement.landlordSigned
        ),
        awaitingApproval: applications.filter((app) => app.status === 'pending'),
        needsCosigner: applications.filter(
          (app) => app.status === 'pending' && app.cosigners.length === 0
        ),
        rejected: applications.filter((app) => app.status === 'rejected'),
      }

      res.json({
        listing: {
          id: listing.id,
          title: listing.title,
          bedrooms: listing.bedrooms,
        },
        breakdown,
        summary: {
          total: applications.length,
          readyToMove: breakdown.readyForMove.length,
          awaitingSignatures:
            breakdown.pendingTenantSignature.length +
            breakdown.pendingLandlordSignature.length,
          needsReview: breakdown.awaitingApproval.length,
        },
      })
    } catch (error) {
      console.error('Get group status error:', error)
      res.status(500).json({
        error: { message: 'Failed to get group status' },
      })
    }
  }
)

/**
 * GET /api/dashboard/landlord/rent-roll
 * Get aggregate view of all landlord properties with tenant and payment summaries
 * Owner only
 */
router.get(
  '/landlord/rent-roll',
  authenticate,
  requireRole('owner'),
  async (req, res) => {
    try {
      const ownerId = req.user.userId

      // Get all listings with approved applications
      const listings = await prisma.listing.findMany({
        where: { ownerId },
        include: {
          applications: {
            where: { status: 'approved' },
            include: {
              applicant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              agreement: {
                select: {
                  monthlyRent: true,
                  startDate: true,
                  endDate: true,
                },
              },
              transactions: {
                where: {
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This month
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Calculate rent roll
      const rentRoll = listings.map((listing) => {
        const tenants = listing.applications.map((app) => ({
          id: app.applicant.id,
          name: `${app.applicant.firstName} ${app.applicant.lastName}`,
          email: app.applicant.email,
          monthlyRent: app.agreement?.monthlyRent || listing.price,
          leaseStart: app.agreement?.startDate,
          leaseEnd: app.agreement?.endDate,
          paidThisMonth: app.transactions
            .filter((t) => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0),
          pendingThisMonth: app.transactions
            .filter((t) => t.status === 'pending' || t.status === 'processing')
            .reduce((sum, t) => sum + t.amount, 0),
        }))

        const monthlyExpected = tenants.reduce(
          (sum, t) => sum + (t.monthlyRent || 0),
          0
        )
        const monthlyCollected = tenants.reduce((sum, t) => sum + t.paidThisMonth, 0)

        return {
          listing: {
            id: listing.id,
            title: listing.title,
            address: listing.location,
          },
          tenants,
          occupancy: `${tenants.length}/${listing.bedrooms}`,
          financials: {
            monthlyExpected,
            monthlyCollected,
            pendingCollection: tenants.reduce((sum, t) => sum + t.pendingThisMonth, 0),
            collectionRate:
              monthlyExpected > 0
                ? ((monthlyCollected / monthlyExpected) * 100).toFixed(1)
                : '0',
          },
        }
      })

      // Calculate portfolio totals
      const totals = {
        properties: listings.length,
        totalUnits: listings.reduce((sum, l) => sum + l.bedrooms, 0),
        occupiedUnits: rentRoll.reduce((sum, r) => sum + r.tenants.length, 0),
        monthlyExpected: rentRoll.reduce((sum, r) => sum + r.financials.monthlyExpected, 0),
        monthlyCollected: rentRoll.reduce(
          (sum, r) => sum + r.financials.monthlyCollected,
          0
        ),
        pendingCollection: rentRoll.reduce(
          (sum, r) => sum + r.financials.pendingCollection,
          0
        ),
      }

      totals.occupancyRate =
        totals.totalUnits > 0
          ? ((totals.occupiedUnits / totals.totalUnits) * 100).toFixed(1)
          : '0'

      res.json({
        rentRoll,
        totals,
        month: new Date().toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      })
    } catch (error) {
      console.error('Get rent roll error:', error)
      res.status(500).json({
        error: { message: 'Failed to get rent roll' },
      })
    }
  }
)

/**
 * GET /api/dashboard/landlord/payment-status/:applicationId
 * Get detailed payment history for a specific application
 * Owner only
 */
router.get(
  '/landlord/payment-status/:applicationId',
  authenticate,
  requireRole('owner'),
  async (req, res) => {
    try {
      const { applicationId } = req.params
      const ownerId = req.user.userId

      // Get application with payment details
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          ownerId,
        },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          agreement: {
            select: {
              monthlyRent: true,
              securityDeposit: true,
              startDate: true,
              endDate: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!application) {
        return res.status(404).json({
          error: { message: 'Application not found or unauthorized' },
        })
      }

      // Calculate payment statistics
      const stats = {
        totalPaid: application.transactions
          .filter((t) => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        totalPending: application.transactions
          .filter((t) => t.status === 'pending' || t.status === 'processing')
          .reduce((sum, t) => sum + t.amount, 0),
        totalFailed: application.transactions
          .filter((t) => t.status === 'failed')
          .reduce((sum, t) => sum + t.amount, 0),
        paymentCount: application.transactions.filter((t) => t.status === 'completed')
          .length,
        lastPaymentDate: application.transactions.find((t) => t.status === 'completed')
          ?.createdAt,
      }

      // Calculate expected vs actual
      if (application.agreement?.startDate) {
        const monthsSinceLease = Math.floor(
          (Date.now() - new Date(application.agreement.startDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
        stats.expectedTotal =
          (application.agreement.monthlyRent || 0) * Math.max(0, monthsSinceLease)
        stats.balance = stats.expectedTotal - stats.totalPaid
      }

      res.json({
        application: {
          id: application.id,
          status: application.status,
          startDate: application.startDate,
          endDate: application.endDate,
        },
        tenant: application.applicant,
        listing: application.listing,
        agreement: application.agreement,
        transactions: application.transactions,
        stats,
      })
    } catch (error) {
      console.error('Get payment status error:', error)
      res.status(500).json({
        error: { message: 'Failed to get payment status' },
      })
    }
  }
)

export default router
