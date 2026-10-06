import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Plus,
  Inbox,
  Building2,
  Users,
  FileText,
  Wrench,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  ChevronRight,
  Landmark,
  Receipt,
  Calculator,
  FolderOpen,
  AlertCircle,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { propertiesService } from '../../services/propertiesService'
import { statusMeta, money, shortDate } from './property/statusMeta'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'leased', label: 'Leased' },
  { key: 'listed', label: 'Listed' },
]

const TOOLS = [
  {
    to: '/dashboard/rent-collection',
    label: 'Rent collection',
    Icon: Landmark,
  },
  { to: '/dashboard/security-deposits', label: 'Deposits', Icon: Receipt },
  { to: '/dashboard/banking', label: 'Bookkeeping', Icon: DollarSign },
  { to: '/dashboard/tax', label: 'Tax center', Icon: Calculator },
  { to: '/dashboard/documents', label: 'Documents', Icon: FolderOpen },
]

const needsAttention = p =>
  p.pendingApplications > 0 ||
  p.openTickets > 0 ||
  p.status === 'pending_signatures' ||
  p.status === 'awaiting_tenants'

function StatTile({ label, value, sub, Icon, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-600',
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
      <span className={`p-2 rounded-lg ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
      </div>
    </div>
  )
}

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  Icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['gray', 'brand', 'green', 'amber', 'red']),
}

/** One property on the portfolio grid. Clicking opens its workspace. */
export function PropertyCard({ property, onOpen }) {
  const meta = statusMeta(property.status)
  const beds = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bd`
  return (
    <button
      type="button"
      onClick={() => onOpen(property)}
      className="text-left bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-300 transition-all group"
      data-testid={`property-card-${property.id}`}
    >
      <div className="relative">
        <img
          src={property.image || PLACEHOLDER_IMAGE}
          alt={property.title}
          className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform"
        />
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${meta.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
          {property.status === 'awaiting_tenants' && property.invites && (
            <span className="font-normal">
              · {property.invites.confirmed} of {property.invites.total}{' '}
              confirmed
            </span>
          )}
        </span>
        {needsAttention(property) && (
          <span className="absolute top-3 right-3 bg-white/95 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow">
            <AlertCircle size={12} /> Attention
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-1">
            {property.title}
          </h3>
          <p className="font-bold text-gray-900 whitespace-nowrap">
            {money(property.monthlyRent)}
            <span className="text-xs font-normal text-gray-500">/mo</span>
          </p>
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
          <MapPin size={13} className="flex-shrink-0" />
          {property.streetAddress || property.location}
        </p>
        <p className="flex items-center gap-3 text-xs text-gray-600 mt-2">
          <span className="flex items-center gap-1">
            <Bed size={13} /> {beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={13} /> {property.bathrooms} ba
          </span>
          {property.endingOn ? (
            <span className="text-amber-700 font-medium">
              Ending {shortDate(property.endingOn)}
            </span>
          ) : property.nextLeaseStart ? (
            <span className="text-gray-500">
              Renewed from {shortDate(property.nextLeaseStart)}
            </span>
          ) : property.leaseEnd ? (
            <span className="text-gray-500">
              {property.monthToMonth
                ? 'Month-to-month'
                : `Lease ends ${shortDate(property.leaseEnd)}`}
            </span>
          ) : null}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {property.tenants}
            </p>
            <p className="text-[11px] text-gray-500">Tenants</p>
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                property.pendingApplications > 0
                  ? 'text-amber-700'
                  : 'text-gray-900'
              }`}
            >
              {property.pendingApplications}
            </p>
            <p className="text-[11px] text-gray-500">Applications</p>
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                property.openTickets > 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {property.openTickets}
            </p>
            <p className="text-[11px] text-gray-500">Maintenance</p>
          </div>
        </div>
      </div>
    </button>
  )
}

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    location: PropTypes.string,
    streetAddress: PropTypes.string,
    image: PropTypes.string,
    status: PropTypes.string.isRequired,
    monthlyRent: PropTypes.number,
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    tenants: PropTypes.number,
    invites: PropTypes.shape({
      confirmed: PropTypes.number,
      total: PropTypes.number,
    }),
    pendingApplications: PropTypes.number,
    openTickets: PropTypes.number,
    leaseEnd: PropTypes.string,
    endingOn: PropTypes.string,
    nextLeaseStart: PropTypes.string,
    monthToMonth: PropTypes.bool,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
}

/**
 * Landlord home: the portfolio. Every property is a card that opens its
 * own workspace (tenants, applications, maintenance, documents, expenses).
 */
export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    propertiesService
      .getPortfolio()
      .then(res => {
        if (!cancelled) setData(res)
      })
      .catch(err => {
        if (!cancelled) setError(err?.message || 'Could not load properties.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const properties = useMemo(() => data?.properties || [], [data])
  const totals = data?.totals || {}

  const shown = useMemo(() => {
    if (filter === 'attention') return properties.filter(needsAttention)
    if (filter === 'leased' || filter === 'listed') {
      return properties.filter(p => p.status === filter)
    }
    return properties
  }, [properties, filter])

  const attentionCount = properties.filter(needsAttention).length
  // Landlords who list a unit that is already occupied: point them at the
  // existing-tenant flow instead of waiting for applications.
  const occupiedCandidate = properties.find(
    p => p.status === 'listed' && p.tenants === 0 && p.pendingApplications === 0
  )
  const showOnboardNudge =
    Boolean(occupiedCandidate) &&
    !properties.some(
      p => p.status === 'leased' || p.status === 'awaiting_tenants'
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Your properties
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/inbox"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 bg-white"
            >
              <Inbox size={16} /> Inbox
              {totals.pendingApplications > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {totals.pendingApplications}
                </span>
              )}
            </Link>
            <Link
              to="/dashboard/listings/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
            >
              <Plus size={16} /> Add property
            </Link>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {showOnboardNudge && (
          <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <UserPlus size={18} className="text-brand-600 flex-shrink-0" />
            <p className="text-sm text-gray-800 flex-1">
              <span className="font-semibold">Have tenants already?</span> Add
              them to a property to collect rent and track the lease without
              waiting for applications.
            </p>
            <Link
              to={`/dashboard/properties/${occupiedCandidate.id}/onboard`}
              className="inline-flex items-center justify-center px-3 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
            >
              Add current tenants
            </Link>
          </div>
        )}

        {/* Portfolio stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <StatTile
            label="Properties"
            value={totals.properties ?? '—'}
            sub={
              totals.properties != null
                ? `${totals.leased || 0} leased · ${totals.listed || 0} listed`
                : undefined
            }
            Icon={Building2}
            tone="brand"
          />
          <StatTile
            label="Tenants"
            value={totals.tenants ?? '—'}
            Icon={Users}
            tone="green"
          />
          <StatTile
            label="Pending applications"
            value={totals.pendingApplications ?? '—'}
            Icon={FileText}
            tone={totals.pendingApplications > 0 ? 'amber' : 'gray'}
          />
          <StatTile
            label="Open maintenance"
            value={totals.openTickets ?? '—'}
            Icon={Wrench}
            tone={totals.openTickets > 0 ? 'red' : 'gray'}
          />
          <StatTile
            label="Rent expected"
            value={totals.monthlyRent != null ? money(totals.monthlyRent) : '—'}
            sub="per month, leased units"
            Icon={DollarSign}
          />
          <StatTile
            label="Collected this month"
            value={
              totals.collectedThisMonth != null
                ? money(totals.collectedThisMonth)
                : '—'
            }
            Icon={Landmark}
            tone="green"
          />
        </div>

        {/* Portfolio-wide tools */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TOOLS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600"
            >
              <Icon size={13} /> {label}
            </Link>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === f.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }`}
              >
                {f.label}
                {f.key === 'attention' && attentionCount > 0 && (
                  <span className="ml-1 opacity-80">({attentionCount})</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            {shown.length} of {properties.length} propert
            {properties.length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
              <Building2 size={26} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add your first property
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              List a unit to start taking applications, screening tenants and
              collecting rent in one place.
            </p>
            <Link
              to="/dashboard/listings/new"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
            >
              <Plus size={16} /> Add property
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-sm text-gray-500">
            Nothing matches this filter.
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="ml-2 text-brand-600 font-medium hover:underline"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                onOpen={prop => navigate(`/dashboard/properties/${prop.id}`)}
              />
            ))}
          </div>
        )}

        {properties.length > 0 && (
          <p className="mt-6 text-xs text-gray-400 flex items-center gap-1">
            Open a property to manage its tenants, applications, maintenance,
            documents and expenses
            <ChevronRight size={12} />
          </p>
        )}
      </div>
    </div>
  )
}
