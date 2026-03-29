import { useNavigate, useParams } from 'react-router-dom'
import LegacyLandlordListingForm from '../../LandlordListingForm'

export default function LandlordListingForm() {
  const navigate = useNavigate()

  return (
    <LegacyLandlordListingForm
      onBack={() => navigate('/dashboard')}
      onSubmit={() => navigate('/dashboard')}
    />
  )
}
