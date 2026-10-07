import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OwnerDashboard from './OwnerDashboard'
import { propertiesService } from '../../services/propertiesService'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('../../services/propertiesService', () => ({
  propertiesService: { getPortfolio: vi.fn(), getProperty: vi.fn() },
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'o1', firstName: 'Sarah', userType: 'owner' },
  }),
}))

const portfolio = {
  properties: [
    {
      id: 'l1',
      title: 'Beachside 2BR',
      location: 'Pacific Beach, San Diego, CA 92109',
      streetAddress: '1245 Grand Ave, San Diego, CA 92109',
      image: null,
      status: 'leased',
      monthlyRent: 2400,
      bedrooms: 2,
      bathrooms: 1,
      tenants: 2,
      pendingApplications: 0,
      openTickets: 1,
      leaseEnd: '2027-07-31T00:00:00.000Z',
    },
    {
      id: 'l2',
      title: 'Hillcrest Studio',
      location: 'Hillcrest, San Diego, CA 92103',
      streetAddress: null,
      image: null,
      status: 'listed',
      monthlyRent: 1350,
      bedrooms: 0,
      bathrooms: 1,
      tenants: 0,
      pendingApplications: 3,
      openTickets: 0,
      leaseEnd: null,
    },
  ],
  totals: {
    properties: 2,
    leased: 1,
    listed: 1,
    pendingSignatures: 0,
    inactive: 0,
    tenants: 2,
    pendingApplications: 3,
    openTickets: 1,
    monthlyRent: 2400,
    collectedThisMonth: 1200,
  },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <OwnerDashboard />
    </MemoryRouter>
  )

describe('OwnerDashboard (portfolio)', () => {
  beforeEach(() => {
    navigate.mockReset()
    propertiesService.getPortfolio.mockReset()
  })

  it('renders one card per property with its address and counters', async () => {
    propertiesService.getPortfolio.mockResolvedValue(portfolio)
    renderPage()

    expect(await screen.findByText('Beachside 2BR')).toBeInTheDocument()
    expect(screen.getByText('Hillcrest Studio')).toBeInTheDocument()
    expect(
      screen.getByText('1245 Grand Ave, San Diego, CA 92109')
    ).toBeInTheDocument()
    // Status badges on the cards (the filter row also says Leased/Listed).
    expect(screen.getAllByText('Leased').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Listed').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Pending applications')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 properties')).toBeInTheDocument()
  })

  it('opens a property workspace when a card is clicked', async () => {
    propertiesService.getPortfolio.mockResolvedValue(portfolio)
    renderPage()
    fireEvent.click(await screen.findByTestId('property-card-l2'))
    expect(navigate).toHaveBeenCalledWith('/dashboard/properties/l2')
  })

  it('filters to properties that need attention', async () => {
    propertiesService.getPortfolio.mockResolvedValue(portfolio)
    renderPage()
    await screen.findByText('Beachside 2BR')
    fireEvent.click(screen.getByRole('button', { name: /needs attention/i }))
    // Both: one has an open ticket, the other pending applications.
    expect(screen.getByText('Beachside 2BR')).toBeInTheDocument()
    expect(screen.getByText('Hillcrest Studio')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^leased$/i }))
    expect(screen.queryByText('Hillcrest Studio')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 properties')).toBeInTheDocument()
  })

  it('shows the empty state with an add-property call to action', async () => {
    propertiesService.getPortfolio.mockResolvedValue({
      properties: [],
      totals: { properties: 0 },
    })
    renderPage()
    expect(
      await screen.findByText('Add your first property')
    ).toBeInTheDocument()
  })

  it('links to the CSV import next to Add property', async () => {
    propertiesService.getPortfolio.mockResolvedValue(portfolio)
    renderPage()
    await screen.findByText('Beachside 2BR')
    expect(
      screen.getByRole('link', { name: /import units & tenants \(csv\)/i })
    ).toHaveAttribute('href', '/dashboard/import')
  })

  it('groups units at one address under a building header', async () => {
    const building = [
      {
        ...portfolio.properties[0],
        id: 'u1',
        title: '1245 Grand Ave · Unit 1A',
        unitLabel: '1A',
        status: 'leased',
        monthlyRent: 1800,
      },
      {
        ...portfolio.properties[0],
        id: 'u2',
        title: '1245 Grand Ave · Unit 1B',
        unitLabel: '1B',
        status: 'listed',
        monthlyRent: 1900,
        tenants: 0,
        openTickets: 0,
        leaseEnd: null,
      },
    ]
    propertiesService.getPortfolio.mockResolvedValue({
      properties: [...building, portfolio.properties[1]],
      totals: { ...portfolio.totals, properties: 3 },
    })
    renderPage()

    const header = await screen.findByTestId('building-u1')
    expect(header).toHaveTextContent('1245 Grand Ave, San Diego, CA 92109')
    expect(header).toHaveTextContent('2 units · 1 leased · 1 listed')
    expect(header).toHaveTextContent('$1,800/mo')
    expect(
      screen.getByRole('link', { name: /add another unit/i })
    ).toHaveAttribute('href', '/dashboard/listings/new?cloneFrom=u1')
    // Cards inside the building are named by unit; the single one by title.
    expect(screen.getByText('1A')).toBeInTheDocument()
    expect(screen.getByText('1B')).toBeInTheDocument()
    expect(screen.queryByText('1245 Grand Ave · Unit 1A')).toBeNull()
    expect(screen.getByText('Hillcrest Studio')).toBeInTheDocument()
    expect(screen.queryByTestId('building-l2')).toBeNull()

    // Filtering to listed units leaves one, so the building header goes.
    fireEvent.click(screen.getByRole('button', { name: /^listed$/i }))
    expect(screen.queryByTestId('building-u1')).toBeNull()
    expect(screen.getByText('1245 Grand Ave · Unit 1B')).toBeInTheDocument()
  })

  it('surfaces a load error', async () => {
    propertiesService.getPortfolio.mockRejectedValue(new Error('Server down'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('Server down')).toBeInTheDocument()
    )
  })
})
