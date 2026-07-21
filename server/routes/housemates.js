import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, optionalAuth } from '../middleware/authenticate.js'
import { computeCompatibility } from '../utils/compatibility.js'

const router = express.Router()

// Public user fields safe to expose alongside a housemate profile.
const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  verified: true,
  university: true,
}

// Fields a user is allowed to set on their own housemate profile.
const editableFields = [
  'sleepSchedule',
  'cleanliness',
  'noiseTolerance',
  'guestFrequency',
  'smoking',
  'pets',
  'socialStyle',
  'sharing',
  'chores',
  'conflictStyle',
  'gender',
  'genderPreference',
  'audience',
  'occupation',
  'location',
  'bio',
  'tags',
  'lookingForRoom',
]

// Integer profile fields that need parsing/coercion before hitting Prisma.
const integerFields = [
  'age',
  'agePreferenceMin',
  'agePreferenceMax',
  'budgetMin',
  'budgetMax',
]

/**
 * Build a Prisma-ready data object from a request body, only picking known
 * fields and coercing types where needed.
 */
function buildProfileData(body) {
  const data = {}

  for (const field of editableFields) {
    if (body[field] === undefined) continue

    if (field === 'tags') {
      data.tags = Array.isArray(body.tags) ? body.tags : []
    } else if (field === 'lookingForRoom') {
      data.lookingForRoom = Boolean(body.lookingForRoom)
    } else {
      data[field] = body[field]
    }
  }

  for (const field of integerFields) {
    if (body[field] === undefined || body[field] === null) continue
    const parsed = parseInt(body[field], 10)
    if (!Number.isNaN(parsed)) data[field] = parsed
  }

  return data
}

// GET /api/housemates - list housemate profiles ranked by compatibility
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { audience, lookingForRoom, ageMin, ageMax, gender } = req.query

    const where = { active: true }

    if (audience && audience !== 'all') {
      where.audience = audience
    }

    if (lookingForRoom === 'true') {
      where.lookingForRoom = true
    }

    // Age-range filter. Candidates who haven't shared an age still pass through
    // (null age) so a rollout doesn't hide the existing dataset.
    const minAge = parseInt(ageMin, 10)
    const maxAge = parseInt(ageMax, 10)
    const ageBounds = {}
    if (!Number.isNaN(minAge)) ageBounds.gte = minAge
    if (!Number.isNaN(maxAge)) ageBounds.lte = maxAge
    if (Object.keys(ageBounds).length > 0) {
      where.OR = [{ age: ageBounds }, { age: null }]
    }

    // Gender preference. "everyone" (or unset) applies no filter; a specific
    // preference maps to the candidate's own gender.
    const genderMap = { men: 'man', women: 'woman', nonbinary: 'nonbinary' }
    if (gender && genderMap[gender]) {
      where.gender = genderMap[gender]
    }

    // Exclude the current user from their own results.
    if (req.user) {
      where.userId = { not: req.user.id }
    }

    // Look up the viewer's own profile so we can score against it.
    let viewerProfile = null
    if (req.user) {
      viewerProfile = await prisma.housemateProfile.findUnique({
        where: { userId: req.user.id },
      })
    }

    const profiles = await prisma.housemateProfile.findMany({
      where,
      include: { user: { select: publicUserSelect } },
      orderBy: { updatedAt: 'desc' },
    })

    // Attach a compatibility score and sort by it (highest first).
    const scored = profiles
      .map(profile => ({
        ...profile,
        compatibilityScore: computeCompatibility(viewerProfile, profile),
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)

    res.json({ profiles: scored, total: scored.length })
  } catch (error) {
    console.error('Get housemates error:', error)
    res.status(500).json({ error: { message: 'Failed to get housemates' } })
  }
})

// GET /api/housemates/me - current user's housemate profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await prisma.housemateProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: publicUserSelect } },
    })

    res.json({ profile })
  } catch (error) {
    console.error('Get my housemate profile error:', error)
    res.status(500).json({ error: { message: 'Failed to get profile' } })
  }
})

// PUT /api/housemates/me - create or update current user's profile (upsert)
router.put('/me', authenticate, async (req, res) => {
  try {
    const data = buildProfileData(req.body)

    const profile = await prisma.housemateProfile.upsert({
      where: { userId: req.user.id },
      update: data,
      create: {
        ...data,
        tags: data.tags || [],
        userId: req.user.id,
      },
      include: { user: { select: publicUserSelect } },
    })

    res.json({ message: 'Profile saved', profile })
  } catch (error) {
    console.error('Save housemate profile error:', error)
    res.status(400).json({ error: { message: 'Failed to save profile' } })
  }
})

// GET /api/housemates/:id - single housemate profile with compatibility
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params

    const profile = await prisma.housemateProfile.findUnique({
      where: { id },
      include: { user: { select: publicUserSelect } },
    })

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } })
    }

    let viewerProfile = null
    if (req.user) {
      viewerProfile = await prisma.housemateProfile.findUnique({
        where: { userId: req.user.id },
      })
    }

    res.json({
      profile: {
        ...profile,
        compatibilityScore: computeCompatibility(viewerProfile, profile),
      },
    })
  } catch (error) {
    console.error('Get housemate profile error:', error)
    res.status(500).json({ error: { message: 'Failed to get profile' } })
  }
})

export default router
