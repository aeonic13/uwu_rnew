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
   * Cosigner (authenticated): persist their Plaid-verified monthly income.
   * @param {number} monthlyIncome
   */
  async verifyIncome(monthlyIncome) {
    return apiClient.post('/cosigners/verify-income', { monthlyIncome })
  },

  /**
   * Tenant: invite a cosigner. With applicationId it binds to that
   * application; without, it's a floating pre-qualification invite that
   * auto-attaches to every application they submit.
   * @param {{applicationId?:string,cosignerEmail:string,cosignerName?:string,relationshipType:string}} payload
   */
  async invite(payload) {
    return apiClient.post('/cosigners/invite', payload)
  },

  /**
   * Tenant: re-send a pending invitation with a fresh 7-day link.
   * @param {string} cosignerId
   * @returns {Promise<{emailSent:boolean,cosigner:object}>}
   */
  async resend(cosignerId) {
    return apiClient.post(`/cosigners/resend/${cosignerId}`)
  },

  /** Tenant: their floating (pre-qualification) cosigner invites. */
  async mine() {
    const res = await apiClient.get('/cosigners/mine')
    return res.cosigners || []
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
