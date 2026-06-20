import React, { useState } from 'react'
import {
  Camera,
  Upload,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  Home,
  Plus,
  X,
  Check,
  Scan,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { useListings } from './contexts/ListingsContext'
import { useAuth } from './contexts/AuthContext'
import { uploadService } from './services/uploadService'

const LandlordListingForm = ({ onSubmit, onBack }) => {
  const { createListing } = useListings()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    address: '',
    university: '',
    rent: '',
    deposit: '',
    availableFrom: '',
    availableTo: '',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    utilitiesIncluded: [],
    petPolicy: 'no-pets',
    smokingPolicy: 'no-smoking',
    requirements: {
      guarantorPolicy: 'students-only', // 'always' | 'students-only' | 'never'
      incomeMultiple: 3, // number (e.g. 2.5, 3, 4)
      customIncomeMultiple: '',
      backgroundCheck: true,
      idVerification: true,
    },
  })

  const [propertyPhotos, setPropertyPhotos] = useState([])
  const [utilityBills, setUtilityBills] = useState([])
  const [documents, setDocuments] = useState([])

  const availableAmenities = [
    'WiFi',
    'Laundry',
    'Parking',
    'Furnished',
    'Kitchen',
    'Garden',
    'Pet-friendly',
    'Gym',
    'AC',
    'Dishwasher',
    'Pool',
    'Balcony',
    'In-unit Laundry',
    'Study Space',
    'Security',
    'Storage',
    'Elevator',
  ]

  const universities = [
    'USC',
    'UCLA',
    'NYU',
    'Stanford',
    'Harvard',
    'MIT',
    'UC Berkeley',
    'Columbia',
    'Yale',
    'Princeton',
  ]

  const utilityTypes = [
    { id: 'electricity', name: 'Electricity', color: 'yellow' },
    { id: 'gas', name: 'Gas', color: 'red' },
    { id: 'water', name: 'Water/Sewer', color: 'blue' },
    { id: 'internet', name: 'Internet', color: 'green' },
    { id: 'trash', name: 'Trash/Recycling', color: 'gray' },
  ]

  const handlePhotoUpload = async e => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Upload files to server
      const response = await uploadService.uploadImages(files)

      // Add uploaded images to state with their server URLs
      const newPhotos = response.images.map((img, index) => ({
        id: Date.now() + Math.random() + index,
        file: files[index],
        preview: img.url, // Use server URL
        url: img.url, // Store URL for submission
        filename: img.filename,
        caption: '',
      }))

      setPropertyPhotos(prev => [...prev, ...newPhotos])
    } catch (error) {
      console.error('Photo upload error:', error)
      setUploadError(
        error.message || 'Failed to upload photos. Please try again.'
      )

      // Fallback to local preview if upload fails (for offline dev)
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPropertyPhotos(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              file,
              preview: reader.result,
              url: null, // Mark as not uploaded
              caption: '',
            },
          ])
        }
        reader.readAsDataURL(file)
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUtilityBillUpload = (e, utilityType) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUtilityBills(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            preview: reader.result,
            type: utilityType,
            amount: '',
            month: new Date().toISOString().slice(0, 7), // YYYY-MM
            isProcessed: false,
            redactedInfo: [],
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDocumentUpload = (e, docType) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocuments(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            preview: reader.result,
            type: docType,
            isScanned: false,
            extractedData: null,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeUtilityBill = billId => {
    setUtilityBills(prev => prev.filter(bill => bill.id !== billId))
  }

  const removeDocument = docId => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const simulateDocumentScan = docId => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? {
              ...doc,
              isScanned: true,
              extractedData: {
                propertyAddress:
                  listingData.address || '123 Main St, Los Angeles, CA',
                monthlyRent: listingData.rent || '1200',
                leaseStart: listingData.availableFrom || '2024-01-01',
                leaseEnd: listingData.availableTo || '2024-12-31',
              },
            }
          : doc
      )
    )
  }

  const simulateBillProcessing = billId => {
    setUtilityBills(prev =>
      prev.map(bill =>
        bill.id === billId
          ? {
              ...bill,
              isProcessed: true,
              redactedInfo: ['Account Number: ****1234', 'SSN: ***-**-****'],
              amount: Math.floor(Math.random() * 200 + 50).toString(), // Random bill amount
            }
          : bill
      )
    )
  }

  const toggleAmenity = amenity => {
    setListingData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const removePhoto = async photoId => {
    const photo = propertyPhotos.find(p => p.id === photoId)

    // Try to delete from server if it was uploaded
    if (photo?.filename) {
      try {
        await uploadService.deleteImage(photo.filename)
      } catch (error) {
        console.error('Failed to delete image from server:', error)
        // Continue with local removal anyway
      }
    }

    setPropertyPhotos(prev => prev.filter(photo => photo.id !== photoId))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Map property type to API enum format
      const propertyTypeMap = {
        apartment: 'Apartment',
        house: 'House',
        room: 'SingleRoom',
        studio: 'Studio',
        condo: 'Condo',
      }

      // Prepare listing data for API
      const apiListingData = {
        title: listingData.title,
        description: listingData.description,
        price: parseInt(listingData.rent),
        location: listingData.address,
        university: listingData.university || null,
        moveInDate: listingData.availableFrom || null,
        moveOutDate: listingData.availableTo || null,
        propertyType: propertyTypeMap[listingData.propertyType] || 'Apartment',
        bedrooms: listingData.bedrooms,
        bathrooms: listingData.bathrooms,
        amenities: listingData.amenities,
        images: propertyPhotos
          .filter(photo => photo.url) // Only include uploaded photos
          .map(photo => photo.url),
      }

      // Call API to create listing
      const result = await createListing(apiListingData)

      if (result.success) {
        // Call the onSubmit callback for navigation/UI updates
        onSubmit({
          ...apiListingData,
          id: result.listing?.id,
          owner: {
            name: user?.firstName
              ? `${user.firstName} ${user.lastName}`
              : 'Owner',
            verified: user?.verified || false,
          },
        })
      } else {
        throw new Error(result.error || 'Failed to create listing')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitError(
        error.message || 'Failed to publish listing. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 1: Basic Property Info
  if (currentStep === 1) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">List Your Property</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Property Title
            </label>
            <input
              type="text"
              value={listingData.title}
              onChange={e =>
                setListingData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Cozy 1BR near downtown"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Property Address
            </label>
            <input
              type="text"
              value={listingData.address}
              onChange={e =>
                setListingData(prev => ({ ...prev, address: e.target.value }))
              }
              placeholder="Full address including city and state"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Neighborhood / Area
              </label>
              <input
                type="text"
                value={listingData.university}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    university: e.target.value,
                  }))
                }
                placeholder="e.g. Downtown, Mission Valley"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Property Type
              </label>
              <select
                value={listingData.propertyType}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    propertyType: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Private Room</option>
                <option value="studio">Studio</option>
                <option value="condo">Condo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <select
                value={listingData.bedrooms}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    bedrooms: parseInt(e.target.value),
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>
                    {num} Bedroom{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bathrooms
              </label>
              <select
                value={listingData.bathrooms}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    bathrooms: parseFloat(e.target.value),
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={1}>1 Bathroom</option>
                <option value={1.5}>1.5 Bathrooms</option>
                <option value={2}>2 Bathrooms</option>
                <option value={2.5}>2.5 Bathrooms</option>
                <option value={3}>3+ Bathrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={listingData.description}
              onChange={e =>
                setListingData(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your property, neighborhood, and what makes it special..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            disabled={!listingData.title || !listingData.address}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.title && listingData.address
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Photos & Media
  if (currentStep === 2) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Property Photos</h2>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {uploadError}
          </div>
        )}

        {/* Photo Upload */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {isUploading ? (
              <>
                <Loader2
                  size={48}
                  className="mx-auto text-brand-500 mb-4 animate-spin"
                />
                <p className="text-brand-500 font-medium">Uploading photos...</p>
              </>
            ) : (
              <>
                <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                <label className="cursor-pointer">
                  <span className="text-brand-500 font-medium hover:underline">
                    Upload property photos
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Add multiple photos to showcase your property
                </p>
              </>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {propertyPhotos.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">
              Property Photos ({propertyPhotos.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {propertyPhotos.map((photo, index) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview}
                    alt={`Property ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-brand-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Cover Photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            disabled={propertyPhotos.length === 0}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              propertyPhotos.length > 0
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Pricing & Availability
  if (currentStep === 3) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Pricing & Availability</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Rent ($)
              </label>
              <input
                type="number"
                value={listingData.rent}
                onChange={e =>
                  setListingData(prev => ({ ...prev, rent: e.target.value }))
                }
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Security Deposit ($)
              </label>
              <input
                type="number"
                value={listingData.deposit}
                onChange={e =>
                  setListingData(prev => ({ ...prev, deposit: e.target.value }))
                }
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Available From
              </label>
              <input
                type="date"
                value={listingData.availableFrom}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    availableFrom: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Available Until
              </label>
              <input
                type="date"
                value={listingData.availableTo}
                onChange={e =>
                  setListingData(prev => ({
                    ...prev,
                    availableTo: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Policies */}
          <div>
            <label className="block text-sm font-medium mb-2">Pet Policy</label>
            <select
              value={listingData.petPolicy}
              onChange={e =>
                setListingData(prev => ({ ...prev, petPolicy: e.target.value }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="no-pets">No Pets</option>
              <option value="cats-only">Cats Only</option>
              <option value="dogs-only">Dogs Only</option>
              <option value="pets-welcome">All Pets Welcome</option>
              <option value="case-by-case">Case by Case</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Smoking Policy
            </label>
            <select
              value={listingData.smokingPolicy}
              onChange={e =>
                setListingData(prev => ({
                  ...prev,
                  smokingPolicy: e.target.value,
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="no-smoking">No Smoking</option>
              <option value="outdoor-only">Outdoor Only</option>
              <option value="designated-areas">Designated Areas</option>
              <option value="smoking-allowed">Smoking Allowed</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            disabled={!listingData.rent || !listingData.deposit}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.rent && listingData.deposit
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Amenities
  if (currentStep === 4) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Amenities & Features</h2>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            Select all amenities that apply:
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {availableAmenities.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  listingData.amenities.includes(amenity)
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-300 text-gray-700 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{amenity}</span>
                  {listingData.amenities.includes(amenity) && (
                    <Check size={16} className="text-brand-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(5)}
            className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 5: Tenant Requirements
  if (currentStep === 5) {
    const req = listingData.requirements
    const setReq = patch =>
      setListingData(prev => ({
        ...prev,
        requirements: { ...prev.requirements, ...patch },
      }))

    const incomeOptions = [
      { value: 2.5, label: '2.5× rent' },
      { value: 3, label: '3× rent (common)' },
      { value: 4, label: '4× rent (strict)' },
      { value: 'custom', label: 'Custom…' },
    ]

    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-2">Tenant Requirements</h2>
        <p className="text-sm text-gray-500 mb-6">
          These criteria are shown to applicants before they apply and are used
          to auto-qualify group income during review.
        </p>

        <div className="space-y-6">
          {/* Guarantor policy */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Guarantor / Co-signer Policy
            </label>
            <div className="space-y-2">
              {[
                {
                  value: 'always',
                  label: 'Always required',
                  sub: 'Every applicant must provide a guarantor',
                },
                {
                  value: 'students-only',
                  label: 'Students only',
                  sub: 'Required only if income < threshold',
                },
                {
                  value: 'never',
                  label: 'Never required',
                  sub: 'Income verification is sufficient',
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReq({ guarantorPolicy: opt.value })}
                  className={`w-full flex items-start p-3 border-2 rounded-lg text-left transition-colors ${
                    req.guarantorPolicy === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mt-0.5 mr-3 flex-shrink-0 ${
                      req.guarantorPolicy === opt.value
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Income multiple */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Minimum Income Requirement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {incomeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReq({ incomeMultiple: opt.value })}
                  className={`p-3 border-2 rounded-lg text-sm text-left transition-colors ${
                    req.incomeMultiple === opt.value
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {req.incomeMultiple === 'custom' && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Custom multiplier (e.g. 3.5)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={req.customIncomeMultiple}
                  onChange={e =>
                    setReq({ customIncomeMultiple: e.target.value })
                  }
                  placeholder="3.5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
            {req.incomeMultiple !== 'custom' && listingData.rent && (
              <p className="mt-2 text-xs text-gray-500">
                Minimum income:{' '}
                <span className="font-semibold text-gray-700">
                  $
                  {(
                    Number(listingData.rent) * Number(req.incomeMultiple)
                  ).toLocaleString()}
                  /mo
                </span>{' '}
                (individually or combined for groups)
              </p>
            )}
          </div>

          {/* Checks */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              Required Verifications
            </label>
            <div className="space-y-3">
              {[
                {
                  key: 'backgroundCheck',
                  label: 'Background Check',
                  sub: 'Criminal and eviction history screening',
                },
                {
                  key: 'idVerification',
                  label: 'Government ID Verification',
                  sub: 'Plaid IDV or equivalent',
                },
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => setReq({ [item.key]: !req[item.key] })}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    req[item.key]
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 mt-0.5 mr-3 flex-shrink-0 flex items-center justify-center ${
                      req[item.key]
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {req[item.key] && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(4)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(6)}
            className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step 6: Utility Bills & Documents
  if (currentStep === 6) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Utility Bills & Documents</h2>

        {/* Utility Bills Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Upload Recent Utility Bills</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload your recent utility bills to help renters understand average
            costs. We'll automatically redact sensitive information.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {utilityTypes.map(utility => (
              <div
                key={utility.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium mb-2">{utility.name}</h4>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-brand-300">
                    <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                    <span className="text-xs text-gray-600">Upload Bill</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => handleUtilityBillUpload(e, utility.id)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Uploaded Bills */}
          {utilityBills.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Uploaded Bills</h4>
              {utilityBills.map(bill => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 bg-${utilityTypes.find(t => t.id === bill.type)?.color || 'gray'}-400`}
                    ></div>
                    <div>
                      <p className="font-medium">
                        {utilityTypes.find(t => t.id === bill.type)?.name} Bill
                      </p>
                      <p className="text-xs text-gray-500">{bill.month}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {bill.isProcessed ? (
                      <div className="flex items-center text-green-600">
                        <Check size={16} className="mr-1" />
                        <span className="text-sm">Processed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateBillProcessing(bill.id)}
                        className="text-brand-500 text-sm hover:underline flex items-center"
                      >
                        <Scan size={16} className="mr-1" />
                        Process
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        removeUtilityBill(bill.id)
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Legal Documents (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload lease templates or other documents. Our AI will scan and
            extract key information.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-300">
                  <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Lease Agreement</span>
                  <p className="text-xs text-gray-500">PDF, DOC, or Image</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={e => handleDocumentUpload(e, 'lease')}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-300">
                  <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                  <span className="text-sm font-medium">
                    Rental Application
                  </span>
                  <p className="text-xs text-gray-500">PDF, DOC, or Image</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={e => handleDocumentUpload(e, 'application')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Documents */}
          {documents.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium">Uploaded Documents</h4>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {doc.type} Document
                      </p>
                      <p className="text-xs text-gray-500">{doc.file.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.isScanned ? (
                        <div className="flex items-center text-green-600">
                          <Check size={16} className="mr-1" />
                          <span className="text-sm">Scanned</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => simulateDocumentScan(doc.id)}
                          className="text-brand-500 text-sm hover:underline flex items-center"
                        >
                          <Scan size={16} className="mr-1" />
                          Scan
                        </button>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          removeDocument(doc.id)
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {doc.extractedData && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <p className="text-green-800 font-medium">
                        Extracted Information:
                      </p>
                      <p>• Rent: ${doc.extractedData.monthlyRent}/month</p>
                      <p>
                        • Lease Term: {doc.extractedData.leaseStart} to{' '}
                        {doc.extractedData.leaseEnd}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(5)}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              'Publish Listing'
            )}
          </button>
        </div>
      </div>
    )
  }
}

export default LandlordListingForm
