import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Users,
  ClipboardList,
  UserCircle,
  Loader2,
  Mail,
} from 'lucide-react'
import { housematesService } from '../../services/housematesService'
import { messagingService } from '../../services/messagingService'
import { useAuth } from '../../contexts/AuthContext'
import {
  AGE_CEIL,
  DEFAULT_AGE_PREF,
  FILTER_DEBOUNCE_MS,
  PAGE_SIZE,
  genderPrefToIdentity,
  quizQuestions,
} from './housemateConfig'
import DiscoverFilters from './DiscoverFilters'
import HousemateCard from './HousemateCard'
import HousemateProfileModal from './HousemateProfileModal'
import QuizFlow from './QuizFlow'
import ProfileEditor from './ProfileEditor'
import SafetyNote from './SafetyNote'

const TABS = [
  { id: 'discover', label: 'Discover', icon: Users },
  { id: 'quiz', label: 'Compatibility quiz', icon: ClipboardList },
  { id: 'profile', label: 'My profile', icon: UserCircle },
]

const EMPTY_ABOUT = {
  age: null,
  gender: '',
  occupation: '',
  university: '',
  location: '',
  moveInMonth: '',
  budgetMin: '',
  budgetMax: '',
  bio: '',
  lookingForRoom: null,
}

const toInt = v => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

/**
 * Honest empty feed. No invented example people: it says who is (not) here
 * yet and what happens next, and points at the quiz when the viewer has no
 * profile of their own to be matched against.
 */
function DiscoverEmpty({
  hasProfile,
  university,
  filtersActive,
  onTakeQuiz,
  onWiden,
}) {
  const near = university ? ` near ${university}` : ''
  const canWiden = filtersActive || Boolean(university)
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 bg-white">
      <Users size={44} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {filtersActive
          ? 'No one matches those filters yet'
          : hasProfile
            ? 'No housemates here yet'
            : 'You are early'}
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-5">
        {hasProfile ? (
          <>
            <Mail size={14} className="inline mr-1 -mt-0.5" />
            We will email you the moment a match{near} joins.
          </>
        ) : (
          <>
            Take the two-minute quiz and you will be first in the feed of
            everyone who joins{near}. We email you the moment a match appears.
          </>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {!hasProfile && (
          <button
            type="button"
            onClick={onTakeQuiz}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center"
          >
            <ClipboardList size={16} className="mr-1" />
            Take the quiz
          </button>
        )}
        {canWiden && (
          <button
            type="button"
            onClick={onWiden}
            className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {filtersActive ? 'Widen filters' : 'Search everywhere'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Housemates Hub. Compatibility-first discovery of people to live with,
 * wired to Groups so a good match turns into a joint application.
 */
function HousematesHub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('discover')

  // Discovery preferences. Age and gender double as consent settings.
  const [agePref, setAgePref] = useState(DEFAULT_AGE_PREF)
  const [genderPref, setGenderPref] = useState([])
  const [universityFilter, setUniversityFilter] = useState('')
  const [lookingFilter, setLookingFilter] = useState('any')

  const [quizAnswers, setQuizAnswers] = useState({})
  const [aboutYou, setAboutYou] = useState(EMPTY_ABOUT)

  const [profiles, setProfiles] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [viewerHasQuiz, setViewerHasQuiz] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reloadFlag, setReloadFlag] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [myProfileMeta, setMyProfileMeta] = useState({
    exists: false,
    active: true,
  })
  const [togglingActive, setTogglingActive] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isPreview, setIsPreview] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [messageError, setMessageError] = useState('')

  const filterParams = () => ({
    ageMin: agePref.min,
    ageMax: agePref.max >= AGE_CEIL ? null : agePref.max,
    genders: genderPref,
    university: universityFilter,
    lookingForRoom: lookingFilter === 'any' ? null : lookingFilter,
  })

  // Load matches whenever the discovery preferences change or a save
  // triggers a refresh. Debounced so slider drags and typing fire one
  // request, not dozens.
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const result = await housematesService.getMatches({
          ageMin: agePref.min,
          ageMax: agePref.max >= AGE_CEIL ? null : agePref.max,
          genders: genderPref,
          university: universityFilter,
          lookingForRoom: lookingFilter === 'any' ? null : lookingFilter,
          limit: PAGE_SIZE,
          offset: 0,
        })
        if (!active) return
        setViewerHasQuiz(result.viewerHasQuiz)
        setProfiles(result.profiles)
        setHasMore(result.hasMore)
      } catch {
        if (active) {
          setProfiles([])
          setHasMore(false)
        }
      } finally {
        if (active) setLoading(false)
      }
    }, FILTER_DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [agePref, genderPref, universityFilter, lookingFilter, reloadFlag])

  // Preload the saved profile so returning users edit what they set before.
  // The university filter defaults to their campus, from the profile or
  // the account.
  useEffect(() => {
    let active = true
    housematesService
      .getMyProfile()
      .then(profile => {
        if (!active) return
        const campus = profile?.university || user?.university || ''
        setUniversityFilter(prev => prev || campus)
        if (!profile) return
        setMyProfileMeta({ exists: true, active: profile.active !== false })
        const saved = {}
        for (const q of quizQuestions) {
          if (profile[q.id]) saved[q.id] = profile[q.id]
        }
        setQuizAnswers(prev => ({ ...saved, ...prev }))
        setAboutYou(prev => ({
          age: profile.age ?? prev.age,
          gender: profile.gender ?? prev.gender,
          occupation: profile.occupation ?? prev.occupation,
          university: profile.university ?? prev.university,
          location: profile.location ?? prev.location,
          moveInMonth: profile.moveInMonth ?? prev.moveInMonth,
          budgetMin: profile.budgetMin ?? prev.budgetMin,
          budgetMax: profile.budgetMax ?? prev.budgetMax,
          bio: profile.bio ?? prev.bio,
          lookingForRoom: profile.lookingForRoom ?? prev.lookingForRoom,
        }))
        if (
          profile.agePreferenceMin != null ||
          profile.agePreferenceMax != null
        ) {
          setAgePref({
            min: profile.agePreferenceMin ?? DEFAULT_AGE_PREF.min,
            max: profile.agePreferenceMax ?? DEFAULT_AGE_PREF.max,
          })
        }
        if (
          profile.genderPreference &&
          profile.genderPreference !== 'everyone'
        ) {
          setGenderPref(
            profile.genderPreference
              .split(',')
              .map(part => part.trim())
              .filter(id => genderPrefToIdentity[id])
          )
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProfileLoaded(true)
      })
    return () => {
      active = false
    }
    // Mount-only: user is loaded before this page renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const answeredCount = quizQuestions.filter(q => quizAnswers[q.id]).length
  // The university is context (prefilled from the account), not a
  // narrowing choice, so it does not count as an active filter here.
  const filtersActive =
    genderPref.length > 0 ||
    lookingFilter !== 'any' ||
    agePref.min !== DEFAULT_AGE_PREF.min ||
    agePref.max !== DEFAULT_AGE_PREF.max

  const toggleGenderPref = id =>
    setGenderPref(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )

  const widenFilters = () => {
    setGenderPref([])
    setLookingFilter('any')
    setAgePref(DEFAULT_AGE_PREF)
    setUniversityFilter('')
  }

  const openProfile = profile => {
    setMessageError('')
    setIsPreview(false)
    setSelectedProfile(profile)
  }

  // The current user's profile as others see it, from the live draft.
  const openMyPreview = () => {
    setMessageError('')
    setIsPreview(true)
    setSelectedProfile({
      id: 'me-preview',
      ...quizAnswers,
      age: aboutYou.age,
      gender: aboutYou.gender || null,
      occupation: aboutYou.occupation || null,
      university: aboutYou.university || user?.university || null,
      location: aboutYou.location || null,
      moveInMonth: aboutYou.moveInMonth || null,
      budgetMin: toInt(aboutYou.budgetMin),
      budgetMax: toInt(aboutYou.budgetMax),
      bio: aboutYou.bio || null,
      lookingForRoom: aboutYou.lookingForRoom,
      tags: [],
      user: {
        firstName: user?.firstName || 'You',
        lastName: user?.lastName || '',
        avatarUrl: user?.avatarUrl || null,
        verified: user?.verified || false,
      },
    })
  }

  // Start a real conversation with this housemate and land in that thread.
  const handleConnect = async profile => {
    const recipientId = profile?.user?.id
    if (!recipientId) {
      setSelectedProfile(profile)
      setMessageError('This profile cannot be messaged.')
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

  const handleBlock = async profile => {
    setMessageError('')
    try {
      await housematesService.blockProfile(profile.id)
      setProfiles(prev => prev.filter(p => p.id !== profile.id))
      setSelectedProfile(null)
    } catch {
      setMessageError('Could not block this person. Please try again.')
    }
  }

  const handleReport = (profile, report) =>
    housematesService.reportProfile(profile.id, report)

  // One save path for the quiz and the editor. Empty strings for the free
  // text fields clear the value (null); untouched numbers stay unset.
  const saveProfile = async (answers, about) => {
    const text = v => (v === '' ? null : v)
    setSaving(true)
    try {
      await housematesService.saveMyProfile({
        ...answers,
        age: about.age ?? undefined,
        gender: about.gender || undefined,
        occupation: text(about.occupation) ?? undefined,
        university: text(about.university),
        location: text(about.location),
        moveInMonth: text(about.moveInMonth),
        budgetMin: about.budgetMin === '' ? undefined : about.budgetMin,
        budgetMax: about.budgetMax === '' ? undefined : about.budgetMax,
        bio: about.bio || undefined,
        lookingForRoom: about.lookingForRoom ?? undefined,
        agePreferenceMin: agePref.min,
        agePreferenceMax: agePref.max >= AGE_CEIL ? null : agePref.max,
        genderPreference:
          genderPref.length > 0 ? genderPref.join(',') : 'everyone',
      })
      setMyProfileMeta(prev => ({
        exists: true,
        active: prev.exists ? prev.active : true,
      }))
    } catch {
      // Best-effort: the feed still reloads and the draft stays in state.
    }
    setSaving(false)
    setReloadFlag(flag => !flag)
  }

  const handleQuizSave = async (answers, about) => {
    const merged = { ...aboutYou, ...about }
    setQuizAnswers(answers)
    setAboutYou(merged)
    await saveProfile(answers, merged)
    if (merged.university)
      setUniversityFilter(prev => prev || merged.university)
    setActiveTab('discover')
  }

  const handleEditorSave = async () => {
    await saveProfile(quizAnswers, aboutYou)
  }

  const handleToggleActive = async () => {
    const next = !myProfileMeta.active
    setTogglingActive(true)
    try {
      await housematesService.saveMyProfile({ active: next })
      setMyProfileMeta({ exists: true, active: next })
    } catch {
      // Leave state as-is; the next attempt can retry.
    }
    setTogglingActive(false)
  }

  const handleDeleteProfile = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleting(true)
    try {
      await housematesService.deleteMyProfile()
      setMyProfileMeta({ exists: false, active: true })
      setQuizAnswers({})
      setDeleteConfirm(false)
    } catch {
      // Keep the confirm state so the user can retry.
    }
    setDeleting(false)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const result = await housematesService.getMatches({
        ...filterParams(),
        limit: PAGE_SIZE,
        offset: profiles.length,
      })
      setProfiles(prev => [...prev, ...result.profiles])
      setHasMore(result.hasMore)
    } catch {
      // Keep what we have; the button stays for a retry.
    }
    setLoadingMore(false)
  }

  const goQuiz = () => setActiveTab('quiz')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sm:p-7 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={26} />
              <h1 className="text-2xl sm:text-3xl font-bold">Housemates</h1>
            </div>
            <p className="text-blue-50 max-w-xl">
              Find people you would actually live well with, see why you match,
              then apply for a place together.
            </p>
          </div>
          {profileLoaded &&
            (!viewerHasQuiz || !myProfileMeta.exists ? (
              <button
                type="button"
                onClick={goQuiz}
                className="shrink-0 bg-white text-purple-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-flex items-center"
              >
                <ClipboardList size={16} className="mr-1.5" />
                Take the 2-minute quiz
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="shrink-0 bg-white/15 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/25 transition-colors"
              >
                Edit my profile
              </button>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-2 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} className="mr-1.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'discover' && (
        <section>
          <SafetyNote />
          <DiscoverFilters
            agePref={agePref}
            onAgePref={setAgePref}
            genderPref={genderPref}
            onToggleGender={toggleGenderPref}
            onClearGender={() => setGenderPref([])}
            university={universityFilter}
            onUniversity={setUniversityFilter}
            lookingFilter={lookingFilter}
            onLookingFilter={setLookingFilter}
          />

          {!viewerHasQuiz && !loading && profiles.length > 0 && (
            <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800 flex items-center justify-between gap-4">
              <span>
                Take the compatibility quiz to see your real match score with
                everyone here.
              </span>
              <button
                type="button"
                onClick={goQuiz}
                className="flex-shrink-0 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Take the quiz
              </button>
            </div>
          )}

          {loading && profiles.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : profiles.length === 0 ? (
            <DiscoverEmpty
              hasProfile={myProfileMeta.exists}
              university={universityFilter}
              filtersActive={filtersActive}
              onTakeQuiz={goQuiz}
              onWiden={widenFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {profiles.map(p => (
                  <HousemateCard
                    key={p.id}
                    profile={p}
                    onOpen={openProfile}
                    onMessage={handleConnect}
                    onTakeQuiz={goQuiz}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loadingMore && (
                      <Loader2 size={16} className="mr-1 animate-spin" />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {activeTab === 'quiz' && (
        <QuizFlow
          key={`${myProfileMeta.exists}-${answeredCount}`}
          initialAnswers={quizAnswers}
          initialAbout={{
            university: aboutYou.university || user?.university || '',
            moveInMonth: aboutYou.moveInMonth,
            lookingForRoom: aboutYou.lookingForRoom,
          }}
          saving={saving}
          onSave={handleQuizSave}
          onCancel={() => setActiveTab('discover')}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileEditor
          value={aboutYou}
          onChange={setAboutYou}
          onSave={handleEditorSave}
          saving={saving}
          onPreview={openMyPreview}
          onRetakeQuiz={goQuiz}
          answeredCount={answeredCount}
          profileMeta={myProfileMeta}
          onToggleActive={handleToggleActive}
          togglingActive={togglingActive}
          onDelete={handleDeleteProfile}
          deleteConfirm={deleteConfirm}
          onCancelDelete={() => setDeleteConfirm(false)}
          deleting={deleting}
        />
      )}

      {/* Keyed by profile id so switching profiles remounts the modal and
          resets its safety-control state. */}
      <HousemateProfileModal
        key={selectedProfile?.id || 'closed'}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onMessage={handleConnect}
        onBlock={handleBlock}
        onReport={handleReport}
        onTakeQuiz={() => {
          setSelectedProfile(null)
          goQuiz()
        }}
        messaging={messaging}
        error={messageError}
        preview={isPreview}
      />
    </div>
  )
}

export default HousematesHub
