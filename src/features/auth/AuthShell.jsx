import PropTypes from 'prop-types'

/**
 * Shared frame for the small auth pages (forgot / reset / verify): logo bar,
 * centered card, title and lead. Matches the login page.
 */
export default function AuthShell({ title, lead, children, footer }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-center">
          <img src="/logo.svg" alt="Rentra" className="h-10 w-auto" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
            {lead && <p className="text-gray-600 text-center mb-6">{lead}</p>}
            {children}
          </div>
          {footer && (
            <div className="text-center mt-6 text-gray-600">{footer}</div>
          )}
        </div>
      </div>
    </div>
  )
}

AuthShell.propTypes = {
  title: PropTypes.string.isRequired,
  lead: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
}
