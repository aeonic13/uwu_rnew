import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandlordInbox, {
  buildInboxEntries,
  uniqueProperties,
} from '../../LandlordInbox'
import { dashboardService } from '../../services/dashboardService'

vi.mock('../../services/dashboardService', () => ({
  dashboardService: { getInbox: vi.fn() },
}))
vi.mock('../../services/applicationsService', () => ({
  applicationsService: { updateStatus: vi.fn() },
}))

const applicant = (id, name, propertyId, propertyTitle, appliedAt) => ({
  id,
  propertyId,
  propertyTitle,
  status: 'pending',
  tourStatus: 'not-requested',
  tourDate: null,
  messages: 0,
  lastMessage: '',
  applicant: {
    id: `u-${id}`,
    name,
    email: `${id}@example.com`,
    phone: '',
    university: 'UCSD',
    year: 'Junior',
    avatar: 'https://example.com/a.png',
    creditScore: null,
    creditTier: null,
    verified: true,
    backgroundCheck: null,
  },
  application: {
    moveInDate: '2026-09-01',
    moveOutDate: '2027-08-31',
    monthlyIncome: 3000,
    employmentStatus: '',
    emergencyContact: '',
    references: [],
    message: `Hi, I am ${name}.`,
    appliedAt,
    documents: [],
    rentalProfile: null,
  },
})

const member = (applicationId, name) => ({
  id: applicationId,
  applicationId,
  name,
  email: `${applicationId}@example.com`,
  university: 'UCSD',
  applicationStatus: 'complete',
  status: 'pending',
  monthlyIncome: 2000,
  effectiveIncome: 2000,
  creditScore: null,
  rentalProfile: null,
  income: { meetsRequirement: true },
  verificationData: {},
  guarantor: null,
})

const inbox = {
  applications: [
    applicant(
      'a1',
      'Emma Wilson',
      'l1',
      'Beachside 2BR',
      '2026-09-20T10:00:00Z'
    ),
    applicant(
      'a2',
      'Alex Johnson',
      'l1',
      'Beachside 2BR',
      '2026-09-22T10:00:00Z'
    ),
    applicant(
      'a3',
      'Mia Garcia',
      'l2',
      'Ocean View Studio',
      '2026-09-25T10:00:00Z'
    ),
    applicant(
      'a4',
      'Noah Lee',
      'l2',
      'Ocean View Studio',
      '2026-09-18T10:00:00Z'
    ),
  ],
  groups: [
    // The API's per-listing pool of solo applicants: never a card.
    {
      id: 'l1',
      propertyId: 'l1',
      propertyTitle: 'Beachside 2BR',
      isRealGroup: false,
      groupName: 'Beachside 2BR — 2 applicants',
      status: 'ready_for_review',
      members: [member('a3', 'Mia Garcia'), member('a4', 'Noah Lee')],
      combinedMonthlyIncome: 4000,
      meetsRequirement: true,
      submittedAt: '2026-09-18T10:00:00Z',
      signers: [],
    },
    {
      id: 'l1:g1',
      propertyId: 'l1',
      propertyTitle: 'Beachside 2BR',
      isRealGroup: true,
      groupName: 'The Surf House (group of 2)',
      status: 'ready_for_review',
      members: [member('a1', 'Emma Wilson'), member('a2', 'Alex Johnson')],
      combinedMonthlyIncome: 4000,
      rentRequired: 2600,
      requiredIncome: 7800,
      meetsRequirement: false,
      submittedAt: '2026-09-20T10:00:00Z',
      signers: [],
    },
  ],
}

describe('buildInboxEntries / uniqueProperties', () => {
  it('lists a group once and its members never as individuals, newest first', () => {
    const entries = buildInboxEntries(inbox.applications, inbox.groups)
    expect(entries.map(e => e.id)).toEqual(['app:a3', 'group:l1:g1', 'app:a4'])
    expect(uniqueProperties(entries)).toEqual([
      { id: 'l2', title: 'Ocean View Studio' },
      { id: 'l1', title: 'Beachside 2BR' },
    ])
  })
})

describe('LandlordInbox', () => {
  beforeEach(() => {
    dashboardService.getInbox.mockReset()
    dashboardService.getInbox.mockResolvedValue(inbox)
  })

  const renderInbox = () =>
    render(
      <MemoryRouter>
        <LandlordInbox />
      </MemoryRouter>
    )

  it('shows individuals and groups in one list with a badge telling them apart', async () => {
    renderInbox()
    const group = await screen.findByTestId('inbox-group-l1:g1')
    expect(within(group).getByText('Group')).toBeInTheDocument()
    expect(within(group).getByText('Emma, Alex')).toBeInTheDocument()

    const solo = screen.getByTestId('inbox-application-a3')
    expect(within(solo).getByText('Individual')).toBeInTheDocument()
    expect(screen.getByTestId('inbox-application-a4')).toBeInTheDocument()
    // Group members are not duplicated as individual cards.
    expect(screen.queryByTestId('inbox-application-a1')).toBeNull()
    expect(screen.queryByTestId('inbox-application-a2')).toBeNull()

    expect(
      screen.getByRole('button', { name: /^All \(3\)/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Individuals \(2\)/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Groups \(1\)/ })
    ).toBeInTheDocument()
  })

  it('filters by kind and by property', async () => {
    renderInbox()
    await screen.findByTestId('inbox-group-l1:g1')

    fireEvent.click(screen.getByRole('button', { name: /^Groups/ }))
    expect(screen.getByTestId('inbox-group-l1:g1')).toBeInTheDocument()
    expect(screen.queryByTestId('inbox-application-a3')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /^Individuals/ }))
    expect(screen.queryByTestId('inbox-group-l1:g1')).toBeNull()
    expect(screen.getByTestId('inbox-application-a3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^All/ }))
    fireEvent.change(screen.getByLabelText('Property'), {
      target: { value: 'l1' },
    })
    expect(screen.getByTestId('inbox-group-l1:g1')).toBeInTheDocument()
    expect(screen.queryByTestId('inbox-application-a3')).toBeNull()
    expect(screen.queryByTestId('inbox-application-a4')).toBeNull()
  })

  it('opens the group review from its card and comes back to the same list', async () => {
    renderInbox()
    fireEvent.click(await screen.findByTestId('inbox-group-l1:g1'))
    expect(
      screen.getByRole('button', { name: /approve group & send joint lease/i })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /back to inbox/i }))
    expect(
      await screen.findByTestId('inbox-application-a3')
    ).toBeInTheDocument()
  })

  it('shows an honest empty state instead of demo applicants', async () => {
    dashboardService.getInbox.mockResolvedValue({
      applications: [],
      groups: [],
    })
    renderInbox()
    expect(await screen.findByText('No applications yet')).toBeInTheDocument()
    expect(screen.queryByText('Emily Rodriguez')).toBeNull()
  })
})
