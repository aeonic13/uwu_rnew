import { Outlet } from 'react-router-dom'
import Header from './Header'
import VerifyEmailBanner from './VerifyEmailBanner'
import PolicyUpdateBanner from './PolicyUpdateBanner'
/**
 * Responsive App Layout with header navigation
 */
function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <PolicyUpdateBanner />
      <VerifyEmailBanner />
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
