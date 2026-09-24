import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HousemateMatchCard from './HousemateMatchCard'
import { housematesService } from '../../services/housematesService'

vi.mock('../../services/housematesService', () => ({
  housematesService: { getByUser: vi.fn() },
}))

beforeEach(() => vi.clearAllMocks())

function renderCard() {
  return render(
    <MemoryRouter>
      <HousemateMatchCard userId="u2" />
    </MemoryRouter>
  )
}

describe('HousemateMatchCard', () => {
  it('renders nothing when the other person has no housemate profile', async () => {
    housematesService.getByUser.mockResolvedValue({
      profile: null,
      viewerHasProfile: true,
    })
    renderCard()
    await waitFor(() => expect(housematesService.getByUser).toHaveBeenCalled())
    expect(screen.queryByTestId('housemate-match-card')).not.toBeInTheDocument()
  })

  it('shows the score, campus and reasons when there is a match', async () => {
    housematesService.getByUser.mockResolvedValue({
      viewerHasProfile: true,
      profile: {
        compatibilityScore: 91,
        sameUniversity: true,
        moveInMonth: '2026-09',
        lookingForRoom: true,
        matchBreakdown: {
          shared: [{ key: 'smoking', value: 'no' }],
          partial: [],
          differs: [
            { key: 'chores', viewer: 'schedule', candidate: 'flexible' },
          ],
          budget: null,
        },
        user: { firstName: 'Priya', university: 'UC San Diego' },
      },
    })
    renderCard()
    expect(await screen.findByText('91%')).toBeInTheDocument()
    expect(screen.getByText('Same university')).toBeInTheDocument()
    expect(screen.getByText('Move in Sep 2026')).toBeInTheDocument()
    expect(screen.getByText(/Smoke-free home/)).toBeInTheDocument()
    expect(screen.getByText(/Chores/)).toBeInTheDocument()
  })

  it('points an unscored viewer at the quiz', async () => {
    housematesService.getByUser.mockResolvedValue({
      viewerHasProfile: false,
      profile: {
        compatibilityScore: null,
        matchBreakdown: null,
        user: { firstName: 'Priya' },
      },
    })
    renderCard()
    expect(
      await screen.findByText('Take the quiz to see your match with Priya')
    ).toHaveAttribute('href', '/housemates')
  })
})
