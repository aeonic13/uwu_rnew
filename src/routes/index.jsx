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
const SavedListings = lazy(() => import('../features/listings/SavedListings'))
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
const MyApplications = lazy(
  () => import('../features/applications/MyApplications')
)
const AgreementView = lazy(
  () => import('../features/applications/AgreementView')
)

// Housemates (available to all authenticated users)
const HousematesHub = lazy(() => import('../features/housemates/HousematesHub'))

// Auth pages
const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const CosignerAcceptPage = lazy(
  () => import('../features/cosigner/CosignerAcceptPage')
)

// Legal pages (public)
const TermsPage = lazy(() =>
  import('../features/legal/LegalPages').then(m => ({ default: m.TermsPage }))
)
const PrivacyPage = lazy(() =>
  import('../features/legal/LegalPages').then(m => ({ default: m.PrivacyPage }))
)

// Owner-specific pages
const OwnerDashboard = lazy(() => import('../features/owner/OwnerDashboard'))
const LandlordInbox = lazy(() => import('../features/owner/LandlordInbox'))
const LandlordListingForm = lazy(
  () => import('../features/owner/LandlordListingForm')
)
const RentCollection = lazy(() => import('../features/owner/RentCollection'))
const SecurityDeposits = lazy(
  () => import('../features/owner/SecurityDeposits')
)
const Bookkeeping = lazy(() => import('../features/owner/Bookkeeping'))
const TaxCenter = lazy(() => import('../features/owner/TaxCenter'))
const OwnerDocuments = lazy(() => import('../features/owner/Documents'))
// Not-yet-real owner screens are gated behind an honest Coming Soon page
// (launch plan P0-3). Their mock components stay in the repo as design
// references but are intentionally unrouted.
const ComingSoon = lazy(() => import('../components/common/ComingSoon'))

// Group features (student only)
const GroupDashboard = lazy(() => import('../features/groups/GroupDashboard'))
const CreateGroup = lazy(() => import('../features/groups/CreateGroup'))
const GroupDetail = lazy(() => import('../features/groups/GroupDetail'))
const GroupChat = lazy(() => import('../features/groups/GroupChat'))

// Landing page
const LandingPage = lazy(() => import('../features/landing/LandingPage'))

// Pre-qualification
const PreQualificationFlow = lazy(
  () => import('../features/applications/PreQualificationFlow')
)

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

  // Legal pages (public — the privacy URL is required for Plaid production)
  {
    path: '/terms',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <TermsPage />
      </Suspense>
    ),
  },
  {
    path: '/privacy',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <PrivacyPage />
      </Suspense>
    ),
  },

  // Cosigner invitation acceptance (public — reached from the email link)
  {
    path: '/cosigner/accept/:token',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <CosignerAcceptPage />
      </Suspense>
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
        path: '/favorites',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseFallback />}>
              <SavedListings />
            </Suspense>
          </ProtectedRoute>
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
        path: '/applications',
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <Suspense fallback={<SuspenseFallback />}>
                <MyApplications />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      },
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

      // Legacy roommate routes — superseded by the real Housemates feature.
      // Redirect any stray links/bookmarks there.
      {
        path: '/roommates',
        element: <Navigate to="/housemates" replace />,
      },
      {
        path: '/roommates/matching',
        element: <Navigate to="/housemates" replace />,
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
      // Live owner tools (wired to real APIs).
      ...[
        { path: '/dashboard/rent-collection', Component: RentCollection },
        { path: '/dashboard/security-deposits', Component: SecurityDeposits },
        { path: '/dashboard/banking', Component: Bookkeeping },
        { path: '/dashboard/tax', Component: TaxCenter },
        { path: '/dashboard/documents', Component: OwnerDocuments },
      ].map(({ path, Component }) => ({
        path,
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <Component />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      })),
      // Gated owner screens (P0-3): honest Coming Soon instead of mock data.
      ...[
        {
          path: '/dashboard/approvals',
          title: 'Approvals Center',
          description:
            'Approve or reject applicants from your Inbox today — a dedicated approvals workspace is coming.',
        },
        {
          path: '/dashboard/disputes',
          title: 'Dispute Resolution',
          description: 'Structured dispute and mediation tools are planned.',
        },
        {
          path: '/dashboard/inspections',
          title: 'Property Inspections',
          description:
            'Move-in/move-out inspections with saved photo reports are coming.',
        },
      ].map(({ path, title, description }) => ({
        path,
        element: (
          <ProtectedRoute>
            <RoleRoute allowedRoles={['owner']}>
              <Suspense fallback={<SuspenseFallback />}>
                <ComingSoon title={title} description={description} />
              </Suspense>
            </RoleRoute>
          </ProtectedRoute>
        ),
      })),
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
