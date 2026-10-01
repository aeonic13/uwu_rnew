import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  AREA_CENTERS,
  parseCoordinates,
  neighborhoodCenter,
  mapPositionFor,
  withMapPosition,
  geocodeAddress,
  resolveListingCoordinates,
} from '../utils/geocode.js'

afterEach(() => {
  delete process.env.GEOCODER
})

describe('parseCoordinates', () => {
  it('accepts numbers and numeric strings in range', () => {
    expect(parseCoordinates(32.7, -117.1)).toEqual({
      latitude: 32.7,
      longitude: -117.1,
    })
    expect(parseCoordinates('32.7', '-117.1')).toEqual({
      latitude: 32.7,
      longitude: -117.1,
    })
  })

  it('rejects missing, non-numeric or out-of-range values', () => {
    expect(parseCoordinates(undefined, -117)).toBeNull()
    expect(parseCoordinates('abc', '-117')).toBeNull()
    expect(parseCoordinates(95, -117)).toBeNull()
    expect(parseCoordinates(32, 200)).toBeNull()
  })
})

describe('neighborhoodCenter', () => {
  it('finds a listed neighborhood inside free text, case-insensitively', () => {
    expect(neighborhoodCenter('Pacific Beach, San Diego, CA 92109')).toEqual({
      lat: AREA_CENTERS['pacific beach'][0],
      lng: AREA_CENTERS['pacific beach'][1],
    })
  })

  it('prefers the longer, more specific name', () => {
    const [lat, lng] = AREA_CENTERS['mission valley west']
    expect(neighborhoodCenter('Mission Valley West, San Diego')).toEqual({
      lat,
      lng,
    })
  })

  it('falls back to the city, and to null for unknown places', () => {
    const [lat, lng] = AREA_CENTERS['san diego']
    expect(neighborhoodCenter('Somewhere, San Diego, CA')).toEqual({ lat, lng })
    expect(neighborhoodCenter('Tempe, AZ')).toBeNull()
    expect(neighborhoodCenter('')).toBeNull()
  })
})

describe('mapPositionFor / withMapPosition', () => {
  it('uses stored coordinates when present and marks them precise', () => {
    const pos = mapPositionFor({
      latitude: 32.79,
      longitude: -117.24,
      location: 'North Park, San Diego',
    })
    expect(pos).toEqual({ lat: 32.79, lng: -117.24, approximate: false })
  })

  it('falls back to the neighborhood center and marks it approximate', () => {
    const pos = mapPositionFor({ location: 'Hillcrest, San Diego, CA 92103' })
    expect(pos.approximate).toBe(true)
    expect(pos.lat).toBeCloseTo(AREA_CENTERS.hillcrest[0])
  })

  it('returns null when nothing can be placed', () => {
    expect(mapPositionFor({ location: 'Nowhere, TX' })).toBeNull()
    expect(mapPositionFor(null)).toBeNull()
  })

  it('attaches mapPosition to arrays and single listings', () => {
    const out = withMapPosition([
      { id: 'a', location: 'La Jolla, CA' },
      { id: 'b', location: 'Mars' },
    ])
    expect(out[0].mapPosition.approximate).toBe(true)
    expect(out[1].mapPosition).toBeNull()
    expect(
      withMapPosition({ id: 'c', latitude: 1, longitude: 2 }).mapPosition
    ).toEqual({ lat: 1, lng: 2, approximate: false })
  })
})

describe('geocodeAddress', () => {
  it('returns the first Nominatim hit as coordinates', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => [{ lat: '32.7948', lon: '-117.2450' }],
    }))
    const out = await geocodeAddress('1245 Grand Ave, San Diego, CA', {
      fetchImpl,
    })
    expect(out).toEqual({ latitude: 32.7948, longitude: -117.245 })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(String(url)).toContain('nominatim.openstreetmap.org')
    expect(String(url)).toContain('1245+Grand+Ave')
    expect(init.headers['User-Agent']).toMatch(/Rentra/)
  })

  it('returns null on empty results, HTTP errors and thrown errors', async () => {
    expect(
      await geocodeAddress('x', {
        fetchImpl: async () => ({ ok: true, json: async () => [] }),
      })
    ).toBeNull()
    expect(
      await geocodeAddress('x', { fetchImpl: async () => ({ ok: false }) })
    ).toBeNull()
    expect(
      await geocodeAddress('x', {
        fetchImpl: async () => {
          throw new Error('offline')
        },
      })
    ).toBeNull()
  })

  it('does nothing for blank input or when GEOCODER=off', async () => {
    const fetchImpl = vi.fn()
    expect(await geocodeAddress('   ', { fetchImpl })).toBeNull()
    process.env.GEOCODER = 'off'
    expect(await geocodeAddress('1 Main St', { fetchImpl })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('resolveListingCoordinates', () => {
  it('prefers explicit coordinates over geocoding', async () => {
    process.env.GEOCODER = 'off'
    const out = await resolveListingCoordinates({
      streetAddress: '1 Main St',
      latitude: '32.1',
      longitude: '-117.2',
    })
    expect(out).toEqual({ latitude: 32.1, longitude: -117.2 })
  })

  it('yields nulls when there is nothing to resolve', async () => {
    process.env.GEOCODER = 'off'
    expect(
      await resolveListingCoordinates({ streetAddress: '1 Main St' })
    ).toEqual({ latitude: null, longitude: null })
    expect(await resolveListingCoordinates({})).toEqual({
      latitude: null,
      longitude: null,
    })
  })
})
