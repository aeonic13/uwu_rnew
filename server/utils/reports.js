/**
 * Pure helpers for the landlord's portfolio reports (routes/reports.js):
 * vacancy, income versus expenses by month and the year summary. No Prisma
 * here so they unit test in isolation.
 *
 * All month and day math is done in UTC. Lease dates and the date-only
 * values the client posts are stored as UTC midnight, so local-time
 * bucketing would move "2026-06-01" into May on any server west of
 * Greenwich.
 */

import { leaseFullySigned } from './portfolio.js'

const DAY_MS = 24 * 60 * 60 * 1000

const pad2 = n => String(n).padStart(2, '0')

/** ['2026-01', '2026-02', …, '2026-12'] */
export function monthKeys(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad2(i + 1)}`)
}

/**
 * A lease that occupies the unit. A Rentra lease counts once every signer
 * has signed. An imported lease (signed off-platform, see
 * EXISTING_TENANT_ONBOARDING_PLAN.md) counts once the landlord has attested
 * to it: the tenants already live there, and their pending invite only
 * links an account to the lease.
 */
export function leaseInForce(lease) {
  if (!lease) return false
  if (lease.source === 'imported') {
    const signers = Array.isArray(lease.signers) ? lease.signers : []
    const landlord = signers.find(s => s.role === 'landlord')
    return landlord ? Boolean(landlord.signed) : Boolean(lease.landlordSigned)
  }
  return leaseFullySigned(lease)
}

/** Lease term as UTC millisecond bounds, or null when the dates are unusable. */
function leaseBounds(lease) {
  const start = new Date(lease.startDate).getTime()
  const end = new Date(lease.endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return { start, end }
}

/** True when a lease in force overlaps the given month (0-based index). */
export function leaseCoversMonth(lease, year, monthIndex) {
  if (!leaseInForce(lease)) return false
  const bounds = leaseBounds(lease)
  if (!bounds) return false
  const monthStart = Date.UTC(year, monthIndex, 1)
  const monthEnd = Date.UTC(year, monthIndex + 1, 1) // exclusive
  return bounds.start < monthEnd && bounds.end >= monthStart
}

const dayNumber = value => Math.floor(new Date(value).getTime() / DAY_MS)

/**
 * Days in [from, to] (inclusive, whole UTC days) not covered by any lease in
 * force. Overlapping leases are merged so a renewal that starts the day the
 * old term ends never double counts. Pass `now` to cap `to` at today, so the
 * current year only reports vacancy that has already happened.
 */
export function vacancyDays({ leases, from, to, now }) {
  let toDay = dayNumber(to)
  if (now) toDay = Math.min(toDay, dayNumber(now))
  const fromDay = dayNumber(from)
  if (Number.isNaN(fromDay) || Number.isNaN(toDay) || toDay < fromDay) return 0

  const intervals = []
  for (const lease of leases || []) {
    if (!leaseInForce(lease)) continue
    const bounds = leaseBounds(lease)
    if (!bounds) continue
    const start = Math.max(Math.floor(bounds.start / DAY_MS), fromDay)
    const end = Math.min(Math.floor(bounds.end / DAY_MS), toDay)
    if (end >= start) intervals.push([start, end])
  }
  intervals.sort((a, b) => a[0] - b[0])

  let covered = 0
  let current = null
  for (const [start, end] of intervals) {
    if (current && start <= current[1] + 1) {
      current[1] = Math.max(current[1], end)
    } else {
      if (current) covered += current[1] - current[0] + 1
      current = [start, end]
    }
  }
  if (current) covered += current[1] - current[0] + 1

  return toDay - fromDay + 1 - covered
}

/** Distinct agreements reachable from a listing's applications. */
function leasesOf(applications) {
  const seen = new Map()
  for (const app of applications || []) {
    const lease = app?.agreement
    if (lease && !seen.has(lease.id)) seen.set(lease.id, lease)
  }
  return [...seen.values()]
}

/** 0–11 when the date falls in `year`, otherwise -1. */
function monthIndexIn(value, year) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() !== year) return -1
  return d.getUTCMonth()
}

const round1 = n => Math.round(n * 10) / 10

/**
 * The year's report for one landlord.
 *
 * `listings` carry `applications[].transactions[]` (income is the `amount`
 * of completed transactions), `applications[].agreement` with its `signers`,
 * and `expenses[]`. `expenses` holds the portfolio-level rows (listingId
 * null); any row that also appears under a listing is counted once, by id.
 * Portfolio-level expenses count toward totals, months and byCategory but
 * belong to no property.
 *
 * For the current year, averageOccupancy and occupiedMonths only consider
 * months up to the current one, and vacancy is capped at today.
 */
export function buildReport({ year, listings = [], expenses = [], now }) {
  const today = now ? new Date(now) : new Date()
  const keys = monthKeys(year)
  const todayYear = today.getUTCFullYear()
  // How many of the year's months have started.
  const monthsElapsed =
    year < todayYear ? 12 : year > todayYear ? 0 : today.getUTCMonth() + 1

  const yearStart = new Date(Date.UTC(year, 0, 1))
  const yearEnd = new Date(Date.UTC(year, 11, 31))
  const vacancyWindow = { from: yearStart, to: yearEnd, now: today }

  const months = keys.map(month => ({
    month,
    income: 0,
    expenses: 0,
    net: 0,
    occupiedUnits: 0,
    totalUnits: listings.length,
    occupancyRate: 0,
  }))
  const categoryTotals = new Map()
  const seenExpenses = new Set()
  let totalVacancyDays = 0

  const addExpense = (expense, property) => {
    if (expense.id != null) {
      if (seenExpenses.has(expense.id)) return
      seenExpenses.add(expense.id)
    }
    const idx = monthIndexIn(expense.date, year)
    if (idx < 0) return
    const amount = Number(expense.amount) || 0
    months[idx].expenses += amount
    const category = expense.category || 'other'
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount)
    if (property) property.expenses += amount
  }

  const byProperty = listings.map(listing => {
    const property = {
      listingId: listing.id,
      title: listing.title,
      income: 0,
      expenses: 0,
      net: 0,
      occupiedMonths: 0,
      vacancyDays: 0,
    }

    for (const app of listing.applications || []) {
      for (const t of app.transactions || []) {
        if (t.status !== 'completed') continue
        const idx = monthIndexIn(t.createdAt, year)
        if (idx < 0) continue
        const amount = Number(t.amount) || 0
        months[idx].income += amount
        property.income += amount
      }
    }

    const leases = leasesOf(listing.applications)
    keys.forEach((_, idx) => {
      const occupied = leases.some(l => leaseCoversMonth(l, year, idx))
      if (!occupied) return
      months[idx].occupiedUnits += 1
      if (idx < monthsElapsed) property.occupiedMonths += 1
    })
    property.vacancyDays = vacancyDays({ leases, ...vacancyWindow })
    totalVacancyDays += property.vacancyDays

    for (const e of listing.expenses || []) addExpense(e, property)

    property.net = property.income - property.expenses
    return property
  })

  for (const e of expenses) addExpense(e, null)

  let income = 0
  let expenseTotal = 0
  let occupancySum = 0
  for (const [idx, m] of months.entries()) {
    m.net = m.income - m.expenses
    m.occupancyRate =
      m.totalUnits > 0 ? round1((m.occupiedUnits / m.totalUnits) * 100) : 0
    income += m.income
    expenseTotal += m.expenses
    if (idx < monthsElapsed) occupancySum += m.occupancyRate
  }

  const byCategory = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category))

  return {
    year,
    months,
    totals: {
      income,
      expenses: expenseTotal,
      net: income - expenseTotal,
      averageOccupancy:
        monthsElapsed > 0 ? round1(occupancySum / monthsElapsed) : 0,
      vacancyDays: totalVacancyDays,
    },
    byCategory,
    byProperty,
  }
}

/** One CSV field: quoted when it holds a comma, quote or newline. */
export function csvField(value) {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * The report as CSV: monthly rows, a blank line, then one row per property.
 */
export function reportToCsv(report) {
  const rows = [
    [
      'Month',
      'Income',
      'Expenses',
      'Net',
      'Occupied units',
      'Total units',
      'Occupancy %',
    ],
    ...report.months.map(m => [
      m.month,
      m.income,
      m.expenses,
      m.net,
      m.occupiedUnits,
      m.totalUnits,
      m.occupancyRate,
    ]),
    [],
    ['Property', 'Income', 'Expenses', 'Net', 'Occupied months', 'Vacant days'],
    ...report.byProperty.map(p => [
      p.title,
      p.income,
      p.expenses,
      p.net,
      p.occupiedMonths,
      p.vacancyDays,
    ]),
  ]
  return rows.map(r => r.map(csvField).join(',')).join('\r\n') + '\r\n'
}
