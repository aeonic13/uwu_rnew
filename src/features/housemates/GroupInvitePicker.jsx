import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Users, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { groupsService } from '../../services/groupsService'
import { useAuth } from '../../contexts/AuthContext'

/**
 * "Invite to a group" flow from a housemate profile. Lists the groups the
 * viewer admins, or creates a new one, then invites the candidate by user
 * id so their email is never exposed. The outcome is a roommate group that
 * can apply for a place together, which is the point of finding a match.
 */
export default function GroupInvitePicker({ candidate, onClose }) {
  const { user } = useAuth()
  const [groups, setGroups] = useState(null)
  const [selected, setSelected] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState(null)
  const [invitedGroup, setInvitedGroup] = useState(null)

  useEffect(() => {
    let active = true
    groupsService
      .listMy()
      .then(list => {
        if (!active) return
        const mine = list.filter(g =>
          g.members?.some(m => m.userId === user?.id && m.role === 'admin')
        )
        setGroups(mine)
        setCreating(mine.length === 0)
        if (mine.length > 0) setSelected(mine[0].id)
      })
      .catch(() => {
        if (!active) return
        setGroups([])
        setCreating(true)
      })
    return () => {
      active = false
    }
  }, [user?.id])

  const firstName = candidate.user?.firstName || 'them'

  const handleInvite = async () => {
    setInviting(true)
    setError(null)
    try {
      let group = groups?.find(g => g.id === selected) || null
      if (creating) {
        const name =
          newName.trim() || `${user?.firstName || 'My'} & ${firstName}`
        group = await groupsService.create({ name, maxMembers: 4 })
      }
      if (!group) throw new Error('Pick a group first')
      await groupsService.inviteUser(group.id, candidate.user.id)
      setInvitedGroup(group)
    } catch (err) {
      setError(err.message || 'Could not send the invitation')
    } finally {
      setInviting(false)
    }
  }

  if (invitedGroup) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-left">
        <p className="flex items-center font-medium text-green-900">
          <CheckCircle2 size={18} className="mr-2 shrink-0" />
          Invited {firstName} to {invitedGroup.name}
        </p>
        <p className="text-sm text-green-800 mt-1">
          They will see the invitation under Groups. Once they accept, you can
          share listings and apply together from the group.
        </p>
        <div className="mt-3 flex gap-3 text-sm">
          <Link
            to={`/groups/${invitedGroup.id}`}
            className="font-medium text-green-800 underline underline-offset-2"
          >
            Open the group
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-green-800/80 hover:text-green-900"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left space-y-3">
      <p className="flex items-center font-medium text-gray-900">
        <Users size={18} className="mr-2 shrink-0 text-blue-600" />
        Invite {firstName} to a group
      </p>

      {groups === null ? (
        <div className="flex items-center text-sm text-gray-500">
          <Loader2 size={14} className="mr-2 animate-spin" />
          Loading your groups…
        </div>
      ) : (
        <>
          {groups.length > 0 && !creating && (
            <div className="space-y-1.5">
              {groups.map(g => (
                <label
                  key={g.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="invite-group"
                    value={g.id}
                    checked={selected === g.id}
                    onChange={() => setSelected(g.id)}
                  />
                  <span className="font-medium">{g.name}</span>
                  <span className="text-gray-500">
                    {g.members?.length || 0}/{g.maxMembers}
                  </span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                <Plus size={14} className="mr-1" />
                New group instead
              </button>
            </div>
          )}

          {creating && (
            <div>
              <label
                htmlFor="new-group-name"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                New group name
              </label>
              <input
                id="new-group-name"
                type="text"
                value={newName}
                maxLength={60}
                placeholder={`${user?.firstName || 'My'} & ${firstName}`}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  Use an existing group instead
                </button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
            >
              {inviting ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : null}
              {creating ? 'Create group & invite' : 'Send invitation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

GroupInvitePicker.propTypes = {
  candidate: PropTypes.shape({
    user: PropTypes.shape({
      id: PropTypes.string,
      firstName: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
}
