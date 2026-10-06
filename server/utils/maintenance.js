/**
 * Pure helpers for maintenance follow-through (comments, vendor/cost,
 * booking a repair as an expense). No Prisma, no I/O, so they unit-test
 * without a database.
 */

export const COMMENT_MAX_LENGTH = 2000
export const COMMENT_MAX_PHOTOS = 10
export const VENDOR_PHONE_MAX_LENGTH = 40

/**
 * True when the user is a party to the ticket: the tenant who filed it or
 * the owner of the listing it was filed on.
 */
export function isTicketParty(ticket, userId) {
  if (!ticket || !userId) return false
  return ticket.tenantId === userId || ticket.listing?.ownerId === userId
}

/**
 * Validate a comment payload. Returns `{ body, photos }` or `{ error }`.
 */
export function sanitizeComment({ body, photos } = {}) {
  const text = typeof body === 'string' ? body.trim() : ''
  if (!text) return { error: 'A message is required' }
  if (text.length > COMMENT_MAX_LENGTH) {
    return {
      error: `Message must be ${COMMENT_MAX_LENGTH} characters or fewer`,
    }
  }
  let urls = []
  if (photos !== undefined && photos !== null) {
    if (!Array.isArray(photos)) return { error: 'Photos must be a list' }
    urls = photos.filter(p => typeof p === 'string' && p.trim())
    if (urls.length !== photos.length) {
      return { error: 'Photos must be URLs' }
    }
    if (urls.length > COMMENT_MAX_PHOTOS) {
      return { error: `At most ${COMMENT_MAX_PHOTOS} photos per message` }
    }
  }
  return { body: text, photos: urls }
}

/**
 * Validate the vendor phone / cost fields on a status update. Only keys that
 * were present in the input appear in `data`, so callers can spread it into
 * a Prisma update without clobbering untouched fields.
 * Returns `{ data }` or `{ error }`.
 */
export function sanitizeVendorFields({ vendorPhone, cost } = {}) {
  const data = {}
  if (vendorPhone !== undefined) {
    if (vendorPhone === null || vendorPhone === '') {
      data.vendorPhone = null
    } else if (typeof vendorPhone !== 'string') {
      return { error: 'Vendor phone must be text' }
    } else {
      const trimmed = vendorPhone.trim()
      if (trimmed.length > VENDOR_PHONE_MAX_LENGTH) {
        return {
          error: `Vendor phone must be ${VENDOR_PHONE_MAX_LENGTH} characters or fewer`,
        }
      }
      data.vendorPhone = trimmed || null
    }
  }
  if (cost !== undefined) {
    if (cost === null || cost === '') {
      data.cost = null
    } else {
      const n = Number(cost)
      if (!Number.isInteger(n) || n < 0) {
        return { error: 'Cost must be a whole number of dollars, 0 or more' }
      }
      data.cost = n
    }
  }
  return { data }
}

/**
 * The Expense row a completed repair books as. `now` is injectable for tests.
 * Returns null when the ticket has no positive cost to book.
 */
export function expenseFromTicket(ticket, now = new Date()) {
  if (!ticket || !(ticket.cost > 0)) return null
  const description = `${ticket.category}: ${ticket.description}`.slice(0, 200)
  return {
    ownerId: ticket.listing?.ownerId,
    listingId: ticket.listingId,
    date: ticket.completedAt ? new Date(ticket.completedAt) : now,
    amount: ticket.cost,
    category: 'repairs',
    description,
    vendor: ticket.assignedTo || null,
  }
}
