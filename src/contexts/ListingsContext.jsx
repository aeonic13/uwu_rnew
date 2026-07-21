import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react'
import PropTypes from 'prop-types'
import { listingsService } from '../services/listingsService'

// Initial state
const initialState = {
  listings: [],
  filteredListings: [],
  selectedListing: null,
  filters: {
    searchTerm: '',
    university: 'All Universities',
    minRent: null,
    maxRent: null,
    propertyType: null,
    bedrooms: null,
    bathrooms: null,
    amenities: [],
    moveInDate: null,
  },
  isLoading: false,
  error: null,
}

// Action types
const LISTINGS_ACTIONS = {
  SET_LISTINGS: 'SET_LISTINGS',
  SET_FILTERED_LISTINGS: 'SET_FILTERED_LISTINGS',
  SET_SELECTED_LISTING: 'SET_SELECTED_LISTING',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_LISTING: 'ADD_LISTING',
  UPDATE_LISTING: 'UPDATE_LISTING',
  REMOVE_LISTING: 'REMOVE_LISTING',
}

// Reducer
function listingsReducer(state, action) {
  switch (action.type) {
    case LISTINGS_ACTIONS.SET_LISTINGS:
      return { ...state, listings: action.payload, isLoading: false }

    case LISTINGS_ACTIONS.SET_FILTERED_LISTINGS:
      return { ...state, filteredListings: action.payload }

    case LISTINGS_ACTIONS.SET_SELECTED_LISTING:
      return { ...state, selectedListing: action.payload }

    case LISTINGS_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } }

    case LISTINGS_ACTIONS.CLEAR_FILTERS:
      return { ...state, filters: initialState.filters }

    case LISTINGS_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case LISTINGS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    case LISTINGS_ACTIONS.ADD_LISTING:
      return { ...state, listings: [action.payload, ...state.listings] }

    case LISTINGS_ACTIONS.UPDATE_LISTING:
      return {
        ...state,
        listings: state.listings.map(listing =>
          listing.id === action.payload.id ? action.payload : listing
        ),
      }

    case LISTINGS_ACTIONS.REMOVE_LISTING:
      return {
        ...state,
        listings: state.listings.filter(
          listing => listing.id !== action.payload
        ),
      }

    default:
      return state
  }
}

// Filter helper function
function applyFilters(listings, filters) {
  return listings.filter(listing => {
    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      const matchesSearch =
        listing.title.toLowerCase().includes(term) ||
        listing.location.toLowerCase().includes(term) ||
        listing.description.toLowerCase().includes(term)
      if (!matchesSearch) return false
    }

    // Area filter. The dropdown mixes neighborhood names and university
    // names, so match case-insensitively against BOTH the listing's
    // location and its university field (exact equality against
    // `university` alone made every neighborhood selection return zero).
    if (filters.university && filters.university !== 'All Universities') {
      const area = filters.university.toLowerCase()
      const location = (listing.location || '').toLowerCase()
      const university = (listing.university || '').toLowerCase()
      if (!location.includes(area) && !university.includes(area)) {
        return false
      }
    }

    // Price range filter
    if (filters.minRent && listing.price < filters.minRent) return false
    if (filters.maxRent && listing.price > filters.maxRent) return false

    // Property type filter
    if (filters.propertyType && listing.propertyType !== filters.propertyType) {
      return false
    }

    // Bedrooms filter
    if (filters.bedrooms !== null && listing.bedrooms !== filters.bedrooms) {
      return false
    }

    // Bathrooms filter
    if (filters.bathrooms !== null && listing.bathrooms !== filters.bathrooms) {
      return false
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity =>
        listing.amenities.includes(amenity)
      )
      if (!hasAllAmenities) return false
    }

    // Move-in date filter (with 2-week flexibility)
    if (filters.moveInDate && listing.moveInDate) {
      const filterDate = new Date(filters.moveInDate)
      const listingDate = new Date(listing.moveInDate)
      const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000
      const dateDiff = Math.abs(listingDate - filterDate)
      if (dateDiff > twoWeeksInMs) return false
    }

    return true
  })
}

// Create context
const ListingsContext = createContext(null)

// Provider component
export function ListingsProvider({ children }) {
  const [state, dispatch] = useReducer(listingsReducer, initialState)

  // Fetch listings from API
  const fetchListings = useCallback(async (params = {}) => {
    dispatch({ type: LISTINGS_ACTIONS.SET_LOADING, payload: true })

    try {
      const listings = await listingsService.getListings(params)
      dispatch({ type: LISTINGS_ACTIONS.SET_LISTINGS, payload: listings })
      dispatch({
        type: LISTINGS_ACTIONS.SET_FILTERED_LISTINGS,
        payload: listings,
      })
    } catch (error) {
      dispatch({ type: LISTINGS_ACTIONS.SET_ERROR, payload: error.message })
    }
  }, [])

  // Fetch listings on mount
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Set filters and apply them
  const setFilters = useCallback(
    newFilters => {
      dispatch({ type: LISTINGS_ACTIONS.SET_FILTERS, payload: newFilters })

      const updatedFilters = { ...state.filters, ...newFilters }
      const filtered = applyFilters(state.listings, updatedFilters)
      dispatch({
        type: LISTINGS_ACTIONS.SET_FILTERED_LISTINGS,
        payload: filtered,
      })
    },
    [state.listings, state.filters]
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    dispatch({ type: LISTINGS_ACTIONS.CLEAR_FILTERS })
    dispatch({
      type: LISTINGS_ACTIONS.SET_FILTERED_LISTINGS,
      payload: state.listings,
    })
  }, [state.listings])

  // Select a listing
  const selectListing = useCallback(listing => {
    dispatch({ type: LISTINGS_ACTIONS.SET_SELECTED_LISTING, payload: listing })
  }, [])

  // Get listing by ID
  const getListingById = useCallback(
    async id => {
      // First check local state
      const local = state.listings.find(l => l.id === parseInt(id))
      if (local) {
        dispatch({
          type: LISTINGS_ACTIONS.SET_SELECTED_LISTING,
          payload: local,
        })
        return local
      }

      // Otherwise fetch from API
      try {
        const listing = await listingsService.getListingById(id)
        dispatch({
          type: LISTINGS_ACTIONS.SET_SELECTED_LISTING,
          payload: listing,
        })
        return listing
      } catch (error) {
        dispatch({ type: LISTINGS_ACTIONS.SET_ERROR, payload: error.message })
        return null
      }
    },
    [state.listings]
  )

  // Create new listing
  const createListing = useCallback(async listingData => {
    dispatch({ type: LISTINGS_ACTIONS.SET_LOADING, payload: true })

    try {
      const newListing = await listingsService.createListing(listingData)
      dispatch({ type: LISTINGS_ACTIONS.ADD_LISTING, payload: newListing })
      return { success: true, listing: newListing }
    } catch (error) {
      dispatch({ type: LISTINGS_ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }, [])

  // Update listing
  const updateListing = useCallback(async (id, updates) => {
    try {
      const updatedListing = await listingsService.updateListing(id, updates)
      dispatch({
        type: LISTINGS_ACTIONS.UPDATE_LISTING,
        payload: updatedListing,
      })
      return { success: true, listing: updatedListing }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  // Delete listing
  const deleteListing = useCallback(async id => {
    try {
      await listingsService.deleteListing(id)
      dispatch({ type: LISTINGS_ACTIONS.REMOVE_LISTING, payload: id })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const value = {
    ...state,
    fetchListings,
    setFilters,
    clearFilters,
    selectListing,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
  }

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  )
}

ListingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook
export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider')
  }
  return context
}

export default ListingsContext
