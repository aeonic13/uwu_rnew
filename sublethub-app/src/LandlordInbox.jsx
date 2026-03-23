import React, { useState } from 'react';
import { MessageCircle, User, Star, Shield, Calendar, DollarSign, FileText, Check, X, Clock, ChevronRight, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const LandlordInbox = ({ properties, onSelectApplicant, onSendMessage, onScheduleTour, onSendLease, onNavigateToApprovals, onNavigateToUtilities }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [viewMode, setViewMode] = useState('inbox'); // 'inbox', 'applicant-detail'

  // Mock applicant data with credit scores and details
  const mockApplications = [
    {
      id: 1,
      propertyId: 1,
      propertyTitle: "Cozy 1BR near USC Campus",
      applicant: {
        id: 'app1',
        name: 'Emily Rodriguez',
        email: 'emily.r@usc.edu',
        phone: '(555) 123-4567',
        university: 'USC',
        year: 'Senior',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
        creditScore: 742,
        creditTier: 'Excellent',
        verified: true,
        backgroundCheck: 'Passed'
      },
      application: {
        moveInDate: '2024-01-15',
        moveOutDate: '2024-06-15',
        monthlyIncome: 3500,
        employmentStatus: 'Part-time + Financial Aid',
        emergencyContact: 'Maria Rodriguez (Mother) - (555) 987-6543',
        references: ['Prof. Johnson - USC', 'Previous Landlord - John Smith'],
        message: 'Hi! I\'m a responsible senior at USC looking for a quiet place to study. I have excellent references and have never missed a rent payment.',
        appliedAt: '2024-12-20T10:30:00Z',
        documents: ['Student ID', 'Income Verification', 'References']
      },
      status: 'pending', // 'pending', 'approved', 'rejected'
      messages: 3,
      lastMessage: '2 hours ago'
    },
    {
      id: 2,
      propertyId: 1,
      propertyTitle: "Cozy 1BR near USC Campus",
      applicant: {
        id: 'app2',
        name: 'Michael Chen',
        email: 'mchen@ucla.edu',
        phone: '(555) 234-5678',
        university: 'UCLA',
        year: 'Graduate Student',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        creditScore: 678,
        creditTier: 'Good',
        verified: true,
        backgroundCheck: 'Passed'
      },
      application: {
        moveInDate: '2024-02-01',
        moveOutDate: '2024-08-01',
        monthlyIncome: 2800,
        employmentStatus: 'Graduate Research Assistant',
        emergencyContact: 'Lisa Chen (Sister) - (555) 876-5432',
        references: ['Dr. Kim - UCLA', 'Current Roommate - Alex Wong'],
        message: 'I\'m a quiet graduate student focusing on my research. Looking for a peaceful place close to campus with good study environment.',
        appliedAt: '2024-12-19T14:20:00Z',
        documents: ['Student ID', 'Research Assistant Contract', 'Bank Statements']
      },
      status: 'pending',
      messages: 1,
      lastMessage: '1 day ago'
    },
    {
      id: 3,
      propertyId: 2,
      propertyTitle: "Shared House - UCLA Area",
      applicant: {
        id: 'app3',
        name: 'Sarah Johnson',
        email: 'sarah.j@berkeley.edu',
        phone: '(555) 345-6789',
        university: 'UC Berkeley',
        year: 'Junior',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        creditScore: 695,
        creditTier: 'Good',
        verified: true,
        backgroundCheck: 'Passed'
      },
      application: {
        moveInDate: '2024-01-20',
        moveOutDate: '2024-05-20',
        monthlyIncome: 3200,
        employmentStatus: 'Student + Part-time job',
        emergencyContact: 'Robert Johnson (Father) - (555) 765-4321',
        references: ['Manager at Starbucks', 'Professor Williams'],
        message: 'Clean, responsible student looking for a place during my semester abroad program. Non-smoker, no parties.',
        appliedAt: '2024-12-18T16:45:00Z',
        documents: ['Student ID', 'Pay Stubs', 'Parent Guarantor Form']
      },
      status: 'approved',
      messages: 5,
      lastMessage: '30 minutes ago'
    }
  ];

  const getPropertyApplications = (propertyId) => {
    return mockApplications.filter(app => !propertyId || app.propertyId === propertyId);
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return 'text-green-600 bg-green-100';
    if (score >= 700) return 'text-blue-600 bg-blue-100';
    if (score >= 650) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleApproveApplication = (applicationId) => {
    // Update application status and trigger lease sending
    console.log('Approving application:', applicationId);
    onSendLease?.(applicationId);
  };

  const handleRejectApplication = (applicationId) => {
    console.log('Rejecting application:', applicationId);
  };

  // Inbox View
  if (viewMode === 'inbox') {
    const applications = getPropertyApplications(selectedProperty);

    return (
      <div className="p-4 pb-20">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Applicant Inbox</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => onNavigateToUtilities?.()}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Utility Manager"
              >
                <FileText size={20} className="text-gray-600" />
              </button>
              <button 
                onClick={() => onNavigateToApprovals?.()}
                className="p-2 hover:bg-gray-100 rounded-full relative"
                title="Student Approvals"
              >
                <Clock size={20} className="text-blue-600" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">2</span>
                </div>
              </button>
            </div>
          </div>
          <p className="text-gray-600">Review applications and manage your properties</p>
        </div>

        {/* Property Filter */}
        <div className="mb-6">
          <select
            value={selectedProperty || ''}
            onChange={(e) => setSelectedProperty(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Properties</option>
            <option value={1}>Cozy 1BR near USC Campus</option>
            <option value={2}>Shared House - UCLA Area</option>
            <option value={3}>Studio Apartment - NYU</option>
          </select>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h3>
            <p className="text-gray-500">Applications will appear here when people apply to your properties</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(application => (
              <div
                key={application.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedApplicant(application);
                  setViewMode('applicant-detail');
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <img
                      src={application.applicant.avatar}
                      alt={application.applicant.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold">{application.applicant.name}</h3>
                        {application.applicant.verified && (
                          <Shield size={16} className="ml-2 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{application.applicant.university} • {application.applicant.year}</p>
                      <p className="text-xs text-gray-500">{application.propertyTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(application.status)}`}>
                      {application.status.toUpperCase()}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MessageCircle size={12} className="mr-1" />
                      <span>{application.messages} messages</span>
                    </div>
                  </div>
                </div>

                {/* Credit Score & Key Info */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCreditScoreColor(application.applicant.creditScore)}`}>
                      <CreditCard size={12} className="mr-1" />
                      {application.applicant.creditScore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{application.applicant.creditTier}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">${application.application.monthlyIncome}</div>
                    <p className="text-xs text-gray-500">Monthly Income</p>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{application.application.documents.length}</div>
                    <p className="text-xs text-gray-500">Documents</p>
                  </div>
                </div>

                {/* Application Preview */}
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{application.application.message}</p>
                </div>

                {/* Move-in Details */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    <span>{new Date(application.application.moveInDate).toLocaleDateString()} - {new Date(application.application.moveOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span>Applied {application.lastMessage}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3">
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Applicant Detail View
  if (viewMode === 'applicant-detail' && selectedApplicant) {
    return (
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setViewMode('inbox')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h2 className="text-xl font-bold">Application Review</h2>
        </div>

        {/* Applicant Profile */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <img
              src={selectedApplicant.applicant.avatar}
              alt={selectedApplicant.applicant.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-xl font-bold">{selectedApplicant.applicant.name}</h3>
                {selectedApplicant.applicant.verified && (
                  <Shield size={20} className="ml-2 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600">{selectedApplicant.applicant.email}</p>
              <p className="text-gray-600">{selectedApplicant.applicant.phone}</p>
              <p className="text-sm text-blue-600">{selectedApplicant.applicant.university} • {selectedApplicant.applicant.year}</p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedApplicant.status)}`}>
                {selectedApplicant.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Credit Score & Financial Info */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Credit Score</span>
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{selectedApplicant.applicant.creditScore}</span>
                <span className="ml-2 text-sm text-gray-600">({selectedApplicant.applicant.creditTier})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    selectedApplicant.applicant.creditScore >= 750 ? 'bg-green-500' :
                    selectedApplicant.applicant.creditScore >= 700 ? 'bg-blue-500' :
                    selectedApplicant.applicant.creditScore >= 650 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(selectedApplicant.applicant.creditScore / 850) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Monthly Income</span>
                <DollarSign size={16} className="text-green-600" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">${selectedApplicant.application.monthlyIncome}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Income-to-rent ratio: {Math.round((selectedApplicant.application.monthlyIncome / 1200) * 100)}%
              </p>
            </div>
          </div>

          {/* Background Check */}
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Check size={16} className="text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Background Check: {selectedApplicant.applicant.backgroundCheck}</span>
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Application Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Move-in Date</label>
                <p className="font-medium">{new Date(selectedApplicant.application.moveInDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Move-out Date</label>
                <p className="font-medium">{new Date(selectedApplicant.application.moveOutDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Employment Status</label>
              <p className="font-medium">{selectedApplicant.application.employmentStatus}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Emergency Contact</label>
              <p className="font-medium">{selectedApplicant.application.emergencyContact}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">References</label>
              <ul className="space-y-1">
                {selectedApplicant.application.references.map((ref, index) => (
                  <li key={index} className="text-sm">• {ref}</li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Personal Message</label>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm">{selectedApplicant.application.message}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Documents Provided</label>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.application.documents.map((doc, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <FileText size={12} className="mr-1" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {selectedApplicant.status === 'pending' && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => onSendMessage(selectedApplicant)}
              className="flex items-center justify-center py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <MessageCircle size={20} className="mr-2" />
              Message
            </button>
            <button
              onClick={() => handleRejectApplication(selectedApplicant.id)}
              className="flex items-center justify-center py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
            >
              <X size={20} className="mr-2" />
              Decline
            </button>
            <button
              onClick={() => handleApproveApplication(selectedApplicant.id)}
              className="flex items-center justify-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check size={20} className="mr-2" />
              Approve
            </button>
          </div>
        )}

        {/* Schedule Tour */}
        <button
          onClick={() => onScheduleTour(selectedApplicant)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
        >
          <Calendar size={20} className="mr-2" />
          Schedule Property Tour
        </button>
      </div>
    );
  }
};

export default LandlordInbox;