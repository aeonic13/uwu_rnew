import { sendEmail } from './email.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * One party commented on a maintenance ticket; tell the other party.
 * `recipient` is `{ email, firstName, userType }`: owners are linked to the
 * property's maintenance tab, tenants to their dashboard.
 */
export async function sendMaintenanceCommentEmail({
  recipient,
  authorName,
  listing,
  ticket,
  comment,
}) {
  if (!recipient?.email) return null
  const base = process.env.CLIENT_URL
  const url =
    recipient.userType === 'owner'
      ? `${base}/dashboard/properties/${listing.id}/maintenance`
      : `${base}/profile/tenant-dashboard`
  const body = escapeHtml(comment.body).replace(/\n/g, '<br>')
  const photoNote =
    comment.photos?.length > 0
      ? `<p style="color: #666; font-size: 13px;">${comment.photos.length} photo${
          comment.photos.length === 1 ? '' : 's'
        } attached — open the ticket to view.</p>`
      : ''
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">New message on a maintenance request 🔧</h2>
      <p>Hi ${escapeHtml(recipient.firstName)},</p>
      <p><strong>${escapeHtml(authorName)}</strong> replied on the <strong>${escapeHtml(
        ticket.category
      )}</strong> request at <strong>${escapeHtml(listing.title)}</strong>.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #555;">
        ${body}
      </div>
      ${photoNote}
      <p style="margin-top: 24px;"><a href="${url}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Open the request</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: recipient.email,
    notify: { type: 'maintenance', link: url },
    subject: `${authorName} replied on the ${ticket.category} request at ${listing.title}`,
    html,
    text: `Hi ${recipient.firstName}, ${authorName} replied on the ${ticket.category} request at ${listing.title}: "${comment.body}". ${url}`,
  })
}

export default { sendMaintenanceCommentEmail }
