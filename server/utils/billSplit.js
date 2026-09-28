/**
 * Split math shared by utility bills and rent splits. Pure functions, no
 * Prisma, so the routes stay thin and the arithmetic is unit tested.
 */

const round2 = n => Math.round(n * 100) / 100

/**
 * Divide `total` among `participants`.
 *
 * - `equal`: every participant gets total / n, rounded to cents, with any
 *   leftover cent(s) given to the first participants so the shares always
 *   sum to the total.
 * - `custom`: each participant carries a `percent` (0-100) or an explicit
 *   `amount`. Percentages must sum to 100; amounts must sum to the total.
 *
 * @param {number} total
 * @param {'equal'|'custom'} mode
 * @param {Array<{name:string,userId?:string|null,percent?:number,amount?:number}>} participants
 * @returns {Array<{name:string,userId:string|null,amount:number}>}
 */
export function computeShares(total, mode, participants) {
  const t = Number(total)
  if (!(t > 0)) throw new Error('A positive total is required')
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error('At least one participant is required')
  }

  const base = participants.map(p => ({
    name: String(p.name || '').trim() || 'Roommate',
    userId: p.userId || null,
  }))

  if (mode === 'custom') {
    const usesPercent = participants.some(
      p => p.percent !== undefined && p.percent !== null && p.percent !== ''
    )
    if (usesPercent) {
      const pcts = participants.map(p => Number(p.percent) || 0)
      const sum = pcts.reduce((a, b) => a + b, 0)
      if (Math.abs(sum - 100) > 0.05) {
        throw new Error('Custom percentages must add up to 100%')
      }
      return settle(
        base,
        pcts.map(pct => (t * pct) / 100),
        t
      )
    }
    const amounts = participants.map(p => Number(p.amount) || 0)
    const sum = amounts.reduce((a, b) => a + b, 0)
    if (Math.abs(sum - t) > 0.05) {
      throw new Error('Custom amounts must add up to the total')
    }
    return settle(base, amounts, t)
  }

  return settle(
    base,
    base.map(() => t / base.length),
    t
  )
}

// Round each raw share to cents, then fix the rounding drift one cent at a
// time so Σ shares === total exactly. Extra cents go to the first
// participants; overshoot comes off the last ones, so earlier shares are
// never smaller than later ones.
function settle(base, raw, total) {
  const cents = raw.map(a => Math.round(a * 100))
  const n = cents.length
  const targetCents = Math.round(total * 100)
  let diff = targetCents - cents.reduce((a, b) => a + b, 0)
  let i = 0
  while (diff !== 0 && n > 0) {
    const step = diff > 0 ? 1 : -1
    const idx = step > 0 ? i % n : n - 1 - (i % n)
    cents[idx] += step
    diff -= step
    i += 1
  }
  return base.map((p, idx) => ({ ...p, amount: cents[idx] / 100 }))
}

/**
 * Billing month (YYYY-MM) for a bill: its due date if set, otherwise when
 * it was created.
 */
export function periodFor(dueDate, createdAt = new Date()) {
  const d = dueDate ? new Date(dueDate) : new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}`
}

/**
 * Consolidate every bill the viewer is part of into who-owes-whom
 * balances. The bill creator paid the provider, so each unpaid share on
 * their bill is owed to them; the viewer's own unpaid shares on other
 * people's bills are what the viewer owes.
 *
 * @param {Array} bills Prisma bills with `createdById`, `createdBy`
 *   ({firstName,lastName}) and `shares` ({userId,name,amount,paid}).
 * @param {string} viewerId
 */
export function consolidateBalances(bills, viewerId) {
  const owedToMe = new Map() // key -> { key, userId, name, amount, bills }
  const iOwe = new Map()

  for (const bill of bills || []) {
    const shares = bill.shares || []
    if (bill.createdById === viewerId) {
      for (const s of shares) {
        if (s.paid || s.userId === viewerId) continue
        const key = s.userId || `name:${s.name.toLowerCase()}`
        const row = owedToMe.get(key) || {
          key,
          userId: s.userId || null,
          name: s.name,
          amount: 0,
          bills: 0,
        }
        row.amount = round2(row.amount + s.amount)
        row.bills += 1
        owedToMe.set(key, row)
      }
    } else {
      const mine = shares.find(s => s.userId === viewerId && !s.paid)
      if (!mine) continue
      const key = bill.createdById
      const creator = bill.createdBy
      const row = iOwe.get(key) || {
        key,
        userId: key,
        name: creator
          ? `${creator.firstName} ${creator.lastName}`.trim()
          : 'Roommate',
        amount: 0,
        bills: 0,
      }
      row.amount = round2(row.amount + mine.amount)
      row.bills += 1
      iOwe.set(key, row)
    }
  }

  const owedRows = [...owedToMe.values()].sort((a, b) => b.amount - a.amount)
  const oweRows = [...iOwe.values()].sort((a, b) => b.amount - a.amount)
  return {
    owedToMe: owedRows,
    iOwe: oweRows,
    totalOwedToMe: round2(owedRows.reduce((a, r) => a + r.amount, 0)),
    totalIOwe: round2(oweRows.reduce((a, r) => a + r.amount, 0)),
  }
}

/**
 * Group bills by billing period for the monthly view: total, count and a
 * per-utility breakdown, newest month first.
 */
export function summarizeByPeriod(bills) {
  const byPeriod = new Map()
  for (const bill of bills || []) {
    const period = bill.period || periodFor(bill.dueDate, bill.createdAt)
    if (!period) continue
    const row = byPeriod.get(period) || {
      period,
      total: 0,
      count: 0,
      byType: {},
    }
    row.total = round2(row.total + Number(bill.total || 0))
    row.count += 1
    row.byType[bill.utilityType] = round2(
      (row.byType[bill.utilityType] || 0) + Number(bill.total || 0)
    )
    byPeriod.set(period, row)
  }
  return [...byPeriod.values()].sort((a, b) => (a.period < b.period ? 1 : -1))
}
