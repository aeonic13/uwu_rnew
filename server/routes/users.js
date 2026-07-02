import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

// All user routes require authentication
router.use(authenticate)

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    // User is already authenticated and available in req.user
    // Fetch full profile from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        userType: true,
        firstName: true,
        lastName: true,
        phone: true,
        university: true,
        major: true,
        bio: true,
        avatarUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: { message: 'Failed to get profile' } })
  }
})

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      university,
      major,
      bio,
      instagramUrl,
      linkedinUrl,
    } = req.body

    // Validate: strings only, sane length caps.
    const fields = [
      ['firstName', firstName, 100],
      ['lastName', lastName, 100],
      ['phone', phone, 30],
      ['university', university, 150],
      ['major', major, 150],
      ['bio', bio, 2000],
      ['instagramUrl', instagramUrl, 300],
      ['linkedinUrl', linkedinUrl, 300],
    ]
    const updateData = {}
    for (const [key, value, maxLen] of fields) {
      if (value === undefined) continue
      if (value !== null && typeof value !== 'string') {
        return res
          .status(400)
          .json({ error: { message: `${key} must be a string` } })
      }
      if (typeof value === 'string' && value.length > maxLen) {
        return res.status(400).json({
          error: { message: `${key} must be at most ${maxLen} characters` },
        })
      }
      updateData[key] = value
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        userType: true,
        firstName: true,
        lastName: true,
        phone: true,
        university: true,
        major: true,
        bio: true,
        avatarUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        verified: true,
        updatedAt: true,
      },
    })

    res.json({
      message: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(400).json({ error: { message: 'Failed to update profile' } })
  }
})

// GET /api/users/:id - Public profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Return public profile information only
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userType: true,
        university: true,
        bio: true,
        avatarUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        verified: true,
        createdAt: true,
        // Include aggregated stats
        listings: {
          where: { active: true },
          select: { id: true },
        },
        receivedReviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      })
    }

    // Calculate average rating
    const ratings = user.receivedReviews.map(r => r.rating)
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

    // Return user with stats
    const { receivedReviews, listings, ...userData } = user

    res.json({
      user: {
        ...userData,
        activeListingsCount: listings.length,
        averageRating: avgRating,
        reviewCount: receivedReviews.length,
      },
    })
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({ error: { message: 'Failed to get user' } })
  }
})

export default router
