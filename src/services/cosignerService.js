import { apiClient } from './api'

/**
 * Cosigner / guarantor service.
 * Backed by server/routes/cosigners.js.
 */
export const cosignerService = {
  /**
   * Public: fetch invitation details by token (for the accept page).
   * @param {string} token
   * @returns {Promise<object>} invitation
   */
  async getInvitation(token) {
    const res = await apiClient.get(`/cosigners/invitation/${token}`)
    return res.invitation
  },

  /**
   * Public: accept an invitation. Creates/links the cosigner account and
   * returns an auth session.
   * @param {string} token
   * @param {{email:string,password:string,firstName:string,lastName:string,phone?:string}} payload
   */
  async accept(token, payload) {
    return apiClient.post(`/cosigners/accept/${token}`, payload)
  },

  /**
   * Public: decline an invitation.
   * @param {string} token
   */
  async decline(token) {
    return apiClient.post(`/cosigners/decline/${token}`)
  },

  /**
   * Tenant: invite a cosigner to one of their applications.
   * @param {{applicationId:string,cosignerEmail:string,cosignerName?:string,relationshipType:string}} payload
   */
  async invite(payload) {
    return apiClient.post('/cosigners/invite', payload)
  },

  /**
   * Tenant or owner: list cosigners for an application.
   * @param {string} applicationId
   */
  async getForApplication(applicationId) {
    const res = await apiClient.get(`/cosigners/application/${applicationId}`)
    return res.cosigners || []
  },

  /**
   * Cosigner: applications they are responsible for.
   */
  async myResponsibilities() {
    const res = await apiClient.get('/cosigners/my-responsibilities')
    return res.responsibilities || res.cosigners || []
  },
}

export default cosignerService
