/** Display metadata shared by the inspection screens. */

export const TYPE_LABEL = { move_in: 'Move-in', move_out: 'Move-out' }

export const STATUS_META = {
  draft: { label: 'Draft', className: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
}

export const CONDITIONS = [
  {
    key: 'good',
    label: 'Good',
    active: 'bg-green-600 text-white border-green-600',
    badge: 'bg-green-100 text-green-800',
  },
  {
    key: 'fair',
    label: 'Fair',
    active: 'bg-amber-500 text-white border-amber-500',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'damaged',
    label: 'Damaged',
    active: 'bg-red-600 text-white border-red-600',
    badge: 'bg-red-100 text-red-800',
  },
]

export const conditionMeta = key =>
  CONDITIONS.find(c => c.key === key) || CONDITIONS[0]

/** Group items by room, preserving first-seen room order. */
export function groupByRoom(items) {
  const rooms = []
  const byRoom = new Map()
  for (const item of items || []) {
    if (!byRoom.has(item.room)) {
      byRoom.set(item.room, [])
      rooms.push(item.room)
    }
    byRoom.get(item.room).push(item)
  }
  return rooms.map(room => ({ room, items: byRoom.get(room) }))
}

/** "51 items · 2 flagged · $200 estimated" */
export function summaryLine(i, money) {
  const parts = [`${i.itemCount ?? 0} items`, `${i.damagedCount ?? 0} flagged`]
  if (i.estimatedTotal > 0) parts.push(`${money(i.estimatedTotal)} estimated`)
  return parts.join(' · ')
}
