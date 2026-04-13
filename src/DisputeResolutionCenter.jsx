import React, { useState } from 'react';
import { 
  Scale, Users, MessageSquare, Calendar, FileText, Clock, AlertTriangle,
  CheckCircle, XCircle, Phone, Video, Mail, User, Building, DollarSign,
  Camera, Upload, Download, Send, Shield, Gavel, Eye, Bell, Settings,
  Plus, Minus, ArrowRight, ArrowLeft, Filter, Search, Star, Award,
  ThumbsUp, ThumbsDown, Flag, Info, Zap, Target, Briefcase, Home
} from 'lucide-react';

const DisputeResolutionCenter = ({ user, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showNewDispute, setShowNewDispute] = useState(false);
  const [newDisputeForm, setNewDisputeForm] = useState({
    type: '',
    description: '',
    propertyAddress: '',
    involvedParties: [],
    evidenceFiles: [],
    preferredResolution: '',
    urgency: 'medium'
  });

  // Mock data for dispute resolution system
  const [disputeData] = useState({
    user: {
      name: user?.name || 'Alex Johnson',
      email: user?.email || 'alex@usc.edu',
      userType: user?.userType || 'student',
      activeCases: 2,
      resolvedCases: 1,
      rating: 4.8
    },
    cases: [
      {
        id: 'case-001',
        caseNumber: 'DRC-2024-001',
        status: 'mediation_scheduled',
        priority: 'high',
        type: 'Security Deposit',
        title: 'Security Deposit Return Dispute',
        description: 'Landlord is withholding security deposit claiming excessive damages that were pre-existing.',
        createdDate: '2024-03-20',
        lastActivity: '2024-03-25',
        estimatedResolution: '2024-04-05',
        parties: {
          complainant: {
            name: 'Alex Johnson',
            role: 'Tenant',
            email: 'alex@usc.edu',
            phone: '(555) 234-5678'
          },
          respondent: {
            name: 'Robert Chen',
            role: 'Landlord',
            email: 'rchen@propertymanagement.com',
            phone: '(555) 987-6543'
          }
        },
        property: {
          address: '123 University Ave, Unit 3A',
          leaseStart: '2023-09-01',
          leaseEnd: '2024-05-31',
          monthlyRent: 2400,
          securityDeposit: 2400
        },
        dispute: {
          amount: 2400,
          claimedDamages: [
            { item: 'Carpet stains', cost: 800, status: 'disputed' },
            { item: 'Wall holes', cost: 300, status: 'disputed' },
            { item: 'Cleaning fee', cost: 200, status: 'accepted' },
            { item: 'Broken window', cost: 400, status: 'disputed' },
            { item: 'Missing keys', cost: 50, status: 'accepted' }
          ],
          evidence: [
            { type: 'photo', name: 'Move-in photos', uploadDate: '2024-03-20', status: 'verified' },
            { type: 'document', name: 'Move-in inspection report', uploadDate: '2024-03-20', status: 'verified' },
            { type: 'photo', name: 'Current condition photos', uploadDate: '2024-03-21', status: 'pending' }
          ]
        },
        mediator: {
          name: 'Dr. Sarah Martinez',
          credentials: 'Certified Housing Mediator',
          rating: 4.9,
          experience: '8 years',
          specialties: ['Security Deposits', 'Property Damage', 'Lease Disputes']
        },
        mediation: {
          scheduledDate: '2024-03-28',
          scheduledTime: '2:00 PM',
          location: 'Virtual Meeting',
          duration: '90 minutes',
          preparationItems: [
            'Gather all photographic evidence',
            'Review lease agreement terms',
            'Prepare list of pre-existing conditions',
            'Collect receipts for any repairs made'
          ]
        },
        timeline: [
          { date: '2024-03-20', event: 'Dispute filed', actor: 'Alex Johnson' },
          { date: '2024-03-21', event: 'Case assigned to mediator', actor: 'System' },
          { date: '2024-03-22', event: 'Initial response filed', actor: 'Robert Chen' },
          { date: '2024-03-25', event: 'Mediation scheduled', actor: 'Dr. Sarah Martinez' }
        ],
        messages: [
          {
            id: 'msg-001',
            sender: 'Dr. Sarah Martinez',
            role: 'Mediator',
            timestamp: '2024-03-25 10:30 AM',
            message: 'I have reviewed both sides of the case. Please ensure all evidence is uploaded before our session on Thursday.',
            type: 'system'
          },
          {
            id: 'msg-002',
            sender: 'Alex Johnson',
            role: 'Complainant',
            timestamp: '2024-03-25 2:15 PM',
            message: 'I have uploaded the move-in inspection report and photos. The carpet stains were clearly documented as existing before I moved in.',
            type: 'party'
          }
        ]
      },
      {
        id: 'case-002',
        caseNumber: 'DRC-2024-002',
        status: 'under_review',
        priority: 'medium',
        type: 'Noise Complaint',
        title: 'Ongoing Noise Disturbances',
        description: 'Roommate consistently plays loud music late at night despite multiple requests to stop.',
        createdDate: '2024-03-22',
        lastActivity: '2024-03-24',
        estimatedResolution: '2024-04-10',
        parties: {
          complainant: {
            name: 'Alex Johnson',
            role: 'Tenant',
            email: 'alex@usc.edu'
          },
          respondent: {
            name: 'Mike Thompson',
            role: 'Roommate',
            email: 'mthompson@usc.edu'
          }
        },
        property: {
          address: '123 University Ave, Unit 3A',
          leaseType: 'Shared Housing'
        },
        dispute: {
          incidents: 15,
          timeframe: '2 months',
          quietHoursViolations: 12
        },
        timeline: [
          { date: '2024-03-22', event: 'Dispute filed', actor: 'Alex Johnson' },
          { date: '2024-03-24', event: 'Case under review', actor: 'System' }
        ],
        messages: []
      }
    ],
    resolvedCases: [
      {
        id: 'case-003',
        caseNumber: 'DRC-2024-003',
        status: 'resolved',
        type: 'Lease Violation',
        title: 'Unauthorized Pet Policy Violation',
        resolution: 'Mediated Agreement',
        resolutionDate: '2024-03-15',
        outcome: 'Tenant allowed to keep pet with additional deposit',
        satisfaction: {
          complainant: 5,
          respondent: 4,
          overall: 4.5
        }
      }
    ],
    mediators: [
      {
        id: 'med-001',
        name: 'Dr. Sarah Martinez',
        credentials: 'Certified Housing Mediator, J.D.',
        rating: 4.9,
        experience: '8 years',
        casesResolved: 247,
        specialties: ['Security Deposits', 'Property Damage', 'Lease Disputes'],
        languages: ['English', 'Spanish'],
        availability: 'Available',
        bio: 'Dr. Martinez specializes in residential housing disputes with a focus on student housing. She has successfully mediated over 200 cases with a 95% satisfaction rate.'
      },
      {
        id: 'med-002',
        name: 'James Wilson',
        credentials: 'Certified Mediator, MBA',
        rating: 4.7,
        experience: '5 years',
        casesResolved: 156,
        specialties: ['Roommate Disputes', 'Noise Complaints', 'Rentalting Issues'],
        languages: ['English'],
        availability: 'Busy until April 1st',
        bio: 'James focuses on interpersonal disputes and has extensive experience in student housing conflicts.'
      }
    ],
    statistics: {
      totalCases: 1247,
      resolvedCases: 1089,
      resolutionRate: 87.3,
      averageResolutionTime: '12.5 days',
      mediationSuccessRate: 94.2,
      userSatisfaction: 4.6
    },
    disputeTypes: [
      { type: 'Security Deposit', count: 342, percentage: 27.4 },
      { type: 'Property Damage', count: 198, percentage: 15.9 },
      { type: 'Noise Complaints', count: 156, percentage: 12.5 },
      { type: 'Lease Violations', count: 134, percentage: 10.7 },
      { type: 'Roommate Issues', count: 112, percentage: 9.0 },
      { type: 'Maintenance Issues', count: 89, percentage: 7.1 },
      { type: 'Other', count: 216, percentage: 17.3 }
    ]
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'mediation_scheduled': return 'bg-brand-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'in_mediation': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'appealed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getDisputeTypeIcon = (type) => {
    switch (type) {
      case 'Security Deposit': return <Shield size={20} className="text-green-600" />;
      case 'Property Damage': return <Home size={20} className="text-orange-600" />;
      case 'Noise Complaint': return <Bell size={20} className="text-red-600" />;
      case 'Lease Violation': return <FileText size={20} className="text-purple-600" />;
      case 'Roommate Issues': return <Users size={20} className="text-brand-500" />;
      case 'Maintenance Issues': return <Settings size={20} className="text-yellow-600" />;
      default: return <Scale size={20} className="text-gray-600" />;
    }
  };

  const handleNewDispute = () => {
    console.log('Creating new dispute:', newDisputeForm);
    
    // Reset form
    setNewDisputeForm({
      type: '',
      description: '',
      propertyAddress: '',
      involvedParties: [],
      evidenceFiles: [],
      preferredResolution: '',
      urgency: 'medium'
    });
    
    setShowNewDispute(false);
    alert('Dispute case created successfully! You will receive a case number and be contacted by a mediator within 24 hours.');
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Dispute Resolution Center</h2>
        <div className="flex items-center text-gray-600">
          <Scale size={16} className="mr-2" />
          <span>Professional mediation and conflict resolution services</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {['overview', 'my-cases', 'mediators', 'resources', 'statistics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-white text-brand-500 shadow-sm' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Your Dispute Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-500">{disputeData.user.activeCases}</div>
                <div className="text-sm text-gray-600">Active Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{disputeData.user.resolvedCases}</div>
                <div className="text-sm text-gray-600">Resolved Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{disputeData.user.rating}</div>
                <div className="text-sm text-gray-600">User Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{disputeData.statistics.averageResolutionTime}</div>
                <div className="text-sm text-gray-600">Avg Resolution</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setShowNewDispute(true)}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Plus size={20} className="text-brand-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">File New Dispute</p>
                    <p className="text-sm text-gray-600">Start a new dispute resolution case</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('my-cases')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={20} className="text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View My Cases</p>
                    <p className="text-sm text-gray-600">{disputeData.user.activeCases} active, {disputeData.user.resolvedCases} resolved</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('mediators')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Users size={20} className="text-purple-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Find Mediators</p>
                    <p className="text-sm text-gray-600">Browse certified mediators and specialists</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Info size={20} className="text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Resolution Resources</p>
                    <p className="text-sm text-gray-600">Legal guides and dispute prevention tips</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Active Cases Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Your Active Cases</h3>
              <button
                onClick={() => setActiveTab('my-cases')}
                className="text-brand-500 hover:text-brand-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            {disputeData.cases.filter(c => c.status !== 'resolved').map((case_) => (
              <div key={case_.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getDisputeTypeIcon(case_.type)}
                    <div className="ml-3">
                      <h4 className="font-medium">{case_.title}</h4>
                      <p className="text-sm text-gray-600">Case #{case_.caseNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(case_.status)}`}>
                    {case_.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="text-gray-600">Property:</span>
                    <span className="ml-2 font-medium">{case_.property.address}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Action:</span>
                    <span className="ml-2 font-medium">
                      {case_.status === 'mediation_scheduled' ? 'Attend Mediation' : 'Await Review'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Service Information */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Shield size={20} className="mr-2" />
              Professional Mediation Services
            </h3>
            <div className="text-sm text-brand-600 space-y-2">
              <p>• <strong>Free Service:</strong> All mediation services are provided at no cost to students and renters</p>
              <p>• <strong>Certified Mediators:</strong> All mediators are licensed and specialized in housing disputes</p>
              <p>• <strong>Quick Resolution:</strong> Average resolution time is {disputeData.statistics.averageResolutionTime}</p>
              <p>• <strong>High Success Rate:</strong> {disputeData.statistics.mediationSuccessRate}% of cases reach satisfactory resolution</p>
            </div>
          </div>
        </div>
      )}

      {/* My Cases Tab */}
      {activeTab === 'my-cases' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">My Dispute Cases</h3>
            <button
              onClick={() => setShowNewDispute(true)}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              New Case
            </button>
          </div>

          {/* Active Cases */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Active Cases</h4>
            {disputeData.cases.filter(c => c.status !== 'resolved').map((case_) => (
              <div key={case_.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getDisputeTypeIcon(case_.type)}
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h4 className="font-semibold mr-2">{case_.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium ${getPriorityColor(case_.priority)}`}>
                          {case_.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Case #{case_.caseNumber}</p>
                      <p className="text-xs text-gray-500">Filed {new Date(case_.createdDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(case_.status)}`}>
                    {case_.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{case_.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Property:</span>
                    <span className="ml-2 font-medium">{case_.property.address}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Resolution:</span>
                    <span className="ml-2 font-medium">{new Date(case_.estimatedResolution).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Opposing Party:</span>
                    <span className="ml-2 font-medium">{case_.parties.respondent.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="ml-2 font-medium">{new Date(case_.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>

                {case_.mediator && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <div className="flex items-center">
                      <User size={16} className="text-brand-500 mr-2" />
                      <div>
                        <div className="font-medium">{case_.mediator.name}</div>
                        <div className="text-xs text-gray-600">{case_.mediator.credentials}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedCase(case_)}
                    className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <MessageSquare size={16} />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Calendar size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resolved Cases */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Resolved Cases</h4>
            {disputeData.resolvedCases.map((case_) => (
              <div key={case_.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{case_.title}</h4>
                    <p className="text-sm text-gray-600">Case #{case_.caseNumber}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(case_.status)}`}>
                    Resolved
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Resolution:</span>
                    <span className="ml-2 font-medium">{case_.resolution}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Resolved:</span>
                    <span className="ml-2 font-medium">{new Date(case_.resolutionDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Outcome:</span>
                    <span className="ml-2 font-medium">{case_.outcome}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Satisfaction:</span>
                    <div className="flex items-center ml-2">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="font-medium ml-1">{case_.satisfaction.overall}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mediators Tab */}
      {activeTab === 'mediators' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Certified Mediators</h3>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={16} />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Search size={16} />
              </button>
            </div>
          </div>

          {disputeData.mediators.map((mediator) => (
            <div key={mediator.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mr-4">
                    <User size={24} className="text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{mediator.name}</h4>
                    <p className="text-sm text-gray-600">{mediator.credentials}</p>
                    <div className="flex items-center mt-1">
                      <Star size={14} className="text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium mr-2">{mediator.rating}</span>
                      <span className="text-xs text-gray-500">({mediator.casesResolved} cases resolved)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    mediator.availability === 'Available' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {mediator.availability}
                  </div>
                  <div className="text-xs text-gray-500">{mediator.experience} experience</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Specialties</div>
                <div className="flex flex-wrap gap-2">
                  {mediator.specialties.map((specialty, index) => (
                    <span key={index} className="text-xs bg-brand-100 text-brand-500 px-2 py-1 rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{mediator.bio}</p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Languages:</span>
                  <span className="ml-2 font-medium">{mediator.languages.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cases Resolved:</span>
                  <span className="ml-2 font-medium">{mediator.casesResolved}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg font-medium hover:bg-brand-600">
                  Request Mediator
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Dispute Resolution Resources</h3>

          {/* Resolution Process */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <Target size={20} className="text-brand-500 mr-2" />
              How Mediation Works
            </h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-500">1</span>
                </div>
                <div>
                  <h5 className="font-medium">File Your Case</h5>
                  <p className="text-sm text-gray-600">Submit your dispute with details, evidence, and preferred resolution</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-500">2</span>
                </div>
                <div>
                  <h5 className="font-medium">Mediator Assignment</h5>
                  <p className="text-sm text-gray-600">A certified mediator specializing in your type of dispute is assigned</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-brand-500">3</span>
                </div>
                <div>
                  <h5 className="font-medium">Mediation Session</h5>
                  <p className="text-sm text-gray-600">Virtual or in-person session with all parties and the mediator</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600">4</span>
                </div>
                <div>
                  <h5 className="font-medium">Resolution</h5>
                  <p className="text-sm text-gray-600">Binding agreement reached and case closed with satisfaction tracking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Common Dispute Types */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Common Dispute Types</h4>
            <div className="grid grid-cols-1 gap-4">
              {disputeData.disputeTypes.slice(0, 6).map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getDisputeTypeIcon(type.type)}
                    <div className="ml-3">
                      <div className="font-medium">{type.type}</div>
                      <div className="text-sm text-gray-600">{type.count} cases handled</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600">{type.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention Tips */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-800 mb-4 flex items-center">
              <Shield size={20} className="mr-2" />
              Dispute Prevention Tips
            </h4>
            <div className="space-y-2 text-sm text-green-700">
              <p>• <strong>Document Everything:</strong> Keep records of all communications, payments, and property conditions</p>
              <p>• <strong>Communicate Clearly:</strong> Address concerns promptly and in writing</p>
              <p>• <strong>Know Your Rights:</strong> Understand local tenant laws and lease terms</p>
              <p>• <strong>Take Photos:</strong> Document property condition at move-in and move-out</p>
              <p>• <strong>Keep Receipts:</strong> Save all payment confirmations and repair receipts</p>
              <p>• <strong>Regular Check-ins:</strong> Maintain good relationships with landlords and roommates</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Resolution Statistics</h3>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{disputeData.statistics.resolutionRate}%</div>
              <div className="text-sm text-gray-600">Resolution Rate</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-brand-500">{disputeData.statistics.averageResolutionTime}</div>
              <div className="text-sm text-gray-600">Avg Resolution Time</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">{disputeData.statistics.mediationSuccessRate}%</div>
              <div className="text-sm text-gray-600">Mediation Success</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{disputeData.statistics.userSatisfaction}</div>
              <div className="text-sm text-gray-600">User Satisfaction</div>
            </div>
          </div>

          {/* Dispute Types Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Dispute Types Distribution</h4>
            <div className="space-y-3">
              {disputeData.disputeTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getDisputeTypeIcon(type.type)}
                    <span className="ml-3 text-sm font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-brand-500 h-2 rounded-full"
                        style={{ width: `${type.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{type.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Dispute Modal */}
      {showNewDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">File New Dispute</h2>
                <button onClick={() => setShowNewDispute(false)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dispute Type</label>
                  <select
                    value={newDisputeForm.type}
                    onChange={(e) => setNewDisputeForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select dispute type</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Noise Complaint">Noise Complaint</option>
                    <option value="Lease Violation">Lease Violation</option>
                    <option value="Roommate Issues">Roommate Issues</option>
                    <option value="Maintenance Issues">Maintenance Issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Property Address</label>
                  <input
                    type="text"
                    value={newDisputeForm.propertyAddress}
                    onChange={(e) => setNewDisputeForm(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    placeholder="Enter the property address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newDisputeForm.description}
                    onChange={(e) => setNewDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed description of the dispute..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Urgency Level</label>
                  <select
                    value={newDisputeForm.urgency}
                    onChange={(e) => setNewDisputeForm(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="low">Low - Can wait 1-2 weeks</option>
                    <option value="medium">Medium - Need resolution within a week</option>
                    <option value="high">High - Urgent, need immediate attention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Resolution</label>
                  <textarea
                    value={newDisputeForm.preferredResolution}
                    onChange={(e) => setNewDisputeForm(prev => ({ ...prev, preferredResolution: e.target.value }))}
                    placeholder="What outcome would you like to see? (optional)"
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Evidence Upload Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Evidence & Documentation</div>
                  <p className="text-xs text-gray-600 mb-3">Upload photos, documents, or other evidence to support your case</p>
                  <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-brand-300 transition-colors">
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewDispute(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewDispute}
                  disabled={!newDisputeForm.type || !newDisputeForm.description || !newDisputeForm.propertyAddress}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                    newDisputeForm.type && newDisputeForm.description && newDisputeForm.propertyAddress
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  File Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Case Details - {selectedCase.caseNumber}</h2>
                <button onClick={() => setSelectedCase(null)}>
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Case Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Case Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedCase.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCase.status)}`}>
                          {selectedCase.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`font-medium ${getPriorityColor(selectedCase.priority)}`}>
                          {selectedCase.priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filed:</span>
                        <span className="font-medium">{new Date(selectedCase.createdDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Resolution:</span>
                        <span className="font-medium">{new Date(selectedCase.estimatedResolution).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Property Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Address:</strong> {selectedCase.property.address}</div>
                      {selectedCase.property.monthlyRent && (
                        <div><strong>Monthly Rent:</strong> ${selectedCase.property.monthlyRent}</div>
                      )}
                      {selectedCase.property.securityDeposit && (
                        <div><strong>Security Deposit:</strong> ${selectedCase.property.securityDeposit}</div>
                      )}
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Involved Parties</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium">{selectedCase.parties.complainant.name}</div>
                        <div className="text-gray-600">{selectedCase.parties.complainant.role}</div>
                        <div className="text-xs text-gray-500">{selectedCase.parties.complainant.email}</div>
                      </div>
                      <div>
                        <div className="font-medium">{selectedCase.parties.respondent.name}</div>
                        <div className="text-gray-600">{selectedCase.parties.respondent.role}</div>
                        <div className="text-xs text-gray-500">{selectedCase.parties.respondent.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div className="space-y-4">
                  {/* Description */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Case Description</h3>
                    <p className="text-sm">{selectedCase.description}</p>
                  </div>

                  {/* Mediator */}
                  {selectedCase.mediator && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Assigned Mediator</h3>
                      <div className="flex items-center">
                        <User size={20} className="text-brand-500 mr-3" />
                        <div>
                          <div className="font-medium">{selectedCase.mediator.name}</div>
                          <div className="text-sm text-gray-600">{selectedCase.mediator.credentials}</div>
                          <div className="flex items-center mt-1">
                            <Star size={14} className="text-yellow-400 fill-current mr-1" />
                            <span className="text-sm">{selectedCase.mediator.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Case Timeline</h3>
                    <div className="space-y-3">
                      {selectedCase.timeline.map((event, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div className="text-sm">
                            <div className="font-medium">{event.event}</div>
                            <div className="text-gray-600">by {event.actor}</div>
                            <div className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Recent Messages</h3>
                    <div className="space-y-3">
                      {selectedCase.messages.map((message) => (
                        <div key={message.id} className="bg-white p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{message.sender}</div>
                            <div className="text-xs text-gray-500">{message.timestamp}</div>
                          </div>
                          <p className="text-sm text-gray-700">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button className="flex-1 bg-brand-500 text-white py-3 rounded-lg font-medium hover:bg-brand-600">
                  Send Message
                </button>
                <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700">
                  Upload Evidence
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Download Case
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

export default DisputeResolutionCenter;