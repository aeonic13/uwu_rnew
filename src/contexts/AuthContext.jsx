import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react'
import PropTypes from 'prop-types'
import { authService } from '../services/authService'

// Initial state
const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }

    default:
      return state
  }
}

// Create context
const AuthContext = createContext(null)

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const user = await authService.validateToken(token)
          if (user) {
            dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user })
          } else {
            localStorage.removeItem('authToken')
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('authToken')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    initAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

    try {
      const result = await authService.login(email, password)
      localStorage.setItem('authToken', result.token)
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: result.user })
      return { success: true }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Login failed',
      })
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async userData => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

    try {
      const result = await authService.register(userData)
      localStorage.setItem('authToken', result.token)
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: result.user })
      return { success: true }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Registration failed',
      })
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Update user profile
  const updateUser = async updates => {
    try {
      const updatedUser = await authService.updateProfile(updates)
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Re-fetch the signed-in user (e.g. after email verification flips a
  // flag server-side). Silent no-op when signed out or the token is stale.
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    try {
      const user = await authService.validateToken(token)
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user })
      return user
    } catch {
      return null
    }
  }, [])

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    clearError,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
