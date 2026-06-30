import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  School,
  Shield,
  Edit,
  Heart,
  FileText,
  CreditCard,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Home,
  Settings,
  DollarSign,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useFavorites } from '../../contexts/FavoritesContext'

/**
 * Menu item component
 */
function MenuItem({ icon: Icon, label, onClick, badge, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
        danger ? 'text-red-600' : ''
      }`}
    >
      <div className="flex items-center">
        <Icon size={20} className={danger ? 'text-red-500' : 'text-gray-500'} />
        <span className="ml-3 font-medium">{label}</span>
      </div>
      <div className="flex items-center">
        {badge && (
          <span className="bg-brand-100 text-brand-500 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
            {badge}
          </span>
        )}
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </button>
  )
}

/**
 * Menu section
 */
function MenuSection({ title, children }) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

/**
 * Profile View - Main profile page
 */
function ProfileView() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { favoritesCount } = useFavorites()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isOwner = user?.userType === 'owner'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/80'}
              alt={user?.name || 'Profile'}
              className="w-20 h-20 rounded-full object-cover"
            />
            {user?.verified && (
              <div className="absolute -bottom-1 -right-1 bg-brand-500 rounded-full p-1">
                <Shield size={14} className="text-white" />
              </div>
            )}
          </div>

          <div className="ml-4 flex-1">
            <h1 className="text-xl font-bold">
              {user?.name || user?.firstName
                ? `${user.firstName} ${user.lastName || ''}`
                : 'Guest User'}
            </h1>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            {user?.university && (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <School size={14} className="mr-1" />
                {user.university}
              </div>
            )}
            {/* Social Media Links */}
            {(user?.instagramUrl || user?.linkedinUrl) && (
              <div className="flex items-center gap-2 mt-2">
                {user?.instagramUrl && (
                  <a
                    href={user.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors"
                    aria-label="Instagram profile"
                  >
                    <Instagram size={18} className="text-pink-600" />
                  </a>
                )}
                {user?.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-brand-50 hover:bg-brand-100 rounded-full transition-colors"
                    aria-label="LinkedIn profile"
                  >
                    <Linkedin size={18} className="text-brand-500" />
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/profile/edit')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Edit profile"
          >
            <Edit size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Verification Badge */}
        {user?.verified ? (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <Shield size={18} className="text-green-600 mr-2" />
            <span className="text-green-700 text-sm font-medium">
              Verified {isOwner ? 'Property Owner' : 'Student'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/profile/verify')}
            className="mt-4 w-full bg-brand-50 border border-brand-200 rounded-lg p-3 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors"
          >
            <Shield size={18} className="mr-2" />
            <span className="text-sm font-medium">Verify your account</span>
          </button>
        )}
      </div>

      {/* Menu Sections */}
      <div className="p-4">
        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            icon={User}
            label="Edit Profile"
            onClick={() => navigate('/profile/edit')}
          />
          {!isOwner && (
            <>
              <MenuItem
                icon={DollarSign}
                label="Tenant Dashboard"
                onClick={() => navigate('/profile/tenant-dashboard')}
              />
              <MenuItem
                icon={Heart}
                label="Saved Properties"
                badge={favoritesCount > 0 ? favoritesCount : null}
                onClick={() => navigate('/profile/favorites')}
              />
            </>
          )}
          {isOwner && (
            <MenuItem
              icon={Home}
              label="My Listings"
              onClick={() => navigate('/dashboard/listings')}
            />
          )}
          <MenuItem
            icon={FileText}
            label="Application History"
            onClick={() => navigate('/profile/applications')}
          />
        </MenuSection>

        {/* Payments Section */}
        <MenuSection title="Payments">
          <MenuItem
            icon={CreditCard}
            label="Payment Methods"
            onClick={() => navigate('/payments')}
          />
          {isOwner && (
            <MenuItem
              icon={CreditCard}
              label="Payout Settings"
              onClick={() => navigate('/dashboard/payouts')}
            />
          )}
        </MenuSection>

        {/* Settings Section */}
        <MenuSection title="Settings">
          <MenuItem
            icon={Bell}
            label="Notifications"
            onClick={() => navigate('/profile/notifications')}
          />
          <MenuItem
            icon={Lock}
            label="Privacy & Security"
            onClick={() => navigate('/profile/privacy')}
          />
          <MenuItem
            icon={Settings}
            label="Preferences"
            onClick={() => navigate('/profile/preferences')}
          />
        </MenuSection>

        {/* Support Section */}
        <MenuSection title="Support">
          <MenuItem
            icon={HelpCircle}
            label="Help Center"
            onClick={() => navigate('/help')}
          />
          <MenuItem
            icon={Mail}
            label="Contact Support"
            onClick={() => navigate('/support')}
          />
        </MenuSection>

        {/* Logout */}
        <MenuSection>
          <MenuItem
            icon={LogOut}
            label="Log Out"
            onClick={handleLogout}
            danger
          />
        </MenuSection>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 mt-4">Rentra v1.0.0</p>
      </div>
    </div>
  )
}

export default ProfileView
