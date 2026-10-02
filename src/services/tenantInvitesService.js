import { apiClient } from './api'

/**
 * Invitations to the current tenants of an occupied property. Backed by
 * server/routes/tenantInvites.js. Landlords create them through
 * propertiesService.onboard(); this service manages and accepts them.
 */
export const tenantInvitesService = {
  /**
   * Public: the invitation behind an email link (for the accept page).
   * @param {string} token
   * @returns {Promise<object>} invitation preview
   */
  async getInvitation(token) {
    const res = await apiClient.get(`/tenant-invites/invitation/${token}`)
    return res.invitation
  },

  /**
   * Public: accept the invitation and confirm the lease terms. Creates or
   * links the tenant account and returns an auth session.
   * @param {string} token
   * @param {{confirm:boolean,signatureName:string,password?:string,firstName?:string,lastName?:string,phone?:string,acceptedTerms?:boolean}} payload
   */
  async accept(token, payload) {
    return apiClient.post(`/tenant-invites/accept/${token}`, payload)
  },

  /** Public: decline the invitation. */
  async decline(token) {
    return apiClient.post(`/tenant-invites/decline/${token}`)
  },

  /** Owner: re-send with a fresh 14-day link. */
  async resend(id) {
    return apiClient.post(`/tenant-invites/${id}/resend`)
  },

  /** Owner: fix a name, email or phone before acceptance. */
  async update(id, patch) {
    return apiClient.patch(`/tenant-invites/${id}`, patch)
  },

  /** Owner: cancel an unaccepted invite and remove that member. */
  async cancel(id) {
    return apiClient.delete(`/tenant-invites/${id}`)
  },
}

export default tenantInvitesService
