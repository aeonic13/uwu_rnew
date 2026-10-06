import { describe, it, expect } from 'vitest'
import {
  expenseFromTicket,
  isTicketParty,
  sanitizeComment,
  sanitizeVendorFields,
  COMMENT_MAX_LENGTH,
} from '../utils/maintenance.js'

const ticket = {
  id: 't1',
  category: 'Plumbing',
  description: 'Kitchen sink drains slowly.',
  tenantId: 'tenant-1',
  listingId: 'listing-1',
  listing: { ownerId: 'owner-1' },
  assignedTo: 'Pacific Plumbing',
  cost: 180,
  completedAt: new Date('2026-09-20T15:00:00Z'),
}

describe('isTicketParty', () => {
  it('accepts the tenant and the listing owner', () => {
    expect(isTicketParty(ticket, 'tenant-1')).toBe(true)
    expect(isTicketParty(ticket, 'owner-1')).toBe(true)
  })
  it('rejects everyone else', () => {
    expect(isTicketParty(ticket, 'someone')).toBe(false)
    expect(isTicketParty(ticket, undefined)).toBe(false)
    expect(isTicketParty(null, 'tenant-1')).toBe(false)
  })
})

describe('sanitizeComment', () => {
  it('trims the body and defaults photos', () => {
    expect(sanitizeComment({ body: '  hello  ' })).toEqual({
      body: 'hello',
      photos: [],
    })
  })
  it('requires a body', () => {
    expect(sanitizeComment({ body: '   ' }).error).toMatch(/required/)
    expect(sanitizeComment({}).error).toMatch(/required/)
  })
  it('caps the body length', () => {
    const r = sanitizeComment({ body: 'x'.repeat(COMMENT_MAX_LENGTH + 1) })
    expect(r.error).toMatch(/2000/)
  })
  it('validates photos', () => {
    expect(sanitizeComment({ body: 'a', photos: 'nope' }).error).toBeTruthy()
    expect(sanitizeComment({ body: 'a', photos: [1] }).error).toBeTruthy()
    expect(
      sanitizeComment({ body: 'a', photos: Array(11).fill('https://x/y.jpg') })
        .error
    ).toMatch(/10/)
    expect(sanitizeComment({ body: 'a', photos: ['https://x/y.jpg'] })).toEqual(
      { body: 'a', photos: ['https://x/y.jpg'] }
    )
  })
})

describe('sanitizeVendorFields', () => {
  it('leaves absent keys out of the update', () => {
    expect(sanitizeVendorFields({})).toEqual({ data: {} })
    expect(sanitizeVendorFields({ cost: 50 })).toEqual({ data: { cost: 50 } })
  })
  it('clears with null or empty string', () => {
    expect(sanitizeVendorFields({ vendorPhone: '', cost: null })).toEqual({
      data: { vendorPhone: null, cost: null },
    })
  })
  it('trims and caps vendor phone', () => {
    expect(sanitizeVendorFields({ vendorPhone: ' 619-555-0100 ' })).toEqual({
      data: { vendorPhone: '619-555-0100' },
    })
    expect(sanitizeVendorFields({ vendorPhone: '1'.repeat(41) }).error).toMatch(
      /40/
    )
    expect(sanitizeVendorFields({ vendorPhone: 12 }).error).toBeTruthy()
  })
  it('accepts non-negative integer cost, numeric strings included', () => {
    expect(sanitizeVendorFields({ cost: '0' })).toEqual({ data: { cost: 0 } })
    expect(sanitizeVendorFields({ cost: '250' })).toEqual({
      data: { cost: 250 },
    })
    expect(sanitizeVendorFields({ cost: -1 }).error).toBeTruthy()
    expect(sanitizeVendorFields({ cost: 12.5 }).error).toBeTruthy()
    expect(sanitizeVendorFields({ cost: 'abc' }).error).toBeTruthy()
  })
})

describe('expenseFromTicket', () => {
  const now = new Date('2026-10-05T12:00:00Z')

  it('books a repairs expense dated on completion', () => {
    expect(expenseFromTicket(ticket, now)).toEqual({
      ownerId: 'owner-1',
      listingId: 'listing-1',
      date: new Date('2026-09-20T15:00:00Z'),
      amount: 180,
      category: 'repairs',
      description: 'Plumbing: Kitchen sink drains slowly.',
      vendor: 'Pacific Plumbing',
    })
  })

  it('falls back to now when the ticket has no completedAt', () => {
    const e = expenseFromTicket({ ...ticket, completedAt: null }, now)
    expect(e.date).toEqual(now)
  })

  it('uses a null vendor when nobody is assigned', () => {
    expect(expenseFromTicket({ ...ticket, assignedTo: '' }, now).vendor).toBe(
      null
    )
  })

  it('truncates the description to 200 characters', () => {
    const e = expenseFromTicket(
      { ...ticket, description: 'd'.repeat(300) },
      now
    )
    expect(e.description).toHaveLength(200)
    expect(e.description.startsWith('Plumbing: ')).toBe(true)
  })

  it('returns null without a positive cost', () => {
    expect(expenseFromTicket({ ...ticket, cost: 0 }, now)).toBe(null)
    expect(expenseFromTicket({ ...ticket, cost: null }, now)).toBe(null)
    expect(expenseFromTicket(null, now)).toBe(null)
  })
})
