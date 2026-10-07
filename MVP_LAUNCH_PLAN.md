# Rentra — MVP Launch Plan

_Last updated: 2026-07-01. Grounded in the actual deployed code state (myrentra.com +
rentra-production.up.railway.app). Companion to `LANDLORD_MVP_PLAN.md`._

---

## 1. What "launchable MVP" means for Rentra

**One real landlord can list a property, and one real group of tenants can go from
application to a signed lease with verified cosigners — without hitting a dead end,
a fake screen, or a legal landmine.**

The differentiator to launch on is the **cosigner/guarantor flow** (invite → accept →
Plaid income verification → landlord sees pass/fail math). It is built, deployed, and
nobody else has it. Rent _collection_ (real money movement) is NOT required for v1 —
see the scope decision in §3.

### What already works end-to-end (deployed)

| Flow                                                                           | Status                    |
| ------------------------------------------------------------------------------ | ------------------------- |
| Register / login / browse / search                                             | ✅ Live                   |
| Pre-qualification (Plaid bank/income/identity)                                 | ✅ Live (sandbox)         |
| Apply with screening data (employment, references)                             | ✅ Live                   |
| Cosigner: invite → email → accept page → Plaid income → landlord scoring       | ✅ Live                   |
| Landlord: listings, Inbox (real applicants + income pass/fail), approve/reject | ✅ Live                   |
| Lease auto-created on approval → both parties sign                             | ✅ Live                   |
| Rent payment (ledger entry + 2% fee) + payment history                         | ✅ Live (no real ACH yet) |
| Maintenance tickets, groups + chat, utility bill split, housemates             | ✅ Live                   |
| Messaging tenant ↔ landlord                                                   | ✅ Backend live           |

---

## 2. Launch blockers (P0) — must fix before inviting real users

### P0-1. Security hardening (1–2 days)

- **`JWT_SECRET` unsafe fallback** (`server/utils/auth.js:8`) — if the env var is ever
  missing, every token is signed with a public string. Fail hard at boot instead:
  `if (!process.env.JWT_SECRET) throw`.
- **Plaid access tokens returned to the frontend** (`payments.js` exchange-token) —
  move storage server-side (encrypted column or at minimum server-held), never ship
  them to the browser.
- Set real values in Railway/Vercel for: `JWT_SECRET`, `SESSION_SECRET`,
  `SENDGRID_API_KEY`, `CLIENT_URL=https://myrentra.com`, Cloudinary, Plaid, Moov keys.
- Verify rate limiting is on in prod (`RATE_LIMIT_*`).

### P0-2. Email must actually send (0.5 day)

The cosigner flow's entry point is an email. `sendEmail()` silently logs to console if
`SENDGRID_API_KEY` is unset. **Verify in prod**: configure the key + verified sender
domain (myrentra.com SPF/DKIM), send a real cosigner invite, click the link on a phone.
Also implement the two TODO emails: password-reset send and cosigner-decline notice.

### P0-3. Hide or gate the remaining mock screens (0.5 day)

Six landlord screens are still routed and render **fake data with non-functional
buttons**: Banking & Bookkeeping, Tax Center, Security Deposits, Disputes, Document
Manager, Inspections (plus Rent Collection). A real landlord clicking "Export Schedule E"
and getting nothing destroys trust (the exact failure mode that killed Buildium/Livable
adoption). For v1: **remove them from nav/routes or badge them "Coming soon"** with the
buttons disabled. Do not ship silent fakes.

### P0-4. Legal minimum (1–2 days, needs founder/lawyer input)

- **Terms of Service + Privacy Policy** pages (Plaid requires a privacy policy to grant
  production access; you're processing financial data).
- **Fair Housing sweep**: final pass removing "student-only" targeting from
  landlord-facing copy (positioning: co-signer & roommate management). Marketing _to_
  students is fine; steering landlords is not.
- Cookie/consent basics if analytics are added.

### P0-5. Plaid production access (starts now — external lead time)

Everything runs in **sandbox** (`PLAID_ENV=sandbox`). Real users can't link real banks
until Plaid approves production access (application + security questionnaire; typically
1–3 weeks). **Apply immediately** — it's the longest external dependency. Until granted,
income verification can stay "sandbox demo" for pilot users, but the launch date
effectively keys off this.

### P0-6. Critical-path QA (2–3 days)

Manually run the golden path on production with throwaway accounts, both roles,
mobile + desktop:

1. Landlord registers → creates listing (photos upload) →
2. Tenant registers → pre-qualifies → applies → invites cosigner →
3. Cosigner receives real email → accepts → verifies income →
4. Landlord sees applicant + pass/fail in Inbox → approves →
5. Both sign the lease → tenant records a rent payment → history shows it →
6. Tenant files a maintenance ticket → landlord sees it.

Fix everything that breaks. Add one Playwright smoke test for this path so deploys
can't silently regress it (nice-to-have if time-boxed).

### P0-7. Ops safety net (0.5 day)

- **Railway Postgres backups** enabled + one restore drill.
- **Error tracking** (Sentry free tier, frontend + backend).
- **Uptime check** on `/health` and myrentra.com (UptimeRobot/BetterStack free).
- Fix DNS niceties: `www.myrentra.com` doesn't resolve — add redirect to apex.

**P0 total: ~1.5–2 weeks of work, gated externally by Plaid production approval.**

---

## 3. The big scope decision: real money in v1?

Today "Pay Rent" records a **ledger transaction** (amount + 2% fee) but moves no money.
Moov transfer APIs are wired but not production-onboarded; webhooks are stubbed, so
async payment states would never reconcile.

**Recommendation: launch v1 as a _rent ledger_, not a payment processor.**

- Rename the button "Record payment" / add "Paid outside Rentra — mark as paid".
  Honest, useful (the rent-roll and history still work), zero money-transmission risk.
- Run **Moov production onboarding in parallel** (KYC/underwriting — weeks, like Plaid).
- Ship real ACH in **v1.1** with: webhook reconciliation, idempotency, refunds path,
  and the pending-charge/error-correction UX from the PM research.

Launching real rent collection prematurely is the highest-risk move available; a ledger
is what the pilot landlord needs on day one anyway.

---

## 4. Launch-hardening (P1) — first 2–3 weeks after P0, before/at pilot

1. **Landlord Rent Collection screen → wire to real data** (rent-roll + payment-status
   APIs exist; ~700-line mock). This is the last big fake screen a pilot landlord uses.
2. **Password reset end-to-end** (email now sends; verify the full loop).
3. **Notifications**: application received / approved / lease ready / signed — email
   templates exist, add the trigger calls.
4. **Empty states + onboarding**: first-run experience for a landlord with 0 listings
   and a tenant with 0 applications (cold-start polish).
5. **Lint debt**: `npm run lint` still fails on ~1,300 unused-var warnings with
   `--max-warnings=0` — either fix or relax the script so CI can gate on it.
6. **Group polish**: leave/role actions, accept-invite UI (backend exists for join).
7. **Analytics**: basic funnel events (signup → apply → cosigner accept → lease signed)
   so you can measure the moat.

---

## 5. Post-launch roadmap (P2) — sequenced by the customer research

1. **Real ACH rent collection** (Moov production + webhooks + reconciliation) — v1.1.
2. **Security-deposit compliance engine** (CA 21-day countdown, itemized deductions,
   refund letter) — AppFolio table stakes, spec in `LANDLORD_MVP_PLAN.md`.
3. **Error-correction + pending-charge approval + audit trail** — the trust features.
4. **E-signature upgrade** (DocuSign/HelloSign) — typed-name signing works for v1;
   upgrade for enforceability optics.
5. **Recurring rent / auto-pay + reminders (Twilio SMS)**.
6. **Listing syndication** (Zillow/Apartments.com) — lead gen.
7. **Credit/background checks** (TransUnion SmartMove/Checkr) — fills the "N/A" fields
   already in the schema and Inbox UI.
8. **Real Tax Center / Banking / Disputes** — un-hide as each becomes real.

---

## 6. Go-to-market shape (from `CUSTOMER_DISCOVERY_SAN_DIEGO_PM.md`)

- **Pilot**: 1–3 property managers in college towns managing 5–20 multi-tenant units
  (the interviewed San Diego PM is the archetype — re-engage them).
- **Pitch**: "Stop processing 8 applications for one house. Rentra bundles roommates +
  auto-verifies cosigner income in days, not weeks." Lead with the moat, not payments.
- **Success metrics**: application→lease time (target 1–3 days vs 7–14), cosigner
  completion rate, pilot landlord retention after first lease.
- **Cold start**: seed the pilot landlord's real listings by hand (concierge onboarding);
  don't launch an empty marketplace page.

---

## 7. Launch checklist (condensed)

Status refreshed 2026-10-06 against the code on `main`. Engineering items are
done; what remains is external (Plaid, Moov, counsel) or a dashboard task only
the founder can do.

**Engineering (done)**

- [x] JWT_SECRET hard-fail (`server/utils/auth.js` throws at boot) (P0-1)
- [x] Plaid access tokens held server-side, never returned to the browser (P0-1)
- [x] Rate limiting on in prod, env-tunable (`RATE_LIMIT_*`) (P0-1)
- [x] Email provider wired: Resend primary, SendGrid fallback (`server/utils/email.js`) (P0-2)
- [x] Password-reset + cosigner-decline emails implemented (P0-2)
- [x] Mock screens gone: every landlord tool is real; only Disputes is Coming Soon, and
      `/dashboard/approvals` redirects to the Inbox (P0-3)
- [x] Terms, Privacy, E-sign, Screening, Fees, Tenant Rights and Fair Housing pages live under
      `/legal`, consent captured in `PolicyAcceptance`, re-acceptance banner on version bump (P0-4)
- [x] Golden path scripted: `e2e/golden-path.mjs` (19 API steps) plus Playwright smoke (P0-6)
- [x] "Pay Rent" is a ledger: tenant button reads "Record rent payment", no service fee, no money
      moves (scope decision §3)
- [x] Sentry initialised in `server/instrument.js` (no-op until `SENTRY_DSN` is set) (P0-7)
- [x] Existing-tenant onboarding, lease lifecycle (end/renew/amend, tenant notice, rent-increase
      notice), rent ledger + automatic late fees, inspections, maintenance threads, in-app
      notifications, team access, portfolio reports, multi-unit buildings, CSV import

**Founder / external (open)**

- [ ] Prod secrets set and confirmed in Railway/Vercel: `JWT_SECRET`, `CLIENT_URL`, Resend or
      SendGrid key, Cloudinary, Plaid, `SENTRY_DSN` (P0-1, P0-7)
- [ ] Send one real cosigner invite and one tenant invite from prod and open them on a phone;
      confirm SPF/DKIM on myrentra.com (P0-2)
- [ ] Counsel review of the seven `/legal` drafts (bracketed decisions inside each page) and the
      money-movement checklist; final Fair Housing copy sweep of landlord-facing marketing (P0-4)
- [ ] Plaid production application submitted → approved (P0-5)
- [ ] Moov production onboarding started (parallel, for v1.1)
- [ ] Golden-path QA on prod, both roles, mobile: `SMOKE_API_URL=https://rentra-production.up.railway.app/api GP_LANDLORD_EMAIL=… GP_LANDLORD_PASSWORD=… GP_TENANT_EMAIL=… GP_TENANT_PASSWORD=… node e2e/golden-path.mjs`, then check both inboxes for the emails (P0-6)
- [ ] Railway Postgres backups on + one restore drill; uptime check on `/health` and
      myrentra.com; `www.myrentra.com` → apex redirect (P0-7)
- [ ] Delete the junk prod listing "dsfd" (id cmqt29xje0005rv01vj72igtr)
- [ ] Pilot landlord committed + real listings seeded (§6)

**Product gaps that wait on a vendor (not launch blockers)**

- Credit/background reports (CRA vendor; schema + Inbox slots exist, credit score shows N/A)
- Real ACH rent collection and deposit refunds (Moov production + webhook signatures, v1.1)
- Listing syndication (Zillow / Apartments.com)
- Disputes workspace

**Realistic timeline: ~2 weeks of engineering + Plaid approval lead time → pilot launch
in 3–4 weeks. Real rent collection (v1.1) ~4–6 weeks behind that.**
