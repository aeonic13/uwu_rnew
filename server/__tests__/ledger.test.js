import { describe, it, expect } from 'vitest'
import {
  monthWindow,
  chargeShareFor,
  tenantLedger,
  lateFeeAssessment,
} from '../utils/ledger.js'

const NOW = new Date('2026-10-10T12:00:00')

describe('monthWindow', () => {
  it('spans the first of the month to the first of the next', () => {
    const { from, to } = monthWindow(NOW)
    expect(from.getMonth()).toBe(9)
    expect(from.getDate()).toBe(1)
    expect(to.getMonth()).toBe(10)
    expect(to.getDate()).toBe(1)
  })
})

describe('chargeShareFor', () => {
  it('gives a pinned charge to that tenant only', () => {
    const charge = { amount: 90, userId: 'a' }
    expect(chargeShareFor(charge, 'a', 3)).toBe(90)
    expect(chargeShareFor(charge, 'b', 3)).toBe(0)
  })
  it('splits a household charge equally', () => {
    expect(chargeShareFor({ amount: 90, userId: null }, 'a', 3)).toBe(30)
  })
})

describe('tenantLedger', () => {
  const charges = [
    {
      id: 'c1',
      type: 'utility',
      amount: 60,
      userId: null,
      dueDate: '2026-10-05',
      description: 'Water',
    },
    {
      id: 'c2',
      type: 'late_fee',
      amount: 50,
      userId: 'a',
      dueDate: '2026-10-06',
      description: 'Late fee',
    },
    {
      id: 'c3',
      type: 'credit',
      amount: 20,
      userId: 'a',
      dueDate: '2026-10-07',
      description: 'Goodwill',
    },
    {
      id: 'old',
      type: 'repair',
      amount: 500,
      userId: 'a',
      dueDate: '2026-09-07',
      description: 'Last month',
    },
  ]
  const payments = [
    { amount: 1000, status: 'completed', createdAt: '2026-10-02' },
    { amount: 100, status: 'processing', createdAt: '2026-10-09' },
    { amount: 1000, status: 'completed', createdAt: '2026-09-02' },
  ]

  it('adds this month’s charges to the rent share and nets credits', () => {
    const l = tenantLedger({
      rentShare: 1200,
      charges,
      payments,
      tenantId: 'a',
      memberCount: 2,
      now: NOW,
    })
    expect(l.rentDue).toBe(1200)
    expect(l.otherCharges).toBe(30 + 50)
    expect(l.credits).toBe(20)
    expect(l.due).toBe(1260)
    expect(l.paid).toBe(1000)
    expect(l.pending).toBe(100)
    expect(l.balance).toBe(260)
    expect(l.lines.map(x => x.id)).toEqual(['c1', 'c2', 'c3'])
  })

  it('ignores another tenant’s pinned charges', () => {
    const l = tenantLedger({
      rentShare: 1200,
      charges,
      payments: [],
      tenantId: 'b',
      memberCount: 2,
      now: NOW,
    })
    expect(l.otherCharges).toBe(30)
    expect(l.credits).toBe(0)
    expect(l.balance).toBe(1230)
  })
})

describe('lateFeeAssessment', () => {
  it('is not applicable without a rule', () => {
    expect(
      lateFeeAssessment({
        lateFeeAmount: null,
        rentDue: 1000,
        paidThisMonth: 0,
        now: NOW,
      }).applicable
    ).toBe(false)
  })
  it('waits for the grace period', () => {
    const r = lateFeeAssessment({
      lateFeeAmount: 50,
      lateFeeGraceDays: 15,
      rentDue: 1000,
      paidThisMonth: 0,
      now: NOW,
    })
    expect(r.applicable).toBe(false)
    expect(r.reason).toMatch(/not late until Oct 16/)
  })
  it('applies once rent is unpaid past the grace day', () => {
    const r = lateFeeAssessment({
      lateFeeAmount: 50,
      lateFeeGraceDays: 5,
      rentDue: 1000,
      paidThisMonth: 400,
      now: NOW,
    })
    expect(r).toEqual({ applicable: true, amount: 50, reason: null })
  })
  it('does not double-charge a month or charge a paid month', () => {
    expect(
      lateFeeAssessment({
        lateFeeAmount: 50,
        lateFeeGraceDays: 5,
        rentDue: 1000,
        paidThisMonth: 1000,
        now: NOW,
      }).applicable
    ).toBe(false)
    expect(
      lateFeeAssessment({
        lateFeeAmount: 50,
        rentDue: 1000,
        paidThisMonth: 0,
        alreadyAppliedThisMonth: true,
        now: NOW,
      }).reason
    ).toMatch(/already applied/)
  })
})
