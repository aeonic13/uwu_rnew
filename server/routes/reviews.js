import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

/**
 * Eligibility rule: only tenants with an APPROVED application for the
 * listing may review it (they actually dealt with this landlord), and only
 * once per listing. Keeps ratings grounded in real transactions instead of
 * drive-by reviews.
 */
async function getEligibility(userId, listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  })
  if (!listing)
    return { listing: null, eligible: false, alreadyReviewed: false }

  if (listing.ownerId === userId) {
    return { listing, eligible: false, alreadyReviewed: false }
  }

  const [approvedApplication, existingReview] = await Promise.all([
    prisma.application.findFirst({
      where: { listingId, applicantId: userId, status: 'approved' },
      select: { id: true },
    }),
    prisma.review.findFirst({
      where: { listingId, authorId: userId },
      select: { id: true },
    }),
  ])

  return {
    listing,
    eligible: Boolean(approvedApplication) && !existingReview,
    alreadyReviewed: Boolean(existingReview),
  }
}

// GET /api/reviews/eligibility/:listingId — can the current user review this?
router.get('/eligibility/:listingId', authenticate, async (req, res) => {
  try {
    const { listing, eligible, alreadyReviewed } = await getEligibility(
      req.user.id,
      req.params.listingId
    )
    if (!listing) {
      return res.status(404).json({ error: { message: 'Listing not found' } })
    }
    res.json({ eligible, alreadyReviewed })
  } catch (error) {
    console.error('Review eligibility error:', error)
    res.status(500).json({ error: { message: 'Failed to check eligibility' } })
  }
})

// POST /api/reviews — write a review for a listing (and its owner)
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, rating, comment } = req.body

    if (!listingId) {
      return res.status(400).json({
        error: { message: 'Listing ID is required' },
      })
    }

    const parsedRating = parseInt(rating, 10)
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: { message: 'Rating must be a whole number from 1 to 5' },
      })
    }

    const trimmedComment =
      typeof comment === 'string' ? comment.trim().slice(0, 1000) : null

    const { listing, eligible, alreadyReviewed } = await getEligibility(
      req.user.id,
      listingId
    )

    if (!listing) {
      return res.status(404).json({ error: { message: 'Listing not found' } })
    }
    if (alreadyReviewed) {
      return res.status(409).json({
        error: { message: 'You have already reviewed this listing' },
      })
    }
    if (!eligible) {
      return res.status(403).json({
        error: {
          message:
            'Only tenants with an approved application for this listing can review it',
        },
      })
    }

    const review = await prisma.review.create({
      data: {
        rating: parsedRating,
        comment: trimmedComment || null,
        authorId: req.user.id,
        subjectId: listing.ownerId,
        listingId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    res.status(201).json({ message: 'Review submitted', review })
  } catch (error) {
    console.error('Create review error:', error)
    res.status(500).json({ error: { message: 'Failed to submit review' } })
  }
})

export default router
