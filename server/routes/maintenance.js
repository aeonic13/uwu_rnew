import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'

const router = express.Router()

const VALID_STATUS = ['pending', 'in-progress', 'completed']

/**
 * POST /api/maintenance
 * Tenant files a maintenance ticket for the property they lease. The listing
 * is derived from the tenant's most recent approved application.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { category, description, priority = 'medium', photos = [] } = req.body
    if (!category || !description) {
      return res.status(400).json({
        error: { message: 'Category and description are required' },
      })
    }

    // Find the tenant's active (approved) application to attach the listing.
    const application = await prisma.application.findFirst({
      where: { applicantId: req.user.id, status: 'approved' },
      orderBy: { updatedAt: 'desc' },
      select: { listingId: true },
    })

    if (!application) {
      return res.status(400).json({
        error: {
          message: 'You need an approved lease to file a maintenance request.',
        },
      })
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        category,
        description,
        priority,
        photos: Array.isArray(photos) ? photos : [],
        tenantId: req.user.id,
        listingId: application.listingId,
      },
    })

    res.status(201).json({ ticket })
  } catch (error) {
    console.error('Create maintenance ticket error:', error)
    res.status(500).json({ error: { message: 'Failed to create ticket' } })
  }
})

/**
 * GET /api/maintenance
 * Tenants see their own tickets; owners see tickets on their listings.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const where =
      req.user.userType === 'owner'
        ? { listing: { ownerId: req.user.id } }
        : { tenantId: req.user.id }

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, location: true } },
        tenant:
          req.user.userType === 'owner'
            ? { select: { firstName: true, lastName: true, email: true } }
            : false,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ tickets })
  } catch (error) {
    console.error('List maintenance tickets error:', error)
    res.status(500).json({ error: { message: 'Failed to list tickets' } })
  }
})

/**
 * PUT /api/maintenance/:id/status
 * Owner updates a ticket's status / assignment.
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, assignedTo } = req.body
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } })
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: { listing: { select: { ownerId: true } } },
    })
    if (!ticket) {
      return res.status(404).json({ error: { message: 'Ticket not found' } })
    }
    if (ticket.listing.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to update this ticket' } })
    }

    const updated = await prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: {
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
    })

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Update maintenance ticket error:', error)
    res.status(500).json({ error: { message: 'Failed to update ticket' } })
  }
})

export default router
