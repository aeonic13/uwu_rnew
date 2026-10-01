import { describe, it, expect } from 'vitest'
import {
  pinLabel,
  positionOf,
  placeable,
  boundsFromListings,
  inBounds,
  visibleInBounds,
  plainBounds,
} from './mapUtils'

const sd = (lat, lng, extra = {}) => ({
  id: `${lat},${lng}`,
  mapPosition: { lat, lng, approximate: false },
  ...extra,
})

describe('pinLabel', () => {
  it('formats prices compactly', () => {
    expect(pinLabel(950)).toBe('$950')
    expect(pinLabel(1000)).toBe('$1K')
    expect(pinLabel(1250)).toBe('$1.3K')
    expect(pinLabel(2400)).toBe('$2.4K')
    expect(pinLabel(12500)).toBe('$13K')
    expect(pinLabel(undefined)).toBe('$0')
  })
})

describe('positionOf / placeable', () => {
  it('returns the position only when both coordinates are finite', () => {
    expect(positionOf(sd(32.7, -117.1))).toEqual({ lat: 32.7, lng: -117.1 })
    expect(positionOf({ mapPosition: null })).toBeNull()
    expect(positionOf({ mapPosition: { lat: NaN, lng: 1 } })).toBeNull()
    expect(positionOf(undefined)).toBeNull()
  })

  it('drops listings without a position', () => {
    const out = placeable([sd(1, 2), { id: 'x' }, sd(3, 4)])
    expect(out.map(x => x.listing.id)).toEqual(['1,2', '3,4'])
  })
})

describe('boundsFromListings', () => {
  it('is null with nothing to place', () => {
    expect(boundsFromListings([])).toBeNull()
    expect(boundsFromListings([{ id: 'x' }])).toBeNull()
  })

  it('pads a single pin so the map does not zoom to street level', () => {
    const b = boundsFromListings([sd(32.7, -117.1)])
    expect(b[0][0]).toBeLessThan(32.7)
    expect(b[1][0]).toBeGreaterThan(32.7)
    expect(b[0][1]).toBeLessThan(-117.1)
    expect(b[1][1]).toBeGreaterThan(-117.1)
  })

  it('wraps several pins exactly', () => {
    expect(
      boundsFromListings([sd(32.7, -117.3), sd(32.9, -117.1), sd(32.8, -117.2)])
    ).toEqual([
      [32.7, -117.3],
      [32.9, -117.1],
    ])
  })
})

describe('inBounds / visibleInBounds', () => {
  const bounds = { north: 33, south: 32, east: -117, west: -118 }

  it('tests containment inclusively', () => {
    expect(inBounds({ lat: 32.5, lng: -117.5 }, bounds)).toBe(true)
    expect(inBounds({ lat: 33, lng: -118 }, bounds)).toBe(true)
    expect(inBounds({ lat: 33.1, lng: -117.5 }, bounds)).toBe(false)
    expect(inBounds(null, bounds)).toBe(false)
    expect(inBounds({ lat: 32.5, lng: -117.5 }, null)).toBe(false)
  })

  it('keeps in-view pins and listings with no position', () => {
    const inside = sd(32.5, -117.5)
    const outside = sd(34, -117.5)
    const unplaced = { id: 'u', mapPosition: null }
    expect(visibleInBounds([inside, outside, unplaced], bounds)).toEqual([
      inside,
      unplaced,
    ])
    expect(visibleInBounds([inside, outside], null)).toHaveLength(2)
  })
})

describe('plainBounds', () => {
  it('reads the four edges off a Leaflet-like bounds object', () => {
    const fake = {
      getNorth: () => 1,
      getSouth: () => 2,
      getEast: () => 3,
      getWest: () => 4,
    }
    expect(plainBounds(fake)).toEqual({ north: 1, south: 2, east: 3, west: 4 })
    expect(plainBounds(null)).toBeNull()
  })
})
