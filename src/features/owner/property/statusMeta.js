/**
 * Display metadata for a property's one-word status
 * (server/utils/portfolio.js → propertyStatus).
 */
export const PROPERTY_STATUS = {
  leased: {
    label: 'Leased',
    className: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-500',
  },
  pending_signatures: {
    label: 'Pending signatures',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  listed: {
    label: 'Listed',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
}

export function statusMeta(status) {
  return PROPERTY_STATUS[status] || PROPERTY_STATUS.inactive
}

export const TICKET_STATUS = {
  pending: { label: 'Open', className: 'bg-red-100 text-red-700' },
  'in-progress': {
    label: 'In progress',
    className: 'bg-amber-100 text-amber-800',
  },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
}

export const APPLICATION_STATUS = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
}

/** "$2,400" */
export const money = n => `$${Math.round(Number(n) || 0).toLocaleString()}`

/** "Oct 1, 2026" from an ISO date; date-only values render in UTC. */
export function shortDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  // Date-only values arrive as YYYY-MM-DD or as midnight UTC; render them in
  // UTC so they never show a day early west of Greenwich.
  const dateOnly =
    typeof value === 'string' &&
    (/^\d{4}-\d{2}-\d{2}$/.test(value) || /T00:00:00(\.000)?Z$/.test(value))
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  })
}

export function fullName(user) {
  if (!user) return 'Unknown'
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown'
}

export function initials(user) {
  return fullName(user)
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
