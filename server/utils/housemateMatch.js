/**
 * Mutual-preference matching for the Housemates feature.
 *
 * Discovery preferences are consent settings, not just filters: a person who
 * says "show me women" must ALSO stop appearing in feeds of people outside
 * that preference. Every discovery path (the list endpoint, single-profile
 * fetch, and new-housemate alerts) funnels through these helpers so the two
 * directions can never drift apart.
 */

// Maps a stored desired-gender preference id to the identity it matches.
export const GENDER_PREF_TO_IDENTITY = {
  men: 'man',
  women: 'woman',
  nonbinary: 'nonbinary',
}

/**
 * Parse a stored genderPreference string ("everyone", "women", or a comma
 * list like "women,nonbinary") into the set of identities it accepts, or
 * null when it accepts everyone.
 */
export function acceptedIdentities(genderPreference) {
  if (!genderPreference || genderPreference === 'everyone') return null
  const identities = genderPreference
    .split(',')
    .map(part => GENDER_PREF_TO_IDENTITY[part.trim()])
    .filter(Boolean)
  return identities.length > 0 ? new Set(identities) : null
}

/**
 * Does `other` satisfy `owner`'s stated discovery preferences?
 *
 * Gender is enforced strictly: if the owner constrained gender and the other
 * person's gender is unknown (including anonymous viewers), they do NOT pass —
 * a safety preference must never leak profiles to unknown audiences. Age is
 * enforced softly: an unknown age passes, matching the forward filter's
 * treatment of null ages.
 */
export function satisfiesPreferencesOf(owner, other) {
  if (!owner) return true

  const accepted = acceptedIdentities(owner.genderPreference)
  if (accepted && (!other?.gender || !accepted.has(other.gender))) {
    return false
  }

  const age = other?.age
  if (age != null) {
    if (owner.agePreferenceMin != null && age < owner.agePreferenceMin) {
      return false
    }
    if (owner.agePreferenceMax != null && age > owner.agePreferenceMax) {
      return false
    }
  }

  return true
}

/**
 * Rough locality check for alerting: compatible when either side hasn't set a
 * location, or one location string contains the other (case-insensitive).
 * Mirrors the substring approach of the saved-search matcher.
 */
export function locationsCompatible(a, b) {
  if (!a || !b) return true
  const left = a.trim().toLowerCase()
  const right = b.trim().toLowerCase()
  if (!left || !right) return true
  return left.includes(right) || right.includes(left)
}

export default {
  GENDER_PREF_TO_IDENTITY,
  acceptedIdentities,
  satisfiesPreferencesOf,
  locationsCompatible,
}
