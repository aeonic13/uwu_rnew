import { describe, it, expect, vi } from 'vitest'
import {
  toAppPath,
  notificationFromEmail,
  pushNotification,
} from '../utils/notifications.js'

describe('toAppPath', () => {
  it('strips the client origin and keeps paths', () => {
    process.env.CLIENT_URL = 'https://myrentra.com'
    expect(toAppPath('https://myrentra.com/agreement/abc')).toBe(
      '/agreement/abc'
    )
    expect(toAppPath('/dashboard/inbox')).toBe('/dashboard/inbox')
    expect(toAppPath('dashboard')).toBe('/dashboard')
    expect(toAppPath('https://elsewhere.test/x')).toBeNull()
    expect(toAppPath(null)).toBeNull()
  })
})

describe('notificationFromEmail', () => {
  it('uses the subject as title and the link-free text as body', () => {
    process.env.CLIENT_URL = 'https://myrentra.com'
    const n = notificationFromEmail({
      subject: 'Rent reminder for Beachside 2BR',
      text: 'Hi Emma, rent ($1,475) is due. https://myrentra.com/dashboard',
      notify: { type: 'rent', link: 'https://myrentra.com/dashboard' },
    })
    expect(n).toEqual({
      type: 'rent',
      title: 'Rent reminder for Beachside 2BR',
      body: 'Hi Emma, rent ($1,475) is due.',
      link: '/dashboard',
    })
  })
})

describe('pushNotification', () => {
  const db = () => ({
    user: { findUnique: vi.fn(async () => ({ id: 'u1' })) },
    notification: {
      create: vi.fn(async ({ data }) => ({ id: 'n1', ...data })),
    },
  })

  it('resolves the user by email and writes the row', async () => {
    const d = db()
    const row = await pushNotification({
      email: 'Emma@Example.com',
      type: 'rent',
      title: 'Hi',
      body: null,
      link: '/payments',
      db: d,
    })
    expect(d.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'emma@example.com' },
      select: { id: true },
    })
    expect(row.userId).toBe('u1')
  })

  it('skips unknown recipients and never throws', async () => {
    const d = db()
    d.user.findUnique = vi.fn(async () => null)
    expect(
      await pushNotification({ email: 'nobody@x.test', title: 'Hi', db: d })
    ).toBeNull()
    d.notification.create = vi.fn(async () => {
      throw new Error('boom')
    })
    expect(
      await pushNotification({ userId: 'u1', title: 'Hi', db: d })
    ).toBeNull()
  })
})
