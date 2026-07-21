import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader2, Bell, Trash2 } from 'lucide-react'
import { useFavorites } from '../../contexts/FavoritesContext'
import { listingsService } from '../../services/listingsService'
import { savedSearchesService } from '../../services/savedSearchesService'
import { ListingCard } from './BrowseView'

/** Human summary of a saved search's filters. */
function describeSearch(search) {
  const parts = []
  if (search.location) parts.push(search.location)
  if (search.minPrice != null && search.maxPrice != null) {
    parts.push(`$${search.minPrice}–$${search.maxPrice}/mo`)
  } else if (search.maxPrice != null) {
    parts.push(`under $${search.maxPrice}/mo`)
  } else if (search.minPrice != null) {
    parts.push(`over $${search.minPrice}/mo`)
  }
  if (search.minBeds != null) parts.push(`${search.minBeds}+ beds`)
  if (search.propertyType) parts.push(search.propertyType)
  return parts.join(' · ') || 'Any listing'
}

/**
 * Saved listings — the tenant's favorited rentals, loaded from the server so
 * they follow the account across devices.
 */
function SavedListings() {
  const navigate = useNavigate()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const [listings, setListings] = useState([])
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      listingsService.getFavorites(),
      savedSearchesService.list(),
    ])
      .then(([favResult, searchResult]) => {
        if (!active) return
        if (favResult.status === 'fulfilled') setListings(favResult.value)
        if (searchResult.status === 'fulfilled') setSearches(searchResult.value)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleDeleteSearch = async id => {
    setSearches(prev => prev.filter(s => s.id !== id))
    try {
      await savedSearchesService.remove(id)
    } catch {
      // Refresh on failure so the list reflects reality.
      savedSearchesService
        .list()
        .then(setSearches)
        .catch(() => {})
    }
  }

  // Un-hearting removes the card immediately; the context call persists it.
  const visible = listings.filter(l => favorites.includes(l.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={24} className="text-red-500 fill-current" />
        <h1 className="text-2xl font-bold">Saved rentals</h1>
      </div>

      {/* Search alerts */}
      {searches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Search alerts</h2>
          </div>
          <div className="space-y-2">
            {searches.map(search => (
              <div
                key={search.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {describeSearch(search)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Emails you when a matching listing is posted
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  aria-label="Delete search alert"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Nothing saved yet
          </h2>
          <p className="text-gray-500 mb-6">
            Tap the heart on any rental to keep it here.
          </p>
          <button
            onClick={() => navigate('/listings')}
            className="bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Browse rentals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onToggleFavorite={() => toggleFavorite(listing.id)}
              onClick={() => navigate(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedListings
