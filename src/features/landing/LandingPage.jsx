import { useNavigate } from 'react-router-dom'
import {
  Search,
  Building2,
  Home,
  ChevronRight,
  Shield,
  MessageSquare,
  DollarSign,
  Star,
  MapPin,
  Bed,
  Bath,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'

/**
 * Minimal listing preview card for the landing page
 */
function PreviewCard({ listing, onClick }) {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
      onClick={onClick}
    >
      <img
        src={
          listing.images?.[0] ||
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
        }
        alt={listing.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">
          ${listing.price.toLocaleString()}
          <span className="text-sm font-normal text-gray-500">/mo</span>
        </p>
        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
          <span className="flex items-center gap-1">
            <Bed size={13} />
            {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bd`}
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <Bath size={13} />
            {listing.bathrooms} ba
          </span>
        </div>
        <p className="text-gray-500 text-xs flex items-center gap-1 mt-1 truncate">
          <MapPin size={11} className="flex-shrink-0" />
          {listing.location}
        </p>
      </div>
    </div>
  )
}

/**
 * Landing page — entry point for both tenants and landlords
 */
export default function LandingPage() {
  const navigate = useNavigate()
  const { filteredListings } = useListings()

  const previewListings = filteredListings.slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="Rentra" className="h-14 w-auto brightness-0 invert" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Rentals made simple for<br />
            <span className="text-orange-200">tenants &amp; landlords</span>
          </h1>
          <p className="text-lg sm:text-xl text-brand-100 mb-10 max-w-xl mx-auto">
            Find your perfect rental, or list your property and connect with
            verified tenants — all in one place.
          </p>

          {/* Two path cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Tenant path */}
            <button
              onClick={() => navigate('/listings')}
              className="group bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-2xl p-6 text-left transition-all"
            >
              <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-4">
                <Search size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">I&apos;m a Tenant</h3>
              <p className="text-brand-100 text-sm mb-4">
                Browse verified rentals in your area, apply online, and manage
                your lease — no agent needed.
              </p>
              <span className="inline-flex items-center gap-1 text-white font-semibold text-sm group-hover:gap-2 transition-all">
                Browse Listings <ChevronRight size={16} />
              </span>
            </button>

            {/* Landlord path */}
            <button
              onClick={() => navigate('/register')}
              className="group bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-2xl p-6 text-left transition-all"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <Building2 size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">I&apos;m a Landlord</h3>
              <p className="text-brand-100 text-sm mb-4">
                List your property, screen tenants with verified applications,
                collect rent, and manage leases digitally.
              </p>
              <span className="inline-flex items-center gap-1 text-white font-semibold text-sm group-hover:gap-2 transition-all">
                List Your Property <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Why Rentra ── */}
      <div className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Everything you need in one platform
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield size={22} className="text-brand-500" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Verified Listings
            </h4>
            <p className="text-gray-500 text-sm">
              Every property and landlord is verified so you can rent with
              confidence.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={22} className="text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              In-App Messaging
            </h4>
            <p className="text-gray-500 text-sm">
              Communicate directly between tenants and landlords — no third
              parties.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={22} className="text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Online Rent &amp; Leases
            </h4>
            <p className="text-gray-500 text-sm">
              Pay rent, sign leases, and manage deposits — all digitally and
              securely.
            </p>
          </div>
        </div>
      </div>

      {/* ── Recent Listings Preview ── */}
      {previewListings.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Listings
            </h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-brand-500 font-medium text-sm hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {previewListings.map(listing => (
              <PreviewCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/listings/${listing.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Landlord CTA banner ── */}
      <div className="bg-green-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Have a property to rent out?
            </h3>
            <p className="text-green-100 text-sm">
              List for free and connect with verified tenants in your area.
              universities.
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="flex-shrink-0 bg-white text-green-700 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <Building2 size={18} />
            Get Started as Landlord
          </button>
        </div>
      </div>
    </div>
  )
}
