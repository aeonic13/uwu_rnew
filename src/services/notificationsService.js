import { apiClient } from './api'

/**
 * In-app notifications (the bell in the header).
 * Backed by server/routes/notifications.js.
 */
export const notificationsService = {
  /** Latest notifications plus the unread count. */
  async list(limit = 30) {
    return apiClient.get('/notifications', { params: { limit } })
  },

  async markRead(id) {
    return apiClient.post(`/notifications/${id}/read`)
  },

  async markAllRead() {
    return apiClient.post('/notifications/read-all')
  },
}

export default notificationsService
