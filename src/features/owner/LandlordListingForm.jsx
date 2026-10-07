import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import LegacyLandlordListingForm from '../../LandlordListingForm'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { listingsService } from '../../services/listingsService'
import { useAuth } from '../../contexts/AuthContext'

/** "1245 Grand Ave · Unit 2B" → "1245 Grand Ave" for the next unit's title. */
export function stripUnitSuffix(title) {
  return String(title || '')
    .replace(/\s*[·\-–|,]?\s*(unit|apt\.?|apartment|suite|#)\s*\S+\s*$/i, '')
    .trim()
}

/**
 * Prefill for another unit in the same building: everything from the
 * source listing except its photos, its unit label and its id, so the
 * form creates a new listing rather than editing this one.
 */
export function cloneTemplate(source) {
  if (!source) return null
  // eslint-disable-next-line no-unused-vars
  const { id, images, unitLabel, ...rest } = source
  return { ...rest, title: stripUnitSuffix(source.title), images: [] }
}

/**
 * Create a listing at /dashboard/listings/new, or edit one at
 * /dashboard/listings/:id/edit. Editing loads the listing first and hands
 * it to the form, which prefills every step and saves instead of creating.
 * `?cloneFrom=<listingId>` on the create route prefills the form from an
 * existing unit so a landlord can add the next unit in the same building.
 */
export default function LandlordListingForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cloneFrom = id ? null : searchParams.get('cloneFrom')
  const sourceId = id || cloneFrom
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(Boolean(sourceId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sourceId) return undefined
    let cancelled = false
    listingsService
      .getListingById(sourceId)
      .then(found => {
        if (cancelled) return
        if (!found || (user && found.ownerId && found.ownerId !== user.id)) {
          setError(
            id
              ? 'This listing is not yours to edit.'
              : 'That property is not yours to copy.'
          )
        } else if (id) {
          setListing(found)
        } else {
          setTemplate({ source: found, listing: cloneTemplate(found) })
        }
      })
      .catch(err =>
        setError(
          err?.message ||
            (id
              ? 'Could not load this listing to edit.'
              : 'Could not load the property to copy.')
        )
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [sourceId, id, user])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Back to properties
        </button>
      </div>
    )
  }

  const back = () => navigate(id ? `/dashboard/properties/${id}` : '/dashboard')

  return (
    <>
      {template && (
        <div className="mx-6 mt-6 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-800">
          <Building2 size={18} className="text-brand-600 flex-shrink-0" />
          <p>
            <span className="font-semibold">Adding another unit at </span>
            {template.source.streetAddress || template.source.location}. Details
            are copied from{' '}
            {template.source.unitLabel
              ? `Unit ${template.source.unitLabel}`
              : template.source.title}
            ; set this unit&apos;s label and photos.
          </p>
        </div>
      )}
      <LegacyLandlordListingForm
        key={listing?.id || (cloneFrom ? `clone-${cloneFrom}` : 'new')}
        listing={listing || template?.listing || null}
        onBack={back}
        onSubmit={saved =>
          navigate(
            saved?.id ? `/dashboard/properties/${saved.id}` : '/dashboard'
          )
        }
      />
    </>
  )
}
