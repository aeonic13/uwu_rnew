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
const StudentTenantDashboard = lazy(
  () => import('../features/profile/StudentTenantDashboard')
)
const PaymentsView = lazy(() => import('../features/payments/PaymentsView'))
const ApplicationFlow = lazy(
  () => import('../features/applications/ApplicationFlow')
)
const AgreementView = lazy(
  () => import('../features/applications/AgreementView')
)

// Housemates (available to all authenticated users)
const HousematesHub = lazy(() => import('../features/housemates/HousematesHub'))

// Auth pages
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))

// Owner-specific pages
const OwnerDashboard = lazy(() => import('../features/owner/OwnerDashboard'))
const LandlordInbox = lazy(() => import('../features/owner/LandlordInbox'))
const LandlordListingForm = lazy(
  () => import('../features/owner/LandlordListingForm')
)
const BankingBookkeeping = lazy(() => import('../BankingBookkeeping'))
const RentCollectionSystem = lazy(() => import('../RentCollectionSystem'))
const TaxCenter = lazy(() => import('../TaxCenter'))
const SecurityDepositManager = lazy(() => import('../SecurityDepositManager'))
const OwnerApprovalSystem = lazy(() => import('../OwnerApprovalSystem'))
const OwnerDocumentManager = lazy(() => import('../OwnerDocumentManager'))
const DisputeResolutionCenter = lazy(() => import('../DisputeResolutionCenter'))
const PropertyInspectionTools = lazy(() => import('../PropertyInspectionTools'))

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

// Landing page
const LandingPage = lazy(() => import('../features/landing/LandingPage'))

// Pre-qualification
const PreQualificationFlow = lazy(() => import('../features/applications/PreQualificationFlow'))

// Layout wrapper
const AppLayout = lazy(() => import('../components/layout/AppLayout'))

/**
 * Smart home page — shows landing page for guests, browse for tenants,
 * and redirects landlords to their dashboard
 */
function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <SuspenseFallback />
  }

  if (user?.userType === 'owner') {
    return <Navigate to="/dashboard" replace />
  }

  if (user) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <BrowseView />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <LandingPage />
    </Suspense>
  )
}

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
  // Auth pages (redirect if already logged in)
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

  // Main app layout — accessible to guests and authenticated users
  {
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <AppLayout />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      // Home — smart routing for guests, tenants, and landlords
      {
        path: '/',
        element: <HomePage />,
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

      // Tenant-only route
      {
        path: '/university-search',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <UniversitySearch />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Messaging routes (auth required)
      {
        path: '/messages',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <MessagesView />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/messages/:conversationId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <ConversationView />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Housemates route (tenant only, auth required)
      {
        path: '/housemates',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <HousematesHub />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Profile routes (auth required)
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <ProfileView />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/edit',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <EditProfile />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/tenant-dashboard',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <StudentTenantDashboard />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Payment routes (auth required)
      {
        path: '/payments',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <PaymentsView />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Pre-qualification (tenant only, auth required)
      {
        path: '/pre-qualify',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <PreQualificationFlow />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Application routes (auth required)
      {
        path: '/apply/:listingId',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <ApplicationFlow />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/agreement/:agreementId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <AgreementView />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      // Roommate routes (tenant only, auth required)
      {
        path: '/roommates',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <RoommateQuestionnaire />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/roommates/matching',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <RoommateMatching />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Group routes (tenant only, auth required)
      {
        path: '/groups',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <GroupDashboard />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/groups/create',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <CreateGroup />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/groups/:id',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <GroupDetail />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/groups/:id/chat',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <GroupChat groupId="" />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },

      // Landlord/Owner routes (auth required)
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <OwnerDashboard />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/inbox',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <LandlordInbox />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/listings/new',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <LandlordListingForm />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/listings/:id/edit',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <LandlordListingForm />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/banking',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <BankingBookkeeping />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/rent-collection',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <RentCollectionSystem />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/tax',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <TaxCenter />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/security-deposits',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <SecurityDepositManager />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/approvals',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <OwnerApprovalSystem />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/documents',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <OwnerDocumentManager />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/disputes',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <DisputeResolutionCenter />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/inspections',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <PropertyInspectionTools />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
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
