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

  /** One ticket with its thread, expense and parties. Tenant or owner. */
  async get(id) {
    const res = await apiClient.get(`/maintenance/${id}`)
    return res.ticket
  },

  /** Tenant files a ticket. */
  async create(data) {
    const res = await apiClient.post('/maintenance', data)
    return res.ticket
  },

  /**
   * Owner updates a ticket. Accepts either the new object form
   * `updateStatus(id, { status, assignedTo, vendorPhone, cost })` or the
   * older positional form `updateStatus(id, status, assignedTo)`.
   */
  async updateStatus(id, statusOrFields, assignedTo) {
    const body =
      statusOrFields && typeof statusOrFields === 'object'
        ? statusOrFields
        : { status: statusOrFields, assignedTo }
    const res = await apiClient.put(`/maintenance/${id}/status`, body)
    return res.ticket
  },

  /** Either party adds to the ticket's thread. */
  async addComment(id, { body, photos = [] }) {
    const res = await apiClient.post(`/maintenance/${id}/comments`, {
      body,
      photos,
    })
    return res.comment
  },

  /**
   * Upload photos to attach to a comment. Returns the hosted URLs.
   * @param {string} id ticket id
   * @param {File[]} files
   * @returns {Promise<string[]>}
   */
  async uploadPhotos(id, files) {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('images', file))
    const res = await apiClient.post(`/maintenance/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.images || []).map(i => i.url)
  },

  /** Owner books a costed repair as a repairs expense on the property. */
  async bookExpense(id) {
    const res = await apiClient.post(`/maintenance/${id}/expense`)
    return res
  },
}

export default maintenanceService
