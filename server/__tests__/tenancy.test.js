import { describe, it, expect } from 'vitest'
import { pickCurrentApplication } from '../utils/tenancy.js'
import { amendmentPlan } from '../utils/agreements.js'

const NOW = new Date('2026-10-10T12:00:00Z')
const lease = (id, start, end, allSigned = true) => ({
  id,
  startDate: start,
  endDate: end,
  signers: [
    { role: 'tenant', signed: true },
    { role: 'landlord', signed: allSigned },
  ],
})
const app = (id, agreement, createdAt = '2026-01-01') => ({
  id,
  status: 'approved',
  createdAt,
  agreement,
})

describe('pickCurrentApplication', () => {
  it('prefers the signed lease in force over a signed renewal that starts later', () => {
    const current = app(
      'cur',
      lease('L1', '2026-06-01', '2027-05-31'),
      '2026-05-01'
    )
    const renewal = app(
      'ren',
      lease('L2', '2027-06-01', '2028-05-31'),
      '2026-10-01'
    )
    expect(pickCurrentApplication([renewal, current], NOW).id).toBe('cur')
  })

  it('falls back to the soonest upcoming signed lease, then the unsigned one', () => {
    const later = app(
      'b',
      lease('L3', '2027-01-01', '2027-12-31'),
      '2026-09-01'
    )
    const soon = app('a', lease('L2', '2026-11-01', '2027-10-31'), '2026-08-01')
    expect(pickCurrentApplication([later, soon], NOW).id).toBe('a')
    const pending = app(
      'p',
      lease('L4', '2026-11-01', '2027-10-31', false),
      '2026-10-05'
    )
    expect(pickCurrentApplication([pending], NOW).id).toBe('p')
  })

  it('ignores non-approved rows and handles empty input', () => {
    expect(pickCurrentApplication([], NOW)).toBeNull()
    expect(
      pickCurrentApplication(
        [{ id: 'x', status: 'pending', agreement: null }],
        NOW
      )
    ).toBeNull()
  })
})

describe('amendmentPlan', () => {
  const old = {
    id: 'old',
    monthlyRent: 2950,
    securityDeposit: 2950,
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2027-06-01T00:00:00Z',
    monthToMonth: false,
    terms: { petPolicy: 'No pets', utilities: 'Tenant pays' },
    lateFeeAmount: 50,
    lateFeeGraceDays: 5,
  }

  it('defaults everything to the current lease and takes the effective date', () => {
    const r = amendmentPlan(
      old,
      { effectiveDate: '2026-12-01', monthlyRent: 3050, note: 'Rent step' },
      NOW
    )
    expect(r.ok).toBe(true)
    expect(r.value.startDate.toISOString().slice(0, 10)).toBe('2026-12-01')
    expect(r.value.endDate.toISOString().slice(0, 10)).toBe('2027-06-01')
    expect(r.value.monthlyRent).toBe(3050)
    expect(r.value.securityDeposit).toBe(2950)
    expect(r.value.terms).toEqual({
      petPolicy: 'No pets',
      utilities: 'Tenant pays',
    })
    expect(r.value.lateFeeAmount).toBe(50)
    expect(r.value.note).toBe('Rent step')
  })

  it('rejects an effective date outside the current term', () => {
    expect(amendmentPlan(old, { effectiveDate: '2026-05-01' }, NOW).ok).toBe(
      false
    )
    expect(amendmentPlan(old, { effectiveDate: '2027-07-01' }, NOW).ok).toBe(
      false
    )
    expect(amendmentPlan(old, { effectiveDate: 'nope' }, NOW).ok).toBe(false)
  })

  it('lets the end date and terms change and merges written terms', () => {
    const r = amendmentPlan(
      old,
      {
        effectiveDate: '2026-12-01',
        endDate: '2027-08-31',
        terms: { parking: 'Garage' },
      },
      NOW
    )
    expect(r.ok).toBe(true)
    expect(r.value.endDate.toISOString().slice(0, 10)).toBe('2027-08-31')
    expect(r.value.terms.parking).toBe('Garage')
    expect(r.value.terms.petPolicy).toBe('No pets')
  })
})
