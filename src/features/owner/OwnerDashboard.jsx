import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LegacyOwnerDashboard from '../../OwnerDashboard'

// Map legacy onNavigate keys to real router paths
const NAV_MAP = {
  'banking-bookkeeping': '/dashboard/banking',
  'rent-collection': '/dashboard/rent-collection',
  'tax-center': '/dashboard/tax',
  'security-deposit': '/dashboard/security-deposits',
  'owner-approval': '/dashboard/approvals',
  'landlord-inbox': '/dashboard/inbox',
  'landlord-listing': '/dashboard/listings/new',
  'owner-document-manager': '/dashboard/documents',
  'property-inspection': '/dashboard/inspections',
  'dispute-resolution': '/dashboard/disputes',
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleNavigate = key => {
    const path = NAV_MAP[key]
    if (path) {
      navigate(path)
    } else {
      console.warn('Unknown navigation key:', key)
    }
  }

  return (
    <LegacyOwnerDashboard
      user={user}
      onBack={() => navigate(-1)}
      onNavigate={handleNavigate}
    />
  )
}
