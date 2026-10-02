import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Wrench, Image as ImageIcon, Save } from 'lucide-react'
import { maintenanceService } from '../../../services/maintenanceService'
import { shortDate, fullName, TICKET_STATUS } from './statusMeta'

const STATUSES = ['pending', 'in-progress', 'completed']
const PRIORITY = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
}

function TicketRow({ ticket, onSaved }) {
  const [status, setStatus] = useState(ticket.status)
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty =
    status !== ticket.status || assignedTo !== (ticket.assignedTo || '')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await maintenanceService.updateStatus(ticket.id, status, assignedTo)
      await onSaved()
    } catch (err) {
      setError(err?.message || 'Could not update the ticket.')
    } finally {
      setSaving(false)
    }
  }

  const badge = TICKET_STATUS[ticket.status]
  return (
    <li className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 flex flex-wrap items-center gap-2">
            {ticket.category}
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${badge?.className}`}
            >
              {badge?.label || ticket.status}
            </span>
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                PRIORITY[ticket.priority] || PRIORITY.low
              }`}
            >
              {ticket.priority} priority
            </span>
          </p>
          <p className="text-sm text-gray-700 mt-1">{ticket.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Reported by {fullName(ticket.tenant)} ·{' '}
            {shortDate(ticket.createdAt)}
            {ticket.completedAt &&
              ` · completed ${shortDate(ticket.completedAt)}`}
          </p>
          {ticket.photos?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {ticket.photos.slice(0, 4).map(url => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt="Ticket photo"
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              ))}
              {ticket.photos.length > 4 && (
                <span className="w-14 h-14 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                  <ImageIcon size={14} /> +{ticket.photos.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2 lg:w-96">
          <label className="text-xs text-gray-500 flex-1 min-w-[8rem]">
            Status
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {TICKET_STATUS[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex-1 min-w-[8rem]">
            Assigned to
            <input
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Vendor or name"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
          >
            <Save size={13} /> Save
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </li>
  )
}

TicketRow.propTypes = {
  ticket: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
}

export default function MaintenanceTab({ data, onRefresh }) {
  const { tickets } = data
  const [showClosed, setShowClosed] = useState(false)
  const shown = useMemo(
    () =>
      showClosed ? tickets : tickets.filter(t => t.status !== 'completed'),
    [tickets, showClosed]
  )
  const closed =
    tickets.length - tickets.filter(t => t.status !== 'completed').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Tenants file tickets from their dashboard. Update status and who is
          handling it here.
        </p>
        {closed > 0 && (
          <label className="text-xs text-gray-600 flex items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={e => setShowClosed(e.target.checked)}
              className="accent-brand-500"
            />
            Show completed ({closed})
          </label>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
          <Wrench size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-900">No open maintenance</p>
          <p className="text-sm text-gray-500 mt-1">
            Nothing reported on this property right now.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {shown.map(t => (
            <TicketRow key={t.id} ticket={t} onSaved={onRefresh} />
          ))}
        </ul>
      )}
    </div>
  )
}

MaintenanceTab.propTypes = {
  data: PropTypes.shape({ tickets: PropTypes.array.isRequired }).isRequired,
  onRefresh: PropTypes.func.isRequired,
}
