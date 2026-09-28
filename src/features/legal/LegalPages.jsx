import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Scale,
  FileText,
  ShieldCheck,
  PenLine,
  Search,
  DollarSign,
  Home,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { POLICY_VERSIONS, formatVersion } from './policyVersions'

/**
 * Tenant-facing legal pages.
 *
 * Status: DRAFT FOR COUNSEL REVIEW. Every page says so in its banner. The
 * text describes how Rentra actually works today (ledger-only rent records,
 * no money movement until Moov is live, Plaid verification, typed-name
 * e-signatures) so that counsel reviews the real product. Bracketed items
 * are decisions the founders or counsel must make. Versions live in
 * policyVersions.js (display) and server/utils/policies.js (gating); bump
 * both when the text changes materially.
 */

export const LEGAL_PAGES = [
  {
    key: 'terms',
    path: '/terms',
    title: 'Terms of Service',
    blurb: 'The agreement between you and Rentra for using the platform.',
    icon: FileText,
  },
  {
    key: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy',
    blurb: 'What we collect, why, who sees it, and your rights.',
    icon: ShieldCheck,
  },
  {
    key: 'esign',
    path: '/legal/esign',
    title: 'Electronic Records & Signatures',
    blurb: 'Your consent to sign leases and receive records electronically.',
    icon: PenLine,
  },
  {
    key: 'screening',
    path: '/legal/screening',
    title: 'Tenant Screening Disclosure',
    blurb: 'What verification runs, who sees it, and your FCRA rights.',
    icon: Search,
  },
  {
    key: 'fees',
    path: '/legal/fees',
    title: 'Fees & Payments',
    blurb: 'The screening fee, rent records, autopay, and what is not charged.',
    icon: DollarSign,
  },
  {
    key: 'rights',
    path: '/legal/tenant-rights',
    title: 'Your Rights as a California Renter',
    blurb: 'Deposits, screening fees, fair housing, and where to get help.',
    icon: Home,
  },
  {
    key: 'community',
    path: '/legal/community',
    title: 'Fair Housing & Community Guidelines',
    blurb: 'How everyone is expected to behave on Rentra.',
    icon: Users,
  },
]

function LegalShell({ title, policyKey, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
          <Link
            to="/legal"
            className="text-sm text-brand-600 hover:underline flex items-center gap-1"
          >
            <Scale size={14} /> All policies
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-xs text-gray-400 mb-4">
            Version {formatVersion(POLICY_VERSIONS[policyKey])} · Rentra
            (&quot;we&quot;, &quot;us&quot;) · myrentra.com
          </p>
          <div
            role="note"
            className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6"
            data-testid="counsel-banner"
          >
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              Draft pending review by counsel. This page explains how Rentra
              works and is general information, not legal advice. Bracketed
              items are still to be confirmed.
            </span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

LegalShell.propTypes = {
  title: PropTypes.string.isRequired,
  policyKey: PropTypes.oneOf(Object.keys(POLICY_VERSIONS)).isRequired,
  children: PropTypes.node,
}

function H({ children }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 mt-6">{children}</h2>
  )
}
H.propTypes = { children: PropTypes.node }

function UL({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
UL.propTypes = { items: PropTypes.arrayOf(PropTypes.node).isRequired }

/* ───────────────────────── Hub ───────────────────────── */

export function LegalHub() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
            <Scale size={20} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Legal &amp; your rights
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Everything you agree to on Rentra, in plain language, plus a summary
          of protections California renters have. Questions:{' '}
          <a href="mailto:support@myrentra.com" className="text-brand-600">
            support@myrentra.com
          </a>
          .
        </p>
        <div className="grid gap-3 sm:grid-cols-2" data-testid="legal-hub">
          {LEGAL_PAGES.map(page => {
            const Icon = page.icon
            return (
              <Link
                key={page.key}
                to={page.path}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={18} className="text-brand-500" />
                  <span className="font-semibold text-gray-900">
                    {page.title}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{page.blurb}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Version {formatVersion(POLICY_VERSIONS[page.key])}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Terms ───────────────────────── */

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service" policyKey="terms">
      <p>
        These Terms of Service (&quot;Terms&quot;) are a contract between you
        and Rentra for your use of myrentra.com and related services. By
        creating an account, or by continuing to use Rentra after we publish an
        updated version, you agree to them. If you do not agree, do not use
        Rentra.
      </p>

      <H>1. What Rentra is, and is not</H>
      <p>
        Rentra is a platform that helps renters find housing, apply alone or
        with roommates, verify income and identity, coordinate co-signers, sign
        leases, and keep household money records. Rentra is:
      </p>
      <UL
        items={[
          <>
            <strong>Not a party to your lease.</strong> Leases are between you
            and the property owner. We do not select tenants, negotiate lease
            terms, or guarantee that any listing, owner, or renter is who they
            say they are.
          </>,
          <>
            <strong>Not a real-estate broker or property manager.</strong> We do
            not collect rent on an owner&apos;s behalf, and we charge no fee to
            view listings.
          </>,
          <>
            <strong>Not a consumer reporting agency.</strong> Verification
            results are produced by third-party providers with your consent and
            shared with the owner you apply to (see the Tenant Screening
            Disclosure).
          </>,
          <>
            <strong>Not a bank or money transmitter.</strong> Today, rent
            &quot;payments&quot; recorded on Rentra are ledger entries you or
            your landlord create; no money moves through Rentra. If in-app bank
            payments launch, they will be governed by an additional payment
            agreement you accept at that time.
          </>,
        ]}
      />

      <H>2. Eligibility and accounts</H>
      <p>
        You must be at least 18 and able to enter a binding contract. Provide
        accurate information, keep your password private, and tell us promptly
        at support@myrentra.com if you believe your account was accessed without
        permission. You are responsible for activity under your account. We may
        suspend or close accounts that violate these Terms, the Community
        Guidelines, or the law.
      </p>

      <H>3. Applications, verification, and co-signers</H>
      <p>
        Everything you enter in your rental profile and applications is
        presented to owners as provided by you. Submitting false information,
        including false income, employment, or residence history, is grounds for
        account closure and may expose you to liability to the owner. Income and
        identity verification runs through Plaid only after you accept the
        Tenant Screening Disclosure. A co-signer you invite must create their
        own account and accept their own terms; you are responsible for having
        their permission to share their contact details with us.
      </p>

      <H>4. Roommate groups, rent splits, and bill splits</H>
      <p>
        Group applications create one application per member. Rent splits and
        utility bill splits are household bookkeeping tools: they record how you
        and your roommates have agreed to divide costs. They do not change who
        is legally responsible under your lease. If your lease makes all tenants
        jointly and severally liable, the owner may still look to any one of you
        for the full rent regardless of the split recorded here. Rentra does not
        collect debts between roommates and does not guarantee that anyone will
        pay their share.
      </p>

      <H>5. Fees</H>
      <p>
        The only fee Rentra charges renters today is the one-time screening fee
        described in Fees &amp; Payments. It is non-refundable once verification
        has run. We do not charge a fee to record a rent payment, set up a rent
        split, upload a bill, or schedule autopay. Any future fee will be shown
        before you are charged.
      </p>

      <H>6. Electronic signatures and records</H>
      <p>
        Lease signatures collected on Rentra are electronic signatures under the
        federal E-SIGN Act and California&apos;s UETA. Before you sign you will
        be asked for your Electronic Records &amp; Signatures consent. You and
        the owner are responsible for the legality and completeness of the lease
        terms you sign; Rentra provides the signing tool and the record, not the
        lease content.
      </p>

      <H>7. Your content and conduct</H>
      <p>
        You keep ownership of what you upload (profile details, bill images,
        messages) and give us a licence to store and display it to operate the
        service. Do not post content you have no right to share, and do not use
        Rentra to harass, discriminate, scrape data, send spam, or misrepresent
        yourself. Housemate profiles and messaging are subject to the Fair
        Housing &amp; Community Guidelines. We may remove content or restrict
        features to enforce these rules.
      </p>

      <H>8. Third-party services</H>
      <p>
        Rentra relies on providers such as Plaid (bank connection and
        verification), Cloudinary (file storage), and email delivery services.
        Their terms apply to their part of the service. We are not responsible
        for outages or errors in third-party services beyond our control.
      </p>

      <H>9. Disclaimers</H>
      <p>
        Rentra is provided &quot;as is&quot; and &quot;as available&quot;. We do
        not guarantee that listings are accurate, that an owner will approve
        your application, that any person is trustworthy, or that the service
        will be uninterrupted. Nothing on Rentra is legal, financial, or tax
        advice.
      </p>

      <H>10. Limitation of liability</H>
      <p>
        To the fullest extent the law allows, Rentra&apos;s total liability for
        any claim relating to the service is limited to the fees you paid us in
        the twelve months before the claim, and we are not liable for indirect,
        incidental, or consequential damages. Some jurisdictions do not allow
        these limits, in which case they apply only to the extent permitted.
        [Counsel: confirm cap and carve-outs under California law.]
      </p>

      <H>11. Disputes</H>
      <p>
        We would like to resolve problems informally first: write to
        support@myrentra.com. [Counsel: decide on governing law and venue,
        whether to include arbitration and a class-action waiver, and any
        small-claims carve-out. Nothing is in force until decided.]
      </p>

      <H>12. Changes and termination</H>
      <p>
        You may close your account at any time from your profile or by emailing
        support@myrentra.com. We may change these Terms; when we do, we update
        the version date above and ask you to review and accept the new version
        the next time you sign in. Material changes will not apply retroactively
        to a lease you already signed.
      </p>

      <H>13. Contact</H>
      <p>
        Rentra · support@myrentra.com · [Legal entity name and mailing address
        to be added.]
      </p>
    </LegalShell>
  )
}

/* ───────────────────────── Privacy ───────────────────────── */

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" policyKey="privacy">
      <p>
        This policy explains what Rentra collects, why, who can see it, and the
        choices you have. It applies to myrentra.com and related services. We do
        not sell your personal information, and we do not share it for
        cross-context behavioural advertising.
      </p>

      <H>1. What we collect</H>
      <UL
        items={[
          <>
            <strong>Account data:</strong> name, email, phone, university,
            account type, and a hashed password.
          </>,
          <>
            <strong>Rental profile and applications:</strong> residence and
            employment history, references, household details, emergency
            contact, standard disclosures, and any message you send an owner. We
            deliberately do not ask for your Social Security number or date of
            birth.
          </>,
          <>
            <strong>Verification data:</strong> when you connect a bank through
            Plaid we receive the results we need (account ownership, an income
            summary, identity match). Plaid access credentials are held on our
            servers only and are never sent to your browser.
          </>,
          <>
            <strong>Housemate profile:</strong> the lifestyle answers, budget,
            move-in month, age range and gender preferences you choose to share,
            and any block or report you file.
          </>,
          <>
            <strong>Money records:</strong> rent payments you record, rent
            splits, utility bills you upload (the file and its details), autopay
            schedules, and lease signature records.
          </>,
          <>
            <strong>Consent records:</strong> which version of each policy you
            accepted, when, and the network address and browser used.
          </>,
          <>
            <strong>Technical data:</strong> logs, device and browser
            information, and error reports (via Sentry) used for security and
            reliability.
          </>,
        ]}
      />

      <H>2. How we use it</H>
      <p>
        To run the service you asked for: matching you with housemates and
        listings, sending your applications, coordinating co-signers, signing
        leases, keeping household money records, sending the emails and
        reminders you set up (for example an autopay-day reminder or a bill
        share notice), preventing fraud and abuse, and meeting legal
        obligations. We do not use your data to train advertising profiles.
      </p>

      <H>3. Who sees what</H>
      <UL
        items={[
          <>
            <strong>Property owners</strong> see your application, rental
            profile answers, verification outcomes (for example income pass/fail
            against their criteria), and your co-signer&apos;s status and
            verified income, only for a property you applied to.
          </>,
          <>
            <strong>Roommates and group members</strong> see your name, the
            group chat, rent split shares, and the utility bills you share with
            them, including your share and whether it is paid.
          </>,
          <>
            <strong>Other renters</strong> see your housemate profile only if
            you created one, and only the fields you chose to share. Your email
            and phone stay private.
          </>,
          <>
            <strong>Service providers</strong> process data only to provide
            their service: Plaid (verification), Cloudinary (files), Resend or
            SendGrid (email), Sentry (error monitoring), Vercel and Railway
            (hosting), with data stored in a PostgreSQL database in the United
            States. Moov (payments) receives data only if in-app bank payments
            launch and you opt in.
          </>,
          <>
            <strong>Legal requests:</strong> we disclose data when the law
            requires it or to protect the safety of users.
          </>,
        ]}
      />

      <H>4. Cookies and local storage</H>
      <p>
        Rentra keeps you signed in with a token stored in your browser&apos;s
        local storage and uses session storage for small conveniences such as a
        dismissed banner. We do not use advertising cookies. If we add analytics
        we will update this policy first.
      </p>

      <H>5. Retention</H>
      <p>
        We keep your data while your account is active. After you close your
        account we delete or anonymise personal data within [90] days, except
        records we must keep longer: signed leases and their signature trail,
        payment ledger entries, consent records, and data needed to resolve
        disputes or comply with law. Verification results are kept no longer
        than needed for the application they supported and any reuse window the
        law allows.
      </p>

      <H>6. Security</H>
      <p>
        Traffic is encrypted in transit (TLS), passwords are hashed, and
        third-party access tokens are held server-side only. No system is
        perfectly secure; report concerns to security@myrentra.com.
      </p>

      <H>7. Your rights and choices</H>
      <p>
        Whether or not a particular privacy law applies to Rentra, we honour
        these requests from any user: access a copy of your data, correct it,
        delete your account and data (subject to the retention exceptions
        above), and receive a copy in a portable format. You can edit your
        rental and housemate profiles yourself at any time, disconnect a
        co-signer invitation, pause or delete your housemate profile, and turn
        off autopay. California residents also have the right not to be
        discriminated against for exercising these rights. Send requests to
        support@myrentra.com; we verify your identity through your account email
        and respond within [45] days.
      </p>

      <H>8. Children</H>
      <p>
        Rentra is for adults. We do not knowingly collect data from anyone under
        18 and will delete it if we learn we have.
      </p>

      <H>9. Changes</H>
      <p>
        When this policy changes materially we update the version date and ask
        you to review and accept it on your next visit. Contact:
        support@myrentra.com · [Legal entity name and address to be added.]
      </p>
    </LegalShell>
  )
}

/* ───────────────────────── E-sign ───────────────────────── */

export function EsignPage() {
  return (
    <LegalShell
      title="Electronic Records & Signatures Consent"
      policyKey="esign"
    >
      <p>
        Rentra lets you sign your lease and receive lease-related records
        electronically. Federal law (the E-SIGN Act) and California law (UETA)
        require that you agree to this first, and that we tell you what it
        means. You give this consent by checking the box on the signing screen;
        Rentra records the date, time, the name you typed, and the version of
        this notice.
      </p>

      <H>What you are agreeing to</H>
      <UL
        items={[
          'To sign your lease by typing your full legal name and confirming, which has the same effect as a handwritten signature.',
          'To receive the signed lease, signature confirmations, and related notices from Rentra electronically, in your account and by email to the address on file.',
          'That Rentra keeps a record of who signed, when, and from what network address, and attaches it to the lease PDF.',
        ]}
      />

      <H>What you need</H>
      <p>
        A current web browser with JavaScript enabled, an email address you can
        access, and the ability to view and save PDF files. If we ever change
        these requirements in a way that could stop you from accessing your
        records, we will tell you and ask for your consent again.
      </p>

      <H>Paper copies and withdrawing consent</H>
      <p>
        You can download your signed lease as a PDF at any time from Leases or
        the agreement page, free of charge. You may withdraw this consent for
        future documents by emailing support@myrentra.com; withdrawal does not
        undo a lease you already signed, and it means you and the owner will
        need to sign future documents outside Rentra.
      </p>

      <H>Keep your details current</H>
      <p>
        Update your email address in your profile so notices reach you. It is
        your responsibility to read the lease before signing; Rentra does not
        review or advise on lease terms.
      </p>
    </LegalShell>
  )
}

/* ───────────────────────── Screening ───────────────────────── */

export function ScreeningPage() {
  return (
    <LegalShell
      title="Tenant Screening Disclosure & Authorization"
      policyKey="screening"
    >
      <p>
        Before Rentra connects to your bank or runs any verification, you are
        asked to accept this disclosure. It explains what is checked, who
        receives the results, and your rights under the federal Fair Credit
        Reporting Act (FCRA) and California&apos;s Investigative Consumer
        Reporting Agencies Act (ICRAA).
      </p>

      <H>What runs today</H>
      <UL
        items={[
          <>
            <strong>Bank connection and identity match</strong> through Plaid:
            confirms the account is yours and that the name on it matches your
            profile.
          </>,
          <>
            <strong>Income summary</strong> through Plaid: an estimate of
            monthly income from deposits, shown to owners as a pass or fail
            against the rent-to-income rule they set, plus the verified amount.
            Housing vouchers you declare are counted the way California
            source-of-income law requires.
          </>,
          <>
            <strong>Not run today:</strong> credit reports, criminal background
            checks, or eviction history. If we add any of these, this disclosure
            will change and you will be asked to consent again before anything
            is pulled.
          </>,
        ]}
      />

      <H>Who receives the results</H>
      <p>
        The owner of each property you apply to, and only when you apply. Rentra
        acts on your instruction; the owner is the &quot;end user&quot; who
        decides on your application. Rentra does not decide whether you are
        approved.
      </p>

      <H>Reuse window</H>
      <p>
        You pay for screening once. Your verification results are reused for
        every application you send while they are current, consistent with
        California&apos;s reusable tenant screening report law (30 days). After
        that we may ask you to re-verify.
      </p>

      <H>Your rights</H>
      <UL
        items={[
          'You can see the same verification summary the owner sees, in your pre-qualification hub, at no charge.',
          'If an owner denies your application or asks for more (a co-signer, a larger deposit) based on these results, the owner must tell you so and identify the source, and you may dispute inaccurate information with the provider.',
          'You can disconnect your bank at any time by emailing support@myrentra.com; results already shared with an owner you applied to remain in that application.',
          'Verification data is used only for rental applications on Rentra and is not sold.',
        ]}
      />

      <H>Your authorization</H>
      <p>
        By checking the box in pre-qualification you authorise Rentra and its
        verification providers to obtain the information described above and to
        share the results with owners of properties you apply to, for the
        purpose of evaluating your rental application. [Counsel: confirm ICRAA
        §1786.16 wording, the free-copy mechanism, and whether a standalone FCRA
        disclosure form is needed once credit or background checks are added.]
      </p>
    </LegalShell>
  )
}

/* ───────────────────────── Fees ───────────────────────── */

export function FeesPage() {
  return (
    <LegalShell title="Fees & Payments" policyKey="fees">
      <p>
        This page lists every way money is, and is not, involved when you use
        Rentra as a renter.
      </p>

      <H>Screening fee</H>
      <p>
        A one-time <strong>$50</strong> screening fee is charged during
        pre-qualification after a successful bank connection. It covers the bank
        connection, income verification, and identity check, and is not
        refundable once verification has run. It is a screening fee, not a fee
        to view or apply to listings, and it is charged once no matter how many
        properties you apply to. California caps application screening fees and
        requires an itemised receipt; Rentra&apos;s fee is set below the cap and
        your receipt is in Payment History. [Founders: the fee is currently
        recorded but not charged to a card; finalise the payment processor
        before launch.]
      </p>

      <H>Rent records</H>
      <p>
        &quot;Record rent payment&quot; on your dashboard logs a payment you
        made to your landlord outside Rentra (bank transfer, check, cash, or
        another app). It creates a ledger entry that you and your landlord can
        both see. No money moves through Rentra and there is no fee. Your
        landlord can also record payments they receive. The ledger is a record,
        not a receipt from your landlord; keep your own proof of payment.
      </p>

      <H>Rent splits and utility bills</H>
      <p>
        Free. Splits divide amounts exactly to the cent and show each person
        their share. Marking a share paid is a bookkeeping action between
        roommates; Rentra does not move money between you.
      </p>

      <H>Autopay</H>
      <p>
        Setting up autopay stores a standing instruction: the amount, the day of
        the month, and your authorization. Until in-app bank payments launch,
        autopay does not debit anything; on your autopay day Rentra emails you a
        reminder. When bank payments launch, we will show you the payment terms
        and any fee before your schedule is switched on for real debits, and
        your Autopay Authorization allows Rentra to initiate recurring debits
        from the bank account you link for the amount and day you chose. You can
        pause, change, or cancel autopay at any time from your dashboard; a
        cancellation takes effect for the next scheduled date. [Counsel:
        finalise Reg E recurring-debit authorization text and NACHA notice
        periods before ACH goes live.]
      </p>

      <H>Security deposits</H>
      <p>
        Rentra never holds your security deposit. Deposits are paid directly to
        your landlord under the terms of your lease. See Your Rights as a
        California Renter for the legal limits on deposits.
      </p>

      <H>Refunds and disputes</H>
      <p>
        Write to support@myrentra.com within 30 days of any charge you believe
        is wrong. The screening fee is non-refundable once verification ran, but
        we will refund it if verification never completed because of an error on
        our side.
      </p>
    </LegalShell>
  )
}

/* ───────────────────────── Tenant rights ───────────────────────── */

export function TenantRightsPage() {
  return (
    <LegalShell title="Your Rights as a California Renter" policyKey="rights">
      <p>
        Rentra is built for student housing in California. This is a plain
        language summary of protections that come up most often. Laws change,
        many cities add stronger local rules, and only a lawyer or a tenant
        rights organisation can advise you on your situation. [Counsel: verify
        each item and the dollar figures before launch; consider adding local
        city rules for San Diego.]
      </p>

      <H>Application screening fees</H>
      <p>
        A landlord may charge a screening fee only to cover actual screening
        costs, up to a cap that is adjusted each year for inflation, and must
        give you an itemised receipt. You may ask for a copy of any consumer
        report the landlord obtained. California also lets landlords accept a
        reusable screening report that is no more than 30 days old instead of
        charging you again.
      </p>

      <H>Security deposits</H>
      <UL
        items={[
          'Since July 1, 2024 most landlords may collect at most one month’s rent as a security deposit (furnished or not). Landlords who own no more than two residential properties with four or fewer units in total may collect up to two months’ rent, unless you are a service member.',
          'Within 21 days after you move out, the landlord must return the deposit or send an itemised statement of deductions, with receipts for repairs over $125.',
          'Deductions are limited to unpaid rent, cleaning to the condition at move-in, and repair of damage beyond normal wear and tear. You may request an initial inspection before you move out so you can fix issues first.',
          'Some cities require landlords to pay interest on deposits.',
        ]}
      />

      <H>Fair housing and source of income</H>
      <p>
        Federal and California law prohibit discrimination in housing based on
        race, colour, national origin, religion, sex, gender identity, sexual
        orientation, disability, familial status, marital status, age, ancestry,
        source of income (including housing vouchers), and other protected
        characteristics. A landlord who accepts vouchers must count the voucher
        when assessing whether you can afford the rent. Landlords must allow
        reasonable accommodations and assistance animals for disabilities.
        Report suspected discrimination to the California Civil Rights
        Department or HUD.
      </p>

      <H>Rent increases and eviction protections</H>
      <p>
        Many California tenancies are covered by the Tenant Protection Act (AB
        1482), which caps annual rent increases and requires &quot;just
        cause&quot; to end a tenancy after 12 months. Exemptions exist (for
        example some single-family homes and newer buildings), and several
        cities have stronger rent stabilisation ordinances. Check whether your
        building is covered before agreeing to an increase.
      </p>

      <H>Repairs and habitability</H>
      <p>
        Your landlord must keep the unit habitable: working plumbing, heat,
        electricity, weatherproofing, and freedom from pests. Report problems in
        writing (Rentra&apos;s Maintenance tab creates a dated record). A
        landlord may not retaliate against you for requesting repairs or
        exercising your rights.
      </p>

      <H>Roommates and joint leases</H>
      <p>
        If everyone signs one lease, each of you is usually liable for the whole
        rent (&quot;joint and several&quot;). A rent split on Rentra is an
        agreement between roommates and does not change that. Consider a written
        roommate agreement covering shares, utilities, and what happens if
        someone leaves early.
      </p>

      <H>Where to get help</H>
      <UL
        items={[
          'California Department of Consumer Affairs guide, “California Tenants”.',
          'California Civil Rights Department (housing discrimination).',
          'Your university’s student legal services or off-campus housing office.',
          'Local tenant rights organisations and legal aid (for San Diego, the Legal Aid Society of San Diego).',
        ]}
      />
    </LegalShell>
  )
}

/* ───────────────────────── Community ───────────────────────── */

export function CommunityPage() {
  return (
    <LegalShell
      title="Fair Housing & Community Guidelines"
      policyKey="community"
    >
      <p>
        Rentra connects people who will live together or rent from one another.
        These guidelines apply to housemate profiles, group chats, messages,
        listings, and applications. Breaking them can lead to content removal,
        feature limits, or account closure.
      </p>

      <H>Fair housing applies to everyone</H>
      <p>
        Owners may not screen, advertise, or communicate in a way that
        discriminates on a protected characteristic, and renters may not ask for
        or exclude housemates on those grounds either, with the narrow exception
        the law allows for choosing who shares your own bedroom or single
        dwelling. Rentra&apos;s housemate filters for age range and gender are
        offered within that exception and must not be used to exclude someone
        from a whole-unit lease. Source of income, including housing vouchers,
        is protected.
      </p>

      <H>Be honest</H>
      <p>
        Use your real name and accurate information. Do not misrepresent your
        income, residence history, or who will live in the unit. Do not create
        more than one account or act on someone else&apos;s behalf without
        permission.
      </p>

      <H>Be respectful and safe</H>
      <UL
        items={[
          'No harassment, threats, hate speech, sexual content, or discriminatory remarks.',
          'Meet potential housemates in public first, never pay a deposit before seeing a place and meeting the owner, and keep conversations on Rentra until you trust someone.',
          'Use Block to stop someone contacting you and Report to tell us about a problem; blocked users cannot message you or appear in your matches.',
          'Do not share another person’s private information (address, phone, documents) without their consent.',
        ]}
      />

      <H>No scraping, spam, or scams</H>
      <p>
        Do not collect data from Rentra with bots, send unsolicited commercial
        messages, or use the platform for any scheme that asks users to send
        money outside the process described in Fees &amp; Payments.
      </p>

      <H>Reporting</H>
      <p>
        Report a user from their profile or write to support@myrentra.com. We
        review reports, may contact both parties, and act on what we find. We
        cooperate with law enforcement when required.
      </p>
    </LegalShell>
  )
}
