import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutGrid,
  Users,
  FileText,
  Wrench,
  FolderOpen,
  Receipt,
  MapPin,
  Bed,
  Bath,
  Pencil,
  ExternalLink,
  Power,
  UserPlus,
  ClipboardCheck,
  Plus,
} from 'lucide-react'
import { propertiesService } from '../../services/propertiesService'
import { listingsService } from '../../services/listingsService'
import { statusMeta, money } from './property/statusMeta'
import { cloneUnitPath } from './buildings'
import OverviewTab from './property/OverviewTab'
import TenantsTab from './property/TenantsTab'
import ApplicationsTab from './property/ApplicationsTab'
import MaintenanceTab from './property/MaintenanceTab'
import DocumentsTab from './property/DocumentsTab'
import ExpensesTab from './property/ExpensesTab'
import InspectionsTab from './property/InspectionsTab'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'

const TABS = [
  { key: 'overview', label: 'Overview', Icon: LayoutGrid },
  {
    key: 'tenants',
    label: 'Tenants',
    Icon: Users,
    count: d => d.stats.tenants,
  },
  {
    key: 'applications',
    label: 'Applications',
    Icon: FileText,
    count: d => d.stats.pendingApplications,
    tone: 'amber',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    Icon: Wrench,
    count: d => d.stats.openTickets,
    tone: 'red',
  },
  {
    key: 'documents',
    label: 'Documents',
    Icon: FolderOpen,
    count: d => d.documents.length,
  },
  { key: 'expenses', label: 'Expenses', Icon: Receipt },
  { key: 'inspections', label: 'Inspections', Icon: ClipboardCheck },
]

const TAB_KEYS = TABS.map(t => t.key)

/**
 * One property's workspace: header with the listing facts, then tabs for
 * everything a landlord manages on it. Data comes from GET /api/properties/:id
 * in one call; tabs that mutate ask for a refresh.
 */
export default function PropertyWorkspace() {
  const { id, tab: tabParam } = useParams()
  const navigate = useNavigate()
  const tab = TAB_KEYS.includes(tabParam) ? tabParam : 'overview'

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      try {
        const res = await propertiesService.getProperty(id)
        setData(res)
        setError('')
      } catch (err) {
        setError(err?.message || 'Could not load this property.')
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => load({ silent: true }), [load])

  const toggleActive = async () => {
    if (!data) return
    setToggling(true)
    try {
      await listingsService.toggleListingStatus(id, !data.property.active)
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not update the listing.')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-44 bg-white border border-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          to="/dashboard"
          className="text-brand-600 font-medium hover:underline"
        >
          Back to your properties
        </Link>
      </div>
    )
  }

  const { property, stats } = data
  const meta = statusMeta(stats.status)
  const beds = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bd`
  // A property with no lease in progress can have its current household
  // added by the landlord (existing-tenant onboarding).
  const canOnboard = !data.leases.some(
    l => l.current || l.awaitingTenants || !l.fullySigned
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> All properties
        </Link>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Property header */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          <div className="flex flex-col md:flex-row">
            <img
              src={property.images?.[0] || PLACEHOLDER_IMAGE}
              alt={property.title}
              className="w-full md:w-64 h-44 md:h-auto object-cover"
            />
            <div className="flex-1 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${meta.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                    {stats.status === 'awaiting_tenants' && stats.invites && (
                      <span className="font-normal">
                        · {stats.invites.confirmed} of {stats.invites.total}{' '}
                        confirmed
                      </span>
                    )}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900 mt-2 leading-tight">
                    {property.title}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} className="flex-shrink-0" />
                    {property.streetAddress
                      ? `${property.streetAddress}`
                      : property.location}
                    {property.unitLabel && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
                        Unit {property.unitLabel}
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Bed size={14} /> {beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath size={14} /> {property.bathrooms} ba
                    </span>
                    <span>{property.propertyType}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {money(stats.monthlyRent)}
                    <span className="text-sm font-normal text-gray-500">
                      /mo
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.status === 'leased' ? 'lease rent' : 'asking rent'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {canOnboard && (
                  <Link
                    to={`/dashboard/properties/${property.id}/onboard`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-brand-300 bg-brand-50 rounded-lg text-xs font-medium text-brand-700 hover:bg-brand-100"
                  >
                    <UserPlus size={13} /> Add current tenants
                  </Link>
                )}
                <Link
                  to={`/dashboard/listings/${property.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
                >
                  <Pencil size={13} /> Edit listing
                </Link>
                {property.streetAddress && (
                  <Link
                    to={cloneUnitPath(property.id)}
                    title="Create another unit at this address, prefilled from this one"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
                  >
                    <Plus size={13} /> Add another unit
                  </Link>
                )}
                <Link
                  to={`/listings/${property.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
                >
                  <ExternalLink size={13} /> Public page
                </Link>
                <button
                  type="button"
                  onClick={toggleActive}
                  disabled={toggling}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium disabled:opacity-50 ${
                    property.active
                      ? 'border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Power size={13} />
                  {property.active ? 'Stop taking applications' : 'Relist'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-5 overflow-x-auto">
          <nav className="flex gap-1 min-w-max" aria-label="Property sections">
            {TABS.map(({ key, label, Icon, count, tone }) => {
              const n = count ? count(data) : 0
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigate(`/dashboard/properties/${id}/${key}`)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  {n > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                        tone === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : tone === 'red'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {tab === 'overview' && (
          <OverviewTab
            data={data}
            onGoTo={key => navigate(`/dashboard/properties/${id}/${key}`)}
          />
        )}
        {tab === 'tenants' && <TenantsTab data={data} onRefresh={refresh} />}
        {tab === 'applications' && (
          <ApplicationsTab data={data} onRefresh={refresh} />
        )}
        {tab === 'maintenance' && (
          <MaintenanceTab data={data} onRefresh={refresh} />
        )}
        {tab === 'documents' && (
          <DocumentsTab data={data} onRefresh={refresh} />
        )}
        {tab === 'expenses' && <ExpensesTab data={data} onRefresh={refresh} />}
        {tab === 'inspections' && (
          <InspectionsTab data={data} onRefresh={refresh} />
        )}
      </div>
    </div>
  )
}
