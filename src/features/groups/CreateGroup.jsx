import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGroups } from '../../contexts/GroupsContext'

export default function CreateGroup() {
  const { user } = useAuth()
  const { createGroup } = useGroups()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 4,
  })

  const [inviteEmails, setInviteEmails] = useState([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleAddEmailField = () => {
    setInviteEmails([...inviteEmails, ''])
  }

  const handleRemoveEmailField = (index) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index))
  }

  const handleEmailChange = (index, value) => {
    const newEmails = [...inviteEmails]
    newEmails[index] = value
    setInviteEmails(newEmails)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Create the group
      const result = await createGroup({
        ...formData,
        creatorId: user.id,
      })

      if (result.success) {
        // Send invitations to emails
        const validEmails = inviteEmails.filter((email) => email.trim())
        // TODO: Send invitations via API

        // Navigate to group page
        navigate(`/groups/${result.group.id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create a Group</h1>
            <p className="text-sm text-gray-600">
              Team up with friends to find the perfect place
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., USC Fall 2024 Roommates"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell potential members about your group..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Members *
            </label>
            <select
              value={formData.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} people
                </option>
              ))}
            </select>
          </div>

          {/* Invite Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Members (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Invite friends via email. They'll get an invitation to join your group.
            </p>

            <div className="space-y-2">
              {inviteEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="friend@university.edu"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {inviteEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmailField(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove email"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddEmailField}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <UserPlus size={16} />
                Add another email
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
