import { describe, it, expect } from 'vitest'
import {
  computeShares,
  consolidateBalances,
  summarizeByPeriod,
  periodFor,
} from '../utils/billSplit.js'

const sum = shares => shares.reduce((a, s) => a + s.amount, 0)

describe('computeShares', () => {
  it('splits equally and pushes the rounding remainder onto the first shares', () => {
    const shares = computeShares(100, 'equal', [
      { name: 'A', userId: 'u1' },
      { name: 'B', userId: 'u2' },
      { name: 'C' },
    ])
    expect(shares.map(s => s.amount)).toEqual([33.34, 33.33, 33.33])
    expect(sum(shares)).toBeCloseTo(100, 2)
    expect(shares[2].userId).toBeNull()
  })

  it('handles cents that do not divide evenly', () => {
    const shares = computeShares(0.05, 'equal', [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
    ])
    expect(shares.map(s => s.amount)).toEqual([0.02, 0.02, 0.01])
  })

  it('splits by custom percentages', () => {
    const shares = computeShares(200, 'custom', [
      { name: 'A', percent: 50 },
      { name: 'B', percent: 30 },
      { name: 'C', percent: 20 },
    ])
    expect(shares.map(s => s.amount)).toEqual([100, 60, 40])
  })

  it('splits by custom amounts', () => {
    const shares = computeShares(150, 'custom', [
      { name: 'A', amount: 100 },
      { name: 'B', amount: 50 },
    ])
    expect(shares.map(s => s.amount)).toEqual([100, 50])
  })

  it('rejects percentages that do not total 100', () => {
    expect(() =>
      computeShares(100, 'custom', [
        { name: 'A', percent: 60 },
        { name: 'B', percent: 30 },
      ])
    ).toThrow(/100%/)
  })

  it('rejects amounts that do not total the bill', () => {
    expect(() =>
      computeShares(100, 'custom', [
        { name: 'A', amount: 60 },
        { name: 'B', amount: 30 },
      ])
    ).toThrow(/add up to the total/)
  })

  it('rejects an empty participant list or a non-positive total', () => {
    expect(() => computeShares(100, 'equal', [])).toThrow()
    expect(() => computeShares(0, 'equal', [{ name: 'A' }])).toThrow()
  })
})

describe('periodFor', () => {
  it('uses the due date month when present', () => {
    expect(periodFor('2026-10-15T00:00:00Z', '2026-09-01T00:00:00Z')).toBe(
      '2026-10'
    )
  })

  it('falls back to the created date', () => {
    expect(periodFor(null, '2026-09-28T12:00:00Z')).toBe('2026-09')
  })
})

describe('consolidateBalances', () => {
  const me = 'me'
  const bills = [
    // I paid electricity: Alex and Sam owe me, Sam already paid.
    {
      createdById: me,
      shares: [
        { userId: me, name: 'Me', amount: 30, paid: true },
        { userId: 'alex', name: 'Alex', amount: 30, paid: false },
        { userId: 'sam', name: 'Sam', amount: 30, paid: true },
      ],
    },
    // I paid water: Alex owes me again, plus a roommate not on Rentra.
    {
      createdById: me,
      shares: [
        { userId: 'alex', name: 'Alex', amount: 10.5, paid: false },
        { userId: null, name: 'Jordan', amount: 10.5, paid: false },
      ],
    },
    // Alex paid internet: I owe Alex.
    {
      createdById: 'alex',
      createdBy: { firstName: 'Alex', lastName: 'Kim' },
      shares: [
        { userId: 'alex', name: 'Alex', amount: 20, paid: true },
        { userId: me, name: 'Me', amount: 20, paid: false },
      ],
    },
    // Sam paid gas and I already settled it.
    {
      createdById: 'sam',
      createdBy: { firstName: 'Sam', lastName: 'Lee' },
      shares: [{ userId: me, name: 'Me', amount: 15, paid: true }],
    },
  ]

  it('nets what each roommate owes me across bills', () => {
    const { owedToMe, totalOwedToMe } = consolidateBalances(bills, me)
    expect(owedToMe).toEqual([
      { key: 'alex', userId: 'alex', name: 'Alex', amount: 40.5, bills: 2 },
      {
        key: 'name:jordan',
        userId: null,
        name: 'Jordan',
        amount: 10.5,
        bills: 1,
      },
    ])
    expect(totalOwedToMe).toBe(51)
  })

  it('lists what I owe on other people’s bills, skipping paid shares', () => {
    const { iOwe, totalIOwe } = consolidateBalances(bills, me)
    expect(iOwe).toEqual([
      { key: 'alex', userId: 'alex', name: 'Alex Kim', amount: 20, bills: 1 },
    ])
    expect(totalIOwe).toBe(20)
  })

  it('returns empty balances for no bills', () => {
    expect(consolidateBalances([], me)).toEqual({
      owedToMe: [],
      iOwe: [],
      totalOwedToMe: 0,
      totalIOwe: 0,
    })
  })
})

describe('summarizeByPeriod', () => {
  it('groups totals by month with a per-utility breakdown, newest first', () => {
    const rows = summarizeByPeriod([
      { period: '2026-08', utilityType: 'water', total: 40 },
      { period: '2026-09', utilityType: 'electricity', total: 90 },
      { period: '2026-09', utilityType: 'water', total: 45.5 },
      {
        period: null,
        dueDate: '2026-09-20T00:00:00Z',
        utilityType: 'internet',
        total: 60,
      },
    ])
    expect(rows).toEqual([
      {
        period: '2026-09',
        total: 195.5,
        count: 3,
        byType: { electricity: 90, water: 45.5, internet: 60 },
      },
      { period: '2026-08', total: 40, count: 1, byType: { water: 40 } },
    ])
  })
})
