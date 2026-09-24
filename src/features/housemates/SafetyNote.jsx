import { useState } from 'react'
import PropTypes from 'prop-types'
import { ShieldCheck, X } from 'lucide-react'
import { safetyTips } from './housemateConfig'

const STORAGE_KEY = 'rentra.housemates.safetyNoteDismissed'

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * One-time trust banner above the feed. Dismissal is a per-browser
 * convenience; the same tips stay available in every profile view.
 */
export default function SafetyNote({ compact = false }) {
  const [dismissed, setDismissed] = useState(readDismissed)

  if (compact) {
    return (
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer inline-flex items-center gap-1 hover:text-gray-700">
          <ShieldCheck size={14} />
          Staying safe
        </summary>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          {safetyTips.map(tip => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </details>
    )
  }

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode or blocked storage: the banner just comes back next time.
    }
  }

  return (
    <div
      role="note"
      aria-label="Safety reminders"
      className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3"
    >
      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" />
      <div className="flex-1">
        <p className="font-medium">Your contact info stays private.</p>
        <p className="text-blue-800/90">
          Meet in public first, never pay before you have seen a place, and use
          Block or Report on anyone who makes you uncomfortable.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss safety reminders"
        className="p-1 rounded-full hover:bg-blue-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}

SafetyNote.propTypes = {
  compact: PropTypes.bool,
}
