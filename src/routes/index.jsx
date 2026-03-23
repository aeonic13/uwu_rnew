import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { RouteErrorBoundary } from '../components/ErrorBoundary'

// Lazy-loaded feature components
const BrowseView = lazy(() => import('../features/listings/BrowseView'))
const PropertyDetail = lazy(() => import('../features/listings/PropertyDetail'))
const UniversitySearch = lazy(() => import('../UniversitySearch'))
const MessagesView = lazy(() => import('../features/messaging/MessagesView'))
const ConversationView = lazy(
  () => import('../features/messaging/ConversationView')
)
const ProfileView = lazy(() => import('../features/profile/ProfileView'))
const EditProfile = lazy(() => import('../features/profile/EditProfile'))
const StudentTenantDashboard = lazy(() => import('../features/profile/StudentTenantDashboard'))
const PaymentsView = lazy(() => import('../features/payments/PaymentsView'))
const ApplicationFlow = lazy(
  () => import('../features/applications/ApplicationFlow')
)
const AgreementView = lazy(
  () => import('../features/applications/AgreementView')
)

// Auth pages
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))

// Owner-specific pages
const OwnerDashboard = lazy(() => import('../features/owner/OwnerDashboard'))
const LandlordInbox = lazy(() => import('../features/owner/LandlordInbox'))
const LandlordListingForm = lazy(
  () => import('../features/owner/LandlordListingForm')
)

// Roommate features (student only)
const RoommateQuestionnaire = lazy(
  () => import('../features/roommates/RoommateQuestionnaire')
)
const RoommateMatching = lazy(
  () => import('../features/roommates/RoommateMatching')
)

// Group features (student only)
const GroupDashboard = lazy(() => import('../features/groups/GroupDashboard'))
const CreateGroup = lazy(() => import('../features/groups/CreateGroup'))
const GroupDetail = lazy(() => import('../features/groups/GroupDetail'))
const GroupChat = lazy(() => import('../features/groups/GroupChat'))

// Layout wrapper
const AppLayout = lazy(() => import('../components/layout/AppLayout'))

/**
 * Loading fallback component for Suspense
 */
function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

/**
 * Protected route wrapper - requires authentication
 */
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <SuspenseFallback />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children || <Outlet />
}

/**
 * Role-based route wrapper - requires specific user type
 */
function RoleRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <SuspenseFallback />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.userType)) {
    // Redirect to appropriate home based on role
    const redirectPath = user.userType === 'owner' ? '/dashboard' : '/'
    return <Navigate to={redirectPath} replace />
  }

  return children || <Outlet />
}

/**
 * Public route wrapper - redirects authenticated users
 */
function PublicRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <SuspenseFallback />
  }

  if (user) {
    const redirectPath = user.userType === 'owner' ? '/dashboard' : '/'
    return <Navigate to={redirectPath} replace />
  }

  return children || <Outlet />
}

/**
 * Route configuration
 */
const routeConfig = [
  // Public routes (no auth required)
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<SuspenseFallback />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Suspense fallback={<SuspenseFallback />}>
          <RegisterPage />
        </Suspense>
      </PublicRoute>
    ),
  },

  // Protected routes with layout
  {
    element: (
      <ProtectedRoute>
        <Suspense fallback={<SuspenseFallback />}>
          <AppLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      // Student routes
      {
        path: '/',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <BrowseView />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/listings',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <BrowseView />
          </Suspense>
        ),
      },
      {
        path: '/listings/:id',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <PropertyDetail />
          </Suspense>
        ),
      },
      {
        path: '/university-search',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <UniversitySearch />
            </Suspense>
          </RoleRoute>
        ),
      },

      // Messaging routes
      {
        path: '/messages',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <MessagesView />
          </Suspense>
        ),
      },
      {
        path: '/messages/:conversationId',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ConversationView />
          </Suspense>
        ),
      },

      // Profile routes
      {
        path: '/profile',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <ProfileView />
          </Suspense>
        ),
      },
      {
        path: '/profile/edit',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <EditProfile />
          </Suspense>
        ),
      },
      {
        path: '/profile/tenant-dashboard',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <StudentTenantDashboard />
            </Suspense>
          </RoleRoute>
        ),
      },

      // Payment routes
      {
        path: '/payments',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <PaymentsView />
          </Suspense>
        ),
      },

      // Application routes
      {
        path: '/apply/:listingId',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <ApplicationFlow />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/agreement/:agreementId',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AgreementView />
          </Suspense>
        ),
      },

      // Roommate routes (student only)
      {
        path: '/roommates',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <RoommateQuestionnaire />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/roommates/matching',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <RoommateMatching />
            </Suspense>
          </RoleRoute>
        ),
      },

      // Group routes (student only)
      {
        path: '/groups',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <GroupDashboard />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/groups/create',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <CreateGroup />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/groups/:id',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <GroupDetail />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/groups/:id/chat',
        element: (
          <RoleRoute allowedRoles={['student']}>
            <Suspense fallback={<SuspenseFallback />}>
              <GroupChat groupId="" />
            </Suspense>
          </RoleRoute>
        ),
      },

      // Owner routes
      {
        path: '/dashboard',
        element: (
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<SuspenseFallback />}>
              <OwnerDashboard />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/dashboard/inbox',
        element: (
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<SuspenseFallback />}>
              <LandlordInbox />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/dashboard/listings/new',
        element: (
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<SuspenseFallback />}>
              <LandlordListingForm />
            </Suspense>
          </RoleRoute>
        ),
      },
      {
        path: '/dashboard/listings/:id/edit',
        element: (
          <RoleRoute allowedRoles={['owner']}>
            <Suspense fallback={<SuspenseFallback />}>
              <LandlordListingForm />
            </Suspense>
          </RoleRoute>
        ),
      },
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

/**
 * Create the router instance
 */
const router = createBrowserRouter(routeConfig)

/**
 * Router provider component
 */
export default function AppRouter() {
  return <RouterProvider router={router} />
}

// Export route helpers for programmatic navigation
export { ProtectedRoute, RoleRoute, PublicRoute }
