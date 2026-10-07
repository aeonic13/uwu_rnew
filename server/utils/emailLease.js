import { sendEmail } from './email.js'

/**
 * Lease lifecycle emails: a tenant giving notice, a statutory
 * rent-increase notice, and a tenant being removed from a household by
 * amendment. Every one also lands in the in-app bell through `notify`.
 */

const fmtDate = d =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const money = n => `$${Math.round(Number(n) || 0).toLocaleString()}`

const wrap = body => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      ${body}
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>`

const button = (url, label) =>
  `<p style="margin-top: 24px;"><a href="${url}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">${label}</a></p>`

export const TENANT_NOTICE_REASON_LABEL = {
  moving: 'Moving away',
  end_of_term: 'Leaving at the end of the term',
  buying: 'Bought a home',
  cost: 'Cost',
  other: 'Other',
}

/** Landlord: a tenant gave notice to vacate. */
export async function sendTenantNoticeEmail({
  owner,
  tenant,
  listingTitle,
  listingId,
  moveOutDate,
  reason,
  message,
  early,
}) {
  if (!owner?.email) return null
  const link = listingId
    ? `/dashboard/properties/${listingId}/tenants`
    : '/dashboard'
  const url = `${process.env.CLIENT_URL}${link}`
  const name = `${tenant.firstName} ${tenant.lastName}`.trim()
  const when = fmtDate(moveOutDate)
  const why = TENANT_NOTICE_REASON_LABEL[reason] || 'Other'
  return sendEmail({
    to: owner.email,
    notify: { type: 'lease', link },
    subject: `${name} gave notice to move out of ${listingTitle} on ${when}`,
    html: wrap(`
      <h2 style="color: #fc6a03;">Notice to vacate</h2>
      <p>Hi ${owner.firstName},</p>
      <p><strong>${name}</strong> gave notice to move out of <strong>${listingTitle}</strong> on <strong>${when}</strong>${
        early ? ' (before the lease term ends)' : ''
      }.</p>
      <p>Reason: ${why}${message ? ` — “${message}”` : ''}</p>
      <p>The lease keeps running until you confirm the move-out from the Tenants tab. Confirming starts the deposit return clock and lets you relist the unit.</p>
      ${button(url, 'Review and confirm')}`),
    text: `${name} gave notice to move out of ${listingTitle} on ${when}. Reason: ${why}${message ? ` — ${message}` : ''}. Confirm the move-out: ${url}`,
  })
}

/** Tenant: a rent increase with the notice period it honors. */
export async function sendRentIncreaseNoticeEmail({
  tenant,
  landlordName,
  listingTitle,
  agreementId,
  oldRent,
  newRent,
  effectiveDate,
  noticeDays,
}) {
  if (!tenant?.email) return null
  const link = `/agreement/${agreementId}`
  const url = `${process.env.CLIENT_URL}${link}`
  const when = fmtDate(effectiveDate)
  return sendEmail({
    to: tenant.email,
    notify: { type: 'lease', link },
    subject: `Notice of rent increase for ${listingTitle}, effective ${when}`,
    html: wrap(`
      <h2 style="color: #fc6a03;">Notice of rent increase</h2>
      <p>Hi ${tenant.firstName},</p>
      <p>${landlordName} is changing the rent for <strong>${listingTitle}</strong> from <strong>${money(
        oldRent
      )}</strong> to <strong>${money(newRent)}</strong> per month, effective <strong>${when}</strong>.</p>
      <p>This notice is being given at least ${noticeDays} days before the change takes effect, as required for a rent increase of this size.</p>
      <p>The change is written up as a lease amendment for you to review and sign. Your current lease stands until everyone has signed.</p>
      ${button(url, 'Review the amendment')}`),
    text: `${landlordName} is changing the rent for ${listingTitle} from ${money(oldRent)} to ${money(newRent)} per month, effective ${when} (${noticeDays} days' notice). Review the amendment: ${url}`,
  })
}

/** Tenant: they are coming off the lease on the amendment's effective date. */
export async function sendTenantRemovedFromLeaseEmail({
  tenant,
  landlordName,
  listingTitle,
  effectiveDate,
  note,
}) {
  if (!tenant?.email) return null
  const link = '/profile/tenant-dashboard'
  const url = `${process.env.CLIENT_URL}${link}`
  const when = fmtDate(effectiveDate)
  return sendEmail({
    to: tenant.email,
    notify: { type: 'lease', link },
    subject: `Your lease at ${listingTitle} ends ${when}`,
    html: wrap(`
      <h2 style="color: #fc6a03;">You are coming off the lease</h2>
      <p>Hi ${tenant.firstName},</p>
      <p>${landlordName} drafted a lease amendment for <strong>${listingTitle}</strong> that takes you off the lease as of <strong>${when}</strong>. Once the remaining household and the landlord sign it, your obligations under the current lease end on that date.</p>
      ${note ? `<p>Note from your landlord: “${note}”</p>` : ''}
      <p>Rent you owe through ${when} is still due. Your share of the security deposit is handled with your landlord directly.</p>
      ${button(url, 'Open your tenant dashboard')}`),
    text: `${landlordName} drafted a lease amendment for ${listingTitle} that takes you off the lease as of ${when}.${note ? ` Note: ${note}` : ''} ${url}`,
  })
}
