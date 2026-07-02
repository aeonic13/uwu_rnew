import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HousematesHub from './HousematesHub'

// Mock the API service so tests are deterministic and offline.
vi.mock('../../services/housematesService', () => ({
  housematesService: {
    getMatches: vi.fn().mockResolvedValue([]),
    getMyProfile: vi.fn().mockResolvedValue(null),
    saveMyProfile: vi.fn().mockResolvedValue({}),
    getProfileById: vi.fn().mockResolvedValue(null),
  },
}))

function renderHub() {
  return render(
    <MemoryRouter>
      <HousematesHub />
    </MemoryRouter>
  )
}

describe('HousematesHub', () => {
  it('renders the hero and the simple clickable categories', async () => {
    renderHub()

    expect(
      screen.getByRole('heading', { name: 'Housemates' })
    ).toBeInTheDocument()
    expect(screen.getByText('Find a Housemate')).toBeInTheDocument()
    expect(screen.getByText('Compatibility Quiz')).toBeInTheDocument()
    // Browse Rooms was removed from the hub.
    expect(screen.queryByText('Browse Rooms')).not.toBeInTheDocument()

    // Flush the async match load so state updates settle within act().
    await screen.findByText('Jordan Avery')
  })

  it('always shows the Safe Search sidebar, in every section', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    // Visible on discover…
    expect(
      screen.getByRole('complementary', { name: 'Safe Search' })
    ).toBeInTheDocument()

    // …and still visible after switching to the quiz.
    fireEvent.click(screen.getByText('Compatibility Quiz'))
    expect(
      screen.getByRole('complementary', { name: 'Safe Search' })
    ).toBeInTheDocument()
  })

  it('shows the expanded ten-question compatibility quiz', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    fireEvent.click(screen.getByText('Compatibility Quiz'))

    expect(
      await screen.findByText('How tidy is your ideal home?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('What is your relationship with smoking or vaping?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('How do you feel about pets in the home?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('When something bothers you at home, you…')
    ).toBeInTheDocument()
    expect(screen.getByText('0 of 10 answered')).toBeInTheDocument()
  })

  it('falls back to sample housemates when the API returns none', async () => {
    renderHub()

    // Sample fallback data should render with a compatibility score.
    expect(await screen.findByText('Jordan Avery')).toBeInTheDocument()
  })

  it('opens the compatibility quiz when its category is clicked', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    fireEvent.click(screen.getByText('Compatibility Quiz'))

    expect(
      await screen.findByText('When are you most active?')
    ).toBeInTheDocument()
  })

  it('filters the discovery feed by audience', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    // Switch to the Students & Grads audience and verify a student renders.
    fireEvent.click(screen.getByText('Students & Grads'))

    expect(await screen.findByText('Alex Johnson')).toBeInTheDocument()
  })
})
