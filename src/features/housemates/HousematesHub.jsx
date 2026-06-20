import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Users,
  ClipboardList,
  DoorOpen,
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
} from 'lucide-react'
import { housematesService } from '../../services/housematesService'

// Top-level categories for the Housemates tab. Kept intentionally simple and
// fully clickable: each switches the section shown below.
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
    description: 'Answer a few questions about how you live to power matching.',
    icon: ClipboardList,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    id: 'rooms',
    label: 'Browse Rooms',
    description: 'Find a room to fill, or one that fits you and a housemate.',
    icon: DoorOpen,
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    id: 'safety',
    label: 'Safe Search',
    description:
      'A trust-first checklist to keep your search safe and private.',
    icon: ShieldCheck,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
]

// Audience filters for the discovery feed. Housemates serves every stage of
// life, including students and grads.
const audiences = [
  { id: 'all', label: 'Everyone' },
  { id: 'professional', label: 'Young Professionals' },
  { id: 'student', label: 'Students & Grads' },
  { id: 'parent', label: 'Single Parents' },
  { id: 'remote', label: 'Remote Workers' },
  { id: 'retiree', label: 'Retirees' },
]

// Sample housemate profiles used as a fallback when the API is unavailable.
// Shaped exactly like the API response so the same render code works for both.
const sampleHousemates = [
  {
    id: 'sample-1',
    audience: 'professional',
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

// Sample room listings for the marketplace section.
const rooms = [
  {
    id: 'r1',
    title: 'Sunny room in 2BR apartment',
    location: 'Capitol Hill, Seattle',
    price: 1100,
    hint: 'Best for tidy night owls',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
  },
  {
    id: 'r2',
    title: 'Quiet room near downtown',
    location: 'East Austin, TX',
    price: 950,
    hint: 'Family-friendly building',
    image:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80',
  },
  {
    id: 'r3',
    title: 'Bright room, great for WFH',
    location: 'RiNo, Denver',
    price: 1050,
    hint: 'Fast wifi, quiet daytime',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
  },
]

// Compatibility quiz questions. Option values match the backend's expected
// lifestyle values (morning/night, very/relaxed, quiet/lively, rarely/often).
const quizQuestions = [
  {
    id: 'sleepSchedule',
    question: 'When are you most active?',
    options: [
      { value: 'morning', label: 'Early riser', icon: Sun },
      { value: 'night', label: 'Night owl', icon: Moon },
    ],
  },
  {
    id: 'cleanliness',
    question: 'How tidy is your ideal home?',
    options: [
      { value: 'very', label: 'Very tidy', icon: Sparkles },
      { value: 'relaxed', label: 'Relaxed', icon: Heart },
    ],
  },
  {
    id: 'noiseTolerance',
    question: 'How do you feel about noise at home?',
    options: [
      { value: 'quiet', label: 'Prefer quiet', icon: Moon },
      { value: 'lively', label: 'Lively is fine', icon: Users },
    ],
  },
  {
    id: 'guestFrequency',
    question: 'How often do you have guests over?',
    options: [
      { value: 'rarely', label: 'Rarely', icon: ShieldCheck },
      { value: 'often', label: 'Often', icon: Users },
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

function filterSample(audienceId) {
  if (audienceId === 'all') return sampleHousemates
  return sampleHousemates.filter(h => h.audience === audienceId)
}

/**
 * Housemates Hub - a people-first, compatibility-based matching tab. Categories
 * are simple and clickable. Data is loaded from the housemates API and falls
 * back to local sample data when the backend is unavailable.
 */
function HousematesHub() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('discover')
  const [audience, setAudience] = useState('all')
  const [quizAnswers, setQuizAnswers] = useState({})
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reloadFlag, setReloadFlag] = useState(false)

  // Load matches whenever the audience filter changes or a save triggers a
  // refresh. Falls back to sample data on error or empty results.
  useEffect(() => {
    let active = true

    const loadMatches = async () => {
      setLoading(true)
      try {
        const result = await housematesService.getMatches({ audience })
        if (!active) return
        setProfiles(
          result && result.length > 0 ? result : filterSample(audience)
        )
      } catch {
        if (active) setProfiles(filterSample(audience))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMatches()

    return () => {
      active = false
    }
  }, [audience, reloadFlag])

  const quizComplete = Object.keys(quizAnswers).length === quizQuestions.length

  const handleConnect = () => navigate('/messages')

  const handleSaveQuiz = async () => {
    setSaving(true)
    try {
      await housematesService.saveMyProfile(quizAnswers)
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Discover housemates */}
      {activeCategory === 'discover' && (
        <section>
          <h2 className="text-lg font-bold mb-3">
            For everyone, every stage of life
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {audiences.map(a => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  audience === a.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a.label}
              </button>
            ))}
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
              <p className="text-gray-500">
                Try a different group, or take the quiz to get matched.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
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
                        </h3>
                        {p.user?.verified && (
                          <CheckCircle size={16} className="text-blue-500" />
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
                    <button
                      onClick={handleConnect}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
                    >
                      <MessageCircle size={16} className="mr-1" />
                      Message for free
                    </button>
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
            A few quick questions power your Compatibility Score with everyone
            else.
          </p>

          <div className="space-y-6">
            {quizQuestions.map(q => (
              <div key={q.id}>
                <div className="font-medium mb-2">{q.question}</div>
                <div className="grid grid-cols-2 gap-3">
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

      {/* Browse rooms */}
      {activeCategory === 'rooms' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Housing marketplace</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 font-medium flex items-center hover:underline"
            >
              View all listings
              <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer"
                onClick={() => navigate('/listings')}
              >
                <img
                  src={room.image}
                  alt={room.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold line-clamp-1">{room.title}</h3>
                    <span className="text-green-600 font-bold whitespace-nowrap ml-2">
                      ${room.price}/mo
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="mr-1" />
                    {room.location}
                  </div>
                  <span className="inline-flex items-center text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                    <Sparkles size={12} className="mr-1" />
                    {room.hint}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Safe search */}
      {activeCategory === 'safety' && (
        <section className="max-w-2xl">
          <h2 className="text-lg font-bold mb-1">Safe, private search</h2>
          <p className="text-sm text-gray-600 mb-6">
            Your contact info stays private until you choose to share it. Use
            this trust-first checklist as you search.
          </p>
          <ul className="space-y-3">
            {safetyTips.map(tip => (
              <li
                key={tip}
                className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100"
              >
                <ShieldCheck
                  size={20}
                  className="text-orange-600 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default HousematesHub
