import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { ClipboardCheck, ChevronRight } from 'lucide-react'
import { money, shortDate } from '../owner/property/statusMeta'
import { TYPE_LABEL, STATUS_META, summaryLine } from './inspectionMeta'

/** One report as a list row linking to its editor. */
export default function InspectionRow({ inspection, to }) {
  const status = STATUS_META[inspection.status] || STATUS_META.draft
  const when =
    inspection.status === 'completed'
      ? `Completed ${shortDate(inspection.completedAt)}`
      : inspection.conductedAt
        ? `Conducted ${shortDate(inspection.conductedAt)}`
        : `Started ${shortDate(inspection.createdAt)}`
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 p-4 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
      >
        <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900">
              {TYPE_LABEL[inspection.type] || 'Inspection'} report
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {when} · {summaryLine(inspection, money)}
          </span>
        </span>
        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
      </Link>
    </li>
  )
}

InspectionRow.propTypes = {
  inspection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    conductedAt: PropTypes.string,
    completedAt: PropTypes.string,
    createdAt: PropTypes.string,
    itemCount: PropTypes.number,
    damagedCount: PropTypes.number,
    estimatedTotal: PropTypes.number,
  }).isRequired,
  to: PropTypes.string.isRequired,
}
