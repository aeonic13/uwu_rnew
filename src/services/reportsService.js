import { apiClient } from './api'

/**
 * Portfolio reports (landlord). Backed by server/routes/reports.js.
 */
export const reportsService = {
  /**
   * The year's report: months, totals, expenses by category and the
   * per-property breakdown. Defaults to the current year on the server.
   */
  async getSummary(year) {
    return apiClient.get('/reports/summary', {
      params: year ? { year } : undefined,
    })
  },

  /** Download the year's report as CSV and save it via the browser. */
  async downloadCsv(year) {
    const blob = await apiClient.get('/reports/summary.csv', {
      params: year ? { year } : undefined,
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rentra-report-${year || new Date().getFullYear()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

export default reportsService
