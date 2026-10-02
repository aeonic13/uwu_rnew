import { describe, it, expect } from 'vitest'
import {
  leaseFullySigned,
  leasesOf,
  leaseIsCurrent,
  propertyStatus,
  collectedThisMonth,
  summarizeProperty,
  portfolioTotals,
} from '../utils/portfolio.js'

const NOW = new Date('2026-10-01T12:00:00Z')

const signed = (over = {}) => ({
  id: 'ag-signed',
  monthlyRent: 2400,
  startDate: '2026-08-01',
  endDate: '2027-07-31',
  signers: [
    { userId: 't1', signed: true },
    { userId: 'landlord', signed: true },
  ],
  ...over,
})

const unsigned = (over = {}) => ({
  id: 'ag-unsigned',
  monthlyRent: 1800,
  startDate: '2026-11-01',
  endDate: '2027-10-31',
  signers: [
    { userId: 't2', signed: true },
    { userId: 'landlord', signed: false },
  ],
  ...over,
})

describe('leaseFullySigned / leaseIsCurrent', () => {
  it('requires every signer row to be signed', () => {
    expect(leaseFullySigned(signed())).toBe(true)
    expect(leaseFullySigned(unsigned())).toBe(false)
    expect(leaseFullySigned(null)).toBe(false)
  })

  it('falls back to the mirror flags when there are no signer rows', () => {
    expect(
      leaseFullySigned({
        signers: [],
        tenantSigned: true,
        landlordSigned: true,
      })
    ).toBe(true)
    expect(
      leaseFullySigned({
        signers: [],
        tenantSigned: true,
        landlordSigned: false,
      })
    ).toBe(false)
  })

  it('treats an ended lease as not current', () => {
    expect(leaseIsCurrent(signed(), NOW)).toBe(true)
    expect(leaseIsCurrent(signed({ endDate: '2026-06-30' }), NOW)).toBe(false)
    expect(leaseIsCurrent(unsigned(), NOW)).toBe(false)
  })
})

describe('leasesOf', () => {
  it('dedupes group members sharing one agreement, newest first', () => {
    const a = signed({ id: 'a', startDate: '2026-01-01' })
    const b = signed({ id: 'b', startDate: '2026-09-01' })
    const leases = leasesOf([
      { agreement: a },
      { agreement: a },
      { agreement: b },
      { agreement: null },
    ])
    expect(leases.map(l => l.id)).toEqual(['b', 'a'])
  })
})

describe('propertyStatus', () => {
  it('is leased when a signed lease is in force', () => {
    expect(propertyStatus({ active: true, leases: [signed()] }, NOW)).toBe(
      'leased'
    )
  })

  it('is pending_signatures when a future/current lease lacks signatures', () => {
    expect(propertyStatus({ active: true, leases: [unsigned()] }, NOW)).toBe(
      'pending_signatures'
    )
  })

  it('ignores expired leases and falls back to the listing flag', () => {
    const old = signed({ endDate: '2026-01-31' })
    expect(propertyStatus({ active: true, leases: [old] }, NOW)).toBe('listed')
    expect(propertyStatus({ active: false, leases: [old] }, NOW)).toBe(
      'inactive'
    )
    expect(propertyStatus({ active: true, leases: [] }, NOW)).toBe('listed')
  })
})

describe('collectedThisMonth', () => {
  it('sums completed transactions dated this month only', () => {
    const txs = [
      { amount: 1000, status: 'completed', createdAt: '2026-10-05T01:00:00Z' },
      { amount: 500, status: 'pending', createdAt: '2026-10-05T01:00:00Z' },
      { amount: 700, status: 'completed', createdAt: '2026-09-15T01:00:00Z' },
    ]
    expect(collectedThisMonth(txs, NOW)).toBe(1000)
    expect(collectedThisMonth([], NOW)).toBe(0)
  })
})

describe('summarizeProperty', () => {
  const listing = {
    id: 'l1',
    title: 'Beach house',
    location: 'Pacific Beach, San Diego, CA 92109',
    streetAddress: '1245 Grand Ave, San Diego, CA 92109',
    price: 2600,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'House',
    images: ['img.jpg'],
    active: true,
    maintenanceTickets: [
      { status: 'pending' },
      { status: 'in-progress' },
      { status: 'completed' },
    ],
    applications: [
      {
        applicantId: 't1',
        status: 'approved',
        agreementId: 'ag-signed',
        agreement: signed(),
        transactions: [
          {
            amount: 1200,
            status: 'completed',
            createdAt: '2026-10-05T02:00:00Z',
          },
        ],
      },
      {
        applicantId: 't3',
        status: 'approved',
        agreementId: 'ag-signed',
        agreement: signed(),
        transactions: [],
      },
      { applicantId: 't4', status: 'pending', transactions: [] },
      { applicantId: 't5', status: 'rejected', transactions: [] },
    ],
  }

  it('counts tenants on the current lease, pending apps and open tickets', () => {
    const s = summarizeProperty(listing, NOW)
    expect(s).toMatchObject({
      id: 'l1',
      status: 'leased',
      tenants: 2,
      pendingApplications: 1,
      openTickets: 2,
      monthlyRent: 2400,
      collectedThisMonth: 1200,
      image: 'img.jpg',
      streetAddress: '1245 Grand Ave, San Diego, CA 92109',
    })
    expect(s.leaseEnd).toBe('2027-07-31')
  })

  it('uses the asking price when nothing is leased', () => {
    const s = summarizeProperty(
      { ...listing, applications: [], maintenanceTickets: [] },
      NOW
    )
    expect(s.status).toBe('listed')
    expect(s.monthlyRent).toBe(2600)
    expect(s.tenants).toBe(0)
    expect(s.leaseEnd).toBeNull()
  })
})

describe('portfolioTotals', () => {
  it('rolls summaries up and only counts leased rent as monthly income', () => {
    const totals = portfolioTotals([
      {
        status: 'leased',
        tenants: 2,
        pendingApplications: 1,
        openTickets: 2,
        monthlyRent: 2400,
        collectedThisMonth: 1200,
      },
      {
        status: 'listed',
        tenants: 0,
        pendingApplications: 3,
        openTickets: 0,
        monthlyRent: 1900,
        collectedThisMonth: 0,
      },
      {
        status: 'inactive',
        tenants: 0,
        pendingApplications: 0,
        openTickets: 0,
        monthlyRent: 1500,
        collectedThisMonth: 0,
      },
    ])
    expect(totals).toEqual({
      properties: 3,
      leased: 1,
      pendingSignatures: 0,
      listed: 1,
      inactive: 1,
      tenants: 2,
      pendingApplications: 4,
      openTickets: 2,
      monthlyRent: 2400,
      collectedThisMonth: 1200,
    })
  })
})
