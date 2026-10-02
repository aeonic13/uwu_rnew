/**
 * Pure helpers for onboarding an existing household onto an occupied
 * property (routes/properties.js POST /:id/onboard and
 * routes/tenantInvites.js). No Prisma here so they unit test in isolation.
 */

export const INVITE_TTL_DAYS = 14
export const INVITE_TTL_MS = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
export const MAX_HOUSEHOLD = 12

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Parse a YYYY-MM-DD (or ISO) value to a UTC-midnight Date, or null. */
export function parseDateOnly(value) {
  if (!value) return null
  const str = String(value).trim()
  const iso = DATE_ONLY_RE.test(str) ? `${str}T00:00:00.000Z` : str
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * The next anniversary of `startDate` strictly after `now`, at UTC midnight.
 * Month-to-month leases store this as their endDate so the required column
 * stays meaningful; a later job rolls it forward a year at a time.
 */
export function nextAnniversary(startDate, now = new Date()) {
  const start = parseDateOnly(startDate)
  if (!start) return null
  const today = parseDateOnly(now.toISOString())
  let candidate = new Date(
    Date.UTC(today.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  )
  if (candidate <= today) {
    candidate = new Date(
      Date.UTC(
        today.getUTCFullYear() + 1,
        start.getUTCMonth(),
        start.getUTCDate()
      )
    )
  }
  // A lease that starts in the future ends on its first anniversary.
  if (start > today) {
    candidate = new Date(
      Date.UTC(
        start.getUTCFullYear() + 1,
        start.getUTCMonth(),
        start.getUTCDate()
      )
    )
  }
  return candidate
}

export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

const cleanName = v =>
  String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)

const toWholeDollars = v => {
  if (v === '' || v === null || v === undefined) return NaN
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : NaN
}

/**
 * Validate the onboarding request body.
 *
 * body = {
 *   lease: { startDate, endDate?, monthToMonth?, monthlyRent,
 *            securityDeposit, documentUrl?, documentId? },
 *   tenants: [{ firstName, lastName, email, phone? }],
 *   attest: true,
 * }
 *
 * Returns { ok: true, value } with normalised values, or
 * { ok: false, errors: string[] } (every problem listed, not just the first).
 */
export function validateOnboarding(
  body,
  { ownerEmail, now = new Date() } = {}
) {
  const errors = []
  const lease = body?.lease || {}
  const tenants = Array.isArray(body?.tenants) ? body.tenants : []

  if (body?.attest !== true) {
    errors.push('Confirm that these terms match the lease your tenants signed.')
  }

  const startDate = parseDateOnly(lease.startDate)
  if (!startDate) errors.push('A lease start date is required.')

  const monthToMonth = lease.monthToMonth === true
  let endDate = null
  if (monthToMonth) {
    endDate = startDate ? nextAnniversary(startDate, now) : null
  } else {
    endDate = parseDateOnly(lease.endDate)
    if (!endDate) {
      errors.push(
        'A lease end date is required unless the lease is month-to-month.'
      )
    } else if (startDate && endDate <= startDate) {
      errors.push('The lease end date must be after the start date.')
    }
  }
  if (endDate && endDate < parseDateOnly(now.toISOString())) {
    errors.push(
      'This lease has already ended. Only current leases can be imported.'
    )
  }

  const monthlyRent = toWholeDollars(lease.monthlyRent)
  if (!(monthlyRent > 0)) errors.push('Monthly rent must be a positive amount.')
  const securityDeposit = toWholeDollars(lease.securityDeposit)
  if (!(securityDeposit >= 0)) {
    errors.push('The deposit held must be zero or a positive amount.')
  }

  const documentUrl =
    typeof lease.documentUrl === 'string' &&
    /^https?:\/\//.test(lease.documentUrl)
      ? lease.documentUrl.slice(0, 2048)
      : null

  if (tenants.length === 0) errors.push('Add at least one tenant.')
  if (tenants.length > MAX_HOUSEHOLD) {
    errors.push(`A household can have at most ${MAX_HOUSEHOLD} tenants.`)
  }

  const seen = new Set()
  const owner = normalizeEmail(ownerEmail)
  const cleanTenants = tenants.map((t, i) => {
    const label = `Tenant ${i + 1}`
    const firstName = cleanName(t?.firstName)
    const lastName = cleanName(t?.lastName)
    const email = normalizeEmail(t?.email)
    const phone = String(t?.phone || '')
      .trim()
      .slice(0, 32)
    if (!firstName || !lastName)
      errors.push(`${label}: first and last name are required.`)
    if (!EMAIL_RE.test(email)) {
      errors.push(`${label}: a valid email address is required.`)
    } else {
      if (seen.has(email))
        errors.push(`${label}: ${email} is listed more than once.`)
      if (owner && email === owner) {
        errors.push(`${label}: you cannot invite yourself as a tenant.`)
      }
      seen.add(email)
    }
    return { firstName, lastName, email, phone: phone || null }
  })

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      lease: {
        startDate,
        endDate,
        monthToMonth,
        monthlyRent,
        securityDeposit,
        documentUrl,
      },
      tenants: cleanTenants,
    },
  }
}

/** Each tenant's equal share of the rent, whole dollars, remainder on the first. */
export function equalShares(monthlyRent, count) {
  if (!(count > 0)) return []
  const base = Math.floor(monthlyRent / count)
  const remainder = monthlyRent - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

/** True when a pending invite's link has lapsed. */
export function inviteExpired(invite, now = new Date()) {
  return invite?.status === 'pending' && new Date(invite.expiresAt) < now
}

/** Which invites can be resent: anything not accepted or cancelled. */
export function canResend(invite) {
  return ['pending', 'expired', 'declined'].includes(invite?.status)
}
