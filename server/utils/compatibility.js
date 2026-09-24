/**
 * Compatibility scoring for the Housemates feature.
 *
 * Weighted by what roommate-conflict research says actually causes friction:
 * cleanliness disputes lead (~42-47% of conflicts), then noise/sleep (~38%),
 * then guests & partners (~31-35%), then sharing food/belongings (~27%).
 * Smoking and pets act as near-dealbreakers, and conflict-resolution style
 * predicts whether issues get resolved at all. The result stays an
 * explainable 0-100 "Compatibility Score".
 */

// Each dimension: research-informed weight + which answer pairs deserve
// partial credit (adjacent lifestyles that can coexist with compromise).
const DIMENSIONS = [
  { key: 'cleanliness', weight: 1.5, partial: [] },
  {
    key: 'smoking',
    weight: 1.5,
    partial: [
      ['no', 'outdoor'],
      ['outdoor', 'yes'],
    ],
  },
  { key: 'sleepSchedule', weight: 1.25, partial: [] },
  { key: 'noiseTolerance', weight: 1.25, partial: [] },
  {
    key: 'guestFrequency',
    weight: 1.0,
    partial: [
      ['rarely', 'sometimes'],
      ['sometimes', 'often'],
    ],
  },
  {
    key: 'pets',
    weight: 1.0,
    partial: [
      ['love', 'okay'],
      ['okay', 'none'],
    ],
  },
  {
    key: 'sharing',
    weight: 0.75,
    partial: [
      ['share', 'ask'],
      ['ask', 'separate'],
    ],
  },
  {
    key: 'socialStyle',
    weight: 0.75,
    partial: [
      ['friends', 'friendly'],
      ['friendly', 'private'],
    ],
  },
  { key: 'chores', weight: 0.75, partial: [] },
  { key: 'conflictStyle', weight: 0.75, partial: [] },
]

// Opposed answers on these dimensions are practical dealbreakers (e.g. a
// smoker and a strict non-smoker): cap the overall score so a match can't
// look great on the strength of everything else.
const DEALBREAKERS = [
  { key: 'smoking', pair: ['no', 'yes'], cap: 45 },
  { key: 'pets', pair: ['love', 'none'], cap: 55 },
]

// Budget overlap is scored as one extra dimension. It is the most objective
// compatibility signal we collect: two people whose budgets never overlap
// cannot realistically split a place.
const BUDGET_WEIGHT = 1.0

/**
 * Returns true when a profile has at least one lifestyle answer filled in.
 */
export function hasLifestyleAnswers(profile) {
  if (!profile) return false
  return DIMENSIONS.some(d => Boolean(profile[d.key]))
}

/**
 * Fraction (0-1) of budget-range overlap relative to the narrower range, or
 * null when either side hasn't shared a usable budget.
 */
function budgetOverlap(viewer, candidate) {
  const a = normalizeBudget(viewer)
  const b = normalizeBudget(candidate)
  if (!a || !b) return null
  const overlap = Math.min(a.max, b.max) - Math.max(a.min, b.min)
  if (overlap <= 0) return 0
  const narrower = Math.min(a.max - a.min, b.max - b.min)
  // Identical point budgets (zero-width ranges) that overlap are a full match.
  if (narrower <= 0) return 1
  return Math.min(1, overlap / narrower)
}

function normalizeBudget(profile) {
  const min = profile?.budgetMin
  const max = profile?.budgetMax
  if (min == null || max == null || max < min) return null
  return { min, max }
}

/** Match quality for one dimension: 1 exact, 0.5 adjacent, 0 opposed. */
function dimensionMatch(dim, a, b) {
  if (a === b) return 1
  const isPartial = dim.partial.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x)
  )
  return isPartial ? 0.5 : 0
}

/**
 * Compute a 0-100 compatibility score between a viewer and a candidate
 * profile, or null when a real comparison is impossible (viewer has no quiz
 * answers, or the two profiles share no answered dimensions). Callers should
 * treat null as "unknown" and never invent a number for it — an honest
 * "take the quiz" beats a fabricated percentage.
 *
 * @param {object|null} viewer - The current user's housemate profile (or null)
 * @param {object} candidate - The candidate housemate profile to score
 * @returns {number|null} Compatibility score from 0 to 100, or null if unknown
 */
export function computeCompatibility(viewer, candidate) {
  if (!candidate) return null

  if (!hasLifestyleAnswers(viewer)) {
    return null
  }

  let earned = 0
  let comparableWeight = 0

  for (const dim of DIMENSIONS) {
    const viewerValue = viewer[dim.key]
    const candidateValue = candidate[dim.key]

    // Only compare dimensions where both sides answered.
    if (viewerValue && candidateValue) {
      comparableWeight += dim.weight
      earned += dim.weight * dimensionMatch(dim, viewerValue, candidateValue)
    }
  }

  const budget = budgetOverlap(viewer, candidate)
  if (budget != null) {
    comparableWeight += BUDGET_WEIGHT
    earned += BUDGET_WEIGHT * budget
  }

  // No overlapping answers at all: the score is unknown, not zero.
  if (comparableWeight === 0) {
    return null
  }

  let score = Math.round((earned / comparableWeight) * 100)

  // Apply dealbreaker caps for directly opposed answers.
  for (const { key, pair, cap } of DEALBREAKERS) {
    const a = viewer[key]
    const b = candidate[key]
    const opposed =
      (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])
    if (a && b && opposed) {
      score = Math.min(score, cap)
    }
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Explain a score: which answered dimensions the two people share, which
 * are adjacent (partial credit), and which are opposed. Each list is ordered
 * heaviest-weight first so the client can show the two or three reasons that
 * matter most. Budget overlap is reported separately as 'full' | 'partial' |
 * 'none' | null (unknown). Returns null when no comparison is possible, the
 * same condition under which computeCompatibility returns null.
 *
 * @param {object|null} viewer
 * @param {object} candidate
 * @returns {{shared: Array, partial: Array, differs: Array, budget: string|null}|null}
 */
export function explainCompatibility(viewer, candidate) {
  if (!candidate || !hasLifestyleAnswers(viewer)) return null

  const shared = []
  const partial = []
  const differs = []
  for (const dim of DIMENSIONS) {
    const a = viewer[dim.key]
    const b = candidate[dim.key]
    if (!a || !b) continue
    const match = dimensionMatch(dim, a, b)
    if (match === 1) shared.push({ key: dim.key, value: a })
    else if (match === 0.5)
      partial.push({ key: dim.key, viewer: a, candidate: b })
    else differs.push({ key: dim.key, viewer: a, candidate: b })
  }

  const overlap = budgetOverlap(viewer, candidate)
  let budget = null
  if (overlap != null) {
    budget = overlap >= 0.999 ? 'full' : overlap > 0 ? 'partial' : 'none'
  }

  if (shared.length + partial.length + differs.length === 0 && budget == null) {
    return null
  }
  return { shared, partial, differs, budget }
}

export default {
  computeCompatibility,
  explainCompatibility,
  hasLifestyleAnswers,
}
