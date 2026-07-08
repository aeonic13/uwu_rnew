# Landlord MVP Plan — Ground-Truth Capabilities, Gaps & Roadmap

_Last updated: 2026-06-29. This doc reflects the **actual code state**, not aspirational status.
It supersedes the optimistic framing in `LANDLORD_FEATURES_AUDIT.md`._

> **Update 2026-07-08 — landlord portion feature-complete.** Everything below
> describing Rent Collection / Security Deposits / Banking / Tax / Documents /
> landlord maintenance as "mock" is now historical. Shipped and wired to real
> APIs: **Rent Collection** (`/dashboard/rent-collection`: live rent roll,
> record offline payments, email reminders, per-lease history),
> **Security Deposits** (`/dashboard/security-deposits`: state-aware refund
> countdown incl. CA 21-day Civ. Code 1950.5, itemized deductions, printable
> disposition letter, refund recording; `SecurityDeposit`/`DepositDeduction`
> models), **Bookkeeping** (`/dashboard/banking`: `Expense` model, Schedule E
> categories, income/expense summary), **Tax Center** (`/dashboard/tax`:
> yearly Schedule E rollup + CSV export), **Documents**
> (`/dashboard/documents`: Cloudinary-backed `Document` model),
> **landlord maintenance tab** (live tickets, assign/complete), plus the
> long-missing **application received/decision emails**. Still gated behind
> ComingSoon: Approvals workspace (Inbox covers it), Disputes, Inspections.
> Still v1.1: real ACH via Moov production + webhook signatures; analytics
> trends need real history.

---

## 1. The core problem

Rentra has **two halves that aren't connected**:

- A **real backend** that can run a rental pipeline (listings, applications, cosigner
  records, messaging, Moov payments, and a landlord dashboard API).
- A **landlord-facing UI that is ~90% mock screens** rendering hardcoded `useState`
  data instead of calling that backend.

The single highest-leverage work is **not building new features** — it's **wiring the
screens that already exist to the APIs that already exist.** Example: `dashboard.js`
exposes a working `/landlord/rent-roll` endpoint, but until now no screen called it.

> **Reality check vs. `LANDLORD_FEATURES_AUDIT.md`:** that doc claims "80% complete, 12
> features fully built," counting backend models. From the **landlord's seat**, the honest
> number is closer to **~20% usable** today. Tax Center, Banking & Bookkeeping, Rent
> Collection, Security Deposits, Disputes, Approvals — all listed as "built" — are **mock UI**.

---

## 2. What a landlord can actually do today

| Capability                                                     | Real?                            | Notes                                                                                      |
| -------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| Create / edit a listing (photos, rent, amenities)              | ✅ Yes                           | Only fully-real owner feature. Photos → Cloudinary; submit → `POST /listings`.             |
| Receive applications (persist in DB)                           | ✅ Backend                       | Tenants apply; `Application` rows created.                                                 |
| Approve/reject an application (auto-creates lease `Agreement`) | ⚠️ API only                      | `PUT /applications/:id/status` works; the approval **screen is mock** and doesn't call it. |
| View real portfolio rent roll                                  | ✅ **Now wired**                 | `OwnerDashboard` now reads `/dashboard/landlord/rent-roll` (see §4).                       |
| Cosigner / guarantor verification                              | ⚠️ Backend only, **flow broken** | See §5 — the emailed accept link has no frontend route; no income scoring.                 |
| Message applicants/tenants                                     | ✅ Backend                       | Real API; `LandlordInbox` UI still shows mock threads.                                     |
| Collect a one-off ACH payment                                  | ⚠️ Partial                       | Moov transfer is real; no recurring rent, no history, webhooks stubbed.                    |

**Mock-only screens** (render but do nothing): Owner Dashboard tabs beyond overview/rent-roll,
Landlord Inbox, Rent Collection, Banking & Bookkeeping, Tax Center, Security Deposit Manager,
Lease Approval Center, Document Manager, Dispute Resolution. Plus ~10 **orphaned/unrouted**
owner components.

---

## 3. Property-owner painpoints (from the San Diego PM interview) → status

| Painpoint (validated)                                                                 | Rentra answer                            | Honest status                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| "Qualifying a cosigner is as much work as a tenant" — 8 manual reviews/house, 1–2 wks | Token invite + Plaid income verification | 🟡 Backend real, **end-to-end broken** (no accept page, no scoring) |
| 7-tool "Frankenstein stack," $5,460/yr                                                | One dashboard replaces all               | 🔴 Consolidation screens are mock                                   |
| Can't trust automation (Buildium locked ledgers; Livable mischarged)                  | —                                        | 🔴 No edit/delete+audit, no pending-charge approval                 |
| Security-deposit compliance (CA 21-day, itemized, refund letter)                      | Security Deposit Manager                 | 🔴 Mock only                                                        |
| Lead generation (Zillow/Apartments.com syndication)                                   | —                                        | 🔴 Not built                                                        |
| Maintenance at 11 PM ("where's my fix?")                                              | —                                        | 🔴 No ticketing/vendor routing                                      |
| Fair Housing risk in "student" marketing                                              | Reposition to co-signer/roommate         | 🟡 UI language partly removed; positioning only                     |

---

## 4. The wiring pattern (already proven on OwnerDashboard)

A reusable recipe to convert a mock screen to live, implemented in `src/OwnerDashboard.jsx`:

1. Add a method to a service in `src/services/` (e.g. `dashboardService.getRentRoll()`).
2. Keep the existing mock object as the **initial state** (so the screen never breaks and
   demos still render).
3. `useEffect` → fetch → **map the API response into the screen's render shape**, filling
   visual-only fields with safe defaults → `setState`.
4. Fall back to demo on 401/403/network error (non-owners, logged-out, offline).
5. Show a **Live / Demo** badge so it's never ambiguous which data is real.

**Apply this next to:** Landlord Inbox (`/messages/conversations` + `/applications`),
Lease Approval (`PUT /applications/:id/status`), Rent Collection (`/dashboard/rent-roll`

- `/payment-status/:id`). These all have working backends today.

---

## 5. Cosigner feature — end-to-end audit & the missing auto-scoring

**The moat is backend-only and the journey is broken.** Backend `cosigners.js` (~650 lines)
is genuinely complete: invite (real DB + SendGrid email), accept/decline by token, list per
application, "my-responsibilities." Plaid income verification is real. **But:**

1. 🔴 **The emailed accept link is dead.** Backend sends `${CLIENT_URL}/cosigner/accept/:token`,
   but **no frontend route/page exists** for it. A cosigner cannot accept. _(src/routes/index.jsx)_
2. 🔴 **No tenant UI to invite a cosigner.** `ParentGuardianManager.jsx` is family-payments
   mock; `GuarantorVerificationFlow.jsx` is 100% mock — neither calls `POST /api/cosigners/invite`.
3. 🔴 **Income auto-scoring does not exist anywhere.** No 4–5× rent rule, no pass/fail. The
   `LandlordInbox` shows `meetsRequirement: true` **hardcoded**. This is the stated #1
   differentiator — and it's not built.
4. 🔴 **Verified income is never persisted.** `Application.verificationData` (JSON) exists but
   is never populated; the `Cosigner` model has no income field.
5. 🔴 **Landlord sees no real cosigner data** — `cosigners/application/:id` is never called.

### Spec — Cosigner income auto-scoring (the missing differentiator)

**Goal:** when a cosigner's income is verified via Plaid, automatically compute and display
**pass/fail against a landlord-configurable income multiple**, with the math shown (the PM
explicitly said: don't show a black box — show the work).

**Data model**

```prisma
// Listing: landlord-configurable requirement
model Listing {
  // ...
  incomeMultiplier Float @default(3.0)   // e.g. 3x–5x monthly rent
}

// Cosigner: persist the verified result
model Cosigner {
  // ...
  verifiedMonthlyIncome Float?
  incomeVerifiedAt      DateTime?
  meetsRequirement      Boolean?   // computed at verification time
}
```

**Backend** — add to the Plaid income-verification handler (or a new
`POST /api/cosigners/:id/verify-income`):

```
incomeResult   = plaid.summarizeIncome(...)        // already exists
monthlyIncome  = incomeResult.totalMonthlyIncome
required       = listing.price * listing.incomeMultiplier
meets          = monthlyIncome >= required
// persist verifiedMonthlyIncome, incomeVerifiedAt, meetsRequirement on Cosigner
// also store the raw result in Application.verificationData
```

**Frontend (landlord view)** — render the transparent calculation, never a bare verdict:

> ✅ **Approved** — Parent income **$10,000/mo** ≥ **$8,000** required (rent $2,000 × 4)

**Acceptance criteria**

- Landlord can set the income multiple per listing (default 3×).
- After Plaid verification, cosigner row shows verified income, the requirement math, and a
  pass/fail badge.
- `LandlordInbox` reads real cosigner data via `GET /api/cosigners/application/:id`.

### Cosigner fix sequence (ship the moat)

1. Add `/cosigner/accept/:token` route + page (calls `GET /cosigners/invitation/:token`,
   then `POST /cosigners/accept/:token`). _Unblocks the entire flow._
2. Add tenant "Invite cosigner" UI → `POST /api/cosigners/invite`.
3. Build the income auto-scoring above (model + compute + persist).
4. Wire `LandlordInbox` to real cosigner + application data.

---

## 6. Prioritized roadmap

### Tier 1 — Make the dashboard a product, not a demo (highest leverage)

1. **Wire existing screens to existing APIs** (pattern in §4). Start: Landlord Inbox, Lease
   Approval, Rent Collection. _Backends already work._
2. **Fix the cosigner end-to-end flow** (§5 steps 1–4) — including income auto-scoring. _The moat._
3. **Real rent collection:** recurring rent, payment-history view, and **webhook
   reconciliation** (currently stubbed — async payments never update status).

### Tier 2 — AppFolio table stakes

4. Security-deposit compliance engine (state-aware countdown, itemized deductions, refund letter, ACH refund).
5. Error correction + pending-charge approval (the trust features that killed Buildium/Livable).
6. E-signature integration (DocuSign/HelloSign — model has the flags, no signing).
7. Maintenance ticketing (model + vendor routing + status notifications).

### Tier 3 — Growth

8. Listing syndication (Zillow/Apartments.com) for lead-gen.
9. Automated late fees (human-in-the-loop) + payment reminders (needs SMS/Twilio) + mass announcements.

---

## 7. Bottom line

- **The moat is real but unshipped:** automated cosigner + Plaid income verification works on
  the backend, but a cosigner can't even accept (dead link) and there's no income scoring.
- **The landlord product is mostly theater:** polished screens over fake data; only listing
  creation (and now the dashboard rent-roll) are real.
- **Fastest path to a real MVP = connect what's built**, then ship the cosigner flow + scoring.
  That sequence turns the demo into a product before any net-new feature work.
