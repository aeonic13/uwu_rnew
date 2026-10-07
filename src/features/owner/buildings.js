/**
 * Group portfolio cards into buildings. One listing is one unit; listings
 * that share a street address are one building. Pure, so it unit tests
 * without rendering.
 */

const addressKey = address =>
  String(address || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

/**
 * `properties` are card summaries from GET /api/properties. Returns groups
 * in first-appearance order:
 *
 *   { key, streetAddress, isBuilding, properties, units, leased, listed,
 *     monthlyRent }
 *
 * A group is a building when two or more properties share an address;
 * everything else (including listings without a street address) is a
 * single-property group so it renders exactly as before. `monthlyRent`
 * sums the rent of leased units only, matching the portfolio total.
 */
export function groupByBuilding(properties) {
  const groups = new Map()
  let singles = 0
  for (const p of properties || []) {
    const address = addressKey(p.streetAddress)
    // No address: never grouped, and never collides with another one.
    const key = address || `single:${p.id ?? singles++}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        streetAddress: p.streetAddress || null,
        properties: [],
      })
    }
    groups.get(key).properties.push(p)
  }
  return [...groups.values()].map(g => {
    const leased = g.properties.filter(p => p.status === 'leased')
    return {
      ...g,
      isBuilding: g.properties.length > 1,
      units: g.properties.length,
      leased: leased.length,
      listed: g.properties.filter(p => p.status === 'listed').length,
      monthlyRent: leased.reduce((sum, p) => sum + (p.monthlyRent || 0), 0),
    }
  })
}

/** What a card inside a building is called: its unit, else its title. */
export function unitName(property) {
  return property.unitLabel || property.title
}

/** Where "Add another unit" goes: the create form prefilled from this unit. */
export function cloneUnitPath(listingId) {
  return `/dashboard/listings/new?cloneFrom=${encodeURIComponent(listingId)}`
}
