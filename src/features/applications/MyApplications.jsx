import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Calendar,
  Users,
  MapPin,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { applicationsService } from '../../services/applicationsService'
import { usePreQualification } from '../../hooks/usePreQualification'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STATUS_CONFIG = {
  pending: {
    label: 'Pending review',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  rejected: {
    label: 'Not selected',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon size={12} className="mr-1" />
      {config.label}
    </span>
  )
}

function ApplicationCard({ application, onWithdraw, withdrawingId }) {
  const navigate = useNavigate()
  const listing = application.listing || {}
  const image = Array.isArray(listing.images) ? listing.images[0] : null
  const agreement = application.agreement
  const isPending = application.status === 'pending'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex">
        {image && (
          <img
            src={image}
            alt={listing.title || 'Listing'}
            className="w-28 h-28 object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {listing.title || 'Listing'}
              </h3>
              <p className="text-sm text-gray-500 flex items-center mt-0.5">
                <MapPin size={13} className="mr-1 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            {listing.price != null && (
              <span className="font-medium">
                ${Number(listing.price).toLocaleString()}/mo
              </span>
            )}
            <span className="flex items-center">
              <Calendar size={13} className="mr-1" />
              Applied {new Date(application.createdAt).toLocaleDateString()}
            </span>
            {application.groupId && (
              <span className="flex items-center text-brand-600">
                <Users size={13} className="mr-1" />
                Group application
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-4">
        {listing.id && (
          <button
            onClick={() => navigate(`/listings/${listing.id}`)}
            className="flex-1 flex items-center justify-center py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Eye size={15} className="mr-1.5" />
            View listing
          </button>
        )}
        {agreement?.id && (
          <button
            onClick={() => navigate(`/agreement/${agreement.id}`)}
            className="flex-1 flex items-center justify-center py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <FileText size={15} className="mr-1.5" />
            {agreement.tenantSigned ? 'View lease' : 'Review & sign lease'}
          </button>
        )}
        {isPending && (
          <button
            onClick={() => onWithdraw(application)}
            disabled={withdrawingId === application.id}
            className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {withdrawingId === application.id ? 'Withdrawing…' : 'Withdraw'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * My Applications — the tenant's application history and pipeline.
 */
export default function MyApplications() {
  const navigate = useNavigate()
  const { isPreQualified } = usePreQualification()
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [withdrawingId, setWithdrawingId] = useState(null)
  const [confirmWithdraw, setConfirmWithdraw] = useState(null)

  useEffect(() => {
    let active = true
    applicationsService
      .getApplications()
      .then(res => {
        if (active) setApplications(res?.applications || [])
      })
      .catch(err => active && setError(err.message))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleWithdraw = async application => {
    setWithdrawingId(application.id)
    setError(null)
    try {
      await applicationsService.withdraw(application.id)
      setApplications(prev => prev.filter(a => a.id !== application.id))
    } catch (err) {
      setError(err.message || 'Could not withdraw the application')
    } finally {
      setWithdrawingId(null)
      setConfirmWithdraw(null)
    }
  }

  const filtered =
    filter === 'all'
      ? applications
      : applications.filter(a => a.status === filter)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">
          Track every application, review leases, and follow up in one place
        </p>
      </div>

      {!isPreQualified && (
        <div className="mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start">
          <ShieldCheck size={20} className="text-brand-500 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-brand-700">
              Stand out with pre-qualification
            </h3>
            <p className="text-sm text-brand-600 mt-0.5">
              Verify your income and identity once — it strengthens every
              application you send.
            </p>
          </div>
          <button
            onClick={() => navigate('/pre-qualify')}
            className="ml-3 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors whitespace-nowrap"
          >
            Start
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'pending', 'approved', 'rejected'].map(value => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === value
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {value === 'all' ? 'All' : (STATUS_CONFIG[value]?.label ?? value)}{' '}
            {value === 'all'
              ? `(${applications.length})`
              : `(${applications.filter(a => a.status === value).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <FileText size={56} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {filter === 'all'
              ? 'No applications yet'
              : 'Nothing here right now'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {filter === 'all'
              ? 'When you apply to a rental, it shows up here so you can track its progress.'
              : 'Applications with this status will appear here.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => navigate('/listings')}
              className="px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
            >
              Browse rentals
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(application => (
            <ApplicationCard
              key={application.id}
              application={application}
              onWithdraw={setConfirmWithdraw}
              withdrawingId={withdrawingId}
            />
          ))}
        </div>
      )}

      {/* Withdraw confirmation */}
      {confirmWithdraw && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmWithdraw(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">Withdraw application?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This removes your application for{' '}
              <strong>
                {confirmWithdraw.listing?.title || 'this listing'}
              </strong>
              . The landlord will no longer see it, and you&apos;d need to apply
              again to be considered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmWithdraw(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={() => handleWithdraw(confirmWithdraw)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
