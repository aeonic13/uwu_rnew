import { useState } from 'react'
import PropTypes from 'prop-types'
import { MapPin } from 'lucide-react'
import {
  CITIES,
  OTHER_CITY,
  areasFor,
  isListedCity,
  MAX_AREAS,
} from './areaConfig'

const chip = active =>
  `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`

/**
 * City, then the neighborhoods in it someone would consider. Cities in the
 * list get chips; any other city is free text with no chips. An empty
 * area selection means "anywhere in the city".
 */
export default function AreaPicker({
  city,
  areas,
  onChange,
  idPrefix = 'area',
  label = 'Where',
  hint,
}) {
  const listed = isListedCity(city)
  // Free-text mode persists while the person is typing an unlisted city.
  const [otherMode, setOtherMode] = useState(Boolean(city) && !listed)
  const options = areasFor(city)
  const selected = Array.isArray(areas) ? areas : []

  const pickCity = value => {
    if (value === OTHER_CITY) {
      setOtherMode(true)
      onChange({ city: '', areas: [] })
      return
    }
    setOtherMode(false)
    onChange({ city: value, areas: [] })
  }

  const toggleArea = area => {
    const next = selected.includes(area)
      ? selected.filter(a => a !== area)
      : selected.length >= MAX_AREAS
        ? selected
        : [...selected, area]
    onChange({ city, areas: next })
  }

  const selectValue = otherMode ? OTHER_CITY : listed ? city : ''

  return (
    <div data-testid={`${idPrefix}-picker`}>
      <label
        htmlFor={`${idPrefix}-city`}
        className="flex items-center gap-1.5 mb-2 text-gray-700"
      >
        <MapPin size={16} />
        <span className="text-sm font-medium">{label}</span>
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          id={`${idPrefix}-city`}
          value={selectValue}
          onChange={e => pickCity(e.target.value)}
          className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any city</option>
          {CITIES.map(c => (
            <option key={c.name} value={c.name}>
              {c.name}, {c.state}
            </option>
          ))}
          <option value={OTHER_CITY}>Other city…</option>
        </select>
        {otherMode && (
          <input
            id={`${idPrefix}-city-other`}
            type="text"
            value={city || ''}
            maxLength={80}
            placeholder="City name"
            aria-label="Other city"
            onChange={e => onChange({ city: e.target.value, areas: [] })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {listed && options.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              Areas in {city}
              {selected.length ? ` · ${selected.length} selected` : ''}
            </span>
            <button
              type="button"
              onClick={() => onChange({ city, areas: [] })}
              className={chip(selected.length === 0)}
            >
              Anywhere in {city}
            </button>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={`Areas in ${city}`}
          >
            {options.map(area => (
              <button
                type="button"
                key={area}
                onClick={() => toggleArea(area)}
                aria-pressed={selected.includes(area)}
                className={chip(selected.includes(area))}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}
      {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
    </div>
  )
}

AreaPicker.propTypes = {
  city: PropTypes.string,
  areas: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  idPrefix: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
}
