import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import {
  sendMaintenanceTicketEmail,
  sendMaintenanceStatusEmail,
} from '../utils/email.js'
import { sendMaintenanceCommentEmail } from '../utils/emailMaintenance.js'
import { upload, uploadToCloudinary } from '../utils/cloudinary.js'
import {
  expenseFromTicket,
  isTicketParty,
  sanitizeComment,
  sanitizeVendorFields,
} from '../utils/maintenance.js'

const router = express.Router()

const VALID_STATUS = ['pending', 'in-progress', 'completed']

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  userType: true,
}

/**
 * Load a ticket with the relations the party check and the emails need, and
 * confirm the caller is the tenant or the listing owner. Responds on failure
 * and returns null; otherwise returns the ticket.
 */
async function loadTicketForParty(req, res) {
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          owner: { select: { firstName: true, email: true, userType: true } },
        },
      },
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
        },
      },
    },
  })
  if (!ticket) {
    res.status(404).json({ error: { message: 'Ticket not found' } })
    return null
  }
  if (!isTicketParty(ticket, req.user.id)) {
    res
      .status(403)
      .json({ error: { message: 'Not authorized to view this ticket' } })
    return null
  }
  return ticket
}

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
      select: {
        listingId: true,
        listing: {
          select: {
            id: true,
            title: true,
            owner: { select: { firstName: true, email: true } },
          },
        },
      },
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

    // Tell the landlord. Best-effort, after responding.
    sendMaintenanceTicketEmail({
      owner: application.listing.owner,
      tenant: req.user,
      listing: application.listing,
      ticket,
    }).catch(err =>
      console.error('Maintenance ticket email failed:', err?.message)
    )
  } catch (error) {
    console.error('Create maintenance ticket error:', error)
    res.status(500).json({ error: { message: 'Failed to create ticket' } })
  }
})

/**
 * GET /api/maintenance
 * Tenants see their own tickets; owners see tickets on their listings.
 * Each row carries a comment count so lists can show a thread badge.
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
        _count: { select: { comments: true } },
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
 * GET /api/maintenance/:id
 * One ticket with its thread. Tenant or listing owner only.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const party = await loadTicketForParty(req, res)
    if (!party) return

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: party.id },
      include: {
        listing: { select: { id: true, title: true, ownerId: true } },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        expense: { select: { id: true, amount: true, date: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    })

    res.json({ ticket })
  } catch (error) {
    console.error('Get maintenance ticket error:', error)
    res.status(500).json({ error: { message: 'Failed to load ticket' } })
  }
})

/**
 * POST /api/maintenance/:id/comments  { body, photos? }
 * Either party adds to the thread; the other party is emailed.
 */
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const ticket = await loadTicketForParty(req, res)
    if (!ticket) return

    const parsed = sanitizeComment(req.body)
    if (parsed.error) {
      return res.status(400).json({ error: { message: parsed.error } })
    }

    const comment = await prisma.maintenanceComment.create({
      data: {
        body: parsed.body,
        photos: parsed.photos,
        ticketId: ticket.id,
        authorId: req.user.id,
      },
      include: { author: { select: AUTHOR_SELECT } },
    })

    res.status(201).json({ comment })

    // Notify the other side of the thread. Best-effort, after responding.
    const authorIsOwner = req.user.id === ticket.listing.ownerId
    const recipient = authorIsOwner ? ticket.tenant : ticket.listing.owner
    sendMaintenanceCommentEmail({
      recipient,
      authorName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
      listing: ticket.listing,
      ticket,
      comment,
    }).catch(err =>
      console.error('Maintenance comment email failed:', err?.message)
    )
  } catch (error) {
    console.error('Add maintenance comment error:', error)
    res.status(500).json({ error: { message: 'Failed to add comment' } })
  }
})

/**
 * POST /api/maintenance/:id/photos  (multipart `images`, up to 10)
 * Either party uploads photos to attach to a comment. Returns the URLs; the
 * client then sends them in the comment body.
 */
router.post(
  '/:id/photos',
  authenticate,
  upload.array('images', 10),
  async (req, res) => {
    try {
      const ticket = await loadTicketForParty(req, res)
      if (!ticket) return

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: { message: 'No images provided' } })
      }

      const results = await Promise.all(
        req.files.map((file, index) =>
          uploadToCloudinary(file.buffer, {
            folder: `rentra/maintenance/${ticket.id}`,
            publicId: `photo_${index}_${Date.now()}`,
            transformation: [
              { width: 1600, height: 1600, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          })
        )
      )

      res
        .status(201)
        .json({ images: results.map(r => ({ url: r.secure_url })) })
    } catch (error) {
      console.error('Maintenance photo upload error:', error)
      res.status(500).json({ error: { message: 'Failed to upload photos' } })
    }
  }
)

/**
 * PUT /api/maintenance/:id/status
 * Owner updates a ticket's status / assignment / vendor phone / cost.
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, assignedTo } = req.body
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } })
    }
    const vendor = sanitizeVendorFields(req.body)
    if (vendor.error) {
      return res.status(400).json({ error: { message: vendor.error } })
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { select: { ownerId: true, title: true } },
        tenant: { select: { firstName: true, email: true } },
      },
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
        ...vendor.data,
        ...(status === 'completed' &&
          ticket.status !== 'completed' && { completedAt: new Date() }),
      },
    })

    res.json({ ticket: updated })

    // Tell the tenant when the status actually moved. Best-effort.
    if (status && status !== ticket.status) {
      sendMaintenanceStatusEmail({
        tenant: ticket.tenant,
        listing: ticket.listing,
        ticket: updated,
        landlordName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      }).catch(err =>
        console.error('Maintenance status email failed:', err?.message)
      )
    }
  } catch (error) {
    console.error('Update maintenance ticket error:', error)
    res.status(500).json({ error: { message: 'Failed to update ticket' } })
  }
})

/**
 * POST /api/maintenance/:id/expense
 * Owner books a costed repair as a `repairs` Expense on the property.
 * One expense per ticket; a second call is a 409.
 */
router.post(
  '/:id/expense',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const ticket = await prisma.maintenanceTicket.findUnique({
        where: { id: req.params.id },
        include: { listing: { select: { id: true, ownerId: true } } },
      })
      if (!ticket) {
        return res.status(404).json({ error: { message: 'Ticket not found' } })
      }
      if (ticket.listing.ownerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: { message: 'Not authorized to book this ticket' } })
      }
      if (ticket.expenseId) {
        return res.status(409).json({
          error: { message: 'This repair is already booked as an expense' },
        })
      }
      const data = expenseFromTicket(ticket)
      if (!data) {
        return res.status(400).json({
          error: { message: 'Enter the repair cost before booking it' },
        })
      }

      const [expense, updated] = await prisma.$transaction(async tx => {
        const expense = await tx.expense.create({ data })
        const updated = await tx.maintenanceTicket.update({
          where: { id: ticket.id },
          data: { expenseId: expense.id },
        })
        return [expense, updated]
      })

      res.status(201).json({ ticket: updated, expense })
    } catch (error) {
      console.error('Book maintenance expense error:', error)
      res.status(500).json({ error: { message: 'Failed to book expense' } })
    }
  }
)

export default router
