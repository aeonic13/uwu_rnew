import React, { useState } from 'react'
import {
  ArrowLeft,
  FileText,
  Download,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Home,
  User,
  Shield,
  AlertCircle,
  Check,
} from 'lucide-react'

const ViewLeaseView = ({ user, lease, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock lease data - in a real app, this would come from the backend
  const leaseDetails = {
    id: lease?.id || 'lease-001',
    status: 'active',
    property: {
      address:
        lease?.property?.address || '123 University Ave, Los Angeles, CA 90007',
      type: 'Studio Apartment',
      sqft: 650,
      bedrooms: 0,
      bathrooms: 1,
    },
    tenant: {
      name: user?.name || 'John Student',
      email: user?.email || 'john@university.edu',
      phone: '(555) 123-4567',
      emergencyContact: 'Jane Student - (555) 987-6543',
    },
    landlord: {
      name: lease?.landlord?.name || 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: lease?.landlord?.phone || '(555) 123-4567',
      company: 'Chen Properties LLC',
    },
    terms: {
      startDate: lease?.startDate || '2024-01-01',
      endDate: lease?.endDate || '2024-06-30',
      monthlyRent: lease?.monthlyRent || 1200,
      securityDeposit: 1200,
      lateFee: 50,
      gracePeriod: 5, // days
      renewalOption: true,
      earlyTerminationFee: 2400,
    },
    utilities: {
      included: ['Water', 'Sewer', 'Trash'],
      notIncluded: ['Electricity', 'Gas', 'Internet', 'Cable'],
      electricityEstimate: 85,
      gasEstimate: 45,
      internetEstimate: 80,
    },
    amenities: [
      'In-unit Laundry',
      'Air Conditioning',
      'Parking Space',
      'Pool Access',
      'Gym Access',
      'Pet-Friendly (with deposit)',
    ],
    rules: [
      'No smoking anywhere on the property',
      'Quiet hours: 10 PM - 8 AM',
      'Maximum 2 overnight guests per week',
      'No rentalting without written permission',
      'Tenant responsible for minor repairs under $100',
    ],
    payments: [
      { date: '2024-01-01', amount: 1200, type: 'rent', status: 'paid' },
      {
        date: '2024-01-01',
        amount: 1200,
        type: 'security_deposit',
        status: 'paid',
      },
      { date: '2024-02-01', amount: 1200, type: 'rent', status: 'paid' },
      { date: '2024-03-01', amount: 1200, type: 'rent', status: 'pending' },
    ],
    documents: [
      { name: 'Signed Lease Agreement', type: 'pdf', date: '2024-01-01' },
      { name: 'Property Inspection Report', type: 'pdf', date: '2024-01-01' },
      { name: 'Security Deposit Receipt', type: 'pdf', date: '2024-01-01' },
      { name: 'Rent Payment History', type: 'pdf', date: '2024-03-01' },
    ],
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDaysRemaining = () => {
    const endDate = new Date(leaseDetails.terms.endDate)
    const today = new Date()
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const downloadDocument = document => {
    console.log('Downloading document:', document.name)
    alert(`Downloading ${document.name}...`)
  }

  const contactLandlord = method => {
    if (method === 'email') {
      window.location.href = `mailto:${leaseDetails.landlord.email}`
    } else if (method === 'phone') {
      window.location.href = `tel:${leaseDetails.landlord.phone}`
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">My Lease</h2>
      </div>

      {/* Lease Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FileText size={24} className="text-brand-500 mr-3" />
            <div>
              <h3 className="font-semibold">Lease Agreement</h3>
              <p className="text-sm text-gray-600">ID: {leaseDetails.id}</p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(leaseDetails.status)}`}
          >
            {leaseDetails.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Lease Period</p>
            <p className="font-semibold">
              {formatDate(leaseDetails.terms.startDate)} -{' '}
              {formatDate(leaseDetails.terms.endDate)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Days Remaining</p>
            <p className="font-semibold text-brand-500">
              {getDaysRemaining()} days
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        {['overview', 'terms', 'payments', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-1 text-sm font-medium capitalize border-b-2 ${
              activeTab === tab
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Property Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center">
              <Home size={18} className="mr-2 text-brand-500" />
              Property Details
            </h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="font-medium text-right">
                  {leaseDetails.property.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-medium">
                  {leaseDetails.property.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size</span>
                <span className="font-medium">
                  {leaseDetails.property.sqft} sq ft
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bedrooms/Bathrooms</span>
                <span className="font-medium">
                  {leaseDetails.property.bedrooms}BR /{' '}
                  {leaseDetails.property.bathrooms}BA
                </span>
              </div>
            </div>
          </div>

          {/* Landlord Contact */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center">
              <User size={18} className="mr-2 text-green-600" />
              Landlord Contact
            </h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">
                  {leaseDetails.landlord.name}
                </span>
              </p>
              <p className="text-gray-600">{leaseDetails.landlord.company}</p>
              <div className="flex space-x-4 mt-3">
                <button
                  onClick={() => contactLandlord('email')}
                  className="flex items-center px-3 py-2 bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-100"
                >
                  <Mail size={16} className="mr-1" />
                  Email
                </button>
                <button
                  onClick={() => contactLandlord('phone')}
                  className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Phone size={16} className="mr-1" />
                  Call
                </button>
              </div>
            </div>
          </div>

          {/* Utilities */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center">
              <DollarSign size={18} className="mr-2 text-yellow-600" />
              Utilities
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-green-600 mb-1">
                  Included in Rent:
                </p>
                <p>{leaseDetails.utilities.included.join(', ')}</p>
              </div>
              <div>
                <p className="font-medium text-orange-600 mb-1">
                  Your Responsibility:
                </p>
                <div className="space-y-1">
                  {leaseDetails.utilities.notIncluded.map((utility, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{utility}</span>
                      <span className="text-gray-600">
                        ~$
                        {utility === 'Electricity'
                          ? leaseDetails.utilities.electricityEstimate
                          : utility === 'Gas'
                            ? leaseDetails.utilities.gasEstimate
                            : utility === 'Internet'
                              ? leaseDetails.utilities.internetEstimate
                              : '?'}
                        /month
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Amenities</h4>
            <div className="grid grid-cols-1 gap-2">
              {leaseDetails.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check size={16} className="text-green-600 mr-2" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Terms Tab */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          {/* Financial Terms */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Financial Terms</h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-semibold text-green-600">
                  ${leaseDetails.terms.monthlyRent}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-medium">
                  ${leaseDetails.terms.securityDeposit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late Fee</span>
                <span className="font-medium">
                  ${leaseDetails.terms.lateFee} (after{' '}
                  {leaseDetails.terms.gracePeriod} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Early Termination Fee</span>
                <span className="font-medium">
                  ${leaseDetails.terms.earlyTerminationFee}
                </span>
              </div>
            </div>
          </div>

          {/* House Rules */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">House Rules</h4>
            <div className="space-y-2">
              {leaseDetails.rules.map((rule, index) => (
                <div key={index} className="flex items-start text-sm">
                  <AlertCircle
                    size={16}
                    className="text-orange-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Renewal Information */}
          <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
            <h4 className="font-semibold text-blue-800 mb-2">Lease Renewal</h4>
            <p className="text-sm text-brand-600">
              {leaseDetails.terms.renewalOption
                ? 'Your lease includes an option to renew. Contact your landlord 60 days before expiration to discuss renewal terms.'
                : 'This lease does not include an automatic renewal option. You will need to negotiate a new lease if you wish to stay beyond the current term.'}
            </p>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              Payment Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-brand-500">Total Paid</p>
                <p className="text-xl font-bold text-blue-800">
                  $
                  {leaseDetails.payments
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + p.amount, 0)}
                </p>
              </div>
              <div>
                <p className="text-brand-500">Security Deposit</p>
                <p className="text-lg font-semibold text-blue-800">
                  ${leaseDetails.terms.securityDeposit}
                </p>
              </div>
            </div>
          </div>

          {leaseDetails.payments.map((payment, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium capitalize">
                    {payment.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(payment.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${payment.amount}</p>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      payment.status === 'paid'
                        ? 'text-green-600 bg-green-50 border-green-200'
                        : 'text-yellow-600 bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    {payment.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {leaseDetails.documents.map((document, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText size={20} className="text-brand-500 mr-3" />
                  <div>
                    <p className="font-medium">{document.name}</p>
                    <p className="text-sm text-gray-600">
                      {document.type.toUpperCase()} •{' '}
                      {formatDate(document.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadDocument(document)}
                  className="flex items-center px-3 py-2 bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-100"
                >
                  <Download size={16} className="mr-1" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ViewLeaseView
