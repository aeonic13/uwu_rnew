import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Eye,
  MessageSquare,
  Send,
  Download,
  Building,
  MapPin,
  Star,
  Briefcase,
  GraduationCap,
  Users,
  Home,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Info,
  Zap,
  Bell,
} from 'lucide-react'

const OwnerApprovalSystem = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [approvalDecision, setApprovalDecision] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  // Mock data for owner approval requests
  const [approvalData] = useState({
    owner: {
      name: 'Robert Chen',
      email: 'rchen@propertymanagement.com',
      phone: '(555) 987-6543',
      properties: [
        '123 University Ave, Unit 3A',
        '456 College Street, Unit 2B',
        '789 Campus Drive, Unit 1C',
      ],
      totalUnits: 15,
      occupancyRate: 95,
    },
    pendingRequests: [
      {
        id: 'req-001',
        status: 'pending_owner_approval',
        submittedDate: '2024-03-25',
        priority: 'high', // high, medium, low based on lease end date proximity
        student: {
          name: 'Alex Johnson',
          email: 'alex@usc.edu',
          phone: '(555) 234-5678',
          university: 'USC',
          currentTenant: true,
          leaseEnd: '2024-08-31',
          rentHistory: {
            onTime: 12,
            late: 0,
            totalPaid: 28800,
            avgDaysEarly: 2.1,
          },
          verification: {
            studentStatus: true,
            income: true,
            references: true,
            backgroundCheck: true,
          },
        },
        property: {
          address: '123 University Ave, Unit 3A',
          currentRent: 2400,
          propertyType: 'Apartment',
          bedrooms: 2,
          bathrooms: 1,
        },
        lease: {
          requestedRent: 1200,
          startDate: '2024-04-01',
          endDate: '2024-07-31',
          reason: 'Study Abroad Program',
          duration: 4, // months
          type: 'room', // room, entire-unit
        },
        proposedSublessee: {
          name: 'Maria Rodriguez',
          email: 'maria.r@ucla.edu',
          phone: '(555) 345-6789',
          university: 'UCLA',
          verificationStatus: 'pending',
          creditScore: 720,
          income: '$3,200/month',
          references: [
            {
              name: 'Dr. Smith',
              relation: 'Professor',
              phone: '(555) 111-2222',
            },
            {
              name: 'Sarah Kim',
              relation: 'Previous Landlord',
              phone: '(555) 333-4444',
            },
          ],
          background: {
            criminalHistory: 'clean',
            evictionHistory: 'none',
            employmentVerified: true,
          },
        },
        documents: [
          {
            type: 'student_id',
            status: 'verified',
            uploadedDate: '2024-03-20',
          },
          {
            type: 'transcript',
            status: 'verified',
            uploadedDate: '2024-03-20',
          },
          {
            type: 'income_proof',
            status: 'pending',
            uploadedDate: '2024-03-22',
          },
          {
            type: 'lease_agreement',
            status: 'draft',
            uploadedDate: '2024-03-24',
          },
        ],
        riskAssessment: {
          overallRisk: 'low',
          factors: {
            studentHistory: 'excellent',
            proposedSublessee: 'good',
            financialStability: 'strong',
            legalCompliance: 'compliant',
          },
          recommendations: [
            'Approve with standard terms',
            'Require monthly check-ins',
            'Set sublessee screening requirements',
          ],
        },
      },
      {
        id: 'req-002',
        status: 'pending_owner_approval',
        submittedDate: '2024-03-23',
        priority: 'medium',
        student: {
          name: 'Jessica Wong',
          email: 'jessica.w@berkeley.edu',
          phone: '(555) 456-7890',
          university: 'UC Berkeley',
          currentTenant: true,
          leaseEnd: '2024-12-31',
          rentHistory: {
            onTime: 8,
            late: 1,
            totalPaid: 19200,
            avgDaysEarly: 1.5,
          },
          verification: {
            studentStatus: true,
            income: true,
            references: true,
            backgroundCheck: false,
          },
        },
        property: {
          address: '456 College Street, Unit 2B',
          currentRent: 2000,
          propertyType: 'Studio',
          bedrooms: 1,
          bathrooms: 1,
        },
        lease: {
          requestedRent: 2000,
          startDate: '2024-05-15',
          endDate: '2024-08-15',
          reason: 'Summer Internship',
          duration: 3,
          type: 'entire-unit',
        },
        proposedSublessee: {
          name: 'James Park',
          email: 'jpark@stanford.edu',
          phone: '(555) 567-8901',
          university: 'Stanford',
          verificationStatus: 'incomplete',
          creditScore: 0, // Not provided yet
          income: 'Not disclosed',
          references: [],
          background: {
            criminalHistory: 'pending',
            evictionHistory: 'pending',
            employmentVerified: false,
          },
        },
        documents: [
          {
            type: 'student_id',
            status: 'verified',
            uploadedDate: '2024-03-23',
          },
          { type: 'transcript', status: 'missing', uploadedDate: null },
          { type: 'income_proof', status: 'missing', uploadedDate: null },
        ],
        riskAssessment: {
          overallRisk: 'high',
          factors: {
            studentHistory: 'good',
            proposedSublessee: 'incomplete',
            financialStability: 'unknown',
            legalCompliance: 'needs_review',
          },
          recommendations: [
            'Request additional documentation',
            'Require co-signer',
            'Consider shorter trial period',
          ],
        },
      },
    ],
    approvedRequests: [
      {
        id: 'req-003',
        status: 'approved',
        submittedDate: '2024-03-15',
        approvedDate: '2024-03-18',
        student: {
          name: 'David Kim',
          email: 'david.k@usc.edu',
        },
        property: {
          address: '789 Campus Drive, Unit 1C',
        },
        lease: {
          startDate: '2024-04-01',
          endDate: '2024-06-30',
          approvedRent: 1500,
          type: 'room',
        },
        approvalNotes:
          'Excellent tenant history. Approved with standard terms.',
        conditions: [
          'Monthly progress reports required',
          'Sublessee must pass background check',
          'No pets allowed',
        ],
      },
    ],
    rejectedRequests: [
      {
        id: 'req-004',
        status: 'rejected',
        submittedDate: '2024-03-10',
        rejectedDate: '2024-03-12',
        student: {
          name: 'Lisa Chang',
          email: 'lisa.c@ucla.edu',
        },
        property: {
          address: '123 University Ave, Unit 3A',
        },
        rejectionReason:
          'Incomplete documentation and proposed sublessee failed background check.',
        appealDeadline: '2024-03-26',
      },
    ],
    statistics: {
      totalRequests: 15,
      approved: 8,
      rejected: 3,
      pending: 4,
      approvalRate: 73,
      avgProcessingTime: '2.5 days',
    },
  })

  const getStatusColor = status => {
    switch (status) {
      case 'pending_owner_approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-brand-100 text-blue-800'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getRiskColor = risk => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleApprovalDecision = decision => {
    if (!selectedRequest) return

    const approvalData = {
      requestId: selectedRequest.id,
      decision: decision,
      notes: approvalNotes,
      conditions:
        decision === 'approved'
          ? [
              'Sublessee must pass background check',
              'Monthly check-ins required',
              'Original lease terms apply',
            ]
          : [],
      processedDate: new Date().toISOString(),
      processedBy: user.name,
    }

    console.log('Processing approval:', approvalData)

    // In a real app, this would update the database
    if (decision === 'approved') {
      alert(
        `Lease request approved!\n\nNext steps:\n1. Student and sublessee will be notified\n2. Legal documents will be generated\n3. Background check will be initiated for sublessee\n4. Move-in process will be coordinated`
      )
    } else {
      alert(
        `Lease request rejected.\n\nThe student will be notified with your feedback and given the opportunity to address concerns and resubmit.`
      )
    }

    setShowApprovalModal(false)
    setSelectedRequest(null)
    setApprovalNotes('')
    setApprovalDecision('')
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Lease Approval Center</h2>
        <div className="flex items-center text-gray-600">
          <Shield size={16} className="mr-2" />
          <span>Review and approve lease requests from your tenants</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4">Approval Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {approvalData.statistics.pending}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {approvalData.statistics.approvalRate}%
            </div>
            <div className="text-sm text-gray-600">Approval Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-500">
              {approvalData.statistics.avgProcessingTime}
            </div>
            <div className="text-sm text-gray-600">Avg Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {approvalData.statistics.totalRequests}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            {tab === 'pending' &&
              `Pending (${approvalData.pendingRequests.length})`}
            {tab === 'approved' &&
              `Approved (${approvalData.approvedRequests.length})`}
            {tab === 'rejected' &&
              `Rejected (${approvalData.rejectedRequests.length})`}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {approvalData.pendingRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold mr-3">
                      {request.student.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}
                    >
                      Pending Review
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium ${getPriorityColor(request.priority)}`}
                    >
                      {request.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {request.property.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted{' '}
                    {new Date(request.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ${request.lease.requestedRent}/month
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.lease.duration} months
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Risk Assessment</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getRiskColor(request.riskAssessment.overallRisk)}`}
                  >
                    {request.riskAssessment.overallRisk} risk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    Tenant History:{' '}
                    <span className="font-medium">
                      {request.riskAssessment.factors.studentHistory}
                    </span>
                  </div>
                  <div>
                    Sublessee:{' '}
                    <span className="font-medium">
                      {request.riskAssessment.factors.proposedSublessee}
                    </span>
                  </div>
                  <div>
                    Financial:{' '}
                    <span className="font-medium">
                      {request.riskAssessment.factors.financialStability}
                    </span>
                  </div>
                  <div>
                    Legal:{' '}
                    <span className="font-medium">
                      {request.riskAssessment.factors.legalCompliance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Reason:</span>
                  <span className="ml-2 font-medium">
                    {request.lease.reason}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">
                    {request.lease.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">
                    {new Date(request.lease.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.lease.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Proposed Sublessee:</span>
                  <span className="ml-2 font-medium">
                    {request.proposedSublessee.name}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center justify-center"
                >
                  <Eye size={16} className="mr-2" />
                  Review Details
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setApprovalDecision('approved')
                    setShowApprovalModal(true)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <ThumbsUp size={16} className="mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setApprovalDecision('rejected')
                    setShowApprovalModal(true)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  <ThumbsDown size={16} className="mr-1" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved Requests */}
      {activeTab === 'approved' && (
        <div className="space-y-4">
          {approvalData.approvedRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold mr-3">
                      {request.student.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}
                    >
                      Approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {request.property.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Approved{' '}
                    {new Date(request.approvedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ${request.lease.approvedRent}/month
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.lease.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.lease.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-green-800 font-medium mb-2">
                  Approval Notes:
                </p>
                <p className="text-sm text-green-700">
                  {request.approvalNotes}
                </p>
              </div>

              {request.conditions && request.conditions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Conditions:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {request.conditions.map((condition, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Download size={16} />
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejected Requests */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          {approvalData.rejectedRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold mr-3">
                      {request.student.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}
                    >
                      Rejected
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {request.property.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Rejected{' '}
                    {new Date(request.rejectedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-700">
                  {request.rejectionReason}
                </p>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Appeal deadline:{' '}
                {new Date(request.appealDeadline).toLocaleDateString()}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">
                  View Details
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Request Modal */}
      {selectedRequest && !showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Lease Request Details</h2>
                <button onClick={() => setSelectedRequest(null)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <GraduationCap size={20} className="mr-2 text-brand-500" />
                    Current Tenant
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong> {selectedRequest.student.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedRequest.student.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedRequest.student.phone}
                    </div>
                    <div>
                      <strong>University:</strong>{' '}
                      {selectedRequest.student.university}
                    </div>
                    <div>
                      <strong>Lease End:</strong>{' '}
                      {selectedRequest.student.leaseEnd}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Payment History</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        On-time:{' '}
                        <strong>
                          {selectedRequest.student.rentHistory.onTime}
                        </strong>
                      </div>
                      <div>
                        Late:{' '}
                        <strong>
                          {selectedRequest.student.rentHistory.late}
                        </strong>
                      </div>
                      <div>
                        Total Paid:{' '}
                        <strong>
                          $
                          {selectedRequest.student.rentHistory.totalPaid.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        Avg Early:{' '}
                        <strong>
                          {selectedRequest.student.rentHistory.avgDaysEarly}{' '}
                          days
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proposed Sublessee */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <User size={20} className="mr-2 text-green-600" />
                    Proposed Sublessee
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Name:</strong>{' '}
                      {selectedRequest.proposedSublessee.name}
                    </div>
                    <div>
                      <strong>Email:</strong>{' '}
                      {selectedRequest.proposedSublessee.email}
                    </div>
                    <div>
                      <strong>Phone:</strong>{' '}
                      {selectedRequest.proposedSublessee.phone}
                    </div>
                    <div>
                      <strong>University:</strong>{' '}
                      {selectedRequest.proposedSublessee.university}
                    </div>
                    <div>
                      <strong>Income:</strong>{' '}
                      {selectedRequest.proposedSublessee.income}
                    </div>
                    {selectedRequest.proposedSublessee.creditScore > 0 && (
                      <div>
                        <strong>Credit Score:</strong>{' '}
                        {selectedRequest.proposedSublessee.creditScore}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Background Check</h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        Criminal:{' '}
                        <strong>
                          {
                            selectedRequest.proposedSublessee.background
                              .criminalHistory
                          }
                        </strong>
                      </div>
                      <div>
                        Evictions:{' '}
                        <strong>
                          {
                            selectedRequest.proposedSublessee.background
                              .evictionHistory
                          }
                        </strong>
                      </div>
                      <div>
                        Employment:{' '}
                        <strong>
                          {selectedRequest.proposedSublessee.background
                            .employmentVerified
                            ? 'Verified'
                            : 'Pending'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lease Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Home size={20} className="mr-2 text-purple-600" />
                    Lease Terms
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Property:</strong>{' '}
                      {selectedRequest.property.address}
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedRequest.lease.type}
                    </div>
                    <div>
                      <strong>Requested Rent:</strong> $
                      {selectedRequest.lease.requestedRent}/month
                    </div>
                    <div>
                      <strong>Current Rent:</strong> $
                      {selectedRequest.property.currentRent}/month
                    </div>
                    <div>
                      <strong>Start Date:</strong>{' '}
                      {new Date(
                        selectedRequest.lease.startDate
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>End Date:</strong>{' '}
                      {new Date(
                        selectedRequest.lease.endDate
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Duration:</strong>{' '}
                      {selectedRequest.lease.duration} months
                    </div>
                    <div>
                      <strong>Reason:</strong> {selectedRequest.lease.reason}
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <AlertTriangle size={20} className="mr-2 text-orange-600" />
                    Risk Assessment
                  </h3>
                  <div className="mb-3">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${getRiskColor(selectedRequest.riskAssessment.overallRisk)}`}
                    >
                      {selectedRequest.riskAssessment.overallRisk} Risk
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      Student History:{' '}
                      <strong>
                        {selectedRequest.riskAssessment.factors.studentHistory}
                      </strong>
                    </div>
                    <div>
                      Proposed Sublessee:{' '}
                      <strong>
                        {
                          selectedRequest.riskAssessment.factors
                            .proposedSublessee
                        }
                      </strong>
                    </div>
                    <div>
                      Financial Stability:{' '}
                      <strong>
                        {
                          selectedRequest.riskAssessment.factors
                            .financialStability
                        }
                      </strong>
                    </div>
                    <div>
                      Legal Compliance:{' '}
                      <strong>
                        {selectedRequest.riskAssessment.factors.legalCompliance}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="text-xs space-y-1">
                      {selectedRequest.riskAssessment.recommendations.map(
                        (rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setApprovalDecision('approved')
                    setShowApprovalModal(true)
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Approve Request
                </button>
                <button
                  onClick={() => {
                    setApprovalDecision('rejected')
                    setShowApprovalModal(true)
                  }}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {approvalDecision === 'approved' ? 'Approve' : 'Reject'} Lease
                  Request
                </h2>
                <button onClick={() => setShowApprovalModal(false)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm">
                    <strong>Student:</strong> {selectedRequest.student.name}
                  </p>
                  <p className="text-sm">
                    <strong>Property:</strong>{' '}
                    {selectedRequest.property.address}
                  </p>
                  <p className="text-sm">
                    <strong>Sublessee:</strong>{' '}
                    {selectedRequest.proposedSublessee.name}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {approvalDecision === 'approved'
                    ? 'Approval Notes'
                    : 'Rejection Reason'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalDecision === 'approved'
                      ? 'Add any conditions or notes for the approval...'
                      : 'Explain why this request is being rejected...'
                  }
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprovalDecision(approvalDecision)}
                  disabled={!approvalNotes.trim()}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    approvalNotes.trim()
                      ? approvalDecision === 'approved'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {approvalDecision === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 mt-6"
      >
        Back
      </button>
    </div>
  )
}

export default OwnerApprovalSystem
