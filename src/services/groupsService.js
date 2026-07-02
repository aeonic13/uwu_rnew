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

  /** Creator: delete the group. */
  async deleteGroup(groupId) {
    return apiClient.delete(`/groups/${groupId}`)
  },

  /** Fetch a group's chat history. */
  async getMessages(groupId) {
    const res = await apiClient.get(`/groups/${groupId}/messages`)
    return res.messages || []
  },

  /** Send a chat message; returns the created message. */
  async sendMessage(groupId, content) {
    const res = await apiClient.post(`/groups/${groupId}/messages`, { content })
    return res.message
  },
}

export default groupsService
