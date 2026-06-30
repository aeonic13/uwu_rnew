import React, { useState, useEffect } from 'react'
import {
  Building2,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Settings,
  AlertTriangle,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  Search,
  Filter,
  Home,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Car,
  PieChart,
  BarChart3,
  CreditCard,
  Receipt,
  BellRing,
  MessageSquare,
  Camera,
  ArrowRight,
  Target,
  Award,
  ThumbsUp,
  AlertCircle,
  Activity,
} from 'lucide-react'
import { dashboardService } from './services/dashboardService'

// Visual-only defaults for fields the rent-roll API does not provide.
const PLACEHOLDER_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
const PLACEHOLDER_AVATAR =
  'https://ui-avatars.com/api/?background=fc6a03&color=fff&name='

// Map the /dashboard/landlord/rent-roll response onto the shape this
// dashboard renders, filling visual-only fields with safe defaults.
function buildLiveData(api, base) {
  const totals = api.totals || {}
  const rentRoll = Array.isArray(api.rentRoll) ? api.rentRoll : []

  const properties = rentRoll.map(r => {
    const units = Number(String(r.occupancy || '').split('/')[1]) || 0
    const occupied = r.tenants?.length || 0
    return {
      id: r.listing.id,
      name: r.listing.title,
      address: r.listing.address || '—',
      type: 'Property',
      units: units || occupied,
      occupiedUnits: occupied,
      occupancyRate: units > 0 ? Math.round((occupied / units) * 100) : 0,
      monthlyRevenue: r.financials?.monthlyCollected || 0,
      avgRent: occupied
        ? Math.round((r.financials?.monthlyExpected || 0) / occupied)
        : r.financials?.monthlyExpected || 0,
      image: PLACEHOLDER_PROPERTY_IMAGE,
      status: 'active',
      amenities: [],
      yearBuilt: '—',
      squareFeet: '—',
      manager: '—',
    }
  })

  const tenants = rentRoll.flatMap(r =>
    (r.tenants || []).map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      avatar: PLACEHOLDER_AVATAR + encodeURIComponent(t.name || 'Tenant'),
      unit: r.listing.title,
      university: '—',
      rentAmount: t.monthlyRent || 0,
      leaseStart: t.leaseStart,
      leaseEnd: t.leaseEnd,
      securityDeposit: 0,
      creditScore: '—',
      lastPayment: t.leaseStart || new Date().toISOString(),
      paymentHistory: '—',
      status:
        t.paidThisMonth >= t.monthlyRent && t.monthlyRent > 0
          ? 'current'
          : t.pendingThisMonth > 0
            ? 'pending'
            : 'overdue',
    }))
  )

  return {
    ...base,
    overview: {
      ...base.overview,
      totalProperties: totals.properties ?? properties.length,
      totalUnits: totals.totalUnits ?? 0,
      occupiedUnits: totals.occupiedUnits ?? tenants.length,
      occupancyRate: Number(totals.occupancyRate ?? 0),
      monthlyRevenue: totals.monthlyCollected ?? 0,
      totalRevenue: totals.monthlyCollected ?? 0,
      overdueRent: totals.pendingCollection ?? 0,
      // Not provided by the rent-roll endpoint yet — keep neutral.
      maintenanceRequests: 0,
      pendingApplications: 0,
      securityDepositsHeld: 0,
    },
    properties,
    tenants,
  }
}

const OwnerDashboard = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedProperty, setSelectedProperty] = useState(null)

  // Falls back to demo data until the live rent-roll API responds.
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalProperties: 8,
      totalUnits: 24,
      occupiedUnits: 21,
      totalRevenue: 47800,
      monthlyRevenue: 47800,
      occupancyRate: 87.5,
      avgRentPrice: 2275,
      maintenanceRequests: 3,
      pendingApplications: 7,
      overdueRent: 3200,
      securityDepositsHeld: 96000,
    },
    properties: [
      {
        id: 'prop-1',
        name: 'University Heights Complex',
        address: '123 University Ave, Los Angeles, CA',
        type: 'Apartment Complex',
        units: 8,
        occupiedUnits: 7,
        monthlyRevenue: 18400,
        occupancyRate: 87.5,
        avgRent: 2300,
        image:
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        status: 'active',
        yearBuilt: 2018,
        squareFeet: 12000,
        parking: true,
        laundry: true,
        petFriendly: true,
        furnished: true,
        utilities: ['Water', 'Trash', 'Internet'],
        amenities: ['Pool', 'Gym', 'Study Room', 'Parking'],
        manager: 'Sarah Chen',
        lastInspection: '2024-02-15',
        insurance: { provider: 'StateForm', expires: '2024-12-31' },
      },
      {
        id: 'prop-2',
        name: 'Student Village Townhomes',
        address: '456 College Blvd, Los Angeles, CA',
        type: 'Townhouse',
        units: 6,
        occupiedUnits: 5,
        monthlyRevenue: 13500,
        occupancyRate: 83.3,
        avgRent: 2250,
        image:
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        status: 'active',
        yearBuilt: 2020,
        squareFeet: 8400,
        parking: true,
        laundry: true,
        petFriendly: false,
        furnished: true,
        utilities: ['Water', 'Trash'],
        amenities: ['Private Garage', 'Backyard', 'Study Nook'],
        manager: 'Mike Rodriguez',
        lastInspection: '2024-03-01',
        insurance: { provider: 'AllState', expires: '2024-11-15' },
      },
    ],
    tenants: [
      {
        id: 'tenant-1',
        name: 'Alex Johnson',
        email: 'alex@usc.edu',
        phone: '(555) 234-5678',
        unit: 'Unit 3A - University Heights',
        rentAmount: 2400,
        leaseStart: '2024-01-01',
        leaseEnd: '2024-08-31',
        securityDeposit: 2400,
        status: 'current',
        paymentHistory: 'excellent',
        university: 'USC',
        creditScore: 742,
        lastPayment: '2024-03-01',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        emergencyContact: 'Jane Johnson - (555) 123-4567',
      },
      {
        id: 'tenant-2',
        name: 'Maria Rodriguez',
        email: 'maria@ucla.edu',
        phone: '(555) 345-6789',
        unit: 'Unit 2B - University Heights',
        rentAmount: 2200,
        leaseStart: '2024-02-01',
        leaseEnd: '2024-07-31',
        securityDeposit: 2200,
        status: 'overdue',
        paymentHistory: 'good',
        university: 'UCLA',
        creditScore: 678,
        lastPayment: '2024-02-01',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
        emergencyContact: 'Carlos Rodriguez - (555) 987-6543',
      },
    ],
    maintenanceRequests: [
      {
        id: 'maint-1',
        tenant: 'Alex Johnson',
        unit: 'Unit 3A',
        issue: 'Kitchen faucet leaking',
        category: 'Plumbing',
        priority: 'medium',
        status: 'in-progress',
        reportedDate: '2024-03-15',
        assignedTo: "Mike's Plumbing",
        estimatedCost: 150,
        description:
          'Water is slowly dripping from the kitchen faucet. Tenant reports it started 3 days ago.',
        photos: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
        ],
      },
      {
        id: 'maint-2',
        tenant: 'Maria Rodriguez',
        unit: 'Unit 2B',
        issue: 'AC not cooling properly',
        category: 'HVAC',
        priority: 'high',
        status: 'pending',
        reportedDate: '2024-03-16',
        assignedTo: null,
        estimatedCost: 300,
        description:
          'Air conditioning unit is running but not cooling the apartment effectively.',
        photos: [],
      },
    ],
    applications: [
      {
        id: 'app-1',
        applicant: 'Emma Wilson',
        email: 'emma@stanford.edu',
        phone: '(555) 456-7890',
        unit: 'Unit 1C - University Heights',
        desiredMoveIn: '2024-04-01',
        rentOffered: 2300,
        creditScore: 720,
        university: 'Stanford',
        year: 'Graduate',
        status: 'under-review',
        applicationDate: '2024-03-12',
        documents: ['ID', 'Transcript', 'Bank Statement', 'References'],
        employmentStatus: 'Part-time + Financial Aid',
        previousRental: 'Yes - 2 years',
        pets: 'None',
        references: [
          {
            name: 'Dr. Sarah Smith',
            relation: 'Professor',
            phone: '(555) 111-2222',
          },
          {
            name: 'John Davis',
            relation: 'Previous Landlord',
            phone: '(555) 333-4444',
          },
        ],
      },
    ],
    financials: {
      monthlyBreakdown: [
        { month: 'Jan 2024', revenue: 45600, expenses: 8200, netIncome: 37400 },
        { month: 'Feb 2024', revenue: 47200, expenses: 9100, netIncome: 38100 },
        { month: 'Mar 2024', revenue: 47800, expenses: 7800, netIncome: 40000 },
      ],
      expenseCategories: [
        { category: 'Maintenance', amount: 3200, percentage: 41 },
        { category: 'Insurance', amount: 1800, percentage: 23 },
        { category: 'Property Tax', amount: 1400, percentage: 18 },
        { category: 'Utilities', amount: 800, percentage: 10 },
        { category: 'Management', amount: 600, percentage: 8 },
      ],
      upcomingPayments: [
        {
          description: 'Property Insurance',
          amount: 1200,
          dueDate: '2024-04-01',
        },
        { description: 'Property Tax Q1', amount: 3500, dueDate: '2024-04-15' },
        {
          description: 'Landscaping Service',
          amount: 400,
          dueDate: '2024-03-30',
        },
      ],
    },
    analytics: {
      occupancyTrend: [
        { month: 'Oct', rate: 92 },
        { month: 'Nov', rate: 88 },
        { month: 'Dec', rate: 85 },
        { month: 'Jan', rate: 87 },
        { month: 'Feb', rate: 89 },
        { month: 'Mar', rate: 88 },
      ],
      rentTrends: [
        { month: 'Oct', avgRent: 2150 },
        { month: 'Nov', avgRent: 2200 },
        { month: 'Dec', avgRent: 2225 },
        { month: 'Jan', avgRent: 2250 },
        { month: 'Feb', avgRent: 2275 },
        { month: 'Mar', avgRent: 2275 },
      ],
    },
  })

  // 'demo' until the live rent-roll API returns; 'live' once it does.
  const [dataMode, setDataMode] = useState('demo')

  useEffect(() => {
    let active = true
    dashboardService
      .getRentRoll()
      .then(api => {
        if (!active || !api) return
        // Only switch to live mode if the owner actually has properties.
        if (Array.isArray(api.rentRoll) && api.rentRoll.length > 0) {
          setDashboardData(prev => buildLiveData(api, prev))
          setDataMode('live')
        }
      })
      .catch(() => {
        // Not an owner / not authenticated / network error — stay in demo mode.
      })
    return () => {
      active = false
    }
  }, [])

  const getStatusColor = status => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-brand-100 text-blue-800'
      case 'vacant':
        return 'bg-gray-100 text-gray-800'
      case 'in-progress':
        return 'bg-brand-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'under-review':
        return 'bg-purple-100 text-purple-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Property Management Dashboard
        </h2>
        <div className="flex items-center text-gray-600">
          <Building2 size={16} className="mr-2" />
          <span>
            {dashboardData.overview.totalProperties} Properties •{' '}
            {dashboardData.overview.totalUnits} Units
          </span>
          <span
            className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
              dataMode === 'live'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
            title={
              dataMode === 'live'
                ? 'Showing your real portfolio from the live rent-roll API'
                : 'Showing demo data — sign in as an owner with listings to see live data'
            }
          >
            {dataMode === 'live' ? 'Live data' : 'Demo data'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          'overview',
          'properties',
          'tenants',
          'applications',
          'maintenance',
          'financials',
          'analytics',
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-brand-500">
                  {dashboardData.overview.occupancyRate}%
                </div>
                <TrendingUp size={20} className="text-brand-500" />
              </div>
              <div className="text-sm text-brand-600">Occupancy Rate</div>
              <div className="text-xs text-brand-500 mt-1">
                {dashboardData.overview.occupiedUnits}/
                {dashboardData.overview.totalUnits} units occupied
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-green-600">
                  ${dashboardData.overview.monthlyRevenue.toLocaleString()}
                </div>
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div className="text-sm text-green-700">Monthly Revenue</div>
              <div className="text-xs text-green-600 mt-1">
                +5.2% vs last month
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-yellow-600">
                  {dashboardData.overview.maintenanceRequests}
                </div>
                <Wrench size={20} className="text-yellow-600" />
              </div>
              <div className="text-sm text-yellow-700">Active Requests</div>
              <div className="text-xs text-yellow-600 mt-1">
                2 high priority
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.overview.pendingApplications}
                </div>
                <FileText size={20} className="text-purple-600" />
              </div>
              <div className="text-sm text-purple-700">
                Pending Applications
              </div>
              <div className="text-xs text-purple-600 mt-1">3 need review</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setActiveTab('applications')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Review Applications</p>
                    <p className="text-sm text-gray-600">
                      {dashboardData.overview.pendingApplications} pending
                      review
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Wrench size={20} className="text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Maintenance Requests</p>
                    <p className="text-sm text-gray-600">
                      {dashboardData.overview.maintenanceRequests} active
                      requests
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('security-deposit')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Shield size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Security Deposits</p>
                    <p className="text-sm text-gray-600">
                      $
                      {dashboardData.overview.securityDepositsHeld.toLocaleString()}{' '}
                      held in escrow
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('banking-bookkeeping')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <CreditCard size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Banking & Bookkeeping</p>
                    <p className="text-sm text-gray-600">
                      Automated financial management
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('rent-collection')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Target size={20} className="text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Rent Collection</p>
                    <p className="text-sm text-gray-600">
                      Automated rent collection with 91% success rate
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('tax-center')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Receipt size={20} className="text-indigo-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Tax Center</p>
                    <p className="text-sm text-gray-600">
                      Schedule E & 1099 forms ready
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('owner-approval')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-emerald-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Lease Approvals</p>
                    <p className="text-sm text-gray-600">
                      2 requests pending your approval
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('financials')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <BarChart3 size={20} className="text-brand-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Financial Reports</p>
                    <p className="text-sm text-gray-600">
                      View income and expense reports
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
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
                    Rent payment received - Alex Johnson
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago • $2,400</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <FileText size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    New application received - Emma Wilson
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago • Unit 1C</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <Wrench size={16} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Maintenance request - Kitchen faucet leak
                  </p>
                  <p className="text-xs text-gray-500">
                    1 day ago • Unit 3A assigned to Mike's Plumbing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Attention Required
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                • 1 tenant is overdue on rent payment ($2,200)
              </p>
              <p className="text-sm text-red-700">
                • 1 high-priority maintenance request needs immediate attention
              </p>
              <p className="text-sm text-red-700">
                • Property insurance expires in 90 days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Property Portfolio</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
              <Plus size={16} className="mr-2" />
              Add Property
            </button>
          </div>

          {dashboardData.properties.map(property => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-lg mr-2">
                        {property.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(property.status)}`}
                      >
                        {property.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin size={16} className="mr-1" />
                      <span className="text-sm">{property.address}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.type} • Built {property.yearBuilt} •{' '}
                      {property.squareFeet.toLocaleString()} sq ft
                    </div>
                  </div>
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium">Occupancy</div>
                    <div className="text-lg font-bold text-brand-500">
                      {property.occupiedUnits}/{property.units} units
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.occupancyRate}% occupied
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Monthly Revenue</div>
                    <div className="text-lg font-bold text-green-600">
                      ${property.monthlyRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: ${property.avgRent}/unit
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Manager: {property.manager}
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-brand-500">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-brand-500">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-brand-500">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Tenant Management</h3>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg">
                <Search size={16} />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg">
                <Filter size={16} />
              </button>
            </div>
          </div>

          {dashboardData.tenants.map(tenant => (
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
                      <Shield size={16} className="text-brand-500" />
                    </div>
                    <div className="text-sm text-gray-600">
                      {tenant.university} • {tenant.unit}
                    </div>
                    <div className="flex items-center mt-1">
                      <Mail size={14} className="text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {tenant.email}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getStatusColor(tenant.status)}`}
                >
                  {tenant.status === 'current' ? 'Current' : 'Overdue'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Monthly Rent</div>
                  <div className="font-semibold">${tenant.rentAmount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Security Deposit</div>
                  <div className="font-semibold">${tenant.securityDeposit}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Credit Score</div>
                  <div className="font-semibold text-green-600">
                    {tenant.creditScore}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Payment</div>
                  <div className="font-semibold">
                    {new Date(tenant.lastPayment).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600">Lease Period</div>
                <div className="text-sm font-medium">
                  {new Date(tenant.leaseStart).toLocaleDateString()} -{' '}
                  {new Date(tenant.leaseEnd).toLocaleDateString()}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Payment History: {tenant.paymentHistory}
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <FileText size={16} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-brand-500">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Rental Applications</h3>
            <div className="text-sm text-gray-600">
              {dashboardData.applications.length} pending review
            </div>
          </div>

          {dashboardData.applications.map(app => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{app.applicant}</h4>
                  <div className="text-sm text-gray-600">
                    {app.university} Student • {app.year}
                  </div>
                  <div className="flex items-center mt-1">
                    <Mail size={14} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">{app.email}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getStatusColor(app.status)}`}
                >
                  Under Review
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Desired Unit</div>
                  <div className="font-semibold">{app.unit}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Move-in Date</div>
                  <div className="font-semibold">
                    {new Date(app.desiredMoveIn).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Offered Rent</div>
                  <div className="font-semibold text-green-600">
                    ${app.rentOffered}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Credit Score</div>
                  <div className="font-semibold text-green-600">
                    {app.creditScore}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Documents Submitted
                </div>
                <div className="flex flex-wrap gap-2">
                  {app.documents.map((doc, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center"
                    >
                      <CheckCircle size={12} className="mr-1" />
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">References</div>
                {app.references.map((ref, index) => (
                  <div key={index} className="text-sm mb-1">
                    <span className="font-medium">{ref.name}</span> -{' '}
                    {ref.relation} • {ref.phone}
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">
                  Approve
                </button>
                <button className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">
                  Reject
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Maintenance Requests</h3>
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center">
              <Plus size={16} className="mr-2" />
              Create Request
            </button>
          </div>

          {dashboardData.maintenanceRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold mr-2">{request.issue}</h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}
                    >
                      {request.priority} priority
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {request.tenant} • {request.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Reported:{' '}
                    {new Date(request.reportedDate).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getStatusColor(request.status)}`}
                >
                  {request.status === 'in-progress' ? 'In Progress' : 'Pending'}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Description</div>
                <p className="text-sm">{request.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-medium">{request.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                  <div className="font-medium">${request.estimatedCost}</div>
                </div>
              </div>

              {request.assignedTo && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Assigned To</div>
                  <div className="font-medium">{request.assignedTo}</div>
                </div>
              )}

              {request.photos.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Photos</div>
                  <div className="flex space-x-2">
                    {request.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Issue ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                  {request.assignedTo ? 'Update' : 'Assign'}
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Contact Tenant
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Mark Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Financial Overview</h3>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                <Download size={16} className="mr-2" />
                Export
              </button>
              <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center">
                <Receipt size={16} className="mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Monthly Performance</h4>
            <div className="space-y-3">
              {dashboardData.financials.monthlyBreakdown.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-gray-600">
                      Revenue: ${month.revenue.toLocaleString()} • Expenses: $
                      {month.expenses.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${month.netIncome.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Net Income</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Expense Categories</h4>
            <div className="space-y-3">
              {dashboardData.financials.expenseCategories.map(
                (expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 bg-brand-500 rounded mr-3"
                        style={{ opacity: expense.percentage / 100 + 0.3 }}
                      ></div>
                      <span className="font-medium">{expense.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${expense.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {expense.percentage}%
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Upcoming Payments</h4>
            <div className="space-y-3">
              {dashboardData.financials.upcomingPayments.map(
                (payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{payment.description}</div>
                      <div className="text-sm text-gray-600">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${payment.amount.toLocaleString()}
                      </div>
                      <button className="text-sm text-brand-500 hover:text-brand-600">
                        Pay Now
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Performance Analytics</h3>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2 text-brand-500" />
                Occupancy Trend (6 months)
              </h4>
              <div className="space-y-2">
                {dashboardData.analytics.occupancyTrend.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{data.month}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full"
                          style={{ width: `${data.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{data.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center">
                <DollarSign size={20} className="mr-2 text-green-600" />
                Average Rent Trend
              </h4>
              <div className="space-y-2">
                {dashboardData.analytics.rentTrends.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{data.month}</span>
                    <span className="font-medium">${data.avgRent}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center">
                <Award size={20} className="mr-2 text-purple-600" />
                Performance Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Average Tenant Retention</span>
                  <span className="font-semibold text-green-600">
                    8.2 months
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Average Days to Fill Vacancy</span>
                  <span className="font-semibold text-brand-500">12 days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Maintenance Response Time</span>
                  <span className="font-semibold text-orange-600">
                    2.1 days
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Tenant Satisfaction Score</span>
                  <span className="font-semibold text-purple-600">4.6/5.0</span>
                </div>
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

export default OwnerDashboard
