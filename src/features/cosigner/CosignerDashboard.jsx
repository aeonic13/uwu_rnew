import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Shield,
  Home,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cosignerService } from '../../services/cosignerService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import CosignerIncomeStep from './CosignerIncomeStep'

/**
 * Landing page for guarantors. Lists every tenant they back, the
 * application/lease status of each, and whether their income is verified.
 * Reached after accepting an invite and from the cosigner nav.
 */
export default function CosignerDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  // Bumped after income verification so the list refetches.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    cosignerService
      .myResponsibilities()
      .then(list => {
        if (!active) return
        setItems(list)
        setError(null)
      })
      .catch(err => {
        if (!active) return
        setError(err.message || 'Could not load your cosigner details')
        setItems([])
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  if (verifying) {
    return (
      <CosignerIncomeStep
        onDone={() => {
          setVerifying(false)
          setReloadKey(k => k + 1)
        }}
      />
    )
  }

  if (items === null) {
    return <LoadingSpinner />
  }

  const verifiedIncome = items.find(
    i => i.verifiedMonthlyIncome
  )?.verifiedMonthlyIncome

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mr-4">
          <Shield className="w-6 h-6 text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cosigner dashboard
          </h1>
          <p className="text-gray-600 text-sm">
            {user?.firstName ? `Welcome, ${user.firstName}. ` : ''}
            Here is everyone you are backing on Rentra.
          </p>
        </div>
      </div>

      {/* Income verification status: one Plaid check covers every tenant. */}
      <div
        className={`rounded-xl border p-4 mb-6 flex items-start ${
          verifiedIncome
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        {verifiedIncome ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {verifiedIncome
              ? `Income verified: $${Math.round(verifiedIncome).toLocaleString()}/mo`
              : 'Income not verified yet'}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {verifiedIncome
              ? 'Landlords see this alongside each tenant you back.'
              : 'Landlords cannot count your income toward a tenant until you verify it. It takes about a minute through Plaid.'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setVerifying(true)}
            className="ml-3 shrink-0 inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600"
          >
            {verifiedIncome ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Re-verify
              </>
            ) : (
              'Verify income'
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">
            You are not backing anyone yet
          </p>
          <p className="text-sm text-gray-600 mt-1">
            When a tenant invites you to cosign, accepting from the email link
            will list them here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(item => (
            <ResponsibilityCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ResponsibilityCard({ item }) {
  const { tenant, listing, application, agreement } = item
  const tenantName = `${tenant.firstName} ${tenant.lastName}`

  return (
    <li className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{tenantName}</p>
          <p className="text-sm text-gray-500">
            {item.relationshipType ? `${item.relationshipType} · ` : ''}
            {tenant.university || tenant.email}
          </p>
        </div>
        <StatusPill application={application} agreement={agreement} />
      </div>

      <div className="mt-3 text-sm text-gray-700 space-y-1.5">
        {listing ? (
          <>
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
              <Link
                to={`/listings/${listing.id}`}
                className="font-medium hover:text-brand-600 truncate"
              >
                {listing.title}
              </Link>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2 text-gray-400 shrink-0" />$
              {Number(listing.price || 0).toLocaleString()}/mo
              {listing.location ? (
                <span className="ml-2 text-gray-400 truncate">
                  · {listing.location}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex items-center text-gray-600">
            <Home className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
            Backs every application {tenant.firstName} submits
          </div>
        )}
        {agreement && (
          <div className="flex items-center text-gray-600">
            <FileText className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
            Lease {new Date(agreement.startDate).toLocaleDateString()} to{' '}
            {new Date(agreement.endDate).toLocaleDateString()} · $
            {Number(agreement.monthlyRent).toLocaleString()}/mo
          </div>
        )}
      </div>
    </li>
  )
}

ResponsibilityCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    relationshipType: PropTypes.string,
    tenant: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      university: PropTypes.string,
    }).isRequired,
    listing: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      location: PropTypes.string,
      price: PropTypes.number,
    }),
    application: PropTypes.shape({ status: PropTypes.string }),
    agreement: PropTypes.shape({
      monthlyRent: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      tenantSigned: PropTypes.bool,
      landlordSigned: PropTypes.bool,
    }),
  }).isRequired,
}

/**
 * One pill summarising where this tenant is: lease signed > lease pending
 * signatures > application status > floating (no application yet).
 */
function StatusPill({ application, agreement }) {
  let label = 'Pre-qualified'
  let cls = 'bg-gray-100 text-gray-700'
  let Icon = Clock

  if (agreement) {
    if (agreement.tenantSigned && agreement.landlordSigned) {
      label = 'Lease signed'
      cls = 'bg-green-100 text-green-700'
      Icon = CheckCircle2
    } else {
      label = 'Lease awaiting signatures'
      cls = 'bg-blue-100 text-blue-700'
    }
  } else if (application) {
    const map = {
      pending: ['Application pending', 'bg-amber-100 text-amber-700', Clock],
      approved: ['Approved', 'bg-green-100 text-green-700', CheckCircle2],
      rejected: ['Not selected', 'bg-gray-100 text-gray-600', AlertCircle],
      cancelled: ['Withdrawn', 'bg-gray-100 text-gray-600', AlertCircle],
    }
    ;[label, cls, Icon] = map[application.status] || map.pending
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cls}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1" />
      {label}
    </span>
  )
}

StatusPill.propTypes = {
  application: PropTypes.shape({ status: PropTypes.string }),
  agreement: PropTypes.shape({
    tenantSigned: PropTypes.bool,
    landlordSigned: PropTypes.bool,
  }),
}
