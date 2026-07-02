import { apiClient } from './api'

/**
 * Applications service for handling rental application API calls
 */
export const applicationsService = {
  /**
   * Submit a new application for a listing
   * @param {object} applicationData - Application details
   * @param {string} applicationData.listingId - The listing ID
   * @param {string} applicationData.startDate - Desired start date
   * @param {string} applicationData.endDate - Desired end date
   * @param {string} applicationData.message - Message to the owner
   * @param {string} applicationData.emergencyContact - Emergency contact info
   * @returns {Promise<{message: string, application: object}>}
   */
  async submitApplication(applicationData) {
    return apiClient.post('/applications', applicationData)
  },

  /**
   * Apply to a listing as a roommate group — one application per member.
   * @param {{groupId:string,listingId:string,startDate:string,endDate:string,message?:string}} data
   * @returns {Promise<{message:string, applications:object[]}>}
   */
  async submitGroupApplication(data) {
    return apiClient.post('/applications/group', data)
  },

  /**
   * Get all applications for the current user
   * Students see their own applications, owners see applications for their listings
   * @param {object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {string} params.listingId - Filter by listing
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{applications: Array, pagination: object}>}
   */
  async getApplications(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.listingId) queryParams.append('listingId', params.listingId)
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)

    const queryString = queryParams.toString()
    const url = queryString ? `/applications?${queryString}` : '/applications'

    return apiClient.get(url)
  },

  /**
   * Get a single application by ID
   * @param {string} applicationId - The application ID
   * @returns {Promise<{application: object}>}
   */
  async getApplication(applicationId) {
    return apiClient.get(`/applications/${applicationId}`)
  },

  /**
   * Get all applications for a specific listing (owner only)
   * @param {string} listingId - The listing ID
   * @param {string} status - Optional status filter
   * @returns {Promise<{applications: Array, counts: object, total: number}>}
   */
  async getListingApplications(listingId, status = null) {
    const url = status
      ? `/applications/listing/${listingId}?status=${status}`
      : `/applications/listing/${listingId}`

    return apiClient.get(url)
  },

  /**
   * Update application status
   * @param {string} applicationId - The application ID
   * @param {string} status - New status (pending, approved, rejected, cancelled)
   * @param {string} message - Optional status message
   * @returns {Promise<{message: string, application: object}>}
   */
  async updateStatus(applicationId, status, message = null) {
    return apiClient.put(`/applications/${applicationId}/status`, {
      status,
      message,
    })
  },

  /**
   * Approve an application (owner only)
   * @param {string} applicationId - The application ID
   * @param {string} message - Optional message to applicant
   * @returns {Promise<{message: string, application: object}>}
   */
  async approve(applicationId, message = null) {
    return this.updateStatus(applicationId, 'approved', message)
  },

  /**
   * Reject an application (owner only)
   * @param {string} applicationId - The application ID
   * @param {string} reason - Rejection reason/message
   * @returns {Promise<{message: string, application: object}>}
   */
  async reject(applicationId, reason = null) {
    return this.updateStatus(applicationId, 'rejected', reason)
  },

  /**
   * Withdraw an application (applicant only)
   * @param {string} applicationId - The application ID
   * @returns {Promise<{message: string}>}
   */
  async withdraw(applicationId) {
    return apiClient.delete(`/applications/${applicationId}`)
  },

  /**
   * Get application statistics for the current user
   * @returns {Promise<{stats: object}>}
   */
  async getStats() {
    return apiClient.get('/applications/user/stats')
  },
}

export default applicationsService
