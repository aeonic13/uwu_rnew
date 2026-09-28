import { apiClient } from './api'

/**
 * Legal policies and the caller's acceptance trail.
 * Backed by server/routes/legal.js.
 */
export const legalService = {
  /** Public: { versions: {policy: 'YYYY-MM-DD'}, titles } */
  async versions() {
    return apiClient.get('/legal/versions')
  },

  /** { versions, acceptances: [{policy, version, acceptedAt, current}], pending: [...] } */
  async acceptances() {
    return apiClient.get('/legal/acceptances')
  },

  /**
   * Record acceptance of the current version of one or more policies.
   * Returns { accepted, pending }.
   */
  async accept(policies, context) {
    return apiClient.post('/legal/accept', {
      policies: Array.isArray(policies) ? policies : [policies],
      ...(context && { context }),
    })
  },
}

export default legalService
