import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import PropTypes from 'prop-types'
import { useAuth } from './AuthContext'
import { listingsService } from '../services/listingsService'

// Create context
const FavoritesContext = createContext(null)

function readLocalFavorites() {
  try {
    const stored = localStorage.getItem('favorites')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Favorites provider. Two lists, one active at a time: logged-in users sync
 * against the backend Favorite table (saves follow the account across
 * devices); guests keep a localStorage list so hearts work before signup.
 * Deriving the active list (instead of resetting state on auth changes)
 * keeps the two modes from bleeding into each other.
 */
export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [localFavorites, setLocalFavorites] = useState(readLocalFavorites)
  const [serverFavorites, setServerFavorites] = useState([])

  const favorites = user ? serverFavorites : localFavorites

  // Persist the guest list.
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(localFavorites))
  }, [localFavorites])

  // On login, load server favorites (IDs).
  useEffect(() => {
    if (!user) return undefined
    let active = true
    listingsService
      .getFavorites()
      .then(listings => {
        if (active) setServerFavorites(listings.map(l => l.id))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  // Toggle favorite status. Optimistic in both modes; logged-in users also
  // persist to the server and roll back if that fails.
  const toggleFavorite = useCallback(
    listingId => {
      const flip = prev =>
        prev.includes(listingId)
          ? prev.filter(id => id !== listingId)
          : [...prev, listingId]

      if (user) {
        setServerFavorites(flip)
        listingsService.toggleFavorite(listingId).catch(() => {
          // Roll back the optimistic flip on failure.
          setServerFavorites(flip)
        })
      } else {
        setLocalFavorites(flip)
      }
    },
    [user]
  )

  // Check if listing is favorited
  const isFavorite = useCallback(
    listingId => favorites.includes(listingId),
    [favorites]
  )

  // Clear the active list
  const clearFavorites = useCallback(() => {
    if (user) setServerFavorites([])
    else setLocalFavorites([])
  }, [user])

  // Get count of favorites
  const favoritesCount = favorites.length

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

FavoritesProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export default FavoritesContext
