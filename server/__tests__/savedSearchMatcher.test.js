import { describe, it, expect } from 'vitest'
import { matchesSavedSearch } from '../utils/savedSearchMatcher.js'

const listing = {
  price: 1500,
  bedrooms: 2,
  propertyType: 'Apartment',
  location: 'Pacific Beach, San Diego, CA 92109',
  university: 'San Diego State University',
}

describe('matchesSavedSearch', () => {
  it('matches when no filters are set', () => {
    expect(matchesSavedSearch({}, listing)).toBe(true)
  })

  it('returns false for missing inputs', () => {
    expect(matchesSavedSearch(null, listing)).toBe(false)
    expect(matchesSavedSearch({}, null)).toBe(false)
  })

  describe('price bounds', () => {
    it('passes inside the range', () => {
      expect(
        matchesSavedSearch({ minPrice: 1000, maxPrice: 2000 }, listing)
      ).toBe(true)
    })

    it('fails below minPrice', () => {
      expect(matchesSavedSearch({ minPrice: 1600 }, listing)).toBe(false)
    })

    it('fails above maxPrice', () => {
      expect(matchesSavedSearch({ maxPrice: 1400 }, listing)).toBe(false)
    })

    it('is inclusive at the bounds', () => {
      expect(
        matchesSavedSearch({ minPrice: 1500, maxPrice: 1500 }, listing)
      ).toBe(true)
    })
  })

  describe('bedrooms', () => {
    it('passes when listing meets the minimum', () => {
      expect(matchesSavedSearch({ minBeds: 2 }, listing)).toBe(true)
    })

    it('fails when listing has fewer beds', () => {
      expect(matchesSavedSearch({ minBeds: 3 }, listing)).toBe(false)
    })

    it('treats missing bedrooms as zero', () => {
      expect(
        matchesSavedSearch({ minBeds: 1 }, { ...listing, bedrooms: undefined })
      ).toBe(false)
    })
  })

  describe('property type', () => {
    it('passes on exact match', () => {
      expect(matchesSavedSearch({ propertyType: 'Apartment' }, listing)).toBe(
        true
      )
    })

    it('fails on a different type', () => {
      expect(matchesSavedSearch({ propertyType: 'House' }, listing)).toBe(false)
    })
  })

  describe('location', () => {
    it('substring-matches the listing location, case-insensitively', () => {
      expect(matchesSavedSearch({ location: 'pacific beach' }, listing)).toBe(
        true
      )
    })

    it('substring-matches the university field too', () => {
      expect(matchesSavedSearch({ location: 'san diego state' }, listing)).toBe(
        true
      )
    })

    it('fails when neither field contains the area', () => {
      expect(matchesSavedSearch({ location: 'Austin' }, listing)).toBe(false)
    })

    it('handles listings with missing location fields', () => {
      expect(
        matchesSavedSearch(
          { location: 'anywhere' },
          { ...listing, location: null, university: null }
        )
      ).toBe(false)
    })
  })

  it('requires every set filter to pass', () => {
    expect(
      matchesSavedSearch(
        { location: 'Pacific Beach', maxPrice: 2000, minBeds: 3 },
        listing
      )
    ).toBe(false)
    expect(
      matchesSavedSearch(
        { location: 'Pacific Beach', maxPrice: 2000, minBeds: 2 },
        listing
      )
    ).toBe(true)
  })
})
