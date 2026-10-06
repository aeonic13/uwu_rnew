import { sendEmail } from './email.js'

/**
 * Invite someone to work a landlord's portfolio (co-owner or manager).
 * They need a landlord-type Rentra account on the invited email; the
 * accept page handles sign-up / sign-in first.
 */
export async function sendTeamInviteEmail({ email, inviterName, role, token }) {
  if (!email) return null
  const url = `${process.env.CLIENT_URL}/team-invite/${token}`
  const roleLabel = role === 'co_owner' ? 'co-owner' : 'property manager'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">You're invited to manage properties on Rentra</h2>
      <p>${inviterName} added you as a <strong>${roleLabel}</strong> on their Rentra portfolio.</p>
      <p>Once you accept you can list units, review applicants, track rent, maintenance, inspections and documents for every property they own. Leases are still signed by the owner.</p>
      <p style="margin-top: 24px;"><a href="${url}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Accept the invitation</a></p>
      <p style="color: #666; font-size: 13px;">The invitation expires in 14 days. If you do not have a landlord account yet, create one with this email address first.</p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: email,
    notify: { type: 'team', link: `/team-invite/${token}` },
    subject: `${inviterName} invited you to manage their properties on Rentra`,
    html,
    text: `${inviterName} added you as a ${roleLabel} on their Rentra portfolio. Accept: ${url}`,
  })
}

/** Owner: someone accepted the team invitation. */
export async function sendTeamMemberJoinedEmail({ owner, member, role }) {
  if (!owner?.email) return null
  const url = `${process.env.CLIENT_URL}/dashboard/team`
  const name = `${member.firstName} ${member.lastName}`.trim()
  const roleLabel = role === 'co_owner' ? 'co-owner' : 'property manager'
  return sendEmail({
    to: owner.email,
    notify: { type: 'team', link: '/dashboard/team' },
    subject: `${name} joined your Rentra team`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">${name} joined your team</h2>
      <p>Hi ${owner.firstName},</p>
      <p><strong>${name}</strong> (${member.email}) accepted your invitation and can now work your portfolio as a ${roleLabel}.</p>
      <p style="margin-top: 24px;"><a href="${url}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Manage your team</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>`,
    text: `${name} (${member.email}) accepted your invitation and can now work your portfolio as a ${roleLabel}. ${url}`,
  })
}
