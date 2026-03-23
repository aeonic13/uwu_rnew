import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

// Create context
const FavoritesContext = createContext(null)

// Provider component
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem('favorites')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  // Toggle favorite status
  const toggleFavorite = useCallback((listingId) => {
    setFavorites((prev) => {
      if (prev.includes(listingId)) {
        return prev.filter((id) => id !== listingId)
      }
      return [...prev, listingId]
    })
  }, [])

  // Check if listing is favorited
  const isFavorite = useCallback(
    (listingId) => favorites.includes(listingId),
    [favorites]
  )

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

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
