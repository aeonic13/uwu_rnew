/**
 * Pure helpers for the landlord's property-centric dashboard
 * (routes/properties.js). No Prisma here so they unit test in isolation.
 */

export const OPEN_TICKET_STATUSES = ['pending', 'in-progress']

const startOfMonth = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), 1)

/** True when every signer row on the agreement has signed. */
export function leaseFullySigned(agreement) {
  if (!agreement) return false
  const signers = Array.isArray(agreement.signers) ? agreement.signers : []
  if (signers.length === 0) {
    return Boolean(agreement.tenantSigned && agreement.landlordSigned)
  }
  return signers.every(s => s.signed)
}

/**
 * Distinct agreements reachable from a listing's applications, newest lease
 * start first. Group members point at the same Agreement row.
 */
export function leasesOf(applications) {
  const seen = new Map()
  for (const app of applications || []) {
    const ag = app.agreement
    if (ag && !seen.has(ag.id)) seen.set(ag.id, ag)
  }
  return [...seen.values()].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  )
}

/** A lease that is in force today (signed, not yet ended). */
export function leaseIsCurrent(agreement, now = new Date()) {
  if (!leaseFullySigned(agreement)) return false
  return new Date(agreement.endDate) >= now
}

/**
 * One-word state for a property card.
 *   leased              a fully signed lease is in force
 *   pending_signatures  a lease exists but not everyone has signed
 *   listed              no lease, listing active (taking applications)
 *   inactive            no lease, listing switched off
 */
export function propertyStatus({ active, leases }, now = new Date()) {
  const list = leases || []
  if (list.some(l => leaseIsCurrent(l, now))) return 'leased'
  if (list.some(l => !leaseFullySigned(l) && new Date(l.endDate) >= now)) {
    return 'pending_signatures'
  }
  return active ? 'listed' : 'inactive'
}

/** Dollars completed on these transactions since the first of the month. */
export function collectedThisMonth(transactions, now = new Date()) {
  const from = startOfMonth(now)
  return (transactions || [])
    .filter(t => t.status === 'completed' && new Date(t.createdAt) >= from)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

/**
 * Card summary for one listing. Expects the listing loaded with
 * `applications` (each with `agreement.signers`, `transactions`) and
 * `maintenanceTickets`.
 */
export function summarizeProperty(listing, now = new Date()) {
  const applications = listing.applications || []
  const leases = leasesOf(applications)
  const current = leases.filter(l => leaseIsCurrent(l, now))
  const tenantIds = new Set(
    applications
      .filter(a => a.agreementId && current.some(l => l.id === a.agreementId))
      .map(a => a.applicantId)
  )
  const status = propertyStatus({ active: listing.active, leases }, now)
  const monthlyRent =
    status === 'leased'
      ? current.reduce((sum, l) => sum + (l.monthlyRent || 0), 0)
      : listing.price || 0
  const tickets = listing.maintenanceTickets || []

  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    streetAddress: listing.streetAddress || null,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    propertyType: listing.propertyType,
    image: listing.images?.[0] || null,
    active: Boolean(listing.active),
    status,
    tenants: tenantIds.size,
    pendingApplications: applications.filter(a => a.status === 'pending')
      .length,
    openTickets: tickets.filter(t => OPEN_TICKET_STATUSES.includes(t.status))
      .length,
    monthlyRent,
    collectedThisMonth: collectedThisMonth(
      applications.flatMap(a => a.transactions || []),
      now
    ),
    leaseEnd: current.length
      ? current.map(l => l.endDate).sort((a, b) => new Date(a) - new Date(b))[0]
      : null,
  }
}

/** Portfolio-wide totals over property summaries. */
export function portfolioTotals(summaries) {
  const list = summaries || []
  const sum = key => list.reduce((acc, p) => acc + (p[key] || 0), 0)
  return {
    properties: list.length,
    leased: list.filter(p => p.status === 'leased').length,
    pendingSignatures: list.filter(p => p.status === 'pending_signatures')
      .length,
    listed: list.filter(p => p.status === 'listed').length,
    inactive: list.filter(p => p.status === 'inactive').length,
    tenants: sum('tenants'),
    pendingApplications: sum('pendingApplications'),
    openTickets: sum('openTickets'),
    monthlyRent: list
      .filter(p => p.status === 'leased')
      .reduce((acc, p) => acc + p.monthlyRent, 0),
    collectedThisMonth: sum('collectedThisMonth'),
  }
}
