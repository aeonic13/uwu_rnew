/**
 * Housekeeping for imported leases, run hourly next to the autopay runner:
 *
 *   1. Expire pending tenant invites whose link has lapsed, so the Tenants
 *      tab goes stale on its own instead of waiting for someone to open the
 *      dead link.
 *   2. Email a reminder once per link when a pending invite is within
 *      REMINDER_BEFORE_DAYS of expiring (day 7 of the 14-day window).
 *   3. Roll a month-to-month lease's stand-in endDate forward a year when it
 *      is about to pass, so the property never silently stops reading
 *      "Leased" and the tenant's Pay Rent screen keeps working.
 *
 * Dependencies are injectable so the loop is unit-testable without a
 * database or mail.
 */
import prisma from './prisma.js'
import { sendTenantInviteReminder } from './email.js'
import {
  REMINDER_BEFORE_MS,
  ROLL_FORWARD_WINDOW_MS,
  equalShares,
  inviteUrlFor,
  nextAnniversary,
} from './onboarding.js'

const HOUR_MS = 60 * 60 * 1000

const reminderInclude = {
  owner: { select: { firstName: true, lastName: true, email: true } },
  listing: {
    select: { id: true, title: true, location: true, streetAddress: true },
  },
  agreement: {
    select: {
      monthlyRent: true,
      securityDeposit: true,
      startDate: true,
      endDate: true,
      monthToMonth: true,
      rentSplit: {
        select: {
          shares: { select: { name: true, amount: true, userId: true } },
        },
      },
      signers: { select: { role: true } },
    },
  },
}

/** This invite's rent share: its named split share, else an equal cut. */
export function shareForReminder(invite) {
  const ag = invite.agreement || {}
  const householdSize = Math.max(
    1,
    (ag.signers || []).filter(s => s.role === 'tenant').length
  )
  const name = `${invite.firstName} ${invite.lastName}`
  const named = (ag.rentSplit?.shares || []).find(
    s => !s.userId && s.name === name
  )
  return {
    share: named
      ? Math.round(named.amount)
      : equalShares(ag.monthlyRent, householdSize)[0],
    householdSize,
  }
}

async function defaultRemind(invite) {
  const { share, householdSize } = shareForReminder(invite)
  return sendTenantInviteReminder({
    invite,
    landlordName: `${invite.owner.firstName} ${invite.owner.lastName}`.trim(),
    listing: invite.listing,
    lease: invite.agreement,
    share,
    householdSize,
    inviteUrl: inviteUrlFor(invite.token),
  })
}

/**
 * One pass. Returns counts so the caller (and tests) can see what happened.
 */
export async function runInviteMaintenance({
  now = new Date(),
  db = prisma,
  remind = defaultRemind,
} = {}) {
  const counts = { expired: 0, reminded: 0, rolled: 0 }

  // 1. Lapsed links.
  const expired = await db.tenantInvite.updateMany({
    where: { status: 'pending', expiresAt: { lt: now } },
    data: { status: 'expired' },
  })
  counts.expired = expired.count

  // 2. Reminders, once per link, inside the final week.
  const due = await db.tenantInvite.findMany({
    where: {
      status: 'pending',
      reminderSentAt: null,
      expiresAt: { gt: now, lte: new Date(now.getTime() + REMINDER_BEFORE_MS) },
    },
    include: reminderInclude,
  })
  for (const invite of due) {
    try {
      await remind(invite)
      await db.tenantInvite.update({
        where: { id: invite.id },
        data: { reminderSentAt: now },
      })
      counts.reminded += 1
    } catch (err) {
      console.error(`Tenant invite reminder ${invite.id} failed:`, err)
    }
  }

  // 3. Month-to-month leases: keep the stand-in end date ahead of today.
  const rolling = await db.agreement.findMany({
    where: {
      monthToMonth: true,
      // Once notice is given the endDate is the real move-out date.
      endedAt: null,
      endDate: { lte: new Date(now.getTime() + ROLL_FORWARD_WINDOW_MS) },
    },
    select: { id: true, startDate: true, endDate: true },
  })
  for (const lease of rolling) {
    try {
      const next = nextAnniversary(lease.startDate, lease.endDate)
      if (!next || next <= new Date(lease.endDate)) continue
      await db.agreement.update({
        where: { id: lease.id },
        data: { endDate: next },
      })
      counts.rolled += 1
    } catch (err) {
      console.error(`Month-to-month roll-forward ${lease.id} failed:`, err)
    }
  }

  return counts
}

/**
 * Start the hourly pass. Shares the AUTOPAY_RUNNER=false switch with the
 * autopay runner so one flag disables every background job locally.
 */
export function startTenantInviteRunner({ intervalMs = HOUR_MS } = {}) {
  if (process.env.AUTOPAY_RUNNER === 'false') return null
  const tick = () =>
    runInviteMaintenance().catch(err =>
      console.error('Tenant invite runner error:', err)
    )
  // First pass shortly after boot so a restart does not delay expiries.
  const first = setTimeout(tick, 45 * 1000)
  const timer = setInterval(tick, intervalMs)
  first.unref?.()
  timer.unref?.()
  return timer
}
