import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  POLICY_VERSIONS,
  POLICY_TITLES,
  SIGNUP_POLICIES,
  isKnownPolicy,
  latestByPolicy,
  pendingPolicies,
  recordAcceptances,
} from '../utils/policies.js'

/**
 * Legal policies: current versions, the caller's acceptance trail, and
 * explicit acceptance. Consents that belong to a specific action (lease
 * signature, autopay, screening) are recorded inside those routes so the
 * consent row and the action share one request.
 */
const router = express.Router()

function shape(row) {
  return {
    policy: row.policy,
    version: row.version,
    acceptedAt: row.acceptedAt,
    current: row.version === POLICY_VERSIONS[row.policy],
  }
}

/**
 * GET /api/legal/versions — public. Current version and title per policy.
 */
router.get('/versions', (req, res) => {
  res.json({ versions: POLICY_VERSIONS, titles: POLICY_TITLES })
})

/**
 * GET /api/legal/acceptances — the caller's latest acceptance per policy
 * and which signup policies still need (re-)acceptance.
 */
router.get('/acceptances', authenticate, async (req, res) => {
  try {
    const rows = await prisma.policyAcceptance.findMany({
      where: { userId: req.user.id },
      orderBy: { acceptedAt: 'desc' },
    })
    const latest = latestByPolicy(rows)
    res.json({
      versions: POLICY_VERSIONS,
      acceptances: Object.values(latest).map(shape),
      pending: pendingPolicies(rows, SIGNUP_POLICIES),
    })
  } catch (error) {
    console.error('List acceptances error:', error)
    res.status(500).json({ error: { message: 'Failed to load acceptances' } })
  }
})

/**
 * POST /api/legal/accept — body: { policies: ['terms', 'privacy'], context? }
 * Records acceptance of the current version of each named policy.
 */
router.post('/accept', authenticate, async (req, res) => {
  try {
    const { policies, context } = req.body
    const list = Array.isArray(policies) ? policies : [policies]
    const unknown = list.filter(p => !isKnownPolicy(p))
    if (list.length === 0 || unknown.length) {
      return res.status(400).json({
        error: {
          message: unknown.length
            ? `Unknown policy: ${unknown.join(', ')}`
            : 'policies is required',
        },
      })
    }
    const rows = await recordAcceptances(prisma, {
      userId: req.user.id,
      policies: list,
      req,
      context: context && typeof context === 'object' ? context : null,
    })
    const all = await prisma.policyAcceptance.findMany({
      where: { userId: req.user.id },
    })
    res.status(201).json({
      accepted: rows.map(r => ({ policy: r.policy, version: r.version })),
      pending: pendingPolicies(all, SIGNUP_POLICIES),
    })
  } catch (error) {
    console.error('Accept policy error:', error)
    res.status(500).json({ error: { message: 'Failed to record acceptance' } })
  }
})

export default router
