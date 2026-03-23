import React, { useState } from 'react';
import { 
  Shield, DollarSign, Clock, CheckCircle, AlertTriangle, XCircle,
  Lock, Eye, FileText, Calendar, CreditCard, Building2, Wallet,
  Camera, Upload, Download, Star, Award, TrendingUp, PieChart,
  Users, Building, Home, Mail, Phone, MessageSquare, Bell,
  ArrowRight, ArrowLeft, Plus, Minus, Filter, Search, Settings,
  Info, Zap, Target, Briefcase, RefreshCw, CheckSquare, User,
  MapPin, BookOpen, HelpCircle, ExternalLink, Copy, Share
} from 'lucide-react';

const SecurityDepositProtection = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showNewEscrow, setShowNewEscrow] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [newEscrowForm, setNewEscrowForm] = useState({
    propertyAddress: '',
    depositAmount: '',
    landlordEmail: '',
    leaseStartDate: '',
    leaseEndDate: '',
    moveInInspection: null,
    additionalTerms: ''
  });

  // Mock data for security deposit protection system
  const [depositData] = useState({
    user: {
      name: user?.name || 'Alex Johnson',
      email: user?.email || 'alex@usc.edu',
      userType: user?.userType || 'student',
      totalProtected: 4800,
      activeDeposits: 2,
      returnedDeposits: 1,
      protectionRating: 4.9
    },
    deposits: [
      {
        id: 'dep-001',
        escrowId: 'ESC-2024-001',
        status: 'active',
        property: {
          address: '123 University Ave, Unit 3A',
          type: 'Apartment',
          bedrooms: 2,
          bathrooms: 1
        },
        deposit: {
          amount: 2400,
          currency: 'USD',
          paidDate: '2023-08-15',
          returnDate: '2024-05-31',
          daysRemaining: 95
        },
        landlord: {
          name: 'Robert Chen',
          company: 'University Properties LLC',
          email: 'rchen@universityproperties.com',
          phone: '(555) 987-6543',
          rating: 4.2
        },
        lease: {
          startDate: '2023-09-01',
          endDate: '2024-05-31',
          monthlyRent: 2400,
          earlyTermination: false
        },
        escrow: {
          provider: 'SecureDeposit Pro',
          accountNumber: 'SDP-ACC-789456',
          interestRate: 2.5,
          interestEarned: 48.50,
          fees: 25.00
        },
        inspections: {
          moveIn: {
            date: '2023-08-30',
            status: 'completed',
            photos: 15,
            issues: [
              { item: 'Small scuff on wall', room: 'Living Room', severity: 'minor', documented: true },
              { item: 'Loose cabinet door', room: 'Kitchen', severity: 'minor', documented: true }
            ]
          },
          moveOut: {
            scheduled: true,
            date: '2024-05-30',
            status: 'pending'
          }
        },
        protection: {
          coverage: 'Full Protection',
          guaranteedReturn: 85,
          disputeResolution: true,
          legalSupport: true,
          maxDispute: 5000
        },
        timeline: [
          { date: '2023-08-15', event: 'Security deposit paid to escrow', status: 'completed' },
          { date: '2023-08-30', event: 'Move-in inspection completed', status: 'completed' },
          { date: '2024-05-30', event: 'Move-out inspection scheduled', status: 'upcoming' },
          { date: '2024-05-31', event: 'Automatic deposit return', status: 'upcoming' }
        ]
      },
      {
        id: 'dep-002',
        escrowId: 'ESC-2024-002',
        status: 'pending_inspection',
        property: {
          address: '456 College Blvd, Apt 12B',
          type: 'Studio',
          bedrooms: 0,
          bathrooms: 1
        },
        deposit: {
          amount: 1800,
          currency: 'USD',
          paidDate: '2024-01-10',
          returnDate: '2024-12-31',
          daysRemaining: 278
        },
        landlord: {
          name: 'Maria Rodriguez',
          company: 'Campus Living Solutions',
          email: 'maria@campusliving.com',
          phone: '(555) 234-7890',
          rating: 4.7
        },
        lease: {
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          monthlyRent: 1800,
          earlyTermination: false
        },
        escrow: {
          provider: 'SecureDeposit Pro',
          accountNumber: 'SDP-ACC-456789',
          interestRate: 2.5,
          interestEarned: 15.75,
          fees: 25.00
        },
        inspections: {
          moveIn: {
            date: '2024-01-12',
            status: 'completed',
            photos: 8,
            issues: []
          },
          moveOut: {
            scheduled: false,
            status: 'not_scheduled'
          }
        },
        protection: {
          coverage: 'Full Protection',
          guaranteedReturn: 90,
          disputeResolution: true,
          legalSupport: true,
          maxDispute: 5000
        },
        timeline: [
          { date: '2024-01-10', event: 'Security deposit paid to escrow', status: 'completed' },
          { date: '2024-01-12', event: 'Move-in inspection completed', status: 'completed' }
        ]
      }
    ],
    returnedDeposits: [
      {
        id: 'dep-003',
        escrowId: 'ESC-2023-015',
        status: 'returned',
        property: {
          address: '789 Student Way, Unit 5C',
          type: 'Apartment'
        },
        deposit: {
          amount: 2200,
          returnedAmount: 2050,
          deductions: [
            { item: 'Carpet cleaning', amount: 150, justified: true }
          ],
          returnDate: '2024-01-05',
          returnMethod: 'Direct Deposit'
        },
        satisfaction: 4.8,
        returnTime: '2 days'
      }
    ],
    statistics: {
      totalDepositsProtected: 847293,
      averageDeposit: 2156,
      averageReturnRate: 92.3,
      averageReturnTime: '3.2 days',
      disputeResolutionRate: 96.8,
      customerSatisfaction: 4.7,
      totalSaved: 125847,
      protectionSuccess: 98.2
    },
    providers: [
      {
        id: 'sdp-001',
        name: 'SecureDeposit Pro',
        rating: 4.8,
        fees: 25.00,
        interestRate: 2.5,
        features: ['FDIC Insured', 'Legal Support', 'Photo Documentation', '24/7 Support'],
        processingTime: '1 business day',
        returnTime: '2-3 business days',
        coverage: 'Up to $10,000'
      },
      {
        id: 'sdp-002',
        name: 'EscrowGuard',
        rating: 4.6,
        fees: 30.00,
        interestRate: 2.8,
        features: ['FDIC Insured', 'Dispute Resolution', 'Mobile App', 'Free Inspections'],
        processingTime: '2 business days',
        returnTime: '1-2 business days',
        coverage: 'Up to $15,000'
      }
    ]
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_inspection': return 'bg-yellow-100 text-yellow-800';
      case 'pending_return': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Shield className="text-green-600" size={16} />;
      case 'pending_inspection': return <Clock className="text-yellow-600" size={16} />;
      case 'pending_return': return <RefreshCw className="text-blue-600" size={16} />;
      case 'returned': return <CheckCircle className="text-gray-600" size={16} />;
      case 'disputed': return <AlertTriangle className="text-red-600" size={16} />;
      default: return <Shield className="text-gray-600" size={16} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateDaysRemaining = (returnDate) => {
    const today = new Date();
    const endDate = new Date(returnDate);
    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleNewEscrow = () => {
    console.log('Creating new escrow account:', newEscrowForm);
    
    // Reset form
    setNewEscrowForm({
      propertyAddress: '',
      depositAmount: '',
      landlordEmail: '',
      leaseStartDate: '',
      leaseEndDate: '',
      moveInInspection: null,
      additionalTerms: ''
    });
    
    setShowNewEscrow(false);
    alert('Escrow account created successfully! Your security deposit is now protected and earning interest.');
  };

  const handleClaimDeposit = () => {
    console.log('Processing deposit claim for:', selectedDeposit);
    setShowClaimModal(false);
    alert('Deposit return initiated! Funds will be transferred to your account within 2-3 business days.');
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Security Deposit Protection</h2>
        <div className="flex items-center text-gray-600">
          <Shield size={16} className="mr-2" />
          <span>Secure escrow services with guaranteed returns</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {['overview', 'my-deposits', 'escrow-providers', 'returns', 'protection'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Protection Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Your Protection Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(depositData.user.totalProtected)}</div>
                <div className="text-sm text-gray-600">Total Protected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{depositData.user.activeDeposits}</div>
                <div className="text-sm text-gray-600">Active Deposits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{depositData.statistics.averageReturnRate}%</div>
                <div className="text-sm text-gray-600">Return Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{depositData.user.protectionRating}</div>
                <div className="text-sm text-gray-600">Protection Score</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setShowNewEscrow(true)}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Plus size={20} className="text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Set Up Deposit Protection</p>
                    <p className="text-sm text-gray-600">Secure your next security deposit in escrow</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('my-deposits')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Shield size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View Protected Deposits</p>
                    <p className="text-sm text-gray-600">{depositData.user.activeDeposits} deposits currently protected</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('returns')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <DollarSign size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Claim Deposit Return</p>
                    <p className="text-sm text-gray-600">Process automatic or manual deposit returns</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('protection')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Award size={20} className="text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Protection Benefits</p>
                    <p className="text-sm text-gray-600">Learn about coverage and guarantees</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Active Deposits Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Your Active Deposits</h3>
              <button
                onClick={() => setActiveTab('my-deposits')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            {depositData.deposits.slice(0, 2).map((deposit) => (
              <div key={deposit.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Home size={20} className="text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium">{deposit.property.address}</h4>
                      <p className="text-sm text-gray-600">{formatCurrency(deposit.deposit.amount)} • Escrow #{deposit.escrowId}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(deposit.status)}
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(deposit.status)}`}>
                      {deposit.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="text-gray-600">Landlord:</span>
                    <span className="ml-2 font-medium">{deposit.landlord.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Return Date:</span>
                    <span className="ml-2 font-medium">{new Date(deposit.deposit.returnDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Earned:</span>
                    <span className="ml-2 font-medium text-green-600">{formatCurrency(deposit.escrow.interestEarned)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Days Remaining:</span>
                    <span className="ml-2 font-medium">{deposit.deposit.daysRemaining} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Protection Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <Award size={20} className="mr-2" />
              Why Use Deposit Protection?
            </h3>
            <div className="text-sm text-green-700 space-y-2">
              <p>• <strong>Guaranteed Returns:</strong> {depositData.statistics.averageReturnRate}% average return rate with full documentation</p>
              <p>• <strong>Earn Interest:</strong> Your deposit earns 2.5% APY while in secure escrow</p>
              <p>• <strong>Legal Protection:</strong> Full dispute resolution and legal support included</p>
              <p>• <strong>Fast Returns:</strong> Average return time of {depositData.statistics.averageReturnTime}</p>
              <p>• <strong>Photo Documentation:</strong> Professional move-in/move-out inspections</p>
            </div>
          </div>

          {/* Platform Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Platform Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(depositData.statistics.totalDepositsProtected)}</div>
                <div className="text-xs text-gray-600">Total Protected</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{depositData.statistics.protectionSuccess}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{formatCurrency(depositData.statistics.totalSaved)}</div>
                <div className="text-xs text-gray-600">Total Saved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{depositData.statistics.customerSatisfaction}</div>
                <div className="text-xs text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Deposits Tab */}
      {activeTab === 'my-deposits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">My Protected Deposits</h3>
            <button
              onClick={() => setShowNewEscrow(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              New Protection
            </button>
          </div>

          {/* Active Deposits */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Active Deposits</h4>
            {depositData.deposits.map((deposit) => (
              <div key={deposit.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Home size={24} className="text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-semibold">{deposit.property.address}</h4>
                      <p className="text-sm text-gray-600">{deposit.property.type} • {deposit.property.bedrooms} bed, {deposit.property.bathrooms} bath</p>
                      <p className="text-xs text-gray-500">Escrow #{deposit.escrowId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      {getStatusIcon(deposit.status)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(deposit.status)}`}>
                        {deposit.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-1">{formatCurrency(deposit.deposit.amount)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Landlord:</span>
                    <div className="font-medium">{deposit.landlord.name}</div>
                    <div className="text-xs text-gray-500">{deposit.landlord.company}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Lease Period:</span>
                    <div className="font-medium">
                      {new Date(deposit.lease.startDate).toLocaleDateString()} - {new Date(deposit.lease.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Escrow Provider:</span>
                    <div className="font-medium">{deposit.escrow.provider}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Earned:</span>
                    <div className="font-medium text-green-600">{formatCurrency(deposit.escrow.interestEarned)}</div>
                  </div>
                </div>

                {/* Protection Coverage */}
                <div className="bg-green-50 p-3 rounded-lg mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield size={16} className="text-green-600 mr-2" />
                      <span className="font-medium text-green-800">{deposit.protection.coverage}</span>
                    </div>
                    <span className="text-sm font-medium text-green-700">{deposit.protection.guaranteedReturn}% Guaranteed Return</span>
                  </div>
                </div>

                {/* Timeline Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Lease Progress</span>
                    <span className="text-gray-600">{deposit.deposit.daysRemaining} days remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((new Date() - new Date(deposit.lease.startDate)) / (new Date(deposit.lease.endDate) - new Date(deposit.lease.startDate))) * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedDeposit(deposit)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Camera size={16} />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <MessageSquare size={16} />
                  </button>
                  {deposit.status === 'active' && deposit.deposit.daysRemaining <= 30 && (
                    <button
                      onClick={() => {
                        setSelectedDeposit(deposit);
                        setShowClaimModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Claim Return
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escrow Providers Tab */}
      {activeTab === 'escrow-providers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Trusted Escrow Providers</h3>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={16} />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Search size={16} />
              </button>
            </div>
          </div>

          {depositData.providers.map((provider) => (
            <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{provider.name}</h4>
                    <div className="flex items-center mt-1">
                      <Star size={14} className="text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium mr-2">{provider.rating}</span>
                      <span className="text-xs text-gray-500">Trusted Provider</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Processing: {provider.processingTime}</div>
                  <div className="text-sm font-medium">Returns: {provider.returnTime}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-gray-600 text-sm">Setup Fee:</span>
                  <div className="font-medium">{formatCurrency(provider.fees)}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Interest Rate:</span>
                  <div className="font-medium">{provider.interestRate}% APY</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Coverage:</span>
                  <div className="font-medium">{provider.coverage}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Return Time:</span>
                  <div className="font-medium">{provider.returnTime}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Features</div>
                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                  Choose Provider
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Deposit Returns</h3>

          {/* Upcoming Returns */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Upcoming Returns</h4>
            {depositData.deposits.filter(d => d.deposit.daysRemaining <= 60).map((deposit) => (
              <div key={deposit.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold">{deposit.property.address}</h5>
                    <p className="text-sm text-gray-600">Expected return: {new Date(deposit.deposit.returnDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(deposit.deposit.amount)}</div>
                    <div className="text-xs text-gray-500">+ {formatCurrency(deposit.escrow.interestEarned)} interest</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <div className="text-sm">
                    <div className="font-medium text-blue-800">Automatic Return Process</div>
                    <div className="text-blue-700">Your deposit will be automatically returned 3 days after lease end unless disputed by landlord</div>
                  </div>
                </div>

                {deposit.deposit.daysRemaining <= 30 && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedDeposit(deposit);
                        setShowClaimModal(true);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                    >
                      Process Early Return
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Schedule Inspection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Return History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Return History</h4>
            {depositData.returnedDeposits.map((deposit) => (
              <div key={deposit.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold">{deposit.property.address}</h5>
                    <p className="text-sm text-gray-600">Returned on {new Date(deposit.deposit.returnDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">Processing time: {deposit.returnTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(deposit.deposit.returnedAmount)}</div>
                    <div className="text-sm text-gray-600">of {formatCurrency(deposit.deposit.amount)}</div>
                  </div>
                </div>

                {deposit.deposit.deductions.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-3">
                    <div className="text-sm font-medium text-yellow-800 mb-2">Deductions</div>
                    {deposit.deposit.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between text-sm text-yellow-700">
                        <span>{deduction.item}</span>
                        <span>-{formatCurrency(deduction.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{deposit.satisfaction}/5</span>
                    <span className="text-sm text-gray-600 ml-2">satisfaction rating</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Download Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protection Tab */}
      {activeTab === 'protection' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Deposit Protection Benefits</h3>

          {/* Coverage Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <Shield size={20} className="text-blue-600 mr-2" />
              What's Covered
            </h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Full Deposit Protection</h5>
                  <p className="text-sm text-gray-600">Your entire security deposit is held in FDIC-insured escrow accounts</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Interest Earnings</h5>
                  <p className="text-sm text-gray-600">Earn 2.5% APY on your deposit while it's in escrow</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Dispute Resolution</h5>
                  <p className="text-sm text-gray-600">Professional mediation for any deposit disputes with landlords</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Legal Support</h5>
                  <p className="text-sm text-gray-600">Access to legal experts for complex deposit issues</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Documentation Services</h5>
                  <p className="text-sm text-gray-600">Professional move-in/move-out inspections with photo documentation</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle size={16} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h5 className="font-medium">Guaranteed Returns</h5>
                  <p className="text-sm text-gray-600">85-90% guaranteed return rate with full protection coverage</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <Target size={20} className="text-blue-600 mr-2" />
              How Protection Works
            </h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h5 className="font-medium">Set Up Protection</h5>
                  <p className="text-sm text-gray-600">Choose a trusted escrow provider and set up your secure account</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h5 className="font-medium">Deposit Funds</h5>
                  <p className="text-sm text-gray-600">Your security deposit is held safely in escrow and starts earning interest</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h5 className="font-medium">Professional Inspections</h5>
                  <p className="text-sm text-gray-600">Document property condition at move-in and move-out with photos</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600">4</span>
                </div>
                <div>
                  <h5 className="font-medium">Automatic Return</h5>
                  <p className="text-sm text-gray-600">Receive your deposit + interest automatically within 3 days of lease end</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Cost & Earnings</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Setup Fee</span>
                <span className="text-green-600 font-medium">$25.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Monthly Fee</span>
                <span className="text-green-600 font-medium">$0.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Interest Earnings (2.5% APY)</span>
                <span className="text-green-600 font-medium">+$40-60/year</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Net Benefit (typical)</span>
                <span className="text-green-600 font-bold">+$15-35/year</span>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">Success Stories</h4>
            <div className="space-y-3 text-sm text-blue-700">
              <div>
                <p><strong>Sarah M., USC Student:</strong> "Got my full $2,200 deposit back plus $48 in interest. The documentation photos saved me when my landlord tried to claim damage that wasn't there."</p>
              </div>
              <div>
                <p><strong>Mike T., UCLA Student:</strong> "The dispute resolution service was amazing. They helped me get back $400 that my landlord was wrongfully withholding for 'cleaning fees.'"</p>
              </div>
              <div>
                <p><strong>Jessica L., Berkeley Student:</strong> "Automatic return was so convenient. Got my money back the day after my lease ended without having to chase my landlord."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Escrow Modal */}
      {showNewEscrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Set Up Deposit Protection</h2>
                <button onClick={() => setShowNewEscrow(false)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Property Address</label>
                  <input
                    type="text"
                    value={newEscrowForm.propertyAddress}
                    onChange={(e) => setNewEscrowForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    placeholder="Enter the rental property address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Security Deposit Amount</label>
                  <input
                    type="number"
                    value={newEscrowForm.depositAmount}
                    onChange={(e) => setNewEscrowForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                    placeholder="2400"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Landlord Email</label>
                  <input
                    type="email"
                    value={newEscrowForm.landlordEmail}
                    onChange={(e) => setNewEscrowForm(prev => ({ ...prev, landlordEmail: e.target.value }))}
                    placeholder="landlord@email.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Lease Start Date</label>
                    <input
                      type="date"
                      value={newEscrowForm.leaseStartDate}
                      onChange={(e) => setNewEscrowForm(prev => ({ ...prev, leaseStartDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lease End Date</label>
                    <input
                      type="date"
                      value={newEscrowForm.leaseEndDate}
                      onChange={(e) => setNewEscrowForm(prev => ({ ...prev, leaseEndDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Terms (Optional)</label>
                  <textarea
                    value={newEscrowForm.additionalTerms}
                    onChange={(e) => setNewEscrowForm(prev => ({ ...prev, additionalTerms: e.target.value }))}
                    placeholder="Any special conditions or terms..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Move-in Inspection Scheduling</div>
                  <p className="text-xs text-gray-600 mb-3">Schedule a professional move-in inspection to document property condition</p>
                  <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                    <Calendar size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Schedule Move-in Inspection</p>
                  </button>
                </div>

                {/* Cost Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Protection Summary</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Setup Fee:</span>
                      <span>$25.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Fee:</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Interest Earnings (2.5% APY):</span>
                      <span>+${newEscrowForm.depositAmount ? (newEscrowForm.depositAmount * 0.025).toFixed(0) : '0'}/year</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewEscrow(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewEscrow}
                  disabled={!newEscrowForm.propertyAddress || !newEscrowForm.depositAmount || !newEscrowForm.landlordEmail}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    newEscrowForm.propertyAddress && newEscrowForm.depositAmount && newEscrowForm.landlordEmail
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Set Up Protection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Deposit Modal */}
      {showClaimModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Claim Deposit Return</h2>
                <button onClick={() => setShowClaimModal(false)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Deposit Information</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Property:</strong> {selectedDeposit.property.address}</div>
                    <div><strong>Deposit Amount:</strong> {formatCurrency(selectedDeposit.deposit.amount)}</div>
                    <div><strong>Interest Earned:</strong> {formatCurrency(selectedDeposit.escrow.interestEarned)}</div>
                    <div><strong>Total Return:</strong> {formatCurrency(selectedDeposit.deposit.amount + selectedDeposit.escrow.interestEarned)}</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Return Process</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Move-out inspection will be scheduled within 48 hours</p>
                    <p>• Landlord has 7 days to dispute any charges</p>
                    <p>• Funds will be released to your account within 2-3 business days</p>
                    <p>• You'll receive full documentation of the return process</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bank Account for Deposit Return</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Wells Fargo Checking (...4567)</option>
                    <option>Chase Savings (...8901)</option>
                    <option>Add new bank account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                  <textarea
                    placeholder="Any special instructions or concerns..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaimDeposit}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Process Return
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

export default SecurityDepositProtection;