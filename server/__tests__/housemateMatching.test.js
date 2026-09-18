import { describe, it, expect } from 'vitest'
import {
  computeCompatibility,
  hasLifestyleAnswers,
} from '../utils/compatibility.js'
import {
  acceptedIdentities,
  satisfiesPreferencesOf,
  locationsCompatible,
} from '../utils/housemateMatch.js'

// A fully answered profile used as a baseline in scoring tests.
const baseProfile = {
  cleanliness: 'very',
  sleepSchedule: 'night',
  noiseTolerance: 'quiet',
  guestFrequency: 'rarely',
  smoking: 'no',
  pets: 'okay',
  sharing: 'ask',
  socialStyle: 'friendly',
  chores: 'schedule',
  conflictStyle: 'direct',
}

describe('computeCompatibility', () => {
  it('scores identical profiles at 100', () => {
    expect(computeCompatibility(baseProfile, { ...baseProfile })).toBe(100)
  })

  it('returns null (never a fabricated score) when the viewer has no quiz answers', () => {
    expect(computeCompatibility(null, baseProfile)).toBeNull()
    expect(computeCompatibility({}, baseProfile)).toBeNull()
    expect(
      computeCompatibility({ occupation: 'Nurse' }, baseProfile)
    ).toBeNull()
  })

  it('returns null when the profiles share no answered dimensions', () => {
    expect(
      computeCompatibility({ cleanliness: 'very' }, { smoking: 'no' })
    ).toBeNull()
  })

  it('returns null for a missing candidate', () => {
    expect(computeCompatibility(baseProfile, null)).toBeNull()
  })

  it('caps opposed smokers as a dealbreaker', () => {
    const smoker = { ...baseProfile, smoking: 'yes' }
    const score = computeCompatibility(baseProfile, smoker)
    expect(score).toBeLessThanOrEqual(45)
  })

  it('rewards budget overlap and punishes disjoint budgets', () => {
    const viewer = { ...baseProfile, budgetMin: 800, budgetMax: 1200 }
    const overlapping = { ...baseProfile, budgetMin: 900, budgetMax: 1300 }
    const disjoint = { ...baseProfile, budgetMin: 2000, budgetMax: 2500 }

    const overlapScore = computeCompatibility(viewer, overlapping)
    const disjointScore = computeCompatibility(viewer, disjoint)
    expect(overlapScore).toBeGreaterThan(disjointScore)
    // Lifestyle answers are identical, so any drop comes from budget alone.
    expect(disjointScore).toBeLessThan(100)
  })

  it('ignores budget when either side has not shared one', () => {
    const viewer = { ...baseProfile, budgetMin: 800, budgetMax: 1200 }
    expect(computeCompatibility(viewer, { ...baseProfile })).toBe(100)
  })
})

describe('hasLifestyleAnswers', () => {
  it('is false for empty or display-only profiles', () => {
    expect(hasLifestyleAnswers(null)).toBe(false)
    expect(hasLifestyleAnswers({})).toBe(false)
    expect(hasLifestyleAnswers({ bio: 'hello', age: 30 })).toBe(false)
  })

  it('is true with any single answer', () => {
    expect(hasLifestyleAnswers({ pets: 'love' })).toBe(true)
  })
})

describe('acceptedIdentities', () => {
  it('accepts everyone when unset or "everyone"', () => {
    expect(acceptedIdentities(null)).toBeNull()
    expect(acceptedIdentities('everyone')).toBeNull()
  })

  it('parses single and comma-list preferences', () => {
    expect([...acceptedIdentities('women')]).toEqual(['woman'])
    expect([...acceptedIdentities('women,nonbinary')].sort()).toEqual([
      'nonbinary',
      'woman',
    ])
  })

  it('treats an unparseable preference as everyone', () => {
    expect(acceptedIdentities('martians')).toBeNull()
  })
})

describe('satisfiesPreferencesOf', () => {
  const womenOnly = { genderPreference: 'women' }

  it('passes when the owner has no preferences', () => {
    expect(satisfiesPreferencesOf({}, { gender: 'man', age: 99 })).toBe(true)
    expect(satisfiesPreferencesOf(null, { gender: 'man' })).toBe(true)
  })

  it('enforces gender preferences strictly, including unknown viewers', () => {
    expect(satisfiesPreferencesOf(womenOnly, { gender: 'woman' })).toBe(true)
    expect(satisfiesPreferencesOf(womenOnly, { gender: 'man' })).toBe(false)
    // Consent-first: an unknown gender never passes a constrained preference.
    expect(satisfiesPreferencesOf(womenOnly, {})).toBe(false)
    expect(satisfiesPreferencesOf(womenOnly, null)).toBe(false)
  })

  it('supports multi-select gender preferences', () => {
    const pref = { genderPreference: 'women,nonbinary' }
    expect(satisfiesPreferencesOf(pref, { gender: 'nonbinary' })).toBe(true)
    expect(satisfiesPreferencesOf(pref, { gender: 'man' })).toBe(false)
  })

  it('enforces age bounds softly (unknown age passes)', () => {
    const pref = { agePreferenceMin: 25, agePreferenceMax: 35 }
    expect(satisfiesPreferencesOf(pref, { age: 30 })).toBe(true)
    expect(satisfiesPreferencesOf(pref, { age: 22 })).toBe(false)
    expect(satisfiesPreferencesOf(pref, { age: 40 })).toBe(false)
    expect(satisfiesPreferencesOf(pref, {})).toBe(true)
  })

  it('handles an open-ended upper bound (75+)', () => {
    const pref = { agePreferenceMin: 30, agePreferenceMax: null }
    expect(satisfiesPreferencesOf(pref, { age: 80 })).toBe(true)
    expect(satisfiesPreferencesOf(pref, { age: 25 })).toBe(false)
  })
})

describe('locationsCompatible', () => {
  it('passes when either side is unset', () => {
    expect(locationsCompatible(null, 'Seattle, WA')).toBe(true)
    expect(locationsCompatible('Seattle, WA', '')).toBe(true)
  })

  it('matches case-insensitive substrings in either direction', () => {
    expect(locationsCompatible('seattle', 'Seattle, WA')).toBe(true)
    expect(locationsCompatible('Capitol Hill, Seattle, WA', 'seattle')).toBe(
      true
    )
    expect(locationsCompatible('Austin, TX', 'Seattle, WA')).toBe(false)
  })
})
