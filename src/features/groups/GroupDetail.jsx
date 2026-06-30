import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  Crown,
  UserPlus,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  Trash2,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGroups } from '../../contexts/GroupsContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const {
    selectedGroup,
    getGroupById,
    inviteMember,
    removeMember,
    leaveGroup,
    deleteGroup,
  } = useGroups()
  const navigate = useNavigate()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGroup = async () => {
      if (id) {
        await getGroupById(id)
        setIsLoading(false)
      }
    }
    loadGroup()
  }, [id, getGroupById])

  const isAdmin = selectedGroup?.members?.some(
    m => m.userId === user.id && m.role === 'admin'
  )

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    const result = await inviteMember(id, inviteEmail)
    if (result.success) {
      setInviteEmail('')
      setShowInviteModal(false)
    }
  }

  const handleRemoveMember = async userId => {
    if (confirm('Remove this member from the group?')) {
      await removeMember(id, userId)
    }
  }

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      const result = await leaveGroup(id, user.id)
      if (result.success) {
        navigate('/groups')
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (
      confirm(
        'Are you sure you want to delete this group? This cannot be undone.'
      )
    ) {
      const result = await deleteGroup(id)
      if (result.success) {
        navigate('/groups')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!selectedGroup) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-600 mb-4">
          Group not found
        </h2>
        <button
          onClick={() => navigate('/groups')}
          className="text-brand-500 hover:underline"
        >
          Back to groups
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <Users size={32} className="text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedGroup.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedGroup.members?.length || 0} /{' '}
                {selectedGroup.maxMembers} members
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => navigate(`/groups/${id}/settings`)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Group settings"
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        {selectedGroup.description && (
          <p className="text-gray-700 mb-6">{selectedGroup.description}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/groups/${id}/chat`)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            <MessageSquare size={18} />
            Group Chat
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <UserPlus size={18} />
              Invite Members
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>

        <div className="space-y-3">
          {selectedGroup.members?.map(member => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar || 'https://via.placeholder.com/40'}
                  alt={member.name || 'Member'}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.name || 'Unknown'}
                    </span>
                    {member.role === 'admin' && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                    {member.verified && (
                      <Shield size={14} className="text-brand-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {isAdmin && member.userId !== user.id && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove member"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Group Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Group Actions</h2>

        <div className="space-y-3">
          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={18} />
              Leave Group
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <Trash2 size={18} />
              Delete Group
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Invite Member</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="friend@university.edu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 transition-colors"
              >
                <Mail size={18} />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
