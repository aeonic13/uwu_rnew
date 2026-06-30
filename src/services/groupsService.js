import { apiClient } from './api'

/**
 * Group chat service. Backed by server/routes/groups.js message endpoints.
 */
export const groupsService = {
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
