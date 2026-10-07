import { describe, it, expect } from 'vitest'
import {
  assessIncome,
  assessCombinedIncome,
  DEFAULT_INCOME_MULTIPLIER,
  sanitizeScreeningCriteria,
  householdIncomeDecision,
} from '../utils/screening.js'

describe('assessIncome', () => {
  it('passes when income meets the multiple', () => {
    const r = assessIncome(6000, 2000, 3)
    expect(r.requiredIncome).toBe(6000)
    expect(r.meetsRequirement).toBe(true)
    expect(r.ratio).toBe(3)
  })

  it('fails when income is below the multiple', () => {
    const r = assessIncome(5000, 2000, 3)
    expect(r.requiredIncome).toBe(6000)
    expect(r.meetsRequirement).toBe(false)
  })

  it('passes exactly at the threshold', () => {
    expect(assessIncome(6000, 2000, 3).meetsRequirement).toBe(true)
  })

  it('treats missing/zero income as not passing', () => {
    const r = assessIncome(0, 2000, 3)
    expect(r.hasIncomeData).toBe(false)
    expect(r.meetsRequirement).toBe(false)
  })

  it('handles undefined income without throwing', () => {
    const r = assessIncome(undefined, 2000)
    expect(r.monthlyIncome).toBe(0)
    expect(r.meetsRequirement).toBe(false)
  })

  it('returns null ratio when rent is zero', () => {
    expect(assessIncome(5000, 0).ratio).toBeNull()
  })

  it('uses the default multiplier when none is given', () => {
    const r = assessIncome(3000, 1000)
    expect(r.multiplier).toBe(DEFAULT_INCOME_MULTIPLIER)
  })
})

describe('assessCombinedIncome', () => {
  it('sums roommate incomes before assessing', () => {
    const r = assessCombinedIncome([3000, 3500, 2500], 2800, 3)
    expect(r.monthlyIncome).toBe(9000)
    expect(r.requiredIncome).toBe(8400)
    expect(r.meetsRequirement).toBe(true)
  })

  it('handles an empty list', () => {
    const r = assessCombinedIncome([], 1000, 3)
    expect(r.monthlyIncome).toBe(0)
    expect(r.meetsRequirement).toBe(false)
  })
})

describe('sanitizeScreeningCriteria', () => {
  it('keeps only known keys with valid values', () => {
    expect(
      sanitizeScreeningCriteria({
        guarantorPolicy: 'always',
        backgroundCheck: true,
        idVerification: false,
        minCreditScore: '680',
        minIncomeMultiple: 2.5,
        acceptsVouchers: false,
        evil: 'drop me',
      })
    ).toEqual({
      guarantorPolicy: 'always',
      backgroundCheck: true,
      idVerification: false,
      minCreditScore: 680,
      minIncomeMultiple: 2.5,
    })
  })

  it('drops out-of-range or malformed values', () => {
    expect(
      sanitizeScreeningCriteria({
        guarantorPolicy: 'whenever',
        backgroundCheck: 'yes',
        minCreditScore: 950,
        minIncomeMultiple: 0,
      })
    ).toBeNull()
    expect(sanitizeScreeningCriteria({ minCreditScore: '' })).toBeNull()
  })

  it('returns null for non-objects', () => {
    expect(sanitizeScreeningCriteria(null)).toBeNull()
    expect(sanitizeScreeningCriteria('680')).toBeNull()
    expect(sanitizeScreeningCriteria([680])).toBeNull()
  })
})

describe('householdIncomeDecision', () => {
  it('passes when the members together clear the multiple', () => {
    const d = householdIncomeDecision(
      [{ monthlyIncome: 3000 }, { monthlyIncome: 3000 }],
      2000,
      3
    )
    expect(d.short).toBe(false)
    expect(d.required).toBe(6000)
    expect(d.effective).toBe(6000)
  })

  it('is short when combined income misses the multiple', () => {
    const d = householdIncomeDecision(
      [{ monthlyIncome: 2500 }, { monthlyIncome: 2000 }],
      2000,
      3
    )
    expect(d.short).toBe(true)
    expect(d.effective).toBe(4500)
  })

  it('counts an accepted cosigner and a voucher', () => {
    const d = householdIncomeDecision(
      [{ monthlyIncome: 1000, cosignerIncome: 2000, voucherAmount: 1000 }],
      2000,
      3
    )
    // Tenant share is $1,000 after the voucher, so $3,000 is required.
    expect(d.required).toBe(3000)
    expect(d.effective).toBe(3000)
    expect(d.short).toBe(false)
  })

  it('treats unverified income as short', () => {
    const d = householdIncomeDecision([{}], 1500, 3)
    expect(d.short).toBe(true)
    expect(d.effective).toBe(0)
  })

  it('is never short when there is no rent to qualify for', () => {
    expect(householdIncomeDecision([{}], 0, 3).short).toBe(false)
  })
})
