import { apiClient } from './api'

/**
 * Expense / bookkeeping service. Backed by server/routes/expenses.js
 * (owner-only). Categories mirror IRS Schedule E lines.
 */
export const expensesService = {
  /** List expenses, optionally filtered by year and/or listing. */
  async list({ year, listingId } = {}) {
    const params = {}
    if (year) params.year = year
    if (listingId) params.listingId = listingId
    return apiClient.get('/expenses', { params })
  },

  async create(data) {
    const res = await apiClient.post('/expenses', data)
    return res.expense
  },

  async update(id, data) {
    const res = await apiClient.put(`/expenses/${id}`, data)
    return res.expense
  },

  async remove(id) {
    return apiClient.delete(`/expenses/${id}`)
  },

  /** Tax Center data: income + expenses by category/month/property. */
  async taxSummary(year) {
    return apiClient.get('/expenses/tax-summary', { params: { year } })
  },
}

export default expensesService
