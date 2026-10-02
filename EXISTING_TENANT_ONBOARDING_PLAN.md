# Onboarding existing tenants to an existing property

Status: plan, not started. Written 2026-10-01. Follows the property-centric
landlord dashboard (commit efc87da) and the competitive review of 2026-09-20,
which flagged this as a category table stake Rentra lacks: most landlords
adopt software mid-tenancy with tenants already in place, not at a vacancy.

## 1. Problem

Today the only way a tenant, a lease, rent, a deposit or a maintenance ticket
can exist on Rentra is the marketplace funnel: tenant finds the listing,
applies, landlord approves, Rentra creates the lease, everyone e-signs. A
landlord who signs up with five occupied units cannot do anything useful with
them. The property workspace shows "No tenants yet. Approving an application
creates the lease."

## 2. Goal

From a property's workspace, a landlord records the lease that already exists
and invites the current household by email. Each tenant accepts, creates or
links an account, confirms the lease facts, and lands in the tenant dashboard
with Pay Rent, rent split, autopay, utilities and maintenance working. No
screening, no application fee, no new lease to e-sign.

Success looks like: a landlord with an occupied unit goes from sign-up to a
"Leased" property with every tenant confirmed in one sitting plus the time it
takes tenants to click an email.

## 3. Design decisions

### 3.1 Reuse `Agreement` as the lease record, keep `Application` as the membership row

Everything downstream keys off `Application` and `Agreement`: rent recording
(`Transaction.applicationId`), the rent roll, `rent.js` household resolution
(tenant signers of the agreement), deposits (auto-created from signed
agreements), autopay, lease PDFs. Making `Agreement.applicationId` optional
would touch every consumer. Instead:

- Each onboarded tenant gets an `Application` row with `status: approved` and a
  new `source: onboarded` (enum `ApplicationSource { applied, onboarded }`,
  default `applied`). Screens that mean "people who applied" (Inbox, the
  Applications tab, funnel stats) filter `source = applied`.
- One `Agreement` per household with `source: imported` (enum
  `AgreementSource { rentra, imported }`), `monthToMonth Boolean`, and the
  uploaded signed lease on `documentUrl` when the landlord provides it.
- Signer rows are created as today. The landlord's row is signed at import
  (they are attesting to the terms). Each tenant's row starts unsigned and
  flips when the tenant **confirms** the lease facts on acceptance. This keeps
  `leaseFullySigned`, the property status math and household resolution
  unchanged, and it is honest: nobody's e-signature is fabricated.
- UI copy for imported leases says "Confirmed" rather than "Signed", and the
  lease view explains that the lease was executed off Rentra.

### 3.2 New model `TenantInvite`

Mirrors the cosigner invite pattern (token, expiry, public accept/decline).

```prisma
model TenantInvite {
  id            String   @id @default(cuid())
  token         String   @unique
  email         String
  firstName     String
  lastName      String
  phone         String?
  status        TenantInviteStatus @default(pending) // pending, accepted, declined, expired, cancelled
  expiresAt     DateTime
  respondedAt   DateTime?
  createdAt     DateTime @default(now())

  listingId     String
  listing       Listing   @relation(...)
  ownerId       String
  owner         User      @relation("TenantInvitesSent", ...)
  agreementId   String
  agreement     Agreement @relation(...)
  applicationId String    @unique   // the onboarded member row this invite fills
  application   Application @relation(...)
  acceptedUserId String?
  acceptedUser   User?    @relation("TenantInvitesAccepted", ...)

  @@index([email])
  @@index([listingId])
  @@index([status])
}
```

The member `Application` is created up front with `applicantId` pointing at a
user only once the invite is accepted. Because `applicantId` is required
today, the onboard transaction creates the invite and application together
and sets `applicantId` to the **owner** as a placeholder until acceptance,
or (cleaner) makes `Application.applicantId` nullable for `source: onboarded`
rows. Decision needed in review; the plan assumes nullable `applicantId` with
a check in every query that joins `applicant`. If that churn is too wide, the
placeholder approach keeps the schema stable at the cost of one guard in the
rent-roll and household code.

### 3.3 Property status

`propertyStatus` gains `awaiting_tenants`: an imported lease that is in force
but not every tenant has confirmed. Label on the card: "Invites sent" with
"2 of 3 confirmed". It becomes `leased` when the last tenant confirms.

### 3.4 What is explicitly out of scope for v1

- Backfilling past rent payments. The ledger starts the month tenants join.
- Proration for mid-month starts.
- Lease amendments after tenants have confirmed.
- Bulk CSV import of units and tenants (phase 3).
- Tenants who never create an account ("lite" tenants). Rent, maintenance and
  messaging all need a user; the invite is the account creation.

## 4. Flows

### 4.1 Landlord: add current tenants

Entry points: Tenants tab empty state ("Already have tenants here? Add them"),
the property Overview "Needs attention" list for a listed property with no
applications, and a secondary button in the property header.

Route `/dashboard/properties/:id/onboard`, three steps on one page:

1. **Lease.** Start date, end date or month-to-month toggle (stores
   `monthToMonth: true`; end date = next anniversary so the required column
   stays meaningful), monthly rent (prefilled from the listing price), deposit
   held, optional upload of the signed lease (goes to Documents with category
   `lease` and onto `Agreement.documentUrl`).
2. **Tenants.** One row per person: first name, last name, email, phone.
   Optional per-tenant rent share; when shares are entered they must sum to
   the rent and create a `RentSplit` with `splitMode: custom`. Blank shares
   mean equal split, the default the tenant side already understands.
3. **Review and send.** Summary of lease and household, a checkbox attesting
   the terms match the signed lease, then "Send invites". On success the
   landlord is asked whether to stop taking applications on the listing.

Guards: the landlord owns the listing; the listing has no current lease
(otherwise the page explains and links to the Tenants tab); no tenant email
equals the landlord's; no duplicate pending invite for the same email on the
same listing; at least one tenant; rent and deposit positive integers; end
after start.

### 4.2 Tenant: accept the invite

Email: "<Landlord> added you as a tenant at <address> on Rentra" with the
lease facts and one button. Route `/tenant-invite/:token`, public like the
cosigner acceptance page:

1. Preview: property photo and address, landlord name, term, rent, your share,
   deposit on file, who else is on the lease.
2. Account: if signed in and the email matches, link directly. Otherwise
   create an account (prefilled name and email, password, terms acceptance as
   on register) or sign in to an existing account with that email. An email
   that belongs to an owner account is refused with a clear message.
3. Confirm: "These are the terms of the lease I signed" with a typed name.
   This flips the tenant's signer row, records the acceptance, and the
   landlord is emailed.
4. Land on the tenant dashboard. Pay Rent shows the share; autopay and rent
   split cards work because they key off the agreement.

Decline sends the landlord an email and marks the invite declined. The member
row stays so the landlord can fix the email and resend.

### 4.3 Landlord: manage invites

Tenants tab shows the imported lease with each member's state: Invited,
Confirmed, Declined, Expired. Per row: Resend, Edit email, Cancel. Cancelling
the last pending member of a lease with no confirmations deletes the lease so
the landlord can start over. Portfolio card shows "Invites sent · 1 of 3
confirmed". Reminder email at day 7 and expiry at day 14 via the existing
hourly runner pattern in `server/utils/autopay.js` (new `tenantInvites.js`
runner, same shape).

## 5. API

Owner only unless noted. All under `server/routes/tenantInvites.js`, mounted
at `/api/tenant-invites`, plus one route on the properties router.

| Method | Path                                 | Purpose                                                                                                   |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| POST   | `/api/properties/:id/onboard`        | Create agreement, member applications, optional rent split, invites; send emails. One Prisma transaction. |
| GET    | `/api/properties/:id`                | Already exists; gains `invites` and per-member `inviteStatus`.                                            |
| POST   | `/api/tenant-invites/:id/resend`     | New token and expiry, resend email.                                                                       |
| PATCH  | `/api/tenant-invites/:id`            | Change name, email or phone before acceptance.                                                            |
| DELETE | `/api/tenant-invites/:id`            | Cancel; cascades as described in 4.3.                                                                     |
| GET    | `/api/tenant-invites/:token`         | Public preview. Strict rate limit like cosigner routes.                                                   |
| POST   | `/api/tenant-invites/:token/accept`  | Public. Creates or links the user, confirms the signer row, returns a JWT.                                |
| POST   | `/api/tenant-invites/:token/decline` | Public.                                                                                                   |

Emails in `server/utils/email.js`: `sendTenantInvitation`,
`sendTenantInviteReminder`, `sendTenantInviteAccepted`,
`sendTenantInviteDeclined`.

Existing routes to adjust:

- `GET /api/dashboard/landlord/inbox` and `/applications/:listingId`: filter
  `source = applied`.
- `GET /api/applications/user/stats`: exclude onboarded rows from funnel counts.
- `GET /api/agreements/:id` and `/pdf`: when `source = imported`, return the
  uploaded document if present, else a generated "Lease summary (imported)".
  Shape includes `source`, `monthToMonth`, and "confirmed" wording flags.
- `POST /api/agreements/:id/sign`: for imported leases accept the tenant's
  confirmation without requiring the esign policy acceptance; record a
  `lease_confirmation` acceptance instead (new key in `policies.js`).
- `server/utils/portfolio.js`: `awaiting_tenants` status and confirmed counts.

## 6. Frontend

- `src/features/owner/property/OnboardTenantsFlow.jsx` (route
  `/dashboard/properties/:id/onboard`), three steps, reuses the Documents
  upload for the lease file.
- `TenantsTab.jsx`: empty-state CTA, invite state badges, Resend/Edit/Cancel,
  "Confirmed" wording for imported leases.
- `OwnerDashboard.jsx`: `awaiting_tenants` badge and confirmed counts on cards.
- `src/features/auth/TenantInviteAccept.jsx` (route `/tenant-invite/:token`),
  modelled on `CosignerAcceptPage`.
- `AgreementView.jsx`: imported-lease copy, uploaded PDF link, "Confirm" button
  text for tenants.
- `src/services/tenantInvitesService.js`; `propertiesService.onboard(id, body)`.
- Header nudge for landlords with listed properties and no tenants: "Have
  tenants already? Add them to a property."

## 7. Edge cases and rules

- Email already registered as a student: link on accept after password or
  active session. Already registered as an owner or cosigner: refuse, ask for
  a different email. One account is one user type today.
- Tenant on two leases: allowed. `POST /payments/rent` currently pays the most
  recently approved application; the tenant dashboard should let them pick the
  lease when they have more than one. Note as a follow-up, not a blocker.
- Month-to-month leases: `monthToMonth: true`, end date rolls forward a year
  at a time by a small job later; v1 shows "Month-to-month" and hides the end
  date in tenant-facing copy.
- Household of one: still an agreement with one tenant signer; no rent split.
- Landlord edits after a tenant confirmed: blocked in v1 with a message to
  contact support; amendments are a later feature.
- Invite expiry: 14 days, reminder at 7. Expired invites can be resent.
- Deposits: the deposits screen already creates a `SecurityDeposit` for every
  fully signed agreement with `amountHeld = securityDeposit`, so the CA 21-day
  tooling works with no extra code once the household confirms.

## 8. Phasing and estimate

Phase 1, core, about four working days:

1. Schema: `ApplicationSource`, `AgreementSource`, `Agreement.monthToMonth`,
   `TenantInvite`, nullable `Application.applicantId` for onboarded rows (or
   placeholder), migration with no backfill needed.
2. `POST /properties/:id/onboard` with validation and tests on the pure parts
   (share validation, status math).
3. Tenant invite router: preview, accept, decline, resend, patch, cancel.
4. Emails.
5. Landlord flow page and Tenants tab states.
6. Tenant accept page and AgreementView wording.
7. Exclusions in Inbox, Applications tab and stats.
8. Local trial: onboard a two-person household on the embedded Postgres,
   accept both invites in the browser, pay rent as one tenant, open a
   maintenance ticket, check the rent roll and deposits screens.

Phase 2, polish, one to two days: reminder and expiry runner,
`awaiting_tenants` on the portfolio, prompt to delist on finish, uploaded
lease served from the PDF route, custom shares at onboarding.

Phase 3, later: CSV bulk import, past-payment backfill, month-to-month
roll-forward, lease amendments.

## 9. Acceptance criteria

- A landlord with an occupied unit can finish the flow in under five minutes
  without support.
- A tenant who has never used Rentra goes from email to a working Pay Rent
  screen with the right share in one pass.
- Onboarded households never appear in the Inbox or application funnels.
- Property status moves Listed → Invites sent → Leased with correct counts.
- Rent roll, deposits, autopay, rent split, utilities and maintenance all work
  for an imported lease with zero special-casing beyond wording.
- Nothing presents an imported lease as e-signed on Rentra.

## 10. Decisions needed before starting

1. Tenants must confirm before a property reads "Leased" (recommended), or the
   landlord's attestation alone is enough.
2. Nullable `applicantId` for onboarded member rows versus an owner
   placeholder until acceptance. Recommended: nullable, with the guard added
   where `applicant` is joined.
3. Month-to-month representation as described, or require an end date for v1.
4. Any fee on onboarded tenants. Recommended: none; this is the acquisition
   path, and the 2% rent fee question is already open.
