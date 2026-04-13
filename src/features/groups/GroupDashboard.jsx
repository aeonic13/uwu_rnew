import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, MessageSquare, Home, Crown, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGroups } from '../../contexts/GroupsContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function GroupDashboard() {
  const { user } = useAuth()
  const { userGroups, groupInvitations, fetchUserGroups, isLoading } = useGroups()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchUserGroups(user.id)
    }
  }, [user, fetchUserGroups])

  const handleCreateGroup = () => {
    navigate('/groups/create')
  }

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`)
  }

  const handleInvitationClick = (invitationId) => {
    navigate(`/groups/invitations/${invitationId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const pendingInvitations = groupInvitations.filter((inv) => inv.status === 'pending')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-600 mt-1">
            Team up with friends to find housing together
          </p>
        </div>
        <button
          onClick={handleCreateGroup}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
        >
          <Plus size={20} />
          Create Group
        </button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                onClick={() => handleInvitationClick(invitation.id)}
                className="bg-brand-50 border-2 border-brand-200 rounded-lg p-4 cursor-pointer hover:bg-brand-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className="text-brand-500" />
                  <span className="font-semibold text-blue-900">
                    Group Invitation
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  You've been invited to join a group
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User's Groups */}
      {userGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a group to search for housing with friends and coordinate your rental journey together
          </p>
          <button
            onClick={handleCreateGroup}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
          >
            <Plus size={20} />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group) => {
            const isAdmin = group.members?.some(
              (m) => m.userId === user.id && m.role === 'admin'
            )

            return (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Group Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                      <Users size={24} className="text-brand-500" />
                    </div>
                    {isAdmin && (
                      <Crown size={16} className="text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Group Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                  {group.name}
                </h3>

                {/* Description */}
                {group.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>
                      {group.members?.length || 0}/{group.maxMembers}
                    </span>
                  </div>
                  {group.interestedListings?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Home size={16} />
                      <span>{group.interestedListings.length} saved</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/groups/${group.id}/chat`)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-50 text-brand-500 rounded-lg hover:bg-brand-100 transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span className="text-sm font-medium">Chat</span>
                  </button>
                </div>

                {/* Created date */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-4">
                  <Calendar size={12} />
                  <span>
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
