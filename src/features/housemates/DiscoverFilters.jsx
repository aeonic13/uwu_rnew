import PropTypes from 'prop-types'
import { SlidersHorizontal, Cake, User, Home } from 'lucide-react'
import AgeRangeSlider from './AgeRangeSlider'
import AreaPicker from './AreaPicker'
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
 * see the viewer. Where = a city plus the neighborhoods in it.
 */
export default function DiscoverFilters({
  agePref,
  onAgePref,
  genderPref,
  onToggleGender,
  onClearGender,
  city,
  areas,
  onArea,
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

        <div className="md:col-span-2">
          <AreaPicker
            idPrefix="discover-area"
            label="Where"
            city={city}
            areas={areas}
            onChange={onArea}
            hint="Pick a city, then highlight the neighborhoods you would live in. People who are open to anywhere in the city still show up."
          />
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
  city: PropTypes.string,
  areas: PropTypes.arrayOf(PropTypes.string),
  onArea: PropTypes.func.isRequired,
  lookingFilter: PropTypes.string.isRequired,
  onLookingFilter: PropTypes.func.isRequired,
}
