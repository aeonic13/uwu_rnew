import { apiClient } from './api'

/**
 * Move-in / move-out inspection reports. Backed by
 * server/routes/inspections.js. Writes are owner-only; `get` also works for a
 * tenant who signs the report's lease.
 */
export const inspectionsService = {
  /** Owner's reports, newest first, optionally for one property. */
  async list(listingId) {
    const params = {}
    if (listingId) params.listingId = listingId
    const res = await apiClient.get('/inspections', { params })
    return res.inspections || []
  },

  async get(id) {
    const res = await apiClient.get(`/inspections/${id}`)
    return res.inspection
  },

  /** Start a draft with the default checklist. type: move_in | move_out */
  async create({ listingId, type, agreementId }) {
    const res = await apiClient.post('/inspections', {
      listingId,
      type,
      agreementId: agreementId || undefined,
    })
    return res.inspection
  },

  /** Save a draft ({ items, notes, conductedAt }) or complete it (status). */
  async update(id, data) {
    const res = await apiClient.put(`/inspections/${id}`, data)
    return res.inspection
  },

  /** Upload photos for an item; returns the URLs to attach. */
  async uploadPhotos(id, files) {
    const form = new FormData()
    Array.from(files).forEach(file => form.append('images', file))
    const res = await apiClient.post(`/inspections/${id}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.images || []).map(i => i.url)
  },

  /** Push a completed move-out report's flagged items onto the deposit. */
  async sendToDeposit(id) {
    return apiClient.post(`/inspections/${id}/deductions`)
  },

  async remove(id) {
    return apiClient.delete(`/inspections/${id}`)
  },
}

export default inspectionsService
