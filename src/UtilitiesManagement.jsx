import React, { useState } from 'react';
import { ArrowLeft, Zap, Droplets, Wifi, Flame, Phone, Car, Plus, Check, AlertCircle, CreditCard, Calendar, DollarSign, Clock, Building2, SplitSquareHorizontal } from 'lucide-react';
import UtilityBillSplit from './features/utilities/UtilityBillSplit';

const UtilitiesManagementView = ({ user, lease, onBack, onPayUtility }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = ['overview', 'setup', 'split'];
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [setupData, setSetupData] = useState({
    utilityType: '',
    provider: '',
    accountNumber: '',
    serviceAddress: lease?.property?.address || '',
    estimatedMonthlyAmount: '',
    setupFee: '',
    depositRequired: '',
    serviceStartDate: '',
    autoPayEnabled: false
  });

  // Mock utility data - in a real app, this would come from the backend
  const [utilities, setUtilities] = useState([
    {
      id: 1,
      type: 'electricity',
      name: 'Electricity',
      provider: 'Edison Electric',
      status: 'active',
      accountNumber: '****1234',
      monthlyAmount: 85.50,
      dueDate: '2024-02-15',
      lastBill: 85.50,
      setupDate: '2024-01-01',
      autoPayEnabled: true,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 2,
      type: 'water',
      name: 'Water & Sewer',
      provider: 'City Water Department',
      status: 'active',
      accountNumber: '****5678',
      monthlyAmount: 45.30,
      dueDate: '2024-02-20',
      lastBill: 45.30,
      setupDate: '2024-01-01',
      autoPayEnabled: false,
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 3,
      type: 'internet',
      name: 'Internet',
      provider: 'Spectrum',
      status: 'pending_setup',
      accountNumber: null,
      monthlyAmount: 79.99,
      dueDate: null,
      lastBill: null,
      setupDate: null,
      autoPayEnabled: false,
      icon: Wifi,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]);

  const availableUtilities = [
    { type: 'electricity', name: 'Electricity', icon: Zap, providers: ['Edison Electric', 'PG&E', 'LADWP'] },
    { type: 'gas', name: 'Natural Gas', icon: Flame, providers: ['SoCalGas', 'PG&E'] },
    { type: 'water', name: 'Water & Sewer', icon: Droplets, providers: ['City Water Department', 'Municipal Water'] },
    { type: 'internet', name: 'Internet', icon: Wifi, providers: ['Spectrum', 'AT&T', 'Verizon', 'Xfinity'] },
    { type: 'cable', name: 'Cable TV', icon: Phone, providers: ['Spectrum', 'DIRECTV', 'Xfinity'] },
    { type: 'parking', name: 'Parking', icon: Car, providers: ['Building Management', 'SpotHero', 'ParkWhiz'] }
  ];

  const handleSetupUtility = () => {
    if (!setupData.utilityType || !setupData.provider) return;

    const utilityType = availableUtilities.find(u => u.type === setupData.utilityType);
    const newUtility = {
      id: Date.now(),
      type: setupData.utilityType,
      name: utilityType.name,
      provider: setupData.provider,
      status: 'pending_activation',
      accountNumber: '****' + Math.random().toString().substr(2, 4),
      monthlyAmount: parseFloat(setupData.estimatedMonthlyAmount) || 0,
      dueDate: null,
      lastBill: null,
      setupDate: setupData.serviceStartDate,
      autoPayEnabled: setupData.autoPayEnabled,
      icon: utilityType.icon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      setupFee: parseFloat(setupData.setupFee) || 0,
      depositRequired: parseFloat(setupData.depositRequired) || 0
    };

    setUtilities(prev => [...prev, newUtility]);
    setShowSetupForm(false);
    setSetupData({
      utilityType: '',
      provider: '',
      accountNumber: '',
      serviceAddress: lease?.property?.address || '',
      estimatedMonthlyAmount: '',
      setupFee: '',
      depositRequired: '',
      serviceStartDate: '',
      autoPayEnabled: false
    });

    // If there's a setup fee or deposit, process payment
    if (newUtility.setupFee > 0 || newUtility.depositRequired > 0) {
      const totalAmount = newUtility.setupFee + newUtility.depositRequired;
      onPayUtility({
        utilityId: newUtility.id,
        utilityName: newUtility.name,
        provider: newUtility.provider,
        amount: totalAmount,
        description: `Setup fee and deposit for ${newUtility.name}`,
        date: new Date().toISOString()
      });
    }
  };

  const handlePayUtility = (utility, amount = null) => {
    const paymentAmount = amount || utility.lastBill || utility.monthlyAmount;
    onPayUtility({
      utilityId: utility.id,
      utilityName: utility.name,
      provider: utility.provider,
      amount: paymentAmount,
      description: `${utility.name} bill payment`,
      date: new Date().toISOString()
    });

    // Update utility status
    setUtilities(prev => prev.map(u => 
      u.id === utility.id 
        ? { ...u, status: 'paid', lastPaidDate: new Date().toISOString() }
        : u
    ));
  };

  const getTotalMonthlyUtilities = () => {
    return utilities.filter(u => u.status === 'active').reduce((sum, utility) => sum + utility.monthlyAmount, 0);
  };

  const getUtilityStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending_setup': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending_activation': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'paid': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (showSetupForm) {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setShowSetupForm(false)} 
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Set Up New Utility</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Utility Type</label>
            <select
              value={setupData.utilityType}
              onChange={(e) => setSetupData(prev => ({ ...prev, utilityType: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select utility type</option>
              {availableUtilities.map(utility => (
                <option key={utility.type} value={utility.type}>
                  {utility.name}
                </option>
              ))}
            </select>
          </div>

          {setupData.utilityType && (
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                value={setupData.provider}
                onChange={(e) => setSetupData(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select provider</option>
                {availableUtilities
                  .find(u => u.type === setupData.utilityType)?.providers
                  .map(provider => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Service Address</label>
            <input
              type="text"
              value={setupData.serviceAddress}
              onChange={(e) => setSetupData(prev => ({ ...prev, serviceAddress: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Monthly Amount</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  value={setupData.estimatedMonthlyAmount}
                  onChange={(e) => setSetupData(prev => ({ ...prev, estimatedMonthlyAmount: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Setup Fee</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  value={setupData.setupFee}
                  onChange={(e) => setSetupData(prev => ({ ...prev, setupFee: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Security Deposit</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="number"
                  value={setupData.depositRequired}
                  onChange={(e) => setSetupData(prev => ({ ...prev, depositRequired: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Service Start Date</label>
              <input
                type="date"
                value={setupData.serviceStartDate}
                onChange={(e) => setSetupData(prev => ({ ...prev, serviceStartDate: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autopay"
              checked={setupData.autoPayEnabled}
              onChange={(e) => setSetupData(prev => ({ ...prev, autoPayEnabled: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autopay" className="text-sm">
              Enable automatic payments
            </label>
          </div>

          {(parseFloat(setupData.setupFee) > 0 || parseFloat(setupData.depositRequired) > 0) && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Payment Required</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                {parseFloat(setupData.setupFee) > 0 && (
                  <p>Setup Fee: ${parseFloat(setupData.setupFee).toFixed(2)}</p>
                )}
                {parseFloat(setupData.depositRequired) > 0 && (
                  <p>Security Deposit: ${parseFloat(setupData.depositRequired).toFixed(2)}</p>
                )}
                <p className="font-semibold pt-1 border-t border-yellow-300">
                  Total Due Now: ${((parseFloat(setupData.setupFee) || 0) + (parseFloat(setupData.depositRequired) || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSetupUtility}
            disabled={!setupData.utilityType || !setupData.provider}
            className={`w-full py-3 rounded-lg font-semibold ${
              setupData.utilityType && setupData.provider
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Set Up Utility
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
        <h2 className="text-xl font-bold">Utilities Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'setup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Setup
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <SplitSquareHorizontal size={14} />
          Split Bill
        </button>
      </div>

      {/* Split Bill Tab */}
      {activeTab === 'split' && <UtilityBillSplit />}

      {/* Overview + Setup tabs */}
      {activeTab !== 'split' && <>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <DollarSign size={20} className="text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Monthly Total</p>
              <p className="text-xl font-bold text-blue-800">${getTotalMonthlyUtilities().toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Building2 size={20} className="text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-600">Active Services</p>
              <p className="text-xl font-bold text-green-800">{utilities.filter(u => u.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Utility Button */}
      <button
        onClick={() => setShowSetupForm(true)}
        className="w-full mb-6 p-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center justify-center"
      >
        <Plus size={20} className="mr-2" />
        Set Up New Utility
      </button>

      {/* Utilities List */}
      <div className="space-y-4">
        {utilities.map((utility) => {
          const IconComponent = utility.icon;
          return (
            <div key={utility.id} className={`border rounded-lg p-4 ${utility.borderColor} ${utility.bgColor}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${utility.bgColor} border ${utility.borderColor} mr-3`}>
                    <IconComponent size={20} className={utility.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{utility.name}</h3>
                    <p className="text-sm text-gray-600">{utility.provider}</p>
                    {utility.accountNumber && (
                      <p className="text-xs text-gray-500">Account: {utility.accountNumber}</p>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getUtilityStatusColor(utility.status)}`}>
                  {utility.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Monthly Amount</p>
                  <p className="font-semibold">${utility.monthlyAmount.toFixed(2)}</p>
                </div>
                {utility.dueDate && (
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{formatDate(utility.dueDate)}</p>
                  </div>
                )}
              </div>

              {utility.status === 'active' && utility.lastBill && (
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Bill: ${utility.lastBill.toFixed(2)}</p>
                    {utility.autoPayEnabled && (
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <Check size={12} className="mr-1" />
                        Auto-pay enabled
                      </p>
                    )}
                  </div>
                  {!utility.autoPayEnabled && (
                    <button
                      onClick={() => handlePayUtility(utility)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center"
                    >
                      <CreditCard size={16} className="mr-1" />
                      Pay Now
                    </button>
                  )}
                </div>
              )}

              {utility.status === 'pending_setup' && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setSelectedUtility(utility);
                      setSetupData({
                        ...setupData,
                        utilityType: utility.type,
                        provider: utility.provider
                      });
                      setShowSetupForm(true);
                    }}
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg text-sm hover:bg-yellow-700"
                  >
                    Complete Setup
                  </button>
                </div>
              )}

              {utility.status === 'pending_activation' && (
                <div className="mt-3 bg-orange-50 p-3 rounded border border-orange-200">
                  <div className="flex items-center text-orange-800">
                    <Clock size={16} className="mr-2" />
                    <span className="text-sm font-medium">Awaiting Provider Activation</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Your request has been submitted. Service will be activated by {formatDate(utility.setupDate)}.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {utilities.length === 0 && (
        <div className="text-center py-8">
          <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Utilities Set Up</h3>
          <p className="text-gray-500 text-sm mb-4">
            Get started by setting up your utilities for this property.
          </p>
        </div>
      )}
      </> }
    </div>
  );
};

export default UtilitiesManagementView;