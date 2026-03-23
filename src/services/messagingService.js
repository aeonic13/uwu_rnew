import { apiClient } from './api'

/**
 * Messaging service for handling conversation and message API calls
 */
export const messagingService = {
  /**
   * Get all conversations for the current user
   * @param {object} params - Query parameters
   * @param {number} params.page - Page number (default 1)
   * @param {number} params.limit - Items per page (default 20)
   * @returns {Promise<{conversations: Array, pagination: object}>}
   */
  async getConversations(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)

    const queryString = queryParams.toString()
    const url = queryString
      ? `/messages/conversations?${queryString}`
      : '/messages/conversations'

    return apiClient.get(url)
  },

  /**
   * Get messages in a specific conversation
   * @param {string} conversationId - The conversation ID
   * @param {object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Messages per page
   * @returns {Promise<{conversation: object, messages: Array, pagination: object}>}
   */
  async getConversation(conversationId, params = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)

    const queryString = queryParams.toString()
    const url = queryString
      ? `/messages/conversation/${conversationId}?${queryString}`
      : `/messages/conversation/${conversationId}`

    return apiClient.get(url)
  },

  /**
   * Send a message in an existing conversation
   * @param {string} conversationId - The conversation ID
   * @param {string} content - Message content
   * @param {string} type - Message type (default 'text')
   * @param {object} metadata - Optional metadata
   * @returns {Promise<{message: object}>}
   */
  async sendMessage(conversationId, content, type = 'text', metadata = null) {
    return apiClient.post('/messages', {
      conversationId,
      content,
      type,
      metadata,
    })
  },

  /**
   * Start a new conversation with a user
   * @param {string} recipientId - The recipient's user ID
   * @param {string} listingId - Optional listing ID for context
   * @param {string} initialMessage - Optional first message to send
   * @returns {Promise<{conversation: object, message?: object}>}
   */
  async startConversation(recipientId, listingId = null, initialMessage = null) {
    return apiClient.post('/messages/start-conversation', {
      recipientId,
      listingId,
      initialMessage,
    })
  },

  /**
   * Mark messages as read in a conversation
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<{message: string, markedCount: number}>}
   */
  async markAsRead(conversationId) {
    return apiClient.put('/messages/mark-read', { conversationId })
  },

  /**
   * Get total unread message count
   * @returns {Promise<{total: number, byConversation: object}>}
   */
  async getUnreadCount() {
    return apiClient.get('/messages/unread-count')
  },

  /**
   * Delete a message
   * @param {string} messageId - The message ID to delete
   * @returns {Promise<{message: string}>}
   */
  async deleteMessage(messageId) {
    return apiClient.delete(`/messages/${messageId}`)
  },

  /**
   * Send a tour request
   * @param {string} conversationId - The conversation ID
   * @param {string} listingId - The listing ID
   * @param {Array<string>} proposedTimes - Array of proposed date/time strings
   * @param {string} message - Optional message
   * @returns {Promise<{message: object}>}
   */
  async sendTourRequest(conversationId, listingId, proposedTimes, message = null) {
    return apiClient.post('/messages/tour-request', {
      conversationId,
      listingId,
      proposedTimes,
      message,
    })
  },

  /**
   * Respond to a tour request
   * @param {string} messageId - The tour request message ID
   * @param {string} status - 'confirmed', 'declined', or 'alternative'
   * @param {string} confirmedTime - The confirmed time (if status is 'confirmed')
   * @param {string} alternativeMessage - Optional message for declined/alternative
   * @returns {Promise<{message: object, tourRequest: object}>}
   */
  async respondToTourRequest(
    messageId,
    status,
    confirmedTime = null,
    alternativeMessage = null
  ) {
    return apiClient.put(`/messages/${messageId}/tour-response`, {
      status,
      confirmedTime,
      alternativeMessage,
    })
  },
}

export default messagingService
