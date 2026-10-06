import { describe, it, expect } from 'vitest'
import {
  defaultChecklist,
  summarizeItems,
  deductionsFromInspection,
  sanitizeItems,
} from '../utils/inspections.js'

describe('defaultChecklist', () => {
  it('builds one bedroom and bathroom section per count', () => {
    const items = defaultChecklist({ bedrooms: 2, bathrooms: 1.5 })
    const rooms = [...new Set(items.map(i => i.room))]
    expect(rooms).toEqual([
      'Entry & living room',
      'Kitchen',
      'Bathroom 1',
      'Bathroom 2',
      'Bedroom 1',
      'Bedroom 2',
      'Laundry & utility',
      'Exterior & other',
    ])
  })

  it('gives a studio a single sleeping area', () => {
    const items = defaultChecklist({
      bedrooms: 0,
      bathrooms: 1,
      propertyType: 'Studio',
    })
    const rooms = [...new Set(items.map(i => i.room))]
    expect(rooms).toContain('Sleeping area')
    expect(rooms).toContain('Bathroom')
    expect(rooms.some(r => r.startsWith('Bedroom'))).toBe(false)
  })

  it('adds room-specific items and stable ids', () => {
    const items = defaultChecklist({ bedrooms: 1, bathrooms: 1 })
    const kitchen = items.filter(i => i.room === 'Kitchen').map(i => i.item)
    expect(kitchen).toEqual(
      expect.arrayContaining(['Appliances', 'Sink & disposal', 'Cabinets'])
    )
    const bath = items.filter(i => i.room === 'Bathroom').map(i => i.item)
    expect(bath).toEqual(
      expect.arrayContaining(['Toilet', 'Shower / tub', 'Exhaust fan'])
    )
    const exterior = items
      .filter(i => i.room === 'Exterior & other')
      .map(i => i.item)
    expect(exterior).toEqual(
      expect.arrayContaining(['Smoke / CO detectors', 'Keys & locks'])
    )
    expect(items.find(i => i.id === 'kitchen-sink-and-disposal')).toBeTruthy()
    const ids = items.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('starts every item good, empty, unpriced', () => {
    for (const it of defaultChecklist({ bedrooms: 1, bathrooms: 1 })) {
      expect(it.condition).toBe('good')
      expect(it.notes).toBe('')
      expect(it.photos).toEqual([])
      expect(it.estimatedCost).toBe(0)
    }
  })
})

describe('summarizeItems', () => {
  it('counts items, damaged ones and their cost', () => {
    const r = summarizeItems([
      { condition: 'good', estimatedCost: 0 },
      { condition: 'damaged', estimatedCost: 150 },
      { condition: 'damaged', estimatedCost: 0 },
      { condition: 'fair', estimatedCost: 999 },
    ])
    expect(r).toEqual({ itemCount: 4, damagedCount: 2, estimatedTotal: 150 })
  })

  it('tolerates bad input', () => {
    expect(summarizeItems(null)).toEqual({
      itemCount: 0,
      damagedCount: 0,
      estimatedTotal: 0,
    })
    expect(summarizeItems([null, 'x'])).toEqual({
      itemCount: 2,
      damagedCount: 0,
      estimatedTotal: 0,
    })
  })
})

describe('deductionsFromInspection', () => {
  const inspection = {
    items: [
      {
        room: 'Kitchen',
        item: 'Cabinets',
        condition: 'damaged',
        notes: 'Door ripped off hinge',
        estimatedCost: 120,
        photos: ['https://x/1.jpg'],
      },
      {
        room: 'Bathroom',
        item: 'Shower / tub',
        condition: 'damaged',
        notes: 'Needs deep cleaning, mold',
        estimatedCost: 80,
        photos: [],
      },
      {
        room: 'Bedroom 1',
        item: 'Walls',
        condition: 'damaged',
        notes: 'Scuffs',
        estimatedCost: 0,
      },
      {
        room: 'Bedroom 1',
        item: 'Floors',
        condition: 'fair',
        estimatedCost: 50,
      },
    ],
  }

  it('turns priced damaged items into deductions', () => {
    const out = deductionsFromInspection(inspection)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      category: 'repairs',
      description:
        'Move-out inspection: Kitchen – Cabinets: Door ripped off hinge',
      amount: 120,
      evidenceUrls: ['https://x/1.jpg'],
    })
    expect(out[1].category).toBe('cleaning')
    expect(out[1].amount).toBe(80)
  })

  it('returns nothing for an empty report', () => {
    expect(deductionsFromInspection({ items: [] })).toEqual([])
    expect(deductionsFromInspection(null)).toEqual([])
  })
})

describe('sanitizeItems', () => {
  const good = {
    id: 'kitchen-walls',
    room: 'Kitchen',
    item: 'Walls',
    condition: 'good',
    notes: '',
    photos: [],
    estimatedCost: 0,
  }

  it('accepts a well-formed list', () => {
    expect(sanitizeItems([good])).toEqual([good])
  })

  it('rejects bad conditions, negative costs, non-string photos', () => {
    expect(sanitizeItems([{ ...good, condition: 'ruined' }])).toBeNull()
    expect(sanitizeItems([{ ...good, estimatedCost: -5 }])).toBeNull()
    expect(sanitizeItems([{ ...good, estimatedCost: 1.5 }])).toBeNull()
    expect(sanitizeItems([{ ...good, photos: [1] }])).toBeNull()
    expect(sanitizeItems([{ ...good, id: '' }])).toBeNull()
    expect(sanitizeItems([good, good])).toBeNull()
    expect(sanitizeItems('nope')).toBeNull()
  })

  it('drops unknown fields and trims text', () => {
    const [out] = sanitizeItems([
      { ...good, room: ' Kitchen ', extra: 'x', notes: 'ok' },
    ])
    expect(out.room).toBe('Kitchen')
    expect(out.notes).toBe('ok')
    expect(out).not.toHaveProperty('extra')
  })
})
