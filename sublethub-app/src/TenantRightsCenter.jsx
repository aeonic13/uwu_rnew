import React, { useState, useEffect } from 'react';
import { Book, Shield, AlertTriangle, CheckCircle, Scale, Phone, MessageCircle, FileText, DollarSign, Home, Gavel, Info, ExternalLink, Search, Filter } from 'lucide-react';

// Comprehensive tenant rights database by state
const TENANT_RIGHTS_BY_STATE = {
  'CA': {
    name: 'California',
    basics: {
      securityDepositLimit: '2x monthly rent for unfurnished, 3x for furnished',
      securityDepositReturn: '21 days',
      noticeToVacate: '30 days for month-to-month',
      rentIncreaseLimits: '5% + inflation annually (AB 1482)',
      evictionProtections: 'Just cause eviction required after 12 months'
    },
    keyRights: [
      'Right to habitable housing (warranty of habitability)',
      'Right to privacy (24-hour notice for entry)',
      'Right to withhold rent for major repairs',
      'Protection against retaliatory eviction',
      'Right to organize tenant unions',
      'Protection against discrimination based on source of income'
    ],
    commonIssues: [
      {
        issue: 'Landlord enters without notice',
        yourRights: 'Landlord must give 24-hour written notice except for emergencies',
        action: 'Document violations, send written notice to landlord, contact local tenant organization'
      },
      {
        issue: 'Security deposit not returned',
        yourRights: 'Full deposit must be returned within 21 days, with itemized deductions if any',
        action: 'Send demand letter, file in small claims court for up to 2x deposit + court costs'
      },
      {
        issue: 'Rent increase seems too high',
        yourRights: 'Increases limited to 5% + local inflation rate (max 10%) annually',
        action: 'Check if property is exempt, verify proper 30-day notice was given'
      },
      {
        issue: 'Repair issues ignored',
        yourRights: 'Landlord must maintain habitability; you can withhold rent or repair and deduct',
        action: 'Written notice to landlord, wait reasonable time, then pursue legal remedies'
      }
    ],
    studentSpecific: [
      'Cannot discriminate against students or require higher deposits for students',
      'Student housing must meet same habitability standards as other rentals',
      'Landlords cannot require guarantors beyond reasonable creditworthiness requirements',
      'Academic calendar changes may justify lease modifications'
    ],
    resources: [
      { name: 'California Department of Consumer Affairs', url: 'https://www.dca.ca.gov/publications/landlordbook/', phone: '1-800-952-5210' },
      { name: 'Tenants Together (Statewide)', url: 'https://tenantstogether.org/', phone: '(415) 495-8100' },
      { name: 'Los Angeles Tenants Union', url: 'https://latenantsunion.org/', phone: '(213) 387-8829' },
      { name: 'San Francisco Tenants Union', url: 'https://sftu.org/', phone: '(415) 282-6622' }
    ]
  },
  'NY': {
    name: 'New York',
    basics: {
      securityDepositLimit: '1x monthly rent',
      securityDepositReturn: '14 days (reasonable time)',
      noticeToVacate: '30 days for month-to-month',
      rentIncreaseLimits: 'Rent stabilized apartments have regulated increases',
      evictionProtections: 'Good cause eviction law in some municipalities'
    },
    keyRights: [
      'Right to heat and hot water',
      'Right to peaceful enjoyment',
      'Protection against illegal rent increases',
      'Right to essential services (water, electricity)',
      'Protection against harassment',
      'Right to proper notice before eviction'
    ],
    commonIssues: [
      {
        issue: 'No heat or hot water',
        yourRights: 'Landlord must provide heat (68°F day, 62°F night) and hot water',
        action: 'Contact NYC 311, document temperature readings, may withhold rent'
      },
      {
        issue: 'Illegal rent increase',
        yourRights: 'Rent stabilized apartments have legal increase limits set annually',
        action: 'Check DHCR records for apartment status, file complaint if stabilized'
      },
      {
        issue: 'Landlord harassment',
        yourRights: 'Protected against intentional interruption of services or privacy violations',
        action: 'Document incidents, file complaint with HPD, contact tenant organizations'
      },
      {
        issue: 'Security deposit issues',
        yourRights: 'Cannot exceed 1 month rent, must be held in separate account',
        action: 'Demand return within reasonable time, sue in small claims court'
      }
    ],
    studentSpecific: [
      'Student tenants have same rights as all other tenants',
      'Cannot charge application fees over $20',
      'Guarantor requirements must be reasonable and applied equally',
      'Student housing near universities subject to same rent stabilization laws'
    ],
    resources: [
      { name: 'NYC Department of Housing (HPD)', url: 'https://www1.nyc.gov/site/hpd/', phone: '311' },
      { name: 'Met Council on Housing', url: 'https://www.metcouncilonhousing.org/', phone: '(212) 979-0611' },
      { name: 'Housing Rights Initiative', url: 'https://www.housingrightsny.org/', phone: '(212) 689-7962' },
      { name: 'Legal Aid Society', url: 'https://www.legalaidnyc.org/', phone: '(212) 577-3300' }
    ]
  },
  'TX': {
    name: 'Texas',
    basics: {
      securityDepositLimit: 'No state limit (varies by city)',
      securityDepositReturn: '30 days',
      noticeToVacate: '30 days for month-to-month',
      rentIncreaseLimits: 'No state-mandated limits',
      evictionProtections: 'Limited protections, quick eviction process'
    },
    keyRights: [
      'Right to peaceful enjoyment of property',
      'Right to timely repair of essential services',
      'Right to proper notice before entry',
      'Protection against discriminatory practices',
      'Right to receive security deposit back with itemization',
      'Right to terminate lease for military deployment'
    ],
    commonIssues: [
      {
        issue: 'Air conditioning not working',
        yourRights: 'In Texas heat, AC is often considered essential service',
        action: 'Written notice to landlord, document temperatures, may justify lease termination'
      },
      {
        issue: 'Security deposit kept unfairly',
        yourRights: 'Must receive deposit back within 30 days with itemized deductions',
        action: 'Send written demand, file in small claims court for up to 3x deposit amount'
      },
      {
        issue: 'Eviction notice received',
        yourRights: 'Must receive proper notice period and opportunity to cure lease violations',
        action: 'Review lease terms, seek legal aid, appear in court if sued'
      },
      {
        issue: 'Landlord won\'t make repairs',
        yourRights: 'Landlord must maintain property in reasonable repair',
        action: 'Written notice, allow reasonable time, may terminate lease for serious issues'
      }
    ],
    studentSpecific: [
      'No special provisions for student housing under state law',
      'Standard landlord-tenant law applies to all residential rentals',
      'Local ordinances near universities may provide additional protections',
      'Student status cannot be basis for discrimination in housing'
    ],
    resources: [
      { name: 'Texas Department of Housing', url: 'https://www.tdhca.state.tx.us/', phone: '(512) 475-3800' },
      { name: 'Texas Tenants\' Union', url: 'https://txtenants.org/', phone: '(713) 686-6693' },
      { name: 'Lone Star Legal Aid', url: 'https://lonestarlegal.org/', phone: '(713) 652-0077' },
      { name: 'Texas Law Help', url: 'https://texaslawhelp.org/', phone: 'N/A' }
    ]
  },
  'FL': {
    name: 'Florida',
    basics: {
      securityDepositLimit: 'No state limit',
      securityDepositReturn: '15-60 days depending on deductions',
      noticeToVacate: '15 days for month-to-month',
      rentIncreaseLimits: 'No state-mandated limits',
      evictionProtections: 'Limited protections, relatively quick process'
    },
    keyRights: [
      'Right to habitable dwelling',
      'Right to peaceful enjoyment',
      'Protection against retaliatory eviction',
      'Right to proper notice before termination',
      'Right to withhold rent for uninhabitable conditions',
      'Protection against discrimination'
    ],
    commonIssues: [
      {
        issue: 'Mold or water damage',
        yourRights: 'Landlord must address conditions affecting health and safety',
        action: 'Document with photos, written notice to landlord, may withhold rent'
      },
      {
        issue: 'Hurricane damage repairs',
        yourRights: 'Landlord must make reasonable efforts to restore habitability',
        action: 'Document damage, written notice, understand lease may be terminated'
      },
      {
        issue: 'Security deposit disputes',
        yourRights: 'Deposits must be returned within 15 days or notice of deductions within 30 days',
        action: 'Written demand, small claims court for damages plus court costs'
      },
      {
        issue: 'Rent increase without notice',
        yourRights: 'Month-to-month tenancies require 15 days notice for rent increases',
        action: 'Check lease terms for notice requirements, document improper notice'
      }
    ],
    studentSpecific: [
      'Standard landlord-tenant law applies to student housing',
      'No discrimination based on student status',
      'University housing may have additional regulations under education code',
      'Local ordinances near major universities may provide tenant protections'
    ],
    resources: [
      { name: 'Florida Department of Agriculture (Landlord-Tenant Law)', url: 'https://www.fdacs.gov/', phone: '(850) 488-2221' },
      { name: 'Florida Bar Association', url: 'https://www.floridabar.org/', phone: '(850) 561-5600' },
      { name: 'Legal Aid of Florida', url: 'https://www.legalaid.org/', phone: '(866) 550-2929' },
      { name: 'Community Legal Services', url: 'https://www.clsmf.org/', phone: '(305) 576-0080' }
    ]
  }
};

const TenantRightsCenter = ({ userState = 'CA', onBack }) => {
  const [selectedState, setSelectedState] = useState(userState);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);

  const stateData = TENANT_RIGHTS_BY_STATE[selectedState] || TENANT_RIGHTS_BY_STATE['CA'];

  const filteredRights = searchQuery 
    ? stateData.keyRights.filter(right => 
        right.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stateData.keyRights;

  const filteredIssues = searchQuery 
    ? stateData.commonIssues.filter(issue => 
        issue.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.yourRights.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stateData.commonIssues;

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tenant Rights Education Center</h2>
        <p className="text-gray-600">Know your rights and protect yourself as a student renter</p>
      </div>

      {/* State Selection */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Scale size={20} className="text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-800">Select Your State</h3>
          </div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CA">California</option>
            <option value="NY">New York</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
          </select>
          <p className="text-sm text-blue-600 mt-2">
            Currently viewing tenant rights for {stateData.name}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search rights, issues, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('rights')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'rights' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          Your Rights
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'issues' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          Common Issues
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          Help Resources
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Facts */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Info size={20} className="text-blue-600 mr-2" />
              {stateData.name} Tenant Basics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stateData.basics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-800 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <p className="text-sm text-gray-600">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student-Specific Rights */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Book size={20} className="text-purple-600 mr-2" />
              Student Housing Rights in {stateData.name}
            </h3>
            <ul className="space-y-3">
              {stateData.studentSpecific.map((right, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={16} className="text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-purple-800">{right}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center text-red-800">
              <AlertTriangle size={20} className="text-red-600 mr-2" />
              Emergency Housing Issues
            </h3>
            <p className="text-sm text-red-700 mb-3">
              If you're facing eviction, harassment, or unsafe conditions, get help immediately:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowResourceModal(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center"
              >
                <Phone size={16} className="mr-2" />
                Get Emergency Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your Rights Tab */}
      {activeTab === 'rights' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">
              Your Fundamental Rights as a Tenant
            </h3>
            <p className="text-sm text-green-700">
              These rights are protected by {stateData.name} law and cannot be waived by lease agreements.
            </p>
          </div>
          
          {filteredRights.map((right, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-800">{right}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Common Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {filteredIssues.map((issue, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setSelectedIssue(selectedIssue === index ? null : index)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <AlertTriangle size={20} className="text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-800">{issue.issue}</h3>
                  </div>
                  <div className={`transform transition-transform ${selectedIssue === index ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>
              
              {selectedIssue === index && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-4 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Your Rights:</h4>
                      <p className="text-sm text-blue-700">{issue.yourRights}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Action You Can Take:</h4>
                      <p className="text-sm text-green-700">{issue.action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              {stateData.name} Housing Resources
            </h3>
            <p className="text-sm text-blue-700">
              Free and low-cost legal assistance for housing issues
            </p>
          </div>

          {stateData.resources.map((resource, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{resource.name}</h3>
                  <div className="space-y-2">
                    {resource.phone !== 'N/A' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-2" />
                        <span>{resource.phone}</span>
                      </div>
                    )}
                    {resource.url && (
                      <div className="flex items-center text-sm text-blue-600">
                        <ExternalLink size={16} className="mr-2" />
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Additional Help */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <MessageCircle size={20} className="text-gray-600 mr-2" />
              Need More Help?
            </h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center">
                <MessageCircle size={16} className="mr-2" />
                Chat with SubletHub Legal Support
              </button>
              <p className="text-xs text-gray-500 text-center">
                Available for SubletHub users • Response within 24 hours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle size={24} className="text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-red-800">Emergency Housing Help</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h3 className="font-semibold text-red-800 mb-2">Immediate Danger</h3>
                  <p className="text-sm text-red-700 mb-2">
                    If you're in immediate physical danger, call 911 first.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Housing Emergency Contacts:</h3>
                  {stateData.resources.slice(0, 2).map((resource, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-gray-600">{resource.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowResourceModal(false)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                Close
              </button>
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

export default TenantRightsCenter;