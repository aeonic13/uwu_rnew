import React, { useState } from 'react';
import { 
  Users, Plus, Mail, Phone, CreditCard, Shield, CheckCircle, XCircle,
  Edit, Trash2, Settings, AlertTriangle, Clock, DollarSign, Calendar,
  User, UserPlus, Heart, Home, Bell, MessageSquare, Eye, EyeOff,
  Lock, Unlock, Download, Receipt, FileText, Activity, Target
} from 'lucide-react';

const ParentGuardianManager = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddParent, setShowAddParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'parent',
    permissions: {
      viewRentDetails: true,
      makePayments: true,
      receiveNotifications: true,
      viewLeaseInfo: false,
      emergencyContact: true
    },
    paymentMethod: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  // Mock data for parent/guardian management
  const [parentData] = useState({
    student: {
      name: 'Alex Johnson',
      email: 'alex@usc.edu',
      university: 'USC',
      currentLease: {
        property: '123 University Ave, Unit 3A',
        monthlyRent: 2400,
        dueDate: '1st of each month',
        leaseEnd: '2024-08-31'
      }
    },
    parents: [
      {
        id: 'parent-001',
        name: 'Robert Johnson',
        email: 'robert.johnson@email.com',
        phone: '(555) 123-4567',
        relationship: 'father',
        status: 'active',
        addedDate: '2024-01-15',
        verified: true,
        permissions: {
          viewRentDetails: true,
          makePayments: true,
          receiveNotifications: true,
          viewLeaseInfo: true,
          emergencyContact: true
        },
        paymentMethods: [
          {
            id: 'card-001',
            type: 'credit',
            last4: '4567',
            brand: 'Visa',
            isDefault: true,
            expiryDate: '12/26'
          }
        ],
        paymentHistory: [
          { date: '2024-03-01', amount: 2400, status: 'completed', method: 'Visa •••• 4567' },
          { date: '2024-02-01', amount: 2400, status: 'completed', method: 'Visa •••• 4567' },
          { date: '2024-01-01', amount: 2400, status: 'completed', method: 'Visa •••• 4567' }
        ],
        totalPaid: 28800,
        avgPaymentTime: 1.2,
        onTimePayments: 12,
        latePayments: 0
      },
      {
        id: 'parent-002',
        name: 'Linda Johnson',
        email: 'linda.johnson@email.com',
        phone: '(555) 123-4568',
        relationship: 'mother',
        status: 'active',
        addedDate: '2024-01-15',
        verified: true,
        permissions: {
          viewRentDetails: true,
          makePayments: false,
          receiveNotifications: true,
          viewLeaseInfo: false,
          emergencyContact: true
        },
        paymentMethods: [],
        paymentHistory: [],
        totalPaid: 0,
        avgPaymentTime: 0,
        onTimePayments: 0,
        latePayments: 0
      }
    ],
    familySettings: {
      primaryPayer: 'parent-001',
      backupPayer: null,
      autoPayEnabled: true,
      familyNotifications: true,
      emergencyContacts: ['parent-001', 'parent-002'],
      sharedAccess: true,
      studentOverride: true
    },
    notifications: [
      {
        id: 'notif-001',
        type: 'payment_success',
        message: 'March rent payment completed successfully',
        date: '2024-03-01',
        recipients: ['alex@usc.edu', 'robert.johnson@email.com', 'linda.johnson@email.com']
      },
      {
        id: 'notif-002',
        type: 'rent_reminder',
        message: 'April rent due in 5 days',
        date: '2024-03-26',
        recipients: ['alex@usc.edu', 'robert.johnson@email.com']
      }
    ],
    summary: {
      totalParents: 2,
      activePaymentMethods: 1,
      totalPaid: 28800,
      avgPaymentTime: 1.2,
      onTimeRate: 100,
      lastPayment: '2024-03-01'
    }
  });

  const handleAddParent = () => {
    // In a real app, this would create the parent account and send invitation
    console.log('Adding parent:', parentForm);
    
    // Reset form
    setParentForm({
      name: '',
      email: '',
      phone: '',
      relationship: 'parent',
      permissions: {
        viewRentDetails: true,
        makePayments: true,
        receiveNotifications: true,
        viewLeaseInfo: false,
        emergencyContact: true
      },
      paymentMethod: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zip: ''
      }
    });
    
    setShowAddParent(false);
    alert('Parent invitation sent! They will receive an email to set up their account.');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'father': return <User size={20} className="text-brand-500" />;
      case 'mother': return <User size={20} className="text-pink-600" />;
      case 'guardian': return <Shield size={20} className="text-purple-600" />;
      default: return <Users size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Parent & Guardian Management</h2>
        <div className="flex items-center text-gray-600">
          <Heart size={16} className="mr-2" />
          <span>Family financial support for college housing</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {['overview', 'parents', 'payments', 'settings', 'notifications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-white text-brand-500 shadow-sm' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Family Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Family Account Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Student</div>
                <div className="font-semibold">{parentData.student.name}</div>
                <div className="text-xs text-gray-500">{parentData.student.university}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Rent</div>
                <div className="font-semibold text-green-600">${parentData.student.currentLease.monthlyRent}/month</div>
                <div className="text-xs text-gray-500">Due {parentData.student.currentLease.dueDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Parents/Guardians</div>
                <div className="font-semibold">{parentData.summary.totalParents} active</div>
                <div className="text-xs text-gray-500">{parentData.summary.activePaymentMethods} payment method</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payment History</div>
                <div className="font-semibold text-brand-500">{parentData.summary.onTimeRate}% on-time</div>
                <div className="text-xs text-gray-500">${parentData.summary.totalPaid.toLocaleString()} total paid</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setShowAddParent(true)}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <UserPlus size={20} className="text-brand-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Add Parent/Guardian</p>
                    <p className="text-sm text-gray-600">Invite family member to help with rent</p>
                  </div>
                </div>
                <Plus size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <CreditCard size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View Payment History</p>
                    <p className="text-sm text-gray-600">All family payments and receipts</p>
                  </div>
                </div>
                <Eye size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Settings size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Family Settings</p>
                    <p className="text-sm text-gray-600">Configure permissions and notifications</p>
                  </div>
                </div>
                <Settings size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Current Parents */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Family Members</h3>
            <div className="space-y-4">
              {parentData.parents.map((parent) => (
                <div key={parent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getRelationshipIcon(parent.relationship)}
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h4 className="font-medium mr-2">{parent.name}</h4>
                        {parent.verified && (
                          <CheckCircle size={16} className="text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{parent.relationship}</p>
                      <p className="text-xs text-gray-500">{parent.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(parent.status)}`}>
                      {parent.status}
                    </span>
                    {parent.permissions.makePayments && (
                      <div className="text-xs text-green-600 mt-1">Can make payments</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Recent Family Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">March rent payment completed</p>
                  <p className="text-xs text-gray-500">Paid by Robert Johnson • 2 hours ago</p>
                </div>
                <span className="text-sm font-semibold text-green-600">$2,400</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
                  <Bell size={16} className="text-brand-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rent reminder sent to family</p>
                  <p className="text-xs text-gray-500">April rent due in 5 days • 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <UserPlus size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Linda Johnson joined family account</p>
                  <p className="text-xs text-gray-500">Added as emergency contact • 2 months ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parents Tab */}
      {activeTab === 'parents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Family Members</h3>
            <button
              onClick={() => setShowAddParent(true)}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Parent/Guardian
            </button>
          </div>

          {parentData.parents.map((parent) => (
            <div key={parent.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getRelationshipIcon(parent.relationship)}
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h4 className="font-semibold mr-2">{parent.name}</h4>
                      {parent.verified && (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(parent.status)}`}>
                        {parent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{parent.relationship}</p>
                    <div className="flex items-center mt-1">
                      <Mail size={14} className="text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 mr-3">{parent.email}</span>
                      <Phone size={14} className="text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{parent.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="font-semibold text-green-600">${parent.totalPaid.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Methods</div>
                  <div className="font-semibold">{parent.paymentMethods.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">On-Time Payments</div>
                  <div className="font-semibold text-brand-500">{parent.onTimePayments}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Added</div>
                  <div className="font-semibold">{new Date(parent.addedDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Permissions</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    {parent.permissions.makePayments ? (
                      <CheckCircle size={14} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mr-1" />
                    )}
                    Make payments
                  </div>
                  <div className="flex items-center">
                    {parent.permissions.viewRentDetails ? (
                      <CheckCircle size={14} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mr-1" />
                    )}
                    View rent details
                  </div>
                  <div className="flex items-center">
                    {parent.permissions.receiveNotifications ? (
                      <CheckCircle size={14} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mr-1" />
                    )}
                    Notifications
                  </div>
                  <div className="flex items-center">
                    {parent.permissions.emergencyContact ? (
                      <CheckCircle size={14} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={14} className="text-red-500 mr-1" />
                    )}
                    Emergency contact
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                  Edit Permissions
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <MessageSquare size={16} />
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Family Payment History</h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center">
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Payment Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">${parentData.summary.totalPaid.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-brand-500">{parentData.summary.onTimeRate}%</div>
                <div className="text-sm text-gray-600">On-Time Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{parentData.summary.avgPaymentTime}</div>
                <div className="text-sm text-gray-600">Avg Days Early</div>
              </div>
            </div>
          </div>

          {/* Payment History by Parent */}
          {parentData.parents.map((parent) => (
            parent.paymentHistory.length > 0 && (
              <div key={parent.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {getRelationshipIcon(parent.relationship)}
                  <h4 className="font-semibold ml-2">{parent.name}</h4>
                </div>
                <div className="space-y-3">
                  {parent.paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Rent Payment</p>
                        <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{payment.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${payment.amount.toLocaleString()}</p>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Family Account Settings</h3>

          {/* Primary Payer */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Payment Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Payer</label>
                <select
                  value={parentData.familySettings.primaryPayer}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  readOnly
                >
                  {parentData.parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>{parent.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">AutoPay Enabled</p>
                  <p className="text-sm text-gray-600">Automatically charge rent each month</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={parentData.familySettings.autoPayEnabled} className="sr-only peer" readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Notification Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Family Notifications</p>
                  <p className="text-sm text-gray-600">Send updates to all family members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={parentData.familySettings.familyNotifications} className="sr-only peer" readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Student Override</p>
                  <p className="text-sm text-gray-600">Student can override family payment settings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={parentData.familySettings.studentOverride} className="sr-only peer" readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Privacy & Access</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Shared family dashboard access</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Emergency contact information</span>
                <span className="text-sm text-green-600">Shared</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Academic information visibility</span>
                <span className="text-sm text-red-600">Private</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Family Notifications</h3>
            <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">
              Mark All Read
            </button>
          </div>

          {parentData.notifications.map((notification) => (
            <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    notification.type === 'payment_success' ? 'bg-green-500' :
                    notification.type === 'rent_reminder' ? 'bg-yellow-500' :
                    'bg-brand-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-sm text-gray-600">{new Date(notification.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Sent to: {notification.recipients.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Parent/Guardian</h2>
                <button onClick={() => setShowAddParent(false)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={parentForm.name}
                    onChange={(e) => setParentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter parent's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={parentForm.email}
                    onChange={(e) => setParentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="parent@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={parentForm.phone}
                    onChange={(e) => setParentForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <select
                    value={parentForm.relationship}
                    onChange={(e) => setParentForm(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Legal Guardian</option>
                    <option value="stepparent">Step Parent</option>
                    <option value="grandparent">Grandparent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parentForm.permissions.makePayments}
                        onChange={(e) => setParentForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, makePayments: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Can make rent payments</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parentForm.permissions.viewRentDetails}
                        onChange={(e) => setParentForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, viewRentDetails: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Can view rent details</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parentForm.permissions.receiveNotifications}
                        onChange={(e) => setParentForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, receiveNotifications: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Receive notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={parentForm.permissions.emergencyContact}
                        onChange={(e) => setParentForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, emergencyContact: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Emergency contact</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddParent(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParent}
                  disabled={!parentForm.name || !parentForm.email}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    parentForm.name && parentForm.email
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

      <button
        onClick={onBack}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 mt-6"
      >
        Back
      </button>
    </div>
  );
};

export default ParentGuardianManager;