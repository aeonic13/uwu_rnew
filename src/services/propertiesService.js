import { apiClient } from './api'

/**
 * Landlord property workspace. Backed by server/routes/properties.js
 * (owner-only). One property = one listing plus everything managed for it.
 */
export const propertiesService = {
  /**
   * Portfolio: card summary per property plus totals.
   * @returns {Promise<{properties: object[], totals: object}>}
   */
  async getPortfolio() {
    return apiClient.get('/properties')
  },

  /**
   * Full workspace for one property: listing, stats, leases with household
   * members, applications, maintenance tickets, documents and this year's
   * expenses.
   * @param {string} id listing id
   */
  async getProperty(id) {
    return apiClient.get(`/properties/${id}`)
  },

  /**
   * Record the lease that already exists on an occupied property and
   * invite its current tenants by email.
   * @param {string} id listing id
   * @param {{lease: object, tenants: object[], attest: boolean}} body
   * @returns {Promise<{agreementId: string, invites: object[]}>}
   */
  async onboard(id, body) {
    return apiClient.post(`/properties/${id}/onboard`, body)
  },

  /**
   * Check a units-and-tenants CSV without writing anything.
   * @param {string} csv file contents
   * @returns {Promise<{ok: boolean, errors: {row: number, message: string}[],
   *   summary: {units: number, occupied: number, vacant: number, tenants: number},
   *   units: object[], skipped: object[]}>}
   */
  async checkImport(csv) {
    return apiClient.post('/properties/import', { csv, dryRun: true })
  },

  /**
   * Create the units in a checked CSV and invite their tenants.
   * @param {string} csv file contents
   * @returns {Promise<{created: object[], skipped: object[], errors: object[]}>}
   */
  async importCsv(csv) {
    return apiClient.post('/properties/import', { csv })
  },
}

export default propertiesService
