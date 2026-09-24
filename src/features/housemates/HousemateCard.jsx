import PropTypes from 'prop-types'
import {
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  MessageCircle,
  User,
  GraduationCap,
  CalendarDays,
  Search,
  Home,
} from 'lucide-react'
import MatchReasons from './MatchReasons'
import { formatMoveIn } from './housemateConfig'

/**
 * One person in the discovery feed. Leads with the things that decide
 * whether someone reaches out: score with reasons, campus, timing, budget.
 */
export default function HousemateCard({
  profile: p,
  onOpen,
  onMessage,
  onTakeQuiz,
}) {
  const name =
    `${p.user?.firstName || 'Housemate'} ${p.user?.lastName || ''}`.trim()
  const university = p.university || p.user?.university || null
  const moveIn = formatMoveIn(p.moveInMonth)
  const budget =
    p.budgetMin && p.budgetMax ? `$${p.budgetMin}–$${p.budgetMax}/mo` : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(p)
        }
      }}
      className="text-left border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col"
    >
      <div className="p-4 flex items-start gap-3">
        <img
          src={p.user?.avatarUrl || 'https://via.placeholder.com/80?text=%20'}
          alt={name}
          className="w-14 h-14 rounded-full object-cover bg-gray-100 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-base truncate">
              {name}
              {p.age ? (
                <span className="font-normal text-gray-500">, {p.age}</span>
              ) : null}
            </h3>
            {p.user?.verified && (
              <span title="Email confirmed">
                <CheckCircle size={15} className="text-blue-500 shrink-0" />
              </span>
            )}
          </div>
          {p.occupation && (
            <div className="flex items-center text-sm text-gray-600 truncate">
              <Briefcase size={13} className="mr-1 shrink-0" />
              {p.occupation}
            </div>
          )}
          {university && (
            <div
              className={`mt-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                p.sameUniversity
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <GraduationCap size={12} className="mr-1" />
              {p.sameUniversity ? 'Same university' : university}
            </div>
          )}
        </div>
        <div className="text-center shrink-0 max-w-[88px]">
          {p.compatibilityScore != null ? (
            <>
              <div className="flex items-center justify-center text-green-600 font-bold text-lg leading-none">
                <Star size={14} className="fill-current mr-1" />
                {p.compatibilityScore}%
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">match</div>
            </>
          ) : (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onTakeQuiz()
              }}
              className="text-[11px] font-medium leading-tight text-purple-600 hover:text-purple-700"
            >
              Take the quiz to see your match
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col">
        <MatchReasons breakdown={p.matchBreakdown} className="mb-3" />

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-2">
          {p.lookingForRoom != null && (
            <span className="inline-flex items-center">
              {p.lookingForRoom ? (
                <Search size={12} className="mr-1" />
              ) : (
                <Home size={12} className="mr-1" />
              )}
              {p.lookingForRoom ? 'Looking for a place' : 'Has a place'}
            </span>
          )}
          {moveIn && (
            <span className="inline-flex items-center">
              <CalendarDays size={12} className="mr-1" />
              Move in {moveIn}
            </span>
          )}
          <span className="inline-flex items-center">
            <MapPin size={12} className="mr-1" />
            {p.location || 'Location flexible'}
          </span>
          {budget && (
            <span className="font-medium text-gray-800">{budget}</span>
          )}
        </div>

        {p.bio && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{p.bio}</p>
        )}

        <div className="flex gap-2 mt-auto">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpen(p)
            }}
            className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            <User size={15} className="mr-1" />
            View profile
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onMessage(p)
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <MessageCircle size={15} className="mr-1" />
            Message
          </button>
        </div>
      </div>
    </div>
  )
}

HousemateCard.propTypes = {
  profile: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onTakeQuiz: PropTypes.func.isRequired,
}
