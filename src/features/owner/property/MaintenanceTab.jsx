import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  Wrench,
  Image as ImageIcon,
  Save,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Receipt,
  Phone,
} from 'lucide-react'
import { maintenanceService } from '../../../services/maintenanceService'
import MaintenanceThread from '../../maintenance/MaintenanceThread'
import { shortDate, fullName, money, TICKET_STATUS } from './statusMeta'

const STATUSES = ['pending', 'in-progress', 'completed']
const PRIORITY = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
}

function TicketRow({ ticket: row, onSaved }) {
  // The workspace list row is the base; the thread load overlays the fuller
  // detail (vendorPhone, cost, expense) from GET /maintenance/:id.
  const [detail, setDetail] = useState(null)
  const ticket = detail ? { ...row, ...detail } : row

  const [status, setStatus] = useState(row.status)
  const [assignedTo, setAssignedTo] = useState(row.assignedTo || '')
  const [vendorPhone, setVendorPhone] = useState(row.vendorPhone || '')
  const [cost, setCost] = useState(
    row.cost === null || row.cost === undefined ? '' : String(row.cost)
  )
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(row._count?.comments ?? null)

  const savedCost =
    ticket.cost === null || ticket.cost === undefined ? '' : String(ticket.cost)
  const dirty =
    status !== ticket.status ||
    assignedTo !== (ticket.assignedTo || '') ||
    vendorPhone !== (ticket.vendorPhone || '') ||
    cost !== savedCost

  const applyDetail = full => {
    setDetail(full)
    setCommentCount(full.comments?.length ?? 0)
    // Only sync fields the user has not touched since the row rendered.
    if (!dirty) {
      setStatus(full.status)
      setAssignedTo(full.assignedTo || '')
      setVendorPhone(full.vendorPhone || '')
      setCost(
        full.cost === null || full.cost === undefined ? '' : String(full.cost)
      )
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await maintenanceService.updateStatus(ticket.id, {
        status,
        assignedTo,
        vendorPhone,
        cost: cost === '' ? null : Number(cost),
      })
      setDetail(prev => ({ ...(prev || {}), ...updated }))
      await onSaved()
    } catch (err) {
      setError(err?.message || 'Could not update the ticket.')
    } finally {
      setSaving(false)
    }
  }

  const book = async () => {
    setBooking(true)
    setError('')
    try {
      const res = await maintenanceService.bookExpense(ticket.id)
      setDetail(prev => ({
        ...(prev || {}),
        ...res.ticket,
        expense: res.expense,
      }))
      await onSaved()
    } catch (err) {
      setError(err?.message || 'Could not book the expense.')
    } finally {
      setBooking(false)
    }
  }

  const canBook =
    ticket.status === 'completed' && ticket.cost > 0 && !ticket.expenseId
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
          {(ticket.vendorPhone || ticket.cost > 0) && (
            <p className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {ticket.vendorPhone && (
                <a
                  href={`tel:${ticket.vendorPhone}`}
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  <Phone size={11} /> {ticket.vendorPhone}
                </a>
              )}
              {ticket.cost > 0 && <span>Cost {money(ticket.cost)}</span>}
            </p>
          )}
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

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2 lg:w-96">
          <label className="text-xs text-gray-500 sm:flex-1 sm:min-w-[8rem]">
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
          <label className="text-xs text-gray-500 sm:flex-1 sm:min-w-[8rem]">
            Assigned to
            <input
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Vendor or name"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-500 sm:flex-1 sm:min-w-[8rem]">
            Vendor phone
            <input
              type="tel"
              value={vendorPhone}
              onChange={e => setVendorPhone(e.target.value)}
              placeholder="(619) 555-0100"
              maxLength={40}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-500 sm:w-24">
            Cost ($)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 col-span-2 sm:col-span-1"
          >
            <Save size={13} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <MessageSquare size={13} />
          Thread
          {commentCount !== null && (
            <span className="text-gray-500">({commentCount})</span>
          )}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {canBook && (
          <button
            type="button"
            onClick={book}
            disabled={booking || dirty}
            title={dirty ? 'Save your changes first' : undefined}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
          >
            <Receipt size={13} />
            {booking ? 'Booking…' : `Book ${money(ticket.cost)} as expense`}
          </button>
        )}
        {ticket.expenseId && (
          <Link
            to={`/dashboard/properties/${ticket.listingId}/expenses`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold hover:bg-green-100"
          >
            <Receipt size={13} /> Booked as expense
          </Link>
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <MaintenanceThread
            ticketId={ticket.id}
            onLoaded={applyDetail}
            onPosted={() => setCommentCount(c => (c ?? 0) + 1)}
          />
        </div>
      )}

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
          Tenants file tickets from their dashboard. Update status, who is
          handling it and what it cost here; message the tenant in the thread.
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
