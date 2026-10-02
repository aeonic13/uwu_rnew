import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OnboardTenantsFlow, {
  validateLease,
  validateTenants,
} from './OnboardTenantsFlow'
import { propertiesService } from '../../../services/propertiesService'

vi.mock('../../../services/propertiesService', () => ({
  propertiesService: { getProperty: vi.fn(), onboard: vi.fn() },
}))
vi.mock('../../../services/documentsService', () => ({
  documentsService: { upload: vi.fn() },
}))
vi.mock('../../../services/listingsService', () => ({
  listingsService: { toggleListingStatus: vi.fn().mockResolvedValue({}) },
}))
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'o1', email: 'jen@example.com', userType: 'owner' },
  }),
}))

const workspace = {
  property: {
    id: 'l1',
    title: 'Beachside 2BR',
    price: 2600,
    active: true,
    images: [],
  },
  stats: { status: 'listed' },
  leases: [],
  applications: [],
  tickets: [],
  documents: [],
  expenses: [],
}

const renderFlow = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/properties/l1/onboard']}>
      <Routes>
        <Route
          path="/dashboard/properties/:id/onboard"
          element={<OnboardTenantsFlow />}
        />
      </Routes>
    </MemoryRouter>
  )

describe('validateLease / validateTenants', () => {
  it('requires an end date unless month-to-month and checks ordering', () => {
    expect(
      validateLease({
        startDate: '2026-08-01',
        endDate: '',
        monthToMonth: false,
        monthlyRent: '2400',
        securityDeposit: '0',
      }).endDate
    ).toBeTruthy()
    expect(
      validateLease({
        startDate: '2026-08-01',
        endDate: '2026-07-01',
        monthToMonth: false,
        monthlyRent: '2400',
        securityDeposit: '0',
      }).endDate
    ).toMatch(/after/)
    expect(
      validateLease({
        startDate: '2026-08-01',
        endDate: '',
        monthToMonth: true,
        monthlyRent: '2400',
        securityDeposit: '0',
      })
    ).toEqual({})
  })

  it('flags bad emails, duplicates and the landlord’s own address', () => {
    const errs = validateTenants(
      [
        { key: 'a', firstName: 'A', lastName: 'B', email: 'nope', phone: '' },
        { key: 'b', firstName: 'C', lastName: 'D', email: 'x@y.co', phone: '' },
        { key: 'c', firstName: 'E', lastName: 'F', email: 'X@y.co', phone: '' },
        {
          key: 'd',
          firstName: 'G',
          lastName: 'H',
          email: 'jen@example.com',
          phone: '',
        },
      ],
      'jen@example.com'
    )
    expect(errs.a.email).toMatch(/valid/)
    expect(errs.b).toBeUndefined()
    expect(errs.c.email).toMatch(/twice/)
    expect(errs.d.email).toMatch(/own/)
  })
})

describe('OnboardTenantsFlow', () => {
  beforeEach(() => {
    propertiesService.getProperty.mockReset()
    propertiesService.onboard.mockReset()
    propertiesService.getProperty.mockResolvedValue(workspace)
  })

  it('walks lease → tenants → review and submits the invitation request', async () => {
    propertiesService.onboard.mockResolvedValue({
      agreementId: 'ag9',
      invites: [
        {
          id: 'i1',
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma@example.com',
          emailSent: true,
        },
      ],
    })
    renderFlow()
    expect(
      await screen.findByRole('heading', { name: 'Add current tenants' })
    ).toBeInTheDocument()

    // Lease step, prefilled rent from the listing price.
    expect(screen.getByLabelText(/^Monthly rent/)).toHaveValue(2600)
    fireEvent.change(screen.getByLabelText('Lease start'), {
      target: { value: '2026-08-01' },
    })
    fireEvent.click(screen.getByLabelText('This lease is month-to-month'))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Tenants step.
    expect(await screen.findByText('Tenant 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Emma' },
    })
    fireEvent.change(screen.getByLabelText('Last name'), {
      target: { value: 'Wilson' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'emma@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Review step: attest, then send.
    expect(await screen.findByText('Household')).toBeInTheDocument()
    expect(
      screen.getByText('Month-to-month', { exact: false })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /send invites/i }))

    await waitFor(() => expect(propertiesService.onboard).toHaveBeenCalled())
    const [id, body] = propertiesService.onboard.mock.calls[0]
    expect(id).toBe('l1')
    expect(body).toMatchObject({
      attest: true,
      lease: {
        startDate: '2026-08-01',
        monthToMonth: true,
        monthlyRent: 2600,
        securityDeposit: 2600,
      },
      tenants: [
        { firstName: 'Emma', lastName: 'Wilson', email: 'emma@example.com' },
      ],
    })
    expect(body.lease.endDate).toBeUndefined()

    expect(await screen.findByText('Invitations sent')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /stop taking applications/i })
    ).toBeInTheDocument()
  })

  it('blocks a property that already has a lease in progress', async () => {
    propertiesService.getProperty.mockResolvedValue({
      ...workspace,
      leases: [{ id: 'ag1', current: true, fullySigned: true }],
    })
    renderFlow()
    expect(
      await screen.findByText('This property already has a lease')
    ).toBeInTheDocument()
    expect(propertiesService.onboard).not.toHaveBeenCalled()
  })

  it('surfaces a server-side rejection on the review step', async () => {
    propertiesService.onboard.mockRejectedValue(
      new Error('emma@example.com belongs to a landlord account on Rentra.')
    )
    renderFlow()
    await screen.findByRole('heading', { name: 'Add current tenants' })
    fireEvent.change(screen.getByLabelText('Lease start'), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText('Lease end'), {
      target: { value: '2027-07-31' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByText('Tenant 1')
    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Emma' },
    })
    fireEvent.change(screen.getByLabelText('Last name'), {
      target: { value: 'Wilson' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'emma@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await screen.findByText('Household')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /send invites/i }))
    expect(
      await screen.findByText(/belongs to a landlord account/)
    ).toBeInTheDocument()
  })
})
