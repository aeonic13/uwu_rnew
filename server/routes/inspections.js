import express from 'express'
import multer from 'multer'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import { upload, uploadToCloudinary } from '../utils/cloudinary.js'
import {
  INSPECTION_TYPES,
  defaultChecklist,
  summarizeItems,
  deductionsFromInspection,
  sanitizeItems,
} from '../utils/inspections.js'
import { sendInspectionReportEmail } from '../utils/emailInspections.js'
import { ruleForState, stateFromLocation } from './deposits.js'

/**
 * Move-in / move-out inspection reports. A report belongs to a listing (and
 * usually the lease in force); the landlord fills it in as a draft, marks it
 * complete, and tenants on that lease can read it. A completed move-out
 * report can push its flagged items into the lease's security deposit as
 * itemized deductions.
 */
const router = express.Router()

const LISTING_SELECT = {
  id: true,
  title: true,
  location: true,
  streetAddress: true,
  ownerId: true,
}
const AGREEMENT_SELECT = { id: true, startDate: true, endDate: true }

const present = inspection => ({
  id: inspection.id,
  type: inspection.type,
  status: inspection.status,
  conductedAt: inspection.conductedAt,
  completedAt: inspection.completedAt,
  notes: inspection.notes,
  createdAt: inspection.createdAt,
  updatedAt: inspection.updatedAt,
  listingId: inspection.listingId,
  agreementId: inspection.agreementId,
  listing: inspection.listing
    ? {
        id: inspection.listing.id,
        title: inspection.listing.title,
        location: inspection.listing.location,
        streetAddress: inspection.listing.streetAddress,
      }
    : null,
  agreement: inspection.agreement || null,
  items: Array.isArray(inspection.items) ? inspection.items : [],
  ...summarizeItems(inspection.items),
})

/** The lease most relevant to a new report: fully signed, latest start. */
async function relevantAgreement(listingId) {
  return prisma.agreement.findFirst({
    where: {
      application: { listingId },
      signers: { every: { signed: true } },
    },
    orderBy: { startDate: 'desc' },
    select: { id: true },
  })
}

async function loadInspection(id) {
  return prisma.inspection.findUnique({
    where: { id },
    include: {
      listing: { select: LISTING_SELECT },
      agreement: { select: AGREEMENT_SELECT },
    },
  })
}

/** Owner of the listing, or a tenant who signs the report's lease. */
async function canRead(inspection, user) {
  if (inspection.listing.ownerId === user.id) return true
  if (!inspection.agreementId) return false
  const signer = await prisma.agreementSigner.findFirst({
    where: { agreementId: inspection.agreementId, userId: user.id },
    select: { id: true },
  })
  return Boolean(signer)
}

/**
 * GET /api/inspections?listingId=
 * Owner's reports, newest first.
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const where = { ownerId: req.portfolioId }
    if (req.query.listingId) where.listingId = String(req.query.listingId)
    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true } },
        agreement: { select: AGREEMENT_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({
      inspections: inspections.map(i => {
        // Rows are summaries; the editor fetches the full item list.
        // eslint-disable-next-line no-unused-vars
        const { items, ...rest } = present(i)
        return rest
      }),
    })
  } catch (error) {
    console.error('List inspections error:', error)
    res.status(500).json({ error: { message: 'Failed to list inspections' } })
  }
})

/**
 * POST /api/inspections  { listingId, type, agreementId? }
 * Start a draft with the unit-sized default checklist.
 */
router.post('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const { listingId, type, agreementId } = req.body || {}
    if (!INSPECTION_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ error: { message: 'type must be move_in or move_out' } })
    }
    if (!listingId || typeof listingId !== 'string') {
      return res.status(400).json({ error: { message: 'listingId required' } })
    }
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: req.portfolioId },
      select: {
        id: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
      },
    })
    if (!listing) {
      return res.status(404).json({ error: { message: 'Listing not found' } })
    }

    let agreementRef = null
    if (agreementId) {
      const ag = await prisma.agreement.findFirst({
        where: { id: String(agreementId), application: { listingId } },
        select: { id: true },
      })
      if (!ag) {
        return res
          .status(404)
          .json({ error: { message: 'Lease not found on this property' } })
      }
      agreementRef = ag.id
    } else {
      agreementRef = (await relevantAgreement(listingId))?.id || null
    }

    const inspection = await prisma.inspection.create({
      data: {
        type,
        listingId,
        ownerId: req.portfolioId,
        agreementId: agreementRef,
        items: defaultChecklist(listing),
      },
      include: {
        listing: { select: LISTING_SELECT },
        agreement: { select: AGREEMENT_SELECT },
      },
    })
    res.status(201).json({ inspection: present(inspection) })
  } catch (error) {
    console.error('Create inspection error:', error)
    res.status(500).json({ error: { message: 'Failed to create inspection' } })
  }
})

/**
 * GET /api/inspections/:id
 * Owner of the listing or a tenant signer on the lease.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const inspection = await loadInspection(req.params.id)
    if (!inspection) {
      return res
        .status(404)
        .json({ error: { message: 'Inspection not found' } })
    }
    if (!(await canRead(inspection, req.user))) {
      return res.status(403).json({ error: { message: 'Access denied' } })
    }
    res.json({ inspection: present(inspection) })
  } catch (error) {
    console.error('Get inspection error:', error)
    res.status(500).json({ error: { message: 'Failed to load inspection' } })
  }
})

/** Load the owner's draft or answer the request; returns null when answered. */
async function ownedDraft(req, res) {
  const inspection = await loadInspection(req.params.id)
  if (!inspection || inspection.listing.ownerId !== req.portfolioId) {
    res.status(404).json({ error: { message: 'Inspection not found' } })
    return null
  }
  if (inspection.status !== 'draft') {
    res
      .status(400)
      .json({ error: { message: 'A completed report cannot be changed' } })
    return null
  }
  return inspection
}

/** Email every tenant signer on the lease; failures are logged only. */
async function notifyTenants(inspection, owner) {
  if (!inspection.agreementId) return
  try {
    const signers = await prisma.agreementSigner.findMany({
      where: { agreementId: inspection.agreementId, role: 'tenant' },
      select: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    const landlordName = `${owner.firstName} ${owner.lastName}`.trim()
    for (const s of signers) {
      if (!s.user?.email) continue
      await sendInspectionReportEmail({
        tenant: s.user,
        landlordName,
        listing: inspection.listing,
        inspection,
      })
    }
  } catch (err) {
    console.error('Inspection report email failed:', err.message)
  }
}

/**
 * PUT /api/inspections/:id  { items?, notes?, conductedAt?, status? }
 * Save a draft, or complete it with status: 'completed'.
 */
router.put('/:id', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const inspection = await ownedDraft(req, res)
    if (!inspection) return

    const { items, notes, conductedAt, status } = req.body || {}
    const data = {}
    if (items !== undefined) {
      const clean = sanitizeItems(items)
      if (!clean) {
        return res
          .status(400)
          .json({ error: { message: 'Invalid inspection items' } })
      }
      data.items = clean
    }
    if (notes !== undefined) {
      if (notes !== null && typeof notes !== 'string') {
        return res.status(400).json({ error: { message: 'Invalid notes' } })
      }
      data.notes = notes ? notes.slice(0, 5000) : null
    }
    if (conductedAt !== undefined) {
      if (conductedAt === null || conductedAt === '') {
        data.conductedAt = null
      } else {
        const d = new Date(conductedAt)
        if (isNaN(d.getTime())) {
          return res
            .status(400)
            .json({ error: { message: 'Invalid conducted date' } })
        }
        data.conductedAt = d
      }
    }
    const completing = status === 'completed'
    if (status !== undefined && status !== 'draft' && !completing) {
      return res.status(400).json({ error: { message: 'Invalid status' } })
    }
    if (completing) {
      const now = new Date()
      data.status = 'completed'
      data.completedAt = now
      const effective =
        'conductedAt' in data ? data.conductedAt : inspection.conductedAt
      if (!effective) data.conductedAt = now
    }

    const updated = await prisma.inspection.update({
      where: { id: inspection.id },
      data,
      include: {
        listing: { select: LISTING_SELECT },
        agreement: { select: AGREEMENT_SELECT },
      },
    })
    res.json({ inspection: present(updated) })

    if (completing) notifyTenants(updated, req.user)
  } catch (error) {
    console.error('Update inspection error:', error)
    res.status(500).json({ error: { message: 'Failed to update inspection' } })
  }
})

/**
 * POST /api/inspections/:id/photos  multipart images[] (max 10)
 * Uploads to Cloudinary and returns the URLs; the client attaches them to
 * an item and saves the draft.
 */
router.post(
  '/:id/photos',
  authenticate,
  requireUserType('owner'),
  upload.array('images', 10),
  async (req, res) => {
    try {
      const inspection = await ownedDraft(req, res)
      if (!inspection) return
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: { message: 'No images provided' } })
      }
      const results = await Promise.all(
        req.files.map((file, index) =>
          uploadToCloudinary(file.buffer, {
            folder: `rentra/inspections/${req.portfolioId}`,
            publicId: `${inspection.id}_${Date.now()}_${index}`,
            transformation: [
              { width: 1600, height: 1600, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          })
        )
      )
      res.status(201).json({
        images: results.map(r => ({ url: r.secure_url })),
      })
    } catch (error) {
      console.error('Inspection photo upload error:', error)
      res.status(500).json({ error: { message: 'Failed to upload photos' } })
    }
  }
)

/**
 * POST /api/inspections/:id/deductions
 * Push a completed move-out report's priced damaged items onto the lease's
 * security deposit. Idempotent: lines whose description already exists are
 * skipped, and adding stops when the deposit held would be exceeded.
 */
router.post(
  '/:id/deductions',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const inspection = await loadInspection(req.params.id)
      if (!inspection || inspection.listing.ownerId !== req.portfolioId) {
        return res
          .status(404)
          .json({ error: { message: 'Inspection not found' } })
      }
      if (inspection.type !== 'move_out' || inspection.status !== 'completed') {
        return res.status(400).json({
          error: {
            message: 'Only a completed move-out report can create deductions',
          },
        })
      }
      if (!inspection.agreementId) {
        return res.status(400).json({
          error: { message: 'This report is not attached to a lease' },
        })
      }

      const agreement = await prisma.agreement.findUnique({
        where: { id: inspection.agreementId },
        select: {
          id: true,
          securityDeposit: true,
          deposit: { include: { deductions: true } },
          application: { select: { ownerId: true } },
        },
      })
      if (!agreement || agreement.application.ownerId !== req.portfolioId) {
        return res.status(404).json({ error: { message: 'Lease not found' } })
      }

      let deposit = agreement.deposit
      if (!deposit) {
        if (!agreement.securityDeposit || agreement.securityDeposit <= 0) {
          return res.status(400).json({
            error: { message: 'This lease holds no security deposit' },
          })
        }
        const state = stateFromLocation(inspection.listing.location)
        ruleForState(state) // validates the fallback exists
        deposit = await prisma.securityDeposit.create({
          data: {
            agreementId: agreement.id,
            ownerId: req.portfolioId,
            amountHeld: agreement.securityDeposit,
            state,
          },
          include: { deductions: true },
        })
      }
      if (deposit.status === 'refunded') {
        return res
          .status(400)
          .json({ error: { message: 'Deposit already refunded' } })
      }

      const existingDescriptions = new Set(
        deposit.deductions.map(d => d.description)
      )
      let running = deposit.deductions.reduce((s, d) => s + d.amount, 0)
      let created = 0
      let skipped = 0
      for (const line of deductionsFromInspection(inspection)) {
        if (existingDescriptions.has(line.description)) {
          skipped += 1
          continue
        }
        if (running + line.amount > deposit.amountHeld) {
          skipped += 1
          continue
        }
        await prisma.depositDeduction.create({
          data: { depositId: deposit.id, ...line },
        })
        existingDescriptions.add(line.description)
        running += line.amount
        created += 1
      }

      res.json({ created, skipped, depositId: deposit.id })
    } catch (error) {
      console.error('Inspection deductions error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to create deductions' } })
    }
  }
)

/**
 * DELETE /api/inspections/:id  (draft only)
 */
router.delete(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const inspection = await ownedDraft(req, res)
      if (!inspection) return
      await prisma.inspection.delete({ where: { id: inspection.id } })
      res.json({ message: 'Inspection deleted' })
    } catch (error) {
      console.error('Delete inspection error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to delete inspection' } })
    }
  }
)

// Multer errors (too many files / too large / bad type)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: { message: error.message } })
  }
  if (error.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: { message: error.message } })
  }
  next(error)
})

export default router
