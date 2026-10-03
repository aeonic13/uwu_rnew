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
