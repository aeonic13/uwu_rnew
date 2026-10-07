import { describe, it, expect } from 'vitest'
import {
  resolvePortfolio,
  listPortfolios,
  canSelectPortfolio,
} from '../utils/portfolioScope.js'

const me = { id: 'u1', firstName: 'Jen', lastName: 'Park' }
const memberships = [
  {
    ownerId: 'o1',
    role: 'manager',
    owner: { firstName: 'Ann', lastName: 'Lee' },
  },
  {
    ownerId: 'o2',
    role: 'co_owner',
    owner: { firstName: 'Bob', lastName: 'Wu' },
  },
]

describe('resolvePortfolio', () => {
  it('uses the own portfolio when there are no memberships', () => {
    expect(resolvePortfolio(me, [])).toEqual({
      portfolioId: 'u1',
      portfolioRole: 'owner',
    })
  })

  it('defaults to the oldest membership when nothing is chosen', () => {
    expect(resolvePortfolio(me, memberships)).toEqual({
      portfolioId: 'o1',
      portfolioRole: 'manager',
    })
  })

  it('honours a chosen membership', () => {
    expect(
      resolvePortfolio({ ...me, activePortfolioOwnerId: 'o2' }, memberships)
    ).toEqual({ portfolioId: 'o2', portfolioRole: 'co_owner' })
  })

  it('honours choosing the own portfolio over memberships', () => {
    expect(
      resolvePortfolio({ ...me, activePortfolioOwnerId: 'u1' }, memberships)
    ).toEqual({ portfolioId: 'u1', portfolioRole: 'owner' })
  })

  it('falls back when the chosen portfolio is stale', () => {
    expect(
      resolvePortfolio({ ...me, activePortfolioOwnerId: 'gone' }, memberships)
    ).toEqual({ portfolioId: 'o1', portfolioRole: 'manager' })
    expect(
      resolvePortfolio({ ...me, activePortfolioOwnerId: 'gone' }, [])
    ).toEqual({ portfolioId: 'u1', portfolioRole: 'owner' })
  })
})

describe('listPortfolios', () => {
  it('lists own first and marks the active one', () => {
    const list = listPortfolios(
      { ...me, activePortfolioOwnerId: 'o2' },
      memberships
    )
    expect(list.map(p => p.ownerId)).toEqual(['u1', 'o1', 'o2'])
    expect(list[0]).toMatchObject({
      ownerName: 'Jen Park',
      role: 'owner',
      isOwn: true,
      active: false,
    })
    expect(list[2]).toMatchObject({
      ownerName: 'Bob Wu',
      role: 'co_owner',
      isOwn: false,
      active: true,
    })
    expect(list.filter(p => p.active)).toHaveLength(1)
  })
})

describe('canSelectPortfolio', () => {
  it('allows own id and active memberships only', () => {
    expect(canSelectPortfolio(me, memberships, 'u1')).toBe(true)
    expect(canSelectPortfolio(me, memberships, 'o2')).toBe(true)
    expect(canSelectPortfolio(me, memberships, 'nope')).toBe(false)
    expect(canSelectPortfolio(me, memberships, '')).toBe(false)
  })
})
