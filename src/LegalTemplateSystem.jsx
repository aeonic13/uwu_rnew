import React, { useState, useEffect } from 'react';
import { FileText, Shield, AlertTriangle, CheckCircle, MapPin, Calendar, DollarSign, Users, Home, Scale, Book } from 'lucide-react';

// State-specific housing law database
const STATE_HOUSING_LAWS = {
  'CA': {
    name: 'California',
    rentalControlLaws: true,
    securityDepositLimit: '2x monthly rent',
    noticePeriod: 30,
    requiredDisclosures: [
      'Lead-based paint disclosure',
      'Mold disclosure',
      'Bed bug disclosure',
      'Shared utility arrangements',
      'Rent control ordinances'
    ],
    prohibitedClauses: [
      'Waiving tenant rights',
      'Charging more than 2x rent as security deposit',
      'Requiring advance rent beyond first month + security'
    ],
    mandatoryProtections: [
      'Right to quiet enjoyment',
      'Habitability warranty',
      'Retaliatory eviction protection',
      'Security deposit return within 21 days'
    ],
    specialProvisions: {
      collegeRentals: [
        'Must allow early termination for academic year changes',
        'Cannot discriminate based on student status',
        'Must provide written notice of rental increases 30 days in advance'
      ]
    }
  },
  'NY': {
    name: 'New York',
    rentalControlLaws: true,
    securityDepositLimit: '1x monthly rent',
    noticePeriod: 30,
    requiredDisclosures: [
      'Lead-based paint disclosure',
      'Window guard disclosure',
      'Rent stabilization status',
      'Bedbug infestation history'
    ],
    prohibitedClauses: [
      'Waiving warranty of habitability',
      'Charging application fees over $20',
      'Requiring security deposit over 1 month rent'
    ],
    mandatoryProtections: [
      'Right to heat and hot water',
      'Warranty of habitability',
      'Security deposit return within 14 days',
      'Right to request repairs'
    ],
    specialProvisions: {
      collegeRentals: [
        'Student tenants have same rights as other tenants',
        'Cannot require guarantors beyond normal credit requirements',
        'Must honor lease for full academic year'
      ]
    }
  },
  'TX': {
    name: 'Texas',
    rentalControlLaws: false,
    securityDepositLimit: 'No state limit',
    noticePeriod: 30,
    requiredDisclosures: [
      'Lead-based paint disclosure',
      'Smoking policy',
      'Previous flooding disclosure'
    ],
    prohibitedClauses: [
      'Waiving landlord liability for property damage',
      'Requiring tenant to pay attorney fees in all cases'
    ],
    mandatoryProtections: [
      'Right to peaceful enjoyment',
      'Security deposit return within 30 days',
      'Right to receive itemized list of deductions'
    ],
    specialProvisions: {
      collegeRentals: [
        'No special provisions for student housing',
        'Follow standard landlord-tenant law'
      ]
    }
  },
  'FL': {
    name: 'Florida',
    rentalControlLaws: false,
    securityDepositLimit: 'No state limit',
    noticePeriod: 15,
    requiredDisclosures: [
      'Lead-based paint disclosure',
      'Radon gas disclosure',
      'Fire sprinkler disclosure'
    ],
    prohibitedClauses: [
      'Waiving landlord duty to maintain premises',
      'Requiring tenant to pay attorney fees unless tenant breaches lease'
    ],
    mandatoryProtections: [
      'Right to habitable dwelling',
      'Security deposit return within 15-60 days',
      'Right to terminate for uninhabitable conditions'
    ],
    specialProvisions: {
      collegeRentals: [
        'Standard landlord-tenant law applies',
        'No discrimination based on student status'
      ]
    }
  }
};

// Lease template generator for different rental scenarios
const LEASE_TEMPLATES = {
  fullRental: {
    name: 'Full Property Rental Agreement',
    description: 'Direct lease between landlord and student for entire property',
    scenario: 'full-rental',
    parties: 'landlord-tenant',
    sections: [
      'parties',
      'property',
      'academicTerm',
      'rent',
      'deposit',
      'utilities',
      'maintenance',
      'studentRules',
      'parentGuarantor',
      'earlyTermination',
      'signatures'
    ]
  },
  lease: {
    name: 'Lease Agreement',
    description: 'Student-to-student rentalting with master lease connection',
    scenario: 'lease',
    parties: 'sublessor-sublessee',
    sections: [
      'parties',
      'property',
      'leaseTerm',
      'rent',
      'deposit',
      'utilities',
      'rules',
      'masterLease',
      'landlordConsent',
      'signatures'
    ]
  },
  leaseAddition: {
    name: 'Lease Addition Agreement',
    description: 'Add new tenant to existing lease with current roommates',
    scenario: 'lease-addition',
    parties: 'landlord-existing-new-tenant',
    sections: [
      'parties',
      'property',
      'existingLease',
      'newTenantTerms',
      'rentAllocation',
      'deposit',
      'utilities',
      'roommateRules',
      'jointLiability',
      'signatures'
    ]
  },
  roomRental: {
    name: 'Room Rental Agreement',
    description: 'Rent single room in shared house/apartment',
    scenario: 'room-rental',
    parties: 'landlord-tenant',
    sections: [
      'parties',
      'property',
      'roomSpecification',
      'sharedSpaces',
      'rent',
      'deposit',
      'utilities',
      'houseRules',
      'roommatePolicy',
      'signatures'
    ]
  }
};

const LegalTemplateSystem = ({ property, application, onGenerateAgreement, onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('lease');
  const [propertyState, setPropertyState] = useState(null);
  const [stateLaws, setStateLaws] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [generatedAgreement, setGeneratedAgreement] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Extract state from property address
    if (property?.location) {
      const state = extractStateFromAddress(property.location);
      setPropertyState(state);
      setStateLaws(STATE_HOUSING_LAWS[state] || STATE_HOUSING_LAWS['CA']); // Default to CA
    }
  }, [property]);

  const extractStateFromAddress = (address) => {
    // Simple state extraction - in production, use proper address parsing
    if (address.includes('CA') || address.includes('California')) return 'CA';
    if (address.includes('NY') || address.includes('New York')) return 'NY';
    if (address.includes('TX') || address.includes('Texas')) return 'TX';
    if (address.includes('FL') || address.includes('Florida')) return 'FL';
    return 'CA'; // Default
  };

  const generateStateCompliantAgreement = () => {
    const template = LEASE_TEMPLATES[selectedTemplate];
    const laws = stateLaws;
    
    // Base agreement structure
    const agreement = {
      id: `AGREEMENT-${Date.now()}`,
      state: propertyState,
      template: selectedTemplate,
      scenario: template.scenario,
      property: property,
      terms: {
        startDate: application?.applicationData?.startDate,
        endDate: application?.applicationData?.endDate,
        monthlyRent: property.price,
        securityDeposit: Math.min(property.price * 2, getMaxSecurityDeposit(laws)),
        utilities: customizations.utilities || 'Tenant responsible for electricity, gas. Water/sewer included.',
        petPolicy: customizations.petPolicy || 'No pets allowed',
        smokingPolicy: 'No smoking allowed on premises',
        occupancyLimit: customizations.occupancyLimit || '1 person'
      },
      stateCompliance: {
        requiredDisclosures: laws.requiredDisclosures,
        mandatoryProtections: laws.mandatoryProtections,
        specialProvisions: laws.specialProvisions.collegeRentals,
        noticePeriod: laws.noticePeriod
      },
      createdDate: new Date().toLocaleDateString(),
      status: 'draft'
    };

    // Scenario-specific party structure
    switch (template.scenario) {
      case 'full-rental':
        agreement.landlord = property.owner;
        agreement.tenant = {
          name: application?.tenant || 'Student Tenant',
          email: application?.tenantEmail || 'student@university.edu',
          isStudent: true
        };
        break;
        
      case 'lease':
        agreement.sublessor = property.owner; // The current tenant
        agreement.sublessee = {
          name: application?.tenant || 'Student Sublessee',
          email: application?.tenantEmail || 'student@university.edu',
          isStudent: true
        };
        agreement.masterLease = {
          landlordName: 'Property Management Company',
          leaseEndDate: '2024-08-31',
          consentRequired: true
        };
        break;
        
      case 'lease-addition':
        agreement.landlord = property.owner;
        agreement.existingTenants = [
          { name: 'Current Roommate 1', email: 'roommate1@university.edu' },
          { name: 'Current Roommate 2', email: 'roommate2@university.edu' }
        ];
        agreement.newTenant = {
          name: application?.tenant || 'New Student Tenant',
          email: application?.tenantEmail || 'student@university.edu',
          isStudent: true
        };
        agreement.terms.rentAllocation = 'Equal split among all tenants';
        break;
        
      case 'room-rental':
        agreement.landlord = property.owner;
        agreement.tenant = {
          name: application?.tenant || 'Student Tenant',
          email: application?.tenantEmail || 'student@university.edu',
          isStudent: true
        };
        agreement.roomDetails = {
          roomNumber: 'Room A',
          sharedSpaces: ['Kitchen', 'Living Room', '2 Bathrooms'],
          privateFacilities: ['Private bedroom', 'Desk', 'Closet']
        };
        break;
    }

    setGeneratedAgreement(agreement);
    setShowPreview(true);
  };

  const getMaxSecurityDeposit = (laws) => {
    if (laws.securityDepositLimit.includes('2x')) {
      return property.price * 2;
    } else if (laws.securityDepositLimit.includes('1x')) {
      return property.price;
    }
    return property.price * 2; // Default
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Legal Agreement Generator</h2>
        <p className="text-gray-600">Create state-compliant lease agreements with local housing law integration</p>
      </div>

      {/* State Information */}
      {stateLaws && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <MapPin size={20} className="text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-800">
              {stateLaws.name} Housing Law Compliance
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Security Deposit Limit:</span>
              <p className="text-blue-700">{stateLaws.securityDepositLimit}</p>
            </div>
            <div>
              <span className="font-medium">Notice Period:</span>
              <p className="text-blue-700">{stateLaws.noticePeriod} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Select Lease Template</h3>
        <div className="space-y-3">
          {Object.entries(LEASE_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                selectedTemplate === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedTemplate === key
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedTemplate === key && (
                    <CheckCircle size={16} className="text-white" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Required Disclosures */}
      {stateLaws && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <Shield size={20} className="text-green-600 mr-2" />
            Required Disclosures ({stateLaws.name})
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="space-y-2">
              {stateLaws.requiredDisclosures.map((disclosure, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckCircle size={16} className="text-green-600 mr-2" />
                  {disclosure}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Scenario-Specific Provisions */}
      {stateLaws && selectedTemplate && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <Users size={20} className="text-purple-600 mr-2" />
            {LEASE_TEMPLATES[selectedTemplate].scenario === 'lease' ? 'Rentalting Provisions' :
             LEASE_TEMPLATES[selectedTemplate].scenario === 'lease-addition' ? 'Roommate Addition Provisions' :
             LEASE_TEMPLATES[selectedTemplate].scenario === 'room-rental' ? 'Room Rental Provisions' :
             'Student Housing Provisions'}
          </h3>
          <div className="bg-purple-50 rounded-lg p-4">
            <ul className="space-y-2">
              {stateLaws.specialProvisions.collegeRentals.map((provision, index) => (
                <li key={index} className="flex items-start text-sm">
                  <Book size={16} className="text-purple-600 mr-2 mt-0.5" />
                  {provision}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Customization Options */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Agreement Customizations</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Utilities Arrangement</label>
            <textarea
              value={customizations.utilities || ''}
              onChange={(e) => setCustomizations(prev => ({ ...prev, utilities: e.target.value }))}
              placeholder="Specify which utilities are included/excluded..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pet Policy</label>
            <select
              value={customizations.petPolicy || 'no-pets'}
              onChange={(e) => setCustomizations(prev => ({ ...prev, petPolicy: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no-pets">No pets allowed</option>
              <option value="cats-only">Cats allowed with deposit</option>
              <option value="small-pets">Small pets allowed with deposit</option>
              <option value="all-pets">All pets allowed with deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Maximum Occupancy</label>
            <select
              value={customizations.occupancyLimit || '1'}
              onChange={(e) => setCustomizations(prev => ({ ...prev, occupancyLimit: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
            </select>
          </div>

          {/* Scenario-specific customizations */}
          {selectedTemplate === 'lease' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3">Rentalting Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Master Lease End Date</label>
                  <input
                    type="date"
                    value={customizations.masterLeaseEndDate || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, masterLeaseEndDate: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Landlord Consent Status</label>
                  <select
                    value={customizations.landlordConsent || 'required'}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, landlordConsent: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="required">Landlord consent required</option>
                    <option value="obtained">Landlord consent obtained</option>
                    <option value="not-required">No consent required per lease</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedTemplate === 'leaseAddition' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">Roommate Addition Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Existing Roommates</label>
                  <textarea
                    value={customizations.existingRoommates || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, existingRoommates: e.target.value }))}
                    placeholder="List current roommates (names and contact info)..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rent Split Method</label>
                  <select
                    value={customizations.rentSplit || 'equal'}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, rentSplit: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="equal">Equal split among all tenants</option>
                    <option value="by-room">Based on room size</option>
                    <option value="by-income">Based on income levels</option>
                    <option value="custom">Custom arrangement</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedTemplate === 'roomRental' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-3">Room Rental Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Specification</label>
                  <textarea
                    value={customizations.roomDescription || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, roomDescription: e.target.value }))}
                    placeholder="Describe the private room (size, furnishing, etc.)..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shared Common Areas</label>
                  <textarea
                    value={customizations.sharedAreas || ''}
                    onChange={(e) => setCustomizations(prev => ({ ...prev, sharedAreas: e.target.value }))}
                    placeholder="List shared spaces (kitchen, living room, bathrooms, etc.)..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Generate Agreement Button */}
      <div className="space-y-4">
        <button
          onClick={generateStateCompliantAgreement}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
        >
          <FileText size={20} className="mr-2" />
          Generate State-Compliant Agreement
        </button>

        <button
          onClick={onBack}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200"
        >
          Back
        </button>
      </div>

      {/* Agreement Preview Modal */}
      {showPreview && generatedAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Agreement Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-blue-800">
                    {LEASE_TEMPLATES[generatedAgreement.template].name}
                  </h3>
                  <p className="text-sm text-blue-600">
                    Compliant with {stateLaws.name} housing laws
                  </p>
                </div>

                {/* Agreement Summary */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Property:</span>
                      <p>{generatedAgreement.property.location}</p>
                    </div>
                    <div>
                      <span className="font-medium">Monthly Rent:</span>
                      <p>${generatedAgreement.terms.monthlyRent}</p>
                    </div>
                    <div>
                      <span className="font-medium">Security Deposit:</span>
                      <p>${generatedAgreement.terms.securityDeposit}</p>
                    </div>
                    <div>
                      <span className="font-medium">Lease Term:</span>
                      <p>{generatedAgreement.terms.startDate} - {generatedAgreement.terms.endDate}</p>
                    </div>
                  </div>
                </div>

                {/* State Compliance Features */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">State Compliance Features</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <ul className="space-y-1 text-sm">
                      {generatedAgreement.stateCompliance.mandatoryProtections.map((protection, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle size={14} className="text-green-600 mr-2" />
                          {protection}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Edit Agreement
                </button>
                <button
                  onClick={() => {
                    onGenerateAgreement(generatedAgreement);
                    setShowPreview(false);
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Use This Agreement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalTemplateSystem;