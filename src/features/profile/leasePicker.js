/**
 * Which of a tenant's leases is "the current one", and how to label each.
 * Mirrors server/utils/tenancy.js: a signed lease in force today wins over
 * a signed renewal that starts later and over anything still collecting
 * signatures.
 */

const signed = a => a?.status === 'signed'
const start = a => new Date(a?.terms?.startDate || 0)
const end = a => new Date(a?.terms?.endDate || 0)

/** 'active' | 'ending' | 'upcoming' | 'renewal' | 'amendment' | 'pending' | 'past' */
export function leaseState(a, now = new Date()) {
  if (signed(a)) {
    if (end(a) < now) return 'past'
    if (start(a) > now) return 'upcoming'
    return a.endedAt ? 'ending' : 'active'
  }
  if (a.amendsId) return 'amendment'
  if (a.renewsId) return 'renewal'
  return 'pending'
}

export const ACTIVE_STATES = ['active', 'ending', 'upcoming']
export const SIGNABLE_STATES = ['pending', 'renewal', 'amendment']

const RANK = {
  active: 0,
  ending: 0,
  upcoming: 1,
  amendment: 2,
  renewal: 2,
  pending: 2,
  past: 3,
}

/** The lease the tenant lives under today (or the next best), or null. */
export function pickCurrentLease(agreements = [], now = new Date()) {
  const list = (agreements || []).filter(Boolean)
  if (!list.length) return null
  const inForce = list
    .filter(a => ['active', 'ending'].includes(leaseState(a, now)))
    .sort((x, y) => start(y) - start(x))
  if (inForce.length) return inForce[0]
  const upcoming = list
    .filter(a => leaseState(a, now) === 'upcoming')
    .sort((x, y) => start(x) - start(y))
  if (upcoming.length) return upcoming[0]
  const pending = list
    .filter(a => SIGNABLE_STATES.includes(leaseState(a, now)))
    .sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0))
  return pending[0] || list[0]
}

/** Current first, then upcoming, then things to sign, then past. */
export function sortLeases(agreements = [], now = new Date()) {
  return [...(agreements || [])].sort((x, y) => {
    const r = RANK[leaseState(x, now)] - RANK[leaseState(y, now)]
    return r !== 0 ? r : start(y) - start(x)
  })
}

const shortDate = value =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : ''

export function leaseStatusLabel(state, a) {
  switch (state) {
    case 'active':
      return 'Active'
    case 'ending':
      return `Ends ${shortDate(a?.terms?.endDate)}`
    case 'upcoming':
      return `Starts ${shortDate(a?.terms?.startDate)}`
    case 'renewal':
      return 'Renewal to sign'
    case 'amendment':
      return 'Amendment to sign'
    case 'past':
      return 'Ended'
    default:
      return 'Pending'
  }
}

export function leaseStatusTone(state) {
  switch (state) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'ending':
      return 'bg-amber-100 text-amber-800'
    case 'upcoming':
      return 'bg-blue-100 text-blue-800'
    case 'renewal':
    case 'amendment':
      return 'bg-brand-100 text-brand-700'
    case 'past':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
