import { describe, it, expect, vi } from 'vitest'
import {
  runInviteMaintenance,
  shareForReminder,
} from '../utils/tenantInviteRunner.js'
import {
  REMINDER_BEFORE_MS,
  ROLL_FORWARD_WINDOW_MS,
} from '../utils/onboarding.js'

const now = new Date('2026-10-09T10:00:00Z')

function fakeDb({ due = [], rolling = [], expiredCount = 0 } = {}) {
  return {
    tenantInvite: {
      updateMany: vi.fn().mockResolvedValue({ count: expiredCount }),
      findMany: vi.fn().mockResolvedValue(due),
      update: vi.fn().mockResolvedValue({}),
    },
    agreement: {
      findMany: vi.fn().mockResolvedValue(rolling),
      update: vi.fn().mockResolvedValue({}),
    },
  }
}

const invite = {
  id: 'inv1',
  token: 'tok',
  firstName: 'Emma',
  lastName: 'Wilson',
  email: 'emma@example.com',
  expiresAt: new Date('2026-10-15T10:00:00Z'),
  owner: { firstName: 'Jen', lastName: 'Park', email: 'jen@example.com' },
  listing: { id: 'l1', title: 'Beachside 2BR', location: 'Pacific Beach' },
  agreement: {
    monthlyRent: 2400,
    securityDeposit: 2400,
    startDate: new Date('2026-08-01T00:00:00Z'),
    endDate: new Date('2027-08-01T00:00:00Z'),
    monthToMonth: true,
    rentSplit: {
      shares: [
        { name: 'Emma Wilson', amount: 1500, userId: null },
        { name: 'Alex Johnson', amount: 900, userId: null },
      ],
    },
    signers: [{ role: 'tenant' }, { role: 'tenant' }, { role: 'landlord' }],
  },
}

describe('shareForReminder', () => {
  it('uses the share recorded for the invitee', () => {
    expect(shareForReminder(invite)).toEqual({ share: 1500, householdSize: 2 })
  })

  it('falls back to an equal cut when there is no named share', () => {
    const noSplit = {
      ...invite,
      agreement: { ...invite.agreement, rentSplit: null },
    }
    expect(shareForReminder(noSplit)).toEqual({ share: 1200, householdSize: 2 })
  })
})

describe('runInviteMaintenance', () => {
  it('expires lapsed links, reminds once inside the final week, rolls month-to-month forward', async () => {
    const lease = {
      id: 'ag1',
      startDate: new Date('2025-10-20T00:00:00Z'),
      endDate: new Date('2026-10-20T00:00:00Z'),
    }
    const db = fakeDb({ due: [invite], rolling: [lease], expiredCount: 2 })
    const remind = vi.fn().mockResolvedValue({ success: true })

    const counts = await runInviteMaintenance({ now, db, remind })

    expect(counts).toEqual({ expired: 2, reminded: 1, rolled: 1 })
    expect(db.tenantInvite.updateMany).toHaveBeenCalledWith({
      where: { status: 'pending', expiresAt: { lt: now } },
      data: { status: 'expired' },
    })
    expect(db.tenantInvite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'pending',
          reminderSentAt: null,
          expiresAt: {
            gt: now,
            lte: new Date(now.getTime() + REMINDER_BEFORE_MS),
          },
        },
      })
    )
    expect(remind).toHaveBeenCalledWith(invite)
    expect(db.tenantInvite.update).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: { reminderSentAt: now },
    })
    expect(db.agreement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          monthToMonth: true,
          endedAt: null,
          endDate: { lte: new Date(now.getTime() + ROLL_FORWARD_WINDOW_MS) },
        },
      })
    )
    expect(db.agreement.update).toHaveBeenCalledWith({
      where: { id: 'ag1' },
      data: { endDate: new Date('2027-10-20T00:00:00Z') },
    })
  })

  it('does not mark a reminder sent when the email throws', async () => {
    const db = fakeDb({ due: [invite] })
    const remind = vi.fn().mockRejectedValue(new Error('smtp down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const counts = await runInviteMaintenance({ now, db, remind })

    expect(counts.reminded).toBe(0)
    expect(db.tenantInvite.update).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('is a no-op on a quiet hour', async () => {
    const db = fakeDb()
    const remind = vi.fn()
    const counts = await runInviteMaintenance({ now, db, remind })
    expect(counts).toEqual({ expired: 0, reminded: 0, rolled: 0 })
    expect(remind).not.toHaveBeenCalled()
    expect(db.agreement.update).not.toHaveBeenCalled()
  })
})
