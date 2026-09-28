import express from 'express'
import PDFDocument from 'pdfkit'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { recordAcceptances } from '../utils/policies.js'
import { sendLeaseSignatureUpdate } from '../utils/email.js'
import { shapeAgreement, signatureState } from '../utils/agreements.js'

/**
 * Household leases. One Agreement per household with an AgreementSigner
 * row per tenant and the landlord; the lease is signed only when every
 * block is signed. Solo leases are the one-tenant case of the same model.
 */
const router = express.Router()

// Shared include: lead application (listing + owner) and every signer.
const agreementInclude = {
  application: {
    include: {
      listing: { select: { title: true, location: true } },
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
  signers: {
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
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

const isParty = (agreement, userId) =>
  agreement.signers.some(s => s.userId === userId) ||
  agreement.application?.owner?.id === userId

/**
 * GET /api/agreements
 * Every lease the authenticated user is a signer on.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const agreements = await prisma.agreement.findMany({
      where: {
        OR: [
          { signers: { some: { userId } } },
          { application: { ownerId: userId } },
        ],
      },
      include: agreementInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ agreements: agreements.map(a => shapeAgreement(a, userId)) })
  } catch (error) {
    console.error('List agreements error:', error)
    res.status(500).json({ error: { message: 'Failed to list agreements' } })
  }
})

/**
 * GET /api/agreements/:id — one lease (signers only).
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
    if (!isParty(agreement, userId)) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to view this agreement' } })
    }
    res.json({ agreement: shapeAgreement(agreement, userId) })
  } catch (error) {
    console.error('Get agreement error:', error)
    res.status(500).json({ error: { message: 'Failed to get agreement' } })
  }
})

/**
 * GET /api/agreements/:id/pdf
 * The lease as a PDF with one signature block per party, generated from the
 * stored terms and signature record.
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
    if (!isParty(agreement, userId)) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to view this agreement' } })
    }

    const shaped = shapeAgreement(agreement, userId)
    const fmt = d =>
      new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
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

    doc.fillColor(brand).fontSize(22).font('Helvetica-Bold').text('Rentra')
    doc.fillColor('black').fontSize(15).text('Residential Lease Agreement')
    doc
      .fillColor(gray)
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Agreement ${agreement.id} · Created ${fmt(agreement.createdAt)}` +
          (shaped.isGroupLease
            ? ` · Joint lease, ${shaped.tenants.length} tenants`
            : '')
      )
    line()

    sectionTitle('Property')
    doc.text(shaped.property.description)
    doc.fillColor(gray).text(shaped.property.address)
    doc.fillColor('black')

    sectionTitle('Parties')
    shaped.tenants.forEach((t, i) => {
      row(
        shaped.tenants.length > 1 ? `Tenant ${i + 1}` : 'Tenant',
        `${t.name}${t.email ? ` (${t.email})` : ''}`
      )
    })
    row(
      'Landlord',
      `${shaped.landlord.name}${shaped.landlord.email ? ` (${shaped.landlord.email})` : ''}`
    )
    if (shaped.isGroupLease) {
      doc
        .moveDown(0.3)
        .fillColor(gray)
        .text(
          'All tenants are jointly and severally responsible for the obligations of this lease.'
        )
        .fillColor('black')
    }

    sectionTitle('Lease Terms')
    row('Monthly rent', `$${shaped.terms.monthlyRent.toLocaleString()}`)
    row('Security deposit', `$${shaped.terms.securityDeposit.toLocaleString()}`)
    row('Lease start', fmt(shaped.terms.startDate))
    row('Lease end', fmt(shaped.terms.endDate))

    sectionTitle('Additional Terms')
    row('Utilities', shaped.terms.utilities)
    row('Pet policy', shaped.terms.petPolicy)
    for (const [key, value] of Object.entries(agreement.terms || {})) {
      if (['utilities', 'petPolicy'].includes(key)) continue
      if (typeof value !== 'string' || !value) continue
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
      row(label, value)
    }

    sectionTitle('Signatures')
    for (const s of shaped.signers) {
      doc.font('Helvetica-Bold').text(s.name)
      doc
        .font('Helvetica')
        .fillColor(gray)
        .text(s.role === 'landlord' ? 'Landlord' : 'Tenant')
      if (s.signed) {
        doc
          .fillColor('#15803d')
          .text(
            `Signed electronically via Rentra${s.signatureName ? ` as "${s.signatureName}"` : ''}${s.signedAt ? ` on ${fmtDateTime(s.signedAt)}` : ''}`
          )
      } else {
        doc.fillColor('#b45309').text('Not yet signed')
      }
      doc.fillColor('black').moveDown(0.5)
    }

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
 * Sign the viewer's own block. body: { signatureName, esignConsent }
 */
router.post('/:id/sign', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: agreementInclude,
    })
    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }

    const mine = agreement.signers.find(s => s.userId === userId)
    if (!mine) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to sign this agreement' } })
    }
    if (mine.signed) {
      return res
        .status(400)
        .json({ error: { message: 'You have already signed this lease' } })
    }

    // E-SIGN / UETA: affirmative consent plus the typed legal name, both
    // kept with the signature.
    const { esignConsent, signatureName } = req.body || {}
    const typedName = String(signatureName || '')
      .trim()
      .slice(0, 120)
    if (esignConsent !== true || !typedName) {
      return res.status(400).json({
        error: {
          message:
            'Type your full legal name and consent to electronic signatures to sign.',
        },
      })
    }

    const now = new Date()
    const signers = agreement.signers.map(s =>
      s.id === mine.id
        ? { ...s, signed: true, signedAt: now, signatureName: typedName }
        : s
    )
    const state = signatureState(signers)

    await prisma.$transaction([
      prisma.agreementSigner.update({
        where: { id: mine.id },
        data: { signed: true, signedAt: now, signatureName: typedName },
      }),
      // Mirrors for dashboards that still read the two booleans.
      prisma.agreement.update({
        where: { id: agreement.id },
        data: {
          tenantSigned: state.tenantsSigned,
          ...(state.tenantsSigned && !agreement.tenantSigned
            ? { tenantSignedAt: now }
            : {}),
          landlordSigned: state.landlordSigned,
          ...(state.landlordSigned && !agreement.landlordSigned
            ? { landlordSignedAt: now }
            : {}),
        },
      }),
    ])
    await recordAcceptances(prisma, {
      userId,
      policies: ['esign'],
      req,
      context: {
        agreementId: agreement.id,
        role: mine.role,
        signatureName: typedName,
      },
    })

    // Tell the other parties. Best-effort.
    const signerName = `${req.user.firstName} ${req.user.lastName}`
    const listingTitle = agreement.application?.listing?.title || 'your rental'
    const pendingNames = state.pending.map(
      s => `${s.user.firstName} ${s.user.lastName}`
    )
    Promise.all(
      signers
        .filter(s => s.userId !== userId && s.user?.email)
        .map(s =>
          sendLeaseSignatureUpdate({
            recipient: s.user,
            signerName,
            listingTitle,
            agreementId: agreement.id,
            fullySigned: state.allSigned,
            pendingNames,
          })
        )
    ).catch(err => console.error('Lease signature email error:', err))

    const updated = await prisma.agreement.findUnique({
      where: { id: agreement.id },
      include: agreementInclude,
    })
    res.json({ agreement: shapeAgreement(updated, userId) })
  } catch (error) {
    console.error('Sign agreement error:', error)
    res.status(500).json({ error: { message: 'Failed to sign agreement' } })
  }
})

export default router
