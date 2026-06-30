import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { X, Sliders } from 'lucide-react'

const PROPERTY_TYPES = ['Apartment', 'House', 'Studio', 'SingleRoom', 'Condo']
const AMENITIES = [
  'WiFi',
  'Laundry',
  'Parking',
  'Furnished',
  'Kitchen',
  'AC',
  'Heating',
  'Gym',
  'Pool',
  'Doorman',
  'Garden',
  'Pet-friendly',
  'Dishwasher',
  'Elevator',
  'Balcony',
]

export default function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onClearFilters,
}) {
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    if (isOpen) {
      // Re-seed the editable local copy from props each time the modal opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalFilters(filters)
    }
  }, [isOpen, filters])

  const handlePriceChange = (field, value) => {
    const numValue = value === '' ? null : parseInt(value)
    setLocalFilters({ ...localFilters, [field]: numValue })
  }

  const handlePropertyTypeChange = type => {
    setLocalFilters({
      ...localFilters,
      propertyType: localFilters.propertyType === type ? null : type,
    })
  }

  const handleBedroomsChange = count => {
    setLocalFilters({
      ...localFilters,
      bedrooms: localFilters.bedrooms === count ? null : count,
    })
  }

  const handleBathroomsChange = count => {
    setLocalFilters({
      ...localFilters,
      bathrooms: localFilters.bathrooms === count ? null : count,
    })
  }

  const handleAmenityToggle = amenity => {
    const currentAmenities = localFilters.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity]
    setLocalFilters({ ...localFilters, amenities: newAmenities })
  }

  const handleMoveInDateChange = date => {
    setLocalFilters({ ...localFilters, moveInDate: date || null })
  }

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  const handleClear = () => {
    onClearFilters()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sliders size={24} className="text-brand-500" />
            <h2 className="text-2xl font-bold">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Price Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="$0"
                  value={localFilters.minRent || ''}
                  onChange={e => handlePriceChange('minRent', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="$5000"
                  value={localFilters.maxRent || ''}
                  onChange={e => handlePriceChange('maxRent', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Property Type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handlePropertyTypeChange(type)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    localFilters.propertyType === type
                      ? 'border-brand-500 bg-brand-50 text-brand-500 font-medium'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Bedrooms</h3>
            <div className="flex gap-3">
              {[0, 1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  onClick={() => handleBedroomsChange(count)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    localFilters.bedrooms === count
                      ? 'border-brand-500 bg-brand-50 text-brand-500 font-medium'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {count === 0 ? 'Studio' : count === 4 ? '4+' : count}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Bathrooms</h3>
            <div className="flex gap-3">
              {[1, 1.5, 2, 2.5, 3].map(count => (
                <button
                  key={count}
                  onClick={() => handleBathroomsChange(count)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    localFilters.bathrooms === count
                      ? 'border-brand-500 bg-brand-50 text-brand-500 font-medium'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {count}+
                </button>
              ))}
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Move-in Date</h3>
            <input
              type="date"
              value={localFilters.moveInDate || ''}
              onChange={e => handleMoveInDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll show listings within 2 weeks of this date
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    (localFilters.amenities || []).includes(amenity)
                      ? 'border-brand-500 bg-brand-50 text-brand-500 font-medium'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClear}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

AdvancedFiltersModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
}
