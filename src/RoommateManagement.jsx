import React, { useState } from 'react'
import {
  Users,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Home,
  Settings,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  UserMinus,
  Shield,
  Star,
  CreditCard,
  FileText,
  Bell,
  X,
  ArrowRight,
} from 'lucide-react'

const RoommateManagement = ({
  property,
  currentUser,
  userType,
  onBack,
  onNavigateToSecurityDeposit,
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    rentAmount: '',
    moveInDate: '',
    message: '',
  })

  // Mock data for active rental
  const [rentalData, setRentalData] = useState({
    id: 'rental-001',
    property: {
      address: '123 University Ave, Los Angeles, CA',
      bedrooms: 3,
      bathrooms: 2,
      totalRent: 3600,
      leaseStart: '2024-01-01',
      leaseEnd: '2024-08-31',
    },
    owner: {
      name: 'Sarah Chen',
      email: 'sarah@email.com',
      phone: '(555) 123-4567',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    },
    tenants: [
      {
        id: 'tenant-1',
        name: 'Alex Johnson',
        email: 'alex@usc.edu',
        phone: '(555) 234-5678',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        role: 'primary', // primary, roommate
        rentAmount: 1400,
        moveInDate: '2024-01-01',
        status: 'active',
        paymentStatus: 'current',
        lastPayment: '2024-03-01',
        university: 'USC',
        year: 'Senior',
        verified: true,
        creditScore: 742,
        backgroundCheck: 'passed',
      },
      {
        id: 'tenant-2',
        name: 'Maria Rodriguez',
        email: 'maria@ucla.edu',
        phone: '(555) 345-6789',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
        role: 'roommate',
        rentAmount: 1100,
        moveInDate: '2024-02-01',
        status: 'active',
        paymentStatus: 'current',
        lastPayment: '2024-03-01',
        university: 'UCLA',
        year: 'Junior',
        verified: true,
        creditScore: 678,
        backgroundCheck: 'passed',
      },
      {
        id: 'tenant-3',
        name: 'Empty Room',
        email: null,
        phone: null,
        avatar: null,
        role: 'vacant',
        rentAmount: 1100,
        moveInDate: null,
        status: 'vacant',
        paymentStatus: 'n/a',
        lastPayment: null,
        university: null,
        year: null,
        verified: false,
        creditScore: null,
        backgroundCheck: null,
      },
    ],
    pendingInvitations: [
      {
        id: 'invite-1',
        email: 'john@berkeley.edu',
        name: 'John Smith',
        invitedBy: 'tenant-1',
        invitedDate: '2024-03-15',
        status: 'pending', // pending, accepted, declined
        rentAmount: 1100,
        moveInDate: '2024-04-01',
      },
    ],
    financials: {
      totalMonthlyRent: 3600,
      collectedThisMonth: 2500,
      outstandingAmount: 1100,
      securityDeposits: 7200,
      utilityBills: [
        {
          type: 'electricity',
          amount: 180,
          dueDate: '2024-03-20',
          status: 'pending',
        },
        { type: 'water', amount: 45, dueDate: '2024-03-25', status: 'paid' },
      ],
    },
  })

  const handleInviteRoommate = () => {
    const newInvite = {
      id: `invite-${Date.now()}`,
      email: inviteForm.email,
      name: inviteForm.name,
      invitedBy: currentUser.id,
      invitedDate: new Date().toISOString(),
      status: 'pending',
      rentAmount: parseFloat(inviteForm.rentAmount),
      moveInDate: inviteForm.moveInDate,
    }

    setRentalData(prev => ({
      ...prev,
      pendingInvitations: [...prev.pendingInvitations, newInvite],
    }))

    // Reset form
    setInviteForm({
      email: '',
      name: '',
      rentAmount: '',
      moveInDate: '',
      message: '',
    })

    setShowInviteModal(false)

    // Send invitation email (mock)
    console.log('Sending invitation email to:', inviteForm.email)
  }

  const handleRemoveRoommate = tenantId => {
    setRentalData(prev => ({
      ...prev,
      tenants: prev.tenants.map(tenant =>
        tenant.id === tenantId
          ? {
              ...tenant,
              name: 'Empty Room',
              email: null,
              phone: null,
              avatar: null,
              role: 'vacant',
              status: 'vacant',
              paymentStatus: 'n/a',
            }
          : tenant
      ),
    }))
    setShowRemoveModal(null)
  }

  const getStatusColor = status => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const activeTenants = rentalData.tenants.filter(t => t.status === 'active')
  const vacantRooms = rentalData.tenants.filter(t => t.status === 'vacant')
  const occupancyRate = Math.round(
    (activeTenants.length / rentalData.tenants.length) * 100
  )

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Property Management</h2>
          {userType === 'tenant' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center"
            >
              <UserPlus size={16} className="mr-2" />
              Invite Roommate
            </button>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center text-sm text-gray-800">
            <Home size={16} className="mr-2" />
            <span>{rentalData.property.address}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">
              {rentalData.property.bedrooms} bed •{' '}
              {rentalData.property.bathrooms} bath
            </span>
            <span className="text-sm font-medium text-green-600">
              {occupancyRate}% occupied
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('roommates')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'roommates'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          Roommates
        </button>
        <button
          onClick={() => setActiveTab('finances')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'finances'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          Finances
        </button>
        {userType === 'owner' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Settings
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
              <div className="text-2xl font-bold text-brand-500">
                {activeTenants.length}
              </div>
              <div className="text-sm text-brand-600">Active Tenants</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                ${rentalData.financials.collectedThisMonth}
              </div>
              <div className="text-sm text-green-700">Collected This Month</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {vacantRooms.length}
              </div>
              <div className="text-sm text-yellow-700">Vacant Rooms</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {rentalData.pendingInvitations.length}
              </div>
              <div className="text-sm text-purple-700">Pending Invites</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Payment received from Maria Rodriguez
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago • $1,100</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                  <Mail size={16} className="text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Roommate invitation sent to john@berkeley.edu
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <FileText size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Lease agreement signed by Alex Johnson
                  </p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={onNavigateToSecurityDeposit}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Shield size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">
                      {userType === 'owner'
                        ? 'Manage Security Deposits'
                        : 'Security Deposit Protection'}
                    </p>
                    <p className="text-sm text-gray-600">
                      View deposit status and protection details
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              {userType === 'owner' && (
                <button className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <FileText size={20} className="text-brand-500 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">Generate Rent Report</p>
                      <p className="text-sm text-gray-600">
                        Export financial summary and records
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Pending Actions */}
          {(rentalData.pendingInvitations.length > 0 ||
            vacantRooms.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <Clock size={20} className="mr-2" />
                Action Required
              </h3>
              <div className="space-y-2">
                {rentalData.pendingInvitations.length > 0 && (
                  <p className="text-sm text-yellow-700">
                    • {rentalData.pendingInvitations.length} pending roommate
                    invitation(s)
                  </p>
                )}
                {vacantRooms.length > 0 && (
                  <p className="text-sm text-yellow-700">
                    • {vacantRooms.length} vacant room(s) available for new
                    tenants
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roommates Tab */}
      {activeTab === 'roommates' && (
        <div className="space-y-4">
          {/* Current Roommates */}
          <div>
            <h3 className="font-semibold mb-3">Current Roommates</h3>
            {rentalData.tenants.map((tenant, index) => (
              <div
                key={tenant.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
              >
                {tenant.status === 'vacant' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        <Home size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600">
                          Room Available
                        </h4>
                        <p className="text-sm text-gray-500">
                          ${tenant.rentAmount}/month
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Find Roommate
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <img
                        src={tenant.avatar}
                        alt={tenant.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-semibold mr-2">{tenant.name}</h4>
                          {tenant.verified && (
                            <Shield size={16} className="text-brand-500" />
                          )}
                          {tenant.role === 'primary' && (
                            <span className="ml-2 px-2 py-1 bg-brand-100 text-blue-800 text-xs rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tenant.university} • {tenant.year}
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="text-sm font-medium">
                            ${tenant.rentAmount}/month
                          </span>
                          <span
                            className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(tenant.paymentStatus)}`}
                          >
                            {tenant.paymentStatus === 'current'
                              ? 'Paid'
                              : tenant.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-500 hover:text-brand-500">
                        <MessageCircle size={16} />
                      </button>
                      {(userType === 'owner' || tenant.role !== 'primary') && (
                        <button
                          onClick={() => setShowRemoveModal(tenant.id)}
                          className="p-2 text-gray-500 hover:text-red-600"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tenant Details (Expandable) */}
                {tenant.status === 'active' && userType === 'owner' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{tenant.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{tenant.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Credit Score:</span>
                        <p className="font-medium">{tenant.creditScore}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Background:</span>
                        <p className="font-medium capitalize">
                          {tenant.backgroundCheck}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pending Invitations */}
          {rentalData.pendingInvitations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Pending Invitations</h3>
              {rentalData.pendingInvitations.map(invite => (
                <div
                  key={invite.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{invite.name}</h4>
                      <p className="text-sm text-gray-600">{invite.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited{' '}
                        {new Date(invite.invitedDate).toLocaleDateString()} • $
                        {invite.rentAmount}/month
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        Pending
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Move-in:{' '}
                        {new Date(invite.moveInDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Finances Tab */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          {/* Monthly Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">March 2024 Summary</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center">
                <span>Total Monthly Rent:</span>
                <span className="font-semibold">
                  ${rentalData.financials.totalMonthlyRent}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Collected This Month:</span>
                <span className="font-semibold text-green-600">
                  ${rentalData.financials.collectedThisMonth}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Outstanding Amount:</span>
                <span className="font-semibold text-red-600">
                  ${rentalData.financials.outstandingAmount}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span>Security Deposits Held:</span>
                <span className="font-semibold">
                  ${rentalData.financials.securityDeposits}
                </span>
              </div>
            </div>
          </div>

          {/* Rent Status by Tenant */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Rent Status</h3>
            <div className="space-y-3">
              {activeTenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <img
                      src={tenant.avatar}
                      alt={tenant.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-gray-600">
                        ${tenant.rentAmount}/month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tenant.paymentStatus)}`}
                    >
                      {tenant.paymentStatus === 'current'
                        ? 'Paid'
                        : tenant.paymentStatus}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {new Date(tenant.lastPayment).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Utility Bills */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Shared Utilities</h3>
            <div className="space-y-3">
              {rentalData.financials.utilityBills.map((bill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                      <FileText size={16} className="text-brand-500" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{bill.type}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${bill.amount}</p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        bill.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab (Owner Only) */}
      {activeTab === 'settings' && userType === 'owner' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Property Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monthly Rent
                </label>
                <input
                  type="number"
                  defaultValue={rentalData.property.totalRent}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Lease End Date
                </label>
                <input
                  type="date"
                  defaultValue={rentalData.property.leaseEnd}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Allow Roommate Invitations</p>
                  <p className="text-sm text-gray-600">
                    Let tenants invite their own roommates
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-500">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-800 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700">
                Terminate All Leases
              </button>
              <p className="text-sm text-red-700">
                This will end all active leases and remove all tenants. This
                action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Roommate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Invite Roommate</h2>
                <button onClick={() => setShowInviteModal(false)}>
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={e =>
                      setInviteForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter roommate's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={e =>
                      setInviteForm(prev => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="roommate@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly Rent
                  </label>
                  <input
                    type="number"
                    value={inviteForm.rentAmount}
                    onChange={e =>
                      setInviteForm(prev => ({
                        ...prev,
                        rentAmount: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="1100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    value={inviteForm.moveInDate}
                    onChange={e =>
                      setInviteForm(prev => ({
                        ...prev,
                        moveInDate: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={e =>
                      setInviteForm(prev => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={3}
                    placeholder="Hi! I'd love to have you as a roommate..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteRoommate}
                  disabled={
                    !inviteForm.email ||
                    !inviteForm.name ||
                    !inviteForm.rentAmount
                  }
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    inviteForm.email && inviteForm.name && inviteForm.rentAmount
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Roommate Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle size={24} className="text-red-600 mr-3" />
                <h2 className="text-xl font-semibold">Remove Roommate</h2>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this roommate? This will end
                their lease and they will need to vacate the property.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRemoveModal(null)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveRoommate(showRemoveModal)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Remove Roommate
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

export default RoommateManagement
