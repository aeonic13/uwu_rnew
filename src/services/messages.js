import api from './api'

export const messagesService = {
  /**
   * Get all conversations for current user
   * @param {Object} params - Pagination params
   * @returns {Promise} List of conversations
   */
  getConversations: async (params = {}) => {
    const response = await api.get('/messages/conversations', { params })
    return response.data
  },

  /**
   * Get messages in a conversation with specific user
   * @param {string} userId - Other user's ID
   * @param {Object} params - Pagination params
   * @returns {Promise} List of messages
   */
  getMessages: async (userId, params = {}) => {
    const response = await api.get(`/messages/conversation/${userId}`, {
      params,
    })
    return response.data
  },

  /**
   * Send a message
   * @param {Object} messageData - Message content and recipient
   * @returns {Promise} Sent message
   */
  send: async messageData => {
    const response = await api.post('/messages', messageData)
    return response.data
  },

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @returns {Promise} Update confirmation
   */
  markAsRead: async conversationId => {
    const response = await api.put('/messages/mark-read', { conversationId })
    return response.data
  },

  /**
   * Start a new conversation
   * @param {Object} data - Conversation details (recipientId, listingId, initialMessage)
   * @returns {Promise} New conversation
   */
  startConversation: async data => {
    const response = await api.post('/messages/conversation', data)
    return response.data
  },
}

export default messagesService
