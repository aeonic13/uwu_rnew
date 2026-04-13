import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
          {tabs.map((tab) => {
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
        {activeTab === 'utilities' && <UtilitiesTab user={user} />}
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
function PayRentTab({ user }) {
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock current lease data
  const currentLease = {
    property: '123 College Ave, Apt 4B',
    monthlyRent: 1200,
    dueDate: '1st of each month',
    nextDueDate: '2026-03-01',
    landlord: 'John Property Owner',
    status: 'active',
  }

  const handlePayRent = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      alert('Rent payment submitted successfully!')
    }, 2000)
  }

  return (
    <div className="space-y-6">
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
          <div className="flex justify-between">
            <span className="text-gray-600">Due Date:</span>
            <span className="font-medium">{currentLease.dueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Next Payment:</span>
            <span className="font-medium text-brand-500">
              {new Date(currentLease.nextDueDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 text-sm mb-2">Amount Due</p>
        <p className="text-4xl font-bold text-brand-500">
          ${currentLease.monthlyRent}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Due by {new Date(currentLease.nextDueDate).toLocaleDateString()}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">Bank Account</div>
              <div className="text-sm text-gray-600">****1234</div>
            </div>
            <CreditCard size={20} className="text-gray-400" />
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">Debit/Credit Card</div>
              <div className="text-sm text-gray-600">****5678</div>
            </div>
            <CreditCard size={20} className="text-gray-400" />
          </label>

          <button className="w-full text-brand-500 py-2 text-sm font-medium hover:bg-brand-50 rounded-lg">
            + Add Payment Method
          </button>
        </div>
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
          `Pay $${currentLease.monthlyRent} Now`
        )}
      </button>

      {/* Auto-pay Option */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Enable Auto-Pay</h4>
            <p className="text-sm text-gray-600">
              Never miss a payment - we'll automatically charge your account on
              the due date
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

/**
 * Utilities Tab - Manage utility payments
 */
function UtilitiesTab({ user }) {
  const utilities = [
    {
      id: 1,
      name: 'Electricity',
      provider: 'City Electric',
      amount: 85.5,
      dueDate: '2026-03-05',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Water',
      provider: 'City Water Dept',
      amount: 45.0,
      dueDate: '2026-03-10',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Internet',
      provider: 'Fast Internet Co',
      amount: 60.0,
      dueDate: '2026-02-28',
      status: 'paid',
    },
    {
      id: 4,
      name: 'Gas',
      provider: 'City Gas',
      amount: 32.75,
      dueDate: '2026-03-08',
      status: 'pending',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Total Due Summary */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <p className="text-brand-100 text-sm mb-2">Total Utilities Due</p>
        <p className="text-4xl font-bold mb-1">
          $
          {utilities
            .filter((u) => u.status === 'pending')
            .reduce((sum, u) => sum + u.amount, 0)
            .toFixed(2)}
        </p>
        <p className="text-brand-100 text-sm">
          {utilities.filter((u) => u.status === 'pending').length} bills pending
        </p>
      </div>

      {/* Utilities List */}
      <div className="space-y-3">
        {utilities.map((utility) => (
          <div
            key={utility.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                  <Zap size={20} className="text-brand-500" />
                </div>
                <div>
                  <h4 className="font-semibold">{utility.name}</h4>
                  <p className="text-sm text-gray-600">{utility.provider}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${utility.amount}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    utility.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {utility.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center">
                <Calendar size={14} className="mr-1" />
                Due: {new Date(utility.dueDate).toLocaleDateString()}
              </span>
              {utility.status === 'pending' && (
                <button className="text-brand-500 font-medium hover:underline">
                  Pay Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Split Utilities Info */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle size={20} className="text-brand-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Split with Roommates
            </h4>
            <p className="text-sm text-brand-600">
              If you have roommates, utility costs can be automatically split
              and charged separately.
            </p>
            <button className="mt-2 text-sm text-brand-500 font-medium hover:underline">
              Set up split payments →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Maintenance Tab - Submit and track maintenance requests
 */
function MaintenanceTab({ user }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    description: '',
  })

  const maintenanceRequests = [
    {
      id: 1,
      category: 'Plumbing',
      description: 'Kitchen sink is leaking',
      priority: 'high',
      status: 'in-progress',
      date: '2026-02-01',
      assignedTo: 'Mike Plumber',
    },
    {
      id: 2,
      category: 'Electrical',
      description: 'Living room light not working',
      priority: 'medium',
      status: 'pending',
      date: '2026-01-28',
      assignedTo: null,
    },
    {
      id: 3,
      category: 'HVAC',
      description: 'Heater making strange noise',
      priority: 'low',
      status: 'completed',
      date: '2026-01-15',
      assignedTo: 'Sarah HVAC Tech',
      completedDate: '2026-01-20',
    },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowForm(false)
      setFormData({ category: '', priority: 'medium', description: '' })
      alert('Maintenance request submitted successfully!')
    }, 1500)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in-progress':
        return 'bg-brand-100 text-brand-600'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getPriorityColor = (priority) => {
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
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
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
                {['low', 'medium', 'high'].map((priority) => (
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
                      onChange={(e) =>
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
                onChange={(e) =>
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
          </form>
        </div>
      )}

      {/* Existing Requests */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Your Requests</h3>
        {maintenanceRequests.map((request) => (
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
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                {request.priority}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                {request.status === 'in-progress'
                  ? 'In Progress'
                  : request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
              </span>
              <span className="text-gray-500">
                {new Date(request.date).toLocaleDateString()}
              </span>
            </div>

            {request.assignedTo && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                <span className="text-gray-600">Assigned to:</span>{' '}
                <span className="font-medium">{request.assignedTo}</span>
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
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Leases Tab - View and download lease documents
 */
function LeasesTab({ user }) {
  const leases = [
    {
      id: 1,
      property: '123 College Ave, Apt 4B',
      startDate: '2025-09-01',
      endDate: '2026-08-31',
      monthlyRent: 1200,
      status: 'active',
      landlord: 'John Property Owner',
      securityDeposit: 1200,
      signedDate: '2025-08-15',
    },
    {
      id: 2,
      property: '456 University Blvd, Unit 12',
      startDate: '2024-09-01',
      endDate: '2025-08-31',
      monthlyRent: 1100,
      status: 'expired',
      landlord: 'Sarah Johnson',
      securityDeposit: 1100,
      signedDate: '2024-08-10',
    },
  ]

  return (
    <div className="space-y-4">
      {leases.map((lease) => (
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
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                lease.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Lease Period</span>
              <p className="font-medium mt-1">
                {new Date(lease.startDate).toLocaleDateString()} -{' '}
                {new Date(lease.endDate).toLocaleDateString()}
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
            <button className="flex-1 flex items-center justify-center py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium">
              <Eye size={18} className="mr-2" />
              View Lease
            </button>
            <button className="flex-1 flex items-center justify-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
              <Download size={18} className="mr-2" />
              Download PDF
            </button>
          </div>

          {lease.status === 'active' && (
            <div className="mt-3 bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm">
              <AlertCircle size={16} className="inline text-brand-500 mr-2" />
              <span className="text-brand-600">
                {Math.ceil(
                  (new Date(lease.endDate) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days remaining in lease
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Lease Renewal Notice */}
      {leases.some((l) => l.status === 'active') && (
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
              <button className="text-sm text-green-600 font-medium hover:underline">
                Contact Landlord →
              </button>
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
function PaymentHistoryTab({ user }) {
  const [filterType, setFilterType] = useState('all')

  const payments = [
    {
      id: 1,
      type: 'rent',
      description: 'Monthly Rent - February 2026',
      amount: 1200,
      date: '2026-02-01',
      status: 'completed',
      method: 'Bank Account ****1234',
    },
    {
      id: 2,
      type: 'utility',
      description: 'Electricity - January 2026',
      amount: 85.5,
      date: '2026-01-28',
      status: 'completed',
      method: 'Debit Card ****5678',
    },
    {
      id: 3,
      type: 'rent',
      description: 'Monthly Rent - January 2026',
      amount: 1200,
      date: '2026-01-01',
      status: 'completed',
      method: 'Bank Account ****1234',
    },
    {
      id: 4,
      type: 'utility',
      description: 'Water - January 2026',
      amount: 45.0,
      date: '2026-01-25',
      status: 'completed',
      method: 'Bank Account ****1234',
    },
    {
      id: 5,
      type: 'rent',
      description: 'Monthly Rent - December 2025',
      amount: 1200,
      date: '2025-12-01',
      status: 'completed',
      method: 'Bank Account ****1234',
    },
    {
      id: 6,
      type: 'deposit',
      description: 'Security Deposit',
      amount: 1200,
      date: '2025-08-15',
      status: 'completed',
      method: 'Bank Transfer',
    },
  ]

  const filteredPayments =
    filterType === 'all'
      ? payments
      : payments.filter((p) => p.type === filterType)

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
        {['all', 'rent', 'utility', 'deposit'].map((type) => (
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
        {filteredPayments.map((payment) => (
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
              <button className="text-brand-500 font-medium hover:underline">
                View Receipt
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center">
        <Download size={20} className="mr-2" />
        Export Payment History
      </button>
    </div>
  )
}

export default StudentTenantDashboard
