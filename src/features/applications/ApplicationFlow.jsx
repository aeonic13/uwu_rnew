import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  User,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useListings } from '../../contexts/ListingsContext'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STEPS = [
  { id: 'info', label: 'Your Info', icon: User },
  { id: 'dates', label: 'Dates', icon: Calendar },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'review', label: 'Review', icon: FileText },
]

/**
 * Progress indicator
 */
function ProgressSteps({ currentStep, steps }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-between px-4 py-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? <Check size={20} /> : <Icon size={20} />}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-1 mx-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Step 1: Personal Info
 */
function InfoStep({ formData, onChange, onNext, user }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.firstName?.trim()) newErrors.firstName = 'Required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Required'
    if (!formData.email?.trim()) newErrors.email = 'Required'
    if (!formData.phone?.trim()) newErrors.phone = 'Required'
    if (!formData.emergencyContact?.trim()) newErrors.emergencyContact = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Personal Information</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={`w-full p-3 border rounded-lg ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={`w-full p-3 border rounded-lg ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onChange({ email: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contact
        </label>
        <input
          type="text"
          value={formData.emergencyContact || ''}
          onChange={(e) => onChange({ emergencyContact: e.target.value })}
          placeholder="Name and phone number"
          className={`w-full p-3 border rounded-lg ${errors.emergencyContact ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message to Owner (Optional)
        </label>
        <textarea
          value={formData.message || ''}
          onChange={(e) => onChange({ message: e.target.value })}
          rows={3}
          placeholder="Introduce yourself..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Continue
      </button>
    </form>
  )
}

/**
 * Step 2: Dates
 */
function DatesStep({ formData, onChange, onNext, onBack, listing }) {
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!formData.moveInDate) newErrors.moveInDate = 'Required'
    if (!formData.moveOutDate) newErrors.moveOutDate = 'Required'
    if (formData.moveInDate && formData.moveOutDate) {
      if (new Date(formData.moveOutDate) <= new Date(formData.moveInDate)) {
        newErrors.moveOutDate = 'Must be after move-in date'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Select Dates</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-700">
          Available: {listing?.dates || 'Contact owner for availability'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Move-in Date
        </label>
        <input
          type="date"
          value={formData.moveInDate || ''}
          onChange={(e) => onChange({ moveInDate: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.moveInDate ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.moveInDate && (
          <p className="text-red-500 text-xs mt-1">{errors.moveInDate}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Move-out Date
        </label>
        <input
          type="date"
          value={formData.moveOutDate || ''}
          onChange={(e) => onChange({ moveOutDate: e.target.value })}
          className={`w-full p-3 border rounded-lg ${errors.moveOutDate ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.moveOutDate && (
          <p className="text-red-500 text-xs mt-1">{errors.moveOutDate}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  )
}

/**
 * Step 3: Payment
 */
function PaymentStep({ formData, onChange, onNext, onBack, listing }) {
  const serviceFee = Math.round((listing?.price || 0) * 0.03)
  const total = (listing?.price || 0) + serviceFee

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Payment Details</h2>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span>First Month&apos;s Rent</span>
          <span className="font-medium">${listing?.price || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Fee</span>
          <span className="font-medium">${serviceFee}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold">Due Now</span>
          <span className="font-bold text-lg">${total}</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5\" size={18} />
          <p className="text-sm text-yellow-700">
            Security deposit of ${(listing?.price || 0) * 2} will be due before move-in.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <select
          value={formData.paymentMethod || ''}
          onChange={(e) => onChange({ paymentMethod: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select payment method</option>
          <option value="card">Credit/Debit Card</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      {formData.paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.paymentMethod}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/**
 * Step 4: Review
 */
function ReviewStep({ formData, onBack, onSubmit, listing, isSubmitting }) {
  const serviceFee = Math.round((listing?.price || 0) * 0.03)
  const total = (listing?.price || 0) + serviceFee

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Review Application</h2>

      {/* Property Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Property</h3>
        <div className="flex items-center">
          <img
            src={listing?.images?.[0] || 'https://via.placeholder.com/80'}
            alt={listing?.title}
            className="w-16 h-16 rounded-lg object-cover mr-3"
          />
          <div>
            <p className="font-medium">{listing?.title}</p>
            <p className="text-sm text-gray-500">{listing?.location}</p>
            <p className="text-green-600 font-semibold">${listing?.price}/mo</p>
          </div>
        </div>
      </div>

      {/* Applicant Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Your Information</h3>
        <p>{formData.firstName} {formData.lastName}</p>
        <p className="text-sm text-gray-500">{formData.email}</p>
        <p className="text-sm text-gray-500">{formData.phone}</p>
      </div>

      {/* Dates */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Dates</h3>
        <p>Move-in: {formData.moveInDate}</p>
        <p>Move-out: {formData.moveOutDate}</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>First Month&apos;s Rent</span>
            <span>${listing?.price || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Fee</span>
            <span>${serviceFee}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Due Now</span>
            <span>${total}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="text-sm text-gray-500">
        By submitting, you agree to our Terms of Service and Privacy Policy.
        Payment will be processed once the owner approves your application.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

/**
 * Application Flow - Multi-step application
 */
function ApplicationFlow() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { getListingById, selectedListing, isLoading } = useListings()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState('info')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergencyContact: '',
    message: '',
    moveInDate: '',
    moveOutDate: '',
    paymentMethod: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (listingId) {
      getListingById(listingId)
    }
  }, [listingId, getListingById])

  const handleChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id)
    }
  }

  const handleBack = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // TODO: Submit application via API
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    navigate('/profile/applications')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Apply for Rental</h1>
        </div>
        <ProgressSteps currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Step Content */}
      {currentStep === 'info' && (
        <InfoStep
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          user={user}
        />
      )}
      {currentStep === 'dates' && (
        <DatesStep
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          listing={selectedListing}
        />
      )}
      {currentStep === 'payment' && (
        <PaymentStep
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          listing={selectedListing}
        />
      )}
      {currentStep === 'review' && (
        <ReviewStep
          formData={formData}
          onBack={handleBack}
          onSubmit={handleSubmit}
          listing={selectedListing}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

export default ApplicationFlow
