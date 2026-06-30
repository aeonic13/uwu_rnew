import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const userId = req.user.id
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get conversations where user is a participant
    const conversationUsers = await prisma.conversationUser.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
              },
            },
            users: {
              where: {
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    verified: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                senderId: true,
                read: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
      skip,
      take: parseInt(limit),
    })

    // Get total count
    const total = await prisma.conversationUser.count({
      where: { userId },
    })

    // Format the response
    const conversations = conversationUsers.map(cu => {
      const otherUsers = cu.conversation.users.map(u => u.user)
      const lastMessage = cu.conversation.messages[0] || null

      return {
        id: cu.conversation.id,
        otherUsers,
        listing: cu.conversation.listing,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              timestamp: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              isOwn: lastMessage.senderId === userId,
            }
          : null,
        unreadCount: cu.unreadCount,
        updatedAt: cu.conversation.updatedAt,
      }
    })

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + conversations.length < total,
      },
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: { message: 'Failed to get conversations' } })
  }
})

/**
 * GET /api/messages/conversation/:conversationId
 * Get messages in a specific conversation
 */
router.get('/conversation/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = req.user.id
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Verify user is part of this conversation
    const conversationUser = await prisma.conversationUser.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    })

    if (!conversationUser) {
      return res.status(403).json({
        error: { message: 'You are not a participant in this conversation' },
      })
    }

    // Get conversation with participants and listing
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            location: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                verified: true,
                userType: true,
              },
            },
          },
        },
      },
    })

    // Get messages with pagination (newest first for infinite scroll)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    })

    // Get total message count
    const total = await prisma.message.count({
      where: { conversationId },
    })

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    })

    // Reset unread count for this user
    await prisma.conversationUser.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    })

    // Format participants
    const participants = conversation.users.map(u => ({
      ...u.user,
      isCurrentUser: u.user.id === userId,
    }))

    res.json({
      conversation: {
        id: conversation.id,
        listing: conversation.listing,
        participants,
      },
      messages: messages.reverse(), // Return oldest first for display
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + messages.length < total,
      },
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ error: { message: 'Failed to get conversation' } })
  }
})

/**
 * POST /api/messages
 * Send a message in an existing conversation
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { conversationId, content, type = 'text', metadata } = req.body
    const userId = req.user.id

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: 'Message content is required' },
      })
    }

    if (content.length > 2000) {
      return res.status(400).json({
        error: { message: 'Message content must be less than 2000 characters' },
      })
    }

    // Verify user is part of this conversation
    const conversationUser = await prisma.conversationUser.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    })

    if (!conversationUser) {
      return res.status(403).json({
        error: { message: 'You are not a participant in this conversation' },
      })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        metadata,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Increment unread count for other participants
    await prisma.conversationUser.updateMany({
      where: {
        conversationId,
        userId: { not: userId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    })

    res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        timestamp: message.createdAt,
        sender: message.sender,
        read: message.read,
      },
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: { message: 'Failed to send message' } })
  }
})

/**
 * POST /api/messages/start-conversation
 * Start a new conversation with a user (optionally about a listing)
 */
router.post('/start-conversation', authenticate, async (req, res) => {
  try {
    const { recipientId, listingId, initialMessage } = req.body
    const userId = req.user.id

    // Validate recipient
    if (!recipientId) {
      return res.status(400).json({
        error: { message: 'Recipient ID is required' },
      })
    }

    if (recipientId === userId) {
      return res.status(400).json({
        error: { message: 'Cannot start a conversation with yourself' },
      })
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    })

    if (!recipient) {
      return res.status(404).json({
        error: { message: 'Recipient not found' },
      })
    }

    // Check if listing exists (if provided)
    let listing = null
    if (listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          images: true,
          price: true,
        },
      })

      if (!listing) {
        return res.status(404).json({
          error: { message: 'Listing not found' },
        })
      }
    }

    // Check if conversation already exists between these users about this listing
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId || null,
        AND: [
          { users: { some: { userId } } },
          { users: { some: { userId: recipientId } } },
        ],
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (existingConversation) {
      // Return existing conversation
      return res.json({
        conversation: {
          id: existingConversation.id,
          isNew: false,
          listing,
          participants: existingConversation.users.map(u => u.user),
        },
      })
    }

    // Create new conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        listingId: listingId || null,
        users: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    // Send initial message if provided
    let message = null
    if (initialMessage && initialMessage.trim()) {
      message = await prisma.message.create({
        data: {
          content: initialMessage.trim(),
          type: 'text',
          senderId: userId,
          conversationId: conversation.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      })

      // Increment unread count for recipient
      await prisma.conversationUser.update({
        where: {
          userId_conversationId: {
            userId: recipientId,
            conversationId: conversation.id,
          },
        },
        data: { unreadCount: 1 },
      })
    }

    res.status(201).json({
      conversation: {
        id: conversation.id,
        isNew: true,
        listing,
        participants: conversation.users.map(u => u.user),
      },
      message: message
        ? {
            id: message.id,
            content: message.content,
            timestamp: message.createdAt,
            sender: message.sender,
          }
        : null,
    })
  } catch (error) {
    console.error('Start conversation error:', error)
    res.status(500).json({ error: { message: 'Failed to start conversation' } })
  }
})

/**
 * PUT /api/messages/mark-read
 * Mark messages as read in a conversation
 */
router.put('/mark-read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.body
    const userId = req.user.id

    if (!conversationId) {
      return res.status(400).json({
        error: { message: 'Conversation ID is required' },
      })
    }

    // Verify user is part of this conversation
    const conversationUser = await prisma.conversationUser.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    })

    if (!conversationUser) {
      return res.status(403).json({
        error: { message: 'You are not a participant in this conversation' },
      })
    }

    // Mark all messages as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    })

    // Reset unread count
    await prisma.conversationUser.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    })

    res.json({
      message: 'Messages marked as read',
      markedCount: result.count,
    })
  } catch (error) {
    console.error('Mark read error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to mark messages as read' } })
  }
})

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the user
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    // Get unread counts from all conversations
    const conversationUsers = await prisma.conversationUser.findMany({
      where: { userId },
      select: {
        conversationId: true,
        unreadCount: true,
      },
    })

    const total = conversationUsers.reduce((sum, cu) => sum + cu.unreadCount, 0)
    const byConversation = conversationUsers.reduce((acc, cu) => {
      if (cu.unreadCount > 0) {
        acc[cu.conversationId] = cu.unreadCount
      }
      return acc
    }, {})

    res.json({
      total,
      byConversation,
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: { message: 'Failed to get unread count' } })
  }
})

/**
 * DELETE /api/messages/:messageId
 * Delete a message (sender only)
 */
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return res.status(404).json({
        error: { message: 'Message not found' },
      })
    }

    // Only sender can delete their own messages
    if (message.senderId !== userId) {
      return res.status(403).json({
        error: { message: 'You can only delete your own messages' },
      })
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    })

    res.json({
      message: 'Message deleted successfully',
    })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: { message: 'Failed to delete message' } })
  }
})

/**
 * POST /api/messages/tour-request
 * Send a tour request message
 */
router.post('/tour-request', authenticate, async (req, res) => {
  try {
    const {
      conversationId,
      listingId,
      proposedTimes,
      message: tourMessage,
    } = req.body
    const userId = req.user.id

    if (!conversationId || !proposedTimes || proposedTimes.length === 0) {
      return res.status(400).json({
        error: { message: 'Conversation ID and proposed times are required' },
      })
    }

    // Verify user is part of this conversation
    const conversationUser = await prisma.conversationUser.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    })

    if (!conversationUser) {
      return res.status(403).json({
        error: { message: 'You are not a participant in this conversation' },
      })
    }

    // Create tour request message
    const message = await prisma.message.create({
      data: {
        content: tourMessage || 'I would like to schedule a tour',
        type: 'tour-request',
        metadata: {
          listingId,
          proposedTimes,
          status: 'pending',
        },
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update conversation and unread counts
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    await prisma.conversationUser.updateMany({
      where: {
        conversationId,
        userId: { not: userId },
      },
      data: { unreadCount: { increment: 1 } },
    })

    res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        timestamp: message.createdAt,
        sender: message.sender,
      },
    })
  } catch (error) {
    console.error('Tour request error:', error)
    res.status(500).json({ error: { message: 'Failed to send tour request' } })
  }
})

/**
 * PUT /api/messages/:messageId/tour-response
 * Respond to a tour request
 */
router.put('/:messageId/tour-response', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params
    const { status, confirmedTime, alternativeMessage } = req.body
    const userId = req.user.id

    if (!['confirmed', 'declined', 'alternative'].includes(status)) {
      return res.status(400).json({
        error: {
          message:
            'Invalid status. Must be confirmed, declined, or alternative',
        },
      })
    }

    // Find the tour request message
    const tourRequest = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            users: true,
          },
        },
      },
    })

    if (!tourRequest || tourRequest.type !== 'tour-request') {
      return res.status(404).json({
        error: { message: 'Tour request not found' },
      })
    }

    // Verify user is the recipient (not the sender)
    if (tourRequest.senderId === userId) {
      return res.status(403).json({
        error: { message: 'You cannot respond to your own tour request' },
      })
    }

    // Update tour request metadata
    const updatedMetadata = {
      ...tourRequest.metadata,
      status,
      confirmedTime: status === 'confirmed' ? confirmedTime : null,
      respondedAt: new Date().toISOString(),
      respondedBy: userId,
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { metadata: updatedMetadata },
    })

    // Create response message
    let responseContent = ''
    if (status === 'confirmed') {
      responseContent = `Tour confirmed for ${confirmedTime}`
    } else if (status === 'declined') {
      responseContent =
        alternativeMessage || 'Sorry, I cannot accommodate a tour at this time'
    } else {
      responseContent =
        alternativeMessage || 'Could we schedule for a different time?'
    }

    const responseMessage = await prisma.message.create({
      data: {
        content: responseContent,
        type: 'tour-response',
        metadata: {
          tourRequestId: messageId,
          status,
          confirmedTime,
        },
        senderId: userId,
        conversationId: tourRequest.conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update conversation and unread counts
    await prisma.conversation.update({
      where: { id: tourRequest.conversationId },
      data: { updatedAt: new Date() },
    })

    await prisma.conversationUser.updateMany({
      where: {
        conversationId: tourRequest.conversationId,
        userId: { not: userId },
      },
      data: { unreadCount: { increment: 1 } },
    })

    res.json({
      message: {
        id: responseMessage.id,
        content: responseMessage.content,
        type: responseMessage.type,
        metadata: responseMessage.metadata,
        timestamp: responseMessage.createdAt,
        sender: responseMessage.sender,
      },
      tourRequest: {
        id: tourRequest.id,
        status,
        confirmedTime,
      },
    })
  } catch (error) {
    console.error('Tour response error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to respond to tour request' } })
  }
})

export default router
