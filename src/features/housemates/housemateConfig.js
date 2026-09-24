import {
  Sparkles,
  Heart,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Home,
  Coffee,
  Users,
  Ban,
  Wind,
  Cigarette,
  Cat,
  Share2,
  MessageCircle,
  Lock,
  CalendarClock,
  Shuffle,
  Search,
} from 'lucide-react'

// Hinge-style discovery preferences. People filter the feed by the age range
// and gender(s) they want in a housemate; the same preferences also control
// who gets to see THEM (mutual filtering, enforced server-side).
export const AGE_FLOOR = 18
export const AGE_CEIL = 75
export const DEFAULT_AGE_PREF = { min: AGE_FLOOR, max: 45 }

// How long to wait after a filter change before hitting the API, so dragging
// the age slider fires one request instead of one per tick.
export const FILTER_DEBOUNCE_MS = 300

// Discovery page size; more loads via the Load more button.
export const PAGE_SIZE = 24

// Desired-roommate gender options (multi-select; empty selection = everyone).
export const genderPreferenceOptions = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'nonbinary', label: 'Nonbinary' },
]

// The viewer's own gender identity (stored on their profile so others can
// filter). Values match the backend and gender preference mapping.
export const genderIdentities = [
  { id: 'man', label: 'Man' },
  { id: 'woman', label: 'Woman' },
  { id: 'nonbinary', label: 'Nonbinary' },
]

// Maps a desired-gender preference to the candidate gender it matches.
export const genderPrefToIdentity = {
  men: 'man',
  women: 'woman',
  nonbinary: 'nonbinary',
}

// Readable gender labels for the profile view.
export const genderLabels = {
  man: 'Man',
  woman: 'Woman',
  nonbinary: 'Nonbinary',
}

// "Has a place" vs "looking for a place" discovery filter.
export const lookingFilterOptions = [
  { id: 'any', label: 'Everyone', icon: Users },
  { id: 'true', label: 'Looking for a place', icon: Search },
  { id: 'false', label: 'Has a place', icon: Home },
]

// Report reasons; ids match the backend's accepted set.
export const reportReasons = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'fake', label: 'Fake profile' },
  { id: 'other', label: 'Something else' },
]

// Compatibility quiz questions. Option values match the backend's expected
// lifestyle values. Ordered and weighted by roommate-conflict research:
// cleanliness is the #1 source of disputes, then noise and sleep, then
// guests & partners, sharing food/belongings, with smoking/pets as
// near-dealbreakers and conflict style predicting whether problems get
// resolved. `short` is the one-word label used in match reasons.
export const quizQuestions = [
  {
    id: 'cleanliness',
    short: 'Tidiness',
    question: 'How tidy is your ideal home?',
    options: [
      { value: 'very', label: 'Very tidy', icon: Sparkles },
      { value: 'relaxed', label: 'Relaxed', icon: Heart },
    ],
  },
  {
    id: 'sleepSchedule',
    short: 'Schedule',
    question: 'When are you most active?',
    options: [
      { value: 'morning', label: 'Early riser', icon: Sun },
      { value: 'night', label: 'Night owl', icon: Moon },
    ],
  },
  {
    id: 'noiseTolerance',
    short: 'Noise',
    question: 'How do you feel about noise at home?',
    options: [
      { value: 'quiet', label: 'Prefer quiet', icon: VolumeX },
      { value: 'lively', label: 'Lively is fine', icon: Volume2 },
    ],
  },
  {
    id: 'guestFrequency',
    short: 'Guests',
    question: 'How often do you have guests or partners over?',
    options: [
      { value: 'rarely', label: 'Rarely', icon: Home },
      { value: 'sometimes', label: 'Sometimes', icon: Coffee },
      { value: 'often', label: 'Often', icon: Users },
    ],
  },
  {
    id: 'smoking',
    short: 'Smoking',
    question: 'What is your relationship with smoking or vaping?',
    options: [
      { value: 'no', label: 'Smoke-free home', icon: Ban },
      { value: 'outdoor', label: 'Outside only', icon: Wind },
      { value: 'yes', label: 'I smoke', icon: Cigarette },
    ],
  },
  {
    id: 'pets',
    short: 'Pets',
    question: 'How do you feel about pets in the home?',
    options: [
      { value: 'love', label: 'Love / have pets', icon: Cat },
      { value: 'okay', label: 'Fine with them', icon: Heart },
      { value: 'none', label: 'Prefer none', icon: Ban },
    ],
  },
  {
    id: 'sharing',
    short: 'Sharing',
    question: 'Groceries, cookware, and supplies: share or separate?',
    options: [
      { value: 'share', label: 'Happy to share', icon: Share2 },
      { value: 'ask', label: 'Ask first', icon: MessageCircle },
      { value: 'separate', label: 'Keep separate', icon: Lock },
    ],
  },
  {
    id: 'socialStyle',
    short: 'Social life',
    question: 'What do you want from a housemate socially?',
    options: [
      { value: 'friends', label: 'A friend', icon: Users },
      { value: 'friendly', label: 'Friendly but independent', icon: Coffee },
      { value: 'private', label: 'Quiet coexistence', icon: Home },
    ],
  },
  {
    id: 'chores',
    short: 'Chores',
    question: 'How should chores get handled?',
    options: [
      { value: 'schedule', label: 'A set schedule', icon: CalendarClock },
      { value: 'flexible', label: 'As needed', icon: Shuffle },
    ],
  },
  {
    id: 'conflictStyle',
    short: 'Conflict',
    question: 'When something bothers you at home, you…',
    options: [
      { value: 'direct', label: 'Talk it out right away', icon: MessageCircle },
      { value: 'gentle', label: 'Need time, then discuss', icon: Heart },
    ],
  },
]

const questionById = Object.fromEntries(quizQuestions.map(q => [q.id, q]))

/** Human label for one answer, e.g. ('cleanliness', 'very') → 'Very tidy'. */
export function optionLabel(key, value) {
  const q = questionById[key]
  const opt = q?.options.find(o => o.value === value)
  return opt ? opt.label : value
}

/** Short dimension name, e.g. 'guestFrequency' → 'Guests'. */
export function dimensionLabel(key) {
  if (key === 'budget') return 'Budget'
  return questionById[key]?.short || key
}

// Turn a profile's stored lifestyle values into human-readable rows using the
// quiz question text + option labels, so the profile view explains the match.
export function lifestyleSummary(profile) {
  if (!profile) return []
  const rows = []
  for (const q of quizQuestions) {
    const value = profile[q.id]
    if (!value) continue
    rows.push({
      id: q.id,
      question: q.question,
      label: optionLabel(q.id, value),
    })
  }
  return rows
}

/**
 * Condense a server matchBreakdown into the few reasons a card can show:
 * what you both answered the same (as answer labels) and where you are
 * opposed (as dimension names). Adjacent answers are left out of the short
 * form; the profile view shows them side by side.
 */
export function matchReasons(
  breakdown,
  { maxShared = 3, maxDiffers = 2 } = {}
) {
  if (!breakdown) return null
  const shared = breakdown.shared.map(d => optionLabel(d.key, d.value))
  if (breakdown.budget === 'full') shared.push('Budget overlap')
  const differs = breakdown.differs.map(d => dimensionLabel(d.key))
  if (breakdown.budget === 'none') differs.push('Budget')
  return {
    shared: shared.slice(0, maxShared),
    differs: differs.slice(0, maxDiffers),
    sharedTotal: shared.length,
    differsTotal: differs.length,
  }
}

// Move-in timing: "flexible" or a "YYYY-MM" month within the next year.
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function moveInOptions(now = new Date()) {
  const out = [{ value: 'flexible', label: 'Flexible' }]
  const y = now.getFullYear()
  const m = now.getMonth()
  for (let i = 0; i < 12; i += 1) {
    const year = y + Math.floor((m + i) / 12)
    const month = (m + i) % 12
    out.push({
      value: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTHS[month]} ${year}`,
    })
  }
  return out
}

/** 'flexible' → 'Flexible', '2026-10' → 'Oct 2026', anything else → null. */
export function formatMoveIn(value) {
  if (!value) return null
  if (value === 'flexible') return 'Flexible'
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (!m) return null
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : null
}

// Trust-first reminders, shown once as a banner and always in the profile
// view next to Block and Report.
export const safetyTips = [
  'Your contact info stays private until you choose to share it.',
  'Never pay a deposit or fee before you have seen a place in person.',
  'Meet potential housemates in a public place first.',
  'Block or Report anyone who makes you uncomfortable. Blocked people can no longer see or message you.',
]
