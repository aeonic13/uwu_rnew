import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { ClipboardCheck, LogIn, LogOut } from 'lucide-react'
import { inspectionsService } from '../../../services/inspectionsService'
import { shortDate } from './statusMeta'
import InspectionRow from '../../inspections/InspectionRow'

/**
 * A property's move-in / move-out reports. New reports attach to the lease
 * in force (if any) and open straight into the editor.
 */
export default function InspectionsTab({ data, onRefresh }) {
  const navigate = useNavigate()
  const { property } = data
  const inspections = data.inspections || []
  const currentLease = (data.leases || []).find(l => l.current)
  const [creating, setCreating] = useState(null)
  const [error, setError] = useState('')

  const start = async type => {
    setCreating(type)
    setError('')
    try {
      const created = await inspectionsService.create({
        listingId: property.id,
        type,
        agreementId: currentLease?.id,
      })
      await onRefresh()
      navigate(`/dashboard/properties/${property.id}/inspections/${created.id}`)
    } catch (err) {
      setError(err?.message || 'Could not start the report.')
      setCreating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {inspections.length === 0
              ? 'No reports yet'
              : `${inspections.length} report${inspections.length === 1 ? '' : 's'}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentLease
              ? `New reports attach to the lease ${shortDate(currentLease.startDate)} – ${shortDate(currentLease.endDate)}.`
              : 'No lease in force; new reports attach to the property only.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => start('move_in')}
            disabled={Boolean(creating)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
          >
            <LogIn size={14} />
            {creating === 'move_in' ? 'Starting…' : 'New move-in report'}
          </button>
          <button
            type="button"
            onClick={() => start('move_out')}
            disabled={Boolean(creating)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            <LogOut size={14} />
            {creating === 'move_out' ? 'Starting…' : 'New move-out report'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {inspections.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 px-4 text-center">
          <ClipboardCheck size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-900">No inspection reports</p>
          <p className="text-sm text-gray-500 mt-1">
            Walk the unit room by room, note the condition of each item and add
            photos. A completed move-out report can send its flagged items to
            the security deposit as itemized deductions.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {inspections.map(i => (
            <InspectionRow
              key={i.id}
              inspection={i}
              to={`/dashboard/properties/${property.id}/inspections/${i.id}`}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

InspectionsTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    inspections: PropTypes.array,
    leases: PropTypes.array,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
}
