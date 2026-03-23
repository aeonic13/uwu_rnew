import PropTypes from 'prop-types'
import { AuthProvider, useAuth } from './AuthContext'
import { ListingsProvider, useListings } from './ListingsContext'
import { FavoritesProvider, useFavorites } from './FavoritesContext'
import { GroupsProvider, useGroups } from './GroupsContext'
import { MessagingProvider, useMessaging } from './MessagingContext'
import { ApplicationsProvider, useApplications } from './ApplicationsContext'

/**
 * Combined provider that wraps all context providers
 * Order matters - outer providers are available to inner ones
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ListingsProvider>
        <FavoritesProvider>
          <GroupsProvider>
            <MessagingProvider>
              <ApplicationsProvider>{children}</ApplicationsProvider>
            </MessagingProvider>
          </GroupsProvider>
        </FavoritesProvider>
      </ListingsProvider>
    </AuthProvider>
  )
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
}

// Re-export all hooks and providers
export { AuthProvider, useAuth }
export { ListingsProvider, useListings }
export { FavoritesProvider, useFavorites }
export { GroupsProvider, useGroups }
export { MessagingProvider, useMessaging }
export { ApplicationsProvider, useApplications }
