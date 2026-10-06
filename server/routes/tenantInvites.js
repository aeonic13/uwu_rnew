import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import {
  generateSecureToken,
  generateTokens,
  hashPassword,
  verifyPassword,
  verifyToken,
  extractTokenFromHeader,
  validatePasswordStrength,
} from '../utils/auth.js'
import { recordAcceptances, SIGNUP_POLICIES } from '../utils/policies.js'
import { signatureState } from '../utils/agreements.js'
import {
  INVITE_TTL_MS,
  canResend,
  equalShares,
  inviteExpired,
  inviteUrlFor,
  normalizeEmail,
} from '../utils/onboarding.js'
import {
  sendTenantInvitation,
  sendTenantInviteAccepted,
  sendTenantInviteDeclined,
} from '../utils/email.js'

/**
 * Invitations to the current tenants of an occupied property. The landlord
 * creates them with POST /api/properties/:id/onboard; this router manages
 * them (owner) and lets the invited tenant preview, accept and decline
 * (public, by secret token). Accepting creates or links the tenant's
 * account, attaches it to the lease's tenant block and marks that block
 * confirmed. Nothing here e-signs anything: the lease was executed off
 * Rentra and the tenant only attests that the recorded terms match it.
 */
const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function newInviteToken(now = Date.now()) {
  return {
    token: generateSecureToken(48),
    expiresAt: new Date(now + INVITE_TTL_MS),
  }
}

export { inviteUrlFor }

const LISTING_FIELDS = {
  id: true,
  title: true,
  location: true,
  streetAddress: true,
  images: true,
  bedrooms: true,
  bathrooms: true,
  propertyType: true,
}

const OWNER_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
}

const inviteInclude = {
  listing: { select: LISTING_FIELDS },
  owner: { select: OWNER_FIELDS },
  agreement: {
    select: {
      id: true,
      monthlyRent: true,
      securityDeposit: true,
      startDate: true,
      endDate: true,
      monthToMonth: true,
      source: true,
      rentSplit: {
        select: {
          id: true,
          splitMode: true,
          shares: {
            select: { id: true, name: true, amount: true, userId: true },
          },
        },
      },
      signers: {
        select: {
          id: true,
          role: true,
          signed: true,
          userId: true,
          applicationId: true,
        },
      },
      tenantInvites: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  },
}

/** Public shape of one invite for the landlord's Tenants tab. */
export function presentInvite(invite) {
  return {
    id: invite.id,
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    phone: invite.phone || null,
    status: invite.status,
    expiresAt: invite.expiresAt,
    respondedAt: invite.respondedAt || null,
    createdAt: invite.createdAt,
    applicationId: invite.applicationId,
    agreementId: invite.agreementId,
  }
}

/**
 * The split share created for this invite at onboarding: the unattached
 * share with the invite's name, else any unattached share.
 */
function shareFor(agreement, invite) {
  const shares = (agreement?.rentSplit?.shares || []).filter(s => !s.userId)
  const name = `${invite.firstName} ${invite.lastName}`
  return shares.find(s => s.name === name) || shares[0] || null
}

/** Household size on a lease: one tenant block per member. */
const householdSizeOf = agreement =>
  Math.max(
    1,
    (agreement?.signers || []).filter(s => s.role === 'tenant').length
  )

/**
 * What this invitee owes each month: the split share recorded for them
 * (custom or equal), else an equal cut of the rent.
 */
export function shareAmountFor(agreement, invite) {
  const named = shareFor(agreement, invite)
  if (named && Number.isFinite(Number(named.amount))) {
    return Math.round(Number(named.amount))
  }
  return equalShares(agreement.monthlyRent, householdSizeOf(agreement))[0]
}

/**
 * Send (or re-send) the invitation email. Best-effort; returns a boolean.
 * `share` overrides the split lookup when the caller already knows it
 * (the onboard endpoint, whose agreement select has no split).
 */
export async function emailInvite(
  invite,
  { owner, listing, agreement, share: shareOverride }
) {
  const householdSize = householdSizeOf(agreement)
  const share =
    shareOverride !== undefined
      ? shareOverride
      : shareAmountFor(agreement, invite)
  try {
    const result = await sendTenantInvitation({
      invite,
      landlordName: `${owner.firstName} ${owner.lastName}`.trim(),
      listing,
      lease: agreement,
      share,
      householdSize,
      inviteUrl: inviteUrlFor(invite.token),
    })
    return Boolean(result?.success)
  } catch (err) {
    console.error('Tenant invitation email error:', err)
    return false
  }
}

/** Load an invite by id and check the caller owns it. */
async function loadOwned(id, ownerId) {
  const invite = await prisma.tenantInvite.findUnique({
    where: { id },
    include: inviteInclude,
  })
  if (!invite || invite.ownerId !== ownerId) return null
  return invite
}

/** Mark a lapsed pending invite expired; returns the (possibly updated) row. */
async function settleExpiry(invite, now = new Date()) {
  if (!inviteExpired(invite, now)) return invite
  const updated = await prisma.tenantInvite.update({
    where: { id: invite.id },
    data: { status: 'expired' },
    include: inviteInclude,
  })
  return updated
}

// ---------------------------------------------------------------------------
// Owner: manage invites
// ---------------------------------------------------------------------------

/**
 * POST /api/tenant-invites/:id/resend
 * Fresh token and 14-day expiry; the old link stops working. Allowed for
 * pending, expired and declined invites (a declined tenant may have been
 * reached at the wrong address).
 */
router.post(
  '/:id/resend',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const invite = await loadOwned(req.params.id, req.portfolioId)
      if (!invite) {
        return res.status(404).json({ error: { message: 'Invite not found' } })
      }
      if (!canResend(invite)) {
        return res.status(400).json({
          error: { message: `This invitation has been ${invite.status}.` },
        })
      }
      const fresh = newInviteToken()
      const updated = await prisma.tenantInvite.update({
        where: { id: invite.id },
        data: {
          ...fresh,
          status: 'pending',
          respondedAt: null,
          // The fresh link gets its own day-7 reminder.
          reminderSentAt: null,
        },
        include: inviteInclude,
      })
      const emailSent = await emailInvite(updated, {
        owner: req.user,
        listing: updated.listing,
        agreement: updated.agreement,
      })
      res.json({
        message: emailSent
          ? 'Invitation resent'
          : 'Invitation refreshed, but the email could not be sent',
        emailSent,
        invite: presentInvite(updated),
      })
    } catch (error) {
      console.error('Resend tenant invite error:', error)
      res.status(500).json({ error: { message: 'Failed to resend invite' } })
    }
  }
)

/**
 * PATCH /api/tenant-invites/:id
 * Fix a name, email or phone before acceptance. Changing the email rotates
 * the token and re-sends the invitation to the new address.
 */
router.patch(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const invite = await loadOwned(req.params.id, req.portfolioId)
      if (!invite) {
        return res.status(404).json({ error: { message: 'Invite not found' } })
      }
      if (invite.status === 'accepted' || invite.status === 'cancelled') {
        return res.status(400).json({
          error: {
            message: `An invitation that has been ${invite.status} cannot be edited.`,
          },
        })
      }

      const data = {}
      const { firstName, lastName, email, phone } = req.body || {}
      if (firstName !== undefined) {
        const v = String(firstName).trim().slice(0, 80)
        if (!v) {
          return res
            .status(400)
            .json({ error: { message: 'First name cannot be empty.' } })
        }
        data.firstName = v
      }
      if (lastName !== undefined) {
        const v = String(lastName).trim().slice(0, 80)
        if (!v) {
          return res
            .status(400)
            .json({ error: { message: 'Last name cannot be empty.' } })
        }
        data.lastName = v
      }
      if (phone !== undefined) {
        data.phone =
          String(phone || '')
            .trim()
            .slice(0, 32) || null
      }

      let emailChanged = false
      if (email !== undefined) {
        const next = normalizeEmail(email)
        if (!EMAIL_RE.test(next)) {
          return res
            .status(400)
            .json({ error: { message: 'Enter a valid email address.' } })
        }
        if (next === normalizeEmail(req.user.email)) {
          return res.status(400).json({
            error: { message: 'You cannot invite yourself as a tenant.' },
          })
        }
        if (next !== invite.email) {
          const clash = await prisma.tenantInvite.findFirst({
            where: {
              listingId: invite.listingId,
              email: next,
              status: { in: ['pending', 'accepted'] },
              NOT: { id: invite.id },
            },
            select: { id: true },
          })
          if (clash) {
            return res.status(400).json({
              error: {
                message: `${next} is already invited to this property.`,
              },
            })
          }
          const existing = await prisma.user.findUnique({
            where: { email: next },
            select: { userType: true },
          })
          if (existing && existing.userType !== 'student') {
            return res.status(400).json({
              error: {
                message: `${next} belongs to a ${existing.userType === 'owner' ? 'landlord' : 'co-signer'} account on Rentra. Tenants need a tenant account; use a different email.`,
              },
            })
          }
          data.email = next
          emailChanged = true
          Object.assign(data, newInviteToken(), {
            status: 'pending',
            respondedAt: null,
            reminderSentAt: null,
          })
        }
      }

      const updated = await prisma.tenantInvite.update({
        where: { id: invite.id },
        data,
        include: inviteInclude,
      })
      // Keep the unattached rent share named after the invite.
      if (data.firstName !== undefined || data.lastName !== undefined) {
        const share = shareFor(invite.agreement, invite)
        if (share) {
          await prisma.rentSplitShare.update({
            where: { id: share.id },
            data: { name: `${updated.firstName} ${updated.lastName}` },
          })
        }
      }

      let emailSent = null
      if (emailChanged) {
        emailSent = await emailInvite(updated, {
          owner: req.user,
          listing: updated.listing,
          agreement: updated.agreement,
        })
      }
      res.json({ invite: presentInvite(updated), emailSent })
    } catch (error) {
      console.error('Update tenant invite error:', error)
      res.status(500).json({ error: { message: 'Failed to update invite' } })
    }
  }
)

/**
 * DELETE /api/tenant-invites/:id
 * Cancel an unaccepted invite and remove that member from the household.
 * Removing the last member of a lease with no confirmations deletes the
 * lease so the landlord can start over.
 */
router.delete(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const invite = await loadOwned(req.params.id, req.portfolioId)
      if (!invite) {
        return res.status(404).json({ error: { message: 'Invite not found' } })
      }
      if (invite.status === 'accepted') {
        return res.status(400).json({
          error: {
            message:
              'This tenant has already confirmed the lease. Lease changes after confirmation are not supported yet; contact support.',
          },
        })
      }

      const agreement = await prisma.agreement.findUnique({
        where: { id: invite.agreementId },
        select: {
          id: true,
          applicationId: true,
          members: { select: { id: true } },
        },
      })
      const otherMembers = (agreement?.members || []).filter(
        m => m.id !== invite.applicationId
      )

      await prisma.$transaction(async tx => {
        if (agreement && otherMembers.length === 0) {
          // Last member: drop the whole imported lease (cascades to signers,
          // invites, the rent split and the member application).
          await tx.agreement.delete({ where: { id: agreement.id } })
          return
        }
        if (agreement && agreement.applicationId === invite.applicationId) {
          // The lead application is being removed; re-point the lease at
          // another member first so the Agreement row survives.
          await tx.agreement.update({
            where: { id: agreement.id },
            data: { applicationId: otherMembers[0].id },
          })
        }
        await tx.agreementSigner.deleteMany({
          where: {
            agreementId: invite.agreementId,
            applicationId: invite.applicationId,
          },
        })
        // Shrink the equal split to the remaining household (or drop it
        // when one tenant is left and owes the whole rent).
        const split = invite.agreement?.rentSplit
        if (split) {
          const share = shareFor(invite.agreement, invite)
          if (share) {
            await tx.rentSplitShare.delete({ where: { id: share.id } })
          }
          const remaining = split.shares.filter(s => s.id !== share?.id)
          if (remaining.length <= 1) {
            await tx.rentSplit.delete({ where: { id: split.id } })
          } else {
            // Re-divide so the household still covers the whole rent: an
            // equal split stays equal; a custom one spreads the removed
            // tenant's share equally over whoever is left.
            const removed = Math.round(Number(share?.amount)) || 0
            const topUp = equalShares(removed, remaining.length)
            const amounts =
              split.splitMode === 'custom'
                ? remaining.map(
                    (s, i) => Math.round(Number(s.amount)) + topUp[i]
                  )
                : equalShares(invite.agreement.monthlyRent, remaining.length)
            for (let i = 0; i < remaining.length; i += 1) {
              await tx.rentSplitShare.update({
                where: { id: remaining[i].id },
                data: { amount: amounts[i] },
              })
            }
          }
        }
        // Cascades to the invite row.
        await tx.application.delete({ where: { id: invite.applicationId } })
      })

      res.json({
        message:
          otherMembers.length === 0
            ? 'Invitation cancelled and the imported lease removed'
            : 'Invitation cancelled',
        leaseRemoved: otherMembers.length === 0,
      })
    } catch (error) {
      console.error('Cancel tenant invite error:', error)
      res.status(500).json({ error: { message: 'Failed to cancel invite' } })
    }
  }
)

// ---------------------------------------------------------------------------
// Public: preview, accept, decline (rate-limited in index.js)
// ---------------------------------------------------------------------------

function presentPreview(invite, existingUser) {
  const ag = invite.agreement
  const tenantBlocks = ag.signers.filter(s => s.role === 'tenant')
  const householdSize = Math.max(1, tenantBlocks.length)
  const housemates = ag.tenantInvites
    .filter(i => i.id !== invite.id && i.status !== 'cancelled')
    .map(i => ({
      name: `${i.firstName} ${i.lastName}`.trim(),
      confirmed: i.status === 'accepted',
    }))
  return {
    id: invite.id,
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    phone: invite.phone || null,
    status: invite.status,
    expiresAt: invite.expiresAt,
    hasAccount: Boolean(existingUser),
    // A landlord or co-signer account cannot accept a tenant invite.
    accountType: existingUser?.userType || null,
    landlord: {
      name: `${invite.owner.firstName} ${invite.owner.lastName}`.trim(),
    },
    listing: {
      id: invite.listing.id,
      title: invite.listing.title,
      location: invite.listing.location,
      streetAddress: invite.listing.streetAddress || null,
      image: invite.listing.images?.[0] || null,
      bedrooms: invite.listing.bedrooms,
      bathrooms: invite.listing.bathrooms,
      propertyType: invite.listing.propertyType,
    },
    lease: {
      startDate: ag.startDate,
      endDate: ag.endDate,
      monthToMonth: ag.monthToMonth,
      monthlyRent: ag.monthlyRent,
      securityDeposit: ag.securityDeposit,
      share: shareAmountFor(ag, invite),
      splitMode: ag.rentSplit?.splitMode || 'equal',
      householdSize,
    },
    housemates,
  }
}

/**
 * GET /api/tenant-invites/invitation/:token
 */
router.get('/invitation/:token', async (req, res) => {
  try {
    let invite = await prisma.tenantInvite.findUnique({
      where: { token: req.params.token },
      include: inviteInclude,
    })
    if (!invite) {
      return res
        .status(404)
        .json({ error: { message: 'Invitation not found' } })
    }
    invite = await settleExpiry(invite)
    if (invite.status !== 'pending') {
      const why =
        invite.status === 'expired'
          ? 'This invitation has expired. Ask your landlord to resend it.'
          : `This invitation has already been ${invite.status}.`
      return res
        .status(400)
        .json({ error: { message: why, code: invite.status } })
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true, userType: true },
    })
    res.json({ invitation: presentPreview(invite, existingUser) })
  } catch (error) {
    console.error('Get tenant invitation error:', error)
    res.status(500).json({ error: { message: 'Failed to load invitation' } })
  }
})

/**
 * POST /api/tenant-invites/accept/:token
 * body: { confirm: true, signatureName, password?, firstName?, lastName?,
 *         phone?, acceptedTerms? }
 *
 * Existing tenant account: prove ownership with a session token for that
 * user or the account password. New tenant: create the account (terms
 * acceptance recorded like signup). Then attach the user to the member row
 * and the lease's tenant block, mark the block confirmed, and return a
 * session.
 */
router.post('/accept/:token', async (req, res) => {
  try {
    let invite = await prisma.tenantInvite.findUnique({
      where: { token: req.params.token },
      include: inviteInclude,
    })
    if (!invite) {
      return res
        .status(404)
        .json({ error: { message: 'Invitation not found' } })
    }
    invite = await settleExpiry(invite)
    if (invite.status !== 'pending') {
      return res.status(400).json({
        error: {
          message:
            invite.status === 'expired'
              ? 'This invitation has expired. Ask your landlord to resend it.'
              : `This invitation has already been ${invite.status}.`,
          code: invite.status,
        },
      })
    }

    const {
      confirm,
      signatureName,
      password,
      firstName,
      lastName,
      phone,
      acceptedTerms,
    } = req.body || {}
    const typedName = String(signatureName || '')
      .trim()
      .slice(0, 120)
    if (confirm !== true || !typedName) {
      return res.status(400).json({
        error: {
          message:
            'Type your name and confirm that these are the terms of the lease you signed.',
        },
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    })
    let user
    let created = false

    if (existingUser) {
      if (existingUser.userType !== 'student') {
        return res.status(403).json({
          error: {
            message: `This email belongs to a ${existingUser.userType === 'owner' ? 'landlord' : 'co-signer'} account. Ask your landlord to resend the invitation to a different email.`,
            code: 'WRONG_ACCOUNT_TYPE',
          },
        })
      }
      let authorised = false
      const bearer = extractTokenFromHeader(req.headers.authorization)
      if (bearer) {
        const decoded = verifyToken(bearer)
        authorised = decoded?.userId === existingUser.id
      }
      if (!authorised && password) {
        authorised = await verifyPassword(password, existingUser.passwordHash)
      }
      if (!authorised) {
        // 403 rather than 401: the web client drops its session on any 401.
        return res.status(403).json({
          error: {
            message:
              'This email already has a Rentra account. Enter the password for that account to accept.',
            code: 'EXISTING_ACCOUNT',
          },
        })
      }
      user = existingUser
    } else {
      if (!password || !firstName || !lastName) {
        return res.status(400).json({
          error: {
            message: 'First name, last name and a password are required.',
          },
        })
      }
      if (acceptedTerms !== true) {
        return res.status(400).json({
          error: {
            message: 'You must accept the Terms of Service and Privacy Policy',
          },
        })
      }
      const strength = validatePasswordStrength(password)
      if (!strength.isValid) {
        return res.status(400).json({
          error: {
            message: 'Password does not meet requirements',
            details: strength.errors,
          },
        })
      }
      const passwordHash = await hashPassword(password)
      user = await prisma.user.create({
        data: {
          email: invite.email,
          passwordHash,
          userType: 'student',
          firstName: String(firstName).trim().slice(0, 80),
          lastName: String(lastName).trim().slice(0, 80),
          phone:
            String(phone || invite.phone || '')
              .trim()
              .slice(0, 32) || null,
          // The invite link proves control of the address.
          verified: true,
        },
      })
      created = true
      recordAcceptances(prisma, {
        userId: user.id,
        policies: SIGNUP_POLICIES,
        req,
        context: { source: 'tenant_invite', inviteId: invite.id },
      }).catch(err => console.error('Invite signup policy error:', err))
    }

    const now = new Date()
    const agreement = invite.agreement
    const myBlock = agreement.signers.find(
      s => s.role === 'tenant' && s.applicationId === invite.applicationId
    )
    if (!myBlock) {
      return res.status(409).json({
        error: {
          message:
            'This invitation no longer matches a tenant on the lease. Ask your landlord to resend it.',
        },
      })
    }
    // The same person cannot hold two blocks on one lease.
    const alreadyOnLease = agreement.signers.some(
      s => s.userId === user.id && s.id !== myBlock.id
    )
    if (alreadyOnLease) {
      return res.status(409).json({
        error: {
          message: 'You are already a tenant on this lease.',
        },
      })
    }

    const nextSigners = agreement.signers.map(s =>
      s.id === myBlock.id ? { ...s, signed: true } : s
    )
    const state = signatureState(nextSigners)

    const accepted = await prisma.$transaction(async tx => {
      // Atomic flip: only one accept can win.
      const flipped = await tx.tenantInvite.updateMany({
        where: { id: invite.id, status: 'pending' },
        data: {
          status: 'accepted',
          respondedAt: now,
          acceptedUserId: user.id,
        },
      })
      if (flipped.count === 0) return false
      await tx.application.update({
        where: { id: invite.applicationId },
        data: { applicantId: user.id, status: 'approved' },
      })
      await tx.agreementSigner.update({
        where: { id: myBlock.id },
        data: {
          userId: user.id,
          signed: true,
          signedAt: now,
          signatureName: typedName,
        },
      })
      await tx.agreement.update({
        where: { id: agreement.id },
        data: {
          tenantSigned: state.tenantsSigned,
          ...(state.tenantsSigned ? { tenantSignedAt: now } : {}),
          landlordSigned: state.landlordSigned,
        },
      })
      // Claim this tenant's equal-split share so Pay Rent shows it.
      const share = shareFor(agreement, invite)
      if (share) {
        await tx.rentSplitShare.update({
          where: { id: share.id },
          data: {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
          },
        })
      }
      return true
    })
    if (!accepted) {
      return res.status(400).json({
        error: { message: 'This invitation has already been responded to' },
      })
    }

    recordAcceptances(prisma, {
      userId: user.id,
      policies: ['lease_confirmation'],
      req,
      context: {
        agreementId: agreement.id,
        inviteId: invite.id,
        signatureName: typedName,
      },
    }).catch(err => console.error('Lease confirmation record error:', err))

    const tenantBlocks = nextSigners.filter(s => s.role === 'tenant')
    const confirmed = tenantBlocks.filter(s => s.signed).length
    sendTenantInviteAccepted({
      owner: invite.owner,
      tenant: user,
      listing: invite.listing,
      confirmed,
      total: tenantBlocks.length,
    }).catch(err => console.error('Tenant accepted email error:', err))

    const tokens = generateTokens(user)
    res.json({
      message: 'Lease confirmed',
      created,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      agreementId: agreement.id,
      applicationId: invite.applicationId,
      fullyConfirmed: state.allSigned,
    })
  } catch (error) {
    console.error('Accept tenant invitation error:', error)
    res.status(500).json({ error: { message: 'Failed to accept invitation' } })
  }
})

/**
 * POST /api/tenant-invites/decline/:token
 */
router.post('/decline/:token', async (req, res) => {
  try {
    let invite = await prisma.tenantInvite.findUnique({
      where: { token: req.params.token },
      include: inviteInclude,
    })
    if (!invite) {
      return res
        .status(404)
        .json({ error: { message: 'Invitation not found' } })
    }
    invite = await settleExpiry(invite)
    if (invite.status !== 'pending') {
      return res.status(400).json({
        error: {
          message: `This invitation has already been ${invite.status}.`,
        },
      })
    }
    const declined = await prisma.tenantInvite.updateMany({
      where: { id: invite.id, status: 'pending' },
      data: { status: 'declined', respondedAt: new Date() },
    })
    if (declined.count === 0) {
      return res.status(400).json({
        error: { message: 'This invitation has already been responded to' },
      })
    }
    sendTenantInviteDeclined({
      owner: invite.owner,
      invite,
      listing: invite.listing,
    }).catch(err => console.error('Tenant declined email error:', err))
    res.json({ message: 'Invitation declined' })
  } catch (error) {
    console.error('Decline tenant invitation error:', error)
    res.status(500).json({ error: { message: 'Failed to decline invitation' } })
  }
})

export default router
