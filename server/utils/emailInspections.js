import { sendEmail } from './email.js'
import { summarizeItems } from './inspections.js'

const TYPE_LABEL = { move_in: 'Move-in', move_out: 'Move-out' }

/**
 * Tell a tenant their landlord completed an inspection report. Sent once
 * per tenant signer when the report is marked complete; the link opens the
 * read-only report.
 */
export async function sendInspectionReportEmail({
  tenant,
  landlordName,
  listing,
  inspection,
}) {
  const label = TYPE_LABEL[inspection.type] || 'Inspection'
  const reportUrl = `${process.env.CLIENT_URL}/inspections/${inspection.id}`
  const { itemCount, damagedCount, estimatedTotal } = summarizeItems(
    inspection.items
  )
  const conducted = inspection.conductedAt
    ? new Date(inspection.conductedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">${label} inspection report 🏠</h2>
      <p>Hi ${tenant.firstName},</p>
      <p>${landlordName} completed the ${label.toLowerCase()} inspection for <strong>${listing.title}</strong>${
        conducted ? ` conducted on ${conducted}` : ''
      }.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>Items checked:</strong> ${itemCount}<br>
        <strong>Flagged as damaged:</strong> ${damagedCount}<br>
        ${
          estimatedTotal > 0
            ? `<strong>Estimated repair cost:</strong> $${estimatedTotal.toLocaleString()}`
            : ''
        }
      </div>
      <p>Open the report to see each room's condition, notes and photos. Keep a copy for your records${
        inspection.type === 'move_in'
          ? ' — it is the baseline for your move-out.'
          : '.'
      }</p>
      <p style="margin-top: 24px;"><a href="${reportUrl}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View the report</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: tenant.email,
    subject: `${label} inspection report for ${listing.title}`,
    html,
    text: `Hi ${tenant.firstName}, ${landlordName} completed the ${label.toLowerCase()} inspection for ${listing.title}: ${itemCount} items checked, ${damagedCount} flagged. View it at ${reportUrl}`,
  })
}
