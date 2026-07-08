import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * Expense categories mirror IRS Schedule E lines so the Tax Center export
 * needs no mapping. label is what the UI shows; line is the Schedule E line.
 */
export const EXPENSE_CATEGORIES = {
  advertising: { label: 'Advertising', line: 'Line 5' },
  auto_travel: { label: 'Auto & travel', line: 'Line 6' },
  cleaning_maintenance: { label: 'Cleaning & maintenance', line: 'Line 7' },
  insurance: { label: 'Insurance', line: 'Line 9' },
  legal_professional: { label: 'Legal & professional fees', line: 'Line 10' },
  management_fees: { label: 'Management fees', line: 'Line 11' },
  mortgage_interest: { label: 'Mortgage interest', line: 'Line 12' },
  repairs: { label: 'Repairs', line: 'Line 14' },
  supplies: { label: 'Supplies', line: 'Line 15' },
  taxes: { label: 'Taxes', line: 'Line 16' },
  utilities: { label: 'Utilities', line: 'Line 17' },
  other: { label: 'Other', line: 'Line 19' },
}

/**
 * GET /api/expenses?year=&listingId=
 * Owner's expenses, newest first.
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const { year, listingId } = req.query
    const where = { ownerId: req.user.id }
    if (listingId) where.listingId = listingId
    if (year) {
      const y = parseInt(year, 10)
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { date: 'desc' },
    })

    res.json({
      expenses,
      categories: EXPENSE_CATEGORIES,
      total: expenses.reduce((sum, e) => sum + e.amount, 0),
    })
  } catch (error) {
    console.error('List expenses error:', error)
    res.status(500).json({ error: { message: 'Failed to list expenses' } })
  }
})

/**
 * POST /api/expenses
 */
router.post('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const {
      date,
      amount,
      category,
      description,
      vendor,
      receiptUrl,
      listingId,
    } = req.body

    const parsedAmount = Math.round(Number(amount))
    const parsedDate = date ? new Date(date) : null
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: { message: 'Valid date required' } })
    }
    if (!parsedAmount || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: { message: 'A positive amount is required' } })
    }
    if (!EXPENSE_CATEGORIES[category]) {
      return res.status(400).json({ error: { message: 'Invalid category' } })
    }
    if (!description) {
      return res
        .status(400)
        .json({ error: { message: 'Description is required' } })
    }
    if (listingId) {
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, ownerId: req.user.id },
        select: { id: true },
      })
      if (!listing) {
        return res.status(404).json({ error: { message: 'Listing not found' } })
      }
    }

    const expense = await prisma.expense.create({
      data: {
        ownerId: req.user.id,
        date: parsedDate,
        amount: parsedAmount,
        category,
        description,
        vendor: vendor || null,
        receiptUrl: receiptUrl || null,
        listingId: listingId || null,
      },
      include: { listing: { select: { id: true, title: true } } },
    })
    res.status(201).json({ expense })
  } catch (error) {
    console.error('Create expense error:', error)
    res.status(500).json({ error: { message: 'Failed to create expense' } })
  }
})

/**
 * PUT /api/expenses/:id
 */
router.put('/:id', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    })
    if (!existing) {
      return res.status(404).json({ error: { message: 'Expense not found' } })
    }

    const {
      date,
      amount,
      category,
      description,
      vendor,
      receiptUrl,
      listingId,
    } = req.body
    const data = {}
    if (date !== undefined) {
      const parsed = new Date(date)
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: { message: 'Invalid date' } })
      }
      data.date = parsed
    }
    if (amount !== undefined) {
      const parsed = Math.round(Number(amount))
      if (!parsed || parsed <= 0) {
        return res.status(400).json({ error: { message: 'Invalid amount' } })
      }
      data.amount = parsed
    }
    if (category !== undefined) {
      if (!EXPENSE_CATEGORIES[category]) {
        return res.status(400).json({ error: { message: 'Invalid category' } })
      }
      data.category = category
    }
    if (description !== undefined) data.description = description
    if (vendor !== undefined) data.vendor = vendor || null
    if (receiptUrl !== undefined) data.receiptUrl = receiptUrl || null
    if (listingId !== undefined) data.listingId = listingId || null

    const expense = await prisma.expense.update({
      where: { id: existing.id },
      data,
      include: { listing: { select: { id: true, title: true } } },
    })
    res.json({ expense })
  } catch (error) {
    console.error('Update expense error:', error)
    res.status(500).json({ error: { message: 'Failed to update expense' } })
  }
})

/**
 * DELETE /api/expenses/:id
 */
router.delete(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, ownerId: req.user.id },
        select: { id: true },
      })
      if (!existing) {
        return res.status(404).json({ error: { message: 'Expense not found' } })
      }
      await prisma.expense.delete({ where: { id: existing.id } })
      res.json({ message: 'Expense deleted' })
    } catch (error) {
      console.error('Delete expense error:', error)
      res.status(500).json({ error: { message: 'Failed to delete expense' } })
    }
  }
)

/**
 * GET /api/expenses/tax-summary?year=YYYY
 * The Tax Center's data: rental income (completed rent transactions on the
 * owner's applications — the rent `amount`, never Rentra's serviceFee),
 * expenses grouped by Schedule E category, and per-property + per-month
 * breakdowns for the selected tax year.
 */
router.get(
  '/tax-summary',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const ownerId = req.user.id
      const year = parseInt(req.query.year, 10) || new Date().getFullYear()
      const start = new Date(year, 0, 1)
      const end = new Date(year + 1, 0, 1)

      const [transactions, expenses] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            status: 'completed',
            createdAt: { gte: start, lt: end },
            application: { ownerId },
          },
          select: {
            amount: true,
            createdAt: true,
            application: {
              select: {
                listing: { select: { id: true, title: true } },
              },
            },
          },
        }),
        prisma.expense.findMany({
          where: { ownerId, date: { gte: start, lt: end } },
          include: { listing: { select: { id: true, title: true } } },
        }),
      ])

      const byMonth = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expenses: 0,
      }))
      const byProperty = new Map()
      const propertyBucket = listing => {
        const key = listing?.id || 'unassigned'
        if (!byProperty.has(key)) {
          byProperty.set(key, {
            listingId: listing?.id || null,
            title: listing?.title || 'Unassigned',
            income: 0,
            expenses: 0,
          })
        }
        return byProperty.get(key)
      }

      let totalIncome = 0
      for (const t of transactions) {
        totalIncome += t.amount
        byMonth[new Date(t.createdAt).getMonth()].income += t.amount
        propertyBucket(t.application?.listing).income += t.amount
      }

      const byCategory = {}
      let totalExpenses = 0
      for (const e of expenses) {
        totalExpenses += e.amount
        byMonth[new Date(e.date).getMonth()].expenses += e.amount
        propertyBucket(e.listing).expenses += e.amount
        if (!byCategory[e.category]) {
          const meta = EXPENSE_CATEGORIES[e.category] || {
            label: e.category,
            line: '',
          }
          byCategory[e.category] = { ...meta, total: 0, count: 0 }
        }
        byCategory[e.category].total += e.amount
        byCategory[e.category].count += 1
      }

      res.json({
        year,
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          net: totalIncome - totalExpenses,
        },
        byCategory,
        byMonth,
        byProperty: [...byProperty.values()],
        categories: EXPENSE_CATEGORIES,
      })
    } catch (error) {
      console.error('Tax summary error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to build tax summary' } })
    }
  }
)

export default router
