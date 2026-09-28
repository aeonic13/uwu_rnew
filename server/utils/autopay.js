/**
 * Rent autopay: schedule math plus the runner that fires on each run day.
 *
 * Money movement is not live (Moov is sandbox-only), so today the runner
 * emails the tenant an "autopay day" reminder and rolls the schedule to
 * next month. When ACH goes live, `executeRun` is the single seam to
 * replace: create the Moov transfer, record the Transaction, and only then
 * advance nextRunAt.
 */
import prisma from './prisma.js'
import { sendAutopayReminderEmail } from './email.js'

export const MIN_DAY = 1
// Capped at 28 so a schedule fires every month, including February.
export const MAX_DAY = 28

const HOUR_MS = 60 * 60 * 1000

/**
 * Next occurrence of `dayOfMonth` strictly after `from` (UTC, 09:00).
 * If today's date is before that day this month, it is this month.
 */
export function computeNextRun(dayOfMonth, from = new Date()) {
  const day = clampDay(dayOfMonth)
  const f = new Date(from)
  let year = f.getUTCFullYear()
  let month = f.getUTCMonth()
  let candidate = new Date(Date.UTC(year, month, day, 9, 0, 0))
  if (candidate <= f) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    candidate = new Date(Date.UTC(year, month, day, 9, 0, 0))
  }
  return candidate
}

export function clampDay(dayOfMonth) {
  const n = Math.round(Number(dayOfMonth))
  if (!Number.isFinite(n)) return MIN_DAY
  return Math.min(MAX_DAY, Math.max(MIN_DAY, n))
}

/**
 * Process every active schedule whose run time has passed. Dependencies
 * are injectable so the loop is unit-testable without a database.
 *
 * @returns {Promise<number>} how many schedules were processed
 */
export async function runDueAutopays({
  now = new Date(),
  db = prisma,
  notify = sendAutopayReminderEmail,
} = {}) {
  const due = await db.autopaySchedule.findMany({
    where: { status: 'active', nextRunAt: { lte: now } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      agreement: {
        select: {
          application: {
            select: { listing: { select: { title: true } } },
          },
        },
      },
    },
  })

  let processed = 0
  for (const schedule of due) {
    try {
      await executeRun(schedule, { now, db, notify })
      processed += 1
    } catch (err) {
      console.error(`Autopay ${schedule.id} failed:`, err)
    }
  }
  return processed
}

// One schedule's run. Moov seam: replace the reminder with a transfer.
async function executeRun(schedule, { now, db, notify }) {
  const listingTitle =
    schedule.agreement?.application?.listing?.title || 'your rental'
  await notify({
    tenant: schedule.user,
    amount: schedule.amount,
    listingTitle,
    dayOfMonth: schedule.dayOfMonth,
  })
  await db.autopaySchedule.update({
    where: { id: schedule.id },
    data: {
      lastRunAt: now,
      nextRunAt: computeNextRun(schedule.dayOfMonth, now),
    },
  })
}

/**
 * Start the hourly runner. Skipped when AUTOPAY_RUNNER=false (tests, local
 * dev without email) — Railway runs one container, so a plain interval is
 * enough for now.
 */
export function startAutopayRunner({ intervalMs = HOUR_MS } = {}) {
  if (process.env.AUTOPAY_RUNNER === 'false') return null
  const tick = () =>
    runDueAutopays().catch(err => console.error('Autopay runner error:', err))
  // First pass shortly after boot so a restart does not skip a run day.
  const first = setTimeout(tick, 30 * 1000)
  const timer = setInterval(tick, intervalMs)
  first.unref?.()
  timer.unref?.()
  return timer
}
