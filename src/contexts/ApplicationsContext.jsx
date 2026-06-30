import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react'
import PropTypes from 'prop-types'
import { applicationsService } from '../services/applicationsService'
import { useAuth } from './AuthContext'

// Initial state
const initialState = {
  applications: [], // User's applications
  ownerApplications: [], // Applications for owner's listings
  currentApplication: null,
  isLoading: false,
  error: null,
}

// Action types
const APPLICATIONS_ACTIONS = {
  SET_APPLICATIONS: 'SET_APPLICATIONS',
  SET_OWNER_APPLICATIONS: 'SET_OWNER_APPLICATIONS',
  SET_CURRENT_APPLICATION: 'SET_CURRENT_APPLICATION',
  ADD_APPLICATION: 'ADD_APPLICATION',
  UPDATE_APPLICATION: 'UPDATE_APPLICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
}

// Reducer
function applicationsReducer(state, action) {
  switch (action.type) {
    case APPLICATIONS_ACTIONS.SET_APPLICATIONS:
      return { ...state, applications: action.payload, isLoading: false }

    case APPLICATIONS_ACTIONS.SET_OWNER_APPLICATIONS:
      return { ...state, ownerApplications: action.payload, isLoading: false }

    case APPLICATIONS_ACTIONS.SET_CURRENT_APPLICATION:
      return { ...state, currentApplication: action.payload }

    case APPLICATIONS_ACTIONS.ADD_APPLICATION:
      return {
        ...state,
        applications: [action.payload, ...state.applications],
      }

    case APPLICATIONS_ACTIONS.UPDATE_APPLICATION:
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === action.payload.id ? action.payload : app
        ),
        ownerApplications: state.ownerApplications.map(app =>
          app.id === action.payload.id ? action.payload : app
        ),
        currentApplication:
          state.currentApplication?.id === action.payload.id
            ? action.payload
            : state.currentApplication,
      }

    case APPLICATIONS_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case APPLICATIONS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    default:
      return state
  }
}

// Create context
const ApplicationsContext = createContext(null)

// Provider component
export function ApplicationsProvider({ children }) {
  const [state, dispatch] = useReducer(applicationsReducer, initialState)
  const { user } = useAuth()

  // Fetch user's applications (as student/applicant)
  const fetchUserApplications = useCallback(async () => {
    dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: true })

    try {
      const data = await applicationsService.getUserApplications()
      const applications = data.applications || []

      dispatch({
        type: APPLICATIONS_ACTIONS.SET_APPLICATIONS,
        payload: applications,
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true, applications }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Fetch owner's applications (as landlord)
  const fetchOwnerApplications = useCallback(async () => {
    dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: true })

    try {
      const data = await applicationsService.getOwnerApplications()
      const applications = data.applications || []

      dispatch({
        type: APPLICATIONS_ACTIONS.SET_OWNER_APPLICATIONS,
        payload: applications,
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true, applications }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Get single application by ID
  const getApplication = useCallback(async applicationId => {
    dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: true })

    try {
      const data = await applicationsService.getApplication(applicationId)
      const application = data.application

      dispatch({
        type: APPLICATIONS_ACTIONS.SET_CURRENT_APPLICATION,
        payload: application,
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: false })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true, application }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Submit a new application
  const submitApplication = useCallback(async applicationData => {
    dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: true })

    try {
      const data = await applicationsService.submitApplication(applicationData)
      const application = data.application

      dispatch({
        type: APPLICATIONS_ACTIONS.ADD_APPLICATION,
        payload: application,
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_LOADING, payload: false })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true, application }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Update application status (owner only)
  const updateApplicationStatus = useCallback(async (applicationId, status) => {
    try {
      const data = await applicationsService.updateStatus(applicationId, status)
      const application = data.application

      dispatch({
        type: APPLICATIONS_ACTIONS.UPDATE_APPLICATION,
        payload: application,
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true, application }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Withdraw application (applicant only)
  const withdrawApplication = useCallback(async applicationId => {
    try {
      await applicationsService.withdraw(applicationId)

      dispatch({
        type: APPLICATIONS_ACTIONS.UPDATE_APPLICATION,
        payload: { id: applicationId, status: 'cancelled' },
      })
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: null })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: APPLICATIONS_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Get applications for a specific listing (owner only)
  const getListingApplications = useCallback(async listingId => {
    try {
      const data = await applicationsService.getListingApplications(listingId)
      return { success: true, applications: data.applications }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Auto-fetch applications when user logs in
  useEffect(() => {
    if (user) {
      // Fetch appropriate applications based on user type
      if (user.userType === 'OWNER') {
        fetchOwnerApplications()
      } else {
        fetchUserApplications()
      }
    }
  }, [user, fetchUserApplications, fetchOwnerApplications])

  const value = {
    ...state,
    fetchUserApplications,
    fetchOwnerApplications,
    getApplication,
    submitApplication,
    updateApplicationStatus,
    withdrawApplication,
    getListingApplications,
  }

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  )
}

ApplicationsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook
export function useApplications() {
  const context = useContext(ApplicationsContext)
  if (!context) {
    throw new Error(
      'useApplications must be used within an ApplicationsProvider'
    )
  }
  return context
}

export default ApplicationsContext
