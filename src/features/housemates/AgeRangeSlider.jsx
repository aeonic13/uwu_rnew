import PropTypes from 'prop-types'
import { AGE_FLOOR, AGE_CEIL } from './housemateConfig'

/**
 * Dual-handle age range slider (min–max). Two overlaid range inputs share a
 * track; only the thumbs are interactive. At the ceiling the range is
 * open-ended (75+), not capped at 75.
 */
export default function AgeRangeSlider({ value, onChange }) {
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
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-gray-200" />
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

AgeRangeSlider.propTypes = {
  value: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}
