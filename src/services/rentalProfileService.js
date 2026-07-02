import { apiClient } from './api'

/**
 * Universal rental application ("rental profile") — filled once at
 * pre-qualification, reused to prefill every property application.
 * Backed by /api/users/rental-profile.
 */
export const rentalProfileService = {
  /** Fetch the caller's saved rental profile (or null). */
  async get() {
    const res = await apiClient.get('/users/rental-profile')
    return res.rentalProfile || null
  },

  /** Save (replace) the caller's rental profile. */
  async save(rentalProfile) {
    const res = await apiClient.put('/users/rental-profile', { rentalProfile })
    return res.rentalProfile
  },
}

export default rentalProfileService
