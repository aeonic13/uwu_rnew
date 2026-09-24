import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  GraduationCap,
  CalendarDays,
  Search,
  Home,
  Sparkles,
} from 'lucide-react'
import { quizQuestions, moveInOptions } from './housemateConfig'

const ABOUT_STEP = quizQuestions.length
const TOTAL_STEPS = quizQuestions.length + 1

const chip = active =>
  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white'
      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
  }`

/**
 * One question per screen, ten taps, then two quick facts (campus and
 * timing). Answers are saved when the last step is submitted, or any time
 * via "Save and finish later"; partial answers still score, just less
 * precisely.
 */
export default function QuizFlow({
  initialAnswers,
  initialAbout,
  saving,
  onSave,
  onCancel,
}) {
  const firstUnanswered = quizQuestions.findIndex(q => !initialAnswers?.[q.id])
  const [step, setStep] = useState(
    firstUnanswered === -1 ? ABOUT_STEP : firstUnanswered
  )
  const [answers, setAnswers] = useState(initialAnswers || {})
  const [about, setAbout] = useState({
    university: initialAbout?.university || '',
    moveInMonth: initialAbout?.moveInMonth || '',
    lookingForRoom: initialAbout?.lookingForRoom ?? null,
  })

  const answeredCount = quizQuestions.filter(q => answers[q.id]).length
  const isAbout = step === ABOUT_STEP
  const question = isAbout ? null : quizQuestions[step]

  const next = () => setStep(s => Math.min(s + 1, ABOUT_STEP))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const choose = value => {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
    next()
  }

  const finish = () => onSave(answers, about)

  return (
    <section className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
        <span>
          Step {step + 1} of {TOTAL_STEPS}
        </span>
        <span>
          {answeredCount} of {quizQuestions.length} answered
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-gray-200 mb-6 overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step + 1}
      >
        <div
          className="h-full bg-purple-600 transition-all"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 min-h-[280px]">
        {question ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {question.question}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Pick the one that is most true. You can change it later.
            </p>
            <div
              className={`grid gap-3 ${
                question.options.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {question.options.map(opt => {
                const Icon = opt.icon
                const selected = answers[question.id] === opt.value
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => choose(opt.value)}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                      selected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Two quick things
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              So the right people find you. Both are optional.
            </p>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="quiz-university"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"
                >
                  <GraduationCap size={16} />
                  University or area
                </label>
                <input
                  id="quiz-university"
                  type="text"
                  value={about.university}
                  maxLength={80}
                  placeholder="e.g. UC San Diego"
                  onChange={e =>
                    setAbout(prev => ({ ...prev, university: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="quiz-movein"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1"
                >
                  <CalendarDays size={16} />
                  When do you want to move in?
                </label>
                <select
                  id="quiz-movein"
                  value={about.moveInMonth}
                  onChange={e =>
                    setAbout(prev => ({ ...prev, moveInMonth: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Your situation
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAbout(prev => ({ ...prev, lookingForRoom: true }))
                    }
                    className={chip(about.lookingForRoom === true)}
                  >
                    <Search size={14} className="inline mr-1 -mt-0.5" />
                    Looking for a place
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAbout(prev => ({ ...prev, lookingForRoom: false }))
                    }
                    className={chip(about.lookingForRoom === false)}
                  >
                    <Home size={14} className="inline mr-1 -mt-0.5" />I have a
                    place to fill
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
          {question && (
            <button
              type="button"
              onClick={next}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Skip
            </button>
          )}
        </div>

        {isAbout ? (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg inline-flex items-center font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <Sparkles size={16} className="mr-1" />
            )}
            See my matches
          </button>
        ) : (
          answeredCount > 0 && (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              Save and finish later
              <ArrowRight size={14} className="ml-1" />
            </button>
          )
        )}
      </div>
    </section>
  )
}

QuizFlow.propTypes = {
  initialAnswers: PropTypes.object,
  initialAbout: PropTypes.shape({
    university: PropTypes.string,
    moveInMonth: PropTypes.string,
    lookingForRoom: PropTypes.bool,
  }),
  saving: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}
