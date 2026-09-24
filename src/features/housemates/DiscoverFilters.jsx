import PropTypes from 'prop-types'
import {
  SlidersHorizontal,
  Cake,
  User,
  GraduationCap,
  Home,
} from 'lucide-react'
import AgeRangeSlider from './AgeRangeSlider'
import {
  genderPreferenceOptions,
  lookingFilterOptions,
} from './housemateConfig'

const chip = active =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`

/**
 * Discovery preferences. Age and gender are mutual: they also decide who can
 * see the viewer. University is Rentra's locality signal for students.
 */
export default function DiscoverFilters({
  agePref,
  onAgePref,
  genderPref,
  onToggleGender,
  onClearGender,
  university,
  onUniversity,
  lookingFilter,
  onLookingFilter,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal size={18} className="text-blue-600" />
        <h2 className="text-base font-bold">Who you want to live with</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Age and gender preferences work both ways: people outside someone&apos;s
        preferences never see their profile.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-gray-700">
            <Cake size={16} />
            <span className="text-sm font-medium">Preferred age</span>
          </div>
          <AgeRangeSlider value={agePref} onChange={onAgePref} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-gray-700">
            <User size={16} />
            <span className="text-sm font-medium">Show me</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClearGender}
              className={chip(genderPref.length === 0)}
            >
              Everyone
            </button>
            {genderPreferenceOptions.map(g => (
              <button
                type="button"
                key={g.id}
                onClick={() => onToggleGender(g.id)}
                className={chip(genderPref.includes(g.id))}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="university-filter"
            className="flex items-center gap-1.5 mb-2 text-gray-700"
          >
            <GraduationCap size={16} />
            <span className="text-sm font-medium">University or area</span>
          </label>
          <input
            id="university-filter"
            type="text"
            value={university}
            placeholder="e.g. UC San Diego"
            maxLength={80}
            onChange={e => onUniversity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-gray-700">
            <Home size={16} />
            <span className="text-sm font-medium">Show people who are</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lookingFilterOptions.map(opt => (
              <button
                type="button"
                key={opt.id}
                onClick={() => onLookingFilter(opt.id)}
                className={chip(lookingFilter === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

DiscoverFilters.propTypes = {
  agePref: PropTypes.shape({ min: PropTypes.number, max: PropTypes.number })
    .isRequired,
  onAgePref: PropTypes.func.isRequired,
  genderPref: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleGender: PropTypes.func.isRequired,
  onClearGender: PropTypes.func.isRequired,
  university: PropTypes.string.isRequired,
  onUniversity: PropTypes.func.isRequired,
  lookingFilter: PropTypes.string.isRequired,
  onLookingFilter: PropTypes.func.isRequired,
}
