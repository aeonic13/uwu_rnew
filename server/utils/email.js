import sgMail from '@sendgrid/mail'

// Providers, in order of preference. Resend has a permanently free tier
// (3,000/mo, 100/day) and is hit via plain HTTP — no SDK dependency.
// SendGrid remains as a fallback for anyone still carrying that key
// (its free tier was retired in 2025, so Resend is the default path).
const RESEND_API_KEY = process.env.RESEND_API_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@rentra.com'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Rentra'

if (RESEND_API_KEY) {
  console.log('📧 Email provider: Resend')
} else if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
  console.log('📧 Email provider: SendGrid')
} else {
  console.warn(
    '⚠️  No email API key configured (RESEND_API_KEY or SENDGRID_API_KEY). Email sending will no-op.'
  )
}

/** Send via Resend's HTTP API (https://resend.com/docs/api-reference). */
async function sendViaResend({ to, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`)
  }
}

/** Send via SendGrid (legacy fallback). */
async function sendViaSendGrid({ to, subject, html, text }) {
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text,
    html,
  })
}

/**
 * Send an email through whichever provider is configured. All templates in
 * this file route through here, so swapping providers is an env-var change.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
    console.log(
      `📧 [EMAIL NOT SENT - No API Key] To: ${to}, Subject: ${subject}`
    )
    return { success: false, error: 'No email provider configured' }
  }

  const payload = {
    to,
    subject,
    html,
    // Strip HTML for the text version when one isn't provided.
    text: text || html.replace(/<[^>]*>/g, ''),
  }

  try {
    if (RESEND_API_KEY) {
      await sendViaResend(payload)
    } else {
      await sendViaSendGrid(payload)
    }
    console.log(`✅ Email sent to ${to}: ${subject}`)
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error.response?.body || error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(user, verificationToken) {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to Rentra! 🏠</h2>
        <p>Hi ${user.firstName},</p>
        <p>Thanks for signing up! Please verify your email address to get started.</p>
        <a href="${verificationUrl}" class="button">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: user.email,
    subject: 'Verify your Rentra account',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .warning { background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password 🔑</h2>
        <p>Hi ${user.firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: user.email,
    subject: 'Reset your Rentra password',
    html,
  })
}

/**
 * Send application notification to property owner
 */
export async function sendApplicationNotification(owner, applicant, listing) {
  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard/applications`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .info-box { background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>New Rental Application 📋</h2>
        <p>Hi ${owner.firstName},</p>
        <p>You have a new application for your property!</p>
        <div class="info-box">
          <strong>Property:</strong> ${listing.title}<br>
          <strong>Applicant:</strong> ${applicant.firstName} ${applicant.lastName}<br>
          <strong>Email:</strong> ${applicant.email}<br>
          ${applicant.university ? `<strong>University:</strong> ${applicant.university}<br>` : ''}
        </div>
        <a href="${dashboardUrl}" class="button">Review Application</a>
        <p>Log in to your dashboard to review the full application and communicate with the applicant.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: owner.email,
    subject: `New application for ${listing.title}`,
    html,
  })
}

/**
 * Send application status update to applicant
 */
export async function sendApplicationStatusEmail(
  applicant,
  listing,
  status,
  owner
) {
  const isApproved = status === 'approved'
  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: ${isApproved ? '#16a34a' : '#2563eb'}; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .status-box { 
          background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; 
          padding: 15px; 
          border-radius: 6px; 
          margin: 20px 0;
          border-left: 4px solid ${isApproved ? '#16a34a' : '#ef4444'};
        }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Application Update ${isApproved ? '✅' : '📋'}</h2>
        <p>Hi ${applicant.firstName},</p>
        <div class="status-box">
          <strong>Your application for ${listing.title} has been ${status}.</strong>
        </div>
        ${
          isApproved
            ? `
          <p>Congratulations! The property owner has approved your application.</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Review and sign the lease agreement</li>
            <li>Complete the security deposit payment</li>
            <li>Schedule your move-in date</li>
          </ul>
          <a href="${dashboardUrl}" class="button">View Next Steps</a>
        `
            : `
          <p>Unfortunately, the property owner has decided to move forward with another applicant at this time.</p>
          <p>Don't worry - there are many great properties available on Rentra!</p>
          <a href="${process.env.CLIENT_URL}/browse" class="button">Browse More Properties</a>
        `
        }
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: applicant.email,
    subject: `Application ${status}: ${listing.title}`,
    html,
  })
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  recipient,
  sender,
  messagePreview
) {
  const messagesUrl = `${process.env.CLIENT_URL}/messages`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .message-box { background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>New Message 💬</h2>
        <p>Hi ${recipient.firstName},</p>
        <p>You have a new message from ${sender.firstName} ${sender.lastName}:</p>
        <div class="message-box">
          ${messagePreview}
        </div>
        <a href="${messagesUrl}" class="button">View Message</a>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: recipient.email,
    subject: `New message from ${sender.firstName} ${sender.lastName}`,
    html,
  })
}

/**
 * Send cosigner invitation email
 */
export async function sendCosignerInvitation({
  cosignerEmail,
  cosignerName,
  tenantName,
  listingTitle,
  listingLocation,
  monthlyRent,
  inviteUrl,
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .info-box { background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .highlight { background-color: #fef3c7; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Cosigner Invitation for Rental Application 🏠</h2>
        <p>Hi ${cosignerName},</p>
        <p><strong>${tenantName}</strong> has invited you to be a cosigner for their rental application${listingTitle ? '' : 's on Rentra'}.</p>
        
        ${
          listingTitle
            ? `<div class="info-box">
          <strong>Property:</strong> ${listingTitle}<br>
          <strong>Location:</strong> ${listingLocation || 'See listing'}<br>
          <strong>Monthly Rent:</strong> ${
            typeof monthlyRent === 'number'
              ? `$${monthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'See listing'
          }
        </div>`
            : `<div class="info-box">
          ${tenantName} is pre-qualifying for housing on Rentra. Accepting once backs every application they submit, and each landlord will see your verified income alongside theirs.
        </div>`
        }

        <div class="highlight">
          <strong>What is a cosigner?</strong><br>
          As a cosigner, you agree to be financially responsible for the rent if the tenant is unable to pay. This helps tenants with limited credit history or income qualify for rental properties.
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Review the ${listingTitle ? 'property' : 'invitation'} details</li>
          <li>Create your cosigner account</li>
          <li>Verify your income securely through Plaid (takes about a minute)</li>
        </ul>

        <a href="${inviteUrl}" class="button">Review Invitation</a>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${inviteUrl}</p>
        
        <p style="color: #ef4444;"><strong>Important:</strong> This invitation expires in 7 days.</p>

        <div class="footer">
          <p>If you don't know ${tenantName} or didn't expect this invitation, you can safely ignore this email.</p>
          <p>© ${new Date().getFullYear()} Rentra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: cosignerEmail,
    subject: `${tenantName} invited you to cosign their rental application`,
    html,
  })
}

/**
 * Rent reminder, sent by the landlord from the Rent Collection screen.
 */
export async function sendRentReminderEmail({
  tenant,
  landlordName,
  listingTitle,
  amount,
  balance,
}) {
  const payUrl = `${process.env.CLIENT_URL}/dashboard`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">Rent reminder 🏠</h2>
      <p>Hi ${tenant.firstName},</p>
      <p>${landlordName} sent you a friendly reminder that rent is due for <strong>${listingTitle}</strong>.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>Monthly rent:</strong> $${amount.toLocaleString()}<br>
        ${balance > 0 ? `<strong>Outstanding balance:</strong> $${balance.toLocaleString()}` : ''}
      </div>
      <p style="margin-top: 24px;"><a href="${payUrl}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Record your payment</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: tenant.email,
    subject: `Rent reminder for ${listingTitle}`,
    html,
    text: `Hi ${tenant.firstName}, ${landlordName} sent a reminder that rent ($${amount}) is due for ${listingTitle}. ${payUrl}`,
  })
}

/**
 * Invite someone to join a housing group. The recipient may not have a
 * Rentra account yet — the groups page prompts sign-in/registration, and
 * the invitation is matched by email on join.
 */
export async function sendGroupInviteEmail({ email, inviterName, group }) {
  const groupsUrl = `${process.env.CLIENT_URL}/groups`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">You're invited to a housing group 🏠</h2>
      <p>Hi,</p>
      <p><strong>${inviterName}</strong> invited you to join their group on Rentra so you can search for housing and apply together.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>${group.name}</strong><br>
        ${group.description ? `${group.description}<br>` : ''}
        Up to ${group.maxMembers} members
      </div>
      <p style="margin-top: 24px;"><a href="${groupsUrl}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View invitation</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">Sign in with this email address (${email}) to accept or decline.</p>
      <p style="color: #888; font-size: 13px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join "${group.name}" on Rentra`,
    html,
    text: `${inviterName} invited you to join their housing group "${group.name}" on Rentra. Sign in with this email at ${groupsUrl} to accept.`,
  })
}

/**
 * Alert a tenant that a newly posted listing matches their saved search.
 */
export async function sendNewListingAlert(recipient, listing) {
  const listingUrl = `${process.env.CLIENT_URL}/listings/${listing.id}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">New rental matches your search 🏠</h2>
      <p>Hi ${recipient.firstName},</p>
      <p>A new listing just went up that matches a search you saved:</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>${listing.title}</strong><br>
        ${listing.location}<br>
        <strong>$${listing.price.toLocaleString()}/mo</strong> · ${listing.bedrooms} bed · ${listing.propertyType}
      </div>
      <p style="margin-top: 24px;"><a href="${listingUrl}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View listing</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">You get these because you saved a search on Rentra. Delete the saved search from your Saved page to stop.</p>
      <p style="color: #888; font-size: 13px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: recipient.email,
    subject: `New rental in ${listing.location}: ${listing.title}`,
    html,
    text: `Hi ${recipient.firstName}, a new listing matches your saved search: ${listing.title} — ${listing.location} — $${listing.price}/mo. ${listingUrl}`,
  })
}

/**
 * Alert a user that a compatible new housemate joined. Only sent when the
 * pair passes mutual discovery preferences and scores well, so this stays a
 * "good news" email rather than churny noise.
 */
export async function sendNewHousemateAlert(recipient, profile, score) {
  const hubUrl = `${process.env.CLIENT_URL}/housemates`
  const name = profile.user?.firstName || 'A new housemate'
  const where = profile.location ? ` in ${profile.location}` : ''
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">A new housemate matches you 🏡</h2>
      <p>Hi ${recipient.firstName},</p>
      <p><strong>${name}</strong>${where} just joined Housemates and you two look like a strong fit:</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>${score}% Compatibility Score</strong><br>
        ${profile.occupation ? `${profile.occupation}<br>` : ''}
        ${
          profile.budgetMin && profile.budgetMax
            ? `Budget $${profile.budgetMin.toLocaleString()}–$${profile.budgetMax.toLocaleString()}/mo`
            : ''
        }
      </div>
      <p style="margin-top: 24px;"><a href="${hubUrl}" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">See your match</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">You get these because your housemate profile is active. Pause it from the Housemates tab to stop.</p>
      <p style="color: #888; font-size: 13px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: recipient.email,
    subject: `New housemate match${where}: ${name} (${score}% fit)`,
    html,
    text: `Hi ${recipient.firstName}, ${name}${where} just joined Rentra Housemates and matches you at ${score}%. ${hubUrl}`,
  })
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApplicationNotification,
  sendApplicationStatusEmail,
  sendMessageNotification,
  sendCosignerInvitation,
  sendRentReminderEmail,
  sendNewListingAlert,
  sendNewHousemateAlert,
}

/**
 * Notify a tenant that their invited cosigner declined.
 */
export async function sendCosignerDeclinedEmail(tenant, cosignerEmail) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">Co-signer update</h2>
      <p>Hi ${tenant.firstName},</p>
      <p>Unfortunately <strong>${cosignerEmail}</strong> declined your co-signer invitation.</p>
      <p>You can invite a different co-signer any time from your pre-qualification page — their verified income will attach to every application you submit.</p>
      <p style="margin-top: 24px;"><a href="${process.env.CLIENT_URL}/pre-qualify" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Invite another co-signer</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: tenant.email,
    subject: 'Your co-signer invitation was declined',
    html,
    text: `Hi ${tenant.firstName}, ${cosignerEmail} declined your co-signer invitation. You can invite a different co-signer from ${process.env.CLIENT_URL}/pre-qualify`,
  })
}

/**
 * Tell the tenant their co-signer accepted. Sent from the accept route so
 * they don't have to keep checking pre-qualification.
 */
export async function sendCosignerAcceptedEmail(
  tenant,
  cosigner,
  listingTitle
) {
  const name =
    `${cosigner.firstName} ${cosigner.lastName}`.trim() || cosigner.email
  const scope = listingTitle
    ? `your application for <strong>${listingTitle}</strong>`
    : 'every application you submit'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #fc6a03;">Your co-signer accepted</h2>
      <p>Hi ${tenant.firstName},</p>
      <p><strong>${name}</strong> accepted your co-signer invitation and now backs ${scope}.</p>
      <p>Landlords will see their name on your application right away. Once they finish income verification, their verified income counts toward your qualification too.</p>
      <p style="margin-top: 24px;"><a href="${process.env.CLIENT_URL}/pre-qualify" style="background: #fc6a03; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View pre-qualification</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">— The Rentra Team</p>
    </div>
  `
  return sendEmail({
    to: tenant.email,
    subject: `${name} accepted your co-signer invitation`,
    html,
    text: `Hi ${tenant.firstName}, ${name} accepted your co-signer invitation and now backs ${listingTitle ? `your application for ${listingTitle}` : 'every application you submit'}. ${process.env.CLIENT_URL}/pre-qualify`,
  })
}
