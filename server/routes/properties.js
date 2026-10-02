import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import { assessIncome } from '../utils/screening.js'
import { withMapPosition } from '../utils/geocode.js'
import {
  leasesOf,
  leaseFullySigned,
  leaseIsCurrent,
  summarizeProperty,
  portfolioTotals,
  collectedThisMonth,
} from '../utils/portfolio.js'

/**
 * Landlord property workspace. One property = one Listing; everything a
 * landlord manages for it (tenants, applications, maintenance, documents,
 * expenses) is read here in one call per screen. Owner only.
 */
const router = express.Router()

const PERSON = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  university: true,
  verified: true,
  avatarUrl: true,
}

/**
 * GET /api/properties
 * Every listing the landlord owns with a card summary, plus portfolio totals.
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            applicantId: true,
            agreementId: true,
            agreement: {
              select: {
                id: true,
                monthlyRent: true,
                startDate: true,
                endDate: true,
                tenantSigned: true,
                landlordSigned: true,
                signers: { select: { userId: true, signed: true } },
              },
            },
            transactions: {
              select: { amount: true, status: true, createdAt: true },
            },
          },
        },
        maintenanceTickets: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const properties = listings.map(l => summarizeProperty(l))
    res.json({ properties, totals: portfolioTotals(properties) })
  } catch (error) {
    console.error('List properties error:', error)
    res.status(500).json({ error: { message: 'Failed to load properties' } })
  }
})

/**
 * GET /api/properties/:id
 * Full workspace for one property.
 */
router.get('/:id', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: {
        _count: { select: { favorites: true } },
        applications: {
          include: {
            applicant: { select: PERSON },
            cosigners: {
              select: {
                id: true,
                status: true,
                cosigner: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
            transactions: {
              select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            agreement: {
              include: {
                signers: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true },
                    },
                  },
                },
                deposit: {
                  select: {
                    id: true,
                    status: true,
                    amountHeld: true,
                    moveOutDate: true,
                    refundDeadline: true,
                    refundAmount: true,
                  },
                },
                rentSplit: {
                  select: {
                    splitMode: true,
                    total: true,
                    shares: {
                      select: { userId: true, name: true, amount: true },
                    },
                  },
                },
                autopays: {
                  select: {
                    userId: true,
                    status: true,
                    amount: true,
                    dayOfMonth: true,
                    nextRunAt: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        maintenanceTickets: {
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        expenses: {
          where: { date: { gte: yearStart } },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!listing) {
      return res.status(404).json({ error: { message: 'Property not found' } })
    }

    const {
      applications,
      maintenanceTickets,
      documents,
      expenses,
      _count,
      ...listingFields
    } = listing

    // Leases: one per Agreement, with every household member's signature,
    // rent share, autopay and this-month payments laid out.
    const leases = leasesOf(applications).map(ag => {
      const members = applications
        .filter(a => a.agreementId === ag.id)
        .map(a => {
          const signer = ag.signers.find(s => s.userId === a.applicantId)
          const share = ag.rentSplit?.shares.find(
            s => s.userId === a.applicantId
          )
          const autopay = ag.autopays.find(p => p.userId === a.applicantId)
          return {
            applicationId: a.id,
            user: a.applicant,
            signed: Boolean(signer?.signed),
            signedAt: signer?.signedAt || null,
            share: share ? Math.round(share.amount) : null,
            autopay: autopay
              ? {
                  status: autopay.status,
                  amount: autopay.amount,
                  dayOfMonth: autopay.dayOfMonth,
                  nextRunAt: autopay.nextRunAt,
                }
              : null,
            paidThisMonth: collectedThisMonth(a.transactions, now),
            recentPayments: a.transactions.slice(0, 5),
          }
        })
      const landlord = ag.signers.find(s => s.role === 'landlord')
      return {
        id: ag.id,
        monthlyRent: ag.monthlyRent,
        securityDeposit: ag.securityDeposit,
        startDate: ag.startDate,
        endDate: ag.endDate,
        documentUrl: ag.documentUrl,
        fullySigned: leaseFullySigned(ag),
        current: leaseIsCurrent(ag, now),
        landlordSigned: Boolean(landlord?.signed ?? ag.landlordSigned),
        members,
        deposit: ag.deposit,
        rentSplit: ag.rentSplit
          ? { splitMode: ag.rentSplit.splitMode, total: ag.rentSplit.total }
          : null,
      }
    })

    // Applications: the screening-relevant facts, no raw Plaid payloads.
    const applicationRows = applications.map(a => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      startDate: a.startDate,
      endDate: a.endDate,
      message: a.message,
      groupId: a.groupId,
      agreementId: a.agreementId,
      applicant: a.applicant,
      cosigners: a.cosigners,
      voucherAmount: a.voucherAmount,
      screeningReportId: a.screeningReportId,
      incomeAssessment: assessIncome(
        a.verificationData?.monthlyIncome,
        listing.price,
        listing.incomeMultiplier
      ),
    }))

    const summary = summarizeProperty(listing, now)
    const stats = {
      status: summary.status,
      tenants: summary.tenants,
      pendingApplications: summary.pendingApplications,
      totalApplications: applications.length,
      openTickets: summary.openTickets,
      monthlyRent: summary.monthlyRent,
      collectedThisMonth: summary.collectedThisMonth,
      leaseEnd: summary.leaseEnd,
      expensesYtd: expenses.reduce((sum, e) => sum + e.amount, 0),
      favorites: _count.favorites,
    }

    res.json({
      property: withMapPosition(listingFields),
      stats,
      leases,
      applications: applicationRows,
      tickets: maintenanceTickets,
      documents,
      expenses,
    })
  } catch (error) {
    console.error('Get property error:', error)
    res.status(500).json({ error: { message: 'Failed to load property' } })
  }
})

export default router
