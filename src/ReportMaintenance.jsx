import React, { useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Wrench,
  Droplets,
  Zap,
  Flame,
  AlertTriangle,
  Camera,
  Upload,
} from 'lucide-react'

const ReportMaintenanceView = ({ user, onBack }) => {
  const [maintenanceType, setMaintenanceType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('')
  const [location, setLocation] = useState('')
  const [photos, setPhotos] = useState([])

  const maintenanceTypes = [
    {
      value: 'plumbing',
      label: 'Plumbing',
      icon: Droplets,
      color: 'text-brand-500',
    },
    {
      value: 'electrical',
      label: 'Electrical',
      icon: Zap,
      color: 'text-yellow-600',
    },
    {
      value: 'hvac',
      label: 'Heating/Cooling',
      icon: Flame,
      color: 'text-red-600',
    },
    {
      value: 'appliances',
      label: 'Appliances',
      icon: Building2,
      color: 'text-gray-600',
    },
    {
      value: 'structural',
      label: 'Structural/Walls',
      icon: Building2,
      color: 'text-gray-800',
    },
    {
      value: 'pest',
      label: 'Pest Control',
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      value: 'general',
      label: 'General Repair',
      icon: Wrench,
      color: 'text-green-600',
    },
    { value: 'other', label: 'Other', icon: Wrench, color: 'text-purple-600' },
  ]

  const priorities = [
    {
      value: 'low',
      label: 'Low - Routine maintenance',
      color: 'text-green-600',
    },
    {
      value: 'medium',
      label: 'Medium - Needs attention soon',
      color: 'text-yellow-600',
    },
    {
      value: 'high',
      label: 'High - Important but not urgent',
      color: 'text-orange-600',
    },
    {
      value: 'emergency',
      label: 'Emergency - Immediate attention required',
      color: 'text-red-600',
    },
  ]

  const handleSubmit = () => {
    console.log('Maintenance request:', {
      user: user.email,
      maintenanceType,
      description,
      priority,
      location,
      photos,
    })

    alert(
      'Maintenance request submitted successfully! Your landlord will be notified and will respond within 24-48 hours.'
    )
    onBack()
  }

  const handlePhotoUpload = event => {
    const files = Array.from(event.target.files)
    setPhotos(prev => [...prev, ...files.slice(0, 5 - prev.length)]) // Max 5 photos
  }

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const getPriorityColor = priorityValue => {
    const priority = priorities.find(p => p.value === priorityValue)
    return priority ? priority.color : 'text-gray-600'
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Report Maintenance</h2>
      </div>

      <div className="space-y-6">
        {/* Maintenance Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            What type of maintenance is needed?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {maintenanceTypes.map(type => {
              const IconComponent = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setMaintenanceType(type.value)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    maintenanceType === type.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <IconComponent size={20} className={`${type.color} mr-2`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Location in property
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g., Kitchen sink, Master bedroom, Living room"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Priority Level */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Priority Level
          </label>
          <div className="space-y-2">
            {priorities.map(priorityOption => (
              <label key={priorityOption.value} className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value={priorityOption.value}
                  checked={priority === priorityOption.value}
                  onChange={e => setPriority(e.target.value)}
                  className="mr-3 h-4 w-4 text-brand-500 focus:ring-brand-500"
                />
                <span className={`text-sm ${priorityOption.color} font-medium`}>
                  {priorityOption.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Please describe the maintenance issue in detail. Include what's not working, when it started, and any other relevant information..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Photos (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload photos to help your landlord understand the issue better. Max
            5 photos.
          </p>

          {photos.length < 5 && (
            <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
              <div className="text-center">
                <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </label>
          )}

          {/* Photo Preview */}
          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Notice */}
        {priority === 'emergency' && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <AlertTriangle size={20} className="text-red-600 mr-2" />
              <h4 className="font-semibold text-red-800">
                Emergency Maintenance
              </h4>
            </div>
            <p className="text-sm text-red-700">
              For true emergencies that pose immediate danger (gas leaks,
              electrical hazards, flooding), contact emergency services (911)
              first, then your landlord directly by phone.
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            What happens next?
          </h4>
          <div className="text-sm text-brand-600 space-y-1">
            <p>• Your landlord will receive immediate notification</p>
            <p>• You'll get a response within 24-48 hours</p>
            <p>• Updates will be sent via email and app notifications</p>
            <p>• Emergency requests are prioritized for same-day response</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!maintenanceType || !description || !priority}
          className={`w-full py-3 rounded-lg font-semibold ${
            maintenanceType && description && priority
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit Maintenance Request
        </button>
      </div>
    </div>
  )
}

export default ReportMaintenanceView
