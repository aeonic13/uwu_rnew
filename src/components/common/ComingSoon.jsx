import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Hammer } from 'lucide-react'

/**
 * Honest placeholder for features that aren't wired to real data yet.
 * Used instead of shipping polished-but-fake screens (trust killer).
 */
export default function ComingSoon({ title, description }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <Hammer className="w-7 h-7 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mb-3">
          Coming soon
        </span>
        <p className="text-gray-600 mb-6">
          {description ||
            "We're building this now. It will appear here as soon as it's ready."}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to dashboard
        </button>
      </div>
    </div>
  )
}

ComingSoon.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
}
