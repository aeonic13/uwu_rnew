/**
 * Automatic late fees, run hourly next to the autopay and tenant-invite
 * runners. For every lease in force today that carries a structured
 * late-fee rule (Agreement.lateFeeAmount / lateFeeGraceDays), once the grace
 * period has passed and the household's completed payments this month still
 * fall short of the rent, one household `late_fee` RentCharge is added for
 * the month. This is the same per-lease logic as the landlord's manual
 * POST /api/ledger/:agreementId/late-fee (routes/ledger.js); the manual
 * button stays for leases the runner has not reached yet.
 *
 * Dependencies are injectable so the pass is unit-testable without a
 * database or mail.
 */
import prisma from './prisma.js'
import { sendRentChargeEmail } from './email.js'
import { pushNotification } from './notifications.js'
import { CHARGE_LABELS, monthWindow, lateFeeAssessment } from './ledger.js'

const HOUR_MS = 60 * 60 * 1000

const monthLabel = d =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const monthName = d => d.toLocaleDateString('en-US', { month: 'long' })

/** Leases that could owe a late fee today, with this month's money attached. */
function candidateQuery(now) {
  const { from, to } = monthWindow(now)
  return {
    where: {
      lateFeeAmount: { gt: 0 },
      startDate: { lte: now },
      // An ended lease keeps its endDate as the move-out date, so it still
      // counts until then; `source` does not matter.
      endDate: { gte: now },
      signers: { some: {}, every: { signed: true } },
    },
    include: {
      application: {
        select: {
          ownerId: true,
          owner: { select: { firstName: true, lastName: true } },
          listing: { select: { title: true } },
        },
      },
      signers: {
        where: { role: 'tenant', userId: { not: null } },
        orderBy: { createdAt: 'asc' },
        select: {
          userId: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      // Household payments this month: completed transactions on every
      // member application of the lease.
      members: {
        select: {
          id: true,
          transactions: {
            where: { status: 'completed', createdAt: { gte: from, lt: to } },
            select: { amount: true },
          },
        },
      },
      // A household late fee already due this month means we are done.
      charges: {
        where: {
          type: 'late_fee',
          userId: null,
          dueDate: { gte: from, lt: to },
        },
        select: { id: true },
      },
    },
  }
}

function householdPaid(lease) {
  return (lease.members || [])
    .flatMap(m => m.transactions || [])
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

/**
 * One pass. Returns counts so the caller (and tests) can see what happened:
 * `checked` leases looked at, `applied` fees added, `skipped` leases where
 * the assessment said no (paid, already applied, inside the grace period).
 */
export async function runLateFees({
  now = new Date(),
  db = prisma,
  notifyTenant = sendRentChargeEmail,
  notifyOwner = pushNotification,
} = {}) {
  const counts = { checked: 0, applied: 0, skipped: 0 }
  const leases = await db.agreement.findMany(candidateQuery(now))

  for (const lease of leases) {
    counts.checked += 1
    try {
      const assessment = lateFeeAssessment({
        lateFeeAmount: lease.lateFeeAmount,
        lateFeeGraceDays: lease.lateFeeGraceDays,
        rentDue: lease.monthlyRent,
        paidThisMonth: householdPaid(lease),
        alreadyAppliedThisMonth: (lease.charges || []).length > 0,
        now,
      })
      if (!assessment.applicable) {
        counts.skipped += 1
        continue
      }

      const ownerId = lease.application.ownerId
      const charge = await db.rentCharge.create({
        data: {
          agreementId: lease.id,
          type: 'late_fee',
          amount: assessment.amount,
          description: `Late fee — ${monthLabel(now)} rent (automatic)`,
          dueDate: now,
          userId: null,
          createdById: ownerId,
        },
      })
      counts.applied += 1

      // Tell the household and the landlord. Best-effort: the charge is the
      // record, a failed notification must not undo or repeat it.
      const owner = lease.application.owner || {}
      const landlordName =
        `${owner.firstName || ''} ${owner.lastName || ''}`.trim() ||
        'Your landlord'
      const listingTitle = lease.application.listing?.title || 'your rental'
      const tenants = (lease.signers || []).filter(s => s.user?.email)
      const grace = Math.max(0, Math.round(Number(lease.lateFeeGraceDays) || 0))
      const results = await Promise.allSettled([
        ...tenants.map(s =>
          notifyTenant({
            tenant: s.user,
            landlordName,
            listingTitle,
            charge: { ...charge, label: CHARGE_LABELS.late_fee },
            household: true,
            memberCount: tenants.length,
          })
        ),
        notifyOwner({
          userId: ownerId,
          type: 'rent',
          title: `Late fee applied: ${listingTitle}`,
          body:
            `${monthName(now)} rent was still short after the ${grace}-day ` +
            `grace period, so the $${assessment.amount.toLocaleString()} late ` +
            'fee from the lease was added to the household ledger.',
          link: '/dashboard/rent-collection',
        }),
      ])
      for (const r of results) {
        if (r.status === 'rejected') {
          console.error(`Late fee notification ${lease.id} failed:`, r.reason)
        }
      }
    } catch (err) {
      console.error(`Late fee pass ${lease.id} failed:`, err)
    }
  }

  return counts
}

/**
 * Start the hourly pass. Shares the AUTOPAY_RUNNER=false switch with the
 * other background runners so one flag disables every job locally.
 */
export function startLateFeeRunner({ intervalMs = HOUR_MS } = {}) {
  if (process.env.AUTOPAY_RUNNER === 'false') return null
  const tick = () =>
    runLateFees().catch(err => console.error('Late fee runner error:', err))
  // First pass shortly after boot so a restart does not delay the fee.
  const first = setTimeout(tick, 60 * 1000)
  const timer = setInterval(tick, intervalMs)
  first.unref?.()
  timer.unref?.()
  return timer
}
