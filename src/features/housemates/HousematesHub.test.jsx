import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HousematesHub from './HousematesHub'
import { housematesService } from '../../services/housematesService'

// Mock the API service so tests are deterministic and offline.
vi.mock('../../services/housematesService', () => ({
  housematesService: {
    getMatches: vi.fn(),
    getMyProfile: vi.fn(),
    saveMyProfile: vi.fn(),
    deleteMyProfile: vi.fn(),
    getProfileById: vi.fn(),
    blockProfile: vi.fn(),
    reportProfile: vi.fn(),
  },
}))

// Provide a stable current user without needing the real AuthProvider.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', lastName: 'User', verified: false },
  }),
}))

// A realistic "real" API profile (has a user id, unlike the local samples).
const realProfile = {
  id: 'profile-1',
  age: 27,
  gender: 'woman',
  occupation: 'Architect',
  location: 'Seattle, WA',
  budgetMin: 900,
  budgetMax: 1400,
  bio: 'Quiet, tidy, and usually cooking something.',
  tags: ['Tidy'],
  compatibilityScore: 88,
  user: {
    id: 'user-real-1',
    firstName: 'Priya',
    lastName: 'Sharma',
    verified: true,
    avatarUrl: null,
  },
}

const emptyMatches = {
  profiles: [],
  total: 0,
  hasMore: false,
  viewerHasQuiz: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  housematesService.getMatches.mockResolvedValue(emptyMatches)
  housematesService.getMyProfile.mockResolvedValue(null)
  housematesService.saveMyProfile.mockResolvedValue({})
  housematesService.deleteMyProfile.mockResolvedValue()
  housematesService.blockProfile.mockResolvedValue()
  housematesService.reportProfile.mockResolvedValue()
})

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
    // The hero no longer shows a fabricated compatibility percentage.
    expect(screen.queryByText('89%')).not.toBeInTheDocument()

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
    expect(screen.getByText(/0 of 10 answered/)).toBeInTheDocument()
  })

  it('allows saving a partial quiz instead of gating on all ten answers', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    fireEvent.click(screen.getByText('Compatibility Quiz'))
    await screen.findByText('How tidy is your ideal home?')

    // Save is enabled even with zero answers (partial saves are welcome).
    const save = screen.getByRole('button', { name: /save & see who fits/i })
    expect(save).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Very tidy' }))
    fireEvent.click(save)

    await waitFor(() =>
      expect(housematesService.saveMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({ cleanliness: 'very' })
      )
    )
    // The untouched age slider must not fabricate an age.
    const payload = housematesService.saveMyProfile.mock.calls[0][0]
    expect(payload.age).toBeUndefined()
  })

  it('falls back to sample housemates when the API returns none', async () => {
    renderHub()

    // Sample fallback data should render, clearly labeled as examples.
    expect(await screen.findByText('Jordan Avery')).toBeInTheDocument()
    expect(screen.getAllByText('Example').length).toBeGreaterThan(0)
  })

  it('shows discovery preferences including location and situation filters', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    expect(screen.getByText('Your preferences')).toBeInTheDocument()
    expect(screen.getByText('Preferred age')).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum age')).toBeInTheDocument()
    expect(screen.getByLabelText('Maximum age')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/city or area/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Looking for a place' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Has a place' })
    ).toBeInTheDocument()
  })

  it('filters the sample feed by gender preference (multi-select)', async () => {
    renderHub()
    // Alex Johnson (man) and Maria Delgado (woman) both start visible.
    await screen.findByText('Alex Johnson')
    expect(screen.getByText('Maria Delgado')).toBeInTheDocument()

    // Choosing "Women" hides the men and keeps the women.
    fireEvent.click(screen.getByRole('button', { name: 'Women' }))
    await waitFor(() =>
      expect(screen.queryByText('Alex Johnson')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Maria Delgado')).toBeInTheDocument()

    // Adding "Nonbinary" widens the selection again (multi-select).
    fireEvent.click(screen.getByRole('button', { name: 'Nonbinary' }))
    expect(await screen.findByText('Jordan Avery')).toBeInTheDocument()
    expect(screen.queryByText('Alex Johnson')).not.toBeInTheDocument()
  })

  it('filters the sample feed by location', async () => {
    renderHub()
    await screen.findByText('Jordan Avery')

    fireEvent.change(screen.getByPlaceholderText(/city or area/i), {
      target: { value: 'Seattle' },
    })

    await waitFor(() =>
      expect(screen.queryByText('Maria Delgado')).not.toBeInTheDocument()
    )
    expect(screen.getByText('Jordan Avery')).toBeInTheDocument()
  })

  it('shows a take-the-quiz CTA instead of a fabricated score when unscored', async () => {
    housematesService.getMatches.mockResolvedValue({
      profiles: [{ ...realProfile, compatibilityScore: null }],
      total: 1,
      hasMore: false,
      viewerHasQuiz: false,
    })
    renderHub()

    await screen.findByText('Priya Sharma')
    // No percentage anywhere on the card; an honest CTA instead.
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', {
        name: /take the quiz to see your match/i,
      }).length
    ).toBeGreaterThan(0)
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
    // Sample profiles have no real user, so no Block/Report controls.
    expect(dialog).not.toHaveTextContent('Block')
    expect(dialog).not.toHaveTextContent('Report')
  })

  it('lets you block a real profile with a two-step confirm', async () => {
    housematesService.getMatches.mockResolvedValue({
      profiles: [realProfile],
      total: 1,
      hasMore: false,
      viewerHasQuiz: true,
    })
    renderHub()

    await screen.findByText('Priya Sharma')
    fireEvent.click(screen.getAllByRole('button', { name: /view profile/i })[0])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('88% match')

    // First click arms the confirm; second click blocks.
    fireEvent.click(screen.getByRole('button', { name: /^block$/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm block/i }))

    await waitFor(() =>
      expect(housematesService.blockProfile).toHaveBeenCalledWith('profile-1')
    )
    // Blocked person disappears from the feed and the modal closes.
    await waitFor(() =>
      expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    )
  })

  it('lets you report a real profile with a reason', async () => {
    housematesService.getMatches.mockResolvedValue({
      profiles: [realProfile],
      total: 1,
      hasMore: false,
      viewerHasQuiz: true,
    })
    renderHub()

    await screen.findByText('Priya Sharma')
    fireEvent.click(screen.getAllByRole('button', { name: /view profile/i })[0])
    await screen.findByRole('dialog')

    fireEvent.click(screen.getByRole('button', { name: /report/i }))
    fireEvent.change(
      screen.getByLabelText(/why are you reporting this profile/i),
      { target: { value: 'harassment' } }
    )
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() =>
      expect(housematesService.reportProfile).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({ reason: 'harassment' })
      )
    )
    expect(await screen.findByText(/our team will review/i)).toBeInTheDocument()
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

  it('offers pause and delete once a saved profile exists', async () => {
    housematesService.getMyProfile.mockResolvedValue({
      cleanliness: 'very',
      active: true,
      location: 'Austin, TX',
    })
    renderHub()
    await screen.findByText('Maria Delgado')

    fireEvent.click(screen.getByText('Compatibility Quiz'))

    expect(await screen.findByText('Profile visibility')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /pause my profile/i }))
    await waitFor(() =>
      expect(housematesService.saveMyProfile).toHaveBeenCalledWith({
        active: false,
      })
    )

    // Delete is a two-step confirm.
    fireEvent.click(screen.getByRole('button', { name: /delete my profile/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /confirm permanent delete/i })
    )
    await waitFor(() =>
      expect(housematesService.deleteMyProfile).toHaveBeenCalled()
    )
  })
})
