/**
 * Pure helpers for the Browse map. Kept free of Leaflet so they can be unit
 * tested in jsdom and reused by the list side of the split view.
 */

/** Short price label for a pin: "$950", "$1.2K", "$2.4K". */
export function pinLabel(price) {
  const n = Number(price) || 0
  if (n < 1000) return `$${n}`
  const k = n / 1000
  const text = k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')
  return `$${text}K`
}

/** `{ lat, lng }` of a listing, or null when it cannot be placed. */
export function positionOf(listing) {
  const p = listing?.mapPosition
  if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null
  return { lat: p.lat, lng: p.lng }
}

/** Listings that have a position, paired with it. */
export function placeable(listings) {
  return (listings || [])
    .map(listing => ({ listing, position: positionOf(listing) }))
    .filter(x => x.position)
}

/**
 * Leaflet-style bounds [[south, west], [north, east]] around every placed
 * listing, or null when none can be placed. A single pin gets a small box
 * so fitBounds does not zoom to street level.
 */
export function boundsFromListings(listings) {
  const pts = placeable(listings).map(x => x.position)
  if (pts.length === 0) return null
  let south = Infinity
  let north = -Infinity
  let west = Infinity
  let east = -Infinity
  for (const { lat, lng } of pts) {
    south = Math.min(south, lat)
    north = Math.max(north, lat)
    west = Math.min(west, lng)
    east = Math.max(east, lng)
  }
  if (pts.length === 1) {
    const pad = 0.01
    return [
      [south - pad, west - pad],
      [north + pad, east + pad],
    ]
  }
  return [
    [south, west],
    [north, east],
  ]
}

/** True when a position lies inside `{ north, south, east, west }` bounds. */
export function inBounds(position, bounds) {
  if (!position || !bounds) return false
  const { lat, lng } = position
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  )
}

/**
 * Listings to show in the list while "search as I move" is on: those whose
 * pin is inside the current view, plus those with no position at all so a
 * listing never vanishes just because it lacks coordinates.
 */
export function visibleInBounds(listings, bounds) {
  if (!bounds) return listings || []
  return (listings || []).filter(listing => {
    const pos = positionOf(listing)
    return !pos || inBounds(pos, bounds)
  })
}

/** Plain `{ north, south, east, west }` from a Leaflet LatLngBounds. */
export function plainBounds(leafletBounds) {
  if (!leafletBounds) return null
  return {
    north: leafletBounds.getNorth(),
    south: leafletBounds.getSouth(),
    east: leafletBounds.getEast(),
    west: leafletBounds.getWest(),
  }
}
