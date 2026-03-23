import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { messagingService } from '../services/messagingService'
import { useAuth } from './AuthContext'

// Initial state
const initialState = {
  conversations: [],
  messages: {},
  selectedConversation: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
}

// Action types
const MESSAGING_ACTIONS = {
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_SELECTED_CONVERSATION: 'SET_SELECTED_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  MARK_AS_READ: 'MARK_AS_READ',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
}

// Reducer
function messagingReducer(state, action) {
  switch (action.type) {
    case MESSAGING_ACTIONS.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload, isLoading: false }

    case MESSAGING_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      }

    case MESSAGING_ACTIONS.ADD_MESSAGE:
      const conversationId = action.payload.conversationId
      const currentMessages = state.messages[conversationId] || []
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...currentMessages, action.payload.message],
        },
      }

    case MESSAGING_ACTIONS.SET_SELECTED_CONVERSATION:
      return { ...state, selectedConversation: action.payload }

    case MESSAGING_ACTIONS.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      }

    case MESSAGING_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload
            ? { ...conv, unreadCount: 0 }
            : conv
        ),
        unreadCount: Math.max(
          0,
          state.unreadCount - (state.conversations.find((c) => c.id === action.payload)?.unreadCount || 0)
        ),
      }

    case MESSAGING_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case MESSAGING_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    default:
      return state
  }
}

// Create context
const MessagingContext = createContext(null)

// Provider component
export function MessagingProvider({ children }) {
  const [state, dispatch] = useReducer(messagingReducer, initialState)
  const { user } = useAuth()

  // Fetch all conversations for user
  const fetchConversations = useCallback(async () => {
    dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: true })

    try {
      const data = await messagingService.getConversations()
      const conversations = data.conversations || []
      
      // Calculate total unread count
      const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
      
      dispatch({ type: MESSAGING_ACTIONS.SET_CONVERSATIONS, payload: conversations })
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: null })
      
      return { success: true, conversations, unreadCount }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const data = await messagingService.getConversation(conversationId)
      const messages = data.messages || []
      
      dispatch({
        type: MESSAGING_ACTIONS.SET_MESSAGES,
        payload: { conversationId, messages },
      })
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: null })
      
      return { success: true, messages }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, error: errorMessage }
    }
  }, [])

  // Send a message
  const sendMessage = useCallback(async (conversationId, content, type = 'text', metadata = null) => {
    try {
      const data = await messagingService.sendMessage(conversationId, content, type, metadata)
      const message = data.message

      dispatch({
        type: MESSAGING_ACTIONS.ADD_MESSAGE,
        payload: { conversationId, message },
      })

      return { success: true, message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Create a new conversation (individual or group)
  const createConversation = useCallback(async (recipientId, listingId = null, initialMessage = null) => {
    try {
      const data = await messagingService.startConversation(recipientId, listingId, initialMessage)
      const conversation = data.conversation

      dispatch({
        type: MESSAGING_ACTIONS.UPDATE_CONVERSATION,
        payload: conversation,
      })

      return { success: true, conversation, message: data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Get or create conversation with user(s)
  const getOrCreateConversation = useCallback(async (participants, listingId = null, groupId = null) => {
    try {
      // Check if conversation exists
      const existing = state.conversations.find((conv) => {
        if (groupId && conv.groupId === groupId) return true
        if (!groupId && conv.type === 'individual') {
          const convParticipants = conv.participants.map((p) => p.id).sort()
          const newParticipants = participants.sort()
          return JSON.stringify(convParticipants) === JSON.stringify(newParticipants)
        }
        return false
      })

      if (existing) {
        dispatch({ type: MESSAGING_ACTIONS.SET_SELECTED_CONVERSATION, payload: existing })
        return { success: true, conversation: existing }
      }

      // Create new conversation
      return await createConversation({
        type: groupId ? 'group' : 'individual',
        participants,
        listingId,
        groupId,
      })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [state.conversations, createConversation])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await messagingService.markAsRead(conversationId)
      dispatch({ type: MESSAGING_ACTIONS.MARK_AS_READ, payload: conversationId })
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Select a conversation
  const selectConversation = useCallback((conversation) => {
    dispatch({ type: MESSAGING_ACTIONS.SET_SELECTED_CONVERSATION, payload: conversation })
  }, [])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await messagingService.getUnreadCount()
      return { success: true, total: data.total, byConversation: data.byConversation }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Send tour request
  const sendTourRequest = useCallback(async (conversationId, listingId, proposedTimes, message = null) => {
    try {
      const data = await messagingService.sendTourRequest(conversationId, listingId, proposedTimes, message)
      const tourMessage = data.message

      dispatch({
        type: MESSAGING_ACTIONS.ADD_MESSAGE,
        payload: { conversationId, message: tourMessage },
      })

      return { success: true, message: tourMessage }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      return { success: false, error: errorMessage }
    }
  }, [])

  // Auto-fetch conversations when user logs in
  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  const value = {
    ...state,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    getOrCreateConversation,
    markAsRead,
    selectConversation,
    fetchUnreadCount,
    sendTourRequest,
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}

MessagingProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook
export function useMessaging() {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

export default MessagingContext
