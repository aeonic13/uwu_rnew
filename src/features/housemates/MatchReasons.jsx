import PropTypes from 'prop-types'
import { Check, Minus } from 'lucide-react'
import { matchReasons } from './housemateConfig'

/**
 * The two or three reasons behind a score, for cards: "You both: Very tidy ·
 * Early riser" and "Differs: Guests". Renders nothing without a breakdown.
 */
export default function MatchReasons({ breakdown, className = '' }) {
  const reasons = matchReasons(breakdown)
  if (!reasons || (reasons.shared.length === 0 && reasons.differs.length === 0))
    return null

  return (
    <div className={`space-y-1 text-xs ${className}`}>
      {reasons.shared.length > 0 && (
        <div className="flex items-start gap-1.5 text-green-700">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">You both:</span>{' '}
            {reasons.shared.join(' · ')}
            {reasons.sharedTotal > reasons.shared.length
              ? ` +${reasons.sharedTotal - reasons.shared.length}`
              : ''}
          </span>
        </div>
      )}
      {reasons.differs.length > 0 && (
        <div className="flex items-start gap-1.5 text-gray-500">
          <Minus size={14} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Differs:</span>{' '}
            {reasons.differs.join(' · ')}
            {reasons.differsTotal > reasons.differs.length
              ? ` +${reasons.differsTotal - reasons.differs.length}`
              : ''}
          </span>
        </div>
      )}
    </div>
  )
}

MatchReasons.propTypes = {
  breakdown: PropTypes.shape({
    shared: PropTypes.array,
    partial: PropTypes.array,
    differs: PropTypes.array,
    budget: PropTypes.string,
  }),
  className: PropTypes.string,
}
