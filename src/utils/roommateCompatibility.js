/**
 * Roommate Compatibility Matching Algorithm
 *
 * This utility calculates compatibility scores between potential roommates
 * based on their questionnaire responses.
 */

// Question categories and their importance weights
const CATEGORY_WEIGHTS = {
  cleanliness: 1.5, // Most important - daily living impact
  sharing: 1.3, // High importance - financial and boundaries
  noise: 1.3, // High importance - sleep and study
  lifestyle: 1.2, // Important - fundamental differences
  socializing: 1.0, // Moderate importance
  food: 0.8, // Lower importance - easier to work around
  relationship: 0.7, // Lowest weight - nice-to-have
}

// Deal-breaker configurations
const DEALBREAKERS = {
  smoking: {
    check: (user1, user2) => {
      // If user smokes and other user is bothered by smoking
      if (user1.smoking === 'yes' && user2.smokingTolerance === 'yes') {
        return { isDealbreaker: true, reason: 'Smoking incompatibility' }
      }
      if (user2.smoking === 'yes' && user1.smokingTolerance === 'yes') {
        return { isDealbreaker: true, reason: 'Smoking incompatibility' }
      }
      return { isDealbreaker: false }
    },
  },
  pets: {
    check: (user1, user2) => {
      // Check if user has pets that the other doesn't tolerate
      const user1Pets = user1.pets || []
      const user2Tolerance = user2.petTolerance || []
      const user2Pets = user2.pets || []
      const user1Tolerance = user1.petTolerance || []

      // If user1 has pets but user2 wants no pets
      if (
        user1Pets.length > 0 &&
        !user1Pets.includes('none') &&
        user2Tolerance.includes('noPets')
      ) {
        return { isDealbreaker: true, reason: 'Pet incompatibility' }
      }

      // If user2 has pets but user1 wants no pets
      if (
        user2Pets.length > 0 &&
        !user2Pets.includes('none') &&
        user1Tolerance.includes('noPets')
      ) {
        return { isDealbreaker: true, reason: 'Pet incompatibility' }
      }

      return { isDealbreaker: false }
    },
  },
  dietaryRestrictions: {
    check: (user1, user2) => {
      const user1Restrictions = user1.dietaryRestrictions || []
      const user2Restrictions = user2.dietaryRestrictions || []

      // If one person is veg/vegan with no-meat requirement and other eats meat
      if (
        user1Restrictions.includes('vegNoMeat') &&
        !user2Restrictions.includes('vegNoMeat') &&
        !user2Restrictions.includes('vegMeatOk')
      ) {
        return {
          isDealbreaker: true,
          reason: 'Dietary restriction incompatibility',
        }
      }

      if (
        user2Restrictions.includes('vegNoMeat') &&
        !user1Restrictions.includes('vegNoMeat') &&
        !user1Restrictions.includes('vegMeatOk')
      ) {
        return {
          isDealbreaker: true,
          reason: 'Dietary restriction incompatibility',
        }
      }

      return { isDealbreaker: false }
    },
  },
  alcohol: {
    check: (user1, user2) => {
      // If one wants alcohol-free home and other drinks
      if (
        user1.alcoholUse === 'alcoholFree' &&
        user2.alcoholUse !== 'alcoholFree' &&
        user2.alcoholUse !== 'noDrinkOkWithIt'
      ) {
        return {
          isDealbreaker: true,
          reason: 'Alcohol preference incompatibility',
        }
      }

      if (
        user2.alcoholUse === 'alcoholFree' &&
        user1.alcoholUse !== 'alcoholFree' &&
        user1.alcoholUse !== 'noDrinkOkWithIt'
      ) {
        return {
          isDealbreaker: true,
          reason: 'Alcohol preference incompatibility',
        }
      }

      return { isDealbreaker: false }
    },
  },
}

/**
 * Calculate compatibility score for a specific category
 */
function calculateCategoryScore(user1Answer, user2Answer, questionConfig) {
  if (!user1Answer || !user2Answer) return 0

  // For multiple choice questions, calculate overlap
  if (Array.isArray(user1Answer) && Array.isArray(user2Answer)) {
    const intersection = user1Answer.filter(x => user2Answer.includes(x))
    const union = [...new Set([...user1Answer, ...user2Answer])]
    return union.length > 0 ? (intersection.length / union.length) * 100 : 50
  }

  // For single choice with weights, calculate distance
  if (questionConfig && questionConfig.options) {
    const option1 = questionConfig.options.find(o => o.value === user1Answer)
    const option2 = questionConfig.options.find(o => o.value === user2Answer)

    if (option1 && option2 && option1.weight && option2.weight) {
      const maxWeight = Math.max(...questionConfig.options.map(o => o.weight))
      const difference = Math.abs(option1.weight - option2.weight)
      const maxDifference = maxWeight - 1

      // Convert difference to similarity score (0-100)
      if (maxDifference === 0) return 100
      return ((maxDifference - difference) / maxDifference) * 100
    }
  }

  // Exact match
  return user1Answer === user2Answer ? 100 : 50
}

/**
 * Map question IDs to categories
 */
const QUESTION_CATEGORY_MAP = {
  billPayment: 'sharing',
  utilities: 'sharing',
  borrowing: 'sharing',
  commonItems: 'sharing',
  foodSharing: 'sharing',

  tidiness: 'cleanliness',
  kitchen: 'cleanliness',
  bathroom: 'cleanliness',
  dishes: 'cleanliness',
  cleaningSchedule: 'cleanliness',
  cleaningFrequency: 'cleanliness',

  smoking: 'lifestyle',
  smokingTolerance: 'lifestyle',
  pets: 'lifestyle',
  petTolerance: 'lifestyle',
  internetUse: 'lifestyle',
  occupation: 'lifestyle',

  noiseAcceptable: 'noise',
  musicFrequency: 'noise',
  musicVolume: 'noise',
  bedtime: 'noise',
  studyHabits: 'noise',
  comingGoing: 'noise',

  guestPolicy: 'socializing',
  overnightGuests: 'socializing',
  parties: 'socializing',
  frequentGuests: 'socializing',

  dietaryRestrictions: 'food',
  cookingFrequency: 'food',
  alcoholUse: 'food',

  roommateRelationship: 'relationship',
  additionalOccupants: 'relationship',
}

/**
 * Calculate overall compatibility between two users
 */
export function calculateCompatibility(
  user1Answers,
  user2Answers,
  questionConfig
) {
  // Check for dealbreakers first
  for (const [key, dealbreaker] of Object.entries(DEALBREAKERS)) {
    const result = dealbreaker.check(user1Answers, user2Answers)
    if (result.isDealbreaker) {
      return {
        overallScore: 0,
        isDealbreaker: true,
        dealbreakerReason: result.reason,
        categoryScores: {},
        breakdown: [],
      }
    }
  }

  // Calculate category scores
  const categoryScores = {}
  const breakdown = []

  for (const [questionId, category] of Object.entries(QUESTION_CATEGORY_MAP)) {
    if (!categoryScores[category]) {
      categoryScores[category] = { total: 0, count: 0 }
    }

    const user1Answer = user1Answers[questionId]
    const user2Answer = user2Answers[questionId]

    if (user1Answer !== undefined && user2Answer !== undefined) {
      const questionCfg = questionConfig
        ? questionConfig.find(q => q.id === questionId)
        : null
      const score = calculateCategoryScore(
        user1Answer,
        user2Answer,
        questionCfg
      )

      categoryScores[category].total += score
      categoryScores[category].count += 1

      breakdown.push({
        questionId,
        category,
        score,
        user1Answer,
        user2Answer,
      })
    }
  }

  // Calculate weighted average across categories
  let weightedSum = 0
  let totalWeight = 0
  const categoryAverages = {}

  for (const [category, data] of Object.entries(categoryScores)) {
    if (data.count > 0) {
      const average = data.total / data.count
      const weight = CATEGORY_WEIGHTS[category] || 1.0

      categoryAverages[category] = {
        score: Math.round(average),
        weight,
      }

      weightedSum += average * weight
      totalWeight += weight
    }
  }

  const overallScore =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return {
    overallScore,
    isDealbreaker: false,
    categoryScores: categoryAverages,
    breakdown,
    interpretation: getScoreInterpretation(overallScore),
  }
}

/**
 * Get human-readable interpretation of compatibility score
 */
function getScoreInterpretation(score) {
  if (score >= 85)
    return { level: 'excellent', text: 'Excellent Match', color: 'green' }
  if (score >= 70)
    return { level: 'great', text: 'Great Match', color: 'green' }
  if (score >= 55) return { level: 'good', text: 'Good Match', color: 'blue' }
  if (score >= 40) return { level: 'fair', text: 'Fair Match', color: 'yellow' }
  return { level: 'poor', text: 'Poor Match', color: 'red' }
}

/**
 * Find best matches for a user from a list of potential roommates
 */
export function findBestMatches(
  userAnswers,
  potentialRoommates,
  questionConfig,
  limit = 10
) {
  const matches = potentialRoommates
    .map(roommate => ({
      ...roommate,
      compatibility: calculateCompatibility(
        userAnswers,
        roommate.answers,
        questionConfig
      ),
    }))
    .filter(match => !match.compatibility.isDealbreaker)
    .sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore)
    .slice(0, limit)

  return matches
}

/**
 * Get detailed comparison between two users for a specific category
 */
export function getCategoryComparison(user1Answers, user2Answers, category) {
  const questions = Object.entries(QUESTION_CATEGORY_MAP)
    .filter(([_, cat]) => cat === category)
    .map(([questionId]) => questionId)

  const comparisons = questions.map(questionId => {
    const user1Answer = user1Answers[questionId]
    const user2Answer = user2Answers[questionId]

    return {
      questionId,
      user1Answer,
      user2Answer,
      match: JSON.stringify(user1Answer) === JSON.stringify(user2Answer),
    }
  })

  return comparisons
}
