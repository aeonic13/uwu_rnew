import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  FileText,
  Save,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadService } from '../../services/uploadService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Form input component
 */
function FormInput({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  error,
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

/**
 * Form textarea component
 */
function FormTextarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />
    </div>
  )
}

/**
 * Edit Profile View
 */
function EditProfile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    instagramUrl: user?.instagramUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = field => e => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleAvatarChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }))
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Upload the new avatar first so the profile update below returns
      // the fresh avatarUrl into auth state.
      if (avatarFile) {
        await uploadService.uploadAvatar(avatarFile)
      }

      const result = await updateUser(formData)

      if (result.success) {
        navigate('/profile')
      } else {
        setErrors({ submit: result.error || 'Failed to update profile' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="p-2 text-brand-500 hover:bg-brand-50 rounded-full transition-colors disabled:opacity-50"
            aria-label="Save changes"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Save size={24} />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={avatarPreview || 'https://via.placeholder.com/100'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <label className="absolute bottom-0 right-0 bg-brand-500 text-white p-2 rounded-full cursor-pointer hover:bg-brand-600 transition-colors">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          {errors.avatar && (
            <p className="text-red-500 text-sm mt-2">{errors.avatar}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Tap to change profile photo
          </p>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Personal Information
          </h2>

          <FormInput
            label="First Name"
            icon={User}
            value={formData.firstName}
            onChange={handleInputChange('firstName')}
            placeholder="Enter your first name"
            error={errors.firstName}
          />

          <FormInput
            label="Last Name"
            icon={User}
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
            placeholder="Enter your last name"
            error={errors.lastName}
          />

          <FormInput
            label="Email"
            icon={Mail}
            type="email"
            value={formData.email}
            disabled
            placeholder="Your email address"
          />

          <FormInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="Enter your phone number"
            error={errors.phone}
          />
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            About You
          </h2>

          <FormTextarea
            label="Bio"
            value={formData.bio}
            onChange={handleInputChange('bio')}
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        {/* Social Profiles Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Social Profiles
          </h2>

          <FormInput
            label="Instagram"
            icon={Instagram}
            value={formData.instagramUrl}
            onChange={handleInputChange('instagramUrl')}
            placeholder="https://instagram.com/yourusername"
          />

          <FormInput
            label="LinkedIn"
            icon={Linkedin}
            value={formData.linkedinUrl}
            onChange={handleInputChange('linkedinUrl')}
            placeholder="https://linkedin.com/in/yourprofile"
          />

          <p className="text-xs text-gray-500 mt-2">
            💡 Adding your social profiles helps verify your identity and build
            trust
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export default EditProfile
