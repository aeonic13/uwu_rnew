import { describe, it, expect } from 'vitest'
import {
  CITIES,
  findCity,
  normalizeCity,
  sanitizeAreas,
  localityOf,
  areaOverlap,
  localityCompatible,
  formatLocality,
} from '../utils/areas.js'

describe('city and area config', () => {
  it('lists San Diego with Pacific Beach and Mission Beach', () => {
    const sd = findCity('san diego')
    expect(sd?.name).toBe('San Diego')
    expect(sd.areas).toEqual(
      expect.arrayContaining(['Pacific Beach', 'Mission Beach'])
    )
  })

  it('has no duplicate areas within a city', () => {
    for (const city of CITIES) {
      expect(new Set(city.areas).size).toBe(city.areas.length)
    }
  })

  it('normalizes listed cities and keeps free-text cities as typed', () => {
    expect(normalizeCity('  SAN diego ')).toBe('San Diego')
    expect(normalizeCity('Tempe')).toBe('Tempe')
    expect(normalizeCity('')).toBeNull()
  })

  it('keeps only known areas for the city, canonical and deduped', () => {
    expect(
      sanitizeAreas('San Diego', [
        'pacific beach',
        'Pacific Beach',
        'Mission Beach',
        'Nowhere',
      ])
    ).toEqual(['Pacific Beach', 'Mission Beach'])
    expect(sanitizeAreas('Tempe', ['Pacific Beach'])).toEqual([])
    expect(sanitizeAreas('San Diego', 'not-an-array')).toEqual([])
  })
})

describe('localityOf', () => {
  it('prefers explicit city + areas', () => {
    expect(
      localityOf({
        city: 'san diego',
        areas: ['Mission Beach'],
        location: 'LA',
      })
    ).toEqual({ city: 'San Diego', areas: ['Mission Beach'] })
  })

  it('infers city and neighborhood from legacy free text', () => {
    expect(
      localityOf({ location: 'Pacific Beach, San Diego, CA 92109' })
    ).toEqual({ city: 'San Diego', areas: ['Pacific Beach'] })
    expect(localityOf({ location: 'Isla Vista' })).toEqual({
      city: 'Santa Barbara',
      areas: ['Isla Vista'],
    })
    expect(localityOf({ location: 'Somewhere else' })).toEqual({
      city: null,
      areas: [],
    })
  })
})

describe('areaOverlap / localityCompatible', () => {
  const pb = { city: 'San Diego', areas: ['Pacific Beach', 'Mission Beach'] }
  const ob = { city: 'San Diego', areas: ['Ocean Beach'] }
  const mb = { city: 'San Diego', areas: ['Mission Beach', 'La Jolla'] }
  const anySd = { city: 'San Diego', areas: [] }
  const la = { city: 'Los Angeles', areas: ['Westwood'] }

  it('counts shared areas case-insensitively', () => {
    expect(areaOverlap(pb, mb)).toBe(1)
    expect(areaOverlap(pb, { areas: ['pacific beach'] })).toBe(1)
    expect(areaOverlap(pb, ob)).toBe(0)
  })

  it('is compatible within a city unless both chose disjoint areas', () => {
    expect(localityCompatible(pb, mb)).toBe(true)
    expect(localityCompatible(pb, anySd)).toBe(true)
    expect(localityCompatible(pb, ob)).toBe(false)
    expect(localityCompatible(pb, la)).toBe(false)
    expect(localityCompatible(pb, {})).toBe(true)
  })

  it('formats a readable label', () => {
    expect(formatLocality(pb)).toBe('Pacific Beach, Mission Beach · San Diego')
    expect(formatLocality(anySd)).toBe('San Diego')
    expect(formatLocality({ location: 'Anywhere' })).toBe('Anywhere')
  })
})
