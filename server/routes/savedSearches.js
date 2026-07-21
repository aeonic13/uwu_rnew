import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

// Cap per user so a runaway client can't turn the alert fan-out into spam.
const MAX_SAVED_SEARCHES = 10

/** Pick and coerce the filter fields a client may set. */
function buildSearchData(body) {
  const data = {}
  if (body.location && typeof body.location === 'string') {
    data.location = body.location.trim().slice(0, 120) || null
  }
  for (const field of ['minPrice', 'maxPrice', 'minBeds']) {
    if (body[field] !== undefined && body[field] !== null) {
      const parsed = parseInt(body[field], 10)
      if (!Number.isNaN(parsed) && parsed >= 0) data[field] = parsed
    }
  }
  if (body.propertyType && typeof body.propertyType === 'string') {
    data.propertyType = body.propertyType.trim().slice(0, 40) || null
  }
  return data
}

// GET /api/saved-searches — the current user's saved searches
router.get('/', authenticate, async (req, res) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ searches })
  } catch (error) {
    console.error('Get saved searches error:', error)
    res.status(500).json({ error: { message: 'Failed to get saved searches' } })
  }
})

// POST /api/saved-searches — save the current filters as a standing search
router.post('/', authenticate, async (req, res) => {
  try {
    const data = buildSearchData(req.body)

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: { message: 'Set at least one filter before saving a search' },
      })
    }

    const count = await prisma.savedSearch.count({
      where: { userId: req.user.id },
    })
    if (count >= MAX_SAVED_SEARCHES) {
      return res.status(400).json({
        error: {
          message: `You can keep up to ${MAX_SAVED_SEARCHES} saved searches — delete one first`,
        },
      })
    }

    const search = await prisma.savedSearch.create({
      data: { ...data, userId: req.user.id },
    })

    res.status(201).json({
      message: 'Search saved — we will email you when a match is posted',
      search,
    })
  } catch (error) {
    console.error('Create saved search error:', error)
    res.status(500).json({ error: { message: 'Failed to save search' } })
  }
})

// DELETE /api/saved-searches/:id — remove a saved search (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await prisma.savedSearch.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (deleted.count === 0) {
      return res
        .status(404)
        .json({ error: { message: 'Saved search not found' } })
    }
    res.json({ message: 'Saved search deleted' })
  } catch (error) {
    console.error('Delete saved search error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to delete saved search' } })
  }
})

export default router
