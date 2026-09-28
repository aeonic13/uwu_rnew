import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PolicyUpdateBanner from './PolicyUpdateBanner'
import { legalService } from '../../services/legalService'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../services/legalService', () => ({
  legalService: { acceptances: vi.fn(), accept: vi.fn() },
}))
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

const renderBanner = () =>
  render(
    <MemoryRouter>
      <PolicyUpdateBanner />
    </MemoryRouter>
  )

describe('PolicyUpdateBanner', () => {
  it('renders nothing for signed-out visitors', () => {
    useAuth.mockReturnValue({ user: null })
    renderBanner()
    expect(legalService.acceptances).not.toHaveBeenCalled()
    expect(screen.queryByTestId('policy-update-banner')).toBeNull()
  })

  it('renders nothing when every signup policy is current', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    legalService.acceptances.mockResolvedValue({ pending: [] })
    renderBanner()
    await waitFor(() => expect(legalService.acceptances).toHaveBeenCalled())
    expect(screen.queryByTestId('policy-update-banner')).toBeNull()
  })

  it('asks for acceptance of pending policies and records it', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    legalService.acceptances.mockResolvedValue({
      pending: ['terms', 'privacy'],
    })
    legalService.accept.mockResolvedValue({ pending: [] })
    renderBanner()

    const banner = await screen.findByTestId('policy-update-banner')
    expect(banner).toHaveTextContent(/Terms of Service/)
    expect(banner).toHaveTextContent(/Privacy Policy/)
    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', '/terms')

    fireEvent.click(screen.getByRole('button', { name: /i accept/i }))
    await waitFor(() =>
      expect(legalService.accept).toHaveBeenCalledWith(['terms', 'privacy'], {
        source: 'banner',
      })
    )
    await waitFor(() =>
      expect(screen.queryByTestId('policy-update-banner')).toBeNull()
    )
  })

  it('keeps the banner and shows an error when recording fails', async () => {
    useAuth.mockReturnValue({ user: { id: 'u1' } })
    legalService.acceptances.mockResolvedValue({ pending: ['terms'] })
    legalService.accept.mockRejectedValue(new Error('boom'))
    renderBanner()
    fireEvent.click(await screen.findByRole('button', { name: /i accept/i }))
    expect(
      await screen.findByText(/could not save your acceptance/i)
    ).toBeInTheDocument()
  })
})
