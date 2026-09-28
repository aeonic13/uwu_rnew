import { describe, it, expect, vi } from 'vitest'
import {
  POLICY_VERSIONS,
  SIGNUP_POLICIES,
  isKnownPolicy,
  latestByPolicy,
  hasCurrent,
  pendingPolicies,
  clientAddress,
  recordAcceptances,
} from '../utils/policies.js'

const current = POLICY_VERSIONS.terms

describe('policy versions', () => {
  it('every policy has a date-shaped version', () => {
    for (const v of Object.values(POLICY_VERSIONS)) {
      expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('knows its own policies and nothing else', () => {
    expect(isKnownPolicy('terms')).toBe(true)
    expect(isKnownPolicy('esign')).toBe(true)
    expect(isKnownPolicy('cookies')).toBe(false)
    expect(isKnownPolicy('__proto__')).toBe(false)
  })
})

describe('latestByPolicy / hasCurrent / pendingPolicies', () => {
  const rows = [
    { policy: 'terms', version: '2020-01-01', acceptedAt: '2020-01-02' },
    { policy: 'terms', version: current, acceptedAt: '2026-09-29' },
    { policy: 'privacy', version: '2020-01-01', acceptedAt: '2020-01-02' },
  ]

  it('keeps the most recent row per policy', () => {
    const latest = latestByPolicy(rows)
    expect(latest.terms.version).toBe(current)
    expect(latest.privacy.version).toBe('2020-01-01')
  })

  it('treats an old version as not current', () => {
    expect(hasCurrent(rows, 'terms')).toBe(true)
    expect(hasCurrent(rows, 'privacy')).toBe(false)
    expect(hasCurrent(rows, 'esign')).toBe(false)
  })

  it('lists signup policies that need (re-)acceptance', () => {
    expect(pendingPolicies(rows)).toEqual(['privacy'])
    expect(pendingPolicies([])).toEqual([...SIGNUP_POLICIES])
    expect(pendingPolicies(rows, ['esign', 'terms'])).toEqual(['esign'])
  })
})

describe('clientAddress', () => {
  it('prefers the first forwarded address', () => {
    expect(
      clientAddress({
        headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
        ip: '10.0.0.1',
      })
    ).toBe('203.0.113.9')
  })

  it('falls back to req.ip', () => {
    expect(clientAddress({ headers: {}, ip: '::1' })).toBe('::1')
  })
})

describe('recordAcceptances', () => {
  it('writes one current-version row per distinct known policy', async () => {
    const db = {
      policyAcceptance: { createMany: vi.fn().mockResolvedValue({}) },
    }
    const req = {
      headers: { 'user-agent': 'vitest', 'x-forwarded-for': '198.51.100.4' },
    }
    const rows = await recordAcceptances(db, {
      userId: 'u1',
      policies: ['terms', 'terms', 'privacy', 'bogus'],
      req,
      context: { source: 'signup' },
    })
    expect(rows).toEqual([
      {
        userId: 'u1',
        policy: 'terms',
        version: POLICY_VERSIONS.terms,
        ipAddress: '198.51.100.4',
        userAgent: 'vitest',
        context: { source: 'signup' },
      },
      {
        userId: 'u1',
        policy: 'privacy',
        version: POLICY_VERSIONS.privacy,
        ipAddress: '198.51.100.4',
        userAgent: 'vitest',
        context: { source: 'signup' },
      },
    ])
    expect(db.policyAcceptance.createMany).toHaveBeenCalledWith({ data: rows })
  })

  it('does nothing for an empty or unknown list', async () => {
    const db = { policyAcceptance: { createMany: vi.fn() } }
    expect(
      await recordAcceptances(db, { userId: 'u1', policies: ['x'] })
    ).toEqual([])
    expect(db.policyAcceptance.createMany).not.toHaveBeenCalled()
  })
})
