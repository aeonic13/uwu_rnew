import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  Star,
  Shield,
  Building2,
  Sliders,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useFavorites } from '../../contexts/FavoritesContext'
import { ListingShape } from '../../types/propTypes'
import AdvancedFiltersModal from '../../components/AdvancedFiltersModal'

// Universities list
const universities = [
  'All Universities',
  'USC',
  'UCLA',
  'NYU',
  'Stanford',
  'Harvard',
  'MIT',
]

/**
 * Listing Card component
 */
function ListingCard({ listing, isFavorite, onToggleFavorite, onClick }) {
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={listing.images?.[0] || 'https://via.placeholder.com/400x200'}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(listing.id)
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={20}
            className={
              isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'
            }
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
          <span className="text-xl font-bold text-green-600 whitespace-nowrap ml-2">
            ${listing.price}/mo
          </span>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{listing.location}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-3">
          <Calendar size={16} className="mr-1 flex-shrink-0" />
          <span className="text-sm">{listing.dates}</span>
        </div>

        <div className="flex items-center">
          <img
            src={listing.owner?.avatar || 'https://via.placeholder.com/40'}
            alt={listing.owner?.name || 'Owner'}
            className="w-8 h-8 rounded-full mr-2"
          />
          <span className="text-sm font-medium">
            {listing.owner?.name || 'Owner'}
          </span>
          {listing.owner?.verified && (
            <Shield size={16} className="ml-1 text-blue-500" />
          )}
          <div className="ml-auto flex items-center">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm ml-1">{listing.owner?.rating || 'N/A'}</span>
          </div>
        </div>
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
 * Browse View - Main listings page for students
 */
function BrowseView() {
  const navigate = useNavigate()
  const { filteredListings, filters, setFilters, clearFilters } = useListings()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleSearchChange = (e) => {
    setFilters({ searchTerm: e.target.value })
  }

  const handleUniversityChange = (e) => {
    setFilters({ university: e.target.value })
  }

  const handleListingClick = (listing) => {
    navigate(`/listings/${listing.id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search locations..."
          value={filters.searchTerm || ''}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="absolute right-3 top-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Advanced filters"
        >
          <Sliders size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* University Search Button */}
        <button
          onClick={() => navigate('/university-search')}
          className="p-3 border-2 border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center font-medium"
        >
          <Building2 size={20} className="mr-2" />
          University Search
        </button>

        {/* University Filter */}
        <select
          value={filters.university || 'All Universities'}
          onChange={handleUniversityChange}
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {universities.map((uni) => (
            <option key={uni} value={uni}>
              {uni}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm text-gray-600">
        {filteredListings.length} listing
        {filteredListings.length !== 1 ? 's' : ''} found
      </div>

      {/* Responsive Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No listings found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onToggleFavorite={toggleFavorite}
              onClick={() => handleListingClick(listing)}
            />
          ))
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
