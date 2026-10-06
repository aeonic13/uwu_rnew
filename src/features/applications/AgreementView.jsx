import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Pen,
  Pencil,
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { agreementsService } from '../../services/agreementsService'
import LeaseTermsEditor from './LeaseTermsEditor'

/**
 * Format date
 */
// Lease dates are date-only values stored at UTC midnight; render them in
// UTC so they do not shift a day earlier in US time zones.
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Agreement View - View and sign lease agreement
 */
function AgreementView() {
  const { agreementId } = useParams()
  const navigate = useNavigate()

  const [agreement, setAgreement] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignModal, setShowSignModal] = useState(false)
  const [signature, setSignature] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [editingTerms, setEditingTerms] = useState(false)

  useEffect(() => {
    const fetchAgreement = async () => {
      setIsLoading(true)
      try {
        const data = await agreementsService.getAgreement(agreementId)
        setAgreement(data)
      } catch (err) {
        console.error('Failed to load agreement:', err)
        setAgreement(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (agreementId) {
      fetchAgreement()
    }
  }, [agreementId])

  const handleSign = async () => {
    if (!signature.trim() || !agreedToTerms) return

    setIsSigning(true)
    try {
      const updated = await agreementsService.sign(agreementId, {
        signatureName: signature.trim(),
        esignConsent: agreedToTerms,
      })
      setAgreement(updated)
      setShowSignModal(false)
    } catch (err) {
      console.error('Failed to sign agreement:', err)
    } finally {
      setIsSigning(false)
    }
  }

  const [isDownloading, setIsDownloading] = useState(false)

  // Imported lease with the signed copy uploaded: the main download is that
  // file; Rentra's generated summary stays available separately.
  const handleDownload = async ({ summary = false } = {}) => {
    setIsDownloading(true)
    try {
      await agreementsService.downloadPdf(agreementId, { summary })
    } catch (err) {
      console.error('Failed to download lease PDF:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Agreement not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-brand-500 hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const isSigned = agreement.status === 'signed'
  const imported = Boolean(agreement.imported)
  // Imported leases are confirmed through the tenant's invitation, never
  // e-signed here.
  const needsMySignature = !isSigned && !agreement.viewerHasSigned && !imported
  const awaitingOther = !isSigned && (agreement.viewerHasSigned || imported)
  const signedWord = imported ? 'Confirmed' : 'Signed'
  const notSignedWord = imported ? 'Not confirmed' : 'Not signed'
  // The landlord can shape an unsigned Rentra lease; signatures lock it.
  const canEditTerms =
    agreement.viewerRole === 'landlord' && !imported && !agreement.signedCount

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold">
              {imported ? 'Lease (imported)' : 'Lease Agreement'}
            </h1>
          </div>
          <button
            onClick={() => handleDownload()}
            disabled={isDownloading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label={
              imported && agreement.documentUrl
                ? 'Download signed lease'
                : 'Download lease PDF'
            }
          >
            <Download size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`mx-4 mt-4 rounded-lg p-4 ${
          needsMySignature
            ? 'bg-yellow-50 border border-yellow-200'
            : awaitingOther
              ? 'bg-brand-50 border border-brand-200'
              : 'bg-green-50 border border-green-200'
        }`}
      >
        <div className="flex items-center">
          {needsMySignature ? (
            <>
              <AlertCircle className="text-yellow-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Signature Required
                </h3>
                <p className="text-sm text-yellow-700">
                  Please review and sign this agreement
                </p>
              </div>
            </>
          ) : awaitingOther ? (
            <>
              <CheckCircle className="text-brand-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-brand-700">
                  {imported
                    ? agreement.viewerHasSigned
                      ? 'You\u2019ve confirmed'
                      : 'Waiting on confirmations'
                    : 'You\u2019ve signed'}
                </h3>
                <p className="text-sm text-brand-600">
                  {agreement.pendingSigners?.length
                    ? `Waiting on ${agreement.pendingSigners
                        .map(p => p.name)
                        .join(', ')}`
                    : imported
                      ? 'Awaiting the other confirmations'
                      : 'Awaiting the other signatures'}
                  {agreement.signerCount
                    ? ` · ${agreement.signedCount}/${agreement.signerCount} ${
                        imported ? 'confirmed' : 'signed'
                      }`
                    : ''}
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-green-800">
                  {imported ? 'Lease Confirmed' : 'Agreement Signed'}
                </h3>
                <p className="text-sm text-green-700">
                  {imported
                    ? 'Every tenant has confirmed the recorded terms'
                    : 'This agreement has been signed by all parties'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agreement Content */}
      <div className="p-4 space-y-4">
        {imported && (
          <div className="bg-white rounded-lg border p-4 text-sm text-gray-700">
            <p>
              This lease was signed outside Rentra. Rentra holds a record of its
              terms, entered by the landlord and confirmed by each tenant; the
              signed lease itself is the governing document.
            </p>
            {agreement.documentUrl ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <button
                  type="button"
                  onClick={() => handleDownload()}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1 text-brand-600 font-medium hover:underline disabled:opacity-50"
                >
                  <Download size={14} /> Download the signed lease
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload({ summary: true })}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1 text-gray-600 hover:underline disabled:opacity-50"
                >
                  <FileText size={14} /> Rentra&apos;s summary
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                The landlord has not uploaded the signed copy. The download
                above is Rentra&apos;s summary of the recorded terms.
              </p>
            )}
          </div>
        )}
        {agreement.endedAt && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            Notice given: this lease ends on{' '}
            {formatDate(agreement.terms.endDate)}.
          </div>
        )}
        {agreement.renewsId && (
          <div className="bg-white rounded-lg border p-4 text-sm text-gray-700">
            This is a renewal of the household&apos;s previous lease.{' '}
            <button
              type="button"
              onClick={() => navigate(`/agreement/${agreement.renewsId}`)}
              className="text-brand-600 hover:underline"
            >
              View the previous lease
            </button>
          </div>
        )}
        {agreement.renewalId && (
          <div className="bg-white rounded-lg border p-4 text-sm text-gray-700">
            A renewal has been drafted for this household.{' '}
            <button
              type="button"
              onClick={() => navigate(`/agreement/${agreement.renewalId}`)}
              className="text-brand-600 hover:underline"
            >
              Open the renewal
            </button>
          </div>
        )}
        {!imported && agreement.documentUrl && (
          <div className="bg-white rounded-lg border p-4 text-sm text-gray-700">
            The landlord attached their own lease document. It is what the
            parties sign and what the download contains; the terms below are
            Rentra&apos;s record of it.{' '}
            <button
              type="button"
              onClick={() => handleDownload()}
              disabled={isDownloading}
              className="text-brand-600 hover:underline disabled:opacity-50"
            >
              Download the document
            </button>
          </div>
        )}
        {canEditTerms && (
          <div>
            <button
              type="button"
              onClick={() => setEditingTerms(v => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              <Pencil size={14} />
              {editingTerms
                ? 'Hide the editor'
                : 'Edit terms or upload your own lease'}
            </button>
            {editingTerms && (
              <div className="mt-3">
                <LeaseTermsEditor
                  agreement={agreement}
                  onSaved={setAgreement}
                />
              </div>
            )}
          </div>
        )}
        {/* Agreement ID */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="text-brand-500 mr-3" size={24} />
              <div>
                <p className="font-semibold">Agreement #{agreement.id}</p>
                <p className="text-sm text-gray-500">
                  Created {formatDate(agreement.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Property</h3>
          <p className="font-medium">{agreement.property.description}</p>
          <p className="text-gray-600">{agreement.property.address}</p>
        </div>

        {/* Parties */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">
            Parties
            {agreement.isGroupLease && (
              <span className="ml-2 text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Joint lease · {agreement.tenants.length} tenants
              </span>
            )}
          </h3>
          <ul className="divide-y divide-gray-100" data-testid="lease-parties">
            {[...(agreement.tenants || []), agreement.landlord]
              .filter(Boolean)
              .map((party, idx) => (
                <li
                  key={party.userId || `${party.role}-${idx}`}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-xs text-gray-500">
                      {party.role === 'landlord'
                        ? 'Landlord'
                        : agreement.isGroupLease
                          ? `Tenant ${idx + 1}`
                          : 'Tenant'}
                    </p>
                    <p className="font-medium">
                      {party.name}
                      {party.isViewer && (
                        <span className="ml-2 text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">
                          you
                        </span>
                      )}
                    </p>
                    {party.email && (
                      <p className="text-sm text-gray-600">{party.email}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      party.signed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {party.signed
                      ? `${signedWord}${party.signedAt ? ` ${formatDate(party.signedAt)}` : ''}`
                      : party.inviteStatus === 'pending'
                        ? 'Invited'
                        : notSignedWord}
                  </span>
                </li>
              ))}
          </ul>
          {agreement.isGroupLease && !imported && (
            <p className="text-xs text-gray-500 mt-3">
              Every tenant signs the same lease. It takes effect once all
              tenants and the landlord have signed.
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Lease Terms</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Rent</span>
              <span className="font-medium">
                ${agreement.terms.monthlyRent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Security Deposit</span>
              <span className="font-medium">
                ${agreement.terms.securityDeposit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date</span>
              <span className="font-medium">
                {formatDate(agreement.terms.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Date</span>
              <span className="font-medium">
                {agreement.monthToMonth
                  ? 'Month-to-month'
                  : formatDate(agreement.terms.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Terms */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Additional Terms</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Utilities</p>
              <p>{agreement.terms.utilities}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pet Policy</p>
              <p>{agreement.terms.petPolicy}</p>
            </div>
            {agreement.terms.parking && (
              <div>
                <p className="text-sm text-gray-500">Parking</p>
                <p>{agreement.terms.parking}</p>
              </div>
            )}
            {(agreement.terms.lateFee || agreement.lateFee) && (
              <div>
                <p className="text-sm text-gray-500">Late fee</p>
                <p>
                  {agreement.terms.lateFee}
                  {agreement.lateFee &&
                    ` (${agreement.terms.lateFee ? 'rule: ' : ''}$${agreement.lateFee.amount} once rent is ${agreement.lateFee.graceDays} days past due)`}
                </p>
              </div>
            )}
            {agreement.terms.additionalClauses?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Additional clauses</p>
                <ol className="list-decimal pl-5 space-y-1">
                  {agreement.terms.additionalClauses.map((clause, i) => (
                    <li key={i}>{clause}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Full Agreement Text (placeholder). An imported lease's text is
            the signed document itself, not something Rentra generates. */}
        {!imported && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Full Agreement</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>
                This Lease Agreement (&quot;Agreement&quot;) is entered into as
                of {formatDate(agreement.createdAt)}, by and between:
              </p>
              <p>
                <strong>Sublessor:</strong> {agreement.landlord.name}
              </p>
              <p>
                <strong>
                  {agreement.isGroupLease ? 'Sublessees:' : 'Sublessee:'}
                </strong>{' '}
                {(agreement.tenants || [agreement.tenant])
                  .map(t => t.name)
                  .join(', ')}
                {agreement.isGroupLease &&
                  ', jointly and severally responsible for the obligations of this lease'}
              </p>
              <p>
                The parties agree to the following terms and conditions for the
                lease of the property located at {agreement.property.address}.
              </p>
              <p className="text-gray-500 italic">
                [Full legal agreement text would appear here...]
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sign Button */}
      {needsMySignature && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={() => setShowSignModal(true)}
            className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center"
          >
            <Pen size={20} className="mr-2" />
            Sign Agreement
          </button>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={() => setShowSignModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Sign Agreement</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type your full legal name
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-600">
                  I have read and agree to the terms of this Lease Agreement, I
                  understand it is legally binding, and I consent to signing and
                  receiving records electronically under Rentra&apos;s{' '}
                  <a
                    href="/legal/esign"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-500 underline"
                  >
                    Electronic Records &amp; Signatures Consent
                  </a>
                  .
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!signature.trim() || !agreedToTerms || isSigning}
                className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isSigning ? 'Signing...' : 'Confirm & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgreementView
