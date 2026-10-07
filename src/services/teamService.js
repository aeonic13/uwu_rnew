import { apiClient } from './api'

/**
 * Team access: co-owners and property managers on a landlord's portfolio.
 * Backed by server/routes/team.js.
 */
export const teamService = {
  /** The caller's portfolio (owner, role) plus members and open invites. */
  async get() {
    return apiClient.get('/team')
  },

  async invite({ email, role }) {
    const res = await apiClient.post('/team/invite', { email, role })
    return res.member
  },

  async remove(id) {
    return apiClient.delete(`/team/${id}`)
  },

  async leave() {
    return apiClient.post('/team/leave')
  },

  /**
   * Every portfolio the caller can work (own + active memberships) as
   * `[{ ownerId, ownerName, role, isOwn, active }]`.
   */
  async portfolios() {
    const res = await apiClient.get('/team/portfolios')
    return res.portfolios
  },

  /** Make `ownerId` the working portfolio; returns the updated list. */
  async setActive(ownerId) {
    const res = await apiClient.put('/team/active', { ownerId })
    return res.portfolios
  },

  /** Public: who is inviting, for the accept page. */
  async getInvitation(token) {
    const res = await apiClient.get(`/team/invitation/${token}`)
    return res.invitation
  },

  async accept(token) {
    return apiClient.post(`/team/accept/${token}`)
  },
}

export default teamService
