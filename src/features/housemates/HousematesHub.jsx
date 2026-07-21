import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Users,
  ClipboardList,
  ShieldCheck,
  Heart,
  MessageCircle,
  Star,
  MapPin,
  Briefcase,
  Moon,
  Sun,
  CheckCircle,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Ban,
  Cigarette,
  Wind,
  Cat,
  Share2,
  Lock,
  Home,
  Coffee,
  CalendarClock,
  Shuffle,
  SlidersHorizontal,
  Cake,
  User,
  X,
} from 'lucide-react'
import { housematesService } from '../../services/housematesService'
import { messagingService } from '../../services/messagingService'

// Top-level categories for the Housemates tab. Kept intentionally simple and
// fully clickable: each switches the section shown below. Safe Search is not
// a category — it lives in an always-visible sidebar.
const categories = [
  {
    id: 'discover',
    label: 'Find a Housemate',
    description: 'Browse people ranked by how well you would live together.',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'quiz',
    label: 'Compatibility Quiz',
    description:
      'Ten research-backed questions about how you live power your matching.',
    icon: ClipboardList,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
]

// Hinge-style discovery preferences. Instead of life-stage buckets, people
// filter the feed by the age range and gender they want in a housemate.
const AGE_FLOOR = 18
const AGE_CEIL = 75
const DEFAULT_AGE_PREF = { min: AGE_FLOOR, max: 45 }

// Desired-roommate gender options (what the viewer wants to see).
const genderPreferences = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'nonbinary', label: 'Nonbinary' },
]

// The viewer's own gender identity (stored on their profile so others can
// filter). Values match the backend and genderPreferences mapping.
const genderIdentities = [
  { id: 'man', label: 'Man' },
  { id: 'woman', label: 'Woman' },
  { id: 'nonbinary', label: 'Nonbinary' },
]

// Maps a desired-gender preference to the candidate gender it matches.
const genderPrefToIdentity = {
  men: 'man',
  women: 'woman',
  nonbinary: 'nonbinary',
}

/**
 * Dual-handle age range slider (min–max), styled like a dating app. Two
 * overlaid range inputs share a track; only the thumbs are interactive.
 */
function AgeRangeSlider({ value, onChange }) {
  const span = AGE_CEIL - AGE_FLOOR
  const pct = v => ((v - AGE_FLOOR) / span) * 100

  const setMin = v => onChange({ min: Math.min(v, value.max), max: value.max })
  const setMax = v => onChange({ min: value.min, max: Math.max(v, value.min) })

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Age range</span>
        <span className="text-sm font-semibold text-blue-600">
          {value.min}–{value.max === AGE_CEIL ? `${AGE_CEIL}+` : value.max}
        </span>
      </div>
      <div className="relative h-6">
        {/* Base track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-gray-200" />
        {/* Selected span */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-blue-600"
          style={{
            left: `${pct(value.min)}%`,
            right: `${100 - pct(value.max)}%`,
          }}
        />
        <input
          type="range"
          className="range-dual"
          min={AGE_FLOOR}
          max={AGE_CEIL}
          value={value.min}
          aria-label="Minimum age"
          onChange={e => setMin(Number(e.target.value))}
        />
        <input
          type="range"
          className="range-dual"
          min={AGE_FLOOR}
          max={AGE_CEIL}
          value={value.max}
          aria-label="Maximum age"
          onChange={e => setMax(Number(e.target.value))}
        />
      </div>
    </div>
  )
}

// Sample housemate profiles used as a fallback when the API is unavailable.
// Shaped exactly like the API response so the same render code works for both.
const sampleHousemates = [
  {
    id: 'sample-1',
    audience: 'professional',
    age: 28,
    gender: 'nonbinary',
    occupation: 'Software Engineer',
    location: 'Seattle, WA',
    budgetMin: 900,
    budgetMax: 1300,
    bio: 'Relocating for work and looking for a clean, low-drama home with someone who respects quiet evenings.',
    tags: ['Night owl', 'Tidy', 'Quiet weekends'],
    compatibilityScore: 94,
    user: {
      firstName: 'Jordan',
      lastName: 'Avery',
      verified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    },
  },
  {
    id: 'sample-2',
    audience: 'student',
    age: 21,
    gender: 'man',
    occupation: 'Computer Science Student',
    location: 'University Park, Los Angeles, CA',
    budgetMin: 800,
    budgetMax: 1200,
    bio: 'Junior studying CS. Tidy, focused, and looking for a calm place to study near campus.',
    tags: ['Night owl', 'Tidy', 'Studious'],
    compatibilityScore: 90,
    user: {
      firstName: 'Alex',
      lastName: 'Johnson',
      verified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
    },
  },
  {
    id: 'sample-3',
    audience: 'parent',
    age: 34,
    gender: 'woman',
    occupation: 'Nurse & Parent',
    location: 'Austin, TX',
    budgetMin: 1000,
    budgetMax: 1500,
    bio: 'Single parent seeking a stable, supportive household near good schools. Calm, organized, and reliable.',
    tags: ['Early riser', 'Family-friendly', 'Non-smoker'],
    compatibilityScore: 86,
    user: {
      firstName: 'Maria',
      lastName: 'Delgado',
      verified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    },
  },
  {
    id: 'sample-4',
    audience: 'remote',
    age: 31,
    gender: 'man',
    occupation: 'Remote Product Designer',
    location: 'Denver, CO',
    budgetMin: 800,
    budgetMax: 1200,
    bio: 'Home most of the day on calls. Looking for a housemate who values a calm workspace and a shared kitchen.',
    tags: ['Works from home', 'Quiet daytime', 'Coffee lover'],
    compatibilityScore: 82,
    user: {
      firstName: 'Devin',
      lastName: 'Park',
      verified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
  },
  {
    id: 'sample-5',
    audience: 'retiree',
    age: 63,
    gender: 'woman',
    occupation: 'Retired Teacher',
    location: 'Portland, OR',
    budgetMin: 700,
    budgetMax: 1000,
    bio: 'Looking for companionship and a quiet, well-kept home for this next chapter. Friendly but value my routine.',
    tags: ['Early riser', 'Very tidy', 'No pets'],
    compatibilityScore: 78,
    user: {
      firstName: 'Eleanor',
      lastName: 'Foster',
      verified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&q=80',
    },
  },
]

// Compatibility quiz questions. Option values match the backend's expected
// lifestyle values. Ordered and weighted by roommate-conflict research:
// cleanliness is the #1 source of disputes (~42-47%), then noise and sleep
// (~38%), then guests & partners (~31-35%), sharing food/belongings (~27%),
// with smoking/pets as near-dealbreakers and conflict style predicting
// whether problems actually get resolved.
const quizQuestions = [
  {
    id: 'cleanliness',
    question: 'How tidy is your ideal home?',
    options: [
      { value: 'very', label: 'Very tidy', icon: Sparkles },
      { value: 'relaxed', label: 'Relaxed', icon: Heart },
    ],
  },
  {
    id: 'sleepSchedule',
    question: 'When are you most active?',
    options: [
      { value: 'morning', label: 'Early riser', icon: Sun },
      { value: 'night', label: 'Night owl', icon: Moon },
    ],
  },
  {
    id: 'noiseTolerance',
    question: 'How do you feel about noise at home?',
    options: [
      { value: 'quiet', label: 'Prefer quiet', icon: VolumeX },
      { value: 'lively', label: 'Lively is fine', icon: Volume2 },
    ],
  },
  {
    id: 'guestFrequency',
    question: 'How often do you have guests or partners over?',
    options: [
      { value: 'rarely', label: 'Rarely', icon: Home },
      { value: 'sometimes', label: 'Sometimes', icon: Coffee },
      { value: 'often', label: 'Often', icon: Users },
    ],
  },
  {
    id: 'smoking',
    question: 'What is your relationship with smoking or vaping?',
    options: [
      { value: 'no', label: 'Smoke-free home', icon: Ban },
      { value: 'outdoor', label: 'Outside only', icon: Wind },
      { value: 'yes', label: 'I smoke', icon: Cigarette },
    ],
  },
  {
    id: 'pets',
    question: 'How do you feel about pets in the home?',
    options: [
      { value: 'love', label: 'Love / have pets', icon: Cat },
      { value: 'okay', label: 'Fine with them', icon: Heart },
      { value: 'none', label: 'Prefer none', icon: Ban },
    ],
  },
  {
    id: 'sharing',
    question: 'Groceries, cookware, and supplies — share or separate?',
    options: [
      { value: 'share', label: 'Happy to share', icon: Share2 },
      { value: 'ask', label: 'Ask first', icon: MessageCircle },
      { value: 'separate', label: 'Keep separate', icon: Lock },
    ],
  },
  {
    id: 'socialStyle',
    question: 'What do you want from a housemate socially?',
    options: [
      { value: 'friends', label: 'A friend', icon: Users },
      { value: 'friendly', label: 'Friendly but independent', icon: Coffee },
      { value: 'private', label: 'Quiet coexistence', icon: Home },
    ],
  },
  {
    id: 'chores',
    question: 'How should chores get handled?',
    options: [
      { value: 'schedule', label: 'A set schedule', icon: CalendarClock },
      { value: 'flexible', label: 'As needed', icon: Shuffle },
    ],
  },
  {
    id: 'conflictStyle',
    question: 'When something bothers you at home, you…',
    options: [
      { value: 'direct', label: 'Talk it out right away', icon: MessageCircle },
      { value: 'gentle', label: 'Need time, then discuss', icon: Heart },
    ],
  },
]

// Safe-search checklist items.
const safetyTips = [
  'Keep messaging in-app until you are ready to share contact details.',
  'Verify that profile details stay consistent across your conversations.',
  'Watch for urgency pressure or any request for payment before a viewing.',
  'Meet potential housemates in a public place first.',
  'Block and report anyone who makes you uncomfortable.',
]

// Client-side mirror of the backend discovery filter, used for the offline
// sample fallback. Candidates without an age still pass the age filter.
function filterSample(agePref, genderPref) {
  const wantGender = genderPrefToIdentity[genderPref]
  return sampleHousemates.filter(h => {
    const ageOk =
      h.age == null || (h.age >= agePref.min && h.age <= agePref.max)
    const genderOk = !wantGender || h.gender === wantGender
    return ageOk && genderOk
  })
}

// Readable gender labels for the profile view.
const genderLabels = { man: 'Man', woman: 'Woman', nonbinary: 'Nonbinary' }

// Turn a profile's stored lifestyle values into human-readable rows using the
// quiz question text + option labels, so the profile view explains the match.
function lifestyleSummary(profile) {
  if (!profile) return []
  const rows = []
  for (const q of quizQuestions) {
    const value = profile[q.id]
    if (!value) continue
    const opt = q.options.find(o => o.value === value)
    rows.push({
      id: q.id,
      question: q.question,
      label: opt ? opt.label : value,
    })
  }
  return rows
}

/**
 * Full housemate profile view, shown as a modal when a card is opened. Renders
 * everything the card summarizes plus the lifestyle answers, and hosts the
 * "Message for free" action.
 */
function HousemateProfileModal({
  profile,
  onClose,
  onMessage,
  messaging,
  error,
}) {
  if (!profile) return null
  const u = profile.user || {}
  const lifestyle = lifestyleSummary(profile)
  const budget =
    profile.budgetMin && profile.budgetMax
      ? `$${profile.budgetMin}–$${profile.budgetMax}/mo`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${u.firstName || 'Housemate'} profile`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <img
              src={u.avatarUrl || 'https://via.placeholder.com/96?text=%20'}
              alt={u.firstName || 'Housemate'}
              className="w-20 h-20 rounded-full object-cover bg-white/20"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="text-xl font-bold truncate">
                  {u.firstName} {u.lastName}
                  {profile.age ? `, ${profile.age}` : ''}
                </h2>
                {u.verified && (
                  <CheckCircle size={18} className="flex-shrink-0" />
                )}
              </div>
              {profile.occupation && (
                <div className="flex items-center text-sm text-blue-50">
                  <Briefcase size={14} className="mr-1" />
                  {profile.occupation}
                </div>
              )}
              <div className="mt-1 inline-flex items-center bg-white/20 rounded-full px-2 py-0.5 text-sm font-medium">
                <Star size={13} className="fill-current mr-1" />
                {profile.compatibilityScore}% match
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {profile.location || 'Location flexible'}
            </span>
            {budget && (
              <span className="font-medium text-gray-800">{budget}</span>
            )}
            {profile.gender && genderLabels[profile.gender] && (
              <span className="flex items-center">
                <User size={14} className="mr-1" />
                {genderLabels[profile.gender]}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {lifestyle.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2">
                How they live
              </h3>
              <div className="space-y-1.5">
                {lifestyle.map(row => (
                  <div
                    key={row.id}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{row.question}</span>
                    <span className="font-medium text-gray-800 text-right flex-shrink-0">
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={() => onMessage(profile)}
            disabled={messaging}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg flex items-center justify-center font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {messaging ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <MessageCircle size={16} className="mr-1" />
            )}
            Message for free
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Housemates Hub - a people-first, compatibility-based matching tab. Categories
 * are simple and clickable. Data is loaded from the housemates API and falls
 * back to local sample data when the backend is unavailable.
 */
function HousematesHub() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('discover')
  // Hinge-style discovery preferences.
  const [agePref, setAgePref] = useState(DEFAULT_AGE_PREF)
  const [genderPref, setGenderPref] = useState('everyone')
  const [quizAnswers, setQuizAnswers] = useState({})
  // "About you" fields that make the viewer discoverable to others.
  const [aboutYou, setAboutYou] = useState({ age: 25, gender: '' })
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reloadFlag, setReloadFlag] = useState(false)
  // Profile view (modal) + its messaging state.
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [messaging, setMessaging] = useState(false)
  const [messageError, setMessageError] = useState('')

  // Load matches whenever the discovery preferences change or a save triggers a
  // refresh. Falls back to sample data on error or empty results.
  useEffect(() => {
    let active = true

    const loadMatches = async () => {
      setLoading(true)
      try {
        const result = await housematesService.getMatches({
          ageMin: agePref.min,
          ageMax: agePref.max,
          gender: genderPref,
        })
        if (!active) return
        setProfiles(
          result && result.length > 0
            ? result
            : filterSample(agePref, genderPref)
        )
      } catch {
        if (active) setProfiles(filterSample(agePref, genderPref))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMatches()

    return () => {
      active = false
    }
  }, [agePref, genderPref, reloadFlag])

  // Preload any previously saved answers and preferences so returning users see
  // and can edit what they set before.
  useEffect(() => {
    let active = true
    housematesService
      .getMyProfile()
      .then(profile => {
        if (!active || !profile) return
        const saved = {}
        for (const q of quizQuestions) {
          if (profile[q.id]) saved[q.id] = profile[q.id]
        }
        if (Object.keys(saved).length > 0) {
          setQuizAnswers(prev => ({ ...saved, ...prev }))
        }
        if (profile.age != null || profile.gender) {
          setAboutYou(prev => ({
            age: profile.age ?? prev.age,
            gender: profile.gender ?? prev.gender,
          }))
        }
        if (
          profile.agePreferenceMin != null ||
          profile.agePreferenceMax != null
        ) {
          setAgePref({
            min: profile.agePreferenceMin ?? DEFAULT_AGE_PREF.min,
            max: profile.agePreferenceMax ?? DEFAULT_AGE_PREF.max,
          })
        }
        if (profile.genderPreference) {
          setGenderPref(profile.genderPreference)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const quizComplete = Object.keys(quizAnswers).length === quizQuestions.length

  // Open the full profile view for a housemate.
  const openProfile = profile => {
    setMessageError('')
    setSelectedProfile(profile)
  }

  // Start a real conversation with this housemate and land in that thread.
  // Sample profiles have no real user behind them, so messaging is explained
  // rather than silently dumping the user into the messages list.
  const handleConnect = async profile => {
    const recipientId = profile?.user?.id
    if (!recipientId) {
      // Surface the explanation in the profile view (may be triggered from the
      // card, where no modal is open yet).
      setSelectedProfile(profile)
      setMessageError(
        'This is a sample profile, so messaging is disabled. Real matches you find here can be messaged directly.'
      )
      return
    }
    setMessaging(true)
    setMessageError('')
    try {
      const data = await messagingService.startConversation(recipientId)
      const conversationId = data?.conversation?.id
      if (!conversationId) throw new Error('No conversation returned')
      navigate(`/messages/${conversationId}`)
    } catch {
      setSelectedProfile(profile)
      setMessageError('Could not start the conversation. Please try again.')
    } finally {
      setMessaging(false)
    }
  }

  const handleSaveQuiz = async () => {
    setSaving(true)
    try {
      await housematesService.saveMyProfile({
        ...quizAnswers,
        age: aboutYou.age,
        gender: aboutYou.gender || undefined,
        agePreferenceMin: agePref.min,
        agePreferenceMax: agePref.max,
        genderPreference: genderPref,
      })
    } catch {
      // Best-effort: in demo/offline mode we still continue to discovery.
    }
    setSaving(false)
    setReloadFlag(flag => !flag)
    setActiveCategory('discover')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold">Housemates</h1>
        </div>
        <p className="text-blue-50 max-w-2xl mb-6">
          Find your perfect housemate. We match you on how you actually live —
          your schedule, standards, and style — so you get a Compatibility Score
          before you ever send a message.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-xl">
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold">89%</div>
            <div className="text-xs text-blue-50">Compatibility Score</div>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold">$0</div>
            <div className="text-xs text-blue-50">To message anyone</div>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <div className="text-xl sm:text-2xl font-bold">5 min</div>
            <div className="text-xs text-blue-50">To set up</div>
          </div>
        </div>
      </div>

      {/* Simple, clickable category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {categories.map(cat => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `${cat.color} shadow-md`
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <div className="font-semibold mb-1">{cat.label}</div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {cat.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Main content + always-visible Safe Search sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          {/* Discover housemates */}
          {activeCategory === 'discover' && (
            <section>
              {/* Discovery preferences — set who you want to live with */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  <h2 className="text-lg font-bold">Your preferences</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Age preference slider */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-gray-700">
                      <Cake size={16} />
                      <span className="text-sm font-medium">Preferred age</span>
                    </div>
                    <AgeRangeSlider value={agePref} onChange={setAgePref} />
                  </div>

                  {/* Desired-roommate gender preference */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-gray-700">
                      <User size={16} />
                      <span className="text-sm font-medium">Show me</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {genderPreferences.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setGenderPref(g.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            genderPref === g.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {loading && profiles.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No housemates yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try a different group, or take the quiz to get matched.
                  </p>
                  <button
                    onClick={() => setActiveCategory('quiz')}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center"
                  >
                    <ClipboardList size={16} className="mr-1" />
                    Take the quiz
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map(p => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openProfile(p)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openProfile(p)
                        }
                      }}
                      className="text-left border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="p-4 flex items-center gap-4">
                        <img
                          src={
                            p.user?.avatarUrl ||
                            'https://via.placeholder.com/80?text=%20'
                          }
                          alt={`${p.user?.firstName || 'Housemate'}`}
                          className="w-16 h-16 rounded-full object-cover bg-gray-100"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <h3 className="font-semibold text-lg">
                              {p.user?.firstName} {p.user?.lastName}
                              {p.age ? (
                                <span className="font-normal text-gray-500">
                                  {', '}
                                  {p.age}
                                </span>
                              ) : null}
                            </h3>
                            {p.user?.verified && (
                              <CheckCircle
                                size={16}
                                className="text-blue-500"
                              />
                            )}
                          </div>
                          {p.occupation && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Briefcase size={14} className="mr-1" />
                              {p.occupation}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="flex items-center text-green-600 font-bold">
                            <Star size={14} className="fill-current mr-1" />
                            {p.compatibilityScore}%
                          </div>
                          <div className="text-[10px] text-gray-500">Match</div>
                        </div>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="mr-1" />
                          {p.location || 'Location flexible'}
                          {p.budgetMin && p.budgetMax
                            ? ` • $${p.budgetMin}–$${p.budgetMax}/mo`
                            : ''}
                        </div>
                        {p.bio && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {p.bio}
                          </p>
                        )}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {p.tags.map(tag => (
                              <span
                                key={tag}
                                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              openProfile(p)
                            }}
                            className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg flex items-center justify-center font-medium hover:bg-blue-50 transition-colors"
                          >
                            <User size={16} className="mr-1" />
                            View profile
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleConnect(p)
                            }}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
                          >
                            <MessageCircle size={16} className="mr-1" />
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Compatibility quiz */}
          {activeCategory === 'quiz' && (
            <section className="max-w-2xl">
              <h2 className="text-lg font-bold mb-1">
                What kind of housemate are you?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Ten quick questions — the factors research says actually cause
                housemate friction — power your Compatibility Score with
                everyone else. Your saved answers load automatically.
              </p>

              {/* About you — makes you discoverable in others' age/gender
                  preferences */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6 space-y-4">
                <div className="font-semibold text-gray-800">About you</div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Your age
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {aboutYou.age}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={AGE_FLOOR}
                    max={AGE_CEIL}
                    value={aboutYou.age}
                    aria-label="Your age"
                    onChange={e =>
                      setAboutYou(prev => ({
                        ...prev,
                        age: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Your gender
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {genderIdentities.map(g => (
                      <button
                        key={g.id}
                        onClick={() =>
                          setAboutYou(prev => ({ ...prev, gender: g.id }))
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          aboutYou.gender === g.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {quizQuestions.map(q => (
                  <div key={q.id}>
                    <div className="font-medium mb-2">{q.question}</div>
                    <div
                      className={`grid gap-3 ${
                        q.options.length === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-2'
                      }`}
                    >
                      {q.options.map(opt => {
                        const Icon = opt.icon
                        const selected = quizAnswers[q.id] === opt.value
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setQuizAnswers(prev => ({
                                ...prev,
                                [q.id]: opt.value,
                              }))
                            }
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                              selected
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon size={18} />
                            <span className="font-medium">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleSaveQuiz}
                  disabled={!quizComplete || saving}
                  className="bg-purple-600 text-white px-5 py-2.5 rounded-lg flex items-center font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <CheckCircle size={16} className="mr-1" />
                  )}
                  Save & see who fits
                  <ArrowRight size={16} className="ml-1" />
                </button>
                <span className="text-sm text-gray-500">
                  {Object.keys(quizAnswers).length} of {quizQuestions.length}{' '}
                  answered
                </span>
              </div>
            </section>
          )}
        </div>

        {/* Safe Search — always visible alongside every section */}
        <aside aria-label="Safe Search">
          <div className="lg:sticky lg:top-6 rounded-xl border border-orange-200 bg-orange-50/60 p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-orange-600" />
              <h2 className="text-lg font-bold">Safe Search</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your contact info stays private until you choose to share it. Keep
              this trust-first checklist in view as you search.
            </p>
            <ul className="space-y-3">
              {safetyTips.map(tip => (
                <li
                  key={tip}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white border border-orange-100"
                >
                  <ShieldCheck
                    size={18}
                    className="text-orange-600 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Full profile view */}
      <HousemateProfileModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onMessage={handleConnect}
        messaging={messaging}
        error={messageError}
      />
    </div>
  )
}

export default HousematesHub
