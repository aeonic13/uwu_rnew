import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response

      // Unauthorized - only redirect if the user had an existing session (token expired)
      if (status === 401) {
        const hadToken = !!localStorage.getItem('authToken')
        localStorage.removeItem('authToken')
        // Only redirect to login if there was a token (session expired), not for guest requests
        if (hadToken && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }

      // Forbidden
      if (status === 403) {
        console.error('Access forbidden:', data.error?.message)
      }

      // Validation errors
      if (status === 400 || status === 422) {
        const message = data.error?.message || 'Validation error'
        return Promise.reject(new Error(message))
      }

      // Server errors
      if (status >= 500) {
        return Promise.reject(
          new Error('Server error. Please try again later.')
        )
      }

      // Return error message from response
      const message = data.error?.message || 'An error occurred'
      return Promise.reject(new Error(message))
    }

    // Network error
    if (error.request) {
      return Promise.reject(
        new Error('Network error. Please check your connection.')
      )
    }

    // Other errors
    return Promise.reject(error)
  }
)

// Helper methods for common HTTP operations
export const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
}

export default api
