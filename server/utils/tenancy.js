/**
 * Which of a tenant's approved applications is "their tenancy" right now.
 * A tenant can hold several member rows on one listing (original lease,
 * a signed renewal waiting to start, a pending amendment), so "most recent
 * approved application" is no longer the right answer. Pure, unit tested.
 */

const signed = app => {
  const ag = app.agreement
  if (!ag) return false
  const signers = Array.isArray(ag.signers) ? ag.signers : []
  if (signers.length) return signers.every(s => s.signed)
  return Boolean(ag.tenantSigned && ag.landlordSigned)
}

const inForce = (app, now) => {
  const ag = app.agreement
  return (
    signed(app) && new Date(ag.startDate) <= now && new Date(ag.endDate) >= now
  )
}

const upcoming = (app, now) =>
  signed(app) && new Date(app.agreement.startDate) > now

const byStart = (a, b) =>
  new Date(a.agreement?.startDate || 0) - new Date(b.agreement?.startDate || 0)
const byNewest = (a, b) =>
  new Date(b.createdAt || 0) - new Date(a.createdAt || 0)

/**
 * Preference order: a signed lease in force today; else the signed lease
 * that starts soonest; else the newest lease still collecting signatures;
 * else the newest approved row. Returns null for an empty list.
 *
 * Each application should carry `agreement` with `startDate`, `endDate`
 * and `signers[].signed` (or the tenantSigned/landlordSigned mirrors).
 */
export function pickCurrentApplication(applications = [], now = new Date()) {
  const approved = applications.filter(a => a && a.status === 'approved')
  if (!approved.length) return null
  const current = approved.filter(a => inForce(a, now)).sort(byStart)
  if (current.length) return current[current.length - 1]
  const next = approved.filter(a => upcoming(a, now)).sort(byStart)
  if (next.length) return next[0]
  const unsigned = approved
    .filter(a => a.agreement && !signed(a))
    .sort(byNewest)
  if (unsigned.length) return unsigned[0]
  return [...approved].sort(byNewest)[0]
}
