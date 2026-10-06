import prisma from './prisma.js'

/**
 * In-app notifications. Every transactional email that has an account
 * behind it also drops a row here (utils/email.js sendEmail → notify), so
 * the bell in the header mirrors the inbox without a second wiring pass.
 */

/** An absolute app URL becomes an in-app path; paths pass through. */
export function toAppPath(link) {
  if (!link) return null
  const base = (process.env.CLIENT_URL || '').replace(/\/$/, '')
  let path = String(link)
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (/^https?:\/\//i.test(path)) return null
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Shape a notification from an email's subject and plain text: the
 * subject is the title, the text (links stripped) is the body.
 */
export function notificationFromEmail({ subject, text, notify = {} }) {
  const body = String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
  return {
    type: notify.type || 'general',
    title: String(subject || '').slice(0, 140),
    body: body || null,
    link: toAppPath(notify.link),
  }
}

/**
 * Store a notification for the user with this email (or id). Never throws:
 * a notification is a convenience, the email is the record.
 */
export async function pushNotification({
  email,
  userId,
  type,
  title,
  body,
  link,
  db = prisma,
}) {
  try {
    let id = userId
    if (!id && email) {
      const user = await db.user.findUnique({
        where: { email: String(email).toLowerCase() },
        select: { id: true },
      })
      id = user?.id
    }
    if (!id || !title) return null
    return await db.notification.create({
      data: { userId: id, type: type || 'general', title, body, link },
    })
  } catch (error) {
    console.error('Notification write failed:', error?.message)
    return null
  }
}
