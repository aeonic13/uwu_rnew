import { describe, it, expect } from 'vitest'
import {
  monthKeys,
  leaseInForce,
  leaseCoversMonth,
  vacancyDays,
  buildReport,
  csvField,
  reportToCsv,
} from '../utils/reports.js'

const signed = (overrides = {}) => ({
  id: 'lease-1',
  source: 'rentra',
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2027-06-01T00:00:00.000Z',
  signers: [
    { role: 'tenant', signed: true },
    { role: 'tenant', signed: true },
    { role: 'landlord', signed: true },
  ],
  ...overrides,
})

const unsigned = () =>
  signed({
    id: 'lease-2',
    signers: [
      { role: 'tenant', signed: true },
      { role: 'landlord', signed: false },
    ],
  })

describe('monthKeys', () => {
  it('returns twelve zero-padded keys', () => {
    const keys = monthKeys(2026)
    expect(keys).toHaveLength(12)
    expect(keys[0]).toBe('2026-01')
    expect(keys[8]).toBe('2026-09')
    expect(keys[11]).toBe('2026-12')
  })
})

describe('leaseInForce', () => {
  it('requires every signer on a Rentra lease', () => {
    expect(leaseInForce(signed())).toBe(true)
    expect(leaseInForce(unsigned())).toBe(false)
    expect(leaseInForce(null)).toBe(false)
  })

  it('counts an imported lease once the landlord has attested', () => {
    const imported = signed({
      source: 'imported',
      signers: [
        { role: 'tenant', signed: true },
        { role: 'tenant', signed: false },
        { role: 'landlord', signed: true },
      ],
    })
    expect(leaseInForce(imported)).toBe(true)
    expect(
      leaseInForce({
        ...imported,
        signers: [{ role: 'landlord', signed: false }],
      })
    ).toBe(false)
  })
})

describe('leaseCoversMonth', () => {
  it('is true for months inside the term and false outside', () => {
    expect(leaseCoversMonth(signed(), 2026, 5)).toBe(true) // June
    expect(leaseCoversMonth(signed(), 2026, 11)).toBe(true) // December
    expect(leaseCoversMonth(signed(), 2026, 4)).toBe(false) // May
    expect(leaseCoversMonth(signed(), 2027, 6)).toBe(false) // July 2027
  })

  it('is false for a lease that is not fully signed', () => {
    expect(leaseCoversMonth(unsigned(), 2026, 7)).toBe(false)
  })

  it('does not slide a UTC-midnight start date into the previous month', () => {
    expect(leaseCoversMonth(signed(), 2026, 4)).toBe(false)
  })
})

describe('vacancyDays', () => {
  const from = '2026-01-01T00:00:00.000Z'
  const to = '2026-12-31T00:00:00.000Z'

  it('is the whole window when there is no lease', () => {
    expect(vacancyDays({ leases: [], from, to })).toBe(365)
  })

  it('subtracts the covered days of a signed lease', () => {
    // Jan 1 .. May 31 vacant = 151 days
    expect(vacancyDays({ leases: [signed()], from, to })).toBe(151)
  })

  it('ignores an unsigned lease', () => {
    expect(vacancyDays({ leases: [unsigned()], from, to })).toBe(365)
  })

  it('merges overlapping and back-to-back leases', () => {
    const first = signed({
      id: 'a',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-31T00:00:00.000Z',
    })
    const second = signed({
      id: 'b',
      startDate: '2026-03-15T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    })
    const third = signed({
      id: 'c',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    })
    expect(vacancyDays({ leases: [first, second, third], from, to })).toBe(0)
    expect(vacancyDays({ leases: [first, second], from, to })).toBe(184)
  })

  it('caps the window at today', () => {
    expect(
      vacancyDays({
        leases: [],
        from,
        to,
        now: '2026-01-10T15:00:00.000Z',
      })
    ).toBe(10)
  })

  it('returns zero for an inverted window', () => {
    expect(vacancyDays({ leases: [], from: to, to: from })).toBe(0)
  })
})

describe('buildReport', () => {
  const now = new Date('2026-10-05T17:00:00.000Z')
  const tx = (createdAt, amount, status = 'completed') => ({
    amount,
    status,
    createdAt,
  })

  const listings = [
    {
      id: 'l7',
      title: 'Beachside 2BR',
      applications: [
        {
          id: 'a1',
          agreement: signed(),
          transactions: [
            tx('2026-06-01T16:00:00.000Z', 1475),
            tx('2026-07-01T16:00:00.000Z', 1475),
            tx('2026-07-03T16:00:00.000Z', 1475, 'processing'),
            tx('2025-12-01T16:00:00.000Z', 1475), // previous year, ignored
          ],
        },
        // Group member pointing at the same lease: counted once.
        { id: 'a2', agreement: signed(), transactions: [] },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-06-10T00:00:00.000Z',
          amount: 240,
          category: 'cleaning_maintenance',
        },
        {
          id: 'e2',
          date: '2026-09-15T00:00:00.000Z',
          amount: 1620,
          category: 'mortgage_interest',
        },
      ],
    },
    {
      id: 'l9',
      title: 'Mission Beach 1BR',
      applications: [
        {
          id: 'a3',
          agreement: signed({
            id: 'lease-mb',
            source: 'imported',
            startDate: '2025-09-01T00:00:00.000Z',
            endDate: '2027-09-01T00:00:00.000Z',
            signers: [
              { role: 'tenant', signed: true },
              { role: 'tenant', signed: false },
              { role: 'landlord', signed: true },
            ],
          }),
          transactions: [tx('2026-09-01T16:00:00.000Z', 1100)],
        },
      ],
      expenses: [],
    },
    { id: 'l8', title: 'Vacant Studio', applications: [], expenses: [] },
  ]
  const expenses = [
    {
      id: 'p1',
      date: '2026-01-12T08:00:00.000Z',
      amount: 1890,
      category: 'insurance',
    },
    {
      id: 'p2',
      date: '2026-04-10T07:00:00.000Z',
      amount: 6400,
      category: 'taxes',
    },
    // Duplicate of a listing expense: ignored by id.
    {
      id: 'e1',
      date: '2026-06-10T00:00:00.000Z',
      amount: 240,
      category: 'cleaning_maintenance',
    },
  ]

  it('sums completed income and all expenses into months and totals', () => {
    const r = buildReport({ year: 2026, listings, expenses, now })
    expect(r.year).toBe(2026)
    expect(r.months).toHaveLength(12)
    expect(r.months[5]).toMatchObject({
      month: '2026-06',
      income: 1475,
      expenses: 240,
      net: 1235,
    })
    expect(r.months[6].income).toBe(1475) // processing row excluded
    expect(r.months[8].income).toBe(1100)
    expect(r.totals.income).toBe(4050)
    expect(r.totals.expenses).toBe(240 + 1620 + 1890 + 6400)
    expect(r.totals.net).toBe(4050 - 10150)
  })

  it('reports occupancy per month and the year-to-date average', () => {
    const r = buildReport({ year: 2026, listings, expenses, now })
    expect(r.months[0]).toMatchObject({ occupiedUnits: 1, totalUnits: 3 })
    expect(r.months[0].occupancyRate).toBe(33.3)
    expect(r.months[5]).toMatchObject({ occupiedUnits: 2, totalUnits: 3 })
    expect(r.months[5].occupancyRate).toBe(66.7)
    // Jan–May at 33.3, Jun–Oct at 66.7 → 50.0 over ten elapsed months.
    expect(r.totals.averageOccupancy).toBe(50)
  })

  it('groups expenses by category, largest first', () => {
    const r = buildReport({ year: 2026, listings, expenses, now })
    expect(r.byCategory).toEqual([
      { category: 'taxes', amount: 6400 },
      { category: 'insurance', amount: 1890 },
      { category: 'mortgage_interest', amount: 1620 },
      { category: 'cleaning_maintenance', amount: 240 },
    ])
  })

  it('breaks the year down by property without portfolio-level expenses', () => {
    const r = buildReport({ year: 2026, listings, expenses, now })
    expect(r.byProperty).toHaveLength(3)
    expect(r.byProperty[0]).toEqual({
      listingId: 'l7',
      title: 'Beachside 2BR',
      income: 2950,
      expenses: 1860,
      net: 1090,
      occupiedMonths: 5, // Jun–Oct
      vacancyDays: 151, // Jan 1 – May 31
    })
    expect(r.byProperty[1]).toMatchObject({
      listingId: 'l9',
      income: 1100,
      expenses: 0,
      occupiedMonths: 10,
      vacancyDays: 0,
    })
    // Vacant all year, capped at today (Jan 1 – Oct 5 = 278 days).
    expect(r.byProperty[2]).toMatchObject({
      income: 0,
      occupiedMonths: 0,
      vacancyDays: 278,
    })
    expect(r.totals.vacancyDays).toBe(151 + 278)
  })

  it('uses all twelve months for a past year', () => {
    const r = buildReport({ year: 2025, listings, expenses, now })
    // Only the Mission Beach lease ran in 2025 (from September).
    expect(r.byProperty[1].occupiedMonths).toBe(4)
    expect(r.byProperty[1].vacancyDays).toBe(243) // Jan 1 – Aug 31
    // Only the December 2025 payment lands in this year.
    expect(r.totals.income).toBe(1475)
    expect(r.months[11].income).toBe(1475)
    expect(r.totals.averageOccupancy).toBe(11.1)
  })

  it('returns an empty but well-formed report with no listings', () => {
    const r = buildReport({ year: 2026, listings: [], expenses: [], now })
    expect(r.totals).toEqual({
      income: 0,
      expenses: 0,
      net: 0,
      averageOccupancy: 0,
      vacancyDays: 0,
    })
    expect(r.months.every(m => m.occupancyRate === 0)).toBe(true)
    expect(r.byCategory).toEqual([])
    expect(r.byProperty).toEqual([])
  })
})

describe('csv', () => {
  it('quotes fields that contain commas or quotes', () => {
    expect(csvField('plain')).toBe('plain')
    expect(csvField('Beachside 2BR, Pacific Beach')).toBe(
      '"Beachside 2BR, Pacific Beach"'
    )
    expect(csvField('say "hi"')).toBe('"say ""hi"""')
    expect(csvField(null)).toBe('')
  })

  it('writes monthly rows, a blank line, then property rows', () => {
    const now = new Date('2026-10-05T17:00:00.000Z')
    const report = buildReport({
      year: 2026,
      listings: [
        {
          id: 'l1',
          title: 'Unit, A',
          applications: [],
          expenses: [],
        },
      ],
      expenses: [],
      now,
    })
    const lines = reportToCsv(report).split('\r\n')
    expect(lines[0]).toBe(
      'Month,Income,Expenses,Net,Occupied units,Total units,Occupancy %'
    )
    expect(lines[1]).toBe('2026-01,0,0,0,0,1,0')
    expect(lines[13]).toBe('')
    expect(lines[14]).toBe(
      'Property,Income,Expenses,Net,Occupied months,Vacant days'
    )
    expect(lines[15]).toBe('"Unit, A",0,0,0,0,278')
  })
})
