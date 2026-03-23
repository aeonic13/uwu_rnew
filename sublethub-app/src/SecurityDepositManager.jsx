import React, { useState } from 'react';
import { Shield, DollarSign, Clock, CheckCircle, AlertTriangle, FileText, Camera, Download, Calculator, CreditCard, ArrowRight, Upload, X, Paperclip } from 'lucide-react';

const SecurityDepositManager = ({ lease, userType, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCalculator, setShowCalculator] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    category: '',
    description: '',
    amount: '',
    photos: [],
    receiptFiles: []
  });

  // Mock security deposit data
  const [depositData] = useState({
    id: 'DEPOSIT-001',
    leaseId: lease?.id || 'LEASE-001',
    tenant: {
      name: 'Alex Johnson',
      email: 'alex@usc.edu'
    },
    landlord: {
      name: 'Sarah Chen',
      email: 'sarah@email.com'
    },
    property: {
      address: '123 University Ave, Los Angeles, CA'
    },
    deposit: {
      originalAmount: 2400,
      currentAmount: 2400,
      status: 'held', // held, processing, returned, disputed
      collectedDate: '2024-01-01',
      returnDueDate: '2024-08-31',
      state: 'CA',
      returnDeadline: 21 // days
    },
    moveInInspection: {
      completed: true,
      date: '2024-01-01',
      reportId: 'INSPECTION-MOVEIN-001',
      issuesFound: 2,
      photosUploaded: 15
    },
    moveOutInspection: {
      completed: false,
      scheduledDate: null,
      reportId: null,
      issuesFound: 0,
      photosUploaded: 0
    },
    deductions: [
      {
        id: 'DEDUCT-001',
        category: 'Cleaning',
        description: 'Professional carpet cleaning required',
        amount: 150,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
          'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=300'
        ],
        addedDate: '2024-08-25'
      }
    ],
    timeline: [
      {
        date: '2024-01-01',
        event: 'Security deposit collected',
        amount: 2400,
        type: 'deposit'
      },
      {
        date: '2024-01-01',
        event: 'Move-in inspection completed',
        amount: null,
        type: 'inspection'
      },
      {
        date: '2024-08-25',
        event: 'Move-out inspection scheduled',
        amount: null,
        type: 'inspection'
      }
    ]
  });

  const [calculatedDeductions, setCalculatedDeductions] = useState(0);

  const handleAddDeduction = () => {
    if (deductionForm.category && deductionForm.description && deductionForm.amount) {
      const newDeduction = {
        id: `DEDUCT-${Date.now()}`,
        ...deductionForm,
        amount: parseFloat(deductionForm.amount),
        status: 'pending',
        addedDate: new Date().toISOString()
      };
      
      console.log('Adding deduction:', newDeduction);
      
      // Reset form
      setDeductionForm({
        category: '',
        description: '',
        amount: '',
        photos: [],
        receiptFiles: []
      });
    }
  };

  const handleCalculateReturn = () => {
    const totalDeductions = depositData.deductions.reduce((sum, deduction) => 
      deduction.status === 'approved' ? sum + deduction.amount : sum, 0
    );
    setCalculatedDeductions(totalDeductions);
    setShowCalculator(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'held': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'returned': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const daysUntilReturn = Math.ceil((new Date(depositData.deposit.returnDueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const returnAmount = depositData.deposit.originalAmount - calculatedDeductions;

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Security Deposit Protection</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center text-sm text-blue-800">
            <Shield size={16} className="mr-2" />
            <span>Protected by SubletHub Escrow</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            ${depositData.deposit.originalAmount} held securely • California law: 21-day return
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('deductions')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'deductions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          Deductions
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Deposit Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Deposit Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(depositData.deposit.status)}`}>
                {depositData.deposit.status.charAt(0).toUpperCase() + depositData.deposit.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${depositData.deposit.originalAmount}</div>
                <div className="text-sm text-gray-600">Original Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{daysUntilReturn}</div>
                <div className="text-sm text-gray-600">Days Until Return</div>
              </div>
            </div>

            {daysUntilReturn <= 30 && daysUntilReturn > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Clock size={16} className="text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Lease ending soon - Move-out inspection required
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inspection Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Inspection Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">Move-In Inspection</p>
                    <p className="text-sm text-gray-600">
                      Completed {new Date(depositData.moveInInspection.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{depositData.moveInInspection.issuesFound} issues</div>
                  <div className="text-xs text-gray-500">{depositData.moveInInspection.photosUploaded} photos</div>
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg ${
                depositData.moveOutInspection.completed 
                  ? 'bg-green-50' 
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center">
                  {depositData.moveOutInspection.completed ? (
                    <CheckCircle size={20} className="text-green-600 mr-3" />
                  ) : (
                    <Clock size={20} className="text-gray-400 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">Move-Out Inspection</p>
                    <p className="text-sm text-gray-600">
                      {depositData.moveOutInspection.completed 
                        ? `Completed ${new Date(depositData.moveOutInspection.date).toLocaleDateString()}`
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>
                {!depositData.moveOutInspection.completed && (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Schedule Inspection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Protection Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <Shield size={20} className="mr-2" />
              SubletHub Protection
            </h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Deposit held in secure escrow account</li>
              <li>• Photo documentation protects both parties</li>
              <li>• Automatic return within state-required timeframe</li>
              <li>• Dispute resolution if needed</li>
              <li>• Legal compliance with {depositData.deposit.state} housing laws</li>
            </ul>
          </div>
        </div>
      )}

      {/* Deductions Tab */}
      {activeTab === 'deductions' && (
        <div className="space-y-6">
          {/* Return Calculator */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Deposit Return Calculator</h3>
              <button
                onClick={handleCalculateReturn}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Calculator size={16} className="mr-1" />
                Calculate
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">${depositData.deposit.originalAmount}</div>
                <div className="text-xs text-gray-500">Original</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">-${calculatedDeductions}</div>
                <div className="text-xs text-gray-500">Deductions</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">${returnAmount}</div>
                <div className="text-xs text-gray-500">Return Amount</div>
              </div>
            </div>
          </div>

          {/* Current Deductions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Approved Deductions</h3>
            
            {depositData.deductions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No deductions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {depositData.deductions.map((deduction) => (
                  <div key={deduction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{deduction.category}</h4>
                        <p className="text-sm text-gray-600">{deduction.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">${deduction.amount}</div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          deduction.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deduction.status}
                        </div>
                      </div>
                    </div>
                    
                    {deduction.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {deduction.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Damage evidence ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Deduction (Landlord Only) */}
          {userType === 'owner' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Add Deduction</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={deductionForm.category}
                    onChange={(e) => setDeductionForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Repairs">Repairs</option>
                    <option value="Missing Items">Missing Items</option>
                    <option value="Pet Damage">Pet Damage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={deductionForm.description}
                    onChange={(e) => setDeductionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the issue and justification for deduction..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="number"
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Supporting Documents</label>
                  <p className="text-xs text-gray-600 mb-3">Upload receipts, invoices, or photos as evidence for this deduction</p>
                  
                  <div className="space-y-3">
                    {/* Receipt/Document Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="text-center">
                        <Paperclip size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload Receipts & Documents</p>
                        <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG up to 10MB each</p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            setDeductionForm(prev => ({
                              ...prev,
                              receiptFiles: [...prev.receiptFiles, ...files.map(file => ({
                                file,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                              }))]
                            }));
                          }}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label
                          htmlFor="receipt-upload"
                          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
                        >
                          Choose Files
                        </label>
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-300 transition-colors">
                      <div className="text-center">
                        <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload Photos</p>
                        <p className="text-xs text-gray-500 mb-3">JPG, PNG up to 10MB each</p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            setDeductionForm(prev => ({
                              ...prev,
                              photos: [...prev.photos, ...files.map(file => ({
                                file,
                                name: file.name,
                                size: file.size,
                                preview: URL.createObjectURL(file)
                              }))]
                            }));
                          }}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 cursor-pointer"
                        >
                          Take/Choose Photos
                        </label>
                      </div>
                    </div>

                    {/* Uploaded Files Preview */}
                    {(deductionForm.receiptFiles.length > 0 || deductionForm.photos.length > 0) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-3">Uploaded Files</h4>
                        
                        {/* Receipt Files */}
                        {deductionForm.receiptFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-2">Documents & Receipts</p>
                            <div className="space-y-2">
                              {deductionForm.receiptFiles.map((fileObj, index) => (
                                <div key={index} className="flex items-center justify-between bg-white rounded p-2 border">
                                  <div className="flex items-center">
                                    <FileText size={16} className="text-blue-600 mr-2" />
                                    <div>
                                      <p className="text-sm font-medium">{fileObj.name}</p>
                                      <p className="text-xs text-gray-500">{(fileObj.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setDeductionForm(prev => ({
                                        ...prev,
                                        receiptFiles: prev.receiptFiles.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Photos */}
                        {deductionForm.photos.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-2">Photos</p>
                            <div className="grid grid-cols-3 gap-2">
                              {deductionForm.photos.map((photoObj, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={photoObj.preview}
                                    alt={photoObj.name}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <button
                                    onClick={() => {
                                      setDeductionForm(prev => ({
                                        ...prev,
                                        photos: prev.photos.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddDeduction}
                  disabled={!deductionForm.category || !deductionForm.description || !deductionForm.amount}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    deductionForm.category && deductionForm.description && deductionForm.amount
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add Deduction with Evidence
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {depositData.timeline.map((event, index) => (
            <div key={index} className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                {event.type === 'deposit' ? (
                  <DollarSign size={16} className="text-blue-600" />
                ) : event.type === 'inspection' ? (
                  <Camera size={16} className="text-blue-600" />
                ) : (
                  <Clock size={16} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.event}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    {event.amount && (
                      <div className="font-semibold text-green-600">
                        ${event.amount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Deposit Return Calculation</h2>
                <button onClick={() => setShowCalculator(false)}>
                  <span className="text-gray-500">×</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Original Deposit:</span>
                    <span className="font-semibold">${depositData.deposit.originalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Total Deductions:</span>
                    <span className="font-semibold text-red-600">-${calculatedDeductions}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Return Amount:</span>
                    <span className="font-semibold text-green-600">${returnAmount}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>State Requirement:</strong> Deposit must be returned within {depositData.deposit.returnDeadline} days of lease end in {depositData.deposit.state}.
                  </p>
                </div>

                <button
                  onClick={() => setShowCalculator(false)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Close
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

export default SecurityDepositManager;