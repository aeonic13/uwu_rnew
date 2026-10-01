/**
 * Listing coordinates for the Browse map.
 *
 * A listing with a street address is geocoded once on save (Nominatim /
 * OpenStreetMap, no key, cached on the row). A listing without one is
 * pinned at the center of the neighborhood named in its free-text
 * `location`, so every listing shows up on the map, just less precisely.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'Rentra/1.0 (https://myrentra.com; support@myrentra.com)'
const TIMEOUT_MS = 5000

/** Approximate centers [lat, lng] of the areas we list, plus a few the seed uses. */
export const AREA_CENTERS = {
  'pacific beach': [32.7975, -117.2405],
  'mission beach': [32.77, -117.252],
  'ocean beach': [32.748, -117.2495],
  'la jolla': [32.8328, -117.2713],
  'bird rock': [32.814, -117.272],
  'university city': [32.866, -117.211],
  utc: [32.866, -117.211],
  clairemont: [32.822, -117.19],
  'bay park': [32.787, -117.207],
  'point loma': [32.729, -117.234],
  'mission valley west': [32.764, -117.195],
  'mission valley': [32.768, -117.155],
  'linda vista': [32.782, -117.175],
  hillcrest: [32.748, -117.163],
  'mission hills': [32.75, -117.18],
  'north park': [32.745, -117.129],
  'south park': [32.73, -117.128],
  'university heights': [32.758, -117.146],
  'normal heights': [32.76, -117.123],
  kensington: [32.762, -117.103],
  'golden hill': [32.717, -117.134],
  gaslamp: [32.711, -117.16],
  downtown: [32.7157, -117.1611],
  'little italy': [32.723, -117.169],
  'east village': [32.71, -117.152],
  'college area': [32.77, -117.07],
  sdsu: [32.775, -117.071],
  'del cerro': [32.79, -117.062],
  'kearny mesa': [32.833, -117.14],
  'mira mesa': [32.915, -117.143],
  'serra mesa': [32.803, -117.138],
  'san diego': [32.7157, -117.1611],
}

// Longer names first so "mission valley west" wins over "mission valley".
const AREA_KEYS = Object.keys(AREA_CENTERS).sort((a, b) => b.length - a.length)

const isFiniteNumber = n => typeof n === 'number' && Number.isFinite(n)

/** Validate a lat/lng pair from user input; null when either is missing/invalid. */
export function parseCoordinates(lat, lng) {
  const la = typeof lat === 'string' ? parseFloat(lat) : lat
  const ln = typeof lng === 'string' ? parseFloat(lng) : lng
  if (!isFiniteNumber(la) || !isFiniteNumber(ln)) return null
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null
  return { latitude: la, longitude: ln }
}

/** Center of the first known neighborhood/city named in free text, or null. */
export function neighborhoodCenter(text) {
  const hay = String(text || '').toLowerCase()
  if (!hay) return null
  for (const key of AREA_KEYS) {
    if (hay.includes(key)) {
      const [lat, lng] = AREA_CENTERS[key]
      return { lat, lng }
    }
  }
  return null
}

/**
 * Where to pin a listing: `{ lat, lng, approximate }` or null when nothing
 * about it can be placed. `approximate` is true for neighborhood centers.
 */
export function mapPositionFor(listing) {
  if (!listing) return null
  if (isFiniteNumber(listing.latitude) && isFiniteNumber(listing.longitude)) {
    return { lat: listing.latitude, lng: listing.longitude, approximate: false }
  }
  const center = neighborhoodCenter(listing.location)
  return center ? { ...center, approximate: true } : null
}

/** Attach `mapPosition` to a listing (or each listing in an array). */
export function withMapPosition(input) {
  if (Array.isArray(input)) return input.map(withMapPosition)
  if (!input) return input
  return { ...input, mapPosition: mapPositionFor(input) }
}

/**
 * Geocode a street address with Nominatim. Best effort: returns
 * `{ latitude, longitude }` or null on any failure, never throws. Disabled
 * when GEOCODER=off (tests, offline local runs).
 */
export async function geocodeAddress(address, { fetchImpl = fetch } = {}) {
  const query = String(address || '').trim()
  if (!query || process.env.GEOCODER === 'off') return null

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'us')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const results = await res.json()
    const hit = Array.isArray(results) ? results[0] : null
    if (!hit) return null
    return parseCoordinates(hit.lat, hit.lon)
  } catch (err) {
    console.warn('Geocoding failed:', err?.message)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Coordinates to store for a listing payload: explicit lat/lng if the
 * client sent a valid pair, else a geocode of the street address, else
 * nulls (the map falls back to the neighborhood center).
 */
export async function resolveListingCoordinates({
  streetAddress,
  latitude,
  longitude,
}) {
  const explicit = parseCoordinates(latitude, longitude)
  if (explicit) return explicit
  if (streetAddress) {
    const geocoded = await geocodeAddress(streetAddress)
    if (geocoded) return geocoded
  }
  return { latitude: null, longitude: null }
}
