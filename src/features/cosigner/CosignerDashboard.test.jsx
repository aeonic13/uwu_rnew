import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CosignerDashboard from './CosignerDashboard'
import { cosignerService } from '../../services/cosignerService'

vi.mock('../../services/cosignerService', () => ({
  cosignerService: {
    myResponsibilities: vi.fn(),
  },
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Pat', lastName: 'Parent', userType: 'cosigner' },
  }),
}))

// Plaid Link is not needed to render the list.
vi.mock('./CosignerIncomeStep', () => ({ default: () => null }))

const floating = {
  id: 'cs-1',
  relationshipType: 'parent',
  verifiedMonthlyIncome: null,
  tenant: {
    firstName: 'Sam',
    lastName: 'Student',
    email: 'sam@ucsd.edu',
    university: 'UC San Diego',
  },
  listing: null,
  application: null,
  agreement: null,
}

const bound = {
  id: 'cs-2',
  relationshipType: 'parent',
  verifiedMonthlyIncome: 8200,
  tenant: {
    firstName: 'Sam',
    lastName: 'Student',
    email: 'sam@ucsd.edu',
    university: 'UC San Diego',
  },
  listing: {
    id: 'l-1',
    title: '2BR near campus',
    location: 'La Jolla, CA',
    price: 1850,
  },
  application: { status: 'pending' },
  agreement: null,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CosignerDashboard />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CosignerDashboard', () => {
  it('shows an empty state when the user backs nobody', async () => {
    cosignerService.myResponsibilities.mockResolvedValue([])
    renderPage()
    expect(
      await screen.findByText('You are not backing anyone yet')
    ).toBeInTheDocument()
    expect(screen.getByText('Income not verified yet')).toBeInTheDocument()
    expect(screen.queryByText('Verify income')).not.toBeInTheDocument()
  })

  it('lists tenants with floating and application-bound status', async () => {
    cosignerService.myResponsibilities.mockResolvedValue([floating, bound])
    renderPage()
    await waitFor(() =>
      expect(screen.getAllByText('Sam Student')).toHaveLength(2)
    )
    expect(
      screen.getByText('Backs every application Sam submits')
    ).toBeInTheDocument()
    expect(screen.getByText('2BR near campus')).toBeInTheDocument()
    expect(screen.getByText('Application pending')).toBeInTheDocument()
    expect(screen.getByText('Pre-qualified')).toBeInTheDocument()
  })

  it('surfaces verified income from any record and offers re-verify', async () => {
    cosignerService.myResponsibilities.mockResolvedValue([floating, bound])
    renderPage()
    expect(
      await screen.findByText('Income verified: $8,200/mo')
    ).toBeInTheDocument()
    expect(screen.getByText('Re-verify')).toBeInTheDocument()
  })

  it('shows an error message when the request fails', async () => {
    cosignerService.myResponsibilities.mockRejectedValue(new Error('Boom'))
    renderPage()
    expect(await screen.findByText('Boom')).toBeInTheDocument()
  })
})
