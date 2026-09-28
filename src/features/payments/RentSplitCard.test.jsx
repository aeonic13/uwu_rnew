import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RentSplitCard from './RentSplitCard'
import { rentService } from '../../services/rentService'

vi.mock('../../services/rentService', () => ({
  rentService: { saveSplit: vi.fn(), deleteSplit: vi.fn() },
}))

beforeEach(() => vi.clearAllMocks())

const household = [
  { userId: 'me', name: 'Ana Ruiz' },
  { userId: 'u2', name: 'Ben Cho' },
]

const emptyPlan = {
  monthlyRent: 1800,
  household,
  split: null,
  myShare: 1800,
}

const split = {
  id: 'rs1',
  total: 1800,
  splitMode: 'equal',
  createdBy: { id: 'me', name: 'Ana Ruiz' },
  shares: [
    { id: 's1', userId: 'me', name: 'Ana Ruiz', amount: 900, isMe: true },
    { id: 's2', userId: 'u2', name: 'Ben Cho', amount: 900, isMe: false },
  ],
}

describe('RentSplitCard', () => {
  it('invites a household to set up a split', () => {
    render(
      <RentSplitCard agreementId="ag1" plan={emptyPlan} onChange={() => {}} />
    )
    expect(screen.getByText(/across 2 tenants/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /set up a split/i })
    ).toBeInTheDocument()
  })

  it('prefills the editor with every tenant and saves an equal split', async () => {
    rentService.saveSplit.mockResolvedValue({ split, myShare: 900 })
    const onChange = vi.fn()
    render(
      <RentSplitCard agreementId="ag1" plan={emptyPlan} onChange={onChange} />
    )

    fireEvent.click(screen.getByRole('button', { name: /set up a split/i }))
    expect(screen.getByTestId('rent-split-editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Total monthly rent')).toHaveValue(1800)
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Ben Cho')).toBeInTheDocument()
    // Equal preview: $900 each.
    expect(screen.getAllByText('$900.00')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /save split/i }))

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ split, myShare: 900 })
    )
    expect(rentService.saveSplit).toHaveBeenCalledWith({
      agreementId: 'ag1',
      total: 1800,
      splitMode: 'equal',
      shares: [
        { userId: 'me', name: 'Ana Ruiz' },
        { userId: 'u2', name: 'Ben Cho' },
      ],
    })
  })

  it('blocks saving a custom split until percentages reach 100', () => {
    render(
      <RentSplitCard agreementId="ag1" plan={emptyPlan} onChange={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /set up a split/i }))
    fireEvent.click(screen.getByRole('button', { name: /custom %/i }))

    fireEvent.change(screen.getByLabelText('Ana Ruiz percent'), {
      target: { value: '60' },
    })
    expect(screen.getByText(/needs to be 100%/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save split/i })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Ben Cho percent'), {
      target: { value: '40' },
    })
    expect(screen.getByRole('button', { name: /save split/i })).toBeEnabled()
    expect(screen.getByText('$1080.00')).toBeInTheDocument()
    expect(screen.getByText('$720.00')).toBeInTheDocument()
  })

  it('shows the saved split with the viewer marked and removes it', async () => {
    rentService.deleteSplit.mockResolvedValue({ success: true })
    const onChange = vi.fn()
    render(
      <RentSplitCard
        agreementId="ag1"
        plan={{ ...emptyPlan, split, myShare: 900 }}
        onChange={onChange}
      />
    )
    expect(screen.getByTestId('rent-split-card')).toBeInTheDocument()
    expect(screen.getByText('you')).toBeInTheDocument()
    expect(screen.getByText(/set by Ana Ruiz/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /remove rent split/i }))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ split: null, myShare: 1800 })
    )
    expect(rentService.deleteSplit).toHaveBeenCalledWith('rs1')
  })
})
