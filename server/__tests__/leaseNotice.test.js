import { describe, it, expect } from 'vitest'
import {
  amendmentPlan,
  rentIncreaseNotice,
  tenantNoticePlan,
} from '../utils/agreements.js'

const NOW = new Date('2026-10-06T18:00:00Z')

describe('rentIncreaseNotice', () => {
  it('is not a notice event when rent stays or falls', () => {
    expect(
      rentIncreaseNotice({ currentRent: 2000, newRent: 2000, now: NOW })
        .increase
    ).toBe(false)
    expect(
      rentIncreaseNotice({ currentRent: 2000, newRent: 1900, now: NOW }).ok
    ).toBe(true)
  })

  it('needs 30 days in California for 10% or less', () => {
    const r = rentIncreaseNotice({
      currentRent: 2000,
      newRent: 2200,
      state: 'CA',
      effectiveDate: '2026-11-05',
      now: NOW,
    })
    expect(r.percent).toBe(10)
    expect(r.requiredDays).toBe(30)
    expect(r.earliestDate.toISOString().slice(0, 10)).toBe('2026-11-05')
    expect(r.ok).toBe(true)
  })

  it('needs 90 days in California above 10%', () => {
    const r = rentIncreaseNotice({
      currentRent: 2000,
      newRent: 2201,
      state: 'CA',
      effectiveDate: '2026-12-01',
      now: NOW,
    })
    expect(r.requiredDays).toBe(90)
    expect(r.ok).toBe(false)
    expect(
      rentIncreaseNotice({
        currentRent: 2000,
        newRent: 2201,
        state: 'CA',
        effectiveDate: '2027-01-04',
        now: NOW,
      }).ok
    ).toBe(true)
  })

  it('uses the 30-day floor outside California', () => {
    const r = rentIncreaseNotice({
      currentRent: 1000,
      newRent: 1500,
      state: 'TX',
      effectiveDate: '2026-11-06',
      now: NOW,
    })
    expect(r.requiredDays).toBe(30)
    expect(r.ok).toBe(true)
  })
})

describe('amendmentPlan with removals and rent increases', () => {
  const old = {
    id: 'old',
    monthlyRent: 3000,
    securityDeposit: 3000,
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2027-06-01T00:00:00Z',
    monthToMonth: false,
    terms: {},
  }
  const members = ['u1', 'u2', 'u3']

  it('records who leaves and keeps at least one tenant', () => {
    const r = amendmentPlan(
      old,
      { effectiveDate: '2026-12-01', removeTenantIds: ['u3', 'u3'] },
      NOW,
      { memberIds: members, state: 'CA' }
    )
    expect(r.ok).toBe(true)
    expect(r.value.removeTenantIds).toEqual(['u3'])
    expect(r.value.rentIncreaseNoticeDays).toBeNull()

    const all = amendmentPlan(
      old,
      { effectiveDate: '2026-12-01', removeTenantIds: members },
      NOW,
      { memberIds: members }
    )
    expect(all.ok).toBe(false)
    expect(all.errors[0]).toMatch(/at least one tenant/i)

    const swap = amendmentPlan(
      old,
      {
        effectiveDate: '2026-12-01',
        removeTenantIds: members,
        addTenantEmails: ['new@x.com'],
      },
      NOW,
      { memberIds: members }
    )
    expect(swap.ok).toBe(true)
  })

  it('refuses to remove someone who is not on the lease', () => {
    const r = amendmentPlan(
      old,
      { effectiveDate: '2026-12-01', removeTenantIds: ['stranger'] },
      NOW,
      { memberIds: members }
    )
    expect(r.ok).toBe(false)
    expect(r.errors[0]).toMatch(/only tenants on this lease/i)
  })

  it('enforces the rent-increase notice period on the effective date', () => {
    const tooSoon = amendmentPlan(
      old,
      { effectiveDate: '2026-11-01', monthlyRent: 3600 },
      NOW,
      { memberIds: members, state: 'CA' }
    )
    expect(tooSoon.ok).toBe(false)
    expect(tooSoon.errors[0]).toMatch(/90 days/)

    const ok = amendmentPlan(
      old,
      { effectiveDate: '2027-02-01', monthlyRent: 3600 },
      NOW,
      { memberIds: members, state: 'CA' }
    )
    expect(ok.ok).toBe(true)
    expect(ok.value.rentIncreaseNoticeDays).toBe(90)

    const small = amendmentPlan(
      old,
      { effectiveDate: '2026-11-10', monthlyRent: 3100 },
      NOW,
      { memberIds: members, state: 'CA' }
    )
    expect(small.ok).toBe(true)
    expect(small.value.rentIncreaseNoticeDays).toBe(30)
  })
})

describe('tenantNoticePlan', () => {
  const fixed = {
    monthToMonth: false,
    endDate: '2027-06-01T00:00:00Z',
  }
  const mtm = { monthToMonth: true, endDate: '2027-06-01T00:00:00Z' }

  it('accepts any future date inside a fixed term and flags early exits', () => {
    const r = tenantNoticePlan(
      fixed,
      { moveOutDate: '2026-12-31', reason: 'moving', message: ' Got a job ' },
      NOW
    )
    expect(r.ok).toBe(true)
    expect(r.value.early).toBe(true)
    expect(r.value.reason).toBe('moving')
    expect(r.value.message).toBe('Got a job')

    const end = tenantNoticePlan(fixed, { moveOutDate: '2027-06-01' }, NOW)
    expect(end.ok).toBe(true)
    expect(end.value.early).toBe(false)
    expect(end.value.reason).toBe('other')
  })

  it('rejects past dates and dates after the term', () => {
    expect(tenantNoticePlan(fixed, { moveOutDate: '2026-10-01' }, NOW).ok).toBe(
      false
    )
    expect(tenantNoticePlan(fixed, { moveOutDate: '2027-07-01' }, NOW).ok).toBe(
      false
    )
    expect(tenantNoticePlan(fixed, {}, NOW).ok).toBe(false)
  })

  it('needs 30 days on a month-to-month tenancy', () => {
    const soon = tenantNoticePlan(mtm, { moveOutDate: '2026-10-20' }, NOW)
    expect(soon.ok).toBe(false)
    expect(soon.errors[0]).toMatch(/30 days/)
    expect(tenantNoticePlan(mtm, { moveOutDate: '2026-11-05' }, NOW).ok).toBe(
      true
    )
  })
})
