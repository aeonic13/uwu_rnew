import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LegacyLandlordListingForm from '../../LandlordListingForm'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { listingsService } from '../../services/listingsService'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Create a listing at /dashboard/listings/new, or edit one at
 * /dashboard/listings/:id/edit. Editing loads the listing first and hands
 * it to the form, which prefills every step and saves instead of creating.
 */
export default function LandlordListingForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    listingsService
      .getListingById(id)
      .then(found => {
        if (cancelled) return
        if (!found || (user && found.ownerId && found.ownerId !== user.id)) {
          setError('This listing is not yours to edit.')
        } else {
          setListing(found)
        }
      })
      .catch(err =>
        setError(err?.message || 'Could not load this listing to edit.')
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, user])

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
    <LegacyLandlordListingForm
      key={listing?.id || 'new'}
      listing={listing}
      onBack={back}
      onSubmit={saved =>
        navigate(saved?.id ? `/dashboard/properties/${saved.id}` : '/dashboard')
      }
    />
  )
}
