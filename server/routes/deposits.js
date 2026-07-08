import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * Statutory security-deposit return windows, in days after move-out.
 * CA is the launch market; the rest cover common states so the countdown is
 * never silently wrong — anything unlisted falls back to a conservative 30.
 * cite strings appear verbatim on the itemized refund letter.
 */
export const STATE_DEPOSIT_RULES = {
  CA: { days: 21, cite: 'Cal. Civ. Code § 1950.5(g)' },
  AZ: { days: 14, cite: 'Ariz. Rev. Stat. § 33-1321(D)' },
  CO: { days: 30, cite: 'Colo. Rev. Stat. § 38-12-103' },
  FL: { days: 30, cite: 'Fla. Stat. § 83.49(3)' },
  GA: { days: 30, cite: 'Ga. Code § 44-7-34' },
  IL: { days: 30, cite: '765 ILCS 710/1' },
  MA: { days: 30, cite: 'Mass. Gen. Laws ch. 186 § 15B' },
  NC: { days: 30, cite: 'N.C. Gen. Stat. § 42-52' },
  NV: { days: 30, cite: 'Nev. Rev. Stat. § 118A.242' },
  NY: { days: 14, cite: 'N.Y. Gen. Oblig. Law § 7-108(1-a)(e)' },
  OR: { days: 31, cite: 'Or. Rev. Stat. § 90.300(12)' },
  PA: { days: 30, cite: '68 Pa. Stat. § 250.512' },
  TX: { days: 30, cite: 'Tex. Prop. Code § 92.103' },
  VA: { days: 45, cite: 'Va. Code § 55.1-1226(A)' },
  WA: { days: 30, cite: 'Wash. Rev. Code § 59.18.280' },
}
const DEFAULT_RULE = { days: 30, cite: 'state law (verify your statute)' }

export function ruleForState(state) {
  return STATE_DEPOSIT_RULES[(state || '').toUpperCase()] || DEFAULT_RULE
}

/** Pull a two-letter state code out of a listing location string, CA default. */
function stateFromLocation(location) {
  const match = (location || '').match(/\b([A-Z]{2})\b(?:\s+\d{5})?\s*$/)
  return match && STATE_DEPOSIT_RULES[match[1]] ? match[1] : 'CA'
}

const DEPOSIT_INCLUDE = {
  deductions: { orderBy: { createdAt: 'asc' } },
  agreement: {
    select: {
      id: true,
      monthlyRent: true,
      securityDeposit: true,
      startDate: true,
      endDate: true,
      application: {
        select: {
          id: true,
          applicant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          listing: { select: { id: true, title: true, location: true } },
        },
      },
    },
  },
}

/** Shape a deposit row for the client, with the computed countdown. */
function presentDeposit(deposit) {
  const deducted = deposit.deductions.reduce((sum, d) => sum + d.amount, 0)
  const rule = ruleForState(deposit.state)
  let daysRemaining = null
  if (deposit.refundDeadline && deposit.status !== 'refunded') {
    daysRemaining = Math.ceil(
      (new Date(deposit.refundDeadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  }
  return {
    id: deposit.id,
    status: deposit.status,
    amountHeld: deposit.amountHeld,
    state: deposit.state,
    returnWindowDays: rule.days,
    statuteCite: rule.cite,
    moveOutDate: deposit.moveOutDate,
    refundDeadline: deposit.refundDeadline,
    daysRemaining,
    deductions: deposit.deductions,
    totalDeductions: deducted,
    refundDue: Math.max(0, deposit.amountHeld - deducted),
    refundAmount: deposit.refundAmount,
    refundMethod: deposit.refundMethod,
    refundedAt: deposit.refundedAt,
    notes: deposit.notes,
    tenant: deposit.agreement.application.applicant,
    listing: deposit.agreement.application.listing,
    lease: {
      monthlyRent: deposit.agreement.monthlyRent,
      startDate: deposit.agreement.startDate,
      endDate: deposit.agreement.endDate,
    },
  }
}

/**
 * GET /api/deposits
 * Owner's deposit ledger. Lazily creates a SecurityDeposit row for any signed
 * lease on the owner's listings that doesn't have one yet, so deposits taken
 * before this feature shipped appear automatically.
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const ownerId = req.user.id

    const uncovered = await prisma.agreement.findMany({
      where: {
        securityDeposit: { gt: 0 },
        deposit: null,
        application: { ownerId },
      },
      select: {
        id: true,
        securityDeposit: true,
        application: {
          select: { listing: { select: { location: true } } },
        },
      },
    })

    for (const agreement of uncovered) {
      await prisma.securityDeposit.create({
        data: {
          agreementId: agreement.id,
          ownerId,
          amountHeld: agreement.securityDeposit,
          state: stateFromLocation(agreement.application.listing?.location),
        },
      })
    }

    const deposits = await prisma.securityDeposit.findMany({
      where: { ownerId },
      include: DEPOSIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ deposits: deposits.map(presentDeposit) })
  } catch (error) {
    console.error('List deposits error:', error)
    res.status(500).json({ error: { message: 'Failed to list deposits' } })
  }
})

/** Load a deposit and verify the requester owns it. */
async function findOwnedDeposit(id, ownerId) {
  const deposit = await prisma.securityDeposit.findUnique({
    where: { id },
    include: DEPOSIT_INCLUDE,
  })
  if (!deposit || deposit.ownerId !== ownerId) return null
  return deposit
}

/**
 * PUT /api/deposits/:id
 * Set/update the move-out date (starts the statutory refund clock), state,
 * or notes. Recomputes refundDeadline whenever moveOutDate or state changes.
 */
router.put('/:id', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const deposit = await findOwnedDeposit(req.params.id, req.user.id)
    if (!deposit) {
      return res.status(404).json({ error: { message: 'Deposit not found' } })
    }
    if (deposit.status === 'refunded') {
      return res
        .status(400)
        .json({ error: { message: 'Deposit already refunded' } })
    }

    const { moveOutDate, state, notes } = req.body
    const data = {}
    if (notes !== undefined) data.notes = notes
    if (state !== undefined) {
      data.state = String(state).toUpperCase().slice(0, 2)
    }
    if (moveOutDate !== undefined) {
      data.moveOutDate = moveOutDate ? new Date(moveOutDate) : null
      if (data.moveOutDate && isNaN(data.moveOutDate.getTime())) {
        return res
          .status(400)
          .json({ error: { message: 'Invalid move-out date' } })
      }
    }

    const effectiveMoveOut =
      'moveOutDate' in data ? data.moveOutDate : deposit.moveOutDate
    const effectiveState = data.state || deposit.state
    if (effectiveMoveOut) {
      const deadline = new Date(effectiveMoveOut)
      deadline.setDate(deadline.getDate() + ruleForState(effectiveState).days)
      data.refundDeadline = deadline
      data.status = 'pending_refund'
    } else if ('moveOutDate' in data) {
      data.refundDeadline = null
      data.status = 'holding'
    }

    const updated = await prisma.securityDeposit.update({
      where: { id: deposit.id },
      data,
      include: DEPOSIT_INCLUDE,
    })
    res.json({ deposit: presentDeposit(updated) })
  } catch (error) {
    console.error('Update deposit error:', error)
    res.status(500).json({ error: { message: 'Failed to update deposit' } })
  }
})

const DEDUCTION_CATEGORIES = ['unpaid_rent', 'cleaning', 'repairs', 'other']

/**
 * POST /api/deposits/:id/deductions
 * Add an itemized deduction line.
 */
router.post(
  '/:id/deductions',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const deposit = await findOwnedDeposit(req.params.id, req.user.id)
      if (!deposit) {
        return res.status(404).json({ error: { message: 'Deposit not found' } })
      }
      if (deposit.status === 'refunded') {
        return res
          .status(400)
          .json({ error: { message: 'Deposit already refunded' } })
      }

      const { category, description, amount, evidenceUrls = [] } = req.body
      const parsedAmount = Math.round(Number(amount))
      if (!DEDUCTION_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: { message: 'Invalid category' } })
      }
      if (!description || !parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({
          error: { message: 'Description and a positive amount are required' },
        })
      }
      const existing = deposit.deductions.reduce((s, d) => s + d.amount, 0)
      if (existing + parsedAmount > deposit.amountHeld) {
        return res.status(400).json({
          error: {
            message: `Deductions cannot exceed the $${deposit.amountHeld} held`,
          },
        })
      }

      await prisma.depositDeduction.create({
        data: {
          depositId: deposit.id,
          category,
          description,
          amount: parsedAmount,
          evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
        },
      })
      const updated = await findOwnedDeposit(deposit.id, req.user.id)
      res.status(201).json({ deposit: presentDeposit(updated) })
    } catch (error) {
      console.error('Add deduction error:', error)
      res.status(500).json({ error: { message: 'Failed to add deduction' } })
    }
  }
)

/**
 * DELETE /api/deposits/:id/deductions/:deductionId
 */
router.delete(
  '/:id/deductions/:deductionId',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const deposit = await findOwnedDeposit(req.params.id, req.user.id)
      if (!deposit) {
        return res.status(404).json({ error: { message: 'Deposit not found' } })
      }
      if (deposit.status === 'refunded') {
        return res
          .status(400)
          .json({ error: { message: 'Deposit already refunded' } })
      }
      const deduction = deposit.deductions.find(
        d => d.id === req.params.deductionId
      )
      if (!deduction) {
        return res
          .status(404)
          .json({ error: { message: 'Deduction not found' } })
      }
      await prisma.depositDeduction.delete({ where: { id: deduction.id } })
      const updated = await findOwnedDeposit(deposit.id, req.user.id)
      res.json({ deposit: presentDeposit(updated) })
    } catch (error) {
      console.error('Delete deduction error:', error)
      res.status(500).json({ error: { message: 'Failed to delete deduction' } })
    }
  }
)

/**
 * GET /api/deposits/:id/letter
 * Data for the itemized disposition/refund letter the owner prints and sends
 * with the refund (CA 1950.5 requires the itemized statement). Stamps
 * letterGeneratedAt the first time it's requested.
 */
router.get(
  '/:id/letter',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const deposit = await findOwnedDeposit(req.params.id, req.user.id)
      if (!deposit) {
        return res.status(404).json({ error: { message: 'Deposit not found' } })
      }
      if (!deposit.letterGeneratedAt) {
        await prisma.securityDeposit.update({
          where: { id: deposit.id },
          data: { letterGeneratedAt: new Date() },
        })
      }
      const rule = ruleForState(deposit.state)
      const shaped = presentDeposit(deposit)
      res.json({
        letter: {
          generatedAt: deposit.letterGeneratedAt || new Date(),
          landlord: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
          },
          tenant: shaped.tenant,
          property: shaped.listing,
          lease: shaped.lease,
          amountHeld: shaped.amountHeld,
          deductions: shaped.deductions,
          totalDeductions: shaped.totalDeductions,
          refundDue: shaped.refundDue,
          moveOutDate: shaped.moveOutDate,
          refundDeadline: shaped.refundDeadline,
          state: deposit.state,
          statuteCite: rule.cite,
          returnWindowDays: rule.days,
        },
      })
    } catch (error) {
      console.error('Deposit letter error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to generate letter data' } })
    }
  }
)

/**
 * POST /api/deposits/:id/refund
 * Record the refund: amount = held − deductions. This is a compliance record,
 * not a money movement — the owner sends the check/ACH outside Rentra (real
 * ACH refunds land with Moov production in v1.1).
 */
router.post(
  '/:id/refund',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const deposit = await findOwnedDeposit(req.params.id, req.user.id)
      if (!deposit) {
        return res.status(404).json({ error: { message: 'Deposit not found' } })
      }
      if (deposit.status === 'refunded') {
        return res
          .status(400)
          .json({ error: { message: 'Deposit already refunded' } })
      }

      const { refundMethod = 'check' } = req.body
      const deducted = deposit.deductions.reduce((s, d) => s + d.amount, 0)
      const refundAmount = Math.max(0, deposit.amountHeld - deducted)

      const updated = await prisma.securityDeposit.update({
        where: { id: deposit.id },
        data: {
          status: 'refunded',
          refundAmount,
          refundMethod,
          refundedAt: new Date(),
        },
        include: DEPOSIT_INCLUDE,
      })
      res.json({ deposit: presentDeposit(updated) })
    } catch (error) {
      console.error('Record refund error:', error)
      res.status(500).json({ error: { message: 'Failed to record refund' } })
    }
  }
)

export default router
