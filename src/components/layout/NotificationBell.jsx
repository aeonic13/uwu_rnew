import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Bell,
  FileText,
  PenLine,
  DollarSign,
  Wrench,
  ClipboardCheck,
  MessageSquare,
  Shield,
  Users,
  Home,
  Sparkles,
  CheckCheck,
} from 'lucide-react'
import { notificationsService } from '../../services/notificationsService'

const ICONS = {
  application: FileText,
  lease: PenLine,
  rent: DollarSign,
  maintenance: Wrench,
  inspection: ClipboardCheck,
  message: MessageSquare,
  cosigner: Shield,
  group: Users,
  listing: Home,
  housemate: Sparkles,
  utility: DollarSign,
}

/** "2m", "3h", "4d" — short enough for a dropdown row. */
export function timeAgo(value, now = Date.now()) {
  const diff = Math.max(0, now - new Date(value).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * The header bell: unread badge, a dropdown of the latest notifications,
 * mark-read on click (then navigate to the item's link) and mark-all.
 * Polls every 30s like the unread-messages badge, plus on every navigation.
 */
export default function NotificationBell({ compact = false }) {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const panelRef = useRef(null)

  const load = useCallback(
    () =>
      notificationsService
        .list()
        .then(data => {
          setItems(Array.isArray(data?.notifications) ? data.notifications : [])
          setUnread(data?.unread || 0)
        })
        .catch(() => {}),
    []
  )

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load, location.pathname])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined
    const onClick = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = e => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openItem = async n => {
    if (!n.readAt) {
      setItems(prev =>
        prev.map(x =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
        )
      )
      setUnread(u => Math.max(0, u - 1))
      notificationsService.markRead(n.id).catch(() => {})
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    setItems(prev =>
      prev.map(x => ({ ...x, readAt: x.readAt || new Date().toISOString() }))
    )
    setUnread(0)
    notificationsService.markAllRead().catch(() => {})
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={
          unread > 0 ? `${unread} unread notifications` : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
          open ? 'bg-gray-100' : ''
        }`}
      >
        <Bell size={compact ? 22 : 20} />
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-500 text-center">
              Nothing yet. Applications, signatures, payments and messages show
              up here.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {items.map(n => {
                const Icon = ICONS[n.type] || Bell
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 ${
                        n.readAt ? '' : 'bg-brand-50/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                          n.readAt
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`text-sm leading-snug ${
                              n.readAt
                                ? 'text-gray-700'
                                : 'text-gray-900 font-medium'
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        {n.body && (
                          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.body}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

NotificationBell.propTypes = {
  compact: PropTypes.bool,
}
