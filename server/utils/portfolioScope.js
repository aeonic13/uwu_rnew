/**
 * Which portfolio an owner request acts on.
 *
 * A landlord always has their own portfolio. Accepting a team invitation
 * (routes/team.js) adds an active PortfolioMember row, so one account can
 * work several portfolios. `User.activePortfolioOwnerId` remembers the one
 * the user picked in the PortfolioSwitcher; when it is unset or no longer
 * valid (membership removed) the oldest membership wins, then their own.
 *
 * Pure functions so the rule is unit-testable without a database.
 */

/**
 * @param {{ id: string, activePortfolioOwnerId?: string|null }} user
 * @param {Array<{ ownerId: string, role: string, acceptedAt?: Date|null }>} memberships
 *   The user's ACTIVE memberships, oldest acceptedAt first.
 * @returns {{ portfolioId: string, portfolioRole: string }}
 */
export function resolvePortfolio(user, memberships = []) {
  const active = user?.activePortfolioOwnerId
  if (active) {
    if (active === user.id) {
      return { portfolioId: user.id, portfolioRole: 'owner' }
    }
    const chosen = memberships.find(m => m.ownerId === active)
    if (chosen) {
      return { portfolioId: chosen.ownerId, portfolioRole: chosen.role }
    }
  }
  const first = memberships[0]
  if (first) {
    return { portfolioId: first.ownerId, portfolioRole: first.role }
  }
  return { portfolioId: user.id, portfolioRole: 'owner' }
}

/**
 * Every portfolio the user can work: their own first, then each active
 * membership. `active` marks the one resolvePortfolio picks.
 * @param {{ id: string, firstName?: string, lastName?: string, activePortfolioOwnerId?: string|null }} user
 * @param {Array<{ ownerId: string, role: string, owner?: { firstName?: string, lastName?: string } }>} memberships
 */
export function listPortfolios(user, memberships = []) {
  const { portfolioId } = resolvePortfolio(user, memberships)
  const name = p => `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || null
  return [
    {
      ownerId: user.id,
      ownerName: name(user),
      role: 'owner',
      isOwn: true,
      active: portfolioId === user.id,
    },
    ...memberships.map(m => ({
      ownerId: m.ownerId,
      ownerName: name(m.owner),
      role: m.role,
      isOwn: false,
      active: portfolioId === m.ownerId,
    })),
  ]
}

/** True when `ownerId` is a portfolio the user may switch to. */
export function canSelectPortfolio(user, memberships = [], ownerId) {
  if (!ownerId) return false
  if (ownerId === user.id) return true
  return memberships.some(m => m.ownerId === ownerId)
}
