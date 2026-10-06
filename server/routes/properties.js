import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import { assessIncome } from '../utils/screening.js'
import { withMapPosition } from '../utils/geocode.js'
import {
  leasesOf,
  leaseFullySigned,
  leaseIsCurrent,
  leaseAwaitingTenants,
  tenantConfirmations,
  summarizeProperty,
  portfolioTotals,
  collectedThisMonth,
} from '../utils/portfolio.js'
import { validateOnboarding } from '../utils/onboarding.js'
import { summarizeItems } from '../utils/inspections.js'
import { newInviteToken, emailInvite, presentInvite } from './tenantInvites.js'

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
                source: true,
                monthToMonth: true,
                endedAt: true,
                tenantSigned: true,
                landlordSigned: true,
                signers: {
                  select: { userId: true, role: true, signed: true },
                },
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
            tenantInvite: true,
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
                renewal: { select: { id: true } },
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
        inspections: { orderBy: { createdAt: 'desc' } },
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
      inspections,
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
          // Match the signature block by member application, not by user:
          // an onboarded member has no user until their invite is accepted.
          const signer =
            ag.signers.find(s => s.applicationId === a.id) ||
            (a.applicantId
              ? ag.signers.find(s => s.userId === a.applicantId)
              : null)
          const share = a.applicantId
            ? ag.rentSplit?.shares.find(s => s.userId === a.applicantId)
            : null
          const autopay = a.applicantId
            ? ag.autopays.find(p => p.userId === a.applicantId)
            : null
          return {
            applicationId: a.id,
            user: a.applicant,
            invite: a.tenantInvite ? presentInvite(a.tenantInvite) : null,
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
        source: ag.source,
        imported: ag.source === 'imported',
        monthToMonth: ag.monthToMonth,
        // Lifecycle: notice given, and the renewal chain both ways.
        endedAt: ag.endedAt || null,
        endReason: ag.endReason || null,
        renewalId: ag.renewal?.id || null,
        renewsId: ag.renewsId || null,
        lateFee: ag.lateFeeAmount
          ? { amount: ag.lateFeeAmount, graceDays: ag.lateFeeGraceDays ?? 0 }
          : null,
        fullySigned: leaseFullySigned(ag),
        current: leaseIsCurrent(ag, now),
        awaitingTenants: leaseAwaitingTenants(ag, now),
        confirmations: tenantConfirmations(ag),
        landlordSigned: Boolean(landlord?.signed ?? ag.landlordSigned),
        members,
        deposit: ag.deposit,
        rentSplit: ag.rentSplit
          ? { splitMode: ag.rentSplit.splitMode, total: ag.rentSplit.total }
          : null,
      }
    })

    // Applications: the screening-relevant facts, no raw Plaid payloads.
    // Onboarded member rows are household bookkeeping, not applicants.
    const applied = applications.filter(a => a.source !== 'onboarded')
    const applicationRows = applied.map(a => ({
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
      totalApplications: applied.length,
      invites: summary.invites,
      openTickets: summary.openTickets,
      monthlyRent: summary.monthlyRent,
      collectedThisMonth: summary.collectedThisMonth,
      leaseEnd: summary.leaseEnd,
      endingOn: summary.endingOn,
      nextLeaseStart: summary.nextLeaseStart,
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
      inspections: inspections.map(i => ({
        id: i.id,
        type: i.type,
        status: i.status,
        conductedAt: i.conductedAt,
        completedAt: i.completedAt,
        agreementId: i.agreementId,
        notes: i.notes,
        ...summarizeItems(i.items),
      })),
      expenses,
    })
  } catch (error) {
    console.error('Get property error:', error)
    res.status(500).json({ error: { message: 'Failed to load property' } })
  }
})

/**
 * POST /api/properties/:id/onboard
 * Record the lease that already exists on an occupied property and invite
 * the current household. One transaction creates the imported Agreement
 * (landlord block signed, one unattached tenant block per person), one
 * onboarded Application per tenant and one TenantInvite each; emails go
 * out afterwards. Rent is split equally unless the landlord entered each
 * tenant's share.
 *
 * body: { lease: { startDate, endDate?, monthToMonth?, monthlyRent,
 *                  securityDeposit, documentUrl? },
 *         tenants: [{ firstName, lastName, email, phone?, share? }],
 *         attest: true }
 */
router.post(
  '/:id/onboard',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const now = new Date()
      const listing = await prisma.listing.findFirst({
        where: { id: req.params.id, ownerId: req.user.id },
        select: {
          id: true,
          title: true,
          location: true,
          streetAddress: true,
          images: true,
          price: true,
          applications: {
            select: {
              agreement: {
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  source: true,
                  tenantSigned: true,
                  landlordSigned: true,
                  signers: { select: { role: true, signed: true } },
                },
              },
            },
          },
        },
      })
      if (!listing) {
        return res
          .status(404)
          .json({ error: { message: 'Property not found' } })
      }

      const inForce = leasesOf(listing.applications).filter(
        l =>
          leaseIsCurrent(l, now) ||
          leaseAwaitingTenants(l, now) ||
          (!leaseFullySigned(l) && new Date(l.endDate) >= now)
      )
      if (inForce.length) {
        return res.status(409).json({
          error: {
            message:
              'This property already has a lease in progress. Manage it from the Tenants tab.',
            code: 'LEASE_EXISTS',
          },
        })
      }

      const checked = validateOnboarding(req.body, {
        ownerEmail: req.user.email,
        now,
      })
      if (!checked.ok) {
        return res.status(400).json({
          error: { message: checked.errors[0], details: checked.errors },
        })
      }
      const { lease, tenants, split } = checked.value

      // Tenants need tenant accounts: an address already used by a landlord
      // or co-signer cannot accept.
      const existing = await prisma.user.findMany({
        where: { email: { in: tenants.map(t => t.email) } },
        select: { email: true, userType: true },
      })
      const wrongType = existing.find(u => u.userType !== 'student')
      if (wrongType) {
        return res.status(400).json({
          error: {
            message: `${wrongType.email} belongs to a ${wrongType.userType === 'owner' ? 'landlord' : 'co-signer'} account on Rentra. Tenants need a tenant account; use a different email.`,
          },
        })
      }
      const pendingClash = await prisma.tenantInvite.findFirst({
        where: {
          listingId: listing.id,
          email: { in: tenants.map(t => t.email) },
          status: { in: ['pending', 'accepted'] },
        },
        select: { email: true },
      })
      if (pendingClash) {
        return res.status(400).json({
          error: {
            message: `${pendingClash.email} already has an invitation for this property.`,
          },
        })
      }

      const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
      const created = await prisma.$transaction(async tx => {
        const memberData = {
          listingId: listing.id,
          ownerId: req.user.id,
          applicantId: null,
          status: 'approved',
          source: 'onboarded',
          startDate: lease.startDate,
          endDate: lease.endDate,
          message: null,
        }
        // The lead application carries the Agreement's required
        // applicationId; the rest are plain members.
        const lead = await tx.application.create({ data: memberData })
        const others = []
        for (let i = 1; i < tenants.length; i += 1) {
          others.push(await tx.application.create({ data: memberData }))
        }
        const memberApps = [lead, ...others]

        const agreement = await tx.agreement.create({
          data: {
            applicationId: lead.id,
            source: 'imported',
            monthToMonth: lease.monthToMonth,
            monthlyRent: lease.monthlyRent,
            securityDeposit: lease.securityDeposit,
            startDate: lease.startDate,
            endDate: lease.endDate,
            documentUrl: lease.documentUrl,
            terms: {
              importedLease: true,
              attestedBy: landlordName,
              attestedAt: now.toISOString(),
              utilities: 'As stated in the signed lease.',
              petPolicy: 'As stated in the signed lease.',
            },
            // The landlord attests to the terms now; each tenant block is
            // confirmed when that tenant accepts their invite.
            landlordSigned: true,
            landlordSignedAt: now,
            signers: {
              create: [
                ...memberApps.map(m => ({
                  role: 'tenant',
                  userId: null,
                  applicationId: m.id,
                })),
                {
                  role: 'landlord',
                  userId: req.user.id,
                  signed: true,
                  signedAt: now,
                  signatureName: landlordName,
                },
              ],
            },
          },
          select: {
            id: true,
            monthlyRent: true,
            securityDeposit: true,
            startDate: true,
            endDate: true,
            monthToMonth: true,
            signers: { select: { role: true } },
          },
        })
        await tx.application.updateMany({
          where: { id: { in: memberApps.map(m => m.id) } },
          data: { agreementId: agreement.id },
        })

        // Households of two or more start on a split (equal, or the shares
        // the landlord entered) so each tenant's Pay Rent shows their share,
        // not the whole rent. Shares are named after the invites and
        // attached to users as each tenant accepts.
        if (tenants.length > 1) {
          await tx.rentSplit.create({
            data: {
              agreementId: agreement.id,
              createdById: req.user.id,
              total: lease.monthlyRent,
              splitMode: split.mode,
              shares: {
                create: tenants.map((t, i) => ({
                  name: `${t.firstName} ${t.lastName}`,
                  amount: split.amounts[i],
                  userId: null,
                })),
              },
            },
          })
        }

        const invites = []
        for (let i = 0; i < tenants.length; i += 1) {
          invites.push(
            await tx.tenantInvite.create({
              data: {
                ...newInviteToken(now.getTime()),
                ...tenants[i],
                listingId: listing.id,
                ownerId: req.user.id,
                agreementId: agreement.id,
                applicationId: memberApps[i].id,
              },
            })
          )
        }
        return { agreement, invites }
      })

      // Emails after the commit so a mail failure never rolls back the lease.
      const emailed = []
      for (let i = 0; i < created.invites.length; i += 1) {
        const invite = created.invites[i]
        const sent = await emailInvite(invite, {
          owner: req.user,
          listing,
          agreement: created.agreement,
          share: split.amounts[i],
        })
        emailed.push({
          ...presentInvite(invite),
          share: split.amounts[i],
          emailSent: sent,
        })
      }

      res.status(201).json({
        message: `Invitations sent to ${created.invites.length} tenant${
          created.invites.length === 1 ? '' : 's'
        }`,
        agreementId: created.agreement.id,
        invites: emailed,
      })
    } catch (error) {
      console.error('Onboard tenants error:', error)
      res.status(500).json({ error: { message: 'Failed to add tenants' } })
    }
  }
)

export default router
