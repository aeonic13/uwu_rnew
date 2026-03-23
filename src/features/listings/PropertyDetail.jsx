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
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useFavorites } from '../../contexts/FavoritesContext'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Image gallery with navigation
 */
function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
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
function OwnerCard({ owner, onContact }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <img
          src={owner.avatar || 'https://via.placeholder.com/60'}
          alt={owner.name}
          className="w-14 h-14 rounded-full mr-3"
        />
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-semibold">{owner.name}</h3>
            {owner.verified && (
              <Shield size={16} className="ml-1 text-blue-500" />
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star size={14} className="text-yellow-400 fill-current mr-1" />
            <span>{owner.rating || 'N/A'}</span>
            {owner.reviewCount && (
              <span className="ml-1">({owner.reviewCount} reviews)</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onContact}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <MessageCircle size={20} className="mr-2" />
        Contact Owner
      </button>
    </div>
  )
}

OwnerCard.propTypes = {
  owner: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    rating: PropTypes.number,
    verified: PropTypes.bool,
    reviewCount: PropTypes.number,
  }).isRequired,
  onContact: PropTypes.func.isRequired,
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

  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (id) {
      getListingById(id)
    }
  }, [id, getListingById])

  const handleBack = () => {
    navigate(-1)
  }

  const handleContact = () => {
    // Navigate to messages or create new conversation
    navigate(`/messages?listingId=${id}`)
  }

  const handleApply = () => {
    navigate(`/apply/${id}`)
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
            className="text-blue-600 hover:underline"
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
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={24}
                  className={favorite ? 'text-red-500 fill-current' : 'text-gray-600'}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Share listing"
              >
                <Share2 size={24} className="text-gray-600" />
              </button>
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
                  className={favorite ? 'text-red-500 fill-current' : 'text-gray-600'}
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
            </div>
          </div>

          {/* Right column: Content */}
          <div className="p-4 lg:p-0">
        {/* Title and Price */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold flex-1 mr-4">{listing.title}</h1>
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
              {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}
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
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
        </div>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {listing.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center text-gray-700">
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
                <OwnerCard owner={listing.owner} onContact={handleContact} />
              </div>
            )}

            {/* Desktop CTA Buttons */}
            {user?.userType === 'student' && (
              <div className="hidden lg:flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={handleContact}
                  className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Message Owner
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </button>
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
                className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Message
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Now
              </button>
            </div>
          </div>
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg mb-2"
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
