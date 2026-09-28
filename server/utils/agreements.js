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

function shapeSigner(s, viewerId) {
  return {
    id: s.id,
    userId: s.userId,
    role: s.role,
    name: fullName(s.user),
    email: s.user?.email || null,
    phone: s.user?.phone || '',
    signed: !!s.signed,
    signedAt: s.signedAt || null,
    signatureName: s.signatureName || null,
    isViewer: s.userId === viewerId,
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
  const signers = (agreement.signers || []).map(s => shapeSigner(s, viewerId))
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

  return {
    id: agreement.id,
    status: state.allSigned ? 'signed' : 'pending_signature',
    groupId: agreement.groupId || null,
    isGroupLease: tenants.length > 1,
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
