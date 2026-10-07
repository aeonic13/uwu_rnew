import { describe, it, expect } from 'vitest'
import { groupByBuilding, unitName, cloneUnitPath } from './buildings'

const unit = (id, over = {}) => ({
  id,
  title: `Listing ${id}`,
  streetAddress: '1245 Grand Ave, San Diego, CA 92109',
  status: 'leased',
  monthlyRent: 1000,
  ...over,
})

describe('groupByBuilding', () => {
  it('leaves properties with distinct addresses as single groups, in order', () => {
    const groups = groupByBuilding([
      unit('a', { streetAddress: '1 Main St' }),
      unit('b', { streetAddress: '2 Main St' }),
      unit('c', { streetAddress: null }),
    ])
    expect(groups.map(g => g.isBuilding)).toEqual([false, false, false])
    expect(groups.map(g => g.properties[0].id)).toEqual(['a', 'b', 'c'])
    expect(groups[2].streetAddress).toBeNull()
  })

  it('never groups listings that have no street address', () => {
    const groups = groupByBuilding([
      unit('a', { streetAddress: null }),
      unit('b', { streetAddress: '' }),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.every(g => !g.isBuilding)).toBe(true)
  })

  it('groups two or more units at one address into a building with counts', () => {
    const groups = groupByBuilding([
      unit('a', { unitLabel: '1A', status: 'leased', monthlyRent: 1800 }),
      unit('x', { streetAddress: '9 Oak St' }),
      unit('b', {
        streetAddress: '1245  grand ave, san diego, ca 92109 ',
        unitLabel: '1B',
        status: 'listed',
        monthlyRent: 1900,
      }),
      unit('c', { unitLabel: '2A', status: 'leased', monthlyRent: 2000 }),
    ])
    expect(groups).toHaveLength(2)
    const [building, single] = groups
    expect(building.isBuilding).toBe(true)
    expect(building.streetAddress).toBe('1245 Grand Ave, San Diego, CA 92109')
    expect(building.properties.map(p => p.id)).toEqual(['a', 'b', 'c'])
    expect(building).toMatchObject({
      units: 3,
      leased: 2,
      listed: 1,
      // Leased units only, like the portfolio total.
      monthlyRent: 3800,
    })
    expect(single.isBuilding).toBe(false)
    expect(single.properties[0].id).toBe('x')
  })

  it('handles an empty or missing list', () => {
    expect(groupByBuilding([])).toEqual([])
    expect(groupByBuilding(undefined)).toEqual([])
  })
})

describe('unitName / cloneUnitPath', () => {
  it('prefers the unit label and falls back to the title', () => {
    expect(unitName({ title: 'Beachside 2BR', unitLabel: 'Apt 2B' })).toBe(
      'Apt 2B'
    )
    expect(unitName({ title: 'Beachside 2BR', unitLabel: null })).toBe(
      'Beachside 2BR'
    )
  })

  it('links to the create form prefilled from the given listing', () => {
    expect(cloneUnitPath('abc 1')).toBe(
      '/dashboard/listings/new?cloneFrom=abc%201'
    )
  })
})
