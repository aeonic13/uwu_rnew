// Roommate Matching Algorithm
// Calculates compatibility scores based on multiple factors

export const calculateCompatibilityScore = (seeker, candidate) => {
  let totalScore = 0
  let totalWeight = 0

  // Budget compatibility (weight: 25%)
  const budgetWeight = 0.25
  const budgetScore = calculateBudgetCompatibility(
    seeker.budget,
    candidate.budget
  )
  totalScore += budgetScore * budgetWeight
  totalWeight += budgetWeight

  // Location preferences (weight: 20%)
  const locationWeight = 0.2
  const locationScore = calculateLocationCompatibility(seeker, candidate)
  totalScore += locationScore * locationWeight
  totalWeight += locationWeight

  // Lifestyle compatibility (weight: 20%)
  const lifestyleWeight = 0.2
  const lifestyleScore = calculateLifestyleCompatibility(
    seeker.lifestyle,
    candidate.lifestyle
  )
  totalScore += lifestyleScore * lifestyleWeight
  totalWeight += lifestyleWeight

  // Academic compatibility (weight: 15%)
  const academicWeight = 0.15
  const academicScore = calculateAcademicCompatibility(seeker, candidate)
  totalScore += academicScore * academicWeight
  totalWeight += academicWeight

  // Personal preferences (weight: 10%)
  const personalWeight = 0.1
  const personalScore = calculatePersonalCompatibility(
    seeker.preferences,
    candidate.preferences
  )
  totalScore += personalScore * personalWeight
  totalWeight += personalWeight

  // Demographics compatibility (weight: 10%)
  const demoWeight = 0.1
  const demoScore = calculateDemographicCompatibility(seeker, candidate)
  totalScore += demoScore * demoWeight
  totalWeight += demoWeight

  return Math.round((totalScore / totalWeight) * 100)
}

const calculateBudgetCompatibility = (seekerBudget, candidateBudget) => {
  const seekerRange = [seekerBudget.min, seekerBudget.max]
  const candidateRange = [candidateBudget.min, candidateBudget.max]

  // Calculate overlap
  const overlapStart = Math.max(seekerRange[0], candidateRange[0])
  const overlapEnd = Math.min(seekerRange[1], candidateRange[1])

  if (overlapStart <= overlapEnd) {
    const overlapSize = overlapEnd - overlapStart
    const seekerRangeSize = seekerRange[1] - seekerRange[0]
    const candidateRangeSize = candidateRange[1] - candidateRange[0]
    const avgRangeSize = (seekerRangeSize + candidateRangeSize) / 2

    return Math.min(1.0, overlapSize / avgRangeSize)
  }

  return 0 // No overlap
}

const calculateLocationCompatibility = (seeker, candidate) => {
  let score = 0

  // University proximity
  if (seeker.university === candidate.university) {
    score += 0.4
  } else if (
    seeker.preferredUniversities?.includes(candidate.university) ||
    candidate.preferredUniversities?.includes(seeker.university)
  ) {
    score += 0.2
  }

  // Preferred neighborhoods
  const commonNeighborhoods = seeker.preferredNeighborhoods?.filter(n =>
    candidate.preferredNeighborhoods?.includes(n)
  )
  if (commonNeighborhoods?.length > 0) {
    score +=
      0.3 *
      (commonNeighborhoods.length /
        Math.max(
          seeker.preferredNeighborhoods?.length || 1,
          candidate.preferredNeighborhoods?.length || 1
        ))
  }

  // Transportation preferences
  if (seeker.transportation === candidate.transportation) {
    score += 0.3
  }

  return Math.min(1.0, score)
}

const calculateLifestyleCompatibility = (
  seekerLifestyle,
  candidateLifestyle
) => {
  let score = 0
  let factors = 0

  const lifestyleFactors = [
    'cleanliness',
    'noiseLevels',
    'socialPreference',
    'studyHabits',
    'sleepSchedule',
    'guestPolicy',
    'petFriendly',
    'smoking',
  ]

  lifestyleFactors.forEach(factor => {
    if (seekerLifestyle[factor] && candidateLifestyle[factor]) {
      factors++
      if (seekerLifestyle[factor] === candidateLifestyle[factor]) {
        score += 1
      } else if (
        isCompatibleLifestyleFactor(
          factor,
          seekerLifestyle[factor],
          candidateLifestyle[factor]
        )
      ) {
        score += 0.5
      }
    }
  })

  return factors > 0 ? score / factors : 0
}

const isCompatibleLifestyleFactor = (factor, value1, value2) => {
  const compatibilityMap = {
    cleanliness: {
      average: ['neat', 'relaxed'],
      neat: ['average'],
      relaxed: ['average'],
    },
    noiseLevels: {
      moderate: ['quiet', 'lively'],
      quiet: ['moderate'],
      lively: ['moderate'],
    },
    socialPreference: {
      balanced: ['social', 'independent'],
      social: ['balanced'],
      independent: ['balanced'],
    },
    studyHabits: {
      flexible: ['morning', 'evening', 'night'],
      morning: ['flexible'],
      evening: ['flexible'],
      night: ['flexible'],
    },
  }

  return compatibilityMap[factor]?.[value1]?.includes(value2) || false
}

const calculateAcademicCompatibility = (seeker, candidate) => {
  let score = 0

  // Same university
  if (seeker.university === candidate.university) {
    score += 0.3
  }

  // Similar academic level
  if (seeker.academicLevel === candidate.academicLevel) {
    score += 0.3
  } else if (
    Math.abs(
      getAcademicLevelNumber(seeker.academicLevel) -
        getAcademicLevelNumber(candidate.academicLevel)
    ) <= 1
  ) {
    score += 0.15
  }

  // Similar fields of study
  if (seeker.major && candidate.major) {
    if (seeker.major === candidate.major) {
      score += 0.2
    } else if (areSimilarMajors(seeker.major, candidate.major)) {
      score += 0.1
    }
  }

  // Study abroad compatibility
  if (seeker.studyAbroad === candidate.studyAbroad) {
    score += 0.2
  }

  return Math.min(1.0, score)
}

const getAcademicLevelNumber = level => {
  const levels = {
    freshman: 1,
    sophomore: 2,
    junior: 3,
    senior: 4,
    graduate: 5,
    phd: 6,
  }
  return levels[level] || 0
}

const areSimilarMajors = (major1, major2) => {
  const stemMajors = [
    'computer-science',
    'engineering',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
  ]
  const businessMajors = [
    'business',
    'economics',
    'finance',
    'marketing',
    'accounting',
  ]
  const artsMajors = [
    'english',
    'history',
    'art',
    'music',
    'theater',
    'philosophy',
  ]
  const socialMajors = [
    'psychology',
    'sociology',
    'political-science',
    'anthropology',
  ]

  const majorGroups = [stemMajors, businessMajors, artsMajors, socialMajors]

  return majorGroups.some(
    group => group.includes(major1) && group.includes(major2)
  )
}

const calculatePersonalCompatibility = (seekerPrefs, candidatePrefs) => {
  if (!seekerPrefs || !candidatePrefs) return 0

  let score = 0
  let totalPrefs = 0

  // Hobbies and interests
  if (seekerPrefs.hobbies && candidatePrefs.hobbies) {
    const commonHobbies = seekerPrefs.hobbies.filter(h =>
      candidatePrefs.hobbies.includes(h)
    )
    const totalHobbies = Math.max(
      seekerPrefs.hobbies.length,
      candidatePrefs.hobbies.length
    )
    score += (commonHobbies.length / totalHobbies) * 0.4
  }
  totalPrefs += 0.4

  // Personality traits
  if (seekerPrefs.personality && candidatePrefs.personality) {
    const personalityScore = calculatePersonalityCompatibility(
      seekerPrefs.personality,
      candidatePrefs.personality
    )
    score += personalityScore * 0.6
  }
  totalPrefs += 0.6

  return totalPrefs > 0 ? score / totalPrefs : 0
}

const calculatePersonalityCompatibility = (personality1, personality2) => {
  // Simple personality compatibility based on complementary traits
  const compatibilityMatrix = {
    extroverted: { extroverted: 0.8, introverted: 0.6, balanced: 0.9 },
    introverted: { introverted: 0.8, extroverted: 0.6, balanced: 0.9 },
    balanced: { extroverted: 0.9, introverted: 0.9, balanced: 1.0 },
  }

  return compatibilityMatrix[personality1]?.[personality2] || 0.5
}

const calculateDemographicCompatibility = (seeker, candidate) => {
  let score = 0

  // Age compatibility
  if (seeker.age && candidate.age) {
    const ageDiff = Math.abs(seeker.age - candidate.age)
    if (ageDiff <= 2) score += 0.5
    else if (ageDiff <= 4) score += 0.3
    else if (ageDiff <= 6) score += 0.1
  }

  // Gender preferences
  if (seeker.genderPreference) {
    if (
      seeker.genderPreference === 'any' ||
      seeker.genderPreference === candidate.gender
    ) {
      score += 0.5
    }
  } else {
    score += 0.5 // No preference means compatible
  }

  return Math.min(1.0, score)
}

// Generate match explanations
export const generateMatchExplanation = (seeker, candidate, score) => {
  const explanations = []

  // Budget
  const budgetScore = calculateBudgetCompatibility(
    seeker.budget,
    candidate.budget
  )
  if (budgetScore > 0.8) {
    explanations.push('💰 Excellent budget alignment')
  } else if (budgetScore > 0.5) {
    explanations.push('💰 Good budget compatibility')
  }

  // Location
  if (seeker.university === candidate.university) {
    explanations.push('🏫 Same university')
  }

  // Lifestyle
  const lifestyleScore = calculateLifestyleCompatibility(
    seeker.lifestyle,
    candidate.lifestyle
  )
  if (lifestyleScore > 0.7) {
    explanations.push('🏠 Very compatible lifestyle')
  } else if (lifestyleScore > 0.5) {
    explanations.push('🏠 Good lifestyle match')
  }

  // Academic
  if (seeker.major === candidate.major) {
    explanations.push('📚 Same major')
  }

  // Personal
  if (seeker.preferences?.hobbies && candidate.preferences?.hobbies) {
    const commonHobbies = seeker.preferences.hobbies.filter(h =>
      candidate.preferences.hobbies.includes(h)
    )
    if (commonHobbies.length > 0) {
      explanations.push(
        `🎯 Shared interests: ${commonHobbies.slice(0, 2).join(', ')}`
      )
    }
  }

  return explanations.slice(0, 3) // Return top 3 explanations
}

// Filter and sort potential matches
export const findRoommateMatches = (seeker, candidates, options = {}) => {
  const { minScore = 50, maxResults = 20, includeExplanations = true } = options

  const matches = candidates
    .map(candidate => {
      const score = calculateCompatibilityScore(seeker, candidate)
      const match = {
        ...candidate,
        compatibilityScore: score,
      }

      if (includeExplanations) {
        match.matchExplanation = generateMatchExplanation(
          seeker,
          candidate,
          score
        )
      }

      return match
    })
    .filter(match => match.compatibilityScore >= minScore)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, maxResults)

  return matches
}

// Create sample roommate seekers data
export const createSampleRoommateProfile = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  age: 20,
  gender: 'female',
  genderPreference: 'any',
  university: 'USC',
  academicLevel: 'junior',
  major: 'computer-science',
  studyAbroad: false,
  budget: {
    min: 800,
    max: 1200,
  },
  preferredNeighborhoods: ['University Park', 'Downtown LA'],
  preferredUniversities: ['USC', 'UCLA'],
  transportation: 'car',
  lifestyle: {
    cleanliness: 'neat',
    noiseLevels: 'moderate',
    socialPreference: 'balanced',
    studyHabits: 'evening',
    sleepSchedule: 'normal',
    guestPolicy: 'moderate',
    petFriendly: false,
    smoking: false,
  },
  preferences: {
    hobbies: ['reading', 'movies', 'fitness'],
    personality: 'balanced',
  },
  bio: '',
  photos: [],
  instagramHandle: '',
  contactInfo: {
    email: '',
    phone: '',
  },
  verificationStatus: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
})
