import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import {
  CHARGE_TYPES,
  CHARGE_LABELS,
  monthWindow,
  tenantLedger,
  lateFeeAssessment,
} from '../utils/ledger.js'
import { sendRentChargeEmail } from '../utils/email.js'

/**
 * The rent ledger for one lease: charges other than rent (late fees,
 * utilities, repairs, credits) and each tenant's balance for the month.
 * Payments themselves stay in Transaction (routes/payments.js).
 */
const router = express.Router()

const monthLabel = d =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const leaseInclude = {
  application: {
    select: {
      ownerId: true,
      listingId: true,
      listing: { select: { title: true } },
    },
  },
  signers: {
    where: { role: 'tenant', userId: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: {
      userId: true,
      applicationId: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  rentSplit: { select: { shares: { select: { userId: true, amount: true } } } },
  members: { select: { id: true, applicantId: true } },
}

async function loadLease(agreementId) {
  return prisma.agreement.findUnique({
    where: { id: agreementId },
    include: leaseInclude,
  })
}

const isOwner = (lease, userId) => lease.application?.ownerId === userId
const isTenant = (lease, userId) => lease.signers.some(s => s.userId === userId)

function shareOf(lease, userId) {
  const share = lease.rentSplit?.shares.find(s => s.userId === userId)
  if (share) return Math.round(share.amount)
  const members = Math.max(1, lease.signers.length)
  return Math.round(lease.monthlyRent / members)
}

/** Charges due this month and this month's payments by member application. */
async function monthData(lease, now) {
  const { from, to } = monthWindow(now)
  const [charges, payments] = await Promise.all([
    prisma.rentCharge.findMany({
      where: { agreementId: lease.id, dueDate: { gte: from, lt: to } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.transaction.findMany({
      where: {
        applicationId: { in: lease.members.map(m => m.id) },
        createdAt: { gte: from, lt: to },
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return { charges, payments }
}

function presentLedger(lease, { charges, payments }, now) {
  const memberCount = lease.signers.length
  const members = lease.signers.map(s => {
    const ledger = tenantLedger({
      rentShare: shareOf(lease, s.userId),
      charges,
      payments: payments.filter(p => p.userId === s.userId),
      tenantId: s.userId,
      memberCount,
      now,
    })
    return {
      userId: s.userId,
      applicationId: s.applicationId,
      name: `${s.user.firstName} ${s.user.lastName}`,
      ...ledger,
    }
  })
  const householdPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0)
  const lateFeeApplied = charges.some(c => c.type === 'late_fee' && !c.userId)
  return {
    agreementId: lease.id,
    month: monthLabel(now),
    listingTitle: lease.application?.listing?.title || null,
    monthlyRent: lease.monthlyRent,
    lateFee: lease.lateFeeAmount
      ? {
          amount: lease.lateFeeAmount,
          graceDays: lease.lateFeeGraceDays ?? 0,
          ...lateFeeAssessment({
            lateFeeAmount: lease.lateFeeAmount,
            lateFeeGraceDays: lease.lateFeeGraceDays,
            rentDue: lease.monthlyRent,
            paidThisMonth: householdPaid,
            alreadyAppliedThisMonth: lateFeeApplied,
            now,
          }),
        }
      : null,
    charges: charges.map(c => ({
      id: c.id,
      type: c.type,
      label: CHARGE_LABELS[c.type] || c.type,
      amount: c.amount,
      description: c.description,
      dueDate: c.dueDate,
      userId: c.userId,
      household: !c.userId,
    })),
    payments,
    members,
  }
}

/**
 * GET /api/ledger/:agreementId
 * Landlord or any tenant on the lease.
 */
router.get('/:agreementId', authenticate, async (req, res) => {
  try {
    const lease = await loadLease(req.params.agreementId)
    if (!lease) {
      return res.status(404).json({ error: { message: 'Lease not found' } })
    }
    if (!isOwner(lease, req.user.id) && !isTenant(lease, req.user.id)) {
      return res
        .status(403)
        .json({ error: { message: 'Not a party to this lease' } })
    }
    const now = new Date()
    res.json({ ledger: presentLedger(lease, await monthData(lease, now), now) })
  } catch (error) {
    console.error('Get ledger error:', error)
    res.status(500).json({ error: { message: 'Failed to load the ledger' } })
  }
})

/**
 * POST /api/ledger/:agreementId/charges (landlord)
 * body: { type, amount, description, dueDate?, userId? }
 */
router.post(
  '/:agreementId/charges',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const lease = await loadLease(req.params.agreementId)
      if (!lease || !isOwner(lease, req.user.id)) {
        return res.status(404).json({ error: { message: 'Lease not found' } })
      }
      const { type, amount, description, dueDate, userId } = req.body || {}
      if (!CHARGE_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ error: { message: 'Invalid charge type' } })
      }
      const parsedAmount = Math.round(Number(amount))
      if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0 ||
        parsedAmount > 50000
      ) {
        return res
          .status(400)
          .json({ error: { message: 'A positive amount is required' } })
      }
      const text = String(description || '')
        .trim()
        .slice(0, 200)
      if (!text) {
        return res
          .status(400)
          .json({ error: { message: 'A description is required' } })
      }
      const due = dueDate ? new Date(dueDate) : new Date()
      if (Number.isNaN(due.getTime())) {
        return res.status(400).json({ error: { message: 'Invalid due date' } })
      }
      if (userId && !isTenant(lease, userId)) {
        return res.status(400).json({
          error: { message: 'That person is not a tenant on this lease' },
        })
      }

      const charge = await prisma.rentCharge.create({
        data: {
          agreementId: lease.id,
          type,
          amount: parsedAmount,
          description: text,
          dueDate: due,
          userId: userId || null,
          createdById: req.user.id,
        },
      })
      res.status(201).json({ charge })

      // Tell the tenant(s) it lands on. Best-effort.
      const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
      const recipients = lease.signers
        .filter(s => (userId ? s.userId === userId : true) && s.user?.email)
        .map(s => s.user)
      Promise.all(
        recipients.map(tenant =>
          sendRentChargeEmail({
            tenant,
            landlordName,
            listingTitle: lease.application?.listing?.title || 'your rental',
            charge: { ...charge, label: CHARGE_LABELS[type] },
            household: !userId,
            memberCount: lease.signers.length,
          })
        )
      ).catch(err => console.error('Rent charge email error:', err))
    } catch (error) {
      console.error('Add charge error:', error)
      res.status(500).json({ error: { message: 'Failed to add the charge' } })
    }
  }
)

/**
 * DELETE /api/ledger/charges/:id (landlord)
 */
router.delete(
  '/charges/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const charge = await prisma.rentCharge.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          agreement: { select: { application: { select: { ownerId: true } } } },
        },
      })
      if (!charge || charge.agreement.application.ownerId !== req.user.id) {
        return res.status(404).json({ error: { message: 'Charge not found' } })
      }
      await prisma.rentCharge.delete({ where: { id: charge.id } })
      res.json({ ok: true })
    } catch (error) {
      console.error('Delete charge error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to remove the charge' } })
    }
  }
)

/**
 * POST /api/ledger/:agreementId/late-fee (landlord)
 * Applies this month's late fee from the lease's rule, once, when the
 * household's rent is still short after the grace period.
 */
router.post(
  '/:agreementId/late-fee',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const lease = await loadLease(req.params.agreementId)
      if (!lease || !isOwner(lease, req.user.id)) {
        return res.status(404).json({ error: { message: 'Lease not found' } })
      }
      const now = new Date()
      const data = await monthData(lease, now)
      const paid = data.payments
        .filter(p => p.status === 'completed')
        .reduce((s, p) => s + p.amount, 0)
      const assessment = lateFeeAssessment({
        lateFeeAmount: lease.lateFeeAmount,
        lateFeeGraceDays: lease.lateFeeGraceDays,
        rentDue: lease.monthlyRent,
        paidThisMonth: paid,
        alreadyAppliedThisMonth: data.charges.some(
          c => c.type === 'late_fee' && !c.userId
        ),
        now,
      })
      if (!assessment.applicable) {
        return res.status(400).json({ error: { message: assessment.reason } })
      }
      const charge = await prisma.rentCharge.create({
        data: {
          agreementId: lease.id,
          type: 'late_fee',
          amount: assessment.amount,
          description: `Late fee — ${monthLabel(now)} rent`,
          dueDate: now,
          userId: null,
          createdById: req.user.id,
        },
      })
      res.status(201).json({ charge })

      const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
      Promise.all(
        lease.signers
          .filter(s => s.user?.email)
          .map(s =>
            sendRentChargeEmail({
              tenant: s.user,
              landlordName,
              listingTitle: lease.application?.listing?.title || 'your rental',
              charge: { ...charge, label: CHARGE_LABELS.late_fee },
              household: true,
              memberCount: lease.signers.length,
            })
          )
      ).catch(err => console.error('Late fee email error:', err))
    } catch (error) {
      console.error('Apply late fee error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to apply the late fee' } })
    }
  }
)

export default router
