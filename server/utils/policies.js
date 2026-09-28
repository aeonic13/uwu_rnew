/**
 * Versioned legal policies and the acceptance trail behind them.
 *
 * Every consent a tenant gives (terms at signup, screening disclosure
 * before Plaid, e-sign consent before a lease signature, autopay
 * authorization) is stored as a PolicyAcceptance row with the policy
 * version in force at that moment. Bump a version here whenever the
 * published text changes materially; users are then asked to re-accept
 * the signup policies on their next visit (see routes/legal.js and the
 * PolicyUpdateBanner on the client).
 *
 * The frontend mirrors these dates in src/features/legal/policyVersions.js
 * for display; this file is the source of truth for gating.
 */

export const POLICY_VERSIONS = Object.freeze({
  terms: '2026-09-28',
  privacy: '2026-09-28',
  esign: '2026-09-28',
  screening: '2026-09-28',
  autopay: '2026-09-28',
})

export const POLICY_TITLES = Object.freeze({
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  esign: 'Electronic Records & Signatures Consent',
  screening: 'Tenant Screening Disclosure & Authorization',
  autopay: 'Autopay Authorization',
})

// Policies every account must accept to use Rentra at all.
export const SIGNUP_POLICIES = Object.freeze(['terms', 'privacy'])

export function isKnownPolicy(policy) {
  return Object.prototype.hasOwnProperty.call(POLICY_VERSIONS, policy)
}

/** Most recent acceptance per policy, keyed by policy name. */
export function latestByPolicy(acceptances = []) {
  const latest = {}
  for (const a of acceptances) {
    const prev = latest[a.policy]
    if (!prev || new Date(a.acceptedAt) > new Date(prev.acceptedAt)) {
      latest[a.policy] = a
    }
  }
  return latest
}

/** True when the user's latest acceptance of `policy` is the current version. */
export function hasCurrent(acceptances, policy) {
  const latest = latestByPolicy(acceptances)[policy]
  return !!latest && latest.version === POLICY_VERSIONS[policy]
}

/**
 * Policies (from `policies`) the user still needs to accept, either because
 * they never did or because the text changed since.
 */
export function pendingPolicies(acceptances, policies = SIGNUP_POLICIES) {
  return policies.filter(p => !hasCurrent(acceptances, p))
}

// Best-effort client address for the audit trail. Railway sits behind a
// proxy, so prefer the forwarded header when present.
export function clientAddress(req) {
  const forwarded = req?.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim().slice(0, 64)
  }
  return (req?.ip || '').slice(0, 64)
}

/**
 * Record acceptance of the current version of each policy for a user.
 * `context` is free-form (e.g. { agreementId, signatureName }) and lands on
 * every row created by this call.
 */
export async function recordAcceptances(
  db,
  { userId, policies, req, context = null }
) {
  const unique = [...new Set(policies)].filter(isKnownPolicy)
  if (unique.length === 0) return []
  const ipAddress = clientAddress(req) || null
  const userAgent = (req?.headers?.['user-agent'] || '').slice(0, 256) || null
  const rows = unique.map(policy => ({
    userId,
    policy,
    version: POLICY_VERSIONS[policy],
    ipAddress,
    userAgent,
    context,
  }))
  await db.policyAcceptance.createMany({ data: rows })
  return rows
}
