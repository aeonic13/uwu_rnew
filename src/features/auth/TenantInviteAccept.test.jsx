import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TenantInviteAccept from './TenantInviteAccept'
import { tenantInvitesService } from '../../services/tenantInvitesService'

vi.mock('../../services/tenantInvitesService', () => ({
  tenantInvitesService: {
    getInvitation: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
  },
}))

let currentUser = null
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}))

const invitation = {
  id: 'i1',
  email: 'emma@example.com',
  firstName: 'Emma',
  lastName: 'Wilson',
  phone: null,
  status: 'pending',
  expiresAt: '2026-10-16T00:00:00.000Z',
  hasAccount: false,
  accountType: null,
  landlord: { name: 'Jennifer Park' },
  listing: {
    id: 'l1',
    title: 'Beachside 2BR',
    location: 'Pacific Beach, San Diego, CA 92109',
    streetAddress: '1245 Grand Ave, San Diego, CA 92109',
    image: null,
  },
  lease: {
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2027-08-01T00:00:00.000Z',
    monthToMonth: true,
    monthlyRent: 2600,
    securityDeposit: 2600,
    share: 1300,
    householdSize: 2,
  },
  housemates: [{ name: 'Alex Johnson', confirmed: false }],
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/tenant-invite/tok123']}>
      <Routes>
        <Route path="/tenant-invite/:token" element={<TenantInviteAccept />} />
      </Routes>
    </MemoryRouter>
  )

describe('TenantInviteAccept', () => {
  const assign = vi.fn()
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    currentUser = null
    localStorage.clear()
    tenantInvitesService.getInvitation.mockResolvedValue(invitation)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('shows the lease facts and creates an account on confirm', async () => {
    tenantInvitesService.accept.mockResolvedValue({
      token: 'jwt-1',
      user: { id: 'u1' },
    })
    renderPage()
    expect(
      await screen.findByText('Jennifer Park added you as a tenant')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Month-to-month since Aug 1, 2026/)
    ).toBeInTheDocument()
    expect(screen.getByText(/your share \$1,300/)).toBeInTheDocument()
    expect(
      screen.getByText(/Also on the lease: Alex Johnson/)
    ).toBeInTheDocument()

    // Name prefilled from the invite.
    expect(screen.getByLabelText('First name')).toHaveValue('Emma')
    expect(screen.getByLabelText('Type your full name to confirm')).toHaveValue(
      'Emma Wilson'
    )

    fireEvent.change(screen.getByLabelText('Create a password'), {
      target: { value: 'Str0ngPassw0rd!' },
    })
    fireEvent.click(screen.getByLabelText(/I agree to Rentra/))
    fireEvent.click(screen.getByLabelText(/These are the terms of the lease/))
    fireEvent.click(
      screen.getByRole('button', { name: /create account & confirm lease/i })
    )

    await waitFor(() =>
      expect(tenantInvitesService.accept).toHaveBeenCalledWith('tok123', {
        confirm: true,
        signatureName: 'Emma Wilson',
        firstName: 'Emma',
        lastName: 'Wilson',
        phone: undefined,
        password: 'Str0ngPassw0rd!',
        acceptedTerms: true,
      })
    )
    expect(localStorage.getItem('authToken')).toBe('jwt-1')
    expect(assign).toHaveBeenCalledWith('/profile/tenant-dashboard')
  })

  it('asks an existing tenant for their password only', async () => {
    tenantInvitesService.getInvitation.mockResolvedValue({
      ...invitation,
      hasAccount: true,
      accountType: 'student',
    })
    tenantInvitesService.accept.mockResolvedValue({ token: 'jwt-2' })
    renderPage()
    await screen.findByText('Jennifer Park added you as a tenant')
    expect(screen.queryByLabelText('Create a password')).toBeNull()
    fireEvent.change(screen.getByLabelText('Your Rentra password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByLabelText(/These are the terms of the lease/))
    fireEvent.click(screen.getByRole('button', { name: /^confirm lease$/i }))
    await waitFor(() =>
      expect(tenantInvitesService.accept).toHaveBeenCalledWith('tok123', {
        confirm: true,
        signatureName: 'Emma Wilson',
        password: 'password123',
      })
    )
  })

  it('refuses a landlord account and offers to decline', async () => {
    tenantInvitesService.getInvitation.mockResolvedValue({
      ...invitation,
      hasAccount: true,
      accountType: 'owner',
    })
    renderPage()
    expect(
      await screen.findByText(/This email belongs to a landlord account/)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm lease/i })).toBeNull()
  })

  it('shows the server message for an expired link', async () => {
    tenantInvitesService.getInvitation.mockRejectedValue(
      new Error('This invitation has expired. Ask your landlord to resend it.')
    )
    renderPage()
    expect(
      await screen.findByText('Invitation unavailable')
    ).toBeInTheDocument()
    expect(screen.getByText(/has expired/)).toBeInTheDocument()
  })
})
