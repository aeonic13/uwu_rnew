import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AgreementView from './AgreementView'
import { agreementsService } from '../../services/agreementsService'

vi.mock('../../services/agreementsService', () => ({
  agreementsService: {
    getAgreement: vi.fn(),
    sign: vi.fn(),
    downloadPdf: vi.fn(),
  },
}))

beforeEach(() => vi.clearAllMocks())

const base = {
  id: 'ag1',
  status: 'pending_signature',
  isGroupLease: true,
  viewerRole: 'tenant',
  viewerHasSigned: false,
  signedCount: 1,
  signerCount: 3,
  pendingSigners: [
    { userId: 'alex', role: 'tenant', name: 'Alex Johnson' },
    { userId: 'jen', role: 'landlord', name: 'Jennifer Park' },
  ],
  property: { address: 'Pacific Beach', description: 'Beachside 2BR' },
  tenant: { name: 'Alex Johnson', email: 'alex@example.com' },
  tenants: [
    {
      userId: 'emma',
      role: 'tenant',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      signed: true,
      signedAt: '2026-09-01T00:00:00Z',
    },
    {
      userId: 'alex',
      role: 'tenant',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      signed: false,
      isViewer: true,
    },
  ],
  landlord: {
    userId: 'jen',
    role: 'landlord',
    name: 'Jennifer Park',
    email: 'jen@example.com',
    signed: false,
  },
  terms: {
    monthlyRent: 2950,
    securityDeposit: 2950,
    startDate: '2026-06-01',
    endDate: '2027-06-01',
    utilities: 'Tenant pays',
    petPolicy: 'No pets',
  },
  createdAt: '2026-05-20',
}

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/agreement/ag1']}>
      <Routes>
        <Route path="/agreement/:agreementId" element={<AgreementView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AgreementView (joint lease)', () => {
  it('lists every tenant and the landlord with their signature status', async () => {
    agreementsService.getAgreement.mockResolvedValue(base)
    renderView()
    const parties = await screen.findByTestId('lease-parties')
    expect(parties).toHaveTextContent('Emma Wilson')
    expect(parties).toHaveTextContent('Alex Johnson')
    expect(parties).toHaveTextContent('Jennifer Park')
    expect(parties).toHaveTextContent('you')
    expect(screen.getAllByText(/^Signed/)).toHaveLength(1)
    expect(screen.getAllByText('Not signed')).toHaveLength(2)
    expect(screen.getByText(/Joint lease · 2 tenants/)).toBeInTheDocument()
    expect(screen.getByText('Signature Required')).toBeInTheDocument()
  })

  it('signs the viewer’s own block with the typed name and e-sign consent', async () => {
    agreementsService.getAgreement.mockResolvedValue(base)
    agreementsService.sign.mockResolvedValue({
      ...base,
      viewerHasSigned: true,
      signedCount: 2,
      pendingSigners: [
        { userId: 'jen', role: 'landlord', name: 'Jennifer Park' },
      ],
    })
    renderView()
    fireEvent.click(
      await screen.findByRole('button', { name: /sign agreement/i })
    )
    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Alex Johnson' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /confirm & sign/i }))

    await waitFor(() =>
      expect(agreementsService.sign).toHaveBeenCalledWith('ag1', {
        signatureName: 'Alex Johnson',
        esignConsent: true,
      })
    )
    expect(
      await screen.findByText(/Waiting on Jennifer Park/)
    ).toBeInTheDocument()
    expect(screen.getByText(/2\/3 signed/)).toBeInTheDocument()
  })

  it('shows the fully signed state', async () => {
    agreementsService.getAgreement.mockResolvedValue({
      ...base,
      status: 'signed',
      viewerHasSigned: true,
      signedCount: 3,
      pendingSigners: [],
    })
    renderView()
    expect(await screen.findByText('Agreement Signed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign agreement/i })).toBeNull()
  })
})
