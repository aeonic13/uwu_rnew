/**
 * Compatibility scoring for the Housemates feature.
 *
 * The score is intentionally simple and explainable: we compare the four core
 * lifestyle dimensions that drive day-to-day friction between housemates and
 * award an equal weight to each. The result is a 0-100 "Compatibility Score".
 */

// The lifestyle dimensions we compare, each worth an equal share of 100.
const DIMENSIONS = [
  'sleepSchedule',
  'cleanliness',
  'noiseTolerance',
  'guestFrequency',
]

const POINTS_PER_DIMENSION = Math.round(100 / DIMENSIONS.length)

/**
 * Returns true when a profile has at least one lifestyle answer filled in.
 */
function hasLifestyleAnswers(profile) {
  if (!profile) return false
  return DIMENSIONS.some(key => Boolean(profile[key]))
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

  let score = 0
  let comparableDimensions = 0

  for (const key of DIMENSIONS) {
    const viewerValue = viewer[key]
    const candidateValue = candidate[key]

    // Only compare dimensions where both sides answered.
    if (viewerValue && candidateValue) {
      comparableDimensions += 1
      if (viewerValue === candidateValue) {
        score += POINTS_PER_DIMENSION
      }
    }
  }

  // If there were no overlapping answers, fall back rather than reporting 0%.
  if (comparableDimensions === 0) {
    return fallbackScore(candidate)
  }

  return Math.min(100, score)
}

export default { computeCompatibility }
