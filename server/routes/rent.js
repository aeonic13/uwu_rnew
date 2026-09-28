import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { computeShares } from '../utils/billSplit.js'
import { computeNextRun, clampDay } from '../utils/autopay.js'

/**
 * Tenant rent tools: how a household splits rent, and each tenant's
 * autopay schedule. Money movement waits on Moov (see utils/autopay.js);
 * everything here is the plan that will drive it.
 */
const router = express.Router()

const splitInclude = {
  shares: { orderBy: { amount: 'desc' } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
}

const memberSelect = {
  id: true,
  applicantId: true,
  applicant: { select: { id: true, firstName: true, lastName: true } },
  agreement: {
    select: {
      id: true,
      monthlyRent: true,
      rentSplit: { include: splitInclude },
    },
  },
}

/**
 * Every tenant on the same lease as `agreementId`. A group application
 * creates one Application (and Agreement) per member linked by groupId, so
 * siblings are the approved applications sharing that group and listing.
 * Returns null when the agreement is missing and { forbidden } when the
 * caller is not a tenant on it.
 */
async function loadHousehold(agreementId, userId) {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: {
      id: true,
      monthlyRent: true,
      application: {
        select: {
          id: true,
          listingId: true,
          groupId: true,
          listing: { select: { title: true } },
        },
      },
    },
  })
  if (!agreement) return null

  const app = agreement.application
  const siblings = await prisma.application.findMany({
    where: app.groupId
      ? { groupId: app.groupId, listingId: app.listingId, status: 'approved' }
      : { id: app.id },
    select: memberSelect,
  })

  const members = siblings.map(s => ({
    userId: s.applicant.id,
    name: `${s.applicant.firstName} ${s.applicant.lastName}`,
    agreementId: s.agreement?.id || null,
  }))
  if (!members.some(m => m.userId === userId)) return { forbidden: true }

  return {
    agreementId,
    monthlyRent: agreement.monthlyRent,
    listingTitle: app.listing?.title || null,
    members,
    split: siblings.map(s => s.agreement?.rentSplit).find(Boolean) || null,
    myAgreementId: members.find(m => m.userId === userId)?.agreementId,
  }
}

function shapeSplit(split, viewerId) {
  if (!split) return null
  return {
    id: split.id,
    agreementId: split.agreementId,
    total: split.total,
    splitMode: split.splitMode,
    createdBy: split.createdBy
      ? {
          id: split.createdBy.id,
          name: `${split.createdBy.firstName} ${split.createdBy.lastName}`,
        }
      : null,
    updatedAt: split.updatedAt,
    shares: (split.shares || []).map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      amount: s.amount,
      isMe: s.userId === viewerId,
    })),
  }
}

function shapeAutopay(a) {
  if (!a) return null
  return {
    id: a.id,
    agreementId: a.agreementId,
    amount: a.amount,
    dayOfMonth: a.dayOfMonth,
    paymentMethod: a.paymentMethod,
    status: a.status,
    nextRunAt: a.nextRunAt,
    lastRunAt: a.lastRunAt,
    // Flip when Moov moves real money; the UI copy keys off this.
    live: false,
  }
}

function myShareOf(household, userId) {
  const split = household.split
  if (!split) return household.monthlyRent
  const mine = (split.shares || []).find(s => s.userId === userId)
  return mine ? mine.amount : null
}

async function householdOr403(req, res) {
  const agreementId = req.query.agreementId || req.body.agreementId
  if (!agreementId) {
    res.status(400).json({ error: { message: 'agreementId is required' } })
    return null
  }
  const household = await loadHousehold(agreementId, req.user.id)
  if (!household) {
    res.status(404).json({ error: { message: 'Lease not found' } })
    return null
  }
  if (household.forbidden) {
    res.status(403).json({ error: { message: 'Not a tenant on this lease' } })
    return null
  }
  return household
}

/**
 * GET /api/rent/plan?agreementId=
 * The household, its rent split (if any), the caller's share and autopay.
 */
router.get('/plan', authenticate, async (req, res) => {
  try {
    const household = await householdOr403(req, res)
    if (!household) return

    const autopay = household.myAgreementId
      ? await prisma.autopaySchedule.findUnique({
          where: {
            userId_agreementId: {
              userId: req.user.id,
              agreementId: household.myAgreementId,
            },
          },
        })
      : null

    res.json({
      agreementId: household.myAgreementId || household.agreementId,
      monthlyRent: household.monthlyRent,
      listingTitle: household.listingTitle,
      household: household.members,
      split: shapeSplit(household.split, req.user.id),
      myShare: myShareOf(household, req.user.id),
      autopay: shapeAutopay(autopay),
    })
  } catch (error) {
    console.error('Rent plan error:', error)
    res.status(500).json({ error: { message: 'Failed to load rent plan' } })
  }
})

/**
 * PUT /api/rent/split
 * Create or replace the household's rent split.
 * body: { agreementId, total, splitMode, shares: [{ userId?, name, percent? | amount? }] }
 */
router.put('/split', authenticate, async (req, res) => {
  try {
    const household = await householdOr403(req, res)
    if (!household) return

    const { total, splitMode = 'equal', shares = [] } = req.body
    const memberIds = new Set(household.members.map(m => m.userId))
    let computed
    try {
      computed = computeShares(
        total,
        splitMode,
        (Array.isArray(shares) ? shares : []).map(s => ({
          ...s,
          // Only tenants on this lease can be linked by id; anyone else
          // is a name-only roommate.
          userId: s.userId && memberIds.has(s.userId) ? s.userId : null,
        }))
      )
    } catch (err) {
      return res.status(400).json({ error: { message: err.message } })
    }

    const targetAgreementId =
      household.split?.agreementId || household.myAgreementId
    if (!targetAgreementId) {
      return res
        .status(400)
        .json({ error: { message: 'No signed lease to split' } })
    }

    const split = await prisma.$transaction(async tx => {
      const existing = await tx.rentSplit.findUnique({
        where: { agreementId: targetAgreementId },
        select: { id: true },
      })
      if (existing) {
        await tx.rentSplitShare.deleteMany({ where: { splitId: existing.id } })
        return tx.rentSplit.update({
          where: { id: existing.id },
          data: {
            total: Number(total),
            splitMode,
            shares: { create: computed },
          },
          include: splitInclude,
        })
      }
      return tx.rentSplit.create({
        data: {
          agreementId: targetAgreementId,
          createdById: req.user.id,
          total: Number(total),
          splitMode,
          shares: { create: computed },
        },
        include: splitInclude,
      })
    })

    res.json({
      split: shapeSplit(split, req.user.id),
      myShare: myShareOf({ ...household, split }, req.user.id),
    })
  } catch (error) {
    console.error('Save rent split error:', error)
    res.status(500).json({ error: { message: 'Failed to save rent split' } })
  }
})

/**
 * DELETE /api/rent/split/:id — any tenant on the lease can clear it.
 */
router.delete('/split/:id', authenticate, async (req, res) => {
  try {
    const split = await prisma.rentSplit.findUnique({
      where: { id: req.params.id },
      select: { id: true, agreementId: true },
    })
    if (!split) {
      return res.status(404).json({ error: { message: 'Split not found' } })
    }
    const household = await loadHousehold(split.agreementId, req.user.id)
    if (!household || household.forbidden) {
      return res.status(403).json({ error: { message: 'Not authorized' } })
    }
    await prisma.rentSplit.delete({ where: { id: split.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete rent split error:', error)
    res.status(500).json({ error: { message: 'Failed to delete split' } })
  }
})

/**
 * PUT /api/rent/autopay
 * Create or replace the caller's autopay for their lease.
 * body: { agreementId, dayOfMonth, amount?, paymentMethod? }
 */
router.put('/autopay', authenticate, async (req, res) => {
  try {
    const household = await householdOr403(req, res)
    if (!household) return
    if (!household.myAgreementId) {
      return res
        .status(400)
        .json({ error: { message: 'No signed lease to schedule' } })
    }

    const { dayOfMonth, amount, paymentMethod = 'ach' } = req.body
    if (dayOfMonth === undefined || dayOfMonth === null) {
      return res
        .status(400)
        .json({ error: { message: 'dayOfMonth is required' } })
    }
    const day = clampDay(dayOfMonth)
    const fallback = myShareOf(household, req.user.id)
    const amt =
      amount !== undefined && amount !== null && amount !== ''
        ? Math.round(Number(amount))
        : Math.round(Number(fallback))
    if (!Number.isFinite(amt) || amt <= 0) {
      return res
        .status(400)
        .json({ error: { message: 'A positive amount is required' } })
    }

    const nextRunAt = computeNextRun(day)
    const schedule = await prisma.autopaySchedule.upsert({
      where: {
        userId_agreementId: {
          userId: req.user.id,
          agreementId: household.myAgreementId,
        },
      },
      create: {
        userId: req.user.id,
        agreementId: household.myAgreementId,
        amount: amt,
        dayOfMonth: day,
        paymentMethod,
        status: 'active',
        nextRunAt,
      },
      update: {
        amount: amt,
        dayOfMonth: day,
        paymentMethod,
        status: 'active',
        nextRunAt,
      },
    })
    res.json({ autopay: shapeAutopay(schedule) })
  } catch (error) {
    console.error('Save autopay error:', error)
    res.status(500).json({ error: { message: 'Failed to save autopay' } })
  }
})

/**
 * PATCH /api/rent/autopay/:id — pause or resume. Resuming recomputes the
 * next run from today so a stale date never fires immediately.
 */
router.patch('/autopay/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    if (!['active', 'paused'].includes(status)) {
      return res
        .status(400)
        .json({ error: { message: 'status must be active or paused' } })
    }
    const existing = await prisma.autopaySchedule.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (!existing) {
      return res.status(404).json({ error: { message: 'Autopay not found' } })
    }
    const schedule = await prisma.autopaySchedule.update({
      where: { id: existing.id },
      data: {
        status,
        ...(status === 'active' && {
          nextRunAt: computeNextRun(existing.dayOfMonth),
        }),
      },
    })
    res.json({ autopay: shapeAutopay(schedule) })
  } catch (error) {
    console.error('Update autopay error:', error)
    res.status(500).json({ error: { message: 'Failed to update autopay' } })
  }
})

/**
 * DELETE /api/rent/autopay/:id
 */
router.delete('/autopay/:id', authenticate, async (req, res) => {
  try {
    const result = await prisma.autopaySchedule.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (result.count === 0) {
      return res.status(404).json({ error: { message: 'Autopay not found' } })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Delete autopay error:', error)
    res.status(500).json({ error: { message: 'Failed to delete autopay' } })
  }
})

export default router
