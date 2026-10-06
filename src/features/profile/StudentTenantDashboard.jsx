import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { agreementsService } from '../../services/agreementsService'
import { paymentsService } from '../../services/payments'
import { maintenanceService } from '../../services/maintenanceService'
import {
  ArrowLeft,
  Home,
  DollarSign,
  Zap,
  Wrench,
  FileText,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Eye,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { rentService } from '../../services/rentService'
import UtilityBillSplit from '../utilities/UtilityBillSplit'
import RentSplitCard from '../payments/RentSplitCard'
import AutopayCard from '../payments/AutopayCard'
import {
  pickCurrentLease,
  sortLeases,
  leaseState,
  leaseStatusLabel,
  leaseStatusTone,
  SIGNABLE_STATES,
  ACTIVE_STATES,
} from './leasePicker'

/**
 * Student Tenant Dashboard - Comprehensive dashboard for student tenants
 * Includes: Rent payments, utilities, maintenance requests, leases, and payment history
 */
function StudentTenantDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('rent')

  const tabs = [
    { id: 'rent', label: 'Pay Rent', icon: Home },
    { id: 'utilities', label: 'Utilities', icon: Zap },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'leases', label: 'Leases', icon: FileText },
    { id: 'history', label: 'Payment History', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-brand-500 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/profile')} className="mr-3">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Tenant Dashboard</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-500 bg-brand-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'rent' && <PayRentTab user={user} />}
        {activeTab === 'utilities' && <UtilitiesTab />}
        {activeTab === 'maintenance' && <MaintenanceTab user={user} />}
        {activeTab === 'leases' && <LeasesTab user={user} />}
        {activeTab === 'history' && <PaymentHistoryTab user={user} />}
      </div>
    </div>
  )
}

/**
 * Pay Rent Tab - Handle rent payments
 */
function PayRentTab() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentLease, setCurrentLease] = useState(null)
  const [bankAccount, setBankAccount] = useState(null)
  const [paid, setPaid] = useState(false)
  const [payError, setPayError] = useState(null)
  // Household split + autopay for the lease (server/routes/rent.js).
  const [plan, setPlan] = useState(null)
  // A renewal or amendment still waiting for this tenant's signature.
  const [waitingLease, setWaitingLease] = useState(null)

  useEffect(() => {
    let active = true
    agreementsService
      .listAgreements()
      .then(agreements => {
        if (!active) return
        // The lease in force today (a signed renewal waits its turn).
        const lease = pickCurrentLease(agreements)
        const waiting = agreements.find(
          a =>
            SIGNABLE_STATES.includes(leaseState(a)) &&
            !a.viewerHasSigned &&
            a.canSign !== false
        )
        setWaitingLease(
          waiting
            ? {
                id: waiting.id,
                kind: leaseState(waiting),
                startDate: waiting.terms?.startDate,
              }
            : null
        )
        if (lease) {
          setCurrentLease({
            id: lease.id,
            property: lease.property?.description || lease.property?.address,
            monthlyRent: lease.terms?.monthlyRent || 0,
            landlord: lease.landlord?.name,
            endDate: lease.terms?.endDate,
            state: leaseState(lease),
          })
          return rentService
            .getPlan(lease.id)
            .then(p => active && setPlan(p))
            .catch(() => {})
        }
      })
      .catch(() => {})
    // 400s when no bank is linked — treat as none.
    paymentsService
      .getPlaidAccounts()
      .then(res => active && setBankAccount(res?.accounts?.[0] || null))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handlePayRent = async () => {
    setIsProcessing(true)
    setPayError(null)
    try {
      await paymentsService.payRent({
        paymentMethod: bankAccount ? 'ach' : 'recorded',
        // Share plus this month's charges, when the ledger is loaded.
        ...(plan?.ledger ? { amount: plan.ledger.due } : {}),
      })
      setPaid(true)
    } catch (err) {
      setPayError(err.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!currentLease) {
    return (
      <div className="text-center text-gray-500 py-12">
        <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
        <p>No active lease to pay rent on yet.</p>
        <p className="text-sm">
          Once your application is approved and the lease is ready, you can pay
          here.
        </p>
      </div>
    )
  }

  // With a household split, the tenant only owes their share.
  const hasSplit = !!plan?.split
  const ledger = plan?.ledger || null
  const baseDue =
    hasSplit && plan.myShare != null ? plan.myShare : currentLease.monthlyRent
  const amountDue = ledger ? ledger.due : baseDue
  const amountLabel = Number.isInteger(amountDue)
    ? amountDue.toLocaleString()
    : amountDue.toFixed(2)

  if (paid) {
    return (
      <div className="text-center text-gray-700 py-12">
        <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
        <h3 className="text-lg font-semibold">Rent paid</h3>
        <p className="text-sm text-gray-500">
          Your ${amountLabel} payment was recorded. See it in Payment History.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {waitingLease && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-900">
              {waitingLease.kind === 'amendment'
                ? 'A lease amendment is waiting for your signature'
                : waitingLease.kind === 'renewal'
                  ? 'A lease renewal is waiting for your signature'
                  : 'A lease is waiting for your signature'}
            </p>
            <p className="text-sm text-amber-800">
              {waitingLease.startDate
                ? `Takes effect ${new Date(waitingLease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}. `
                : ''}
              Your current lease stands until everyone has signed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/agreement/${waitingLease.id}`)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
          >
            Review & sign
          </button>
        </div>
      )}
      {currentLease.state === 'ending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          Your lease ends{' '}
          {new Date(currentLease.endDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
          })}
          . Rent stays due until then; your deposit, less any itemized
          deductions, comes back after move-out.
        </div>
      )}
      {/* Current Lease Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-lg mb-3">Current Lease</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Property:</span>
            <span className="font-medium">{currentLease.property}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Rent:</span>
            <span className="font-bold text-green-600">
              ${currentLease.monthlyRent}/mo
            </span>
          </div>
          {currentLease.landlord && (
            <div className="flex justify-between">
              <span className="text-gray-600">Landlord:</span>
              <span className="font-medium">{currentLease.landlord}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 text-sm mb-2">
          {hasSplit ? 'Your share due' : 'Amount Due'}
        </p>
        <p className="text-4xl font-bold text-brand-500">${amountLabel}</p>
        {ledger?.lines?.length > 0 && (
          <ul className="mt-3 text-left text-sm bg-white/80 rounded-lg divide-y divide-brand-100">
            <li className="flex justify-between px-3 py-1.5">
              <span>Rent{hasSplit ? ' share' : ''}</span>
              <span>${ledger.rentDue.toLocaleString()}</span>
            </li>
            {ledger.lines.map(line => (
              <li key={line.id} className="flex justify-between px-3 py-1.5">
                <span>
                  {line.label}: {line.description}
                  {line.household ? ' (your share)' : ''}
                </span>
                <span
                  className={
                    line.type === 'credit' ? 'text-green-700' : 'text-gray-900'
                  }
                >
                  {line.type === 'credit' ? '−' : '+'}$
                  {line.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-gray-500 text-sm mt-2">
          {hasSplit && plan.myShare == null
            ? 'You are not in the household split yet — edit it below.'
            : 'No service fee on recorded payments'}
        </p>
      </div>

      {/* Split + autopay: the plan that decides who pays what, and when */}
      {plan && (
        <>
          <RentSplitCard
            agreementId={plan.agreementId}
            plan={plan}
            onChange={patch => setPlan(prev => ({ ...prev, ...patch }))}
          />
          <AutopayCard
            agreementId={plan.agreementId}
            autopay={plan.autopay}
            defaultAmount={amountDue}
            onChange={autopay => setPlan(prev => ({ ...prev, autopay }))}
          />
        </>
      )}

      {/* Payment Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Payment Method</h3>
        {bankAccount ? (
          <div className="flex items-center p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">
                {bankAccount.name || bankAccount.official_name || 'Bank'}
              </div>
              <div className="text-sm text-gray-600">
                •••• {bankAccount.mask || '····'} · linked with Plaid
              </div>
            </div>
            <CreditCard size={20} className="text-gray-400" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No bank linked yet — you can link one securely with Plaid during{' '}
            <button
              onClick={() => navigate('/pre-qualify')}
              className="text-brand-500 font-medium hover:underline"
            >
              pre-qualification
            </button>
            . Your payment is recorded on the ledger either way.
          </p>
        )}
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayRent}
        disabled={isProcessing}
        className={`w-full py-4 rounded-lg font-semibold text-white ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-brand-500 hover:bg-brand-600'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <Clock size={20} className="mr-2 animate-spin" />
            Processing...
          </span>
        ) : (
          `Record rent payment — $${amountLabel}`
        )}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Records the payment on your rent ledger and your landlord&apos;s rent
        roll. In-app bank payments (ACH) are coming soon.
      </p>
      {payError && <p className="text-sm text-red-600">{payError}</p>}
    </div>
  )
}

/**
 * Utilities Tab - Split utility bills with roommates (real feature,
 * backed by server/routes/utilities.js).
 */
function UtilitiesTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <UtilityBillSplit />
    </div>
  )
}

/**
 * Comment thread on one maintenance request (tenant side). Mirrors
 * features/maintenance/MaintenanceThread.jsx; kept inline here so this file's
 * imports stay untouched while PayRentTab is being reworked.
 */
function TenantTicketThread({ ticketId, onLoaded, onPosted }) {
  const [comments, setComments] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const fileInputId = `ticket-photos-${ticketId}`

  useEffect(() => {
    let active = true
    maintenanceService
      .get(ticketId)
      .then(ticket => {
        if (!active) return
        setComments(ticket.comments || [])
        onLoaded?.(ticket)
      })
      .catch(err => {
        if (active) setLoadError(err?.message || 'Could not load messages.')
      })
    return () => {
      active = false
    }
    // onLoaded is a host callback; re-fetch only when the ticket changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const pickPhotos = async e => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    if (photos.length + files.length > 10) {
      setError('At most 10 photos per message.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const urls = await maintenanceService.uploadPhotos(ticketId, files)
      setPhotos(prev => [...prev, ...urls])
    } catch (err) {
      setError(err?.message || 'Could not upload photos.')
    } finally {
      setUploading(false)
    }
  }

  const post = async e => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setPosting(true)
    setError('')
    try {
      const comment = await maintenanceService.addComment(ticketId, {
        body: text,
        photos,
      })
      setComments(prev => [...(prev || []), comment])
      setBody('')
      setPhotos([])
      onPosted?.(comment)
    } catch (err) {
      setError(err?.message || 'Could not post your message.')
    } finally {
      setPosting(false)
    }
  }

  const name = a =>
    [a?.firstName, a?.lastName].filter(Boolean).join(' ') || 'Unknown'
  const when = v => {
    const d = new Date(v)
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
  }

  return (
    <div className="space-y-3">
      {loadError ? (
        <p className="text-xs text-red-600">{loadError}</p>
      ) : comments === null ? (
        <p className="text-xs text-gray-500">Loading messages…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500">
          No messages yet. Ask a question or add an update below.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map(c => {
            const isLandlord = c.author?.userType === 'owner'
            return (
              <li key={c.id} className="text-sm">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">
                    {name(c.author)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isLandlord
                        ? 'bg-gray-900 text-white'
                        : 'bg-brand-100 text-brand-700'
                    }`}
                  >
                    {isLandlord ? 'Landlord' : 'Tenant'}
                  </span>
                  <span>{when(c.createdAt)}</span>
                </p>
                <p className="text-gray-800 whitespace-pre-wrap break-words mt-0.5">
                  {c.body}
                </p>
                {c.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.photos.map(url => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="Attached photo"
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={post} className="space-y-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Write a message to your landlord…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map(url => (
              <span key={url} className="relative">
                <img
                  src={url}
                  alt="Pending upload"
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter(p => p !== url))}
                  aria-label="Remove photo"
                  className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full w-4 h-4 text-[10px] leading-none text-gray-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            multiple
            onChange={pickPhotos}
            className="hidden"
          />
          <label
            htmlFor={fileInputId}
            className={`inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer ${
              uploading || posting ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Add photos'}
          </label>
          <button
            type="submit"
            disabled={!body.trim() || posting || uploading}
            className="ml-auto px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  )
}

/**
 * Maintenance Tab - Submit and track maintenance requests
 */
function MaintenanceTab() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    description: '',
  })
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  // Which request cards have their Messages thread expanded, by ticket id.
  const [openThreads, setOpenThreads] = useState({})

  const mapTicket = t => ({
    id: t.id,
    category: t.category,
    description: t.description,
    priority: t.priority,
    status: t.status,
    date: t.createdAt,
    assignedTo: t.assignedTo,
    vendorPhone: t.vendorPhone || null,
    cost: t.cost ?? null,
    completedDate: t.completedAt,
    commentCount: t._count?.comments ?? 0,
  })

  // Thread loads carry the latest ticket fields; merge them into the card.
  const mergeTicket = (id, ticket) =>
    setMaintenanceRequests(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              ...mapTicket(ticket),
              commentCount: ticket.comments?.length ?? r.commentCount,
            }
          : r
      )
    )

  const bumpCommentCount = id =>
    setMaintenanceRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, commentCount: (r.commentCount || 0) + 1 } : r
      )
    )

  useEffect(() => {
    let active = true
    maintenanceService
      .list()
      .then(tickets => {
        if (active) setMaintenanceRequests(tickets.map(mapTicket))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const ticket = await maintenanceService.create(formData)
      setMaintenanceRequests(prev => [mapTicket(ticket), ...prev])
      setShowForm(false)
      setFormData({ category: '', priority: 'medium', description: '' })
    } catch (err) {
      setSubmitError(err.message || 'Could not submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in-progress':
        return 'bg-brand-100 text-brand-600'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Submit New Request Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 flex items-center justify-center"
        >
          <Wrench size={20} className="mr-2" />
          Submit New Maintenance Request
        </button>
      )}

      {/* Maintenance Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">New Maintenance Request</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={e =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Select category</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="pest">Pest Control</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <div className="flex space-x-2">
                {['low', 'medium', 'high'].map(priority => (
                  <label
                    key={priority}
                    className={`flex-1 p-3 border rounded-lg cursor-pointer text-center font-medium ${
                      formData.priority === priority
                        ? 'border-brand-500 bg-brand-50 text-brand-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={e =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="sr-only"
                    />
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Please describe the issue in detail..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 cursor-pointer">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload photos of the issue
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-3 rounded-lg font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brand-500 hover:bg-brand-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
            {submitError && (
              <p className="text-sm text-red-600 mt-2">{submitError}</p>
            )}
          </form>
        </div>
      )}

      {/* Existing Requests */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Your Requests</h3>
        {maintenanceRequests.map(request => (
          <div
            key={request.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{request.category}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {request.description}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}
              >
                {request.priority}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span
                className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}
              >
                {request.status === 'in-progress'
                  ? 'In Progress'
                  : request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
              </span>
              <span className="text-gray-500">
                {new Date(request.date).toLocaleDateString()}
              </span>
            </div>

            {(request.assignedTo || request.vendorPhone) && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                {request.assignedTo && (
                  <span>
                    <span className="text-gray-600">Assigned to:</span>{' '}
                    <span className="font-medium">{request.assignedTo}</span>
                  </span>
                )}
                {request.vendorPhone && (
                  <a
                    href={`tel:${request.vendorPhone}`}
                    className="text-brand-600 font-medium hover:underline"
                  >
                    {request.vendorPhone}
                  </a>
                )}
              </div>
            )}

            {request.status === 'completed' && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <CheckCircle size={16} className="inline text-green-600 mr-2" />
                <span className="text-green-700">
                  Completed on{' '}
                  {new Date(request.completedDate).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() =>
                  setOpenThreads(prev => ({
                    ...prev,
                    [request.id]: !prev[request.id],
                  }))
                }
                aria-expanded={!!openThreads[request.id]}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {openThreads[request.id] ? 'Hide messages' : 'Messages'}
                {request.commentCount > 0 && (
                  <span className="ml-1 text-gray-500">
                    ({request.commentCount})
                  </span>
                )}
              </button>
              {openThreads[request.id] && (
                <div className="mt-3">
                  <TenantTicketThread
                    ticketId={request.id}
                    onLoaded={ticket => mergeTicket(request.id, ticket)}
                    onPosted={() => bumpCommentCount(request.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Leases Tab - View and download lease documents
 */
function LeasesTab() {
  const navigate = useNavigate()
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    agreementsService
      .listAgreements()
      .then(agreements => {
        if (!active) return
        setLeases(
          sortLeases(agreements).map(a => ({
            id: a.id,
            property: a.property?.description || a.property?.address || 'Lease',
            landlord: a.landlord?.name || '—',
            landlordEmail: a.landlord?.email || null,
            status: leaseState(a),
            startDate: a.terms?.startDate,
            endDate: a.terms?.endDate,
            monthlyRent: a.terms?.monthlyRent,
            securityDeposit: a.terms?.securityDeposit,
            signedDate: a.createdAt,
            viewerHasSigned: !!a.viewerHasSigned,
            pendingSigners: (a.pendingSigners || []).map(p => p.name),
            tenantCount: a.tenants?.length || 1,
          }))
        )
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Loading leases…</p>
  }

  if (leases.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <FileText size={32} className="mx-auto mb-3 text-gray-300" />
        <p>No leases yet.</p>
        <p className="text-sm">
          Once a landlord approves your application, your lease appears here to
          sign.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leases.map(lease => (
        <div
          key={lease.id}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{lease.property}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Landlord: {lease.landlord}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${leaseStatusTone(
                lease.status
              )}`}
            >
              {leaseStatusLabel(lease.status, {
                terms: { startDate: lease.startDate, endDate: lease.endDate },
              })}
            </span>
          </div>
          {SIGNABLE_STATES.includes(lease.status) && (
            <p
              className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 mb-4"
              data-testid="lease-waiting"
            >
              {lease.tenantCount > 1 ? 'Joint lease. ' : ''}
              {lease.viewerHasSigned
                ? `You've signed. Waiting on ${lease.pendingSigners.join(', ') || 'the other party'}.`
                : 'Your signature is needed.'}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Lease Period</span>
              <p className="font-medium mt-1">
                {new Date(lease.startDate).toLocaleDateString('en-US', {
                  timeZone: 'UTC',
                })}{' '}
                -{' '}
                {new Date(lease.endDate).toLocaleDateString('en-US', {
                  timeZone: 'UTC',
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Monthly Rent</span>
              <p className="font-medium text-green-600 mt-1">
                ${lease.monthlyRent}/mo
              </p>
            </div>
            <div>
              <span className="text-gray-600">Security Deposit</span>
              <p className="font-medium mt-1">${lease.securityDeposit}</p>
            </div>
            <div>
              <span className="text-gray-600">Signed Date</span>
              <p className="font-medium mt-1">
                {new Date(lease.signedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => navigate(`/agreement/${lease.id}`)}
              className="flex-1 flex items-center justify-center py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium"
            >
              <Eye size={18} className="mr-2" />
              {ACTIVE_STATES.includes(lease.status) || lease.status === 'past'
                ? 'View Lease'
                : 'View & Sign'}
            </button>
            <button
              onClick={() =>
                agreementsService
                  .downloadPdf(lease.id)
                  .catch(err => console.error('Lease PDF download failed', err))
              }
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              <Download size={18} className="mr-2" />
              PDF
            </button>
          </div>

          {ACTIVE_STATES.includes(lease.status) && (
            <div className="mt-3 bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm">
              <AlertCircle size={16} className="inline text-brand-500 mr-2" />
              <span className="text-brand-600">
                {Math.ceil(
                  (new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                )}{' '}
                days remaining in lease
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Lease Renewal Notice */}
      {leases.some(l => l.status === 'active') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Interested in Renewing?
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Contact your landlord about lease renewal options. Early renewal
                may come with benefits!
              </p>
              {(() => {
                const active = leases.find(l => l.status === 'active')
                return active?.landlordEmail ? (
                  <a
                    href={`mailto:${active.landlordEmail}?subject=${encodeURIComponent(`Lease renewal — ${active.property}`)}`}
                    className="text-sm text-green-600 font-medium hover:underline"
                  >
                    Email {active.landlord} →
                  </a>
                ) : (
                  <button
                    onClick={() => navigate('/messages')}
                    className="text-sm text-green-600 font-medium hover:underline"
                  >
                    Message your landlord →
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Payment History Tab - View all past payments
 */
function PaymentHistoryTab() {
  const [filterType, setFilterType] = useState('all')
  const [payments, setPayments] = useState([])
  const [receiptId, setReceiptId] = useState(null)

  useEffect(() => {
    let active = true
    paymentsService
      .getHistory()
      .then(res => {
        if (!active) return
        setPayments(
          (res?.payments || []).map(p => ({
            id: p.id,
            type: p.type || 'rent',
            description: p.listing?.title
              ? `Payment — ${p.listing.title}`
              : p.type === 'fee'
                ? 'Application fee'
                : 'Payment',
            amount: p.total ?? p.amount ?? 0,
            base: p.amount ?? p.total ?? 0,
            serviceFee: p.serviceFee ?? 0,
            date: p.date,
            status: p.status,
            method: p.method || 'Bank Account',
          }))
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const filteredPayments =
    filterType === 'all'
      ? payments
      : payments.filter(p => p.type === filterType)

  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
        <p className="text-green-100 text-sm mb-2">Total Paid</p>
        <p className="text-4xl font-bold mb-1">${totalPaid.toFixed(2)}</p>
        <p className="text-green-100 text-sm">
          {filteredPayments.length} transactions
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'rent', 'fee'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filterType === type
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.map(payment => (
          <div
            key={payment.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold">{payment.description}</h4>
                <p className="text-sm text-gray-600 mt-1">{payment.method}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">
                  ${payment.amount}
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {payment.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500 flex items-center">
                <Calendar size={14} className="mr-1" />
                {new Date(payment.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() =>
                  setReceiptId(receiptId === payment.id ? null : payment.id)
                }
                className="text-brand-500 font-medium hover:underline"
              >
                {receiptId === payment.id ? 'Hide Receipt' : 'View Receipt'}
              </button>
            </div>
            {receiptId === payment.id && (
              <dl
                className="mt-3 grid grid-cols-2 gap-y-1 text-sm bg-gray-50 rounded-lg p-3"
                data-testid="payment-receipt"
              >
                <dt className="text-gray-500">Receipt no.</dt>
                <dd className="text-right font-mono text-xs break-all">
                  {payment.id}
                </dd>
                <dt className="text-gray-500">Amount</dt>
                <dd className="text-right">${payment.base.toFixed(2)}</dd>
                <dt className="text-gray-500">Service fee</dt>
                <dd className="text-right">${payment.serviceFee.toFixed(2)}</dd>
                <dt className="text-gray-500 font-semibold">Total</dt>
                <dd className="text-right font-semibold">
                  ${payment.amount.toFixed(2)}
                </dd>
                <dt className="text-gray-500">Method</dt>
                <dd className="text-right">{payment.method}</dd>
                <dt className="text-gray-500">Status</dt>
                <dd className="text-right capitalize">{payment.status}</dd>
              </dl>
            )}
          </div>
        ))}
      </div>

      {/* Export: CSV of the rows currently shown, built in the browser */}
      <button
        disabled={filteredPayments.length === 0}
        onClick={() => {
          const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
          const rows = [
            [
              'Date',
              'Description',
              'Type',
              'Amount',
              'Service fee',
              'Total',
              'Method',
              'Status',
              'Receipt no.',
            ],
            ...filteredPayments.map(p => [
              new Date(p.date).toISOString().slice(0, 10),
              p.description,
              p.type,
              p.base.toFixed(2),
              p.serviceFee.toFixed(2),
              p.amount.toFixed(2),
              p.method,
              p.status,
              p.id,
            ]),
          ]
          const blob = new Blob(
            [rows.map(r => r.map(esc).join(',')).join('\n')],
            { type: 'text/csv;charset=utf-8' }
          )
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `rentra-payments-${new Date().toISOString().slice(0, 10)}.csv`
          document.body.appendChild(link)
          link.click()
          link.remove()
          URL.revokeObjectURL(url)
        }}
        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={20} className="mr-2" />
        Export Payment History (CSV)
      </button>
    </div>
  )
}

export default StudentTenantDashboard
