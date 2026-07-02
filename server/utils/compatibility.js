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

/**
 * Returns true when a profile has at least one lifestyle answer filled in.
 */
function hasLifestyleAnswers(profile) {
  if (!profile) return false
  return DIMENSIONS.some(d => Boolean(profile[d.key]))
}

/**
 * Deterministic fallback score used when the viewer has not completed their own
 * lifestyle quiz yet. Based purely on how complete the candidate profile is, so
 * the value is stable across requests (no randomness).
 *
 * @param {object} candidate - The candidate housemate profile
 * @returns {number} A score between 70 and 95
 */
function fallbackScore(candidate) {
  const tagCount = Array.isArray(candidate?.tags) ? candidate.tags.length : 0
  const score = 70 + tagCount * 5
  return Math.min(95, score)
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
 * Compute a 0-100 compatibility score between a viewer and a candidate profile.
 *
 * @param {object|null} viewer - The current user's housemate profile (or null)
 * @param {object} candidate - The candidate housemate profile to score
 * @returns {number} Compatibility score from 0 to 100
 */
export function computeCompatibility(viewer, candidate) {
  if (!candidate) return 0

  // If the viewer has not answered any lifestyle questions, we cannot compare
  // directly, so fall back to a stable completeness-based score.
  if (!hasLifestyleAnswers(viewer)) {
    return fallbackScore(candidate)
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

  // If there were no overlapping answers, fall back rather than reporting 0%.
  if (comparableWeight === 0) {
    return fallbackScore(candidate)
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

export default { computeCompatibility }
