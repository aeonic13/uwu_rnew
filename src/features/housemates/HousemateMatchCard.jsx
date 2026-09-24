import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Star, Sparkles, GraduationCap, CalendarDays } from 'lucide-react'
import { housematesService } from '../../services/housematesService'
import MatchReasons from './MatchReasons'
import { formatMoveIn } from './housemateConfig'

/**
 * Context card at the top of a direct-message thread when the other person
 * has a housemate profile: score, the reasons behind it, campus and timing.
 * Mirrors the property card that listing threads get. Renders nothing when
 * there is no profile, so ordinary threads are untouched.
 */
export default function HousemateMatchCard({ userId }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId) return undefined
    let active = true
    housematesService
      .getByUser(userId)
      .then(res => {
        if (active) setData(res)
      })
      .catch(() => {
        if (active) setData({ profile: null })
      })
    return () => {
      active = false
    }
  }, [userId])

  const profile = data?.profile
  if (!profile) return null

  const university = profile.university || profile.user?.university || null
  const moveIn = formatMoveIn(profile.moveInMonth)
  const firstName = profile.user?.firstName || 'They'

  return (
    <div
      data-testid="housemate-match-card"
      className="mb-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 flex items-center">
            <Sparkles size={12} className="mr-1" />
            Housemate match
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {university && (
              <span
                className={`inline-flex items-center ${
                  profile.sameUniversity ? 'text-green-700 font-medium' : ''
                }`}
              >
                <GraduationCap size={12} className="mr-1" />
                {profile.sameUniversity ? 'Same university' : university}
              </span>
            )}
            {moveIn && (
              <span className="inline-flex items-center">
                <CalendarDays size={12} className="mr-1" />
                Move in {moveIn}
              </span>
            )}
            {profile.lookingForRoom != null && (
              <span>
                {profile.lookingForRoom ? 'Looking for a place' : 'Has a place'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {profile.compatibilityScore != null ? (
            <>
              <div className="flex items-center justify-end text-green-600 font-bold text-lg leading-none">
                <Star size={14} className="fill-current mr-1" />
                {profile.compatibilityScore}%
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">match</div>
            </>
          ) : (
            <Link
              to="/housemates"
              className="text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              {data.viewerHasProfile
                ? 'Finish the quiz to see your match'
                : `Take the quiz to see your match with ${firstName}`}
            </Link>
          )}
        </div>
      </div>
      <MatchReasons breakdown={profile.matchBreakdown} className="mt-2" />
    </div>
  )
}

HousemateMatchCard.propTypes = {
  userId: PropTypes.string,
}
