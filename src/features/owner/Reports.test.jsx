import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Reports from './Reports'
import { reportsService } from '../../services/reportsService'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('../../services/reportsService', () => ({
  reportsService: { getSummary: vi.fn(), downloadCsv: vi.fn() },
}))

const year = new Date().getFullYear()
const monthKey = i => `${year}-${String(i + 1).padStart(2, '0')}`

const emptyMonth = i => ({
  month: monthKey(i),
  income: 0,
  expenses: 0,
  net: 0,
  occupiedUnits: 0,
  totalUnits: 0,
  occupancyRate: 0,
})

const emptyReport = {
  year,
  months: Array.from({ length: 12 }, (_, i) => emptyMonth(i)),
  totals: {
    income: 0,
    expenses: 0,
    net: 0,
    averageOccupancy: 0,
    vacancyDays: 0,
  },
  byCategory: [],
  byProperty: [],
}

const populatedReport = {
  ...emptyReport,
  months: emptyReport.months.map((m, i) =>
    i === 5
      ? {
          ...m,
          income: 2950,
          expenses: 240,
          net: 2710,
          occupiedUnits: 2,
          totalUnits: 3,
          occupancyRate: 66.7,
        }
      : { ...m, totalUnits: 3, occupiedUnits: 1, occupancyRate: 33.3 }
  ),
  totals: {
    income: 2950,
    expenses: 11610,
    net: -8660,
    averageOccupancy: 50,
    vacancyDays: 429,
  },
  byCategory: [
    { category: 'taxes', amount: 6400 },
    { category: 'insurance', amount: 1890 },
  ],
  byProperty: [
    {
      listingId: 'l7',
      title: 'Beachside 2BR',
      income: 2950,
      expenses: 240,
      net: 2710,
      occupiedMonths: 5,
      vacancyDays: 151,
    },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <Reports />
    </MemoryRouter>
  )

describe('Reports', () => {
  beforeEach(() => {
    navigate.mockReset()
    reportsService.getSummary.mockReset()
    reportsService.downloadCsv.mockReset()
  })

  it('shows an honest empty state when the year has no money movement', async () => {
    reportsService.getSummary.mockResolvedValue(emptyReport)
    renderPage()

    expect(
      await screen.findByText(`No income or expenses recorded for ${year}.`)
    ).toBeInTheDocument()
    expect(reportsService.getSummary).toHaveBeenCalledWith(year)
    expect(screen.queryByText('Income vs expenses')).not.toBeInTheDocument()
  })

  it('renders totals, a populated month row and the breakdown tables', async () => {
    reportsService.getSummary.mockResolvedValue(populatedReport)
    renderPage()

    expect(await screen.findByText('Income vs expenses')).toBeInTheDocument()
    // Stat tiles
    expect(screen.getByText('Average occupancy')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText(/Vacant days: 429/)).toBeInTheDocument()

    // June row: income, expenses, net and occupancy.
    const june = screen.getByTestId(`month-row-${monthKey(5)}`)
    expect(june).toHaveTextContent('Jun')
    expect(june).toHaveTextContent('$2,950')
    expect(june).toHaveTextContent('$240')
    expect(june).toHaveTextContent('$2,710')
    expect(june).toHaveTextContent('2 / 3 (67%)')

    // Category and property tables.
    expect(screen.getByText('Taxes')).toBeInTheDocument()
    expect(screen.getByText('$6,400')).toBeInTheDocument()
    expect(screen.getByText('Beachside 2BR')).toBeInTheDocument()
    expect(screen.getByText('151')).toBeInTheDocument()
  })

  it('exports the selected year as CSV', async () => {
    reportsService.getSummary.mockResolvedValue(populatedReport)
    reportsService.downloadCsv.mockResolvedValue()
    renderPage()
    await screen.findByText('Income vs expenses')

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))
    await waitFor(() =>
      expect(reportsService.downloadCsv).toHaveBeenCalledWith(year)
    )
  })

  it('reloads when the year changes', async () => {
    reportsService.getSummary.mockResolvedValue(emptyReport)
    renderPage()
    await screen.findByText(`No income or expenses recorded for ${year}.`)

    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: String(year - 1) },
    })
    await waitFor(() =>
      expect(reportsService.getSummary).toHaveBeenLastCalledWith(year - 1)
    )
  })

  it('surfaces a load error', async () => {
    reportsService.getSummary.mockRejectedValue(new Error('Server down'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('Server down')).toBeInTheDocument()
    )
  })
})
