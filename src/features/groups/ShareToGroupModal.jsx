import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Users, X, Check, MessageSquare } from 'lucide-react'
import { groupsService } from '../../services/groupsService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

/**
 * Share a listing into one of the user's rental-group chats. The message
 * lands as a listing card (type 'listing') that members can tap to open.
 */
export default function ShareToGroupModal({ listing, onClose }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendingId, setSendingId] = useState(null)
  const [sentGroup, setSentGroup] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    groupsService
      .listMy()
      .then(list => active && setGroups(list))
      .catch(() => active && setError('Could not load your groups'))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleShare = async group => {
    setSendingId(group.id)
    setError(null)
    try {
      await groupsService.sendMessage(
        group.id,
        `Check out this place: ${listing.title}`,
        {
          type: 'listing',
          metadata: {
            listingData: {
              id: listing.id,
              title: listing.title,
              location: listing.location,
              price: listing.price,
              image: Array.isArray(listing.images) ? listing.images[0] : null,
            },
          },
        }
      )
      setSentGroup(group)
    } catch (err) {
      setError(err.message || 'Could not share the listing')
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Share to a group</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : sentGroup ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">
              Shared to {sentGroup.name}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Your group can open the listing right from the chat.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => navigate(`/groups/${sentGroup.id}/chat`)}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                Open chat
              </button>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-4">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700 mb-1">No groups yet</p>
            <p className="text-sm text-gray-500 mb-5">
              Create a rental group with friends to share listings and apply
              together.
            </p>
            <button
              onClick={() => navigate('/groups/create')}
              className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors"
            >
              Create a group
            </button>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleShare(group)}
                  disabled={sendingId !== null}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {group.members?.length || 0} members
                    </p>
                  </div>
                  {sendingId === group.id && <LoadingSpinner size="sm" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

ShareToGroupModal.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    location: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    images: PropTypes.array,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
}
