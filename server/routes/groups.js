import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import { sendGroupInviteEmail } from '../utils/email.js'

const router = express.Router()

const memberInclude = {
  members: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  // Listings shared into the group chat drive the "N saved" stat.
  messages: {
    where: { type: 'listing' },
    select: { metadata: true },
  },
}

// Shape a group for the frontend GroupsContext.
function shape(group) {
  const interested = new Set()
  for (const m of group.messages || []) {
    const listingId = m.metadata?.listingData?.id || m.metadata?.listingId
    if (listingId) interested.add(listingId)
  }
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    maxMembers: group.maxMembers,
    status: group.status,
    createdAt: group.createdAt,
    createdById: group.createdById,
    interestedListings: [...interested],
    members: (group.members || []).map(m => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      inviteEmail: m.inviteEmail,
      name: m.user
        ? `${m.user.firstName} ${m.user.lastName}`
        : m.inviteEmail || 'Invited',
      email: m.user?.email || m.inviteEmail || null,
    })),
  }
}

async function loadGroup(id) {
  return prisma.group.findUnique({ where: { id }, include: memberInclude })
}

async function isActiveMember(groupId, userId) {
  const m = await prisma.groupMember.findFirst({
    where: { groupId, userId, status: 'active' },
  })
  return !!m
}

function shapeMessage(m) {
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender
      ? `${m.sender.firstName} ${m.sender.lastName}`
      : 'Member',
    senderAvatar: m.sender?.avatarUrl || null,
    content: m.content,
    type: m.type,
    timestamp: m.createdAt,
    listingData: m.metadata?.listingData || null,
  }
}

/**
 * POST /api/groups — create a group (creator becomes admin member).
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body
    if (!name) {
      return res.status(400).json({ error: { message: 'Group name required' } })
    }
    const group = await prisma.group.create({
      data: {
        name,
        description,
        maxMembers: maxMembers ? parseInt(maxMembers, 10) : 4,
        createdById: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'admin', status: 'active' },
        },
      },
      include: memberInclude,
    })
    res.status(201).json({ group: shape(group) })
  } catch (error) {
    console.error('Create group error:', error)
    res.status(500).json({ error: { message: 'Failed to create group' } })
  }
})

/**
 * GET /api/groups/my — groups the user belongs to.
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user.id, status: 'active' } } },
      include: memberInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ groups: groups.map(shape) })
  } catch (error) {
    console.error('List groups error:', error)
    res.status(500).json({ error: { message: 'Failed to list groups' } })
  }
})

/**
 * GET /api/groups/invitations — pending invitations for the current user
 * (matched by linked userId or by the email the invite was sent to).
 * Registered before /:id so "invitations" isn't captured as an id.
 */
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const invites = await prisma.groupMember.findMany({
      where: {
        status: 'invited',
        OR: [
          { userId: req.user.id },
          { inviteEmail: req.user.email.toLowerCase() },
        ],
      },
      include: {
        group: {
          include: {
            members: { where: { status: 'active' }, select: { id: true } },
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })
    res.json({
      invitations: invites.map(i => ({
        id: i.id,
        groupId: i.groupId,
        groupName: i.group.name,
        description: i.group.description,
        memberCount: i.group.members.length,
        maxMembers: i.group.maxMembers,
        invitedBy: `${i.group.createdBy.firstName} ${i.group.createdBy.lastName}`,
        invitedAt: i.joinedAt,
        status: 'pending',
      })),
    })
  } catch (error) {
    console.error('List invitations error:', error)
    res.status(500).json({ error: { message: 'Failed to list invitations' } })
  }
})

/**
 * GET /api/groups/:id — group detail (members only).
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await loadGroup(req.params.id)
    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } })
    }
    const isMember = group.members.some(
      m => m.userId === req.user.id && m.status === 'active'
    )
    if (!isMember) {
      return res.status(403).json({ error: { message: 'Not a group member' } })
    }
    res.json({ group: shape(group) })
  } catch (error) {
    console.error('Get group error:', error)
    res.status(500).json({ error: { message: 'Failed to get group' } })
  }
})

/**
 * POST /api/groups/:id/invite — admin invites a member by email.
 */
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: { message: 'Email required' } })
    }
    const group = await loadGroup(req.params.id)
    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } })
    }
    const me = group.members.find(m => m.userId === req.user.id)
    if (!me || me.role !== 'admin') {
      return res
        .status(403)
        .json({ error: { message: 'Only an admin can invite members' } })
    }
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: { message: 'Group is full' } })
    }

    // Link to an existing user if one has this email.
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        inviteEmail: email.toLowerCase(),
        userId: existing?.id || null,
        role: 'member',
        status: 'invited',
      },
    })

    // Fire-and-forget: the invite is valid even if the email fails.
    sendGroupInviteEmail({
      email: email.toLowerCase(),
      inviterName: `${req.user.firstName} ${req.user.lastName}`,
      group: {
        name: group.name,
        description: group.description,
        maxMembers: group.maxMembers,
      },
    }).catch(err => console.error('Group invite email error:', err))

    res.status(201).json({ member })
  } catch (error) {
    console.error('Invite member error:', error)
    res.status(500).json({ error: { message: 'Failed to invite member' } })
  }
})

/**
 * POST /api/groups/:id/join — accept an invitation (current user).
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const invite = await prisma.groupMember.findFirst({
      where: {
        groupId: req.params.id,
        status: 'invited',
        OR: [
          { userId: req.user.id },
          { inviteEmail: req.user.email.toLowerCase() },
        ],
      },
    })
    if (!invite) {
      return res.status(404).json({ error: { message: 'No invitation found' } })
    }
    await prisma.groupMember.update({
      where: { id: invite.id },
      data: { userId: req.user.id, status: 'active', joinedAt: new Date() },
    })
    const group = await loadGroup(req.params.id)
    res.json({ group: shape(group) })
  } catch (error) {
    console.error('Join group error:', error)
    res.status(500).json({ error: { message: 'Failed to join group' } })
  }
})

/**
 * POST /api/groups/:id/decline — decline an invitation (current user).
 * Mirrors the join lookup so email-only invites (no linked account at
 * invite time) can also be declined.
 */
router.post('/:id/decline', authenticate, async (req, res) => {
  try {
    const invite = await prisma.groupMember.findFirst({
      where: {
        groupId: req.params.id,
        status: 'invited',
        OR: [
          { userId: req.user.id },
          { inviteEmail: req.user.email.toLowerCase() },
        ],
      },
    })
    if (!invite) {
      return res.status(404).json({ error: { message: 'No invitation found' } })
    }
    await prisma.groupMember.delete({ where: { id: invite.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Decline invitation error:', error)
    res.status(500).json({ error: { message: 'Failed to decline invitation' } })
  }
})

/**
 * DELETE /api/groups/:id/members/:memberId — remove a member / leave.
 */
router.delete('/:id/members/:memberId', authenticate, async (req, res) => {
  try {
    const group = await loadGroup(req.params.id)
    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } })
    }
    const me = group.members.find(m => m.userId === req.user.id)
    const target = group.members.find(m => m.id === req.params.memberId)
    if (!target) {
      return res.status(404).json({ error: { message: 'Member not found' } })
    }
    // Admins can remove anyone; members can only remove themselves.
    const isAdmin = me?.role === 'admin'
    if (!isAdmin && target.userId !== req.user.id) {
      return res.status(403).json({ error: { message: 'Not authorized' } })
    }
    await prisma.groupMember.delete({ where: { id: target.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ error: { message: 'Failed to remove member' } })
  }
})

/**
 * DELETE /api/groups/:id — creator deletes the group.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
    })
    if (!group) {
      return res.status(404).json({ error: { message: 'Group not found' } })
    }
    if (group.createdById !== req.user.id) {
      return res
        .status(403)
        .json({ error: { message: 'Only the creator can delete the group' } })
    }
    await prisma.group.delete({ where: { id: group.id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete group error:', error)
    res.status(500).json({ error: { message: 'Failed to delete group' } })
  }
})

/**
 * GET /api/groups/:id/messages — group chat history (members only).
 */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    if (!(await isActiveMember(req.params.id, req.user.id))) {
      return res.status(403).json({ error: { message: 'Not a group member' } })
    }
    // Paginated: newest `limit` messages (optionally before a timestamp),
    // returned in chronological order for rendering.
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200)
    const before = req.query.before ? new Date(req.query.before) : null

    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId: req.params.id,
        ...(before && !isNaN(before) && { createdAt: { lt: before } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    res.json({ messages: messages.reverse().map(shapeMessage) })
  } catch (error) {
    console.error('List group messages error:', error)
    res.status(500).json({ error: { message: 'Failed to load messages' } })
  }
})

/**
 * POST /api/groups/:id/messages — send a chat message (members only).
 */
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { content, type = 'text', metadata } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: { message: 'Message is empty' } })
    }
    if (!(await isActiveMember(req.params.id, req.user.id))) {
      return res.status(403).json({ error: { message: 'Not a group member' } })
    }
    const created = await prisma.groupMessage.create({
      data: {
        groupId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
        type,
        ...(metadata && { metadata }),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })
    res.status(201).json({ message: shapeMessage(created) })
  } catch (error) {
    console.error('Send group message error:', error)
    res.status(500).json({ error: { message: 'Failed to send message' } })
  }
})

export default router
