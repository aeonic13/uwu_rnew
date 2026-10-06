/**
 * Rent ledger math: what one tenant owes this month once charges and
 * credits are layered on their rent share, and whether a late fee applies.
 * Pure functions, unit tested. Money is whole dollars.
 */

export const CHARGE_TYPES = ['late_fee', 'utility', 'repair', 'other', 'credit']

export const CHARGE_LABELS = {
  late_fee: 'Late fee',
  utility: 'Utility',
  repair: 'Repair',
  other: 'Other charge',
  credit: 'Credit',
}

/** First instant of the month containing `now`, and of the next month. */
export function monthWindow(now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { from, to }
}

const inWindow = (date, { from, to }) => {
  const d = new Date(date)
  return d >= from && d < to
}

/**
 * How much of one charge lands on one tenant: a charge pinned to a tenant
 * is theirs in full; a household charge is split equally.
 */
export function chargeShareFor(charge, tenantId, memberCount) {
  if (charge.userId) return charge.userId === tenantId ? charge.amount : 0
  const members = Math.max(1, memberCount || 1)
  return Math.round(charge.amount / members)
}

/**
 * One tenant's position for the month: rent share plus their part of the
 * charges, minus credits, against what they have paid.
 *
 * @param {object} args
 * @param {number} args.rentShare - The tenant's monthly rent share.
 * @param {object[]} args.charges - RentCharge rows on the lease.
 * @param {object[]} args.payments - Transaction rows for the tenant.
 * @param {string} args.tenantId
 * @param {number} args.memberCount - Tenants on the lease (for household charges).
 * @param {Date} [args.now]
 */
export function tenantLedger({
  rentShare,
  charges = [],
  payments = [],
  tenantId,
  memberCount = 1,
  now = new Date(),
}) {
  const window = monthWindow(now)
  const lines = []
  let otherCharges = 0
  let credits = 0
  for (const charge of charges) {
    if (!inWindow(charge.dueDate, window)) continue
    const share = chargeShareFor(charge, tenantId, memberCount)
    if (share <= 0) continue
    if (charge.type === 'credit') credits += share
    else otherCharges += share
    lines.push({
      id: charge.id,
      type: charge.type,
      label: CHARGE_LABELS[charge.type] || charge.type,
      description: charge.description,
      amount: share,
      household: !charge.userId,
      dueDate: charge.dueDate,
    })
  }
  const monthPayments = payments.filter(p => inWindow(p.createdAt, window))
  const paid = monthPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const pending = monthPayments
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const rentDue = Math.round(Number(rentShare) || 0)
  const due = Math.max(0, rentDue + otherCharges - credits)
  return {
    rentDue,
    otherCharges,
    credits,
    due,
    paid,
    pending,
    balance: Math.max(0, due - paid),
    lines,
  }
}

/**
 * Should a late fee be charged for this month's rent? The rent is late
 * once the grace period after the 1st has passed and the household has
 * not covered the month's rent; one late fee per month.
 */
export function lateFeeAssessment({
  lateFeeAmount,
  lateFeeGraceDays = 0,
  rentDue,
  paidThisMonth,
  alreadyAppliedThisMonth = false,
  now = new Date(),
}) {
  const amount = Math.round(Number(lateFeeAmount) || 0)
  if (amount <= 0) {
    return { applicable: false, amount: 0, reason: 'No late fee on this lease' }
  }
  if (alreadyAppliedThisMonth) {
    return {
      applicable: false,
      amount,
      reason: 'Late fee already applied this month',
    }
  }
  const grace = Math.max(0, Math.round(Number(lateFeeGraceDays) || 0))
  const lateFrom = new Date(now.getFullYear(), now.getMonth(), 1 + grace)
  if (now < lateFrom) {
    return {
      applicable: false,
      amount,
      reason: `Rent is not late until ${lateFrom.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`,
    }
  }
  if ((paidThisMonth || 0) >= (rentDue || 0)) {
    return { applicable: false, amount, reason: 'Rent is paid for this month' }
  }
  return { applicable: true, amount, reason: null }
}
