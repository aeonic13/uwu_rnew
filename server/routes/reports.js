import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import { buildReport, reportToCsv } from '../utils/reports.js'

const router = express.Router()

/** The landlord whose portfolio the request acts on. */
const ownerIdOf = req => req.portfolioId || req.user.id

function parseYear(value) {
  const year = parseInt(value, 10)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return new Date().getUTCFullYear()
  }
  return year
}

/**
 * The owner's listings with everything the report needs, with the money
 * rows already narrowed to the year: completed rent transactions, the lease
 * (with signers) on each application, and the property's expenses. The
 * portfolio-level expenses (no listing) come back separately.
 */
async function loadReport(ownerId, year) {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  const inYear = { gte: start, lt: end }

  const [listings, expenses] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        bedrooms: true,
        active: true,
        applications: {
          select: {
            id: true,
            transactions: {
              where: { status: 'completed', createdAt: inYear },
              select: { amount: true, status: true, createdAt: true },
            },
            agreement: {
              select: {
                id: true,
                source: true,
                startDate: true,
                endDate: true,
                endedAt: true,
                tenantSigned: true,
                landlordSigned: true,
                signers: { select: { role: true, signed: true } },
              },
            },
          },
        },
        expenses: {
          where: { date: inYear },
          select: {
            id: true,
            date: true,
            amount: true,
            category: true,
            listingId: true,
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: { ownerId, listingId: null, date: inYear },
      select: {
        id: true,
        date: true,
        amount: true,
        category: true,
        listingId: true,
      },
    }),
  ])

  return buildReport({ year, listings, expenses, now: new Date() })
}

/**
 * GET /api/reports/summary?year=YYYY
 * Vacancy, income versus expenses by month and the year summary for the
 * landlord's portfolio. Defaults to the current year.
 */
router.get(
  '/summary',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const year = parseYear(req.query.year)
      const report = await loadReport(ownerIdOf(req), year)
      res.json(report)
    } catch (error) {
      console.error('Report summary error:', error)
      res.status(500).json({ error: { message: 'Failed to build report' } })
    }
  }
)

/**
 * GET /api/reports/summary.csv?year=YYYY
 * The same report as a CSV download: monthly rows, a blank line, then one
 * row per property.
 */
router.get(
  '/summary.csv',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const year = parseYear(req.query.year)
      const report = await loadReport(ownerIdOf(req), year)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="rentra-report-${year}.csv"`
      )
      res.send(reportToCsv(report))
    } catch (error) {
      console.error('Report CSV error:', error)
      res.status(500).json({ error: { message: 'Failed to export report' } })
    }
  }
)

export default router
