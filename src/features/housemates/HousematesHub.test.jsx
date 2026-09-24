import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HousematesHub from './HousematesHub'
import { housematesService } from '../../services/housematesService'
import { groupsService } from '../../services/groupsService'

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

vi.mock('../../services/groupsService', () => ({
  groupsService: {
    listMy: vi.fn(),
    create: vi.fn(),
    inviteUser: vi.fn(),
  },
}))

vi.mock('../../services/messagingService', () => ({
  messagingService: { startConversation: vi.fn() },
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'me',
      firstName: 'Test',
      lastName: 'User',
      verified: false,
      university: 'UC San Diego',
    },
  }),
}))

const realProfile = {
  id: 'profile-1',
  age: 27,
  gender: 'woman',
  occupation: 'Architect',
  location: 'La Jolla, CA',
  university: 'UC San Diego',
  moveInMonth: '2026-10',
  lookingForRoom: true,
  budgetMin: 900,
  budgetMax: 1400,
  bio: 'Quiet, tidy, and usually cooking something.',
  tags: ['Tidy'],
  compatibilityScore: 88,
  sameUniversity: true,
  matchBreakdown: {
    shared: [
      { key: 'cleanliness', value: 'very' },
      { key: 'sleepSchedule', value: 'morning' },
    ],
    partial: [{ key: 'pets', viewer: 'okay', candidate: 'love' }],
    differs: [{ key: 'guestFrequency', viewer: 'rarely', candidate: 'often' }],
    budget: 'full',
  },
  user: {
    id: 'user-real-1',
    firstName: 'Priya',
    lastName: 'Sharma',
    verified: true,
    avatarUrl: null,
    university: 'UC San Diego',
  },
}

const scoredFeed = {
  profiles: [realProfile],
  total: 1,
  hasMore: false,
  viewerHasQuiz: true,
}

const emptyFeed = {
  profiles: [],
  total: 0,
  hasMore: false,
  viewerHasQuiz: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
  housematesService.getMatches.mockResolvedValue(emptyFeed)
  housematesService.getMyProfile.mockResolvedValue(null)
  housematesService.saveMyProfile.mockResolvedValue({})
  housematesService.deleteMyProfile.mockResolvedValue()
  housematesService.blockProfile.mockResolvedValue()
  housematesService.reportProfile.mockResolvedValue()
  groupsService.listMy.mockResolvedValue([])
  groupsService.create.mockResolvedValue({ id: 'g1', name: 'Test & Priya' })
  groupsService.inviteUser.mockResolvedValue({ id: 'm1' })
})

function renderHub() {
  return render(
    <MemoryRouter>
      <HousematesHub />
    </MemoryRouter>
  )
}

async function openFirstProfile() {
  await screen.findByText('Priya Sharma')
  fireEvent.click(screen.getAllByRole('button', { name: /view profile/i })[0])
  return screen.findByRole('dialog')
}

describe('HousematesHub', () => {
  it('shows an honest empty state instead of example profiles', async () => {
    renderHub()

    expect(await screen.findByText('You are early')).toBeInTheDocument()
    expect(screen.queryByText('Example')).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    // The account's university is the default filter and shows in the copy.
    expect(screen.getByText(/near UC San Diego/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /take the 2-minute quiz/i })
    ).toBeInTheDocument()
  })

  it('walks through the quiz one question at a time and saves', async () => {
    renderHub()
    await screen.findByText('You are early')

    fireEvent.click(
      screen.getByRole('button', { name: /take the 2-minute quiz/i })
    )

    expect(
      await screen.findByText('How tidy is your ideal home?')
    ).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 11')).toBeInTheDocument()
    expect(
      screen.queryByText('When are you most active?')
    ).not.toBeInTheDocument()

    // Choosing an answer advances immediately.
    fireEvent.click(screen.getByRole('button', { name: 'Very tidy' }))
    expect(screen.getByText('When are you most active?')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 11')).toBeInTheDocument()
    expect(screen.getByText('1 of 10 answered')).toBeInTheDocument()

    // Back returns to the previous question with the answer kept.
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('button', { name: 'Very tidy' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    // Skip through the rest to the closing step.
    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    }
    expect(screen.getByText('Two quick things')).toBeInTheDocument()
    expect(screen.getByLabelText(/university or area/i)).toHaveValue(
      'UC San Diego'
    )

    fireEvent.change(screen.getByLabelText(/when do you want to move in/i), {
      target: { value: 'flexible' },
    })
    fireEvent.click(screen.getByRole('button', { name: /see my matches/i }))

    await waitFor(() =>
      expect(housematesService.saveMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          cleanliness: 'very',
          university: 'UC San Diego',
          moveInMonth: 'flexible',
        })
      )
    )
    // The untouched age slider must not fabricate an age.
    expect(housematesService.saveMyProfile.mock.calls[0][0].age).toBeUndefined()
    // Back on the feed afterwards.
    expect(
      await screen.findByText('Who you want to live with')
    ).toBeInTheDocument()
  })

  it('saves partial answers with "Save and finish later"', async () => {
    renderHub()
    await screen.findByText('You are early')
    fireEvent.click(screen.getByRole('tab', { name: /compatibility quiz/i }))
    await screen.findByText('How tidy is your ideal home?')

    // Nothing answered yet: no early-save link.
    expect(screen.queryByText(/save and finish later/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Relaxed' }))
    fireEvent.click(
      screen.getByRole('button', { name: /save and finish later/i })
    )

    await waitFor(() =>
      expect(housematesService.saveMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({ cleanliness: 'relaxed' })
      )
    )
  })

  it('shows why you match on a scored card', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()

    await screen.findByText('Priya Sharma')
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('You both:')).toBeInTheDocument()
    expect(
      screen.getByText(/Very tidy · Early riser · Budget overlap/)
    ).toBeInTheDocument()
    expect(screen.getByText('Differs:')).toBeInTheDocument()
    expect(screen.getByText(/Guests/)).toBeInTheDocument()
    expect(screen.getByText('Same university')).toBeInTheDocument()
    expect(screen.getByText('Move in Oct 2026')).toBeInTheDocument()
    // Once on the card, once as a filter chip.
    expect(screen.getAllByText('Looking for a place')).toHaveLength(2)
  })

  it('shows a take-the-quiz CTA instead of a fabricated score when unscored', async () => {
    housematesService.getMatches.mockResolvedValue({
      ...scoredFeed,
      profiles: [
        { ...realProfile, compatibilityScore: null, matchBreakdown: null },
      ],
      viewerHasQuiz: false,
    })
    renderHub()

    await screen.findByText('Priya Sharma')
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', {
        name: /take the quiz to see your match/i,
      }).length
    ).toBeGreaterThan(0)
  })

  it('sends the university filter to the API', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()
    await screen.findByText('Priya Sharma')
    await waitFor(() =>
      expect(housematesService.getMatches).toHaveBeenCalledWith(
        expect.objectContaining({ university: 'UC San Diego' })
      )
    )
    expect(screen.getByLabelText(/university or area/i)).toHaveValue(
      'UC San Diego'
    )
    expect(screen.getByLabelText('Minimum age')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Has a place' })
    ).toBeInTheDocument()
  })

  it('opens the profile view with the match breakdown and both actions', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()

    const dialog = await openFirstProfile()
    expect(dialog).toHaveTextContent('Priya Sharma')
    expect(dialog).toHaveTextContent('88% match')
    expect(dialog).toHaveTextContent('Why you match')
    expect(dialog).toHaveTextContent('Tidiness')
    expect(dialog).toHaveTextContent('Guests')
    expect(dialog).toHaveTextContent('same as you')
    expect(dialog).toHaveTextContent('Message for free')
    expect(dialog).toHaveTextContent('Invite to a group')
    expect(dialog).toHaveTextContent('Block')
    expect(dialog).toHaveTextContent('Report')
  })

  it('invites a match to a new group from their profile', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()
    await openFirstProfile()

    fireEvent.click(screen.getByRole('button', { name: /invite to a group/i }))
    // No groups yet, so the picker goes straight to creating one.
    const nameInput = await screen.findByLabelText(/new group name/i)
    expect(nameInput).toHaveAttribute('placeholder', 'Test & Priya')
    fireEvent.click(
      screen.getByRole('button', { name: /create group & invite/i })
    )

    await waitFor(() =>
      expect(groupsService.inviteUser).toHaveBeenCalledWith('g1', 'user-real-1')
    )
    expect(groupsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test & Priya' })
    )
    expect(
      await screen.findByText(/Invited Priya to Test & Priya/)
    ).toBeInTheDocument()
  })

  it('lets you block a real profile with a two-step confirm', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()
    await openFirstProfile()

    fireEvent.click(screen.getByRole('button', { name: /^block$/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm block/i }))

    await waitFor(() =>
      expect(housematesService.blockProfile).toHaveBeenCalledWith('profile-1')
    )
    await waitFor(() =>
      expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    )
  })

  it('lets you report a real profile with a reason', async () => {
    housematesService.getMatches.mockResolvedValue(scoredFeed)
    renderHub()
    await openFirstProfile()

    fireEvent.click(screen.getByRole('button', { name: /^report$/i }))
    fireEvent.change(
      screen.getByLabelText(/why are you reporting this profile/i),
      {
        target: { value: 'harassment' },
      }
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

  it('edits the bio and previews your own profile from My profile', async () => {
    renderHub()
    await screen.findByText('You are early')

    fireEvent.click(screen.getByRole('tab', { name: /my profile/i }))
    const bio = await screen.findByPlaceholderText(/couple of sentences/i)
    fireEvent.change(bio, {
      target: { value: 'Tidy night owl who loves to cook.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preview my profile/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('This is how others see you')
    expect(dialog).toHaveTextContent('Tidy night owl who loves to cook.')
    expect(dialog).toHaveTextContent('UC San Diego')
    expect(dialog).not.toHaveTextContent('Message for free')
    expect(dialog).not.toHaveTextContent('Why you match')
  })

  it('offers pause and delete once a saved profile exists', async () => {
    housematesService.getMyProfile.mockResolvedValue({
      cleanliness: 'very',
      active: true,
      university: 'UC San Diego',
    })
    renderHub()
    await screen.findByText('No housemates here yet')

    fireEvent.click(screen.getByRole('tab', { name: /my profile/i }))
    expect(await screen.findByText('Profile visibility')).toBeInTheDocument()
    expect(screen.getByText(/1 of 10 answered/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /pause my profile/i }))
    await waitFor(() =>
      expect(housematesService.saveMyProfile).toHaveBeenCalledWith({
        active: false,
      })
    )

    fireEvent.click(screen.getByRole('button', { name: /delete my profile/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /confirm permanent delete/i })
    )
    await waitFor(() =>
      expect(housematesService.deleteMyProfile).toHaveBeenCalled()
    )
  })

  it('shows the safety reminder once and lets you dismiss it', async () => {
    renderHub()
    await screen.findByText('You are early')
    const note = screen.getByRole('note', { name: /safety reminders/i })
    expect(note).toHaveTextContent('Your contact info stays private.')
    fireEvent.click(
      screen.getByRole('button', { name: /dismiss safety reminders/i })
    )
    expect(
      screen.queryByRole('note', { name: /safety reminders/i })
    ).not.toBeInTheDocument()
  })
})
