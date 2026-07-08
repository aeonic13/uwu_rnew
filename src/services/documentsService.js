import { apiClient } from './api'

/**
 * Landlord document storage. Backed by server/routes/documents.js
 * (owner-only); files live in Cloudinary.
 */
export const documentsService = {
  async list({ listingId, category } = {}) {
    const params = {}
    if (listingId) params.listingId = listingId
    if (category) params.category = category
    return apiClient.get('/documents', { params })
  },

  /** Upload a file (PDF, Word, or image) with optional name/category/listing. */
  async upload(file, { name, category, listingId } = {}) {
    const form = new FormData()
    form.append('file', file)
    if (name) form.append('name', name)
    if (category) form.append('category', category)
    if (listingId) form.append('listingId', listingId)
    const res = await apiClient.post('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.document
  },

  async remove(id) {
    return apiClient.delete(`/documents/${id}`)
  },
}

export default documentsService
