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

// Provide a stable current user without needing the real AuthProvider.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', lastName: 'User', verified: false },
  }),
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

  it('shows Hinge-style age and gender discovery preferences', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    expect(screen.getByText('Your preferences')).toBeInTheDocument()
    expect(screen.getByText('Preferred age')).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum age')).toBeInTheDocument()
    expect(screen.getByLabelText('Maximum age')).toBeInTheDocument()

    // The old life-stage audience buttons are gone.
    expect(screen.queryByText('Students & Grads')).not.toBeInTheDocument()
    expect(screen.queryByText('Young Professionals')).not.toBeInTheDocument()
  })

  it('filters the sample feed by gender preference', async () => {
    renderHub()
    // Alex Johnson (man) and Maria Delgado (woman) both start visible.
    await screen.findByText('Alex Johnson')
    expect(screen.getByText('Maria Delgado')).toBeInTheDocument()

    // Choosing "Women" hides the men and keeps the women.
    fireEvent.click(screen.getByRole('button', { name: 'Women' }))

    expect(await screen.findByText('Maria Delgado')).toBeInTheDocument()
    expect(screen.queryByText('Alex Johnson')).not.toBeInTheDocument()
  })

  it('opens a full profile view when a card is clicked', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    // Open Jordan's profile via the card's View profile button.
    fireEvent.click(screen.getAllByRole('button', { name: /view profile/i })[0])

    // The modal opens with the person's details and the full message action
    // (cards only say "Message"; the profile view says "Message for free").
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Jordan Avery')
    expect(dialog).toHaveTextContent('Software Engineer')
    expect(dialog).toHaveTextContent('Message for free')
  })

  it('explains that sample profiles cannot be messaged instead of leaving the page', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    // Sample profiles have no real user; messaging should explain, not navigate.
    fireEvent.click(screen.getAllByRole('button', { name: /^message$/i })[0])

    expect(
      await screen.findByText(/sample profile, so messaging is disabled/i)
    ).toBeInTheDocument()
  })

  it('lets you edit a bio and preview your own profile', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    fireEvent.click(screen.getByText('Compatibility Quiz'))

    // Edit the short bio.
    const bio = await screen.findByPlaceholderText(/couple of sentences/i)
    fireEvent.change(bio, {
      target: { value: 'Tidy night owl who loves to cook.' },
    })

    // Preview shows the bio back in a read-only, self-view modal.
    fireEvent.click(screen.getByRole('button', { name: /preview my profile/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('This is how others see you')
    expect(dialog).toHaveTextContent('Tidy night owl who loves to cook.')
    // No messaging action on your own profile.
    expect(dialog).not.toHaveTextContent('Message for free')
  })
})
