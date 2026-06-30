import { describe, it, expect } from 'vitest'
import {
  assessIncome,
  assessCombinedIncome,
  DEFAULT_INCOME_MULTIPLIER,
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
