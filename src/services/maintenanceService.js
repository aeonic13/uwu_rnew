import { apiClient } from './api'

/**
 * Maintenance ticket service. Backed by server/routes/maintenance.js.
 */
export const maintenanceService = {
  /** List tickets (tenant: own; owner: across their listings). */
  async list() {
    const res = await apiClient.get('/maintenance')
    return res.tickets || []
  },

  /** Tenant files a ticket. */
  async create(data) {
    const res = await apiClient.post('/maintenance', data)
    return res.ticket
  },

  /** Owner updates a ticket's status/assignment. */
  async updateStatus(id, status, assignedTo) {
    const res = await apiClient.put(`/maintenance/${id}/status`, {
      status,
      assignedTo,
    })
    return res.ticket
  },
}

export default maintenanceService
