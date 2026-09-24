import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { messagingService } from '../../services/messagingService'
import {
  Menu,
  X,
  Home,
  Heart,
  MessageSquare,
  User,
  PlusCircle,
  LayoutDashboard,
  Inbox,
  DollarSign,
  LogOut,
  Building2,
  Users,
  Sparkles,
  LogIn,
  FileText,
  Shield,
} from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Global unread-message badge: poll every 30s, plus refresh on every
  // navigation so opening a thread clears the badge promptly. No reset on
  // logout is needed — guests have no Messages nav item, and a login
  // refetch overwrites any stale value before the badge can render.
  useEffect(() => {
    if (!user) return undefined
    let active = true
    const load = () =>
      messagingService
        .getUnreadCount()
        .then(data => {
          if (active) setUnreadTotal(data?.total || 0)
        })
        .catch(() => {})
    load()
    const timer = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [user, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = path => location.pathname === path

  // Student navigation items. Pre-qualification lives in the Profile menu
  // and as a contextual CTA (applications page, payments) rather than here.
  const studentNavItems = [
    { path: '/', label: 'Browse', icon: Home },
    { path: '/favorites', label: 'Saved', icon: Heart },
    { path: '/housemates', label: 'Housemates', icon: Sparkles },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/applications', label: 'Applications', icon: FileText },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  // Owner navigation items. Messages is included so landlords actually see
  // tenant conversations — the Inbox covers applications, not chat.
  const ownerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      path: '/dashboard/listings/new',
      label: 'Post Listing',
      icon: PlusCircle,
    },
    { path: '/dashboard/inbox', label: 'Inbox', icon: Inbox },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/payments', label: 'Payments', icon: DollarSign },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  // Guest users see Browse and List Your Property
  // Guarantors: just their dashboard and profile.
  const cosignerNavItems = [
    { path: '/cosigner', label: 'Cosigning', icon: Shield },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  const guestNavItems = [
    { path: '/listings', label: 'Browse', icon: Home },
    { path: '/register', label: 'List Your Property', icon: Building2 },
  ]

  const navItems = !user
    ? guestNavItems
    : user.userType === 'owner'
      ? ownerNavItems
      : user.userType === 'cosigner'
        ? cosignerNavItems
        : studentNavItems

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Rentra" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => {
              const Icon = item.icon
              const showBadge = item.path === '/messages' && unreadTotal > 0
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-50 text-brand-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span
                      aria-label={`${unreadTotal} unread messages`}
                      className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                    >
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const showBadge = item.path === '/messages' && unreadTotal > 0
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-50 text-brand-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span
                      aria-label={`${unreadTotal} unread messages`}
                      className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                    >
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </Link>
              )
            })}

            {user ? (
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogIn size={20} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-white bg-brand-500 hover:bg-brand-600"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
