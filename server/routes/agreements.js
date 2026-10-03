import express from 'express'
import PDFDocument from 'pdfkit'
import { Readable } from 'node:stream'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { recordAcceptances } from '../utils/policies.js'
import { sendLeaseSignatureUpdate } from '../utils/email.js'
import {
  shapeAgreement,
  signatureState,
  signedLeaseFilename,
} from '../utils/agreements.js'

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
  // Imported leases: the invite behind each tenant block that has not been
  // accepted yet, so the block can show a name before it has a user.
  members: {
    select: {
      id: true,
      tenantInvite: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
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
 * Stream the landlord's uploaded copy of an imported lease to a party on
 * it. The file lives in Cloudinary under the landlord's documents; parties
 * fetch it through here so the link is auth-gated and never a raw asset
 * URL. Returns false (nothing written) when the upload cannot be read, so
 * the caller can fall back to the generated summary.
 */
async function streamSignedLease(agreement, res) {
  let upstream
  try {
    upstream = await fetch(agreement.documentUrl)
  } catch (err) {
    console.error('Signed lease fetch error:', err)
    return false
  }
  if (!upstream.ok || !upstream.body) return false
  const contentType =
    upstream.headers.get('content-type') || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${signedLeaseFilename(agreement, contentType)}"`
  )
  const length = upstream.headers.get('content-length')
  if (length) res.setHeader('Content-Length', length)
  await new Promise((resolve, reject) => {
    Readable.fromWeb(upstream.body)
      .on('error', reject)
      .pipe(res)
      .on('finish', resolve)
      .on('error', reject)
  })
  return true
}

/**
 * GET /api/agreements/:id/pdf
 * The lease as a PDF with one signature block per party, generated from the
 * stored terms and signature record. For an imported lease with the signed
 * copy uploaded, that file is served instead; `?summary=1` still returns
 * Rentra's generated summary of the recorded terms and confirmations.
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

    if (
      agreement.source === 'imported' &&
      agreement.documentUrl &&
      req.query.summary !== '1'
    ) {
      const served = await streamSignedLease(agreement, res)
      if (served) return
      if (res.headersSent) return res.end()
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

    const imported = shaped.imported
    doc.fillColor(brand).fontSize(22).font('Helvetica-Bold').text('Rentra')
    doc
      .fillColor('black')
      .fontSize(15)
      .text(
        imported
          ? 'Lease Summary (imported lease)'
          : 'Residential Lease Agreement'
      )
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
    if (imported) {
      doc
        .moveDown(0.4)
        .fillColor(gray)
        .text(
          'This lease was signed outside Rentra. This document records the terms the landlord entered and each tenant confirmed; the signed lease itself is the governing document.'
        )
    }
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
    row(
      'Lease end',
      shaped.monthToMonth ? 'Month-to-month' : fmt(shaped.terms.endDate)
    )

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

    sectionTitle(imported ? 'Confirmations' : 'Signatures')
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
            imported
              ? `${s.role === 'landlord' ? 'Attested' : 'Confirmed'} on Rentra${s.signatureName ? ` as "${s.signatureName}"` : ''}${s.signedAt ? ` on ${fmtDateTime(s.signedAt)}` : ''}`
              : `Signed electronically via Rentra${s.signatureName ? ` as "${s.signatureName}"` : ''}${s.signedAt ? ` on ${fmtDateTime(s.signedAt)}` : ''}`
          )
      } else {
        doc
          .fillColor('#b45309')
          .text(imported ? 'Not yet confirmed' : 'Not yet signed')
      }
      doc.fillColor('black').moveDown(0.5)
    }

    line()
    doc
      .fillColor(gray)
      .fontSize(8)
      .text(
        imported
          ? `This document is Rentra's record of a lease executed outside Rentra (myrentra.com). ` +
              `Generated ${fmtDateTime(new Date())}. Timestamps reflect when the landlord attested to ` +
              `the terms and when each tenant confirmed them in their Rentra account. It is not an electronic signature of the lease.`
          : `This document is a record of the lease agreement executed on Rentra (myrentra.com). ` +
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
    if (agreement.source === 'imported') {
      // Imported leases were signed off Rentra; tenants confirm the terms
      // through their invitation (routes/tenantInvites.js accept).
      return res.status(400).json({
        error: {
          message:
            'This lease was signed outside Rentra. Confirm it from the invitation your landlord sent.',
        },
      })
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
    const pendingNames = state.pending.map(s =>
      s.user ? `${s.user.firstName} ${s.user.lastName}` : 'an invited tenant'
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
