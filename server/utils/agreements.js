/**
 * Household lease helpers: signature state across every signer and the
 * shape the frontend renders. Pure functions, unit tested.
 */

/** Signers that still owe a signature, tenants first, landlord last. */
export function pendingSigners(signers = []) {
  return [...signers]
    .filter(s => !s.signed)
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'landlord' ? 1 : -1))
}

/**
 * Derived signature state. `tenantsSigned` and `landlordSigned` are the
 * values mirrored onto Agreement.tenantSigned / landlordSigned.
 */
export function signatureState(signers = []) {
  const tenants = signers.filter(s => s.role === 'tenant')
  const landlords = signers.filter(s => s.role === 'landlord')
  const tenantsSigned = tenants.length > 0 && tenants.every(s => s.signed)
  const landlordSigned = landlords.length > 0 && landlords.every(s => s.signed)
  const signedCount = signers.filter(s => s.signed).length
  return {
    tenantsSigned,
    landlordSigned,
    allSigned: signers.length > 0 && signedCount === signers.length,
    signedCount,
    total: signers.length,
    pending: pendingSigners(signers),
  }
}

function fullName(user) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown'
}

/**
 * The invite behind an unattached tenant block on an imported lease, found
 * through the member application the block was created for.
 */
function inviteFor(agreement, signer) {
  if (signer.userId || !signer.applicationId) return null
  const member = (agreement.members || []).find(
    m => m.id === signer.applicationId
  )
  return member?.tenantInvite || null
}

function shapeSigner(s, viewerId, agreement) {
  const invite = inviteFor(agreement, s)
  return {
    id: s.id,
    userId: s.userId,
    role: s.role,
    name: s.user ? fullName(s.user) : invite ? fullName(invite) : 'Unknown',
    email: s.user?.email || invite?.email || null,
    phone: s.user?.phone || invite?.phone || '',
    signed: !!s.signed,
    signedAt: s.signedAt || null,
    signatureName: s.signatureName || null,
    isViewer: !!s.userId && s.userId === viewerId,
    // Where an unattached block stands: invited / declined / expired.
    inviteStatus: invite ? invite.status : null,
  }
}

/**
 * Map a Prisma agreement (with application.listing, application.owner and
 * signers[].user loaded) to what AgreementView / LeasesTab render.
 *
 * Backwards compatible: `tenant` is the viewer's own tenant block when the
 * viewer is a tenant, otherwise the first tenant; `tenants` lists them all.
 */
export function shapeAgreement(agreement, viewerId) {
  const app = agreement.application
  const t = agreement.terms || {}
  const signers = (agreement.signers || []).map(s =>
    shapeSigner(s, viewerId, agreement)
  )
  const tenants = signers.filter(s => s.role === 'tenant')
  const landlord =
    signers.find(s => s.role === 'landlord') ||
    (app?.owner
      ? {
          userId: app.owner.id,
          role: 'landlord',
          name: fullName(app.owner),
          email: app.owner.email,
          phone: app.owner.phone || '',
          signed: !!agreement.landlordSigned,
          signedAt: agreement.landlordSignedAt || null,
          isViewer: app.owner.id === viewerId,
        }
      : null)
  const mine = signers.find(s => s.userId === viewerId) || null
  const viewerRole = mine ? mine.role : 'other'
  const state = signatureState(agreement.signers || [])
  const imported = agreement.source === 'imported'

  return {
    id: agreement.id,
    status: state.allSigned ? 'signed' : 'pending_signature',
    groupId: agreement.groupId || null,
    isGroupLease: tenants.length > 1,
    // Imported leases were signed off Rentra; tenants confirm the recorded
    // terms through their invite instead of e-signing here.
    source: agreement.source || 'rentra',
    imported,
    monthToMonth: !!agreement.monthToMonth,
    documentUrl: agreement.documentUrl || null,
    // Lifecycle: notice given (endedAt + the move-out date in endDate), and
    // the renewal chain in both directions.
    endedAt: agreement.endedAt || null,
    endReason: agreement.endReason || null,
    renewsId: agreement.renewsId || null,
    renewalId: agreement.renewal?.id || null,
    amendsId: agreement.amendsId || null,
    amendmentId: agreement.amendment?.id || null,
    amendmentNote: agreement.amendmentNote || null,
    lateFee: agreement.lateFeeAmount
      ? {
          amount: agreement.lateFeeAmount,
          graceDays: agreement.lateFeeGraceDays ?? 0,
        }
      : null,
    tenantSigned: state.tenantsSigned,
    landlordSigned: state.landlordSigned,
    viewerRole,
    viewerHasSigned: !!mine?.signed,
    signedCount: state.signedCount,
    signerCount: state.total,
    pendingSigners: state.pending.map(s => ({
      userId: s.userId,
      role: s.role,
      name: fullName(s.user),
    })),
    property: {
      address: app?.listing?.location || '',
      description: app?.listing?.title || '',
    },
    tenant: (viewerRole === 'tenant' ? mine : tenants[0]) || {
      name: '',
      email: '',
      phone: '',
    },
    tenants,
    landlord: landlord || { name: '', email: '', phone: '' },
    signers,
    terms: {
      monthlyRent: agreement.monthlyRent,
      securityDeposit: agreement.securityDeposit,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      utilities: t.utilities || 'As agreed between the parties.',
      petPolicy: t.petPolicy || 'As agreed between the parties.',
      lateFee: t.lateFee || null,
      parking: t.parking || null,
      additionalClauses: Array.isArray(t.additionalClauses)
        ? t.additionalClauses
        : [],
    },
    createdAt: agreement.createdAt,
  }
}

/** Default lease terms when an application is approved. */
export function defaultLeaseTerms(listing, application) {
  return {
    monthlyRent: listing.price,
    securityDeposit: listing.price, // one month, within the CA AB 12 cap
    startDate: application.startDate,
    endDate: application.endDate,
    terms: {
      petPolicy: 'No pets allowed',
      utilities: 'Tenant responsible for utilities',
      lateFee: '5% after 5 days',
    },
  }
}

const EXT_BY_TYPE = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

/**
 * Download name for the landlord's uploaded copy of an imported lease,
 * extension from the file's content type (routes/agreements.js GET :id/pdf).
 */
export function signedLeaseFilename(agreement, contentType = '') {
  const type = String(contentType).split(';')[0].trim().toLowerCase()
  const fromUrl = (String(agreement?.documentUrl || '').match(
    /\.([a-z0-9]{2,5})(?:\?|#|$)/i
  ) || [])[1]
  const ext = EXT_BY_TYPE[type] || (fromUrl ? fromUrl.toLowerCase() : 'pdf')
  return `signed-lease-${agreement?.id || 'lease'}.${ext}`
}

// ─── Lease lifecycle helpers ────────────────────────────────────────────

export const END_REASONS = [
  'move_out',
  'nonrenewal',
  'early_termination',
  'other',
]

const MAX_RENT = 100000
const MAX_CLAUSES = 20

const parseDate = value => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * A month-to-month lease keeps a stand-in endDate (the next anniversary of
 * its start after `now`) so the rent roll and status math stay meaningful.
 */
export function standInEndDate(startDate, now = new Date()) {
  const start = new Date(startDate)
  const next = new Date(start)
  next.setUTCFullYear(start.getUTCFullYear() + 1)
  while (next <= now) next.setUTCFullYear(next.getUTCFullYear() + 1)
  return next
}

const cleanString = (value, max) =>
  value === undefined || value === null
    ? undefined
    : String(value).trim().slice(0, max)

/**
 * Validate the lease terms a landlord submits (editing an unsigned lease or
 * drafting a renewal). Returns { ok, errors, value } where `value` holds
 * only the fields that were supplied, coerced. With `requireAll` the core
 * money/date fields must all be present (renewals).
 */
export function validateLeaseTermsInput(
  body = {},
  { now = new Date(), requireAll = false } = {}
) {
  const errors = []
  const value = {}

  if (body.monthlyRent !== undefined || requireAll) {
    const rent = Math.round(Number(body.monthlyRent))
    if (!Number.isFinite(rent) || rent <= 0 || rent > MAX_RENT) {
      errors.push('Monthly rent must be a positive whole-dollar amount.')
    } else value.monthlyRent = rent
  }
  if (body.securityDeposit !== undefined) {
    const deposit = Math.round(Number(body.securityDeposit))
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > MAX_RENT * 3) {
      errors.push('Security deposit must be zero or a positive amount.')
    } else value.securityDeposit = deposit
  }
  if (body.monthToMonth !== undefined) {
    value.monthToMonth = Boolean(body.monthToMonth)
  }
  if (body.startDate !== undefined || requireAll) {
    const start = parseDate(body.startDate)
    if (!start) errors.push('A valid start date is required.')
    else value.startDate = start
  }
  if (value.monthToMonth) {
    if (value.startDate) value.endDate = standInEndDate(value.startDate, now)
  } else if (body.endDate !== undefined || requireAll) {
    const end = parseDate(body.endDate)
    if (!end) errors.push('A valid end date is required.')
    else value.endDate = end
  }
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    errors.push('The end date must be after the start date.')
  }

  if (body.terms !== undefined) {
    const t = body.terms && typeof body.terms === 'object' ? body.terms : {}
    const terms = {}
    for (const key of ['utilities', 'petPolicy', 'lateFee', 'parking']) {
      const s = cleanString(t[key], 500)
      if (s !== undefined) terms[key] = s
    }
    if (t.additionalClauses !== undefined) {
      if (!Array.isArray(t.additionalClauses)) {
        errors.push('Additional clauses must be a list.')
      } else {
        terms.additionalClauses = t.additionalClauses
          .map(c => String(c || '').trim())
          .filter(Boolean)
          .slice(0, MAX_CLAUSES)
          .map(c => c.slice(0, 1000))
      }
    }
    value.terms = terms
  }

  if (body.lateFeeAmount !== undefined) {
    if (body.lateFeeAmount === null || body.lateFeeAmount === '') {
      value.lateFeeAmount = null
      value.lateFeeGraceDays = null
    } else {
      const fee = Math.round(Number(body.lateFeeAmount))
      if (!Number.isFinite(fee) || fee < 0 || fee > 5000) {
        errors.push('Late fee must be between $0 and $5,000.')
      } else value.lateFeeAmount = fee || null
    }
  }
  if (body.lateFeeGraceDays !== undefined && value.lateFeeAmount !== null) {
    const days = Math.round(Number(body.lateFeeGraceDays))
    if (!Number.isFinite(days) || days < 0 || days > 30) {
      errors.push('Grace period must be between 0 and 30 days.')
    } else value.lateFeeGraceDays = days
  }

  return { ok: errors.length === 0, errors, value }
}

/**
 * Carry a household's rent split onto a renewal at the new rent: each share
 * keeps its proportion, rounded to whole dollars, with the last share
 * absorbing the rounding so the shares still sum to the new total.
 */
export function scaleShares(shares = [], oldTotal, newTotal) {
  if (!shares.length) return []
  const from = Number(oldTotal) || shares.reduce((s, x) => s + x.amount, 0)
  const to = Math.round(Number(newTotal) || 0)
  if (!from || !to) return shares.map(s => ({ ...s, amount: 0 }))
  const scaled = shares.map(s => ({
    ...s,
    amount: Math.round((s.amount / from) * to),
  }))
  const drift = to - scaled.reduce((s, x) => s + x.amount, 0)
  scaled[scaled.length - 1].amount += drift
  return scaled
}

/**
 * Plan a mid-term amendment of a signed lease: the replacement takes over
 * on `effectiveDate` (inside the current term) and keeps everything the
 * landlord did not change. Returns { ok, errors, value } like
 * validateLeaseTermsInput; `value` is the full set of fields for the new
 * Agreement plus `note`.
 */
export function amendmentPlan(current, body = {}, now = new Date()) {
  const effective = parseDate(body.effectiveDate)
  const errors = []
  if (!effective) errors.push('A valid effective date is required.')
  const checked = validateLeaseTermsInput(
    {
      ...body,
      startDate: body.effectiveDate,
      // Keep the current end unless the landlord changes it.
      endDate:
        body.endDate !== undefined
          ? body.endDate
          : body.monthToMonth
            ? undefined
            : current.endDate,
      monthToMonth:
        body.monthToMonth !== undefined
          ? body.monthToMonth
          : Boolean(current.monthToMonth),
    },
    { now }
  )
  errors.push(...checked.errors)
  const v = checked.value
  if (effective) {
    if (effective <= new Date(current.startDate)) {
      errors.push('The effective date must be after the current lease started.')
    }
    if (!current.monthToMonth && effective >= new Date(current.endDate)) {
      errors.push(
        'The effective date must fall inside the current term; renew the lease instead.'
      )
    }
  }
  if (errors.length) return { ok: false, errors, value: null }

  const terms = { ...(current.terms || {}), ...(v.terms || {}) }
  delete terms.importedLease
  delete terms.attestedBy
  delete terms.attestedAt

  return {
    ok: true,
    errors: [],
    value: {
      startDate: v.startDate,
      endDate: v.endDate,
      monthToMonth: Boolean(v.monthToMonth),
      monthlyRent: v.monthlyRent ?? current.monthlyRent,
      securityDeposit: v.securityDeposit ?? current.securityDeposit,
      terms,
      lateFeeAmount:
        v.lateFeeAmount !== undefined ? v.lateFeeAmount : current.lateFeeAmount,
      lateFeeGraceDays:
        v.lateFeeGraceDays !== undefined
          ? v.lateFeeGraceDays
          : current.lateFeeGraceDays,
      note: cleanString(body.note, 500) || null,
    },
  }
}
