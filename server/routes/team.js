import express from 'express'
import crypto from 'node:crypto'
import prisma from '../utils/prisma.js'
import { authenticate, requireUserType } from '../middleware/authenticate.js'
import {
  sendTeamInviteEmail,
  sendTeamMemberJoinedEmail,
} from '../utils/emailTeam.js'
import { listPortfolios, canSelectPortfolio } from '../utils/portfolioScope.js'

/**
 * Team access: co-owners and property managers on a landlord's portfolio.
 * The auth middleware turns an active membership into req.portfolioId, so
 * every owner route already scopes by the portfolio owner. This router
 * manages the memberships themselves and which portfolio a multi-portfolio
 * account is working (GET /portfolios, PUT /active). Inviting and removing
 * is for the portfolio owner; a member can leave.
 */
const router = express.Router()

const ROLES = ['manager', 'co_owner']
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000

const person = { id: true, firstName: true, lastName: true, email: true }

const present = m => ({
  id: m.id,
  role: m.role,
  status: m.status,
  email: m.user?.email || m.inviteEmail,
  name: m.user ? `${m.user.firstName} ${m.user.lastName}` : null,
  userId: m.userId,
  acceptedAt: m.acceptedAt,
  createdAt: m.createdAt,
  expiresAt: m.status === 'invited' ? m.tokenExpires : null,
})

/**
 * GET /api/team
 * The caller's portfolio: who owns it, their role, and (for the owner) the
 * members and open invitations.
 */
router.get('/', authenticate, requireUserType('owner'), async (req, res) => {
  try {
    const isOwner = req.portfolioId === req.user.id
    const owner = isOwner
      ? req.user
      : await prisma.user.findUnique({
          where: { id: req.portfolioId },
          select: person,
        })
    const members = await prisma.portfolioMember.findMany({
      where: {
        ownerId: req.portfolioId,
        status: { in: ['invited', 'active'] },
      },
      include: { user: { select: person } },
      orderBy: { createdAt: 'asc' },
    })
    const activeMemberships = await prisma.portfolioMember.count({
      where: { userId: req.user.id, status: 'active' },
    })
    res.json({
      portfolio: {
        ownerId: req.portfolioId,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : null,
        role: req.portfolioRole,
        isOwner,
        // More than one portfolio to work: own + at least one membership.
        canSwitch: activeMemberships > 0,
      },
      members: members.map(present),
    })
  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({ error: { message: 'Failed to load your team' } })
  }
})

/** The caller's active memberships with each owner's name, oldest first. */
function activeMembershipsOf(userId) {
  return prisma.portfolioMember.findMany({
    where: { userId, status: 'active' },
    select: { ownerId: true, role: true, owner: { select: person } },
    orderBy: { acceptedAt: 'asc' },
  })
}

/**
 * GET /api/team/portfolios
 * Every portfolio the caller can work (their own plus each active
 * membership); `active` marks the one in effect for this request.
 */
router.get(
  '/portfolios',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const memberships = await activeMembershipsOf(req.user.id)
      res.json({ portfolios: listPortfolios(req.user, memberships) })
    } catch (error) {
      console.error('List portfolios error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to load your portfolios' } })
    }
  }
)

/**
 * PUT /api/team/active  body: { ownerId }
 * Pick which portfolio the caller works. Persisted on the user, so every
 * later request (any device) scopes to it until they switch again.
 */
router.put(
  '/active',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const ownerId = String(req.body?.ownerId || '').trim()
      const memberships = await activeMembershipsOf(req.user.id)
      if (!canSelectPortfolio(req.user, memberships, ownerId)) {
        return res.status(400).json({
          error: { message: 'That portfolio is not one you can work' },
        })
      }
      await prisma.user.update({
        where: { id: req.user.id },
        data: { activePortfolioOwnerId: ownerId },
      })
      res.json({
        portfolios: listPortfolios(
          { ...req.user, activePortfolioOwnerId: ownerId },
          memberships
        ),
      })
    } catch (error) {
      console.error('Set active portfolio error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to switch portfolios' } })
    }
  }
)

/**
 * POST /api/team/invite  body: { email, role }
 */
router.post(
  '/invite',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      if (req.portfolioId !== req.user.id) {
        return res.status(403).json({
          error: { message: 'Only the portfolio owner can invite people' },
        })
      }
      const email = String(req.body?.email || '')
        .trim()
        .toLowerCase()
      const role = ROLES.includes(req.body?.role) ? req.body.role : 'manager'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res
          .status(400)
          .json({ error: { message: 'A valid email is required' } })
      }
      if (email === req.user.email.toLowerCase()) {
        return res
          .status(400)
          .json({ error: { message: 'That is your own account' } })
      }
      const existing = await prisma.portfolioMember.findFirst({
        where: {
          ownerId: req.user.id,
          inviteEmail: email,
          status: { in: ['invited', 'active'] },
        },
      })
      if (existing) {
        return res.status(400).json({
          error: {
            message: `${email} is already ${existing.status === 'active' ? 'on your team' : 'invited'}`,
          },
        })
      }
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, userType: true },
      })
      if (user && user.userType !== 'owner') {
        return res.status(400).json({
          error: {
            message: `${email} has a ${user.userType === 'cosigner' ? 'co-signer' : 'tenant'} account. Team members need a landlord account; ask them to sign up with another email.`,
          },
        })
      }

      const member = await prisma.portfolioMember.create({
        data: {
          ownerId: req.user.id,
          inviteEmail: email,
          role,
          status: 'invited',
          inviteToken: crypto.randomBytes(24).toString('hex'),
          tokenExpires: new Date(Date.now() + INVITE_TTL_MS),
        },
        include: { user: { select: person } },
      })
      res.status(201).json({ member: present(member) })

      sendTeamInviteEmail({
        email,
        inviterName: `${req.user.firstName} ${req.user.lastName}`.trim(),
        role,
        token: member.inviteToken,
      }).catch(err => console.error('Team invite email failed:', err?.message))
    } catch (error) {
      console.error('Team invite error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to send the invitation' } })
    }
  }
)

/**
 * DELETE /api/team/:id — owner removes a member or cancels an invitation.
 */
router.delete(
  '/:id',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const member = await prisma.portfolioMember.findUnique({
        where: { id: req.params.id },
      })
      if (!member || member.ownerId !== req.user.id) {
        return res
          .status(404)
          .json({ error: { message: 'Team member not found' } })
      }
      await prisma.portfolioMember.update({
        where: { id: member.id },
        data: { status: 'removed' },
      })
      res.json({ ok: true })
    } catch (error) {
      console.error('Remove team member error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to remove the member' } })
    }
  }
)

/**
 * POST /api/team/leave — a member steps off the portfolio they manage.
 */
router.post(
  '/leave',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const result = await prisma.portfolioMember.updateMany({
        where: { userId: req.user.id, status: 'active' },
        data: { status: 'removed' },
      })
      res.json({ left: result.count })
    } catch (error) {
      console.error('Leave team error:', error)
      res.status(500).json({ error: { message: 'Failed to leave the team' } })
    }
  }
)

/**
 * GET /api/team/invitation/:token — public: who is inviting, for the accept page.
 */
router.get('/invitation/:token', async (req, res) => {
  try {
    const member = await prisma.portfolioMember.findUnique({
      where: { inviteToken: req.params.token },
      include: { owner: { select: person } },
    })
    if (!member) {
      return res
        .status(404)
        .json({ error: { message: 'Invitation not found' } })
    }
    const account = await prisma.user.findUnique({
      where: { email: member.inviteEmail },
      select: { userType: true },
    })
    res.json({
      invitation: {
        id: member.id,
        email: member.inviteEmail,
        role: member.role,
        status:
          member.status === 'invited' && member.tokenExpires < new Date()
            ? 'expired'
            : member.status,
        expiresAt: member.tokenExpires,
        inviter: { name: `${member.owner.firstName} ${member.owner.lastName}` },
        hasAccount: Boolean(account),
        accountType: account?.userType || null,
      },
    })
  } catch (error) {
    console.error('Team invitation lookup error:', error)
    res
      .status(500)
      .json({ error: { message: 'Failed to load the invitation' } })
  }
})

/**
 * POST /api/team/accept/:token — the invited landlord account joins.
 */
router.post(
  '/accept/:token',
  authenticate,
  requireUserType('owner'),
  async (req, res) => {
    try {
      const member = await prisma.portfolioMember.findUnique({
        where: { inviteToken: req.params.token },
        include: { owner: { select: person } },
      })
      if (!member || member.status !== 'invited') {
        return res
          .status(404)
          .json({ error: { message: 'This invitation is no longer open' } })
      }
      if (member.tokenExpires < new Date()) {
        return res
          .status(400)
          .json({ error: { message: 'This invitation has expired' } })
      }
      if (member.inviteEmail !== req.user.email.toLowerCase()) {
        return res.status(403).json({
          error: {
            message: `This invitation was sent to ${member.inviteEmail}. Sign in with that account.`,
          },
        })
      }
      if (member.ownerId === req.user.id) {
        return res
          .status(400)
          .json({ error: { message: 'You own this portfolio' } })
      }
      const ownsListings = await prisma.listing.count({
        where: { ownerId: req.user.id },
      })
      if (ownsListings > 0) {
        return res.status(400).json({
          error: {
            message:
              'This account already owns listings. Team members use a landlord account without listings of their own.',
          },
        })
      }
      const updated = await prisma.portfolioMember.update({
        where: { id: member.id },
        data: { userId: req.user.id, status: 'active', acceptedAt: new Date() },
        include: { user: { select: person } },
      })
      res.json({
        member: present(updated),
        portfolio: {
          ownerId: member.ownerId,
          ownerName: `${member.owner.firstName} ${member.owner.lastName}`,
          role: member.role,
        },
      })

      sendTeamMemberJoinedEmail({
        owner: member.owner,
        member: req.user,
        role: member.role,
      }).catch(err => console.error('Team joined email failed:', err?.message))
    } catch (error) {
      console.error('Team accept error:', error)
      res
        .status(500)
        .json({ error: { message: 'Failed to accept the invitation' } })
    }
  }
)

export default router
