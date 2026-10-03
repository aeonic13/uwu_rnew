import { apiClient } from './api'

/**
 * Lease agreement service. Backed by server/routes/agreements.js.
 */
export const agreementsService = {
  /** Fetch one agreement (tenant or landlord on the application). */
  async getAgreement(id) {
    const res = await apiClient.get(`/agreements/${id}`)
    return res.agreement
  },

  /** List the authenticated user's agreements. */
  async listAgreements() {
    const res = await apiClient.get('/agreements')
    return res.agreements || []
  },

  /**
   * Record the viewer's signature; returns the updated agreement.
   * `signatureName` is the typed legal name and `esignConsent` the explicit
   * E-SIGN/UETA consent, both stored with the signature on the server.
   */
  async sign(id, { signatureName, esignConsent } = {}) {
    const res = await apiClient.post(`/agreements/${id}/sign`, {
      signatureName,
      esignConsent,
    })
    return res.agreement
  },

  /**
   * Download the lease and save it via the browser. For an imported lease
   * with the signed copy uploaded, the server sends that file; pass
   * `{ summary: true }` to get Rentra's generated summary of the recorded
   * terms and confirmations instead.
   */
  async downloadPdf(id, { summary = false } = {}) {
    const blob = await apiClient.get(`/agreements/${id}/pdf`, {
      responseType: 'blob',
      params: summary ? { summary: '1' } : undefined,
    })
    const ext = blobExtension(blob?.type)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = summary
      ? `rentra-lease-summary-${id}.pdf`
      : `rentra-lease-${id}.${ext}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

const EXT_BY_TYPE = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function blobExtension(type) {
  const key = String(type || '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  return EXT_BY_TYPE[key] || 'pdf'
}

export default agreementsService
