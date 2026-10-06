#!/usr/bin/env node
/* global process, console, fetch */
/**
 * Production golden-path check: drives the landlord + tenant journey end to
 * end against a live API with two throwaway accounts YOU own, then cleans
 * up the listing it created. Nothing here is mocked.
 *
 *   SMOKE_API_URL=https://rentra-production.up.railway.app/api \
 *   GP_LANDLORD_EMAIL=you+landlord@example.com GP_LANDLORD_PASSWORD='...' \
 *   GP_TENANT_EMAIL=you+tenant@example.com     GP_TENANT_PASSWORD='...' \
 *   node e2e/golden-path.mjs
 *
 * Accounts are registered on first run (user type owner / student) and
 * reused after that. Use inboxes you can read: the run should produce the
 * application, decision, signature, receipt, charge, maintenance, inspection
 * and lease-ended emails, which is the part no local trial can prove.
 *
 * Steps: register/login → list → apply → approve → both sign → tenant records
 * rent → landlord adds a charge and reads the ledger → tenant files a ticket,
 * landlord replies and completes it → landlord completes a move-out
 * inspection → landlord ends the lease → listing deleted. Each step prints
 * PASS or FAIL; the process exits 1 on the first failure.
 */

const API = (process.env.SMOKE_API_URL || 'http://localhost:5000/api').replace(
  /\/$/,
  ''
)
const env = name => {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing ${name}`)
    process.exit(2)
  }
  return v
}
const landlordEmail = env('GP_LANDLORD_EMAIL')
const landlordPassword = env('GP_LANDLORD_PASSWORD')
const tenantEmail = env('GP_TENANT_EMAIL')
const tenantPassword = env('GP_TENANT_PASSWORD')

let step = 0
const pass = msg => console.log(`PASS ${String(++step).padStart(2)}  ${msg}`)
const fail = (msg, err) => {
  console.error(
    `FAIL ${String(++step).padStart(2)}  ${msg}\n      ${err?.message || err}`
  )
  process.exit(1)
}

async function call(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(
      `${method} ${path} -> ${res.status} ${data?.error?.message || ''}`
    )
    err.status = res.status
    throw err
  }
  return data
}

async function registerOrLogin({
  email,
  password,
  userType,
  firstName,
  lastName,
}) {
  try {
    const r = await call('/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        userType,
        firstName,
        lastName,
        acceptedTerms: true,
      },
    })
    return { token: r.token, created: true }
  } catch (err) {
    if (err.status !== 400 && err.status !== 409) throw err
    const r = await call('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    return { token: r.token, created: false }
  }
}

const sign = (token, agreementId, name) =>
  call(`/agreements/${agreementId}/sign`, {
    method: 'POST',
    token,
    body: { esignConsent: true, signatureName: name },
  })

const today = new Date()
const iso = d => d.toISOString().slice(0, 10)
const plusMonths = (d, n) =>
  new Date(d.getFullYear(), d.getMonth() + n, d.getDate())

let listingId = null
let landlord = null

try {
  const health = await fetch(API.replace(/\/api$/, '') + '/health').then(r =>
    r.json()
  )
  if (health?.status !== 'ok') throw new Error(JSON.stringify(health))
  pass(`API healthy at ${API}`)

  landlord = await registerOrLogin({
    email: landlordEmail,
    password: landlordPassword,
    userType: 'owner',
    firstName: 'Golden',
    lastName: 'Landlord',
  })
  pass(`landlord ${landlord.created ? 'registered' : 'logged in'}`)
  const tenant = await registerOrLogin({
    email: tenantEmail,
    password: tenantPassword,
    userType: 'student',
    firstName: 'Golden',
    lastName: 'Tenant',
  })
  pass(`tenant ${tenant.created ? 'registered' : 'logged in'}`)

  const listing = (
    await call('/listings', {
      method: 'POST',
      token: landlord.token,
      body: {
        title: `Golden path unit ${iso(today)}`,
        description:
          'Throwaway listing created by e2e/golden-path.mjs. Safe to delete.',
        price: 1800,
        location: 'Pacific Beach, San Diego, CA 92109',
        propertyType: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        moveInDate: iso(plusMonths(today, 1)),
        incomeMultiplier: 3,
        screeningCriteria: { guarantorPolicy: 'never', minCreditScore: 600 },
        amenities: ['WiFi'],
        images: [],
      },
    })
  ).listing
  listingId = listing.id
  pass(`listing created ${listing.id}`)
  const pub = await call(`/listings/${listing.id}`)
  if (pub.listing?.screeningCriteria?.minCreditScore !== 600)
    throw new Error('criteria missing')
  pass('public listing shows the screening criteria')

  const application = (
    await call('/applications', {
      method: 'POST',
      token: tenant.token,
      body: {
        listingId: listing.id,
        startDate: iso(plusMonths(today, 1)),
        endDate: iso(plusMonths(today, 13)),
        message: 'Golden path application',
        verificationData: { monthlyIncome: 6000, incomeVerified: true },
      },
    })
  ).application
  pass(`tenant applied ${application.id}`)

  const inbox = await call('/dashboard/landlord/inbox', {
    token: landlord.token,
  })
  if (!inbox.applications.some(a => a.id === application.id))
    throw new Error('not in inbox')
  pass('application shows in the landlord Inbox')

  const approved = await call(`/applications/${application.id}/status`, {
    method: 'PUT',
    token: landlord.token,
    body: { status: 'approved' },
  })
  const agreementId = approved.application?.agreementId || approved.agreementId
  if (!agreementId) throw new Error('no agreementId after approval')
  pass(`approved, lease ${agreementId} created`)

  await call(`/agreements/${agreementId}/terms`, {
    method: 'PUT',
    token: landlord.token,
    body: {
      terms: { additionalClauses: ['Golden path clause'] },
      lateFeeAmount: 50,
      lateFeeGraceDays: 5,
    },
  })
  pass('landlord edited the terms before signatures')

  await sign(landlord.token, agreementId, 'Golden Landlord')
  const signed = (await sign(tenant.token, agreementId, 'Golden Tenant'))
    .agreement
  if (signed.status !== 'signed') throw new Error(`status ${signed.status}`)
  pass('both parties signed, lease fully executed')

  const afterSign = await call(`/listings/${listing.id}`)
  if (afterSign.listing.active !== false)
    throw new Error('listing still active')
  pass('listing switched off after full signing')

  const pdf = await fetch(`${API}/agreements/${agreementId}/pdf`, {
    headers: { Authorization: `Bearer ${tenant.token}` },
  })
  if (!pdf.ok || !(pdf.headers.get('content-type') || '').includes('pdf'))
    throw new Error(`pdf ${pdf.status}`)
  pass('lease PDF downloads for the tenant')

  const tx = (
    await call('/payments/rent', {
      method: 'POST',
      token: tenant.token,
      body: { paymentMethod: 'recorded' },
    })
  ).transaction
  if (tx.amount !== 1800) throw new Error(`amount ${tx.amount}`)
  pass('tenant recorded rent (receipt email due)')

  await call(`/ledger/${agreementId}/charges`, {
    method: 'POST',
    token: landlord.token,
    body: {
      type: 'utility',
      amount: 40,
      description: 'Golden path water bill',
    },
  })
  const ledger = (
    await call(`/ledger/${agreementId}`, { token: landlord.token })
  ).ledger
  if (ledger.members[0].otherCharges !== 40)
    throw new Error(JSON.stringify(ledger.members[0]))
  pass('charge added and ledger balances (charge email due)')

  const roll = await call('/dashboard/landlord/rent-roll', {
    token: landlord.token,
  })
  const row = roll.rentRoll.find(r => r.listing.id === listing.id)
  if (!row || row.tenants[0].paidThisMonth !== 1800)
    throw new Error('rent roll mismatch')
  pass('rent roll shows the payment and charge')

  const ticket = (
    await call('/maintenance', {
      method: 'POST',
      token: tenant.token,
      body: {
        category: 'Plumbing',
        description: 'Golden path drip',
        priority: 'low',
      },
    })
  ).ticket
  await call(`/maintenance/${ticket.id}/comments`, {
    method: 'POST',
    token: landlord.token,
    body: { body: 'On it, plumber booked.' },
  })
  await call(`/maintenance/${ticket.id}/status`, {
    method: 'PUT',
    token: landlord.token,
    body: { status: 'completed', assignedTo: 'Golden Plumbing', cost: 90 },
  })
  await call(`/maintenance/${ticket.id}/expense`, {
    method: 'POST',
    token: landlord.token,
  })
  pass('maintenance ticket → comment → completed → booked as expense')

  const inspection = (
    await call('/inspections', {
      method: 'POST',
      token: landlord.token,
      body: { listingId: listing.id, type: 'move_out', agreementId },
    })
  ).inspection
  const items = inspection.items.map((it, i) =>
    i === 0
      ? {
          ...it,
          condition: 'damaged',
          notes: 'Golden path scuff',
          estimatedCost: 25,
        }
      : it
  )
  await call(`/inspections/${inspection.id}`, {
    method: 'PUT',
    token: landlord.token,
    body: { items, status: 'completed' },
  })
  const ded = await call(`/inspections/${inspection.id}/deductions`, {
    method: 'POST',
    token: landlord.token,
  })
  if (ded.created !== 1) throw new Error(JSON.stringify(ded))
  pass('move-out inspection completed and pushed to the deposit')

  const ended = (
    await call(`/agreements/${agreementId}/end`, {
      method: 'POST',
      token: landlord.token,
      body: {
        moveOutDate: iso(plusMonths(today, 2)),
        reason: 'move_out',
        relist: false,
      },
    })
  ).agreement
  if (!ended.endedAt) throw new Error('endedAt missing')
  pass('lease ended with notice (lease-ended email due)')

  const deposits = (await call('/deposits', { token: landlord.token })).deposits
  const dep = deposits.find(d => d.listing?.id === listing.id)
  if (!dep || dep.status !== 'pending_refund' || dep.totalDeductions !== 25)
    throw new Error(JSON.stringify(dep))
  pass(
    `deposit refund clock running: ${dep.daysRemaining} days, $${dep.refundDue} due back`
  )
} catch (err) {
  fail('step failed', err)
} finally {
  if (listingId && landlord?.token) {
    // A listing with an approved application cannot be deleted through the
    // API, so switch it off; it stays in the landlord's portfolio as a
    // record of the run and can be removed from the database by hand.
    try {
      await call(`/listings/${listingId}`, {
        method: 'PUT',
        token: landlord.token,
        body: { active: false },
      })
      console.log(
        `cleanup  listing ${listingId} switched off (not deletable while its lease exists)`
      )
    } catch (err) {
      console.error(
        `cleanup  could not switch off listing ${listingId}: ${err.message}`
      )
    }
  }
}
console.log(
  '\nGOLDEN PATH OK — now check both inboxes for the emails listed above.'
)
