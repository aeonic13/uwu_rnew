import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, optionalAuth } from '../middleware/authenticate.js'
import {
  computeCompatibility,
  hasLifestyleAnswers,
} from '../utils/compatibility.js'
import {
  GENDER_PREF_TO_IDENTITY,
  satisfiesPreferencesOf,
  locationsCompatible,
} from '../utils/housemateMatch.js'
import { sendNewHousemateAlert } from '../utils/email.js'

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
  'active',
]

// Integer profile fields that need parsing/coercion before hitting Prisma.
const integerFields = [
  'age',
  'agePreferenceMin',
  'agePreferenceMax',
  'budgetMin',
  'budgetMax',
]

// Minimum score before we email someone about a new arrival — alerts should
// feel like good news, not noise.
const ALERT_MIN_SCORE = 70

// Discovery page size bounds.
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100

// Accepted report reasons (mirrors the client's report form).
const REPORT_REASONS = ['spam', 'inappropriate', 'harassment', 'fake', 'other']

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
    } else if (field === 'lookingForRoom' || field === 'active') {
      data[field] = Boolean(body[field])
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

/**
 * User ids the given user must never see (and must never see them): both
 * directions of any block they are part of.
 */
async function blockedUserIds(userId) {
  const blocks = await prisma.userBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  })
  return blocks.map(b => (b.blockerId === userId ? b.blockedId : b.blockerId))
}

// GET /api/housemates - list housemate profiles ranked by compatibility
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { lookingForRoom, ageMin, ageMax, gender, location } = req.query

    const where = { active: true }

    // "Has a place" vs "looking for a place" filter (omit for everyone).
    if (lookingForRoom === 'true') where.lookingForRoom = true
    if (lookingForRoom === 'false') where.lookingForRoom = false

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

    // Gender preference: comma list of preference ids ("women,nonbinary").
    // Unset or "everyone" applies no filter.
    if (gender && gender !== 'everyone') {
      const identities = gender
        .split(',')
        .map(part => GENDER_PREF_TO_IDENTITY[part.trim()])
        .filter(Boolean)
      if (identities.length > 0) {
        where.gender = { in: identities }
      }
    }

    // Rough locality filter (v1): case-insensitive substring on the free-text
    // location. A lifestyle match in another city is not a match.
    if (location && location.trim()) {
      where.location = { contains: location.trim(), mode: 'insensitive' }
    }

    // Exclude the current user and anyone in a block with them.
    if (req.user) {
      const excluded = await blockedUserIds(req.user.id)
      where.userId = { notIn: [req.user.id, ...excluded] }
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

    // Consent pass: a candidate's own age/gender preferences decide who may
    // see them — the mirror image of the viewer's filters above.
    const visible = profiles.filter(profile =>
      satisfiesPreferencesOf(profile, viewerProfile)
    )

    // Attach compatibility (null = unknown, never fabricated) and sort by it.
    // The stable sort keeps the updatedAt ordering inside each score band, so
    // unscored feeds (viewer hasn't taken the quiz) stay freshest-first.
    const scored = visible
      .map(profile => ({
        ...profile,
        compatibilityScore: computeCompatibility(viewerProfile, profile),
      }))
      .sort(
        (a, b) => (b.compatibilityScore ?? -1) - (a.compatibilityScore ?? -1)
      )

    // Post-score pagination: scoring needs the full candidate set, so we
    // slice afterwards. Fine at current scale; revisit with a real ranker.
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
    const page = scored.slice(offset, offset + limit)

    res.json({
      profiles: page,
      total: scored.length,
      hasMore: offset + page.length < scored.length,
      viewerHasQuiz: hasLifestyleAnswers(viewerProfile),
    })
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

// PUT /api/housemates/me - create or update current user's profile (upsert).
// Also accepts { active: false } to pause discoverability without losing data.
router.put('/me', authenticate, async (req, res) => {
  try {
    const data = buildProfileData(req.body)

    const existing = await prisma.housemateProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })

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

    // New-housemate alerts: only on first creation of a scoreable, active
    // profile, and fanned out AFTER responding so saving is never slowed or
    // failed by notification work. Best-effort by design.
    if (!existing && profile.active && hasLifestyleAnswers(profile)) {
      notifyNewHousemateMatches(profile).catch(err =>
        console.error('New-housemate alert fan-out failed:', err?.message)
      )
    }
  } catch (error) {
    console.error('Save housemate profile error:', error)
    res.status(400).json({ error: { message: 'Failed to save profile' } })
  }
})

// DELETE /api/housemates/me - permanently remove the current user's profile.
router.delete('/me', authenticate, async (req, res) => {
  try {
    await prisma.housemateProfile.deleteMany({
      where: { userId: req.user.id },
    })
    res.json({ message: 'Profile deleted' })
  } catch (error) {
    console.error('Delete housemate profile error:', error)
    res.status(500).json({ error: { message: 'Failed to delete profile' } })
  }
})

// POST /api/housemates/:id/block - block the user behind a profile. Removes
// both people from each other's discovery and stops messaging between them.
router.post('/:id/block', authenticate, async (req, res) => {
  try {
    const profile = await prisma.housemateProfile.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    })

    if (!profile || profile.userId === req.user.id) {
      return res.status(404).json({ error: { message: 'Profile not found' } })
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: profile.userId,
        },
      },
      update: {},
      create: { blockerId: req.user.id, blockedId: profile.userId },
    })

    res.json({ message: 'Blocked' })
  } catch (error) {
    console.error('Block housemate error:', error)
    res.status(500).json({ error: { message: 'Failed to block' } })
  }
})

// DELETE /api/housemates/:id/block - undo a block the current user placed.
router.delete('/:id/block', authenticate, async (req, res) => {
  try {
    const profile = await prisma.housemateProfile.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    })

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } })
    }

    await prisma.userBlock.deleteMany({
      where: { blockerId: req.user.id, blockedId: profile.userId },
    })

    res.json({ message: 'Unblocked' })
  } catch (error) {
    console.error('Unblock housemate error:', error)
    res.status(500).json({ error: { message: 'Failed to unblock' } })
  }
})

// POST /api/housemates/:id/report - report the user behind a profile.
router.post('/:id/report', authenticate, async (req, res) => {
  try {
    const { reason, details } = req.body

    if (!REPORT_REASONS.includes(reason)) {
      return res
        .status(400)
        .json({ error: { message: 'A valid reason is required' } })
    }

    const profile = await prisma.housemateProfile.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    })

    if (!profile || profile.userId === req.user.id) {
      return res.status(404).json({ error: { message: 'Profile not found' } })
    }

    await prisma.userReport.create({
      data: {
        reason,
        details:
          typeof details === 'string' && details.trim()
            ? details.trim().slice(0, 1000)
            : null,
        reporterId: req.user.id,
        reportedId: profile.userId,
      },
    })

    res.status(201).json({ message: 'Report received' })
  } catch (error) {
    console.error('Report housemate error:', error)
    res.status(500).json({ error: { message: 'Failed to report' } })
  }
})

// GET /api/housemates/:id - single housemate profile with compatibility.
// Applies the same consent rules as the list: a profile hidden from this
// viewer (block in either direction, or the owner's preferences exclude
// them) is a 404, not a leak.
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
      if (profile.userId !== req.user.id) {
        const excluded = await blockedUserIds(req.user.id)
        if (excluded.includes(profile.userId)) {
          return res
            .status(404)
            .json({ error: { message: 'Profile not found' } })
        }
      }
      viewerProfile = await prisma.housemateProfile.findUnique({
        where: { userId: req.user.id },
      })
    }

    const isOwner = req.user && profile.userId === req.user.id
    if (!isOwner && !satisfiesPreferencesOf(profile, viewerProfile)) {
      return res.status(404).json({ error: { message: 'Profile not found' } })
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

/**
 * Email everyone who would be a strong mutual match with a newly created
 * profile. Mirrors the saved-search listing alerts: one best-effort email per
 * user, respecting blocks, mutual preferences, locality, and a score floor.
 */
async function notifyNewHousemateMatches(newProfile) {
  const [recipients, excluded] = await Promise.all([
    prisma.housemateProfile.findMany({
      where: { active: true, userId: { not: newProfile.userId } },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    }),
    blockedUserIds(newProfile.userId),
  ])
  const excludedSet = new Set(excluded)

  for (const recipient of recipients) {
    if (excludedSet.has(recipient.userId)) continue
    // The recipient needs quiz answers of their own for a real score.
    if (!hasLifestyleAnswers(recipient)) continue
    // Both directions of consent, plus rough locality.
    if (!satisfiesPreferencesOf(recipient, newProfile)) continue
    if (!satisfiesPreferencesOf(newProfile, recipient)) continue
    if (!locationsCompatible(recipient.location, newProfile.location)) continue

    const score = computeCompatibility(recipient, newProfile)
    if (score == null || score < ALERT_MIN_SCORE) continue

    if (recipient.user?.email) {
      sendNewHousemateAlert(recipient.user, newProfile, score).catch(err =>
        console.error('New-housemate alert email failed:', err?.message)
      )
    }
  }
}

export default router
