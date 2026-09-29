/**
 * Cities and the neighborhoods a housemate can mark as desired areas.
 * Source of truth for validation and matching; the client keeps a copy in
 * src/features/housemates/areaConfig.js for the picker. Keep both in step.
 *
 * Areas are canonical display names. "Empty areas" means anywhere in the
 * city. A city not in this list is allowed as free text (no areas).
 */
export const CITIES = [
  {
    name: 'San Diego',
    state: 'CA',
    areas: [
      'Pacific Beach',
      'Mission Beach',
      'Ocean Beach',
      'La Jolla',
      'University City (UTC)',
      'Clairemont',
      'Bay Park',
      'Point Loma',
      'Mission Valley',
      'Linda Vista',
      'Hillcrest',
      'North Park',
      'South Park',
      'University Heights',
      'Normal Heights',
      'Kensington',
      'Golden Hill',
      'Downtown / Gaslamp',
      'Little Italy',
      'East Village',
      'College Area (SDSU)',
      'Del Cerro',
      'Kearny Mesa',
      'Mira Mesa',
      'Serra Mesa',
    ],
  },
]

export const MAX_AREAS = 10

const norm = s =>
  String(s || '')
    .trim()
    .toLowerCase()

/** Find a listed city by name (case-insensitive). */
export function findCity(name) {
  const key = norm(name)
  if (!key) return null
  return CITIES.find(c => norm(c.name) === key) || null
}

/** Canonical city name for display/storage, or the trimmed free text. */
export function normalizeCity(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return null
  const listed = findCity(trimmed)
  return listed ? listed.name : trimmed.slice(0, 80)
}

/**
 * Keep only areas that belong to the city, in canonical spelling, deduped,
 * capped. Unknown cities have no areas.
 */
export function sanitizeAreas(cityName, areas) {
  const city = findCity(cityName)
  if (!city || !Array.isArray(areas)) return []
  const seen = new Set()
  const out = []
  for (const raw of areas) {
    const match = city.areas.find(a => norm(a) === norm(raw))
    if (match && !seen.has(match)) {
      seen.add(match)
      out.push(match)
      if (out.length >= MAX_AREAS) break
    }
  }
  return out
}

/**
 * Locality of a profile: its explicit city/areas, else a best guess from
 * the legacy free-text location (city name or a known neighborhood).
 */
export function localityOf(profile) {
  if (!profile) return { city: null, areas: [] }
  if (profile.city) {
    return {
      city: normalizeCity(profile.city),
      areas: sanitizeAreas(profile.city, profile.areas),
    }
  }
  const text = norm(profile.location)
  if (!text) return { city: null, areas: [] }
  for (const city of CITIES) {
    if (text.includes(norm(city.name))) {
      return {
        city: city.name,
        areas: city.areas.filter(a => text.includes(norm(a.split(' (')[0]))),
      }
    }
  }
  for (const city of CITIES) {
    const hit = city.areas.find(a => text.includes(norm(a.split(' (')[0])))
    if (hit) return { city: city.name, areas: [hit] }
  }
  return { city: null, areas: [] }
}

/** Number of desired areas two localities share. */
export function areaOverlap(a, b) {
  const left = new Set((a?.areas || []).map(norm))
  return (b?.areas || []).filter(x => left.has(norm(x))).length
}

/**
 * Whether two people could plausibly live together, location-wise: either
 * side without a city passes; different cities fail; both listing areas
 * with none in common fail; otherwise compatible.
 */
export function localityCompatible(a, b) {
  const la = localityOf(a)
  const lb = localityOf(b)
  if (!la.city || !lb.city) return true
  if (norm(la.city) !== norm(lb.city)) return false
  if (la.areas.length && lb.areas.length) return areaOverlap(la, lb) > 0
  return true
}

/** "Pacific Beach, Mission Beach · San Diego" style label. */
export function formatLocality(profile) {
  const { city, areas } = localityOf(profile)
  if (!city) return profile?.location || null
  return areas.length ? `${areas.join(', ')} · ${city}` : city
}
