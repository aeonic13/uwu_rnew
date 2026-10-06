import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { inspectionsService } from '../../services/inspectionsService'
import { money, shortDate } from '../owner/property/statusMeta'
import {
  TYPE_LABEL,
  STATUS_META,
  conditionMeta,
  groupByRoom,
} from './inspectionMeta'

/**
 * Read-only inspection report for anyone on the lease (tenant or landlord).
 * The landlord edits from the property workspace; tenants reach this from
 * the completion email.
 */
export default function InspectionReport() {
  const { id } = useParams()
  const { user } = useAuth()
  const [inspection, setInspection] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    inspectionsService
      .get(id)
      .then(data => {
        if (!cancelled) setInspection(data)
      })
      .catch(err => {
        if (!cancelled) setError(err?.message || 'Could not load the report.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const backTo = user?.userType === 'owner' ? '/dashboard' : '/'

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          to={backTo}
          className="text-brand-600 font-medium hover:underline"
        >
          Back
        </Link>
      </div>
    )
  }
  if (!inspection) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading report…
      </div>
    )
  }

  const status = STATUS_META[inspection.status] || STATUS_META.draft
  const rooms = groupByRoom(inspection.items)
  const isOwner = user?.id && inspection.listing && user.userType === 'owner'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-20">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}
              >
                {status.label}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2 leading-tight flex items-center gap-2">
                <ClipboardCheck size={22} className="text-brand-600" />
                {TYPE_LABEL[inspection.type] || 'Inspection'} report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {inspection.listing?.title}
                {inspection.listing?.streetAddress
                  ? ` · ${inspection.listing.streetAddress}`
                  : inspection.listing?.location
                    ? ` · ${inspection.listing.location}`
                    : ''}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-2xl font-bold text-gray-900">
                {inspection.damagedCount}
                <span className="text-sm font-normal text-gray-500">
                  {' '}
                  flagged
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {money(inspection.estimatedTotal)} estimated
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Conducted</dt>
              <dd className="text-gray-900">
                {shortDate(inspection.conductedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Completed</dt>
              <dd className="text-gray-900">
                {inspection.completedAt
                  ? shortDate(inspection.completedAt)
                  : 'Not yet'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Items checked</dt>
              <dd className="text-gray-900">{inspection.itemCount}</dd>
            </div>
          </dl>
          {inspection.notes && (
            <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">
              {inspection.notes}
            </p>
          )}
          {isOwner && (
            <Link
              to={`/dashboard/properties/${inspection.listing.id}/inspections/${inspection.id}`}
              className="inline-block mt-4 text-sm text-brand-600 font-medium hover:underline"
            >
              Open in the property workspace
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {rooms.map(({ room, items }) => (
            <section
              key={room}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <h2 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-100">
                {room}
              </h2>
              <ul className="divide-y divide-gray-100">
                {items.map(item => {
                  const meta = conditionMeta(item.condition)
                  return (
                    <li key={item.id} className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">{item.item}</p>
                        <span className="flex items-center gap-2">
                          {item.condition === 'damaged' &&
                            item.estimatedCost > 0 && (
                              <span className="text-sm font-semibold text-red-700">
                                {money(item.estimatedCost)}
                              </span>
                            )}
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {item.notes}
                        </p>
                      )}
                      {item.photos?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.photos.map(url => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={url}
                                alt={`${room} ${item.item} photo`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
