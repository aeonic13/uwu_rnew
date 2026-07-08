import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import {
  assessIncome,
  assessCombinedIncome,
  DEFAULT_INCOME_MULTIPLIER,
} from '../utils/screening.js'

const router = express.Router()

/**
 * GET /api/dashboard/landlord/applications/:listingId
 * Get all applications for a specific listing with group status and payment details
 * Owner only
 */
router.get(
  '/landlord/applications/:listingId',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const { listingId } = req.params
      const ownerId = req.user.id

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
        pending: applications.filter(app => app.status === 'pending').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        withCosigners: applications.filter(app => app.cosigners.length > 0)
          .length,
        totalRevenue: applications
          .flatMap(app => app.transactions)
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
      }

      // Attach a transparent income assessment to each application using the
      // applicant's verified monthly income (captured at pre-qualification).
      const assessedApplications = applications.map(app => ({
        ...app,
        incomeAssessment: assessIncome(
          app.verificationData?.monthlyIncome,
          listing.price,
          listing.incomeMultiplier
        ),
      }))

      res.json({
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
        },
        applications: assessedApplications,
        incomeMultiplier: listing.incomeMultiplier,
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
  requireUserType('owner'),
  async (req, res) => {
    try {
      const { listingId } = req.params
      const ownerId = req.user.id

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
          app =>
            app.status === 'approved' &&
            app.agreement?.tenantSigned &&
            app.agreement?.landlordSigned
        ),
        pendingTenantSignature: applications.filter(
          app =>
            app.status === 'approved' &&
            app.agreement &&
            !app.agreement.tenantSigned
        ),
        pendingLandlordSignature: applications.filter(
          app =>
            app.status === 'approved' &&
            app.agreement?.tenantSigned &&
            !app.agreement.landlordSigned
        ),
        awaitingApproval: applications.filter(app => app.status === 'pending'),
        needsCosigner: applications.filter(
          app => app.status === 'pending' && app.cosigners.length === 0
        ),
        rejected: applications.filter(app => app.status === 'rejected'),
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
  requireUserType('owner'),
  async (req, res) => {
    try {
      const ownerId = req.user.id

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
                    gte: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    ), // This month
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Calculate rent roll
      const rentRoll = listings.map(listing => {
        const tenants = listing.applications.map(app => ({
          id: app.applicant.id,
          applicationId: app.id,
          name: `${app.applicant.firstName} ${app.applicant.lastName}`,
          email: app.applicant.email,
          monthlyRent: app.agreement?.monthlyRent || listing.price,
          leaseStart: app.agreement?.startDate,
          leaseEnd: app.agreement?.endDate,
          paidThisMonth: app.transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0),
          pendingThisMonth: app.transactions
            .filter(t => t.status === 'pending' || t.status === 'processing')
            .reduce((sum, t) => sum + t.amount, 0),
        }))

        const monthlyExpected = tenants.reduce(
          (sum, t) => sum + (t.monthlyRent || 0),
          0
        )
        const monthlyCollected = tenants.reduce(
          (sum, t) => sum + t.paidThisMonth,
          0
        )

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
            pendingCollection: tenants.reduce(
              (sum, t) => sum + t.pendingThisMonth,
              0
            ),
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
        monthlyExpected: rentRoll.reduce(
          (sum, r) => sum + r.financials.monthlyExpected,
          0
        ),
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
  requireUserType('owner'),
  async (req, res) => {
    try {
      const { applicationId } = req.params
      const ownerId = req.user.id

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
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        totalPending: application.transactions
          .filter(t => t.status === 'pending' || t.status === 'processing')
          .reduce((sum, t) => sum + t.amount, 0),
        totalFailed: application.transactions
          .filter(t => t.status === 'failed')
          .reduce((sum, t) => sum + t.amount, 0),
        paymentCount: application.transactions.filter(
          t => t.status === 'completed'
        ).length,
        lastPaymentDate: application.transactions.find(
          t => t.status === 'completed'
        )?.createdAt,
      }

      // Calculate expected vs actual
      if (application.agreement?.startDate) {
        const monthsSinceLease = Math.floor(
          (Date.now() - new Date(application.agreement.startDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
        stats.expectedTotal =
          (application.agreement.monthlyRent || 0) *
          Math.max(0, monthsSinceLease)
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

/**
 * GET /api/dashboard/landlord/inbox
 * Real application pipeline grouped by listing (one "group" per listing's
 * applicant pool), with per-applicant and combined income assessment.
 * Owner only.
 */
router.get(
  '/landlord/inbox',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const ownerId = req.user.id

      const listings = await prisma.listing.findMany({
        where: { ownerId },
        include: {
          applications: {
            where: { status: { in: ['pending', 'approved'] } },
            include: {
              applicant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  university: true,
                  year: true,
                  avatarUrl: true,
                  verified: true,
                  creditScore: true,
                  creditTier: true,
                  backgroundCheck: true,
                },
              },
              agreement: {
                select: { tenantSigned: true, landlordSigned: true },
              },
              group: { select: { id: true, name: true } },
              cosigners: {
                include: {
                  cosigner: {
                    select: { firstName: true, lastName: true, email: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Partition each listing's applications into real roommate groups
      // (shared groupId → one entry named after the group) and a pooled
      // entry for solo applicants.
      const groups = listings
        .filter(l => l.applications.length > 0)
        .flatMap(listing => {
          const byGroup = new Map()
          for (const app of listing.applications) {
            const key = app.groupId || 'solo'
            if (!byGroup.has(key)) byGroup.set(key, [])
            byGroup.get(key).push(app)
          }
          return [...byGroup.entries()].map(([key, apps]) =>
            shapeInboxGroup(
              listing,
              apps,
              key === 'solo' ? null : apps[0].group
            )
          )
        })

      function shapeInboxGroup(listing, applications, realGroup) {
        const members = applications.map(app => {
          const monthlyIncome = app.verificationData?.monthlyIncome || 0
          const cosigner = app.cosigners[0]
          const cosignerIncome = cosigner?.verifiedMonthlyIncome || 0
          // The guarantor's income qualifies the tenant — combine them.
          const effectiveIncome = monthlyIncome + cosignerIncome
          return {
            id: app.id,
            applicationId: app.id,
            name: `${app.applicant.firstName} ${app.applicant.lastName}`,
            email: app.applicant.email,
            university: app.applicant.university || null,
            applicationStatus:
              app.status === 'approved' ? 'complete' : 'pending',
            monthlyIncome,
            effectiveIncome,
            creditScore: app.applicant.creditScore ?? null,
            // Full standard-application answers (rental history,
            // employment, household, disclosures incl. criminal history).
            rentalProfile: app.verificationData?.rentalProfile || null,
            income: assessIncome(
              effectiveIncome,
              listing.price,
              listing.incomeMultiplier
            ),
            verificationData: {
              bankConnected: !!app.verificationData?.bankConnected,
              incomeVerified: !!app.verificationData?.incomeVerified,
              monthlyIncome: app.verificationData?.monthlyIncome || 0,
              identityVerified: !!app.verificationData?.identityVerified,
              applicationFeePaid: !!app.verificationData?.applicationFeePaid,
            },
            guarantor: cosigner
              ? {
                  name: cosigner.cosigner
                    ? `${cosigner.cosigner.firstName} ${cosigner.cosigner.lastName}`
                    : cosigner.inviteEmail,
                  email: cosigner.cosigner?.email || cosigner.inviteEmail,
                  monthlyIncome: cosignerIncome,
                  incomeVerified: cosignerIncome > 0,
                  verificationStatus:
                    cosigner.status === 'accepted'
                      ? 'verified'
                      : cosigner.status === 'pending'
                        ? 'invited'
                        : 'not_invited',
                }
              : null,
          }
        })

        const combined = assessCombinedIncome(
          members.map(m => m.effectiveIncome),
          listing.price,
          listing.incomeMultiplier
        )
        const allComplete = members.every(
          m => m.applicationStatus === 'complete'
        )

        return {
          id: realGroup ? `${listing.id}:${realGroup.id}` : listing.id,
          propertyId: listing.id,
          propertyTitle: listing.title,
          isRealGroup: !!realGroup,
          groupName: realGroup
            ? `${realGroup.name} (group of ${members.length})`
            : `${listing.title} — ${members.length} applicant${
                members.length === 1 ? '' : 's'
              }`,
          status: allComplete ? 'applicants_approved' : 'pending_verifications',
          submittedAt: applications.reduce(
            (earliest, a) => (a.createdAt < earliest ? a.createdAt : earliest),
            applications[0].createdAt
          ),
          members,
          combinedMonthlyIncome: combined.monthlyIncome,
          rentRequired: listing.price,
          requiredIncome: combined.requiredIncome,
          meetsRequirement: combined.meetsRequirement,
        }
      }

      // Flat individual-applications view (richer per-applicant detail).
      const avatarFor = name =>
        `https://ui-avatars.com/api/?background=fc6a03&color=fff&name=${encodeURIComponent(
          name || 'Applicant'
        )}`

      const applications = listings.flatMap(listing =>
        listing.applications.map(app => {
          const a = app.applicant
          const fullName = `${a.firstName} ${a.lastName}`
          const monthlyIncome = app.verificationData?.monthlyIncome || 0
          return {
            id: app.id,
            propertyId: listing.id,
            propertyTitle: listing.title,
            status: app.status,
            tourStatus: app.tourStatus || 'not-requested',
            tourDate: app.tourDate || null,
            messages: 0,
            lastMessage: '',
            applicant: {
              id: a.id,
              name: fullName,
              email: a.email,
              phone: a.phone || '',
              university: a.university || '',
              year: a.year || '',
              avatar: a.avatarUrl || avatarFor(fullName),
              creditScore: a.creditScore ?? null,
              creditTier: a.creditTier || null,
              verified: a.verified,
              backgroundCheck: a.backgroundCheck || null,
            },
            application: {
              moveInDate: app.startDate,
              moveOutDate: app.endDate,
              monthlyIncome,
              employmentStatus: app.employmentStatus || '',
              emergencyContact: app.emergencyContact || '',
              references: app.references || [],
              message: app.message || '',
              appliedAt: app.createdAt,
              documents: app.documents || [],
              // Universal rental application answers captured at pre-qual
              // (residence history, employment, household, disclosures).
              rentalProfile: app.verificationData?.rentalProfile || null,
              incomeAssessment: assessIncome(
                monthlyIncome,
                listing.price,
                listing.incomeMultiplier
              ),
            },
          }
        })
      )

      res.json({
        groups,
        applications,
        incomeMultiplier: DEFAULT_INCOME_MULTIPLIER,
      })
    } catch (error) {
      console.error('Get landlord inbox error:', error)
      res.status(500).json({ error: { message: 'Failed to get inbox' } })
    }
  }
)

export default router
