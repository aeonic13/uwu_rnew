/**
 * Cities and the neighborhoods a housemate can mark as desired areas.
 * Mirrors server/utils/areas.js (the source of truth for validation and
 * matching); keep both in step when adding a city or area.
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
  {
    name: 'Los Angeles',
    state: 'CA',
    areas: [
      'Westwood',
      'Sawtelle',
      'Palms',
      'Culver City',
      'Mar Vista',
      'Venice',
      'Santa Monica',
      'Koreatown',
      'Mid-City',
      'Silver Lake',
      'Echo Park',
      'Los Feliz',
      'Hollywood',
      'Downtown',
      'University Park (USC)',
      'Exposition Park',
    ],
  },
  {
    name: 'Irvine',
    state: 'CA',
    areas: [
      'University Town Center',
      'Turtle Rock',
      'University Park',
      'Westpark',
      'Woodbridge',
      'Northwood',
      'Quail Hill',
      'Newport Beach (Eastbluff)',
    ],
  },
  {
    name: 'Santa Barbara',
    state: 'CA',
    areas: [
      'Isla Vista',
      'Goleta',
      'Downtown',
      'The Mesa',
      'Westside',
      'Eastside',
      'San Roque',
    ],
  },
  {
    name: 'San Luis Obispo',
    state: 'CA',
    areas: [
      'Downtown',
      'Foothill / Cal Poly',
      'Laguna Lake',
      'Johnson Avenue',
      'South Broad',
      'Tank Farm',
    ],
  },
  {
    name: 'Berkeley',
    state: 'CA',
    areas: [
      'Southside',
      'Northside',
      'Downtown',
      'Elmwood',
      'North Berkeley',
      'West Berkeley',
      'Rockridge (Oakland)',
    ],
  },
  {
    name: 'Davis',
    state: 'CA',
    areas: [
      'Downtown',
      'West Davis',
      'South Davis',
      'East Davis',
      'North Davis',
    ],
  },
  {
    name: 'Santa Cruz',
    state: 'CA',
    areas: [
      'Westside',
      'Downtown',
      'Eastside',
      'Seabright',
      'Live Oak',
      'Capitola',
    ],
  },
]

export const MAX_AREAS = 10
export const OTHER_CITY = '__other__'

const norm = s =>
  String(s || '')
    .trim()
    .toLowerCase()

export function findCity(name) {
  const key = norm(name)
  if (!key) return null
  return CITIES.find(c => norm(c.name) === key) || null
}

/** Neighborhood options for a listed city; [] for free-text cities. */
export function areasFor(cityName) {
  return findCity(cityName)?.areas || []
}

/** True when the city is one of the listed ones (has a neighborhood list). */
export function isListedCity(cityName) {
  return Boolean(findCity(cityName))
}

/**
 * "Pacific Beach, Mission Beach · San Diego" for display. Falls back to
 * the legacy free-text location, then null.
 */
export function formatLocality(profile) {
  if (!profile) return null
  const city = profile.city ? String(profile.city).trim() : ''
  const areas = Array.isArray(profile.areas)
    ? profile.areas.filter(Boolean)
    : []
  if (city) return areas.length ? `${areas.join(', ')} · ${city}` : city
  return profile.location || null
}
