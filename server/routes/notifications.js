import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

/**
 * The signed-in user's in-app notifications (written by
 * utils/notifications.js alongside transactional emails).
 */
const router = express.Router()

/** GET /api/notifications?limit=30 → { notifications, unread } */
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 30)
    )
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.user.id, readAt: null },
      }),
    ])
    res.json({ notifications, unread })
  } catch (error) {
    console.error('List notifications error:', error)
    res.status(500).json({ error: { message: 'Failed to load notifications' } })
  }
})

/** POST /api/notifications/read-all */
router.post('/read-all', authenticate, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    })
    res.json({ updated: result.count })
  } catch (error) {
    console.error('Read all notifications error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to update notifications' } })
  }
})

/** POST /api/notifications/:id/read */
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    })
    res.json({ updated: result.count })
  } catch (error) {
    console.error('Read notification error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to update notification' } })
  }
})

export default router
