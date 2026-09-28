import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AutopayCard from './AutopayCard'
import { rentService } from '../../services/rentService'

vi.mock('../../services/rentService', () => ({
  rentService: {
    saveAutopay: vi.fn(),
    setAutopayStatus: vi.fn(),
    deleteAutopay: vi.fn(),
  },
}))

beforeEach(() => vi.clearAllMocks())

const schedule = {
  id: 'ap1',
  agreementId: 'ag1',
  amount: 650,
  dayOfMonth: 1,
  paymentMethod: 'ach',
  status: 'active',
  nextRunAt: '2026-10-01T09:00:00.000Z',
  live: false,
}

describe('AutopayCard', () => {
  it('opens on the editor with the rent share prefilled when nothing is scheduled', () => {
    render(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={650}
        onChange={() => {}}
      />
    )
    expect(screen.getByTestId('autopay-editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue(650)
    expect(screen.getByText(/aren't live yet/i)).toBeInTheDocument()
  })

  it('saves a new schedule and reports it back', async () => {
    rentService.saveAutopay.mockResolvedValue(schedule)
    const onChange = vi.fn()
    render(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={650}
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Day of month'), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: /turn on autopay/i }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(schedule))
    expect(rentService.saveAutopay).toHaveBeenCalledWith({
      agreementId: 'ag1',
      dayOfMonth: 5,
      amount: 650,
      paymentMethod: 'ach',
    })
  })

  it('shows the active schedule and can pause it', async () => {
    rentService.setAutopayStatus.mockResolvedValue({
      ...schedule,
      status: 'paused',
    })
    const onChange = vi.fn()
    render(
      <AutopayCard
        agreementId="ag1"
        autopay={schedule}
        defaultAmount={650}
        onChange={onChange}
      />
    )

    expect(screen.getByTestId('autopay-card')).toBeInTheDocument()
    expect(screen.getByText('$650')).toBeInTheDocument()
    expect(screen.getByText('the 1st')).toBeInTheDocument()
    expect(screen.getByText('On')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /pause autopay/i }))
    await waitFor(() =>
      expect(rentService.setAutopayStatus).toHaveBeenCalledWith('ap1', 'paused')
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paused' })
    )
  })

  it('turns autopay off', async () => {
    rentService.deleteAutopay.mockResolvedValue({ success: true })
    const onChange = vi.fn()
    render(
      <AutopayCard
        agreementId="ag1"
        autopay={schedule}
        defaultAmount={650}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /turn off autopay/i }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null))
    expect(rentService.deleteAutopay).toHaveBeenCalledWith('ap1')
  })

  it('surfaces a save error instead of pretending it worked', async () => {
    rentService.saveAutopay.mockRejectedValue(new Error('No signed lease'))
    const onChange = vi.fn()
    render(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={650}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /turn on autopay/i }))
    expect(await screen.findByText('No signed lease')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('follows the rent share until the tenant types an amount', () => {
    const { rerender } = render(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={2950}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(2950)

    // A split is saved above: the default drops to the tenant's share.
    rerender(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={1475}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(1475)

    // Once edited by hand, later share changes leave it alone.
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '1500' },
    })
    rerender(
      <AutopayCard
        agreementId="ag1"
        autopay={null}
        defaultAmount={900}
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Amount')).toHaveValue(1500)
  })
})
