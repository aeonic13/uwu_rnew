/**
 * Display versions for the legal pages. Mirrors server/utils/policies.js,
 * which is the source of truth for acceptance gating; keep both in step
 * when the published text changes.
 */
export const POLICY_VERSIONS = Object.freeze({
  terms: '2026-09-28',
  privacy: '2026-09-28',
  esign: '2026-09-28',
  screening: '2026-09-28',
  autopay: '2026-09-28',
  fees: '2026-09-28',
  rights: '2026-09-28',
  community: '2026-09-28',
})

export function formatVersion(version) {
  const [y, m, d] = String(version).split('-').map(Number)
  if (!y || !m || !d) return version
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
