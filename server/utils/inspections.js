/**
 * Move-in / move-out inspection helpers. Pure functions: the default room
 * checklist a new report starts from, the summary counts the UI shows, and
 * the deposit deductions a completed move-out report translates into.
 */

export const INSPECTION_TYPES = ['move_in', 'move_out']
export const CONDITIONS = ['good', 'fair', 'damaged']

/** Items every room gets. */
const COMMON_ITEMS = [
  'Walls',
  'Floors',
  'Ceiling',
  'Windows & screens',
  'Doors & locks',
  'Lights & outlets',
]

const KITCHEN_ITEMS = ['Appliances', 'Sink & disposal', 'Cabinets']
const BATHROOM_ITEMS = [
  'Toilet',
  'Shower / tub',
  'Sink & faucet',
  'Exhaust fan',
]
const EXTERIOR_ITEMS = ['Smoke / CO detectors', 'Keys & locks']

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function roomItems(room, extras = []) {
  const roomSlug = slugify(room)
  return [...COMMON_ITEMS, ...extras].map(item => ({
    id: `${roomSlug}-${slugify(item)}`,
    room,
    item,
    condition: 'good',
    notes: '',
    photos: [],
    estimatedCost: 0,
  }))
}

/**
 * The checklist a fresh report starts with, sized to the unit.
 * Ids are stable (`<room-slug>-<item-slug>`) so a move-out report can be
 * compared line by line against the move-in report.
 */
export function defaultChecklist({
  bedrooms = 0,
  bathrooms = 1,
  propertyType,
} = {}) {
  const beds = Math.max(0, Math.floor(Number(bedrooms) || 0))
  const baths = Math.max(1, Math.ceil(Number(bathrooms) || 1))
  const studio = beds === 0 || propertyType === 'Studio'

  const items = [
    ...roomItems('Entry & living room'),
    ...roomItems('Kitchen', KITCHEN_ITEMS),
  ]
  for (let i = 1; i <= baths; i += 1) {
    items.push(
      ...roomItems(baths === 1 ? 'Bathroom' : `Bathroom ${i}`, BATHROOM_ITEMS)
    )
  }
  if (studio) {
    items.push(...roomItems('Sleeping area'))
  } else {
    for (let i = 1; i <= beds; i += 1) {
      items.push(...roomItems(beds === 1 ? 'Bedroom' : `Bedroom ${i}`))
    }
  }
  items.push(...roomItems('Laundry & utility'))
  items.push(...roomItems('Exterior & other', EXTERIOR_ITEMS))
  return items
}

/** Totals the UI shows on a report row. Tolerates malformed JSON. */
export function summarizeItems(items) {
  const list = Array.isArray(items) ? items : []
  let damagedCount = 0
  let estimatedTotal = 0
  for (const it of list) {
    if (!it || typeof it !== 'object') continue
    if (it.condition === 'damaged') {
      damagedCount += 1
      const cost = Math.round(Number(it.estimatedCost) || 0)
      if (cost > 0) estimatedTotal += cost
    }
  }
  return { itemCount: list.length, damagedCount, estimatedTotal }
}

const CLEANING_RE = /clean/i

/**
 * Deposit deductions implied by a move-out report: one per damaged item with
 * an estimated cost. Descriptions are deterministic so re-sending is a no-op.
 */
export function deductionsFromInspection(inspection) {
  const items = Array.isArray(inspection?.items) ? inspection.items : []
  const out = []
  for (const it of items) {
    if (!it || it.condition !== 'damaged') continue
    const amount = Math.round(Number(it.estimatedCost) || 0)
    if (amount <= 0) continue
    const notes = String(it.notes || '').trim()
    const cleaning = CLEANING_RE.test(notes) || CLEANING_RE.test(it.item || '')
    out.push({
      category: cleaning ? 'cleaning' : 'repairs',
      description: `Move-out inspection: ${it.room} – ${it.item}${
        notes ? `: ${notes}` : ''
      }`,
      amount,
      evidenceUrls: Array.isArray(it.photos)
        ? it.photos.filter(p => typeof p === 'string')
        : [],
    })
  }
  return out
}

/**
 * Validate and sanitize a client-submitted items array. Returns the clean
 * array, or null when the shape is wrong (the route answers 400).
 */
export function sanitizeItems(items) {
  if (!Array.isArray(items) || items.length > 500) return null
  const clean = []
  const seen = new Set()
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') return null
    const { id, room, item, condition, notes, photos, estimatedCost } = raw
    if (typeof id !== 'string' || !id || id.length > 120) return null
    if (typeof room !== 'string' || !room.trim() || room.length > 80)
      return null
    if (typeof item !== 'string' || !item.trim() || item.length > 120) {
      return null
    }
    if (!CONDITIONS.includes(condition)) return null
    const cost = estimatedCost === undefined ? 0 : Number(estimatedCost)
    if (!Number.isInteger(cost) || cost < 0 || cost > 1_000_000) return null
    if (photos !== undefined) {
      if (!Array.isArray(photos) || photos.length > 20) return null
      if (!photos.every(p => typeof p === 'string' && p.length <= 2048)) {
        return null
      }
    }
    if (notes !== undefined && typeof notes !== 'string') return null
    if (seen.has(id)) return null
    seen.add(id)
    clean.push({
      id,
      room: room.trim(),
      item: item.trim(),
      condition,
      notes: (notes || '').slice(0, 1000),
      photos: photos || [],
      estimatedCost: cost,
    })
  }
  return clean
}
