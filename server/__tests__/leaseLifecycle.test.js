import { describe, it, expect } from 'vitest'
import {
  validateLeaseTermsInput,
  scaleShares,
  standInEndDate,
  shapeAgreement,
} from '../utils/agreements.js'
import {
  leaseIsEnding,
  leaseIsUpcoming,
  summarizeProperty,
} from '../utils/portfolio.js'

const NOW = new Date('2026-10-10T12:00:00Z')

describe('standInEndDate', () => {
  it('is the next anniversary of the start after now', () => {
    expect(
      standInEndDate('2025-09-01T00:00:00Z', NOW).toISOString().slice(0, 10)
    ).toBe('2027-09-01')
    expect(
      standInEndDate('2026-11-01T00:00:00Z', NOW).toISOString().slice(0, 10)
    ).toBe('2027-11-01')
  })
})

describe('validateLeaseTermsInput', () => {
  it('coerces a full renewal draft', () => {
    const r = validateLeaseTermsInput(
      {
        monthlyRent: '3100',
        securityDeposit: 3100,
        startDate: '2027-06-01',
        endDate: '2028-05-31',
        terms: {
          utilities: ' Tenant pays power ',
          additionalClauses: ['No smoking', '', 'Quiet hours 10pm'],
        },
        lateFeeAmount: 75,
        lateFeeGraceDays: 5,
      },
      { now: NOW, requireAll: true }
    )
    expect(r.ok).toBe(true)
    expect(r.value.monthlyRent).toBe(3100)
    expect(r.value.terms.utilities).toBe('Tenant pays power')
    expect(r.value.terms.additionalClauses).toEqual([
      'No smoking',
      'Quiet hours 10pm',
    ])
    expect(r.value.lateFeeAmount).toBe(75)
    expect(r.value.lateFeeGraceDays).toBe(5)
  })

  it('computes the stand-in end date for month-to-month', () => {
    const r = validateLeaseTermsInput(
      { monthlyRent: 2000, startDate: '2026-11-01', monthToMonth: true },
      { now: NOW, requireAll: true }
    )
    expect(r.ok).toBe(true)
    expect(r.value.endDate.toISOString().slice(0, 10)).toBe('2027-11-01')
  })

  it('rejects bad money and dates', () => {
    const r = validateLeaseTermsInput(
      { monthlyRent: -5, startDate: '2027-01-01', endDate: '2026-12-01' },
      { now: NOW, requireAll: true }
    )
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/Monthly rent/)
    expect(r.errors.join(' ')).toMatch(/end date must be after/)
  })

  it('clears the late fee with null', () => {
    const r = validateLeaseTermsInput({ lateFeeAmount: null })
    expect(r.ok).toBe(true)
    expect(r.value.lateFeeAmount).toBeNull()
    expect(r.value.lateFeeGraceDays).toBeNull()
  })
})

describe('scaleShares', () => {
  it('keeps proportions and sums to the new total', () => {
    const scaled = scaleShares(
      [
        { name: 'A', amount: 1000 },
        { name: 'B', amount: 1000 },
        { name: 'C', amount: 1000 },
      ],
      3000,
      3100
    )
    expect(scaled.reduce((s, x) => s + x.amount, 0)).toBe(3100)
    expect(scaled[0].amount).toBe(1033)
    expect(scaled[2].amount).toBe(1034)
  })
})

describe('ending and upcoming leases', () => {
  const signed = over => ({
    id: 'ag',
    monthlyRent: 2400,
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    signers: [
      { userId: 't1', signed: true },
      { userId: 'landlord', signed: true },
    ],
    ...over,
  })

  it('flags a lease with notice given until its move-out date', () => {
    expect(
      leaseIsEnding(
        signed({ endedAt: '2026-10-01', endDate: '2026-11-30' }),
        NOW
      )
    ).toBe(true)
    expect(
      leaseIsEnding(
        signed({ endedAt: '2026-09-01', endDate: '2026-09-30' }),
        NOW
      )
    ).toBe(false)
    expect(leaseIsEnding(signed(), NOW)).toBe(false)
  })

  it('treats a signed future-start lease as upcoming', () => {
    expect(
      leaseIsUpcoming(
        signed({ startDate: '2027-08-01', endDate: '2028-07-31' }),
        NOW
      )
    ).toBe(true)
    expect(leaseIsUpcoming(signed(), NOW)).toBe(false)
  })

  it('bases rent on the lease in force, not the signed renewal', () => {
    const current = signed({
      id: 'cur',
      endedAt: '2026-10-01',
      endDate: '2026-12-31',
    })
    const renewal = signed({
      id: 'ren',
      monthlyRent: 2600,
      startDate: '2027-01-01',
      endDate: '2027-12-31',
    })
    const listing = {
      id: 'l',
      title: 'Unit',
      price: 2500,
      active: true,
      applications: [
        {
          status: 'approved',
          applicantId: 't1',
          agreementId: 'cur',
          agreement: current,
          transactions: [],
        },
        {
          status: 'approved',
          applicantId: 't1',
          agreementId: 'ren',
          agreement: renewal,
          transactions: [],
        },
      ],
      maintenanceTickets: [],
    }
    const s = summarizeProperty(listing, NOW)
    expect(s.status).toBe('leased')
    expect(s.monthlyRent).toBe(2400)
    expect(s.tenants).toBe(1)
    expect(s.endingOn).toBe('2026-12-31')
    expect(s.nextLeaseStart).toBe('2027-01-01')
  })
})

describe('shapeAgreement lifecycle fields', () => {
  it('exposes notice, renewal links, late fee rule and extra terms', () => {
    const shaped = shapeAgreement(
      {
        id: 'a1',
        monthlyRent: 2000,
        securityDeposit: 2000,
        startDate: '2026-01-01',
        endDate: '2026-11-30',
        endedAt: '2026-10-01',
        endReason: 'move_out',
        renewsId: 'a0',
        renewal: { id: 'a2' },
        lateFeeAmount: 50,
        lateFeeGraceDays: 5,
        terms: {
          lateFee: '$50 after 5 days',
          additionalClauses: ['No smoking'],
        },
        signers: [],
        application: { listing: { title: 'Unit' }, owner: null },
      },
      'viewer'
    )
    expect(shaped.endedAt).toBe('2026-10-01')
    expect(shaped.endReason).toBe('move_out')
    expect(shaped.renewsId).toBe('a0')
    expect(shaped.renewalId).toBe('a2')
    expect(shaped.lateFee).toEqual({ amount: 50, graceDays: 5 })
    expect(shaped.terms.additionalClauses).toEqual(['No smoking'])
    expect(shaped.terms.lateFee).toBe('$50 after 5 days')
  })
})
