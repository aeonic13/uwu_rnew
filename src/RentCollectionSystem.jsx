import React, { useState } from 'react'
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  CreditCard,
  Mail,
  Bell,
  Settings,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Zap,
  Shield,
  Target,
  Phone,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Eye,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react'

const RentCollectionSystem = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [dateRange, setDateRange] = useState('current')

  // Mock comprehensive rent collection data
  const [rentData] = useState({
    overview: {
      totalExpectedRent: 52400,
      collectedRent: 47800,
      pendingRent: 2400,
      overdueRent: 2200,
      collectionRate: 91.2,
      avgDaysToCollect: 3.2,
      lateFeeCollected: 350,
      totalTenants: 24,
      onTimePayments: 21,
      latePayments: 2,
      missedPayments: 1,
    },
    tenants: [
      {
        id: 'tenant-001',
        name: 'Alex Johnson',
        unit: 'Unit 3A - University Heights',
        email: 'alex@usc.edu',
        phone: '(555) 234-5678',
        rentAmount: 2400,
        dueDate: '2024-03-01',
        status: 'paid',
        paidDate: '2024-02-28',
        paymentMethod: 'ACH',
        lateFee: 0,
        paymentHistory: 'excellent',
        autoPayEnabled: true,
        lastPayment: 2400,
        totalOwed: 0,
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
      {
        id: 'tenant-002',
        name: 'Maria Rodriguez',
        unit: 'Unit 2B - University Heights',
        email: 'maria@ucla.edu',
        phone: '(555) 345-6789',
        rentAmount: 2200,
        dueDate: '2024-03-01',
        status: 'overdue',
        paidDate: null,
        paymentMethod: 'card',
        lateFee: 110,
        paymentHistory: 'good',
        autoPayEnabled: false,
        lastPayment: 2200,
        totalOwed: 2310,
        daysOverdue: 18,
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      },
      {
        id: 'tenant-003',
        name: 'Emma Wilson',
        unit: 'Unit 1C - University Heights',
        email: 'emma@stanford.edu',
        phone: '(555) 456-7890',
        rentAmount: 2300,
        dueDate: '2024-03-01',
        status: 'pending',
        paidDate: null,
        paymentMethod: 'ACH',
        lateFee: 0,
        paymentHistory: 'excellent',
        autoPayEnabled: true,
        lastPayment: 2300,
        totalOwed: 2300,
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      },
    ],
    automation: {
      reminderSettings: {
        firstReminder: { enabled: true, daysBefore: 5, method: 'email' },
        secondReminder: { enabled: true, daysBefore: 1, method: 'both' },
        overdueReminder: { enabled: true, daysAfter: 3, method: 'both' },
        finalNotice: { enabled: true, daysAfter: 10, method: 'certified_mail' },
      },
      lateFeeSettings: {
        enabled: true,
        gracePeriod: 5,
        feeType: 'percentage',
        feeAmount: 5,
        maxFee: 200,
        dailyAccrual: false,
      },
      autoPayments: {
        enabled: true,
        enrollmentRate: 67,
        successRate: 98.2,
        totalEnrolled: 16,
      },
    },
    communications: [
      {
        id: 'comm-001',
        tenant: 'Maria Rodriguez',
        type: 'overdue_notice',
        method: 'email',
        sentDate: '2024-03-15',
        status: 'delivered',
        subject: 'Rent Payment Overdue - Immediate Action Required',
      },
      {
        id: 'comm-002',
        tenant: 'Emma Wilson',
        type: 'reminder',
        method: 'sms',
        sentDate: '2024-02-24',
        status: 'delivered',
        subject: 'Rent Due Reminder - 5 days',
      },
      {
        id: 'comm-003',
        tenant: 'Alex Johnson',
        type: 'payment_confirmation',
        method: 'email',
        sentDate: '2024-02-28',
        status: 'delivered',
        subject: 'Rent Payment Received - Thank You',
      },
    ],
    reports: {
      monthlyTrends: [
        { month: 'Oct 2023', expected: 50400, collected: 48200, rate: 95.6 },
        { month: 'Nov 2023', expected: 51200, collected: 50800, rate: 99.2 },
        { month: 'Dec 2023', expected: 50800, collected: 47600, rate: 93.7 },
        { month: 'Jan 2024', expected: 52000, collected: 51200, rate: 98.5 },
        { month: 'Feb 2024', expected: 52400, collected: 50100, rate: 95.6 },
        { month: 'Mar 2024', expected: 52400, collected: 47800, rate: 91.2 },
      ],
      paymentMethods: [
        { method: 'ACH', count: 16, percentage: 67, avgTime: 2.1 },
        { method: 'Credit Card', count: 6, percentage: 25, avgTime: 1.2 },
        { method: 'Check', count: 2, percentage: 8, avgTime: 7.5 },
      ],
    },
  })

  const getStatusColor = status => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} className="text-green-600" />
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />
      case 'overdue':
        return <XCircle size={16} className="text-red-600" />
      case 'partial':
        return <AlertTriangle size={16} className="text-orange-600" />
      default:
        return <Clock size={16} className="text-gray-600" />
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Rent Collection & Automation
        </h2>
        <div className="flex items-center text-gray-600">
          <Target size={16} className="mr-2" />
          <span>Automated rent collection with 91.2% on-time payment rate</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          'dashboard',
          'tenants',
          'automation',
          'communications',
          'reports',
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-green-600">
                  ${rentData.overview.collectedRent.toLocaleString()}
                </div>
                <ArrowUpRight size={20} className="text-green-600" />
              </div>
              <div className="text-sm text-green-700">Rent Collected</div>
              <div className="text-xs text-green-600 mt-1">
                {rentData.overview.collectionRate}% collection rate
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-red-600">
                  ${rentData.overview.overdueRent.toLocaleString()}
                </div>
                <ArrowDownRight size={20} className="text-red-600" />
              </div>
              <div className="text-sm text-red-700">Overdue Amount</div>
              <div className="text-xs text-red-600 mt-1">
                {rentData.overview.missedPayments} tenant overdue
              </div>
            </div>

            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-brand-500">
                  {rentData.overview.avgDaysToCollect}
                </div>
                <Clock size={20} className="text-brand-500" />
              </div>
              <div className="text-sm text-brand-600">Avg Collection Days</div>
              <div className="text-xs text-brand-500 mt-1">
                Industry avg: 7.2 days
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-purple-600">
                  ${rentData.overview.lateFeeCollected}
                </div>
                <DollarSign size={20} className="text-purple-600" />
              </div>
              <div className="text-sm text-purple-700">Late Fees</div>
              <div className="text-xs text-purple-600 mt-1">This month</div>
            </div>
          </div>

          {/* Payment Status Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">March 2024 Payment Status</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {rentData.overview.onTimePayments}
                </div>
                <div className="text-sm text-gray-600">On Time</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {rentData.overview.latePayments}
                </div>
                <div className="text-sm text-gray-600">Late</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  {rentData.overview.missedPayments}
                </div>
                <div className="text-sm text-gray-600">Missed</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-l-full"
                style={{
                  width: `${(rentData.overview.onTimePayments / rentData.overview.totalTenants) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Mail size={20} className="text-brand-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Send Rent Reminders</p>
                    <p className="text-sm text-gray-600">
                      3 tenants need reminders
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-red-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Process Overdue Accounts</p>
                    <p className="text-sm text-gray-600">
                      1 tenant overdue by 18 days
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Zap size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Setup AutoPay</p>
                    <p className="text-sm text-gray-600">
                      8 tenants not enrolled
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Payments</h3>
              <button
                onClick={() => setActiveTab('tenants')}
                className="text-brand-500 hover:text-brand-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {rentData.tenants
                .filter(t => t.status === 'paid')
                .slice(0, 3)
                .map(tenant => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <img
                        src={tenant.avatar}
                        alt={tenant.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-600">{tenant.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${tenant.rentAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tenant.paymentMethod} • {tenant.paidDate}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Tenant Payment Status</h3>
            <div className="flex space-x-2">
              <select
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Properties</option>
                <option value="university-heights">University Heights</option>
                <option value="student-village">Student Village</option>
              </select>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Filter size={16} />
              </button>
            </div>
          </div>

          {rentData.tenants.map(tenant => (
            <div
              key={tenant.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <img
                    src={tenant.avatar}
                    alt={tenant.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-semibold mr-2">{tenant.name}</h4>
                      {tenant.autoPayEnabled && (
                        <span className="px-2 py-1 bg-brand-100 text-blue-800 text-xs rounded flex items-center">
                          <Repeat size={12} className="mr-1" />
                          AutoPay
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tenant.unit}</p>
                    <p className="text-xs text-gray-500">{tenant.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    {getStatusIcon(tenant.status)}
                    <span
                      className={`ml-2 px-3 py-1 text-sm rounded-full ${getStatusColor(tenant.status)}`}
                    >
                      {tenant.status.charAt(0).toUpperCase() +
                        tenant.status.slice(1)}
                    </span>
                  </div>
                  {tenant.status === 'overdue' && (
                    <p className="text-xs text-red-600">
                      {tenant.daysOverdue} days overdue
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Monthly Rent</div>
                  <div className="font-semibold">
                    ${tenant.rentAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Owed</div>
                  <div
                    className={`font-semibold ${tenant.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    ${tenant.totalOwed.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Method</div>
                  <div className="font-medium">
                    {tenant.paymentMethod.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Due Date</div>
                  <div className="font-medium">
                    {new Date(tenant.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {tenant.lateFee > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    Late Fee Applied: ${tenant.lateFee}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {tenant.status === 'overdue' && (
                  <>
                    <button className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">
                      Send Notice
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Call Tenant
                    </button>
                  </>
                )}
                {tenant.status === 'pending' && (
                  <>
                    <button className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700">
                      Send Reminder
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Contact
                    </button>
                  </>
                )}
                {tenant.status === 'paid' && (
                  <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">
                    View Receipt
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Automation Settings</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600">
              Save Changes
            </button>
          </div>

          {/* AutoPay Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center">
                <Repeat size={20} className="mr-2 text-brand-500" />
                AutoPay Settings
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rentData.automation.autoPayments.enabled}
                  className="sr-only peer"
                  readOnly
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Enrollment Rate</div>
                <div className="text-xl font-bold text-brand-500">
                  {rentData.automation.autoPayments.enrollmentRate}%
                </div>
                <div className="text-xs text-gray-500">
                  {rentData.automation.autoPayments.totalEnrolled} of{' '}
                  {rentData.overview.totalTenants} tenants
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-xl font-bold text-green-600">
                  {rentData.automation.autoPayments.successRate}%
                </div>
                <div className="text-xs text-gray-500">Last 30 days</div>
              </div>
            </div>
            <div className="bg-brand-50 p-3 rounded-lg">
              <p className="text-sm text-brand-600">
                <strong>Benefits:</strong> AutoPay reduces late payments by 87%
                and increases on-time collection rates to 98.2%
              </p>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-yellow-600" />
              Payment Reminders
            </h4>
            <div className="space-y-4">
              {Object.entries(rentData.automation.reminderSettings).map(
                ([key, setting]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          checked={setting.enabled}
                          className="sr-only peer"
                          readOnly
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                      </label>
                      <div>
                        <p className="font-medium">
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-600">
                          {setting.daysBefore
                            ? `${setting.daysBefore} days before`
                            : `${setting.daysAfter} days after`}{' '}
                          due date
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {setting.method === 'both'
                        ? 'Email + SMS'
                        : setting.method.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Late Fee Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center">
                <DollarSign size={20} className="mr-2 text-red-600" />
                Late Fee Configuration
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rentData.automation.lateFeeSettings.enabled}
                  className="sr-only peer"
                  readOnly
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Grace Period
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={rentData.automation.lateFeeSettings.gracePeriod}
                    className="w-20 p-2 border border-gray-300 rounded-lg text-sm"
                    readOnly
                  />
                  <span className="ml-2 text-sm text-gray-600">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Late Fee
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={rentData.automation.lateFeeSettings.feeAmount}
                    className="w-20 p-2 border border-gray-300 rounded-lg text-sm"
                    readOnly
                  />
                  <span className="ml-2 text-sm text-gray-600">% of rent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Communication History</h3>
            <div className="flex space-x-2">
              <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
                <Plus size={16} className="mr-2" />
                Send Message
              </button>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Filter size={16} />
              </button>
            </div>
          </div>

          {rentData.communications.map(comm => (
            <div
              key={comm.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      comm.type === 'overdue_notice'
                        ? 'bg-red-500'
                        : comm.type === 'reminder'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  ></div>
                  <div>
                    <h4 className="font-semibold">{comm.tenant}</h4>
                    <p className="text-sm text-gray-600">{comm.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500">
                    {comm.method === 'email' && (
                      <Mail size={16} className="mr-1" />
                    )}
                    {comm.method === 'sms' && (
                      <MessageSquare size={16} className="mr-1" />
                    )}
                    {comm.method === 'both' && (
                      <>
                        <Mail size={16} className="mr-1" />
                        <MessageSquare size={16} className="mr-1" />
                      </>
                    )}
                    {comm.method}
                  </div>
                  <p className="text-xs text-gray-400">{comm.sentDate}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    comm.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {comm.status}
                </span>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Collection Reports</h3>
            <div className="flex space-x-2">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="current">Current Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Collection Trend */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-brand-500" />
              6-Month Collection Trend
            </h4>
            <div className="space-y-3">
              {rentData.reports.monthlyTrends.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-600">
                        ${month.collected.toLocaleString()}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-500">
                        ${month.expected.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`font-semibold ${
                        month.rate >= 95
                          ? 'text-green-600'
                          : month.rate >= 90
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {month.rate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <CreditCard size={20} className="mr-2 text-green-600" />
              Payment Methods Analysis
            </h4>
            <div className="space-y-3">
              {rentData.reports.paymentMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 bg-brand-500 rounded mr-3"
                      style={{ opacity: method.percentage / 100 + 0.3 }}
                    ></div>
                    <span className="font-medium">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {method.count} tenants ({method.percentage}%)
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {method.avgTime} days to clear
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <BarChart3 size={20} className="mr-2 text-purple-600" />
              Key Performance Indicators
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>On-Time Payment Rate</span>
                <span className="font-semibold text-green-600">
                  {rentData.overview.collectionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Average Collection Time</span>
                <span className="font-semibold text-brand-500">
                  {rentData.overview.avgDaysToCollect} days
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>AutoPay Adoption</span>
                <span className="font-semibold text-purple-600">
                  {rentData.automation.autoPayments.enrollmentRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Late Fee Collection</span>
                <span className="font-semibold text-orange-600">
                  ${rentData.overview.lateFeeCollected}
                </span>
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

export default RentCollectionSystem
