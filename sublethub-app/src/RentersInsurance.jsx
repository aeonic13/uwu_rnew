import React, { useState } from 'react';
import { ArrowLeft, Shield, DollarSign, Check, AlertCircle, FileText, Download, CreditCard, Calendar, Phone, Mail, Building2, User, Home, Zap } from 'lucide-react';

const RentersInsuranceView = ({ user, lease, onBack, onPurchaseInsurance }) => {
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [currentInsurance, setCurrentInsurance] = useState(null);
  
  const [quoteData, setQuoteData] = useState({
    propertyValue: '',
    personalPropertyValue: '25000',
    liabilityCoverage: '100000',
    deductible: '500',
    hasSecuritySystem: false,
    hasSmokeDetectors: true,
    previousClaims: false,
    creditScore: 'good'
  });

  const [purchaseData, setPurchaseData] = useState({
    paymentFrequency: 'annual',
    autoRenew: true,
    emergencyContact: '',
    beneficiary: ''
  });

  // Mock insurance plans
  const insurancePlans = [
    {
      id: 'basic',
      name: 'Basic Coverage',
      provider: 'SubletHub Insurance Partner',
      monthlyPrice: 12,
      annualPrice: 120,
      coverage: {
        personalProperty: 15000,
        liability: 100000,
        medicalPayments: 1000,
        lossOfUse: 3000
      },
      features: [
        'Personal property protection',
        'Liability coverage',
        'Medical payments coverage',
        'Loss of use coverage',
        '24/7 claims support',
        'Online policy management'
      ],
      recommended: false
    },
    {
      id: 'standard',
      name: 'Standard Coverage',
      provider: 'SubletHub Insurance Partner',
      monthlyPrice: 18,
      annualPrice: 180,
      coverage: {
        personalProperty: 25000,
        liability: 300000,
        medicalPayments: 5000,
        lossOfUse: 6000
      },
      features: [
        'Enhanced personal property protection',
        'Increased liability coverage',
        'Higher medical payments coverage',
        'Extended loss of use coverage',
        '24/7 claims support',
        'Online policy management',
        'Identity theft protection',
        'Replacement cost coverage'
      ],
      recommended: true
    },
    {
      id: 'premium',
      name: 'Premium Coverage',
      provider: 'SubletHub Insurance Partner',
      monthlyPrice: 25,
      annualPrice: 250,
      coverage: {
        personalProperty: 50000,
        liability: 500000,
        medicalPayments: 10000,
        lossOfUse: 12000
      },
      features: [
        'Maximum personal property protection',
        'Highest liability coverage',
        'Comprehensive medical payments',
        'Extended loss of use coverage',
        '24/7 claims support',
        'Online policy management',
        'Identity theft protection',
        'Replacement cost coverage',
        'Valuable items coverage',
        'Water damage protection'
      ],
      recommended: false
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleGetQuote = () => {
    // Simulate quote generation
    const baseRate = selectedPlan.monthlyPrice;
    const adjustments = {
      creditScore: quoteData.creditScore === 'excellent' ? 0.9 : 
                   quoteData.creditScore === 'good' ? 1.0 : 1.1,
      securitySystem: quoteData.hasSecuritySystem ? 0.95 : 1.0,
      previousClaims: quoteData.previousClaims ? 1.15 : 1.0
    };
    
    const adjustedRate = baseRate * adjustments.creditScore * adjustments.securitySystem * adjustments.previousClaims;
    
    setSelectedPlan(prev => ({
      ...prev,
      customQuote: {
        monthlyPrice: Math.round(adjustedRate * 100) / 100,
        annualPrice: Math.round(adjustedRate * 12 * 100) / 100,
        discounts: [
          quoteData.hasSecuritySystem && { name: 'Security System', discount: '5%' },
          quoteData.creditScore === 'excellent' && { name: 'Excellent Credit', discount: '10%' },
          !quoteData.previousClaims && { name: 'Claims-Free', discount: '5%' }
        ].filter(Boolean)
      }
    }));
    
    setShowQuoteForm(false);
    setShowPurchaseForm(true);
  };

  const handlePurchase = () => {
    const finalPlan = {
      ...selectedPlan,
      policyNumber: `RIN-${Date.now()}`,
      effectiveDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      paymentFrequency: purchaseData.paymentFrequency,
      autoRenew: purchaseData.autoRenew,
      emergencyContact: purchaseData.emergencyContact,
      beneficiary: purchaseData.beneficiary
    };

    const paymentAmount = purchaseData.paymentFrequency === 'annual' 
      ? (selectedPlan.customQuote?.annualPrice || selectedPlan.annualPrice)
      : (selectedPlan.customQuote?.monthlyPrice || selectedPlan.monthlyPrice);

    onPurchaseInsurance({
      insuranceId: finalPlan.id,
      planName: finalPlan.name,
      provider: finalPlan.provider,
      amount: paymentAmount,
      description: `${finalPlan.name} - ${purchaseData.paymentFrequency} payment`,
      date: new Date().toISOString(),
      frequency: purchaseData.paymentFrequency
    });

    setCurrentInsurance(finalPlan);
    setShowPurchaseForm(false);
    setActiveTab('policy');
    
    alert('Renters insurance purchased successfully! Your policy is now active.');
  };

  const downloadDocument = (docName) => {
    console.log('Downloading document:', docName);
    alert(`Downloading ${docName}...`);
  };

  const contactInsurance = (method) => {
    if (method === 'phone') {
      alert('Calling (855) 555-RENT...');
    } else if (method === 'email') {
      alert('Opening email to support@sublethubinsurance.com...');
    }
  };

  const fileClaim = () => {
    alert('Starting claims process... You will be redirected to our claims portal.');
  };

  if (showQuoteForm) {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center mb-6">
          <button onClick={() => setShowQuoteForm(false)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Get Custom Quote</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">{selectedPlan.name}</h3>
            <p className="text-sm text-blue-700">
              Tell us more about your situation to get a personalized quote.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Personal Property Value</label>
              <select
                value={quoteData.personalPropertyValue}
                onChange={(e) => setQuoteData(prev => ({ ...prev, personalPropertyValue: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15000">$15,000</option>
                <option value="25000">$25,000</option>
                <option value="35000">$35,000</option>
                <option value="50000">$50,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deductible</label>
              <select
                value={quoteData.deductible}
                onChange={(e) => setQuoteData(prev => ({ ...prev, deductible: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="250">$250</option>
                <option value="500">$500</option>
                <option value="1000">$1,000</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Credit Score Range</label>
            <select
              value={quoteData.creditScore}
              onChange={(e) => setQuoteData(prev => ({ ...prev, creditScore: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="excellent">Excellent (750+)</option>
              <option value="good">Good (700-749)</option>
              <option value="fair">Fair (650-699)</option>
              <option value="poor">Poor (below 650)</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="security"
                checked={quoteData.hasSecuritySystem}
                onChange={(e) => setQuoteData(prev => ({ ...prev, hasSecuritySystem: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="security" className="text-sm">
                Property has security system (5% discount)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="claims"
                checked={quoteData.previousClaims}
                onChange={(e) => setQuoteData(prev => ({ ...prev, previousClaims: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="claims" className="text-sm">
                I have filed insurance claims in the past 3 years
              </label>
            </div>
          </div>

          <button
            onClick={handleGetQuote}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Get My Custom Quote
          </button>
        </div>
      </div>
    );
  }

  if (showPurchaseForm) {
    const quote = selectedPlan.customQuote || selectedPlan;
    
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center mb-6">
          <button onClick={() => setShowPurchaseForm(false)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Purchase Insurance</h2>
        </div>

        <div className="space-y-6">
          {/* Quote Summary */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Your Custom Quote</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Premium:</span>
                <span className="font-medium">${quote.monthlyPrice || selectedPlan.monthlyPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Premium:</span>
                <span className="font-medium">${quote.annualPrice || selectedPlan.annualPrice}</span>
              </div>
              {quote.discounts && quote.discounts.length > 0 && (
                <div className="pt-2 border-t border-green-300">
                  <p className="font-medium text-green-700 mb-1">Applied Discounts:</p>
                  {quote.discounts.map((discount, index) => (
                    <div key={index} className="flex justify-between text-green-600">
                      <span>• {discount.name}</span>
                      <span>{discount.discount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Options */}
          <div>
            <label className="block text-sm font-medium mb-3">Payment Frequency</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="frequency"
                  value="annual"
                  checked={purchaseData.paymentFrequency === 'annual'}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, paymentFrequency: e.target.value }))}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Annual Payment - ${quote.annualPrice || selectedPlan.annualPrice} 
                  <span className="text-green-600 ml-2">(Save 15%)</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="frequency"
                  value="monthly"
                  checked={purchaseData.paymentFrequency === 'monthly'}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, paymentFrequency: e.target.value }))}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Monthly Payment - ${quote.monthlyPrice || selectedPlan.monthlyPrice}/month
                </span>
              </label>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact</label>
            <input
              type="text"
              value={purchaseData.emergencyContact}
              onChange={(e) => setPurchaseData(prev => ({ ...prev, emergencyContact: e.target.value }))}
              placeholder="Name and phone number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beneficiary (Optional)</label>
            <input
              type="text"
              value={purchaseData.beneficiary}
              onChange={(e) => setPurchaseData(prev => ({ ...prev, beneficiary: e.target.value }))}
              placeholder="Full name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autorenew"
              checked={purchaseData.autoRenew}
              onChange={(e) => setPurchaseData(prev => ({ ...prev, autoRenew: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autorenew" className="text-sm">
              Enable automatic renewal to avoid coverage gaps
            </label>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Payment Summary</h4>
            <div className="text-sm text-yellow-700">
              <p>
                <strong>Due Today:</strong> $
                {purchaseData.paymentFrequency === 'annual' 
                  ? (quote.annualPrice || selectedPlan.annualPrice)
                  : (quote.monthlyPrice || selectedPlan.monthlyPrice)
                }
              </p>
              <p className="mt-1">
                Coverage begins immediately upon payment confirmation.
              </p>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={!purchaseData.emergencyContact}
            className={`w-full py-3 rounded-lg font-semibold ${
              purchaseData.emergencyContact
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Purchase Renters Insurance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Renters Insurance</h2>
      </div>

      {/* Status Banner */}
      {!currentInsurance && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
          <div className="flex items-center">
            <AlertCircle size={20} className="text-orange-600 mr-3" />
            <div>
              <h3 className="font-semibold text-orange-800">Insurance Required</h3>
              <p className="text-sm text-orange-700">
                Your lease requires renters insurance. Get covered today to protect your belongings.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentInsurance && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield size={20} className="text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-green-800">Insurance Active</h3>
                <p className="text-sm text-green-700">Policy #{currentInsurance.policyNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-800">{currentInsurance.name}</p>
              <p className="text-sm text-green-600">
                ${currentInsurance.paymentFrequency === 'annual' ? 
                  (currentInsurance.customQuote?.annualPrice || currentInsurance.annualPrice) :
                  (currentInsurance.customQuote?.monthlyPrice || currentInsurance.monthlyPrice)
                }/{currentInsurance.paymentFrequency === 'annual' ? 'year' : 'month'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        {(currentInsurance ? ['policy', 'claims', 'documents'] : ['plans', 'why-insurance']).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-1 text-sm font-medium capitalize border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && !currentInsurance && (
        <div className="space-y-6">
          {insurancePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-6 ${
                plan.recommended 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.recommended && (
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium inline-block mb-3">
                  Recommended for Students
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-gray-600">{plan.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">${plan.monthlyPrice}/mo</p>
                  <p className="text-sm text-gray-600">${plan.annualPrice}/year (save 15%)</p>
                </div>
              </div>

              {/* Coverage Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="font-medium">Personal Property</p>
                  <p className="text-gray-600">{formatCurrency(plan.coverage.personalProperty)}</p>
                </div>
                <div>
                  <p className="font-medium">Liability</p>
                  <p className="text-gray-600">{formatCurrency(plan.coverage.liability)}</p>
                </div>
                <div>
                  <p className="font-medium">Medical Payments</p>
                  <p className="text-gray-600">{formatCurrency(plan.coverage.medicalPayments)}</p>
                </div>
                <div>
                  <p className="font-medium">Loss of Use</p>
                  <p className="text-gray-600">{formatCurrency(plan.coverage.lossOfUse)}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <p className="font-medium mb-2">What's Included:</p>
                <div className="grid grid-cols-1 gap-1">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check size={16} className="text-green-600 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowQuoteForm(true);
                }}
                className={`w-full py-3 rounded-lg font-semibold ${
                  plan.recommended
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Get Quote & Purchase
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Why Insurance Tab */}
      {activeTab === 'why-insurance' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Why Do I Need Renters Insurance?</h3>
            <div className="space-y-4 text-blue-700">
              <div className="flex items-start">
                <Shield size={20} className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Protect Your Belongings</p>
                  <p className="text-sm">Your landlord's insurance doesn't cover your personal property. Electronics, clothes, furniture - it all adds up quickly.</p>
                </div>
              </div>
              <div className="flex items-start">
                <DollarSign size={20} className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Liability Protection</p>
                  <p className="text-sm">If someone gets injured in your apartment or you accidentally damage the property, liability coverage protects you.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Home size={20} className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Temporary Living Expenses</p>
                  <p className="text-sm">If your apartment becomes unlivable due to a covered loss, we'll help pay for temporary housing.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Common Scenarios We Cover</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <Zap size={16} className="text-yellow-600 mr-3" />
                <span>Fire or electrical damage destroys your laptop and textbooks</span>
              </div>
              <div className="flex items-center">
                <Building2 size={16} className="text-blue-600 mr-3" />
                <span>Pipe bursts and damages your furniture and clothing</span>
              </div>
              <div className="flex items-center">
                <User size={16} className="text-green-600 mr-3" />
                <span>Friend gets injured while visiting your apartment</span>
              </div>
              <div className="flex items-center">
                <AlertCircle size={16} className="text-red-600 mr-3" />
                <span>Theft of your bike, phone, or other valuables</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Student-Friendly Benefits</h3>
            <div className="space-y-2 text-green-700 text-sm">
              <p>• <strong>Worldwide Coverage:</strong> Your belongings are covered even when traveling</p>
              <p>• <strong>Dorm to Apartment:</strong> Easy to transfer coverage when you move</p>
              <p>• <strong>Affordable Rates:</strong> Plans starting at just $12/month</p>
              <p>• <strong>No Lease Required:</strong> Month-to-month options available</p>
              <p>• <strong>Digital Everything:</strong> Manage your policy entirely through the app</p>
            </div>
          </div>
        </div>
      )}

      {/* Policy Tab */}
      {activeTab === 'policy' && currentInsurance && (
        <div className="space-y-6">
          {/* Policy Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{currentInsurance.name}</h3>
                <p className="text-gray-600">Policy #{currentInsurance.policyNumber}</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Effective Date</p>
                <p className="font-medium">{new Date(currentInsurance.effectiveDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Expiration Date</p>
                <p className="font-medium">{new Date(currentInsurance.expirationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Premium</p>
                <p className="font-medium">
                  ${currentInsurance.paymentFrequency === 'annual' ? 
                    (currentInsurance.customQuote?.annualPrice || currentInsurance.annualPrice) :
                    (currentInsurance.customQuote?.monthlyPrice || currentInsurance.monthlyPrice)
                  }
                  /{currentInsurance.paymentFrequency === 'annual' ? 'year' : 'month'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Auto-Renewal</p>
                <p className="font-medium">{currentInsurance.autoRenew ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>

          {/* Coverage Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Coverage Limits</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Personal Property</span>
                <span className="font-medium">{formatCurrency(currentInsurance.coverage.personalProperty)}</span>
              </div>
              <div className="flex justify-between">
                <span>Liability</span>
                <span className="font-medium">{formatCurrency(currentInsurance.coverage.liability)}</span>
              </div>
              <div className="flex justify-between">
                <span>Medical Payments</span>
                <span className="font-medium">{formatCurrency(currentInsurance.coverage.medicalPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span>Loss of Use</span>
                <span className="font-medium">{formatCurrency(currentInsurance.coverage.lossOfUse)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Need Help?</h4>
            <div className="flex space-x-4">
              <button
                onClick={() => contactInsurance('phone')}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Phone size={16} className="mr-2" />
                Call Support
              </button>
              <button
                onClick={() => contactInsurance('email')}
                className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Mail size={16} className="mr-2" />
                Email Support
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && currentInsurance && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">File a Claim</h3>
            <p className="text-sm text-blue-700 mb-4">
              Need to file a claim? We're here to help you through the process 24/7.
            </p>
            <button
              onClick={fileClaim}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Start Claim Process
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Recent Claims</h4>
            <div className="text-center py-8 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No claims filed yet</p>
              <p className="text-sm">When you file a claim, you'll see the status here.</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Claims Process</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Report the Incident</p>
                  <p className="text-gray-600">File your claim online or call our 24/7 hotline</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Investigation</p>
                  <p className="text-gray-600">We'll assign a claims adjuster to review your case</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Settlement</p>
                  <p className="text-gray-600">Once approved, we'll process payment quickly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && currentInsurance && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText size={20} className="text-blue-600 mr-3" />
                <div>
                  <p className="font-medium">Insurance Policy</p>
                  <p className="text-sm text-gray-600">PDF • Policy #{currentInsurance.policyNumber}</p>
                </div>
              </div>
              <button
                onClick={() => downloadDocument('Insurance Policy')}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Download size={16} className="mr-1" />
                Download
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText size={20} className="text-green-600 mr-3" />
                <div>
                  <p className="font-medium">Proof of Insurance</p>
                  <p className="text-sm text-gray-600">PDF • For landlord verification</p>
                </div>
              </div>
              <button
                onClick={() => downloadDocument('Proof of Insurance')}
                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Download size={16} className="mr-1" />
                Download
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText size={20} className="text-purple-600 mr-3" />
                <div>
                  <p className="font-medium">Personal Property Inventory</p>
                  <p className="text-sm text-gray-600">PDF • For your records</p>
                </div>
              </div>
              <button
                onClick={() => downloadDocument('Property Inventory')}
                className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <Download size={16} className="mr-1" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentersInsuranceView;