import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotificationBell, { timeAgo } from './NotificationBell'
import { notificationsService } from '../../services/notificationsService'

vi.mock('../../services/notificationsService', () => ({
  notificationsService: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const items = [
  {
    id: 'n1',
    type: 'rent',
    title: 'Emma recorded $1,475 rent',
    body: 'Check your account before counting it.',
    link: '/dashboard/rent-collection',
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'n2',
    type: 'maintenance',
    title: 'Maintenance request: Plumbing',
    body: null,
    link: '/dashboard/properties/l1/maintenance',
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
]

describe('timeAgo', () => {
  it('rounds to a short unit', () => {
    const now = Date.now()
    expect(timeAgo(new Date(now - 30000), now)).toBe('now')
    expect(timeAgo(new Date(now - 7 * 60000), now)).toBe('7m')
    expect(timeAgo(new Date(now - 5 * 3600000), now)).toBe('5h')
    expect(timeAgo(new Date(now - 3 * 86400000), now)).toBe('3d')
  })
})

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationsService.list.mockResolvedValue({
      notifications: items,
      unread: 1,
    })
    notificationsService.markRead.mockResolvedValue({ updated: 1 })
    notificationsService.markAllRead.mockResolvedValue({ updated: 1 })
  })

  const renderBell = () =>
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    )

  it('shows the unread badge and lists items when opened', async () => {
    renderBell()
    await waitFor(() =>
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1')
    )
    fireEvent.click(screen.getByRole('button', { name: /1 unread/ }))
    expect(
      screen.getByRole('dialog', { name: 'Notifications' })
    ).toBeInTheDocument()
    expect(screen.getByText('Emma recorded $1,475 rent')).toBeInTheDocument()
    expect(
      screen.getByText('Maintenance request: Plumbing')
    ).toBeInTheDocument()
  })

  it('marks an item read and navigates to its link', async () => {
    renderBell()
    await waitFor(() =>
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /unread/ }))
    fireEvent.click(screen.getByText('Emma recorded $1,475 rent'))
    expect(notificationsService.markRead).toHaveBeenCalledWith('n1')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/rent-collection')
    await waitFor(() =>
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
    )
  })

  it('marks everything read', async () => {
    renderBell()
    await waitFor(() =>
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /unread/ }))
    fireEvent.click(screen.getByText('Mark all read'))
    expect(notificationsService.markAllRead).toHaveBeenCalled()
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })
})
