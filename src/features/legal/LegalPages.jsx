import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Terms of Service and Privacy Policy.
 *
 * DRAFT template content — reviewed-by-a-lawyer status: NOT YET. These pages
 * exist so (a) users see real terms at signup, and (b) Plaid production
 * access has the required public privacy-policy URL. Replace bracketed
 * placeholders and have counsel review before marketing launch.
 */

const EFFECTIVE_DATE = 'July 2, 2026'

function LegalShell({ title, children }) {
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-xs text-gray-400 mb-6">
            Effective {EFFECTIVE_DATE} · Rentra ("we", "us")
          </p>
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
  children: PropTypes.node,
}

function H({ children }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 mt-6">{children}</h2>
  )
}
H.propTypes = { children: PropTypes.node }

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        These Terms of Service ("Terms") govern your use of Rentra
        (myrentra.com), a platform connecting renters, roommate groups,
        co-signers, and property owners. By creating an account or using Rentra
        you agree to these Terms.
      </p>
      <H>1. The service</H>
      <p>
        Rentra provides tools for rental discovery, applications, tenant
        screening (including income and identity verification via Plaid),
        co-signer coordination, lease signing, and rent record-keeping. Rentra
        is a platform, not a party to any lease: rental agreements are between
        tenants and property owners. Rentra is not a broker, credit reporting
        agency, or (in the current version) a money transmitter — rent
        "payments" recorded on Rentra are ledger entries unless in-app payments
        are explicitly offered.
      </p>
      <H>2. Accounts</H>
      <p>
        You must provide accurate information, keep your credentials secure, and
        be at least 18. You are responsible for activity on your account. We may
        suspend accounts that violate these Terms or applicable law.
      </p>
      <H>3. Fair housing & acceptable use</H>
      <p>
        Users must comply with the Fair Housing Act and applicable state law.
        Discriminatory listings, screening criteria, or communications are
        prohibited. No harassment, fraud, scraping, or misrepresentation
        (including false rental applications or income claims).
      </p>
      <H>4. Screening & verifications</H>
      <p>
        Income and identity verification is performed with your consent through
        Plaid. Self-reported information (rental history, disclosures) is
        presented to landlords as provided by you. The one-time screening fee is
        non-refundable once verification has run.
      </p>
      <H>5. Electronic signatures</H>
      <p>
        Lease signatures collected on Rentra are intended as electronic
        signatures under the E-SIGN Act and UETA. Parties are responsible for
        the legality of their lease terms in their jurisdiction.
      </p>
      <H>6. Disclaimers & liability</H>
      <p>
        Rentra is provided "as is" without warranties. To the maximum extent
        permitted by law, Rentra's aggregate liability is limited to the fees
        you paid us in the twelve months before the claim. We do not guarantee
        the conduct, identity, or creditworthiness of any user.
      </p>
      <H>7. Termination & changes</H>
      <p>
        You may close your account at any time. We may update these Terms with
        notice; continued use constitutes acceptance. Contact:
        support@myrentra.com. Governing law: [State — TO BE CONFIRMED BY
        COUNSEL].
      </p>
      <p className="text-xs text-gray-400">[DRAFT — pending legal review]</p>
    </LegalShell>
  )
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This Privacy Policy explains what Rentra collects, why, and your
        choices. It applies to myrentra.com and related services.
      </p>
      <H>1. What we collect</H>
      <p>
        <strong>Account data:</strong> name, email, phone, user type.{' '}
        <strong>Rental application data</strong> you provide: residence and
        employment history, references, household details, and standard
        disclosures. <strong>Financial verification data:</strong> when you
        connect a bank through Plaid, we receive verification results (e.g.
        account ownership, income summaries). Plaid access credentials are held
        server-side and never exposed to your browser; see Plaid's privacy
        policy at plaid.com/legal. We deliberately do <em>not</em> collect your
        SSN or date of birth. <strong>Usage data:</strong> logs and device
        information for security and reliability.
      </p>
      <H>2. How we use it</H>
      <p>
        To operate the platform: matching, applications, co-signer coordination,
        lease signing, rent records, and communications you request (e.g.
        invitation emails). We do not sell your personal information.
      </p>
      <H>3. What landlords see</H>
      <p>
        When you apply to a property (individually or as a group), the listing's
        owner sees your application, your rental-profile answers, verification
        outcomes (e.g. income pass/fail), and your co-signer's status and
        verified income. This sharing is the purpose of the product and happens
        only when you apply.
      </p>
      <H>4. Service providers</H>
      <p>
        We use Plaid (bank verification), Moov (payments infrastructure),
        SendGrid (email), Cloudinary (images), and hosting providers (Vercel,
        Railway) with data stored in PostgreSQL. Each processes data only to
        provide their service.
      </p>
      <H>5. Retention & security</H>
      <p>
        We retain data while your account is active and as required by law.
        Transport encryption (TLS) everywhere; credentials hashed; access tokens
        held server-side. No system is perfectly secure — report concerns to
        security@myrentra.com.
      </p>
      <H>6. Your choices</H>
      <p>
        You can edit your rental profile at any time, disconnect a co-signer
        invitation, or request account deletion at support@myrentra.com.
        California and other state-law rights (access, deletion,
        non-discrimination) are honored where applicable.
      </p>
      <p className="text-xs text-gray-400">[DRAFT — pending legal review]</p>
    </LegalShell>
  )
}
