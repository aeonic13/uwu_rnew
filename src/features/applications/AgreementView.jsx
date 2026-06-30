import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Pen,
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { agreementsService } from '../../services/agreementsService'

/**
 * Format date
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
      const updated = await agreementsService.sign(agreementId)
      setAgreement(updated)
      setShowSignModal(false)
    } catch (err) {
      console.error('Failed to sign agreement:', err)
    } finally {
      setIsSigning(false)
    }
  }

  const handleDownload = () => {
    // TODO: Generate and download PDF
    alert('Download functionality will be implemented')
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
  const needsMySignature = !isSigned && !agreement.viewerHasSigned
  const awaitingOther = !isSigned && agreement.viewerHasSigned

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
            <h1 className="text-lg font-semibold">Lease Agreement</h1>
          </div>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Download"
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
                  You&apos;ve signed
                </h3>
                <p className="text-sm text-brand-600">
                  Awaiting signature from the other party
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-green-800">
                  Agreement Signed
                </h3>
                <p className="text-sm text-green-700">
                  This agreement has been signed by all parties
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agreement Content */}
      <div className="p-4 space-y-4">
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
          <h3 className="font-semibold mb-3">Parties</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tenant (Sublessee)</p>
              <p className="font-medium">{agreement.tenant.name}</p>
              <p className="text-sm text-gray-600">{agreement.tenant.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Landlord (Sublessor)</p>
              <p className="font-medium">{agreement.landlord.name}</p>
              <p className="text-sm text-gray-600">
                {agreement.landlord.email}
              </p>
            </div>
          </div>
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
                {formatDate(agreement.terms.endDate)}
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
          </div>
        </div>

        {/* Full Agreement Text (placeholder) */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Full Agreement</h3>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p>
              This Lease Agreement (&quot;Agreement&quot;) is entered into as of{' '}
              {formatDate(agreement.createdAt)}, by and between:
            </p>
            <p>
              <strong>Sublessor:</strong> {agreement.landlord.name}
            </p>
            <p>
              <strong>Sublessee:</strong> {agreement.tenant.name}
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
                  I have read and agree to the terms and conditions of this
                  Lease Agreement. I understand this is a legally binding
                  document.
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
