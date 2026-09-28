import { describe, it, expect, vi } from 'vitest'
import { computeNextRun, clampDay, runDueAutopays } from '../utils/autopay.js'

describe('computeNextRun', () => {
  it('picks this month when the day is still ahead', () => {
    const next = computeNextRun(15, new Date('2026-09-10T12:00:00Z'))
    expect(next.toISOString()).toBe('2026-09-15T09:00:00.000Z')
  })

  it('rolls to next month once the day has passed', () => {
    const next = computeNextRun(1, new Date('2026-09-10T12:00:00Z'))
    expect(next.toISOString()).toBe('2026-10-01T09:00:00.000Z')
  })

  it('treats the run moment itself as passed', () => {
    const next = computeNextRun(10, new Date('2026-09-10T09:00:00Z'))
    expect(next.toISOString()).toBe('2026-10-10T09:00:00.000Z')
  })

  it('wraps December into January', () => {
    const next = computeNextRun(5, new Date('2026-12-20T00:00:00Z'))
    expect(next.toISOString()).toBe('2027-01-05T09:00:00.000Z')
  })

  it('clamps the day into 1..28 so February always fires', () => {
    expect(clampDay(31)).toBe(28)
    expect(clampDay(0)).toBe(1)
    expect(clampDay('abc')).toBe(1)
    const next = computeNextRun(31, new Date('2027-02-01T00:00:00Z'))
    expect(next.toISOString()).toBe('2027-02-28T09:00:00.000Z')
  })
})

describe('runDueAutopays', () => {
  const now = new Date('2026-10-01T10:00:00Z')

  function fakeDb(rows) {
    return {
      autopaySchedule: {
        findMany: vi.fn().mockResolvedValue(rows),
        update: vi.fn().mockResolvedValue({}),
      },
    }
  }

  const schedule = {
    id: 's1',
    amount: 800,
    dayOfMonth: 1,
    user: { firstName: 'Ana', lastName: 'Ruiz', email: 'ana@example.com' },
    agreement: { application: { listing: { title: 'Loft on 5th' } } },
  }

  it('reminds the tenant and rolls the schedule forward a month', async () => {
    const db = fakeDb([schedule])
    const notify = vi.fn().mockResolvedValue({})

    const processed = await runDueAutopays({ now, db, notify })

    expect(processed).toBe(1)
    expect(db.autopaySchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'active', nextRunAt: { lte: now } },
      })
    )
    expect(notify).toHaveBeenCalledWith({
      tenant: schedule.user,
      amount: 800,
      listingTitle: 'Loft on 5th',
      dayOfMonth: 1,
    })
    expect(db.autopaySchedule.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        lastRunAt: now,
        nextRunAt: new Date('2026-11-01T09:00:00.000Z'),
      },
    })
  })

  it('keeps going when one schedule fails', async () => {
    const db = fakeDb([schedule, { ...schedule, id: 's2' }])
    const notify = vi
      .fn()
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockResolvedValue({})
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {})

    const processed = await runDueAutopays({ now, db, notify })

    expect(processed).toBe(1)
    expect(db.autopaySchedule.update).toHaveBeenCalledTimes(1)
    expect(db.autopaySchedule.update.mock.calls[0][0].where.id).toBe('s2')
    silence.mockRestore()
  })

  it('does nothing when no schedule is due', async () => {
    const db = fakeDb([])
    const notify = vi.fn()
    expect(await runDueAutopays({ now, db, notify })).toBe(0)
    expect(notify).not.toHaveBeenCalled()
  })
})
