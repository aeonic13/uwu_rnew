import { describe, it, expect } from 'vitest'
import {
  validateOnboarding,
  validateShares,
  nextAnniversary,
  parseDateOnly,
  equalShares,
  inviteExpired,
  inviteNeedsReminder,
  canResend,
  INVITE_TTL_DAYS,
  REMINDER_BEFORE_DAYS,
} from '../utils/onboarding.js'

const NOW = new Date('2026-10-02T18:00:00Z')

const good = (over = {}) => ({
  attest: true,
  lease: {
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    monthlyRent: 2400,
    securityDeposit: 2400,
    ...over.lease,
  },
  tenants: over.tenants || [
    { firstName: 'Emma', lastName: 'Wilson', email: 'Emma@Example.com ' },
    { firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com' },
  ],
})

describe('parseDateOnly / nextAnniversary', () => {
  it('parses YYYY-MM-DD at UTC midnight and rejects junk', () => {
    expect(parseDateOnly('2026-08-01').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z'
    )
    expect(parseDateOnly('2026-08-01T15:00:00-07:00').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z'
    )
    expect(parseDateOnly('not a date')).toBeNull()
    expect(parseDateOnly('')).toBeNull()
  })

  it('rolls a past start forward to its next anniversary', () => {
    expect(nextAnniversary('2024-08-01', NOW).toISOString()).toBe(
      '2027-08-01T00:00:00.000Z'
    )
    // Anniversary later this year stays this year.
    expect(nextAnniversary('2025-12-15', NOW).toISOString()).toBe(
      '2026-12-15T00:00:00.000Z'
    )
    // Today itself counts as passed: next year.
    expect(nextAnniversary('2025-10-02', NOW).toISOString()).toBe(
      '2027-10-02T00:00:00.000Z'
    )
  })

  it('ends a future-dated month-to-month lease on its first anniversary', () => {
    expect(nextAnniversary('2026-11-01', NOW).toISOString()).toBe(
      '2027-11-01T00:00:00.000Z'
    )
  })
})

describe('validateShares', () => {
  it('splits equally when no tenant carries a share', () => {
    const errors = []
    expect(validateShares([undefined, ''], 2401, errors)).toEqual({
      mode: 'equal',
      amounts: [1201, 1200],
    })
    expect(errors).toEqual([])
  })

  it('accepts custom whole-dollar shares that add up to the rent', () => {
    const errors = []
    expect(validateShares(['1500', 900], 2400, errors)).toEqual({
      mode: 'custom',
      amounts: [1500, 900],
    })
    expect(errors).toEqual([])
  })

  it('collapses identical shares back to an equal split', () => {
    expect(validateShares([1200, 1200], 2400).mode).toBe('equal')
  })

  it('rejects a missing share or a total that misses the rent', () => {
    const errors = []
    validateShares([1500, ''], 2400, errors)
    expect(errors).toEqual([
      'Tenant 2: enter their share of the rent (0 or more).',
    ])
    const more = []
    validateShares([1500, 1000], 2400, more)
    expect(more).toEqual(['Shares add up to $2,500, not the $2,400 rent.'])
  })

  it('ignores a share on a household of one', () => {
    expect(validateShares([700], 2400)).toEqual({
      mode: 'equal',
      amounts: [2400],
    })
  })
})

describe('inviteNeedsReminder', () => {
  const day = 24 * 60 * 60 * 1000
  const pending = daysLeft => ({
    status: 'pending',
    reminderSentAt: null,
    expiresAt: new Date(NOW.getTime() + daysLeft * day),
  })

  it('fires once the final week starts and not before', () => {
    expect(inviteNeedsReminder(pending(REMINDER_BEFORE_DAYS + 1), NOW)).toBe(
      false
    )
    expect(inviteNeedsReminder(pending(REMINDER_BEFORE_DAYS), NOW)).toBe(true)
    expect(inviteNeedsReminder(pending(2), NOW)).toBe(true)
  })

  it('skips reminded, lapsed and settled invites', () => {
    expect(
      inviteNeedsReminder({ ...pending(3), reminderSentAt: NOW }, NOW)
    ).toBe(false)
    expect(inviteNeedsReminder(pending(-1), NOW)).toBe(false)
    expect(
      inviteNeedsReminder({ ...pending(3), status: 'accepted' }, NOW)
    ).toBe(false)
  })
})

describe('validateOnboarding', () => {
  it('carries custom shares through as a custom split', () => {
    const result = validateOnboarding(
      good({
        tenants: [
          {
            firstName: 'Emma',
            lastName: 'Wilson',
            email: 'emma@example.com',
            share: 1500,
          },
          {
            firstName: 'Alex',
            lastName: 'Johnson',
            email: 'alex@example.com',
            share: '900',
          },
        ],
      }),
      { ownerEmail: 'jen@example.com', now: NOW }
    )
    expect(result.ok).toBe(true)
    expect(result.value.split).toEqual({ mode: 'custom', amounts: [1500, 900] })
  })

  it('lists a share mismatch alongside other problems', () => {
    const result = validateOnboarding(
      good({
        tenants: [
          {
            firstName: 'Emma',
            lastName: 'Wilson',
            email: 'emma@example.com',
            share: 1500,
          },
          { firstName: '', lastName: 'Johnson', email: 'alex@example.com' },
        ],
      }),
      { ownerEmail: 'jen@example.com', now: NOW }
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toContain(
      'Tenant 2: first and last name are required.'
    )
    expect(result.errors).toContain(
      'Tenant 2: enter their share of the rent (0 or more).'
    )
  })

  it('normalises a valid request', () => {
    const result = validateOnboarding(good(), {
      ownerEmail: 'jen@example.com',
      now: NOW,
    })
    expect(result.ok).toBe(true)
    expect(result.value.lease).toMatchObject({
      monthlyRent: 2400,
      securityDeposit: 2400,
      monthToMonth: false,
      documentUrl: null,
    })
    expect(result.value.lease.startDate.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z'
    )
    expect(result.value.tenants).toEqual([
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma@example.com',
        phone: null,
      },
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@example.com',
        phone: null,
      },
    ])
  })

  it('derives the end date for a month-to-month lease', () => {
    const result = validateOnboarding(
      good({ lease: { monthToMonth: true, endDate: undefined } }),
      { now: NOW }
    )
    expect(result.ok).toBe(true)
    expect(result.value.lease.monthToMonth).toBe(true)
    expect(result.value.lease.endDate.toISOString()).toBe(
      '2027-08-01T00:00:00.000Z'
    )
  })

  it('lists every problem at once', () => {
    const result = validateOnboarding(
      {
        attest: false,
        lease: {
          startDate: '2026-08-01',
          endDate: '2026-07-01',
          monthlyRent: 0,
          securityDeposit: -5,
        },
        tenants: [
          { firstName: '', lastName: 'X', email: 'bad' },
          { firstName: 'A', lastName: 'B', email: 'jen@example.com' },
          { firstName: 'C', lastName: 'D', email: 'a@b.co' },
          { firstName: 'E', lastName: 'F', email: 'a@b.co' },
        ],
      },
      { ownerEmail: 'jen@example.com', now: NOW }
    )
    expect(result.ok).toBe(false)
    const text = result.errors.join('\n')
    expect(text).toMatch(/Confirm that these terms/)
    expect(text).toMatch(/end date must be after/)
    expect(text).toMatch(/Monthly rent must be/)
    expect(text).toMatch(/deposit held/)
    expect(text).toMatch(/Tenant 1: first and last name/)
    expect(text).toMatch(/Tenant 1: a valid email/)
    expect(text).toMatch(/cannot invite yourself/)
    expect(text).toMatch(/a@b.co is listed more than once/)
  })

  it('rejects a lease that has already ended and an empty household', () => {
    const ended = validateOnboarding(
      good({ lease: { startDate: '2024-08-01', endDate: '2025-07-31' } }),
      { now: NOW }
    )
    expect(ended.ok).toBe(false)
    expect(ended.errors.join()).toMatch(/already ended/)

    const empty = validateOnboarding(good({ tenants: [] }), { now: NOW })
    expect(empty.ok).toBe(false)
    expect(empty.errors).toContain('Add at least one tenant.')
  })

  it('keeps only http(s) document links', () => {
    const ok = validateOnboarding(
      good({
        lease: { documentUrl: 'https://res.cloudinary.com/x/lease.pdf' },
      }),
      { now: NOW }
    )
    expect(ok.value.lease.documentUrl).toBe(
      'https://res.cloudinary.com/x/lease.pdf'
    )
    const bad = validateOnboarding(
      good({ lease: { documentUrl: 'javascript:alert(1)' } }),
      { now: NOW }
    )
    expect(bad.value.lease.documentUrl).toBeNull()
  })
})

describe('equalShares', () => {
  it('splits whole dollars with the remainder on the first tenants', () => {
    expect(equalShares(2400, 3)).toEqual([800, 800, 800])
    expect(equalShares(2500, 3)).toEqual([834, 833, 833])
    expect(equalShares(1000, 1)).toEqual([1000])
    expect(equalShares(1000, 0)).toEqual([])
  })
})

describe('invite state helpers', () => {
  it('knows when a pending invite has lapsed', () => {
    const fresh = {
      status: 'pending',
      expiresAt: new Date(NOW.getTime() + 1000),
    }
    const stale = {
      status: 'pending',
      expiresAt: new Date(NOW.getTime() - 1000),
    }
    expect(inviteExpired(fresh, NOW)).toBe(false)
    expect(inviteExpired(stale, NOW)).toBe(true)
    expect(inviteExpired({ ...stale, status: 'accepted' }, NOW)).toBe(false)
  })

  it('allows resends for pending, expired and declined only', () => {
    expect(canResend({ status: 'pending' })).toBe(true)
    expect(canResend({ status: 'expired' })).toBe(true)
    expect(canResend({ status: 'declined' })).toBe(true)
    expect(canResend({ status: 'accepted' })).toBe(false)
    expect(canResend({ status: 'cancelled' })).toBe(false)
  })

  it('gives invites a two-week window', () => {
    expect(INVITE_TTL_DAYS).toBe(14)
  })
})
