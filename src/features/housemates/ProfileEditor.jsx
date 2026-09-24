import PropTypes from 'prop-types'
import {
  User,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  Trash2,
  ClipboardList,
} from 'lucide-react'
import {
  AGE_FLOOR,
  AGE_CEIL,
  genderIdentities,
  moveInOptions,
  quizQuestions,
} from './housemateConfig'

const chip = active =>
  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
  }`

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

/**
 * "My profile": everything others see on your card, plus visibility
 * controls. The lifestyle answers live in the quiz flow; this links to it.
 */
export default function ProfileEditor({
  value,
  onChange,
  onSave,
  saving,
  onPreview,
  onRetakeQuiz,
  answeredCount,
  profileMeta,
  onToggleActive,
  togglingActive,
  onDelete,
  deleteConfirm,
  onCancelDelete,
  deleting,
}) {
  const set = patch => onChange({ ...value, ...patch })

  return (
    <section className="max-w-2xl">
      <h2 className="text-lg font-bold mb-1">My housemate profile</h2>
      <p className="text-sm text-gray-600 mb-6">
        What people see on your card. Your quiz answers power the match score.
      </p>

      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 mb-6 flex items-center justify-between gap-4">
        <div className="text-sm">
          <p className="font-medium text-purple-900">
            Compatibility quiz: {answeredCount} of {quizQuestions.length}{' '}
            answered
          </p>
          <p className="text-purple-800/80">
            {answeredCount === quizQuestions.length
              ? 'All ten answered. Scores are as accurate as they get.'
              : 'Answer all ten for the most accurate scores.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetakeQuiz}
          className="shrink-0 inline-flex items-center bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <ClipboardList size={14} className="mr-1" />
          {answeredCount > 0 ? 'Edit answers' : 'Take the quiz'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Your age</span>
            <span
              className={`text-sm font-semibold ${
                value.age != null ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {value.age != null ? value.age : 'Not set'}
            </span>
          </div>
          <input
            type="range"
            min={AGE_FLOOR}
            max={AGE_CEIL}
            value={value.age ?? 25}
            aria-label="Your age"
            onChange={e => set({ age: Number(e.target.value) })}
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
                type="button"
                key={g.id}
                onClick={() => set({ gender: g.id })}
                className={chip(value.gender === g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Your situation
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set({ lookingForRoom: true })}
              className={chip(value.lookingForRoom === true)}
            >
              I&apos;m looking for a place
            </button>
            <button
              type="button"
              onClick={() => set({ lookingForRoom: false })}
              className={chip(value.lookingForRoom === false)}
            >
              I have a place to fill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Occupation
            </label>
            <input
              type="text"
              value={value.occupation}
              placeholder="e.g. Nurse, CS Student"
              maxLength={80}
              onChange={e => set({ occupation: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              University or area
            </label>
            <input
              type="text"
              value={value.university}
              placeholder="e.g. UC San Diego"
              maxLength={80}
              onChange={e => set({ university: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              City or neighborhood
            </label>
            <input
              type="text"
              value={value.location}
              placeholder="e.g. La Jolla, CA"
              maxLength={80}
              onChange={e => set({ location: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label
              htmlFor="profile-movein"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Move-in
            </label>
            <select
              id="profile-movein"
              value={value.moveInMonth}
              onChange={e => set({ moveInMonth: e.target.value })}
              className={`${input} bg-white`}
            >
              <option value="">Not sure yet</option>
              {moveInOptions().map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Budget min ($/mo)
            </label>
            <input
              type="number"
              min="0"
              value={value.budgetMin}
              placeholder="800"
              onChange={e => set({ budgetMin: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Budget max ($/mo)
            </label>
            <input
              type="number"
              min="0"
              value={value.budgetMax}
              placeholder="1200"
              onChange={e => set({ budgetMax: e.target.value })}
              className={input}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Short bio
            </label>
            <span className="text-xs text-gray-400">
              {value.bio.length}/280
            </span>
          </div>
          <textarea
            rows={3}
            value={value.bio}
            maxLength={280}
            placeholder="A couple of sentences on who you are and what you're looking for in a home."
            onChange={e => set({ bio: e.target.value })}
            className={`${input} resize-none`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg inline-flex items-center font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <CheckCircle size={16} className="mr-1" />
            )}
            Save profile
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <User size={16} className="mr-1" />
            Preview my profile
          </button>
        </div>
      </div>

      {profileMeta.exists && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
          <div className="font-semibold text-gray-800 mb-1">
            Profile visibility
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {profileMeta.active
              ? 'Your profile is visible to people whose preferences you match.'
              : 'Your profile is paused. Nobody can find you in discovery.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleActive}
              disabled={togglingActive}
              className="inline-flex items-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {togglingActive ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : profileMeta.active ? (
                <Pause size={14} className="mr-1" />
              ) : (
                <Play size={14} className="mr-1" />
              )}
              {profileMeta.active ? 'Pause my profile' : 'Resume my profile'}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                deleteConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {deleting ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Trash2 size={14} className="mr-1" />
              )}
              {deleteConfirm ? 'Confirm permanent delete' : 'Delete my profile'}
            </button>
            {deleteConfirm && !deleting && (
              <button
                type="button"
                onClick={onCancelDelete}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

ProfileEditor.propTypes = {
  value: PropTypes.shape({
    age: PropTypes.number,
    gender: PropTypes.string,
    occupation: PropTypes.string,
    university: PropTypes.string,
    location: PropTypes.string,
    moveInMonth: PropTypes.string,
    budgetMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    budgetMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bio: PropTypes.string,
    lookingForRoom: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  onPreview: PropTypes.func.isRequired,
  onRetakeQuiz: PropTypes.func.isRequired,
  answeredCount: PropTypes.number.isRequired,
  profileMeta: PropTypes.shape({
    exists: PropTypes.bool,
    active: PropTypes.bool,
  }).isRequired,
  onToggleActive: PropTypes.func.isRequired,
  togglingActive: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
  deleteConfirm: PropTypes.bool,
  onCancelDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
}
