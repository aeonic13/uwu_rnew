/**
 * Saved-search matching. Pure so it's unit-testable: given a saved search's
 * filter snapshot and a listing, does the listing satisfy every filter the
 * search actually set? Unset filters always pass.
 */
export function matchesSavedSearch(search, listing) {
  if (!search || !listing) return false

  if (search.minPrice != null && listing.price < search.minPrice) return false
  if (search.maxPrice != null && listing.price > search.maxPrice) return false
  if (search.minBeds != null && (listing.bedrooms ?? 0) < search.minBeds) {
    return false
  }
  if (search.propertyType && search.propertyType !== listing.propertyType) {
    return false
  }
  if (search.location) {
    const area = search.location.toLowerCase()
    const location = (listing.location || '').toLowerCase()
    const university = (listing.university || '').toLowerCase()
    if (!location.includes(area) && !university.includes(area)) return false
  }

  return true
}

export default { matchesSavedSearch }
