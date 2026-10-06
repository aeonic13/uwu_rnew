import { describe, it, expect } from 'vitest'
import {
  leaseState,
  pickCurrentLease,
  sortLeases,
  leaseStatusLabel,
} from './leasePicker'

const NOW = new Date('2026-10-10T12:00:00Z')
const lease = (id, status, start, end, extra = {}) => ({
  id,
  status,
  terms: { startDate: start, endDate: end },
  createdAt: '2026-01-01',
  ...extra,
})

describe('leaseState', () => {
  it('classifies signed leases by their dates and notice', () => {
    expect(
      leaseState(lease('a', 'signed', '2026-06-01', '2027-05-31'), NOW)
    ).toBe('active')
    expect(
      leaseState(
        lease('b', 'signed', '2026-06-01', '2026-11-30', {
          endedAt: '2026-10-01',
        }),
        NOW
      )
    ).toBe('ending')
    expect(
      leaseState(lease('c', 'signed', '2027-06-01', '2028-05-31'), NOW)
    ).toBe('upcoming')
    expect(
      leaseState(lease('d', 'signed', '2025-06-01', '2026-05-31'), NOW)
    ).toBe('past')
  })
  it('classifies unsigned leases by what they are', () => {
    expect(
      leaseState(
        lease('e', 'pending_signature', '2027-06-01', '2028-05-31', {
          renewsId: 'a',
        }),
        NOW
      )
    ).toBe('renewal')
    expect(
      leaseState(
        lease('f', 'pending_signature', '2026-12-01', '2027-05-31', {
          amendsId: 'a',
        }),
        NOW
      )
    ).toBe('amendment')
    expect(
      leaseState(
        lease('g', 'pending_signature', '2026-11-01', '2027-10-31'),
        NOW
      )
    ).toBe('pending')
  })
})

describe('pickCurrentLease / sortLeases', () => {
  const current = lease('cur', 'signed', '2026-06-01', '2027-05-31')
  const renewal = lease('ren', 'signed', '2027-06-01', '2028-05-31', {
    renewsId: 'cur',
  })
  const amendment = lease(
    'am',
    'pending_signature',
    '2026-12-01',
    '2027-05-31',
    { amendsId: 'cur', createdAt: '2026-10-05' }
  )
  const old = lease('old', 'signed', '2025-01-01', '2025-12-31')

  it('prefers the lease in force, then upcoming, then signable', () => {
    expect(pickCurrentLease([renewal, amendment, current, old], NOW).id).toBe(
      'cur'
    )
    expect(pickCurrentLease([renewal, amendment], NOW).id).toBe('ren')
    expect(pickCurrentLease([amendment], NOW).id).toBe('am')
    expect(pickCurrentLease([], NOW)).toBeNull()
  })

  it('orders current, upcoming, to-sign, past', () => {
    expect(
      sortLeases([old, amendment, renewal, current], NOW).map(l => l.id)
    ).toEqual(['cur', 'ren', 'am', 'old'])
  })

  it('labels states for the tenant', () => {
    expect(
      leaseStatusLabel(
        'ending',
        lease('x', 'signed', '2026-06-01', '2026-11-30')
      )
    ).toBe('Ends Nov 30')
    expect(leaseStatusLabel('amendment')).toBe('Amendment to sign')
  })
})
