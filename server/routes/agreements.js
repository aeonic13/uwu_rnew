import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

// Shared include: agreement -> application -> listing + applicant + owner.
const agreementInclude = {
  application: {
    include: {
      listing: { select: { title: true, location: true } },
      applicant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
}

// Map a Prisma agreement to the shape the AgreementView renders.
function shape(agreement, viewerId) {
  const app = agreement.application
  const t = agreement.terms || {}
  const viewerRole =
    app.applicant.id === viewerId
      ? 'tenant'
      : app.owner.id === viewerId
        ? 'landlord'
        : 'other'
  const viewerHasSigned =
    viewerRole === 'tenant'
      ? agreement.tenantSigned
      : viewerRole === 'landlord'
        ? agreement.landlordSigned
        : false

  return {
    id: agreement.id,
    status:
      agreement.tenantSigned && agreement.landlordSigned
        ? 'signed'
        : 'pending_signature',
    tenantSigned: agreement.tenantSigned,
    landlordSigned: agreement.landlordSigned,
    viewerRole,
    viewerHasSigned,
    property: {
      address: app.listing.location,
      description: app.listing.title,
    },
    tenant: {
      name: `${app.applicant.firstName} ${app.applicant.lastName}`,
      email: app.applicant.email,
      phone: app.applicant.phone || '',
    },
    landlord: {
      name: `${app.owner.firstName} ${app.owner.lastName}`,
      email: app.owner.email,
      phone: app.owner.phone || '',
    },
    terms: {
      monthlyRent: agreement.monthlyRent,
      securityDeposit: agreement.securityDeposit,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      utilities: t.utilities || 'As agreed between the parties.',
      petPolicy: t.petPolicy || 'As agreed between the parties.',
    },
    createdAt: agreement.createdAt,
  }
}

/**
 * GET /api/agreements
 * List the authenticated user's agreements (as tenant or landlord).
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const agreements = await prisma.agreement.findMany({
      where: {
        application: {
          OR: [{ applicantId: userId }, { ownerId: userId }],
        },
      },
      include: agreementInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ agreements: agreements.map(a => shape(a, userId)) })
  } catch (error) {
    console.error('List agreements error:', error)
    res.status(500).json({ error: { message: 'Failed to list agreements' } })
  }
})

/**
 * GET /api/agreements/:id
 * Fetch one agreement (tenant or landlord on the application only).
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: agreementInclude,
    })

    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }
    const { applicantId, ownerId } = agreement.application
    if (userId !== applicantId && userId !== ownerId) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to view this agreement' } })
    }

    res.json({ agreement: shape(agreement, userId) })
  } catch (error) {
    console.error('Get agreement error:', error)
    res.status(500).json({ error: { message: 'Failed to get agreement' } })
  }
})

/**
 * POST /api/agreements/:id/sign
 * Record the viewer's signature (tenant or landlord) on the agreement.
 */
router.post('/:id/sign', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: {
        application: { select: { applicantId: true, ownerId: true } },
      },
    })

    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }

    const { applicantId, ownerId } = agreement.application
    const isTenant = userId === applicantId
    const isLandlord = userId === ownerId
    if (!isTenant && !isLandlord) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to sign this agreement' } })
    }

    const data = isTenant
      ? { tenantSigned: true, tenantSignedAt: new Date() }
      : { landlordSigned: true, landlordSignedAt: new Date() }

    await prisma.agreement.update({ where: { id: agreement.id }, data })

    const updated = await prisma.agreement.findUnique({
      where: { id: agreement.id },
      include: agreementInclude,
    })
    res.json({ agreement: shape(updated, userId) })
  } catch (error) {
    console.error('Sign agreement error:', error)
    res.status(500).json({ error: { message: 'Failed to sign agreement' } })
  }
})

export default router
