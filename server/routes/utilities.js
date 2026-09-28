import express from 'express'
import multer from 'multer'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { documentUpload, uploadToCloudinary } from '../utils/cloudinary.js'
import { sendUtilityShareEmail } from '../utils/email.js'
import {
  computeShares,
  consolidateBalances,
  summarizeByPeriod,
  periodFor,
} from '../utils/billSplit.js'

/**
 * Household utility bills. Whoever uploads a bill is the one paying the
 * provider; everyone else's share is owed back to them. Bills are visible
 * to the uploader and to every roommate with a share, and the summary
 * consolidates all of them into who-owes-whom balances.
 */
const router = express.Router()

const billInclude = {
  shares: { orderBy: { amount: 'desc' } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
}

// Bills the viewer uploaded or has a share on.
const visibleTo = userId => ({
  OR: [{ createdById: userId }, { shares: { some: { userId } } }],
})

// Shape a bill for the UtilityBillSplit UI.
function shape(bill, viewerId) {
  const mine = (bill.shares || []).find(s => s.userId === viewerId) || null
  return {
    id: bill.id,
    utilityType: bill.utilityType,
    provider: bill.provider,
    dueDate: bill.dueDate,
    period: bill.period,
    total: bill.total,
    splitMode: bill.splitMode,
    notes: bill.notes,
    fileUrl: bill.fileUrl,
    fileName: bill.fileName,
    mimeType: bill.mimeType,
    createdAt: bill.createdAt,
    createdBy: bill.createdBy
      ? {
          id: bill.createdBy.id,
          name: `${bill.createdBy.firstName} ${bill.createdBy.lastName}`,
        }
      : null,
    role: bill.createdById === viewerId ? 'owner' : 'participant',
    myShare: mine
      ? { id: mine.id, amount: mine.amount, paid: mine.paid }
      : null,
    participants: (bill.shares || []).map(s => ({
      id: s.id,
      name: s.name,
      userId: s.userId,
      share: s.amount,
      paid: s.paid,
      paidAt: s.paidAt,
    })),
  }
}

/**
 * GET /api/utilities/bills — bills the user uploaded or owes on.
 */
router.get('/bills', authenticate, async (req, res) => {
  try {
    const bills = await prisma.utilityBill.findMany({
      where: visibleTo(req.user.id),
      include: billInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ bills: bills.map(b => shape(b, req.user.id)) })
  } catch (error) {
    console.error('List utility bills error:', error)
    res.status(500).json({ error: { message: 'Failed to list bills' } })
  }
})

/**
 * GET /api/utilities/summary — consolidated balances and monthly totals
 * across every bill the user is part of.
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const bills = await prisma.utilityBill.findMany({
      where: visibleTo(req.user.id),
      include: billInclude,
    })
    const balances = consolidateBalances(bills, req.user.id)
    const openBills = bills.filter(b =>
      b.shares.some(s => !s.paid && s.userId !== b.createdById)
    ).length
    res.json({
      ...balances,
      openBills,
      totalBills: bills.length,
      byPeriod: summarizeByPeriod(bills),
    })
  } catch (error) {
    console.error('Utility summary error:', error)
    res.status(500).json({ error: { message: 'Failed to load summary' } })
  }
})

/**
 * POST /api/utilities/bills — upload a bill and split it.
 * multipart/form-data: file?, utilityType, total, provider?, dueDate?,
 * notes?, splitMode, shares (JSON: [{ name, userId?, percent? }]).
 * JSON bodies without a file are accepted too.
 */
router.post(
  '/bills',
  authenticate,
  documentUpload.single('file'),
  async (req, res) => {
    try {
      const {
        utilityType,
        provider,
        dueDate,
        total,
        notes,
        splitMode = 'equal',
      } = req.body
      let shares = req.body.shares
      if (typeof shares === 'string') {
        try {
          shares = JSON.parse(shares)
        } catch {
          return res
            .status(400)
            .json({ error: { message: 'shares must be a JSON array' } })
        }
      }

      if (!utilityType || !(Number(total) > 0)) {
        return res.status(400).json({
          error: { message: 'Utility type and a total are required' },
        })
      }

      let computed
      try {
        computed = computeShares(Number(total), splitMode, shares)
      } catch (err) {
        return res.status(400).json({ error: { message: err.message } })
      }

      let file = {}
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: `rentra/bills/${req.user.id}`,
          publicId: `bill_${Date.now()}`,
          resourceType: 'auto',
        })
        file = {
          fileUrl: result.secure_url,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
        }
      }

      const due = dueDate ? new Date(dueDate) : null
      const now = new Date()
      const bill = await prisma.utilityBill.create({
        data: {
          utilityType,
          provider: provider || null,
          dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
          period: periodFor(due, now),
          total: Number(total),
          splitMode,
          notes: notes ? String(notes).slice(0, 500) : null,
          createdById: req.user.id,
          ...file,
          shares: {
            create: computed.map(s => ({
              name: s.name,
              amount: s.amount,
              userId: s.userId,
              // The uploader pays the provider, so their own share is
              // settled the moment the bill is posted.
              paid: s.userId === req.user.id,
              paidAt: s.userId === req.user.id ? now : null,
            })),
          },
        },
        include: billInclude,
      })

      // Tell each roommate on Rentra what they owe. Best-effort.
      const recipientIds = bill.shares
        .map(s => s.userId)
        .filter(id => id && id !== req.user.id)
      if (recipientIds.length) {
        const creatorName = `${req.user.firstName} ${req.user.lastName}`
        prisma.user
          .findMany({
            where: { id: { in: recipientIds } },
            select: { id: true, firstName: true, email: true },
          })
          .then(users =>
            Promise.all(
              users.map(u =>
                sendUtilityShareEmail({
                  recipient: u,
                  creatorName,
                  bill,
                  share: bill.shares.find(s => s.userId === u.id),
                })
              )
            )
          )
          .catch(err => console.error('Utility share email error:', err))
      }

      res.status(201).json({ bill: shape(bill, req.user.id) })
    } catch (error) {
      console.error('Create utility bill error:', error)
      res.status(500).json({ error: { message: 'Failed to create bill' } })
    }
  }
)

/**
 * PUT /api/utilities/bills/:billId/shares/:shareId — mark a share paid or
 * unpaid. The uploader can update any share; a roommate only their own.
 */
router.put('/bills/:billId/shares/:shareId', authenticate, async (req, res) => {
  try {
    const { paid } = req.body
    const share = await prisma.utilityBillShare.findFirst({
      where: { id: req.params.shareId, billId: req.params.billId },
      include: { bill: { select: { createdById: true } } },
    })
    if (!share) {
      return res.status(404).json({ error: { message: 'Share not found' } })
    }
    const isOwner = share.bill.createdById === req.user.id
    if (!isOwner && share.userId !== req.user.id) {
      return res.status(403).json({ error: { message: 'Not authorized' } })
    }
    const updated = await prisma.utilityBillShare.update({
      where: { id: share.id },
      data: { paid: !!paid, paidAt: paid ? new Date() : null },
    })
    res.json({ share: updated })
  } catch (error) {
    console.error('Update share error:', error)
    res.status(500).json({ error: { message: 'Failed to update share' } })
  }
})

/**
 * DELETE /api/utilities/bills/:billId — delete a bill (uploader only).
 */
router.delete('/bills/:billId', authenticate, async (req, res) => {
  try {
    const bill = await prisma.utilityBill.findUnique({
      where: { id: req.params.billId },
      select: { createdById: true },
    })
    if (!bill) {
      return res.status(404).json({ error: { message: 'Bill not found' } })
    }
    if (bill.createdById !== req.user.id) {
      return res.status(403).json({ error: { message: 'Not authorized' } })
    }
    await prisma.utilityBill.delete({ where: { id: req.params.billId } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete utility bill error:', error)
    res.status(500).json({ error: { message: 'Failed to delete bill' } })
  }
})

// Multer errors (size, type) as the standard { error: { message } } shape.
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 15MB.'
        : error.message
    return res.status(400).json({ error: { message } })
  }
  if (error?.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: { message: error.message } })
  }
  next(error)
})

export default router
