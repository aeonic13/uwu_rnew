import api from './api'

export const applicationsService = {
  /**
   * Submit a new rental application
   * @param {Object} applicationData - Application details
   * @returns {Promise} Created application
   */
  submit: async (applicationData) => {
    const response = await api.post('/applications', applicationData)
    return response.data
  },

  /**
   * Get application by ID
   * @param {string} id - Application ID
   * @returns {Promise} Application details
   */
  getById: async (id) => {
    const response = await api.get(`/applications/${id}`)
    return response.data
  },

  /**
   * Update application status (owner only)
   * @param {string} id - Application ID
   * @param {string} status - New status (approved/rejected)
   * @returns {Promise} Updated application
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/applications/${id}/status`, { status })
    return response.data
  },

  /**
   * Get user's applications (as applicant)
   * @returns {Promise} List of applications
   */
  getUserApplications: async () => {
    const response = await api.get('/applications/user')
    return response.data
  },

  /**
   * Get applications for owner's properties
   * @returns {Promise} List of applications
   */
  getOwnerApplications: async () => {
    const response = await api.get('/applications/owner')
    return response.data
  },

  /**
   * Cancel application
   * @param {string} id - Application ID
   * @returns {Promise} Cancellation confirmation
   */
  cancel: async (id) => {
    const response = await api.delete(`/applications/${id}`)
    return response.data
  },
}

export default applicationsService
