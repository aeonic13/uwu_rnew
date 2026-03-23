import React, { useState } from 'react';
import { 
  FileText, Users, Calendar, DollarSign, Shield, CheckCircle, XCircle,
  AlertTriangle, Edit, Eye, Download, Send, Clock, Home, Scale, 
  PenTool, Building, UserCheck, Phone, Mail, MapPin, Plus, X,
  Save, Camera, Upload, Lock, Unlock, Star, Award, Zap, RefreshCw
} from 'lucide-react';

const LeaseContractManager = ({ user, currentLease, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractForm, setContractForm] = useState({
    rentalType: 'room', // room, entire-unit, shared-space
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    utilities: 'included', // included, separate, shared
    sublessee: {
      name: '',
      email: '',
      phone: '',
      university: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    },
    terms: {
      guestsAllowed: true,
      smokingAllowed: false,
      petsAllowed: false,
      cleaningResponsibilities: 'shared',
      commonAreaAccess: true,
      parkingIncluded: false,
      keyDepositRequired: true,
      keyDepositAmount: 50
    },
    additionalTerms: '',
    ownerApprovalRequired: true
  });

  // Mock data for lease contracts
  const [contractData] = useState({
    student: {
      name: 'Alex Johnson',
      email: 'alex@usc.edu',
      currentLease: {
        property: '123 University Ave, Unit 3A',
        landlord: 'Robert Chen',
        landlordEmail: 'rchen@propertymanagement.com',
        rentAmount: 2400,
        leaseEndDate: '2024-08-31',
        startDate: '2024-01-01'
      },
      verification: {
        studentStatus: true,
        leaseVerified: true,
        ownerPermission: 'pending'
      }
    },
    contracts: [
      {
        id: 'contract-001',
        status: 'active',
        type: 'room',
        sublessee: {
          name: 'Maria Rodriguez',
          email: 'maria.r@ucla.edu',
          phone: '(555) 234-5678',
          university: 'UCLA',
          verificationStatus: 'verified'
        },
        terms: {
          startDate: '2024-03-01',
          endDate: '2024-06-30',
          monthlyRent: 1200,
          securityDeposit: 600,
          utilities: 'included'
        },
        signatures: {
          sublessor: { signed: true, date: '2024-02-15', ip: '192.168.1.1' },
          sublessee: { signed: true, date: '2024-02-16', ip: '192.168.1.5' },
          witness: null
        },
        payments: {
          securityDepositPaid: true,
          currentMonthPaid: true,
          totalReceived: 2400,
          nextDueDate: '2024-04-01'
        },
        documents: [
          { type: 'contract', url: '/docs/lease-001.pdf', generated: '2024-02-15' },
          { type: 'id_verification', url: '/docs/maria-id.pdf', uploaded: '2024-02-14' }
        ],
        createdDate: '2024-02-15',
        lastModified: '2024-02-16'
      },
      {
        id: 'contract-002',
        status: 'pending_approval',
        type: 'shared-space',
        sublessee: {
          name: 'James Park',
          email: 'jpark@usc.edu',
          phone: '(555) 345-6789',
          university: 'USC',
          verificationStatus: 'pending'
        },
        terms: {
          startDate: '2024-04-01',
          endDate: '2024-07-31',
          monthlyRent: 800,
          securityDeposit: 400,
          utilities: 'shared'
        },
        signatures: {
          sublessor: { signed: true, date: '2024-03-20' },
          sublessee: { signed: false },
          witness: null
        },
        payments: {
          securityDepositPaid: false,
          currentMonthPaid: false,
          totalReceived: 0,
          nextDueDate: null
        },
        documents: [
          { type: 'contract_draft', url: '/docs/lease-002-draft.pdf', generated: '2024-03-20' }
        ],
        createdDate: '2024-03-20',
        lastModified: '2024-03-20'
      }
    ],
    legalRequirements: {
      state: 'CA',
      ownerApprovalRequired: true,
      maxRentalDuration: '6 months',
      securityDepositLimit: '2 months rent',
      requiredDisclosures: [
        'Lead paint disclosure (if applicable)',
        'Smoking policy',
        'Pet policy',
        'Utilities arrangement',
        'Emergency contact information'
      ],
      mandatoryClauses: [
        'Original lease compliance',
        'Damage responsibility',
        'Early termination conditions',
        'Sublessee screening requirements'
      ]
    },
    templates: [
      {
        id: 'standard-room',
        name: 'Standard Room Lease',
        description: 'Basic agreement for rentalting a private room',
        popularity: 95,
        lastUpdated: '2024-01-15',
        features: ['State compliant', 'Digital signatures', 'Payment tracking']
      },
      {
        id: 'shared-space',
        name: 'Shared Space Agreement',
        description: 'For rentalting part of a room or shared living space',
        popularity: 78,
        lastUpdated: '2024-01-10',
        features: ['Flexible terms', 'Utility splitting', 'Privacy clauses']
      },
      {
        id: 'short-term',
        name: 'Short-term Lease',
        description: 'For rentalting periods under 3 months',
        popularity: 65,
        lastUpdated: '2024-01-20',
        features: ['Quick approval', 'Flexible dates', 'Minimal paperwork']
      }
    ],
    analytics: {
      totalContracts: 2,
      activeContracts: 1,
      totalIncome: 2400,
      averageRentReceived: 1200,
      occupancyRate: 75,
      timeToApproval: '2.3 days',
      sublesseeRating: 4.8
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'pending_signatures': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending_approval': return <Clock size={16} className="text-yellow-600" />;
      case 'pending_signatures': return <PenTool size={16} className="text-blue-600" />;
      case 'expired': return <XCircle size={16} className="text-gray-600" />;
      case 'terminated': return <XCircle size={16} className="text-red-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const handleCreateContract = () => {
    try {
      // Import security utilities for validation
      const { sanitizeFormData, validateInput, applyRateLimit, logSecurityEvent } = require('../utils/security');
      
      // Get user identifier for rate limiting (in real app, use IP or user ID)
      const userIdentifier = user?.email || 'anonymous';
      
      // Apply rate limiting for contract creation
      const rateLimitResult = applyRateLimit(userIdentifier, 'CONTRACT_CREATE');
      if (!rateLimitResult.allowed) {
        alert(`Rate limit exceeded: ${rateLimitResult.message}`);
        logSecurityEvent('rate_limit_exceeded', { 
          action: 'contract_create',
          user: userIdentifier,
          message: rateLimitResult.message 
        }, 'medium');
        return;
      }
      
      // Define validation schema for form data
      const validationSchema = {
        monthlyRent: {
          type: 'number',
          required: true,
          options: { min: 100, max: 50000 }
        },
        securityDeposit: {
          type: 'number',
          required: true,
          options: { min: 0, max: 10000 }
        },
        'sublessee.name': {
          type: 'string',
          required: true,
          sanitize: 'html',
          options: { minLength: 2, maxLength: 100 }
        },
        'sublessee.email': {
          type: 'email',
          required: true,
          sanitize: 'html'
        },
        'sublessee.phone': {
          type: 'phone',
          required: true
        },
        additionalTerms: {
          type: 'string',
          required: false,
          sanitize: 'content',
          context: 'description',
          options: { maxLength: 2000 }
        }
      };
      
      // Flatten form data for validation
      const flatFormData = {
        monthlyRent: contractForm.monthlyRent,
        securityDeposit: contractForm.securityDeposit,
        'sublessee.name': contractForm.sublessee.name,
        'sublessee.email': contractForm.sublessee.email,
        'sublessee.phone': contractForm.sublessee.phone,
        additionalTerms: contractForm.additionalTerms
      };
      
      // Validate and sanitize form data
      const sanitizedData = sanitizeFormData(flatFormData, validationSchema);
      
      console.log('Creating contract with sanitized data:', {
        ...contractForm,
        monthlyRent: sanitizedData.monthlyRent,
        securityDeposit: sanitizedData.securityDeposit,
        sublessee: {
          ...contractForm.sublessee,
          name: sanitizedData['sublessee.name'],
          email: sanitizedData['sublessee.email'],
          phone: sanitizedData['sublessee.phone']
        },
        additionalTerms: sanitizedData.additionalTerms
      });
      
      // Log successful contract creation
      logSecurityEvent('contract_created', {
        user: userIdentifier,
        contractType: contractForm.rentalType,
        rentAmount: sanitizedData.monthlyRent
      }, 'info');
      
    } catch (error) {
      console.error('Validation error:', error.message);
      alert(`Form validation failed: ${error.message}`);
      return;
    }
    
    console.log('Creating contract:', contractForm);
    
    // Create new contract
    const newContract = {
      id: `contract-${Date.now()}`,
      status: contractForm.ownerApprovalRequired ? 'pending_approval' : 'pending_signatures',
      type: contractForm.rentalType,
      sublessee: contractForm.sublessee,
      terms: {
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        monthlyRent: parseFloat(contractForm.monthlyRent),
        securityDeposit: parseFloat(contractForm.securityDeposit),
        utilities: contractForm.utilities,
        ...contractForm.terms
      },
      signatures: {
        sublessor: { signed: false },
        sublessee: { signed: false },
        witness: null
      },
      payments: {
        securityDepositPaid: false,
        currentMonthPaid: false,
        totalReceived: 0,
        nextDueDate: null
      },
      documents: [],
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Reset form
    setContractForm({
      rentalType: 'room',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      utilities: 'included',
      sublessee: {
        name: '',
        email: '',
        phone: '',
        university: '',
        emergencyContact: { name: '', phone: '', relationship: '' }
      },
      terms: {
        guestsAllowed: true,
        smokingAllowed: false,
        petsAllowed: false,
        cleaningResponsibilities: 'shared',
        commonAreaAccess: true,
        parkingIncluded: false,
        keyDepositRequired: true,
        keyDepositAmount: 50
      },
      additionalTerms: '',
      ownerApprovalRequired: true
    });

    setShowCreateContract(false);
    alert(
      'Lease contract created successfully!\n\n' +
      'Next steps:\n' +
      '1. Your landlord will be notified and must approve this lease\n' +
      '2. Once approved, the sublessee will be contacted for verification\n' +
      '3. Legal documents will be generated and sent for signatures\n' +
      '4. Payment collection will be set up automatically\n\n' +
      'You will receive updates on the approval status via email and notifications.'
    );
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Lease Contract Manager</h2>
        <div className="flex items-center text-gray-600">
          <FileText size={16} className="mr-2" />
          <span>Create and manage legal rentalting agreements</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {['overview', 'contracts', 'create', 'templates', 'legal'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Student Verification Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Your Rentalting Eligibility</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck size={20} className="text-green-600 mr-3" />
                  <span>Student Status Verified</span>
                </div>
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText size={20} className="text-green-600 mr-3" />
                  <span>Active Lease Verified</span>
                </div>
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield size={20} className="text-yellow-600 mr-3" />
                  <span>Owner Permission</span>
                </div>
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Your landlord's approval is required before any lease can become active. 
                We'll handle the approval request process for you.
              </p>
            </div>
          </div>

          {/* Current Lease Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Your Current Lease</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Property</div>
                <div className="font-semibold">{contractData.student.currentLease.property}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Monthly Rent</div>
                <div className="font-semibold">${contractData.student.currentLease.rentAmount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Lease End Date</div>
                <div className="font-semibold">{contractData.student.currentLease.leaseEndDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Landlord</div>
                <div className="font-semibold">{contractData.student.currentLease.landlord}</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Rentalting Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{contractData.analytics.totalContracts}</div>
                <div className="text-sm text-gray-600">Total Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{contractData.analytics.activeContracts}</div>
                <div className="text-sm text-gray-600">Active Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${contractData.analytics.totalIncome}</div>
                <div className="text-sm text-gray-600">Total Income</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{contractData.analytics.occupancyRate}%</div>
                <div className="text-sm text-gray-600">Occupancy Rate</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Plus size={20} className="text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Create New Lease</p>
                    <p className="text-sm text-gray-600">Start a new rentalting agreement</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('contracts')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Manage Contracts</p>
                    <p className="text-sm text-gray-600">View and edit existing agreements</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('legal')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Scale size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Legal Requirements</p>
                    <p className="text-sm text-gray-600">Know your state's rentalting laws</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
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
                  <p className="text-sm font-medium">Payment received from Maria Rodriguez</p>
                  <p className="text-xs text-gray-500">April rent • 2 hours ago</p>
                </div>
                <span className="text-sm font-semibold text-green-600">$1,200</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New contract created for James Park</p>
                  <p className="text-xs text-gray-500">Pending approval • 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <PenTool size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Contract signed by Maria Rodriguez</p>
                  <p className="text-xs text-gray-500">Lease-001 • 1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Your Lease Contracts</h3>
            <button
              onClick={() => setActiveTab('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              New Contract
            </button>
          </div>

          {contractData.contracts.map((contract) => (
            <div key={contract.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getStatusIcon(contract.status)}
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h4 className="font-semibold mr-2">{contract.sublessee.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(contract.status)}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{contract.type} lease</p>
                    <p className="text-xs text-gray-500">{contract.sublessee.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">${contract.terms.monthlyRent}/month</div>
                  <div className="text-xs text-gray-500">
                    {contract.terms.startDate} - {contract.terms.endDate}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Security Deposit</div>
                  <div className="font-semibold">${contract.terms.securityDeposit}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Utilities</div>
                  <div className="font-semibold capitalize">{contract.terms.utilities}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                  <div className={`font-semibold ${
                    contract.payments.currentMonthPaid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {contract.payments.currentMonthPaid ? 'Current' : 'Overdue'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Next Due</div>
                  <div className="font-semibold">
                    {contract.payments.nextDueDate || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Contract Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedContract(contract)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <Eye size={16} className="mr-2" />
                  View Contract
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Download size={16} />
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Send size={16} />
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Contract Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Create New Lease Contract</h3>

          {/* Contract Type Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">What are you rentalting?</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'room', title: 'Private Room', desc: 'Rentalting your private bedroom', icon: Home },
                { type: 'entire-unit', title: 'Entire Unit', desc: 'Rentalting your whole apartment/unit', icon: Building },
                { type: 'shared-space', title: 'Shared Space', desc: 'Sharing part of your room or common area', icon: Users }
              ].map(({ type, title, desc, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setContractForm(prev => ({ ...prev, rentalType: type }))}
                  className={`flex items-center p-4 border-2 rounded-lg text-left transition-colors ${
                    contractForm.rentalType === type
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={24} className="text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lease Duration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Lease Duration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Financial Terms</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={contractForm.monthlyRent}
                    onChange={(e) => setContractForm(prev => ({ ...prev, monthlyRent: e.target.value }))}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={contractForm.securityDeposit}
                    onChange={(e) => setContractForm(prev => ({ ...prev, securityDeposit: e.target.value }))}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="600"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Utilities</label>
              <select
                value={contractForm.utilities}
                onChange={(e) => setContractForm(prev => ({ ...prev, utilities: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="included">Included in rent</option>
                <option value="separate">Paid separately by sublessee</option>
                <option value="shared">Split between roommates</option>
              </select>
            </div>
          </div>

          {/* Sublessee Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Sublessee Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={contractForm.sublessee.name}
                    onChange={(e) => setContractForm(prev => ({
                      ...prev,
                      sublessee: { ...prev.sublessee, name: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter sublessee's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">University</label>
                  <input
                    type="text"
                    value={contractForm.sublessee.university}
                    onChange={(e) => setContractForm(prev => ({
                      ...prev,
                      sublessee: { ...prev.sublessee, university: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., USC, UCLA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={contractForm.sublessee.email}
                    onChange={(e) => setContractForm(prev => ({
                      ...prev,
                      sublessee: { ...prev.sublessee, email: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={contractForm.sublessee.phone}
                    onChange={(e) => setContractForm(prev => ({
                      ...prev,
                      sublessee: { ...prev.sublessee, phone: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">House Rules & Terms</h4>
            <div className="space-y-3">
              {[
                { key: 'guestsAllowed', label: 'Guests allowed' },
                { key: 'smokingAllowed', label: 'Smoking permitted' },
                { key: 'petsAllowed', label: 'Pets allowed' },
                { key: 'commonAreaAccess', label: 'Full common area access' },
                { key: 'parkingIncluded', label: 'Parking space included' },
                { key: 'keyDepositRequired', label: 'Key deposit required' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={contractForm.terms[key]}
                    onChange={(e) => setContractForm(prev => ({
                      ...prev,
                      terms: { ...prev.terms, [key]: e.target.checked }
                    }))}
                    className="mr-3"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Terms */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Additional Terms (Optional)</h4>
            <textarea
              value={contractForm.additionalTerms}
              onChange={(e) => setContractForm(prev => ({ ...prev, additionalTerms: e.target.value }))}
              placeholder="Add any specific terms, conditions, or house rules..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Create Contract Button */}
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateContract}
              disabled={!contractForm.sublessee.name || !contractForm.sublessee.email || !contractForm.monthlyRent}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                contractForm.sublessee.name && contractForm.sublessee.email && contractForm.monthlyRent
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Contract
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Contract Templates</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Browse All Templates
            </button>
          </div>

          {contractData.templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold mr-3">{template.name}</h4>
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 fill-current mr-1" />
                      <span className="text-sm text-gray-600">{template.popularity}% popular</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.features.map((feature, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Last updated: {template.lastUpdated}
                </span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legal Requirements Tab */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Legal Requirements for California</h3>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle size={20} className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Important Legal Notice</h4>
                <p className="text-sm text-yellow-700">
                  Rentalting laws vary by state and local jurisdiction. Always ensure you have written permission 
                  from your landlord and comply with your original lease terms.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Required Disclosures</h4>
            <div className="space-y-3">
              {contractData.legalRequirements.requiredDisclosures.map((disclosure, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle size={16} className="text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{disclosure}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Mandatory Contract Clauses</h4>
            <div className="space-y-3">
              {contractData.legalRequirements.mandatoryClauses.map((clause, index) => (
                <div key={index} className="flex items-start">
                  <Scale size={16} className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{clause}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">State-Specific Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Owner Approval</div>
                <div className="font-semibold">
                  {contractData.legalRequirements.ownerApprovalRequired ? 'Required' : 'Not Required'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Rental Duration</div>
                <div className="font-semibold">{contractData.legalRequirements.maxRentalDuration}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Security Deposit Limit</div>
                <div className="font-semibold">{contractData.legalRequirements.securityDepositLimit}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">State</div>
                <div className="font-semibold">{contractData.legalRequirements.state}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield size={20} className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Rentra Legal Protection</h4>
                <p className="text-sm text-blue-700 mb-3">
                  All contracts generated through Rentra are automatically updated to comply with current 
                  state and local laws. Our legal AI ensures your agreements are enforceable and protect both parties.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Learn more about our legal protection →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Contract Details</h2>
                <button onClick={() => setSelectedContract(null)}>
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Contract Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Contract Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Sublessee</div>
                      <div className="font-semibold">{selectedContract.sublessee.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Monthly Rent</div>
                      <div className="font-semibold">${selectedContract.terms.monthlyRent}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-semibold">
                        {selectedContract.terms.startDate} to {selectedContract.terms.endDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Payment Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Security Deposit</div>
                      <div className={`font-semibold ${
                        selectedContract.payments.securityDepositPaid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedContract.payments.securityDepositPaid ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Current Month</div>
                      <div className={`font-semibold ${
                        selectedContract.payments.currentMonthPaid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedContract.payments.currentMonthPaid ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Received</div>
                      <div className="font-semibold">${selectedContract.payments.totalReceived}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Next Due</div>
                      <div className="font-semibold">
                        {selectedContract.payments.nextDueDate || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Digital Signatures</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">You (Sublessor)</div>
                        <div className="text-sm text-gray-600">{contractData.student.name}</div>
                      </div>
                      <div className="flex items-center">
                        {selectedContract.signatures.sublessor.signed ? (
                          <><CheckCircle size={16} className="text-green-600 mr-2" />Signed</>
                        ) : (
                          <><Clock size={16} className="text-yellow-600 mr-2" />Pending</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Sublessee</div>
                        <div className="text-sm text-gray-600">{selectedContract.sublessee.name}</div>
                      </div>
                      <div className="flex items-center">
                        {selectedContract.signatures.sublessee.signed ? (
                          <><CheckCircle size={16} className="text-green-600 mr-2" />Signed</>
                        ) : (
                          <><Clock size={16} className="text-yellow-600 mr-2" />Pending</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                    Download PDF
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700">
                    Send Reminder
                  </button>
                  <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Edit
                  </button>
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
  );
};

// Helper component for chevron right icon
const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default LeaseContractManager;