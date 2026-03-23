import { Component } from 'react'
import PropTypes from 'prop-types'
import { useRouteError, Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Class-based error boundary for catching render errors
 */
class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // TODO: Log to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

ErrorBoundaryClass.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Fallback UI when an error occurs
 */
function ErrorFallback({ error, resetError }) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again or
          return to the home page.
        </p>

        {isDev && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-800 break-all">
              {error.message || String(error)}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {resetError && (
            <button
              onClick={resetError}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={18} className="mr-2" />
              Try Again
            </button>
          )}

          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home size={18} className="mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

ErrorFallback.propTypes = {
  error: PropTypes.object,
  resetError: PropTypes.func,
}

/**
 * Route error boundary for React Router errors
 */
function RouteErrorBoundary() {
  const error = useRouteError()

  return <ErrorFallback error={error} />
}

// Default export is the class component for wrapping children
export default ErrorBoundaryClass

// Named exports for specific use cases
export { ErrorFallback, RouteErrorBoundary }
