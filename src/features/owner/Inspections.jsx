import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react'
import { inspectionsService } from '../../services/inspectionsService'
import InspectionRow from '../inspections/InspectionRow'

/**
 * Portfolio view of every inspection report, grouped by property. New
 * reports are started from a property's Inspections tab.
 */
export default function Inspections() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    inspectionsService
      .list()
      .then(setInspections)
      .catch(err => setError(err.message))
  }, [])

  const groups = []
  const byListing = new Map()
  for (const i of inspections || []) {
    const key = i.listing?.id || i.listingId
    if (!byListing.has(key)) {
      const group = {
        id: key,
        title: i.listing?.title || 'Property',
        inspections: [],
      }
      byListing.set(key, group)
      groups.push(group)
    }
    byListing.get(key).inspections.push(i)
  }

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Inspections</h2>
        <p className="text-gray-600">
          Move-in and move-out condition reports with photos, one per lease.
          Start a new report from a property&apos;s Inspections tab.
        </p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!inspections && !error && (
        <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading reports…
        </div>
      )}
      {inspections && inspections.length === 0 && (
        <div className="text-center py-16">
          <ClipboardCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">
            No inspection reports yet. Open a property and start one from its
            Inspections tab.
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-4 text-brand-600 font-medium hover:underline"
          >
            Go to your properties
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{group.title}</h3>
              <Link
                to={`/dashboard/properties/${group.id}/inspections`}
                className="text-sm text-brand-600 hover:underline"
              >
                Property
              </Link>
            </div>
            <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {group.inspections.map(i => (
                <InspectionRow
                  key={i.id}
                  inspection={i}
                  to={`/dashboard/properties/${group.id}/inspections/${i.id}`}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
