import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Search,
  MapPin,
  Heart,
  Shield,
  Building2,
  ChevronDown,
  SlidersHorizontal,
  Bed,
  Bath,
  Tag,
  Bell,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useFavorites } from '../../contexts/FavoritesContext'
import { useAuth } from '../../contexts/AuthContext'
import { savedSearchesService } from '../../services/savedSearchesService'
import { ListingShape } from '../../types/propTypes'
import AdvancedFiltersModal from '../../components/AdvancedFiltersModal'

const AREAS = [
  'All Areas',
  'San Diego',
  'Mission Valley',
  'Pacific Beach',
  'North Park',
  'Hillcrest',
]

const PROPERTY_TYPES = [
  'Any Type',
  'Apartment',
  'House',
  'Studio',
  'Single Room',
  'Condo',
]

const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: 'Under $800', min: 0, max: 800 },
  { label: '$800 – $1,200', min: 800, max: 1200 },
  { label: '$1,200 – $1,800', min: 1200, max: 1800 },
  { label: '$1,800 – $2,500', min: 1800, max: 2500 },
  { label: '$2,500+', min: 2500, max: Infinity },
]

const BEDS_OPTIONS = ['Any Beds', '1+', '2+', '3+', '4+']

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

/**
 * Zillow-style Listing Card
 */
function ListingCard({ listing, isFavorite, onToggleFavorite, onClick }) {
  const bedroomLabel =
    listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bd`

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-100"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={
            listing.images?.[0] ||
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
          }
          alt={listing.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Favorite button */}
        <button
          onClick={e => {
            e.stopPropagation()
            onToggleFavorite(listing.id)
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:scale-110 transition-transform"
          aria-label={isFavorite ? 'Remove from saved' : 'Save home'}
        >
          <Heart
            size={18}
            className={
              isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'
            }
          />
        </button>
        {/* Property type badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
          {listing.propertyType || 'Rental'}
        </span>
        {/* Email-confirmed badge — honest label: this only certifies the
            owner confirmed their email address, not their identity. */}
        {listing.owner?.verified && (
          <span
            title="This owner confirmed their email address"
            className="absolute bottom-3 left-3 bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
          >
            <Shield size={11} /> Email confirmed
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Price */}
        <p className="text-2xl font-bold text-gray-900 mb-1">
          ${listing.price.toLocaleString()}
          <span className="text-sm font-normal text-gray-500">/mo</span>
        </p>

        {/* Beds / Baths / Type */}
        <div className="flex items-center gap-3 text-gray-700 text-sm mb-2">
          <span className="flex items-center gap-1">
            <Bed size={14} />
            <strong>{bedroomLabel}</strong>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <Bath size={14} />
            <strong>{listing.bathrooms} ba</strong>
          </span>
          {listing.university && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1 text-brand-500">
                <MapPin size={14} />
                {listing.university}
              </span>
            </>
          )}
        </div>

        {/* Address */}
        <p className="text-gray-500 text-sm flex items-center gap-1 truncate">
          <MapPin size={13} className="flex-shrink-0" />
          {listing.location}
        </p>

        {/* Amenity pills */}
        {listing.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {listing.amenities.slice(0, 3).map(a => (
              <span
                key={a}
                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
              >
                {a}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-gray-400 text-xs px-1 py-0.5">
                +{listing.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

ListingCard.propTypes = {
  listing: ListingShape.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
}

/**
 * Browse View — Zillow-style listings page
 */
function BrowseView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filteredListings, filters, setFilters, clearFilters } = useListings()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0])
  const [minBeds, setMinBeds] = useState('Any Beds')
  const [propertyType, setPropertyType] = useState('Any Type')
  const [sortBy, setSortBy] = useState('newest')
  // Saved-search alert state: idle | saving | saved | error
  const [alertState, setAlertState] = useState('idle')
  const [alertMessage, setAlertMessage] = useState('')

  // Snapshot the current UI filters as a saved-search payload. Area comes
  // from the dropdown or, failing that, the free-text search term.
  const currentSearchFilters = () => {
    const payload = {}
    const area =
      (filters.university && filters.university !== 'All Universities'
        ? filters.university
        : filters.searchTerm) || ''
    if (area.trim()) payload.location = area.trim()
    if (priceRange.min > 0) payload.minPrice = priceRange.min
    if (priceRange.max !== Infinity) payload.maxPrice = priceRange.max
    if (minBeds !== 'Any Beds') payload.minBeds = parseInt(minBeds, 10)
    if (propertyType !== 'Any Type') payload.propertyType = propertyType
    return payload
  }

  const handleSaveSearch = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    const payload = currentSearchFilters()
    if (Object.keys(payload).length === 0) {
      setAlertState('error')
      setAlertMessage('Set an area or a filter first, then save the search.')
      return
    }
    setAlertState('saving')
    setAlertMessage('')
    try {
      await savedSearchesService.create(payload)
      setAlertState('saved')
      setAlertMessage("Saved — we'll email you when a match is posted.")
    } catch (err) {
      setAlertState('error')
      setAlertMessage(err?.message || 'Could not save this search.')
    }
  }

  // Apply local filters on top of context filters
  const displayedListings = useMemo(() => {
    let result = [...filteredListings]

    if (priceRange.max !== Infinity || priceRange.min !== 0) {
      result = result.filter(
        l => l.price >= priceRange.min && l.price <= priceRange.max
      )
    }

    if (minBeds !== 'Any Beds') {
      const min = parseInt(minBeds)
      result = result.filter(l => l.bedrooms >= min)
    }

    if (propertyType !== 'Any Type') {
      result = result.filter(
        l => l.propertyType?.toLowerCase() === propertyType.toLowerCase()
      )
    }

    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price)

    return result
  }, [filteredListings, priceRange, minBeds, propertyType, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero search bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by city, address, or neighborhood…"
                value={filters.searchTerm || ''}
                onChange={e => setFilters({ searchTerm: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Area filter */}
            <div className="relative hidden sm:block">
              <select
                value={filters.university || 'All Areas'}
                onChange={e =>
                  setFilters({
                    university:
                      e.target.value === 'All Areas' ? '' : e.target.value,
                  })
                }
                className="appearance-none pl-3 pr-8 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 bg-white cursor-pointer"
              >
                {AREAS.map(a => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Advanced filters */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center gap-2 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden md:inline">Filters</span>
            </button>
          </div>

          {/* ── Filter pills row ── */}
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Price */}
            <div className="relative flex-shrink-0">
              <select
                value={priceRange.label}
                onChange={e =>
                  setPriceRange(
                    PRICE_RANGES.find(p => p.label === e.target.value)
                  )
                }
                className="appearance-none pl-3 pr-7 py-1.5 border border-gray-300 rounded-full text-xs font-medium bg-white cursor-pointer hover:border-brand-500 focus:outline-none focus:border-brand-500"
              >
                {PRICE_RANGES.map(p => (
                  <option key={p.label}>{p.label}</option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Beds */}
            <div className="relative flex-shrink-0">
              <select
                value={minBeds}
                onChange={e => setMinBeds(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 border border-gray-300 rounded-full text-xs font-medium bg-white cursor-pointer hover:border-brand-500 focus:outline-none focus:border-brand-500"
              >
                {BEDS_OPTIONS.map(b => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Property type */}
            <div className="relative flex-shrink-0">
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 border border-gray-300 rounded-full text-xs font-medium bg-white cursor-pointer hover:border-brand-500 focus:outline-none focus:border-brand-500"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Clear filters */}
            {(filters.searchTerm ||
              filters.university ||
              priceRange.min !== 0 ||
              minBeds !== 'Any Beds' ||
              propertyType !== 'Any Type') && (
              <button
                onClick={() => {
                  clearFilters()
                  setPriceRange(PRICE_RANGES[0])
                  setMinBeds('Any Beds')
                  setPropertyType('Any Type')
                }}
                className="flex-shrink-0 pl-3 pr-4 py-1.5 border border-red-200 rounded-full text-xs font-medium text-red-500 bg-white hover:bg-red-50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {displayedListings.length.toLocaleString()} rental
              {displayedListings.length !== 1 ? 's' : ''}
            </h1>
            {filters.searchTerm && (
              <p className="text-sm text-gray-500 mt-0.5">
                Results for &ldquo;{filters.searchTerm}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save this search → email alerts on new matches */}
            <button
              onClick={handleSaveSearch}
              disabled={alertState === 'saving'}
              className="flex items-center gap-1.5 px-3 py-2 border border-brand-500 text-brand-500 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              <Bell size={15} />
              {alertState === 'saved' ? 'Alert on' : 'Get alerts'}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-brand-500"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {alertMessage && (
          <p
            className={`text-sm mb-4 -mt-2 ${
              alertState === 'error' ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {alertMessage}
          </p>
        )}

        {/* Grid */}
        {displayedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <Tag size={28} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No rentals found
            </h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Try widening your search or adjusting your filters.
            </p>
            <button
              onClick={() => {
                clearFilters()
                setPriceRange(PRICE_RANGES[0])
                setMinBeds('Any Beds')
                setPropertyType('Any Type')
              }}
              className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={isFavorite(listing.id)}
                onToggleFavorite={toggleFavorite}
                onClick={() => navigate(`/listings/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onClearFilters={clearFilters}
      />
    </div>
  )
}

export default BrowseView
// Reused by the Saved (favorites) page so cards look identical everywhere.
export { ListingCard }
