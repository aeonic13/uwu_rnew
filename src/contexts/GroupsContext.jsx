import { createContext, useContext, useReducer, useCallback } from 'react'
import PropTypes from 'prop-types'
import { groupsService } from '../services/groupsService'

// Initial state
const initialState = {
  groups: [],
  userGroups: [],
  selectedGroup: null,
  groupInvitations: [],
  isLoading: false,
  error: null,
}

// Action types
const GROUPS_ACTIONS = {
  SET_GROUPS: 'SET_GROUPS',
  SET_USER_GROUPS: 'SET_USER_GROUPS',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP',
  ADD_GROUP: 'ADD_GROUP',
  UPDATE_GROUP: 'UPDATE_GROUP',
  REMOVE_GROUP: 'REMOVE_GROUP',
  ADD_MEMBER: 'ADD_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  UPDATE_MEMBER_ROLE: 'UPDATE_MEMBER_ROLE',
  SET_INVITATIONS: 'SET_INVITATIONS',
  ADD_INVITATION: 'ADD_INVITATION',
  UPDATE_INVITATION: 'UPDATE_INVITATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
}

// Reducer
function groupsReducer(state, action) {
  switch (action.type) {
    case GROUPS_ACTIONS.SET_GROUPS:
      return { ...state, groups: action.payload, isLoading: false }

    case GROUPS_ACTIONS.SET_USER_GROUPS:
      return { ...state, userGroups: action.payload, isLoading: false }

    case GROUPS_ACTIONS.SET_SELECTED_GROUP:
      return { ...state, selectedGroup: action.payload }

    case GROUPS_ACTIONS.ADD_GROUP:
      return {
        ...state,
        groups: [action.payload, ...state.groups],
        userGroups: [action.payload, ...state.userGroups],
      }

    case GROUPS_ACTIONS.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
        userGroups: state.userGroups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
      }

    case GROUPS_ACTIONS.REMOVE_GROUP:
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload),
        userGroups: state.userGroups.filter(
          group => group.id !== action.payload
        ),
      }

    case GROUPS_ACTIONS.ADD_MEMBER:
      return {
        ...state,
        selectedGroup: state.selectedGroup
          ? {
              ...state.selectedGroup,
              members: [...state.selectedGroup.members, action.payload],
            }
          : null,
      }

    case GROUPS_ACTIONS.REMOVE_MEMBER:
      return {
        ...state,
        selectedGroup: state.selectedGroup
          ? {
              ...state.selectedGroup,
              members: state.selectedGroup.members.filter(
                m => m.userId !== action.payload
              ),
            }
          : null,
      }

    case GROUPS_ACTIONS.UPDATE_MEMBER_ROLE:
      return {
        ...state,
        selectedGroup: state.selectedGroup
          ? {
              ...state.selectedGroup,
              members: state.selectedGroup.members.map(m =>
                m.userId === action.payload.userId
                  ? { ...m, role: action.payload.role }
                  : m
              ),
            }
          : null,
      }

    case GROUPS_ACTIONS.SET_INVITATIONS:
      return { ...state, groupInvitations: action.payload }

    case GROUPS_ACTIONS.ADD_INVITATION:
      return {
        ...state,
        groupInvitations: [action.payload, ...state.groupInvitations],
      }

    case GROUPS_ACTIONS.UPDATE_INVITATION:
      return {
        ...state,
        groupInvitations: state.groupInvitations.map(inv =>
          inv.id === action.payload.id ? action.payload : inv
        ),
      }

    case GROUPS_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case GROUPS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    default:
      return state
  }
}

// Create context
const GroupsContext = createContext(null)

// Provider component
export function GroupsProvider({ children }) {
  const [state, dispatch] = useReducer(groupsReducer, initialState)

  // Create a new group
  const createGroup = useCallback(async groupData => {
    dispatch({ type: GROUPS_ACTIONS.SET_LOADING, payload: true })

    try {
      const group = await groupsService.create(groupData)
      dispatch({ type: GROUPS_ACTIONS.ADD_GROUP, payload: group })
      dispatch({ type: GROUPS_ACTIONS.SET_LOADING, payload: false })
      return { success: true, group }
    } catch (error) {
      dispatch({ type: GROUPS_ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }, [])

  // Fetch user's groups and pending invitations
  const fetchUserGroups = useCallback(async () => {
    dispatch({ type: GROUPS_ACTIONS.SET_LOADING, payload: true })

    try {
      const [groups, invitations] = await Promise.all([
        groupsService.listMy(),
        groupsService.listInvitations().catch(() => []),
      ])
      dispatch({ type: GROUPS_ACTIONS.SET_USER_GROUPS, payload: groups })
      dispatch({ type: GROUPS_ACTIONS.SET_INVITATIONS, payload: invitations })
    } catch (error) {
      dispatch({ type: GROUPS_ACTIONS.SET_ERROR, payload: error.message })
    }
  }, [])

  // Get group by ID
  const getGroupById = useCallback(async groupId => {
    try {
      const group = await groupsService.getById(groupId)
      dispatch({ type: GROUPS_ACTIONS.SET_SELECTED_GROUP, payload: group })
      return group
    } catch (error) {
      dispatch({ type: GROUPS_ACTIONS.SET_ERROR, payload: error.message })
      return null
    }
  }, [])

  // Invite member to group
  const inviteMember = useCallback(async (groupId, email) => {
    try {
      const member = await groupsService.invite(groupId, email)
      const invitation = {
        id: member?.id,
        groupId,
        email,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      }
      dispatch({ type: GROUPS_ACTIONS.ADD_INVITATION, payload: invitation })
      return { success: true, invitation }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  // Accept a group invitation (the invitation object from listInvitations)
  const acceptInvitation = useCallback(async invitation => {
    try {
      const group = await groupsService.join(invitation.groupId)
      dispatch({ type: GROUPS_ACTIONS.ADD_GROUP, payload: group })
      dispatch({
        type: GROUPS_ACTIONS.UPDATE_INVITATION,
        payload: { ...invitation, status: 'accepted' },
      })
      return { success: true, group }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  // Decline a group invitation
  const declineInvitation = useCallback(async invitation => {
    try {
      await groupsService.decline(invitation.groupId)
      dispatch({
        type: GROUPS_ACTIONS.UPDATE_INVITATION,
        payload: { ...invitation, status: 'declined' },
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  // Resolve a user's member-row id within the currently selected group.
  const findMemberId = useCallback(
    userId =>
      state.selectedGroup?.members?.find(m => m.userId === userId)?.id || null,
    [state.selectedGroup]
  )

  // Remove member from group (admin) — identified by userId in the UI
  const removeMember = useCallback(
    async (groupId, userId) => {
      try {
        const memberId = findMemberId(userId)
        if (!memberId) {
          return { success: false, error: 'Member not found' }
        }
        await groupsService.removeMember(groupId, memberId)
        dispatch({ type: GROUPS_ACTIONS.REMOVE_MEMBER, payload: userId })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    [findMemberId]
  )

  // Leave group (removes own member row and drops the group locally)
  const leaveGroup = useCallback(
    async (groupId, userId) => {
      try {
        const memberId = findMemberId(userId)
        if (!memberId) {
          return { success: false, error: 'Member not found' }
        }
        await groupsService.removeMember(groupId, memberId)
        dispatch({ type: GROUPS_ACTIONS.REMOVE_GROUP, payload: groupId })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    [findMemberId]
  )

  // Delete group (creator only)
  const deleteGroup = useCallback(async groupId => {
    try {
      await groupsService.deleteGroup(groupId)
      dispatch({ type: GROUPS_ACTIONS.REMOVE_GROUP, payload: groupId })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const value = {
    ...state,
    createGroup,
    fetchUserGroups,
    getGroupById,
    inviteMember,
    acceptInvitation,
    declineInvitation,
    removeMember,
    leaveGroup,
    deleteGroup,
  }

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  )
}

GroupsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook
export function useGroups() {
  const context = useContext(GroupsContext)
  if (!context) {
    throw new Error('useGroups must be used within a GroupsProvider')
  }
  return context
}

export default GroupsContext
