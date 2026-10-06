import express from 'express'
import PDFDocument from 'pdfkit'
import { Readable } from 'node:stream'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { recordAcceptances } from '../utils/policies.js'
import {
  sendLeaseSignatureUpdate,
  sendApplicationStatusEmail,
  sendLeaseEndedEmail,
  sendLeaseRenewalOfferEmail,
  sendLeaseAmendmentEmail,
} from '../utils/email.js'
import { documentUpload, uploadToCloudinary } from '../utils/cloudinary.js'
import { STATE_DEPOSIT_RULES, ruleForState } from './deposits.js'
import {
  validateLeaseTermsInput,
  amendmentPlan,
  scaleShares,
  END_REASONS,
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
  renewal: { select: { id: true } },
  amendment: { select: { id: true } },
  application: {
    include: {
      listing: { select: { id: true, title: true, location: true } },
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
          { application: { ownerId: req.portfolioId } },
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
    if (
      !isParty(agreement, userId) &&
      !isLandlordOf(agreement, req.portfolioId)
    ) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to view this agreement' } })
    }
    // A team member sees the landlord's side; only the person on the
    // signature block can sign.
    const viewerId = isParty(agreement, userId) ? userId : req.portfolioId
    const shaped = shapeAgreement(agreement, viewerId)
    shaped.canSign = viewerId === userId
    shaped.actingForOwner = viewerId !== userId
    res.json({ agreement: shaped })
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
    if (
      !isParty(agreement, userId) &&
      !isLandlordOf(agreement, req.portfolioId)
    ) {
      return res
        .status(403)
        .json({ error: { message: 'Not authorized to view this agreement' } })
    }

    if (agreement.documentUrl && req.query.summary !== '1') {
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
    if (agreement.lateFeeAmount) {
      row(
        'Late fee rule',
        `$${agreement.lateFeeAmount.toLocaleString()} once rent is ${agreement.lateFeeGraceDays || 0} day${agreement.lateFeeGraceDays === 1 ? '' : 's'} past due`
      )
    }
    for (const [key, value] of Object.entries(agreement.terms || {})) {
      if (['utilities', 'petPolicy', 'additionalClauses'].includes(key))
        continue
      if (typeof value !== 'string' || !value) continue
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
      row(label, value)
    }

    if (shaped.terms.additionalClauses.length) {
      sectionTitle('Additional Clauses')
      shaped.terms.additionalClauses.forEach((clause, i) => {
        doc
          .font('Helvetica')
          .fillColor('black')
          .text(`${i + 1}. ${clause}`)
        doc.moveDown(0.3)
      })
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

// ─── Lease lifecycle (landlord) ─────────────────────────────────────────

const isLandlordOf = (agreement, userId) =>
  agreement.application?.ownerId === userId

/** Two-letter state from a listing location string, CA when unsure. */
function stateFromLocation(location) {
  const match = (location || '').match(/\b([A-Z]{2})\b(?:\s+\d{5})?\s*$/)
  return match && STATE_DEPOSIT_RULES[match[1]] ? match[1] : 'CA'
}

/**
 * PUT /api/agreements/:id/terms
 * Landlord edits an unsigned Rentra lease before anyone signs: rent,
 * deposit, dates, the written terms (utilities, pets, late fee text,
 * parking, extra clauses) and the structured late-fee rule.
 */
router.put('/:id/terms', authenticate, async (req, res) => {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: agreementInclude,
    })
    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }
    if (!isLandlordOf(agreement, req.portfolioId)) {
      return res
        .status(403)
        .json({ error: { message: 'Only the landlord can edit the terms' } })
    }
    if (agreement.source === 'imported') {
      return res.status(400).json({
        error: { message: 'An imported lease keeps the terms as signed.' },
      })
    }
    if (agreement.signers.some(s => s.signed)) {
      return res.status(400).json({
        error: {
          message:
            'Terms are locked once a signature is on the lease. Ask the signers to re-sign a fresh lease instead.',
        },
      })
    }

    const checked = validateLeaseTermsInput(req.body)
    if (!checked.ok) {
      return res.status(400).json({
        error: { message: checked.errors[0], details: checked.errors },
      })
    }
    const { terms, ...fields } = checked.value
    const updated = await prisma.agreement.update({
      where: { id: agreement.id },
      data: {
        ...fields,
        ...(terms && { terms: { ...(agreement.terms || {}), ...terms } }),
      },
      include: agreementInclude,
    })
    res.json({ agreement: shapeAgreement(updated, req.user.id) })
  } catch (error) {
    console.error('Update lease terms error:', error)
    res.status(500).json({ error: { message: 'Failed to update the terms' } })
  }
})

/**
 * POST /api/agreements/:id/document
 * Landlord uploads their own lease document for an unsigned Rentra lease.
 * Parties then e-sign against that document; GET :id/pdf serves it.
 */
router.post(
  '/:id/document',
  authenticate,
  documentUpload.single('file'),
  async (req, res) => {
    try {
      const agreement = await prisma.agreement.findUnique({
        where: { id: req.params.id },
        include: agreementInclude,
      })
      if (!agreement) {
        return res
          .status(404)
          .json({ error: { message: 'Agreement not found' } })
      }
      if (!isLandlordOf(agreement, req.portfolioId)) {
        return res.status(403).json({
          error: { message: 'Only the landlord can attach a lease document' },
        })
      }
      if (agreement.signers.some(s => s.signed)) {
        return res.status(400).json({
          error: { message: 'The document is locked once anyone has signed.' },
        })
      }
      if (!req.file) {
        return res.status(400).json({ error: { message: 'No file provided' } })
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `rentra/leases/${req.user.id}`,
        publicId: `lease_${agreement.id}_${Date.now()}`,
        resourceType: 'auto',
      })
      const updated = await prisma.agreement.update({
        where: { id: agreement.id },
        data: { documentUrl: result.secure_url },
        include: agreementInclude,
      })
      res.json({ agreement: shapeAgreement(updated, req.user.id) })
    } catch (error) {
      console.error('Attach lease document error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to attach the lease document' } })
    }
  }
)

/**
 * POST /api/agreements/:id/end
 * Landlord gives notice on a signed lease. body: { moveOutDate, reason,
 * relist }. The lease now ends on moveOutDate; the deposit's refund clock
 * starts from that date (lazily creating the deposit record if needed);
 * tenants are emailed. `relist` switches the listing back on right away.
 */
router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: {
        ...agreementInclude,
        deposit: { select: { id: true, status: true, state: true } },
      },
    })
    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }
    if (!isLandlordOf(agreement, req.portfolioId)) {
      return res
        .status(403)
        .json({ error: { message: 'Only the landlord can end a lease' } })
    }
    if (agreement.endedAt) {
      return res.status(400).json({
        error: { message: 'Notice has already been given on this lease' },
      })
    }
    const state = signatureState(agreement.signers)
    if (!state.allSigned) {
      return res.status(400).json({
        error: {
          message:
            'This lease is not in force yet. Decline or let the signatures lapse instead.',
        },
      })
    }

    const moveOut = new Date(req.body?.moveOutDate)
    if (!req.body?.moveOutDate || Number.isNaN(moveOut.getTime())) {
      return res
        .status(400)
        .json({ error: { message: 'A valid move-out date is required' } })
    }
    if (moveOut < new Date(agreement.startDate)) {
      return res.status(400).json({
        error: {
          message: 'The move-out date cannot be before the lease started',
        },
      })
    }
    const reason = END_REASONS.includes(req.body?.reason)
      ? req.body.reason
      : 'move_out'
    const relist = Boolean(req.body?.relist)
    const now = new Date()
    const listingId = agreement.application?.listingId
    const listingLocation = agreement.application?.listing?.location

    const depositState =
      agreement.deposit?.state || stateFromLocation(listingLocation)
    const refundDeadline = new Date(moveOut)
    refundDeadline.setDate(
      refundDeadline.getDate() + ruleForState(depositState).days
    )

    await prisma.$transaction(async tx => {
      await tx.agreement.update({
        where: { id: agreement.id },
        data: { endedAt: now, endReason: reason, endDate: moveOut },
      })
      if (agreement.securityDeposit > 0) {
        if (agreement.deposit) {
          if (agreement.deposit.status !== 'refunded') {
            await tx.securityDeposit.update({
              where: { id: agreement.deposit.id },
              data: {
                moveOutDate: moveOut,
                refundDeadline,
                status: 'pending_refund',
              },
            })
          }
        } else {
          await tx.securityDeposit.create({
            data: {
              agreementId: agreement.id,
              ownerId: req.portfolioId,
              amountHeld: agreement.securityDeposit,
              state: depositState,
              moveOutDate: moveOut,
              refundDeadline,
              status: 'pending_refund',
            },
          })
        }
      }
      if (relist && listingId) {
        await tx.listing.update({
          where: { id: listingId },
          data: { active: true },
        })
      }
    })

    const updated = await prisma.agreement.findUnique({
      where: { id: agreement.id },
      include: agreementInclude,
    })
    res.json({ agreement: shapeAgreement(updated, req.user.id) })

    // Tell every tenant. Best-effort.
    const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
    const listingTitle = agreement.application?.listing?.title || 'your rental'
    Promise.all(
      agreement.signers
        .filter(s => s.role === 'tenant' && s.user?.email)
        .map(s =>
          sendLeaseEndedEmail({
            tenant: s.user,
            landlordName,
            listingTitle,
            moveOutDate: moveOut,
            refundDeadline:
              agreement.securityDeposit > 0 ? refundDeadline : null,
            returnWindowDays: ruleForState(depositState).days,
          })
        )
    ).catch(err => console.error('Lease ended email error:', err))
  } catch (error) {
    console.error('End lease error:', error)
    res.status(500).json({ error: { message: 'Failed to end the lease' } })
  }
})

/**
 * POST /api/agreements/:id/renew
 * Landlord drafts a renewal of a signed lease for the same household:
 * one member row per tenant (source renewal), a new Agreement pointing back
 * through renewsId, the rent split carried over at the new rent, and a
 * signature block per tenant plus the landlord. Tenants are emailed to
 * review and sign. body: { startDate, endDate | monthToMonth, monthlyRent,
 * securityDeposit?, terms?, lateFeeAmount?, lateFeeGraceDays? }
 */
router.post('/:id/renew', authenticate, async (req, res) => {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: {
        ...agreementInclude,
        renewal: { select: { id: true } },
        rentSplit: { include: { shares: true } },
        members: {
          select: { id: true, applicantId: true, groupId: true },
        },
      },
    })
    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }
    if (!isLandlordOf(agreement, req.portfolioId)) {
      return res
        .status(403)
        .json({ error: { message: 'Only the landlord can renew a lease' } })
    }
    if (agreement.renewal) {
      return res.status(400).json({
        error: {
          message: 'A renewal already exists for this lease.',
          renewalId: agreement.renewal.id,
        },
      })
    }
    if (!signatureState(agreement.signers).allSigned) {
      return res.status(400).json({
        error: { message: 'Only a fully signed lease can be renewed.' },
      })
    }
    const tenants = agreement.members.filter(m => m.applicantId)
    if (!tenants.length) {
      return res.status(400).json({
        error: { message: 'No tenants are attached to this lease yet.' },
      })
    }

    const checked = validateLeaseTermsInput(req.body, { requireAll: true })
    if (!checked.ok) {
      return res.status(400).json({
        error: { message: checked.errors[0], details: checked.errors },
      })
    }
    const v = checked.value
    if (v.startDate <= new Date(agreement.startDate)) {
      return res.status(400).json({
        error: {
          message: 'The renewal must start after the current lease began.',
        },
      })
    }
    const listingId = agreement.application.listingId
    const terms = { ...(agreement.terms || {}), ...(v.terms || {}) }
    delete terms.importedLease
    delete terms.attestedBy
    delete terms.attestedAt

    const created = await prisma.$transaction(async tx => {
      const memberRows = []
      for (const m of tenants) {
        memberRows.push(
          await tx.application.create({
            data: {
              listingId,
              applicantId: m.applicantId,
              ownerId: req.portfolioId,
              groupId: agreement.groupId || null,
              status: 'approved',
              source: 'renewal',
              startDate: v.startDate,
              endDate: v.endDate,
              message: null,
            },
            select: { id: true, applicantId: true },
          })
        )
      }
      const renewal = await tx.agreement.create({
        data: {
          applicationId: memberRows[0].id,
          groupId: agreement.groupId || null,
          source: 'rentra',
          renewsId: agreement.id,
          monthlyRent: v.monthlyRent,
          securityDeposit: v.securityDeposit ?? agreement.securityDeposit,
          startDate: v.startDate,
          endDate: v.endDate,
          monthToMonth: Boolean(v.monthToMonth),
          terms,
          lateFeeAmount:
            v.lateFeeAmount !== undefined
              ? v.lateFeeAmount
              : agreement.lateFeeAmount,
          lateFeeGraceDays:
            v.lateFeeGraceDays !== undefined
              ? v.lateFeeGraceDays
              : agreement.lateFeeGraceDays,
          signers: {
            create: [
              ...memberRows.map(m => ({
                role: 'tenant',
                userId: m.applicantId,
                applicationId: m.id,
              })),
              { role: 'landlord', userId: req.portfolioId },
            ],
          },
        },
        select: { id: true },
      })
      await tx.application.updateMany({
        where: { id: { in: memberRows.map(m => m.id) } },
        data: { agreementId: renewal.id },
      })
      if (agreement.rentSplit) {
        const shares = scaleShares(
          agreement.rentSplit.shares.map(s => ({
            name: s.name,
            userId: s.userId,
            amount: s.amount,
          })),
          agreement.rentSplit.total,
          v.monthlyRent
        )
        await tx.rentSplit.create({
          data: {
            agreementId: renewal.id,
            createdById: agreement.rentSplit.createdById,
            total: v.monthlyRent,
            splitMode: agreement.rentSplit.splitMode,
            shares: { create: shares },
          },
        })
      }
      return renewal
    })

    const full = await prisma.agreement.findUnique({
      where: { id: created.id },
      include: agreementInclude,
    })
    res.status(201).json({ agreement: shapeAgreement(full, req.user.id) })

    const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
    const listingTitle = agreement.application?.listing?.title || 'your rental'
    Promise.all(
      full.signers
        .filter(s => s.role === 'tenant' && s.user?.email)
        .map(s =>
          sendLeaseRenewalOfferEmail({
            tenant: s.user,
            landlordName,
            listingTitle,
            agreementId: full.id,
            startDate: full.startDate,
            endDate: full.endDate,
            monthToMonth: full.monthToMonth,
            monthlyRent: full.monthlyRent,
          })
        )
    ).catch(err => console.error('Renewal offer email error:', err))
  } catch (error) {
    console.error('Renew lease error:', error)
    res.status(500).json({ error: { message: 'Failed to create the renewal' } })
  }
})

/**
 * POST /api/agreements/:id/amend
 * Landlord amends a signed lease mid-term: rent, end date, written terms,
 * the late-fee rule, and optionally more tenants (existing Rentra tenant
 * accounts by email). A replacement Agreement is drafted with amendsId
 * pointing back here; everyone signs; on the last signature the current
 * lease ends the day before the effective date and its deposit, split and
 * autopays move to the amendment (applyAmendment, in the sign route).
 * body: { effectiveDate, monthlyRent?, endDate?, monthToMonth?,
 *         securityDeposit?, terms?, lateFeeAmount?, lateFeeGraceDays?,
 *         addTenantEmails?: [], note? }
 */
router.post('/:id/amend', authenticate, async (req, res) => {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: req.params.id },
      include: {
        ...agreementInclude,
        amendment: { select: { id: true } },
        rentSplit: { include: { shares: true } },
        members: { select: { id: true, applicantId: true } },
      },
    })
    if (!agreement) {
      return res.status(404).json({ error: { message: 'Agreement not found' } })
    }
    if (!isLandlordOf(agreement, req.portfolioId)) {
      return res
        .status(403)
        .json({ error: { message: 'Only the landlord can amend a lease' } })
    }
    if (agreement.amendment) {
      return res.status(400).json({
        error: {
          message: 'An amendment is already awaiting signatures.',
          amendmentId: agreement.amendment.id,
        },
      })
    }
    if (agreement.endedAt) {
      return res.status(400).json({
        error: {
          message: 'Notice has been given on this lease; it cannot be amended.',
        },
      })
    }
    if (!signatureState(agreement.signers).allSigned) {
      return res.status(400).json({
        error: { message: 'Only a fully signed lease can be amended.' },
      })
    }

    const plan = amendmentPlan(agreement, req.body, new Date())
    if (!plan.ok) {
      return res
        .status(400)
        .json({ error: { message: plan.errors[0], details: plan.errors } })
    }
    const v = plan.value

    const existing = agreement.members.filter(m => m.applicantId)
    const existingIds = new Set(existing.map(m => m.applicantId))
    const added = []
    const wanted = Array.isArray(req.body?.addTenantEmails)
      ? [
          ...new Set(
            req.body.addTenantEmails
              .map(e =>
                String(e || '')
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          ),
        ]
      : []
    for (const email of wanted) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          userType: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      })
      if (!user || user.userType !== 'student') {
        return res.status(400).json({
          error: {
            message: `${email} does not have a tenant account on Rentra yet. Ask them to sign up first.`,
          },
        })
      }
      if (!existingIds.has(user.id)) added.push(user)
    }
    const tenantIds = [...existingIds, ...added.map(u => u.id)]
    const listingId = agreement.application.listingId

    const created = await prisma.$transaction(async tx => {
      const memberRows = []
      for (const applicantId of tenantIds) {
        memberRows.push(
          await tx.application.create({
            data: {
              listingId,
              applicantId,
              ownerId: req.portfolioId,
              groupId: agreement.groupId || null,
              status: 'approved',
              source: 'amendment',
              startDate: v.startDate,
              endDate: v.endDate,
              message: null,
            },
            select: { id: true, applicantId: true },
          })
        )
      }
      const amendment = await tx.agreement.create({
        data: {
          applicationId: memberRows[0].id,
          groupId: agreement.groupId || null,
          source: 'rentra',
          amendsId: agreement.id,
          amendmentNote: v.note,
          monthlyRent: v.monthlyRent,
          securityDeposit: v.securityDeposit,
          startDate: v.startDate,
          endDate: v.endDate,
          monthToMonth: v.monthToMonth,
          terms: v.terms,
          lateFeeAmount: v.lateFeeAmount,
          lateFeeGraceDays: v.lateFeeGraceDays,
          signers: {
            create: [
              ...memberRows.map(m => ({
                role: 'tenant',
                userId: m.applicantId,
                applicationId: m.id,
              })),
              { role: 'landlord', userId: req.portfolioId },
            ],
          },
        },
        select: { id: true },
      })
      await tx.application.updateMany({
        where: { id: { in: memberRows.map(m => m.id) } },
        data: { agreementId: amendment.id },
      })
      // Household split: scale the existing shares when the household is
      // unchanged; with new tenants, start again from an equal split.
      if (agreement.rentSplit || added.length) {
        const shares = added.length
          ? memberRows.map((m, i) => {
              const per = Math.floor(v.monthlyRent / memberRows.length)
              const amount =
                i === memberRows.length - 1
                  ? v.monthlyRent - per * (memberRows.length - 1)
                  : per
              const u = added.find(a => a.id === m.applicantId)
              const s = agreement.signers.find(x => x.userId === m.applicantId)
              const name = u
                ? `${u.firstName} ${u.lastName}`
                : s?.user
                  ? `${s.user.firstName} ${s.user.lastName}`
                  : 'Tenant'
              return { userId: m.applicantId, name, amount }
            })
          : scaleShares(
              agreement.rentSplit.shares.map(s => ({
                name: s.name,
                userId: s.userId,
                amount: s.amount,
              })),
              agreement.rentSplit.total,
              v.monthlyRent
            )
        await tx.rentSplit.create({
          data: {
            agreementId: amendment.id,
            createdById: agreement.rentSplit?.createdById || req.user.id,
            total: v.monthlyRent,
            splitMode: added.length ? 'equal' : agreement.rentSplit.splitMode,
            shares: { create: shares },
          },
        })
      }
      return amendment
    })

    const full = await prisma.agreement.findUnique({
      where: { id: created.id },
      include: agreementInclude,
    })
    res.status(201).json({ agreement: shapeAgreement(full, req.user.id) })

    const landlordName = `${req.user.firstName} ${req.user.lastName}`.trim()
    const listingTitle = agreement.application?.listing?.title || 'your rental'
    Promise.all(
      full.signers
        .filter(s => s.role === 'tenant' && s.user?.email)
        .map(s =>
          sendLeaseAmendmentEmail({
            tenant: s.user,
            landlordName,
            listingTitle,
            agreementId: full.id,
            effectiveDate: full.startDate,
            monthlyRent: full.monthlyRent,
            note: full.amendmentNote,
          })
        )
    ).catch(err => console.error('Amendment email error:', err))
  } catch (error) {
    console.error('Amend lease error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to create the amendment' } })
  }
})

/**
 * The amendment is fully signed: the lease it amends ends the day before
 * the effective date, and its deposit, household split (if the amendment
 * has none) and autopays carry over so nothing about the tenancy resets.
 */
async function applyAmendment(amendment) {
  const oldId = amendment.amendsId
  if (!oldId) return
  const old = await prisma.agreement.findUnique({
    where: { id: oldId },
    include: {
      deposit: { select: { id: true } },
      autopays: true,
      rentSplit: {
        select: { shares: { select: { userId: true, amount: true } } },
      },
    },
  })
  if (!old) return
  const dayBefore = new Date(amendment.startDate)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)
  const now = new Date()
  const newShares = await prisma.rentSplitShare.findMany({
    where: { split: { agreementId: amendment.id } },
    select: { userId: true, amount: true },
  })
  const tenantCount = await prisma.agreementSigner.count({
    where: { agreementId: amendment.id, role: 'tenant' },
  })
  const shareFor = userId => {
    const s = newShares.find(x => x.userId === userId)
    return s
      ? Math.round(s.amount)
      : Math.round(amendment.monthlyRent / Math.max(1, tenantCount))
  }

  await prisma.$transaction(async tx => {
    await tx.agreement.update({
      where: { id: old.id },
      data: { endedAt: now, endReason: 'amended', endDate: dayBefore },
    })
    if (old.deposit) {
      await tx.securityDeposit.update({
        where: { id: old.deposit.id },
        data: { agreementId: amendment.id },
      })
    }
    for (const ap of old.autopays) {
      await tx.autopaySchedule.upsert({
        where: {
          userId_agreementId: { userId: ap.userId, agreementId: amendment.id },
        },
        update: {},
        create: {
          userId: ap.userId,
          agreementId: amendment.id,
          amount: shareFor(ap.userId),
          dayOfMonth: ap.dayOfMonth,
          paymentMethod: ap.paymentMethod,
          status: ap.status,
          nextRunAt: ap.nextRunAt,
        },
      })
    }
  })
}

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

    // The unit is taken once everyone has signed: stop taking applications
    // and let the other applicants move on.
    if (state.allSigned) {
      closeListingForLease(agreement).catch(err =>
        console.error('Close listing after lease error:', err)
      )
      if (agreement.amendsId) {
        applyAmendment(agreement).catch(err =>
          console.error('Apply amendment error:', err)
        )
      }
    }

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

/**
 * A fully executed lease fills the unit. Switch the listing off so it stops
 * taking applications, and decline every still-pending applicant on it who
 * is not on this lease, with the usual decision email so nobody is left
 * waiting on a unit that is gone. The landlord can relist from the
 * property workspace at any time.
 */
async function closeListingForLease(agreement) {
  const listingId = agreement.application?.listingId
  if (!listingId) return

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { active: false },
    select: {
      id: true,
      title: true,
      owner: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  const others = await prisma.application.findMany({
    where: {
      listingId,
      status: 'pending',
      source: 'applied',
      OR: [{ agreementId: null }, { agreementId: { not: agreement.id } }],
    },
    select: {
      id: true,
      applicant: { select: { firstName: true, email: true } },
    },
  })
  if (!others.length) return

  await prisma.application.updateMany({
    where: { id: { in: others.map(o => o.id) } },
    data: { status: 'rejected' },
  })
  await Promise.all(
    others
      .filter(o => o.applicant?.email)
      .map(o =>
        sendApplicationStatusEmail(
          o.applicant,
          listing,
          'rejected',
          listing.owner
        ).catch(err =>
          console.error('Applicant decline email failed:', err?.message)
        )
      )
  )
}

export default router
