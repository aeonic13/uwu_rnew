import { describe, it, expect, vi, afterEach } from 'vitest'
import { runLateFees, startLateFeeRunner } from '../utils/lateFeeRunner.js'

const HOUR = 60 * 60 * 1000

// Local-time dates: the ledger's month window and grace math use local time.
const now = new Date(2026, 9, 12, 12) // Oct 12, 2026, grace of 5 has passed
const beforeGrace = new Date(2026, 9, 3, 12) // Oct 3, inside a 5-day grace

const emma = {
  id: 'u-emma',
  firstName: 'Emma',
  lastName: 'Wilson',
  email: 'emma@example.com',
}
const alex = {
  id: 'u-alex',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex@example.com',
}

function lease({
  id = 'ag1',
  paid = [],
  charges = [],
  lateFeeAmount = 50,
  lateFeeGraceDays = 5,
} = {}) {
  return {
    id,
    monthlyRent: 2400,
    lateFeeAmount,
    lateFeeGraceDays,
    application: {
      ownerId: 'u-jen',
      owner: { firstName: 'Jennifer', lastName: 'Park' },
      listing: { title: 'Beachside 2BR' },
    },
    signers: [
      { userId: emma.id, user: emma },
      { userId: alex.id, user: alex },
    ],
    members: [
      {
        id: 'app1',
        transactions: paid.slice(0, 1).map(amount => ({ amount })),
      },
      { id: 'app2', transactions: paid.slice(1).map(amount => ({ amount })) },
    ],
    charges,
  }
}

function fakeDb(leases = []) {
  return {
    agreement: { findMany: vi.fn().mockResolvedValue(leases) },
    rentCharge: {
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'ch1',
        ...data,
      })),
    },
  }
}

function deps(leases) {
  return {
    now,
    db: fakeDb(leases),
    notifyTenant: vi.fn().mockResolvedValue({ success: true }),
    notifyOwner: vi.fn().mockResolvedValue({ id: 'n1' }),
  }
}

describe('runLateFees', () => {
  afterEach(() => vi.restoreAllMocks())

  it('applies one household late fee when rent is unpaid past the grace period', async () => {
    const d = deps([lease({ paid: [1500] })]) // 1500 of 2400 paid

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 1, applied: 1, skipped: 0 })
    expect(d.db.agreement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lateFeeAmount: { gt: 0 },
          startDate: { lte: now },
          endDate: { gte: now },
          signers: { some: {}, every: { signed: true } },
        }),
      })
    )
    expect(d.db.rentCharge.create).toHaveBeenCalledTimes(1)
    expect(d.db.rentCharge.create).toHaveBeenCalledWith({
      data: {
        agreementId: 'ag1',
        type: 'late_fee',
        amount: 50,
        description: 'Late fee — October 2026 rent (automatic)',
        dueDate: now,
        userId: null,
        createdById: 'u-jen',
      },
    })
    // Every tenant signer hears about it, as a household charge.
    expect(d.notifyTenant).toHaveBeenCalledTimes(2)
    expect(d.notifyTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: emma,
        landlordName: 'Jennifer Park',
        listingTitle: 'Beachside 2BR',
        household: true,
        memberCount: 2,
        charge: expect.objectContaining({
          type: 'late_fee',
          amount: 50,
          label: 'Late fee',
        }),
      })
    )
    expect(d.notifyTenant).toHaveBeenCalledWith(
      expect.objectContaining({ tenant: alex })
    )
    // The landlord gets an in-app note.
    expect(d.notifyOwner).toHaveBeenCalledTimes(1)
    expect(d.notifyOwner).toHaveBeenCalledWith({
      userId: 'u-jen',
      type: 'rent',
      title: 'Late fee applied: Beachside 2BR',
      body: 'October rent was still short after the 5-day grace period, so the $50 late fee from the lease was added to the household ledger.',
      link: '/dashboard/rent-collection',
    })
  })

  it('skips a lease whose household has paid the rent', async () => {
    const d = deps([lease({ paid: [1500, 900] })])

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 1, applied: 0, skipped: 1 })
    expect(d.db.rentCharge.create).not.toHaveBeenCalled()
    expect(d.notifyTenant).not.toHaveBeenCalled()
    expect(d.notifyOwner).not.toHaveBeenCalled()
  })

  it("skips a lease that already has this month's late fee", async () => {
    const d = deps([lease({ paid: [], charges: [{ id: 'old' }] })])

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 1, applied: 0, skipped: 1 })
    expect(d.db.rentCharge.create).not.toHaveBeenCalled()
    expect(d.notifyOwner).not.toHaveBeenCalled()
  })

  it('skips a lease before the grace period has run out', async () => {
    const d = { ...deps([lease({ paid: [] })]), now: beforeGrace }

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 1, applied: 0, skipped: 1 })
    expect(d.db.rentCharge.create).not.toHaveBeenCalled()
  })

  it('keeps going when one lease fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = deps([
      lease({ id: 'bad', paid: [] }),
      lease({ id: 'good', paid: [] }),
    ])
    d.db.rentCharge.create.mockImplementation(async ({ data }) => {
      if (data.agreementId === 'bad') throw new Error('db down')
      return { id: 'ch-good', ...data }
    })

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 2, applied: 1, skipped: 0 })
    expect(d.db.rentCharge.create).toHaveBeenCalledTimes(2)
    expect(d.notifyOwner).toHaveBeenCalledTimes(1)
    expect(d.notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Late fee applied: Beachside 2BR' })
    )
    expect(console.error).toHaveBeenCalled()
  })

  it('still records the fee when a notification throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = deps([lease({ paid: [] })])
    d.notifyTenant.mockRejectedValue(new Error('smtp down'))

    const counts = await runLateFees(d)

    expect(counts).toEqual({ checked: 1, applied: 1, skipped: 0 })
    expect(d.notifyOwner).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when no lease carries a late-fee rule', async () => {
    const d = deps([])
    expect(await runLateFees(d)).toEqual({ checked: 0, applied: 0, skipped: 0 })
    expect(d.db.rentCharge.create).not.toHaveBeenCalled()
  })
})

describe('startLateFeeRunner', () => {
  const original = process.env.AUTOPAY_RUNNER
  afterEach(() => {
    if (original === undefined) delete process.env.AUTOPAY_RUNNER
    else process.env.AUTOPAY_RUNNER = original
  })

  it('returns null when AUTOPAY_RUNNER=false', () => {
    process.env.AUTOPAY_RUNNER = 'false'
    expect(startLateFeeRunner()).toBeNull()
  })

  it('returns a timer otherwise', () => {
    delete process.env.AUTOPAY_RUNNER
    const timer = startLateFeeRunner({ intervalMs: HOUR })
    expect(timer).not.toBeNull()
    clearInterval(timer)
  })
})
