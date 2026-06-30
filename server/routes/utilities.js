import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

// Shape a bill for the UtilityBillSplit UI.
function shape(bill) {
  return {
    id: bill.id,
    utilityType: bill.utilityType,
    provider: bill.provider,
    dueDate: bill.dueDate,
    total: bill.total,
    splitMode: bill.splitMode,
    createdAt: bill.createdAt,
    participants: (bill.shares || []).map(s => ({
      id: s.id,
      name: s.name,
      userId: s.userId,
      share: s.amount,
      paid: s.paid,
    })),
  }
}

/**
 * GET /api/utilities/bills — bills the user created.
 */
router.get('/bills', authenticate, async (req, res) => {
  try {
    const bills = await prisma.utilityBill.findMany({
      where: { createdById: req.user.id },
      include: { shares: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ bills: bills.map(shape) })
  } catch (error) {
    console.error('List utility bills error:', error)
    res.status(500).json({ error: { message: 'Failed to list bills' } })
  }
})

/**
 * POST /api/utilities/bills — create a bill with its shares.
 */
router.post('/bills', authenticate, async (req, res) => {
  try {
    const {
      utilityType,
      provider,
      dueDate,
      total,
      splitMode = 'equal',
      shares = [],
    } = req.body

    if (!utilityType || !(Number(total) > 0)) {
      return res
        .status(400)
        .json({ error: { message: 'Utility type and a total are required' } })
    }
    if (!Array.isArray(shares) || shares.length === 0) {
      return res
        .status(400)
        .json({ error: { message: 'At least one participant is required' } })
    }

    const bill = await prisma.utilityBill.create({
      data: {
        utilityType,
        provider: provider || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        total: Number(total),
        splitMode,
        createdById: req.user.id,
        shares: {
          create: shares.map(s => ({
            name: s.name,
            amount: Number(s.amount) || 0,
            userId: s.userId || null,
          })),
        },
      },
      include: { shares: true },
    })
    res.status(201).json({ bill: shape(bill) })
  } catch (error) {
    console.error('Create utility bill error:', error)
    res.status(500).json({ error: { message: 'Failed to create bill' } })
  }
})

/**
 * PUT /api/utilities/bills/:billId/shares/:shareId — toggle a share's paid flag.
 */
router.put('/bills/:billId/shares/:shareId', authenticate, async (req, res) => {
  try {
    const { paid } = req.body
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
    const share = await prisma.utilityBillShare.update({
      where: { id: req.params.shareId },
      data: { paid: !!paid },
    })
    res.json({ share })
  } catch (error) {
    console.error('Update share error:', error)
    res.status(500).json({ error: { message: 'Failed to update share' } })
  }
})

/**
 * DELETE /api/utilities/bills/:billId — delete a bill (creator only).
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

export default router
