import { apiClient } from './api'

/**
 * Group chat service. Backed by server/routes/groups.js message endpoints.
 */
export const groupsService = {
  /** Create a group; returns the created group (UI shape). */
  async create({ name, description, maxMembers }) {
    const res = await apiClient.post('/groups', {
      name,
      description,
      maxMembers,
    })
    return res.group
  },

  /** Groups the current user belongs to. */
  async listMy() {
    const res = await apiClient.get('/groups/my')
    return res.groups || []
  },

  /** Group detail (members only). */
  async getById(groupId) {
    const res = await apiClient.get(`/groups/${groupId}`)
    return res.group
  },

  /** Admin: invite a member by email. Returns the created member row. */
  async invite(groupId, email) {
    const res = await apiClient.post(`/groups/${groupId}/invite`, { email })
    return res.member
  },

  /** Pending invitations for the current user. */
  async listInvitations() {
    const res = await apiClient.get('/groups/invitations')
    return res.invitations || []
  },

  /** Accept an invitation; returns the joined group (UI shape). */
  async join(groupId) {
    const res = await apiClient.post(`/groups/${groupId}/join`)
    return res.group
  },

  /** Decline an invitation. */
  async decline(groupId) {
    return apiClient.post(`/groups/${groupId}/decline`)
  },

  /** Remove a member (admin) or leave the group (own member row). */
  async removeMember(groupId, memberId) {
    return apiClient.delete(`/groups/${groupId}/members/${memberId}`)
  },

  /** Creator: delete the group. */
  async deleteGroup(groupId) {
    return apiClient.delete(`/groups/${groupId}`)
  },

  /** Fetch a group's chat history. */
  async getMessages(groupId) {
    const res = await apiClient.get(`/groups/${groupId}/messages`)
    return res.messages || []
  },

  /**
   * Send a chat message; returns the created message. Pass
   * `{ type: 'listing', metadata: { listingData } }` to share a listing
   * card into the chat.
   */
  async sendMessage(groupId, content, { type, metadata } = {}) {
    const res = await apiClient.post(`/groups/${groupId}/messages`, {
      content,
      ...(type && { type }),
      ...(metadata && { metadata }),
    })
    return res.message
  },
}

export default groupsService
