import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Bed,
  Bath,
  Shield,
  Star,
  MessageCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useFavorites } from '../../contexts/FavoritesContext'
import { useAuth } from '../../contexts/AuthContext'
import { usePreQualification } from '../../hooks/usePreQualification'
import { messagingService } from '../../services/messagingService'
import { reviewsService } from '../../services/reviewsService'
import ShareToGroupModal from '../groups/ShareToGroupModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Image gallery with navigation
 */
function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 lg:h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-400">No images available</span>
      </div>
    )
  }

  return (
    <div className="relative lg:rounded-lg overflow-hidden">
      <img
        src={images[currentIndex]}
        alt={`Property image ${currentIndex + 1}`}
        className="w-full h-64 lg:h-96 object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
}

/**
 * Owner info card
 */
function OwnerCard({ owner, onContact, contacting, contactError }) {
  const name =
    [owner.firstName, owner.lastName].filter(Boolean).join(' ') || 'Owner'
  const listingCount = owner._count?.listings

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <img
          src={owner.avatarUrl || 'https://via.placeholder.com/60'}
          alt={name}
          className="w-14 h-14 rounded-full mr-3 object-cover bg-gray-200"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-semibold">{name}</h3>
            {owner.verified && (
              <span title="Email confirmed">
                <Shield size={16} className="ml-1 text-brand-500" />
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {listingCount
              ? `${listingCount} listing${listingCount === 1 ? '' : 's'} on Rentra`
              : 'Landlord on Rentra'}
          </div>
        </div>
      </div>

      <button
        onClick={onContact}
        disabled={contacting}
        className="w-full bg-brand-500 text-white py-3 rounded-lg font-medium hover:bg-brand-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageCircle size={20} className="mr-2" />
        {contacting ? 'Opening conversation…' : 'Contact Owner'}
      </button>
      {contactError && (
        <p className="text-sm text-red-600 mt-2">{contactError}</p>
      )}
    </div>
  )
}

OwnerCard.propTypes = {
  owner: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string,
    verified: PropTypes.bool,
    _count: PropTypes.shape({ listings: PropTypes.number }),
  }).isRequired,
  onContact: PropTypes.func.isRequired,
  contacting: PropTypes.bool,
  contactError: PropTypes.string,
}

/** Star rating row (read-only). */
function Stars({ rating, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          className={
            n <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }
        />
      ))}
    </span>
  )
}

Stars.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.number,
}

/**
 * Reviews section — real reviews from tenants with an approved application.
 * Eligible tenants get a write form; everyone sees the list.
 */
function ReviewsSection({ listing, user }) {
  const [reviews, setReviews] = useState(listing.reviews || [])
  const [eligible, setEligible] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!user || user.userType !== 'student') return undefined
    let active = true
    reviewsService
      .getEligibility(listing.id)
      .then(result => {
        if (active) setEligible(Boolean(result?.eligible))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [listing.id, user])

  const average =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    setError('')
    try {
      const review = await reviewsService.create(listing.id, rating, comment)
      setReviews(prev => [review, ...prev])
      setEligible(false)
      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'Could not submit your review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {average && (
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Stars rating={Math.round(Number(average))} />
            {average} · {reviews.length}{' '}
            {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      {eligible && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="font-medium text-sm mb-2">
            You rented here — how was it?
          </p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className="p-0.5"
              >
                <Star
                  size={24}
                  className={
                    n <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-300'
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            maxLength={1000}
            placeholder="What should future tenants know? (optional)"
            onChange={e => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none mb-3"
          />
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      )}
      {submitted && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">
          Thanks — your review is live.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">
          No reviews yet. Reviews come from tenants whose applications were
          approved, so you can trust they actually rented here.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={
                    review.author?.avatarUrl ||
                    'https://via.placeholder.com/32?text=%20'
                  }
                  alt={review.author?.firstName || 'Tenant'}
                  className="w-8 h-8 rounded-full object-cover bg-gray-100"
                />
                <span className="font-medium text-sm">
                  {review.author?.firstName} {review.author?.lastName}
                </span>
                <Stars rating={review.rating} />
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(review.createdAt).toLocaleDateString([], {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

ReviewsSection.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.string.isRequired,
    reviews: PropTypes.array,
  }).isRequired,
  user: PropTypes.object,
}

/**
 * Property Detail View
 */
function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getListingById, selectedListing, isLoading, error } = useListings()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { user } = useAuth()
  const { isPreQualified } = usePreQualification()

  const [showShareModal, setShowShareModal] = useState(false)
  const [showGroupShare, setShowGroupShare] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [contactError, setContactError] = useState('')

  useEffect(() => {
    if (id) {
      getListingById(id)
    }
  }, [id, getListingById])

  const handleBack = () => {
    navigate(-1)
  }

  // Start (or resume) a conversation with the owner about this listing and
  // land directly in that thread. Requires login; owners can't message
  // themselves.
  const handleContact = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    const ownerId = selectedListing?.owner?.id
    if (!ownerId) {
      setContactError('Owner information is unavailable for this listing.')
      return
    }
    if (ownerId === user.id) {
      setContactError('This is your own listing.')
      return
    }
    setContacting(true)
    setContactError('')
    try {
      const data = await messagingService.startConversation(ownerId, id)
      const conversationId = data?.conversation?.id
      if (!conversationId) throw new Error('No conversation returned')
      navigate(`/messages/${conversationId}`)
    } catch {
      setContactError('Could not start the conversation. Please try again.')
    } finally {
      setContacting(false)
    }
  }

  const handleApply = () => {
    if (isPreQualified) {
      navigate(`/apply/${id}`)
    } else {
      navigate(`/pre-qualify?returnTo=/listings/${id}`)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedListing?.title,
        text: selectedListing?.description,
        url: window.location.href,
      })
    } else {
      setShowShareModal(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !selectedListing) {
    return (
      <div className="p-4">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 mb-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {error || 'Listing not found'}
          </h2>
          <button
            onClick={() => navigate('/listings')}
            className="text-brand-500 hover:underline"
          >
            Browse all listings
          </button>
        </div>
      </div>
    )
  }

  const listing = selectedListing
  const favorite = isFavorite(listing.id)

  return (
    <div className="bg-white">
      {/* Desktop: max-width container, Mobile: full width */}
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header with back button */}
        <div className="lg:hidden sticky top-16 z-10 bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(listing.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={
                  favorite ? 'Remove from favorites' : 'Add to favorites'
                }
              >
                <Heart
                  size={24}
                  className={
                    favorite ? 'text-red-500 fill-current' : 'text-gray-600'
                  }
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Share listing"
              >
                <Share2 size={24} className="text-gray-600" />
              </button>
              {user?.userType === 'student' && (
                <button
                  onClick={() => setShowGroupShare(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Share with your rental group"
                >
                  <Users size={24} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Two-column layout, Mobile: Stacked */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:p-8">
          {/* Left column: Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ImageGallery images={listing.images} />

            {/* Desktop action buttons */}
            <div className="hidden lg:flex gap-3 mt-4">
              <button
                onClick={() => toggleFavorite(listing.id)}
                className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart
                  size={20}
                  className={
                    favorite ? 'text-red-500 fill-current' : 'text-gray-600'
                  }
                />
                {favorite ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 size={20} className="text-gray-600" />
                Share
              </button>
              {user?.userType === 'student' && (
                <button
                  onClick={() => setShowGroupShare(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users size={20} className="text-gray-600" />
                  Share to Group
                </button>
              )}
            </div>
          </div>

          {/* Right column: Content */}
          <div className="p-4 lg:p-0">
            {/* Title and Price */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold flex-1 mr-4">
                  {listing.title}
                </h1>
                <span className="text-2xl font-bold text-green-600 whitespace-nowrap">
                  ${listing.price}/mo
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin size={18} className="mr-2 flex-shrink-0" />
                <span>{listing.location}</span>
              </div>

              {/* Dates */}
              <div className="flex items-center text-gray-600">
                <Calendar size={18} className="mr-2 flex-shrink-0" />
                <span>{listing.dates}</span>
              </div>
            </div>

            {/* Property Details */}
            <div className="flex gap-4 py-4 border-y border-gray-200 mb-4">
              <div className="flex items-center">
                <Bed size={20} className="text-gray-500 mr-2" />
                <span>
                  {listing.bedrooms === 0
                    ? 'Studio'
                    : `${listing.bedrooms} bed`}
                </span>
              </div>
              <div className="flex items-center">
                <Bath size={20} className="text-gray-500 mr-2" />
                <span>{listing.bathrooms} bath</span>
              </div>
              {listing.propertyType && (
                <div className="text-gray-600">{listing.propertyType}</div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">About this place</h2>
              <p className="text-gray-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {listing.amenities.map(amenity => (
                    <div
                      key={amenity}
                      className="flex items-center text-gray-700"
                    >
                      <Check size={18} className="text-green-500 mr-2" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Card */}
            {listing.owner && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Listed by</h2>
                <OwnerCard
                  owner={listing.owner}
                  onContact={handleContact}
                  contacting={contacting}
                  contactError={contactError}
                />
              </div>
            )}

            {/* Reviews from approved tenants */}
            <ReviewsSection listing={listing} user={user} />

            {/* Desktop CTA Buttons */}
            {user?.userType === 'student' && (
              <div className="hidden lg:flex flex-col gap-3 mt-6 pt-6 border-t">
                {!isPreQualified && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                    <strong>Pre-qualification required</strong> — Complete the
                    one-time $50 screening to apply to this and any listing.
                  </div>
                )}
                {isPreQualified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    You&apos;re pre-qualified — ready to apply instantly.
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleContact}
                    disabled={contacting}
                    className="flex-1 border-2 border-brand-500 text-brand-500 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    Message Owner
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
                  >
                    {isPreQualified ? 'Apply Now' : 'Get Pre-Qualified'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA */}
      {user?.userType === 'student' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20">
          <div className="flex gap-3">
            <button
              onClick={handleContact}
              disabled={contacting}
              className="flex-1 border-2 border-brand-500 text-brand-500 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              Message
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
            >
              {isPreQualified ? 'Apply Now' : 'Get Pre-Qualified'}
            </button>
          </div>
        </div>
      )}

      {/* Share to rental group */}
      {showGroupShare && (
        <ShareToGroupModal
          listing={listing}
          onClose={() => setShowGroupShare(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Share this listing</h3>
            <div className="flex items-center bg-gray-100 rounded-lg p-3 mb-4">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 bg-transparent text-sm"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setShowShareModal(false)
              }}
              className="w-full bg-brand-500 text-white py-2 rounded-lg mb-2"
            >
              Copy Link
            </button>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full text-gray-600 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetail
