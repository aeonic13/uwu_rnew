import express from 'express'
import PDFDocument from 'pdfkit'
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
 * GET /api/agreements/:id/pdf
 * Download the agreement as a PDF (tenant or landlord on the application
 * only). Generated on the fly from the stored terms and signature record.
 */
router.get('/:id/pdf', authenticate, async (req, res) => {
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

    const shaped = shape(agreement, userId)
    const fmt = d =>
      new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    const fmtDateTime = d =>
      new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rentra-lease-${agreement.id}.pdf"`
    )

    const doc = new PDFDocument({ size: 'LETTER', margin: 54 })
    doc.pipe(res)

    const brand = '#fc6a03'
    const gray = '#555555'
    const line = () => {
      doc
        .moveDown(0.5)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(54, doc.y)
        .lineTo(558, doc.y)
        .stroke()
      doc.moveDown(0.5)
    }
    const sectionTitle = title => {
      doc.moveDown(0.6)
      doc.fillColor(brand).fontSize(12).font('Helvetica-Bold').text(title)
      doc.moveDown(0.3)
      doc.fillColor('black').font('Helvetica').fontSize(10)
    }
    const row = (label, value) => {
      doc
        .fillColor(gray)
        .text(`${label}: `, { continued: true })
        .fillColor('black')
        .text(String(value))
    }

    // Header
    doc.fillColor(brand).fontSize(22).font('Helvetica-Bold').text('Rentra')
    doc.fillColor('black').fontSize(15).text('Residential Lease Agreement')
    doc
      .fillColor(gray)
      .fontSize(9)
      .font('Helvetica')
      .text(`Agreement ${agreement.id} · Created ${fmt(agreement.createdAt)}`)
    line()

    sectionTitle('Property')
    doc.text(shaped.property.description)
    doc.fillColor(gray).text(shaped.property.address)
    doc.fillColor('black')

    sectionTitle('Parties')
    row('Tenant', `${shaped.tenant.name} (${shaped.tenant.email})`)
    row('Landlord', `${shaped.landlord.name} (${shaped.landlord.email})`)

    sectionTitle('Lease Terms')
    row('Monthly rent', `$${shaped.terms.monthlyRent.toLocaleString()}`)
    row('Security deposit', `$${shaped.terms.securityDeposit.toLocaleString()}`)
    row('Lease start', fmt(shaped.terms.startDate))
    row('Lease end', fmt(shaped.terms.endDate))

    sectionTitle('Additional Terms')
    row('Utilities', shaped.terms.utilities)
    row('Pet policy', shaped.terms.petPolicy)
    // Any extra string terms stored on the agreement (e.g. late fees).
    for (const [key, value] of Object.entries(agreement.terms || {})) {
      if (['utilities', 'petPolicy'].includes(key)) continue
      if (typeof value !== 'string' || !value) continue
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
      row(label, value)
    }

    sectionTitle('Signatures')
    const signatureBlock = (roleLabel, name, signed, signedAt) => {
      doc.font('Helvetica-Bold').text(name)
      doc.font('Helvetica').fillColor(gray).text(roleLabel)
      if (signed) {
        doc
          .fillColor('#15803d')
          .text(
            `Signed electronically via Rentra${signedAt ? ` on ${fmtDateTime(signedAt)}` : ''}`
          )
      } else {
        doc.fillColor('#b45309').text('Not yet signed')
      }
      doc.fillColor('black').moveDown(0.5)
    }
    signatureBlock(
      'Tenant',
      shaped.tenant.name,
      agreement.tenantSigned,
      agreement.tenantSignedAt
    )
    signatureBlock(
      'Landlord',
      shaped.landlord.name,
      agreement.landlordSigned,
      agreement.landlordSignedAt
    )

    line()
    doc
      .fillColor(gray)
      .fontSize(8)
      .text(
        `This document is a record of the lease agreement executed on Rentra (myrentra.com). ` +
          `Generated ${fmtDateTime(new Date())}. Signature timestamps reflect when each party ` +
          `confirmed the agreement in their Rentra account.`
      )

    doc.end()
  } catch (error) {
    console.error('Agreement PDF error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Failed to generate PDF' } })
    } else {
      res.end()
    }
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
