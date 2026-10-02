import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PropertyWorkspace from './PropertyWorkspace'
import { propertiesService } from '../../services/propertiesService'
import { applicationsService } from '../../services/applicationsService'
import { maintenanceService } from '../../services/maintenanceService'

vi.mock('../../services/propertiesService', () => ({
  propertiesService: { getPortfolio: vi.fn(), getProperty: vi.fn() },
}))
vi.mock('../../services/applicationsService', () => ({
  applicationsService: { updateStatus: vi.fn() },
}))
vi.mock('../../services/maintenanceService', () => ({
  maintenanceService: { updateStatus: vi.fn() },
}))
vi.mock('../../services/listingsService', () => ({
  listingsService: { toggleListingStatus: vi.fn() },
}))
vi.mock('../../services/expensesService', () => ({
  expensesService: {
    list: vi.fn().mockResolvedValue({ expenses: [], categories: {} }),
    create: vi.fn(),
    remove: vi.fn(),
  },
}))
vi.mock('../../services/documentsService', () => ({
  documentsService: { upload: vi.fn(), remove: vi.fn() },
}))
vi.mock('../../services/agreementsService', () => ({
  agreementsService: { downloadPdf: vi.fn() },
}))
vi.mock('../../services/messagingService', () => ({
  messagingService: { startConversation: vi.fn() },
}))
vi.mock('../../services/tenantInvitesService', () => ({
  tenantInvitesService: {
    resend: vi.fn().mockResolvedValue({ emailSent: true }),
    update: vi.fn(),
    cancel: vi.fn(),
  },
}))
import { tenantInvitesService } from '../../services/tenantInvitesService'

const tenant = {
  id: 't1',
  firstName: 'Emma',
  lastName: 'Wilson',
  email: 'emma@example.com',
  phone: null,
  verified: true,
}
const applicant = {
  id: 't4',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex@example.com',
  university: 'UC San Diego',
  verified: false,
}

const workspace = {
  property: {
    id: 'l1',
    title: 'Beachside 2BR',
    location: 'Pacific Beach, San Diego, CA 92109',
    streetAddress: '1245 Grand Ave, San Diego, CA 92109',
    price: 2600,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'House',
    images: [],
    amenities: ['WiFi'],
    active: true,
    incomeMultiplier: 3,
    moveInDate: '2026-08-01T00:00:00.000Z',
  },
  stats: {
    status: 'leased',
    tenants: 1,
    pendingApplications: 1,
    totalApplications: 2,
    openTickets: 1,
    monthlyRent: 2400,
    collectedThisMonth: 1200,
    leaseEnd: '2027-07-31T00:00:00.000Z',
    expensesYtd: 300,
    favorites: 4,
  },
  leases: [
    {
      id: 'ag1',
      monthlyRent: 2400,
      securityDeposit: 2400,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2027-07-31T00:00:00.000Z',
      fullySigned: true,
      current: true,
      landlordSigned: true,
      deposit: { status: 'holding', amountHeld: 2400 },
      rentSplit: null,
      members: [
        {
          applicationId: 'a1',
          user: tenant,
          signed: true,
          share: null,
          autopay: { status: 'active', amount: 2400, dayOfMonth: 1 },
          paidThisMonth: 1200,
          recentPayments: [],
        },
      ],
    },
  ],
  applications: [
    {
      id: 'a2',
      status: 'pending',
      createdAt: '2026-09-20T00:00:00.000Z',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2027-10-31T00:00:00.000Z',
      message: 'Quiet grad student.',
      groupId: null,
      agreementId: null,
      applicant,
      cosigners: [],
      voucherAmount: null,
      incomeAssessment: {
        hasIncomeData: true,
        meetsRequirement: true,
        ratio: 3.4,
        monthlyIncome: 8800,
        requiredIncome: 7800,
      },
    },
    {
      id: 'a1',
      status: 'approved',
      createdAt: '2026-07-01T00:00:00.000Z',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2027-07-31T00:00:00.000Z',
      groupId: null,
      agreementId: 'ag1',
      applicant: tenant,
      cosigners: [],
      incomeAssessment: { hasIncomeData: false },
    },
  ],
  tickets: [
    {
      id: 'tk1',
      category: 'Plumbing',
      description: 'Kitchen sink drains slowly.',
      priority: 'high',
      status: 'pending',
      photos: [],
      assignedTo: null,
      createdAt: '2026-09-28T00:00:00.000Z',
      tenant,
    },
  ],
  documents: [],
  expenses: [],
}

const renderAt = path =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard/properties/:id"
          element={<PropertyWorkspace />}
        />
        <Route
          path="/dashboard/properties/:id/:tab"
          element={<PropertyWorkspace />}
        />
      </Routes>
    </MemoryRouter>
  )

describe('PropertyWorkspace', () => {
  beforeEach(() => {
    propertiesService.getProperty.mockReset()
    propertiesService.getProperty.mockResolvedValue(workspace)
    applicationsService.updateStatus.mockReset()
    maintenanceService.updateStatus.mockReset()
  })

  it('shows the property header and the overview attention list', async () => {
    renderAt('/dashboard/properties/l1')
    expect(
      await screen.findByRole('heading', { name: 'Beachside 2BR' })
    ).toBeInTheDocument()
    expect(screen.getByText('Leased')).toBeInTheDocument()
    expect(
      screen.getByText('1 application waiting for a decision')
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 high-priority maintenance ticket open')
    ).toBeInTheDocument()
  })

  it('switches tabs from the tab bar', async () => {
    renderAt('/dashboard/properties/l1')
    await screen.findByRole('heading', { name: 'Beachside 2BR' })
    const nav = screen.getByRole('navigation', { name: 'Property sections' })
    fireEvent.click(within(nav).getByRole('button', { name: /tenants/i }))
    expect(await screen.findByText('Emma Wilson')).toBeInTheDocument()
    expect(screen.getByText('All signed')).toBeInTheDocument()
    expect(screen.getByText('Autopay')).toBeInTheDocument()
  })

  it('approves a pending application and reloads', async () => {
    applicationsService.updateStatus.mockResolvedValue({})
    renderAt('/dashboard/properties/l1/applications')
    expect(await screen.findByText('Alex Johnson')).toBeInTheDocument()
    expect(screen.getByText(/3.4× rent/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }))
    await waitFor(() =>
      expect(applicationsService.updateStatus).toHaveBeenCalledWith(
        'a2',
        'approved'
      )
    )
    expect(propertiesService.getProperty).toHaveBeenCalledTimes(2)
  })

  it('saves a maintenance status change', async () => {
    maintenanceService.updateStatus.mockResolvedValue({})
    renderAt('/dashboard/properties/l1/maintenance')
    expect(await screen.findByText('Plumbing')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'in-progress' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() =>
      expect(maintenanceService.updateStatus).toHaveBeenCalledWith(
        'tk1',
        'in-progress',
        ''
      )
    )
  })

  it('shows an imported lease with invite progress and resends an invite', async () => {
    const importedLease = {
      id: 'ag2',
      monthlyRent: 2600,
      securityDeposit: 2600,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2027-08-01T00:00:00.000Z',
      source: 'imported',
      imported: true,
      monthToMonth: true,
      fullySigned: false,
      current: false,
      awaitingTenants: true,
      confirmations: { confirmed: 1, total: 2 },
      landlordSigned: true,
      deposit: null,
      rentSplit: null,
      members: [
        {
          applicationId: 'm1',
          user: tenant,
          invite: { id: 'i1', status: 'accepted', email: tenant.email },
          signed: true,
          share: null,
          autopay: null,
          paidThisMonth: 0,
          recentPayments: [],
        },
        {
          applicationId: 'm2',
          user: null,
          invite: {
            id: 'i2',
            status: 'pending',
            firstName: 'Alex',
            lastName: 'Johnson',
            email: 'alex@example.com',
            expiresAt: '2026-10-16T00:00:00.000Z',
          },
          signed: false,
          share: null,
          autopay: null,
          paidThisMonth: 0,
          recentPayments: [],
        },
      ],
    }
    propertiesService.getProperty.mockResolvedValue({
      ...workspace,
      stats: {
        ...workspace.stats,
        status: 'awaiting_tenants',
        tenants: 0,
        invites: { confirmed: 1, total: 2 },
      },
      leases: [importedLease],
      applications: [],
    })
    renderAt('/dashboard/properties/l1/tenants')
    expect(await screen.findByText('1 of 2 confirmed')).toBeInTheDocument()
    expect(screen.getByText('Invites sent')).toBeInTheDocument()
    expect(
      screen.getByText('Month-to-month', { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    // No "Add current tenants" while a lease is in progress.
    expect(screen.queryByText('Add current tenants')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    await waitFor(() =>
      expect(tenantInvitesService.resend).toHaveBeenCalledWith('i2')
    )
    expect(await screen.findByText('Invitation resent.')).toBeInTheDocument()
    expect(propertiesService.getProperty).toHaveBeenCalledTimes(2)
  })

  it('offers the onboarding flow when a listed property has no lease', async () => {
    propertiesService.getProperty.mockResolvedValue({
      ...workspace,
      stats: { ...workspace.stats, status: 'listed', tenants: 0 },
      leases: [],
      applications: [],
    })
    renderAt('/dashboard/properties/l1/tenants')
    expect(await screen.findByText('No tenants yet')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /add current tenants/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/dashboard/properties/l1/onboard')
  })

  it('falls back to overview for an unknown tab', async () => {
    renderAt('/dashboard/properties/l1/nonsense')
    expect(await screen.findByText('Needs attention')).toBeInTheDocument()
  })
})
