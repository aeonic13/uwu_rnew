import React, { useState } from 'react';
import { Upload, Eye, EyeOff, DollarSign, Calendar, Zap, Droplets, Wifi, Phone, Check, X, AlertCircle, Camera, FileText, Send, Clock, CreditCard } from 'lucide-react';

const LandlordUtilityManager = ({ currentTenants, onRequestPayment, onUploadBill }) => {
  const [selectedUtility, setSelectedUtility] = useState('electricity');
  const [uploadedBills, setUploadedBills] = useState([]);
  const [showRedactionPreview, setShowRedactionPreview] = useState(null);
  const [paymentRequests, setPaymentRequests] = useState([]);

  const utilityTypes = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: 'yellow', avgCost: 85 },
    { id: 'gas', name: 'Gas', icon: Phone, color: 'red', avgCost: 45 },
    { id: 'water', name: 'Water/Sewer', icon: Droplets, color: 'blue', avgCost: 35 },
    { id: 'internet', name: 'Internet', icon: Wifi, color: 'green', avgCost: 60 },
    { id: 'trash', name: 'Trash/Recycling', icon: FileText, color: 'gray', avgCost: 25 }
  ];

  // Mock tenant data
  const mockTenants = [
    { 
      id: 'tenant1', 
      name: 'Emily Rodriguez', 
      email: 'emily.r@usc.edu',
      property: 'Cozy 1BR near USC Campus',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      status: 'active'
    },
    { 
      id: 'tenant2', 
      name: 'Michael Chen', 
      email: 'mchen@ucla.edu',
      property: 'Shared House - UCLA Area',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'active'
    }
  ];

  // Mock existing bills with automatic redaction simulation
  const [existingBills] = useState([
    {
      id: 1,
      type: 'electricity',
      amount: 127.45,
      month: '2024-12',
      dueDate: '2025-01-15',
      isProcessed: true,
      isSharedWithTenants: false,
      redactedData: {
        accountNumber: '****1234',
        ssn: '***-**-****',
        bankInfo: 'REDACTED'
      },
      originalAmount: 127.45,
      tenantPortion: 63.73, // Split between 2 tenants
      billImageUrl: '/api/placeholder/400/600'
    },
    {
      id: 2,
      type: 'gas',
      amount: 89.23,
      month: '2024-12',
      dueDate: '2025-01-10',
      isProcessed: true,
      isSharedWithTenants: true,
      redactedData: {
        accountNumber: '****5678',
        ssn: '***-**-****'
      },
      originalAmount: 89.23,
      tenantPortion: 44.62,
      billImageUrl: '/api/placeholder/400/600',
      paymentStatus: 'pending'
    }
  ]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newBill = {
          id: Date.now() + Math.random(),
          type: selectedUtility,
          file: file,
          preview: reader.result,
          uploadDate: new Date().toISOString(),
          isProcessed: false,
          amount: null,
          redactedData: null
        };
        
        setUploadedBills(prev => [...prev, newBill]);
        
        // Simulate automatic processing
        setTimeout(() => {
          processUtilityBill(newBill.id);
        }, 2000);
      };
      reader.readAsDataURL(file);
    });
  };

  const processUtilityBill = (billId) => {
    setUploadedBills(prev => prev.map(bill => {
      if (bill.id === billId) {
        return {
          ...bill,
          isProcessed: true,
          amount: Math.floor(Math.random() * 200 + 50), // Random amount
          month: new Date().toISOString().slice(0, 7),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          redactedData: {
            accountNumber: '****' + Math.floor(Math.random() * 9999),
            ssn: '***-**-****',
            bankInfo: 'REDACTED'
          }
        };
      }
      return bill;
    }));
  };

  const shareWithTenants = (billId) => {
    const bill = [...existingBills, ...uploadedBills].find(b => b.id === billId);
    if (!bill) return;

    const tenantPortion = bill.amount / mockTenants.length;
    
    const paymentRequest = {
      id: Date.now(),
      billId: billId,
      utilityType: bill.type,
      totalAmount: bill.amount,
      perTenantAmount: tenantPortion,
      month: bill.month,
      dueDate: bill.dueDate,
      tenants: mockTenants.map(tenant => ({
        ...tenant,
        amount: tenantPortion,
        status: 'pending' // 'pending', 'paid', 'overdue'
      })),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    setPaymentRequests(prev => [...prev, paymentRequest]);
    onRequestPayment?.(paymentRequest);
  };

  const getUtilityIcon = (utilityType) => {
    const utility = utilityTypes.find(u => u.id === utilityType);
    return utility ? utility.icon : FileText;
  };

  const getUtilityColor = (utilityType) => {
    const utility = utilityTypes.find(u => u.id === utilityType);
    return utility ? utility.color : 'gray';
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Utility Bill Manager</h2>
        <p className="text-gray-600">Upload bills, automatically redact sensitive info, and request payments from tenants</p>
      </div>

      {/* Upload New Bill */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Upload New Utility Bill</h3>
        
        {/* Utility Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Utility Type</label>
          <div className="grid grid-cols-3 gap-3">
            {utilityTypes.slice(0, 6).map(utility => {
              const IconComponent = utility.icon;
              return (
                <button
                  key={utility.id}
                  onClick={() => setSelectedUtility(utility.id)}
                  className={`p-3 border rounded-lg flex flex-col items-center transition-colors ${
                    selectedUtility === utility.id
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-300 hover:border-brand-300'
                  }`}
                >
                  <IconComponent size={20} className="mb-1" />
                  <span className="text-xs font-medium">{utility.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload size={40} className="mx-auto text-gray-400 mb-3" />
          <label className="cursor-pointer">
            <span className="text-brand-500 font-medium hover:underline">
              Upload utility bill
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">
            PDF or image files • We'll automatically scan and redact sensitive information
          </p>
        </div>

        {/* Recently Uploaded */}
        {uploadedBills.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Recently Uploaded</h4>
            <div className="space-y-3">
              {uploadedBills.map(bill => {
                const IconComponent = getUtilityIcon(bill.type);
                return (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full bg-${getUtilityColor(bill.type)}-100 mr-3`}>
                        <IconComponent size={16} className={`text-${getUtilityColor(bill.type)}-600`} />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{bill.type} Bill</p>
                        <p className="text-xs text-gray-500">
                          {bill.isProcessed ? `$${bill.amount} • ${bill.month}` : 'Processing...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {bill.isProcessed ? (
                        <>
                          <button
                            onClick={() => setShowRedactionPreview(bill)}
                            className="text-brand-500 text-sm hover:underline"
                          >
                            <Eye size={16} className="inline mr-1" />
                            Preview
                          </button>
                          <button
                            onClick={() => shareWithTenants(bill.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Share with Tenants
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center text-brand-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500 mr-2"></div>
                          <span className="text-sm">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Existing Bills */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Utility Bills</h3>
        
        <div className="space-y-4">
          {existingBills.map(bill => {
            const IconComponent = getUtilityIcon(bill.type);
            return (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full bg-${getUtilityColor(bill.type)}-100 mr-3`}>
                      <IconComponent size={20} className={`text-${getUtilityColor(bill.type)}-600`} />
                    </div>
                    <div>
                      <h4 className="font-medium capitalize">{bill.type} Bill</h4>
                      <p className="text-sm text-gray-600">{bill.month} • Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${bill.amount}</p>
                    <p className="text-xs text-gray-500">
                      ${bill.tenantPortion}/tenant
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowRedactionPreview(bill)}
                      className="text-brand-500 text-sm hover:underline flex items-center"
                    >
                      <Eye size={14} className="mr-1" />
                      View Redacted
                    </button>
                    
                    {bill.isSharedWithTenants ? (
                      <div className="flex items-center text-green-600">
                        <Check size={14} className="mr-1" />
                        <span className="text-sm">Shared with tenants</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => shareWithTenants(bill.id)}
                        className="text-brand-500 text-sm hover:underline flex items-center"
                      >
                        <Send size={14} className="mr-1" />
                        Share with Tenants
                      </button>
                    )}
                  </div>

                  {bill.paymentStatus && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : bill.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bill.paymentStatus.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Requests */}
      {paymentRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Active Payment Requests</h3>
          
          <div className="space-y-4">
            {paymentRequests.map(request => {
              const IconComponent = getUtilityIcon(request.utilityType);
              return (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full bg-${getUtilityColor(request.utilityType)}-100 mr-3`}>
                        <IconComponent size={20} className={`text-${getUtilityColor(request.utilityType)}-600`} />
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{request.utilityType} Payment Request</h4>
                        <p className="text-sm text-gray-600">
                          {request.month} • ${request.perTenantAmount}/tenant
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${request.totalAmount}</p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(request.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Tenant Payment Status */}
                  <div className="space-y-2">
                    {request.tenants.map(tenant => (
                      <div key={tenant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <img
                            src={tenant.avatar}
                            alt={tenant.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-sm font-medium">{tenant.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">${tenant.amount}</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tenant.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : tenant.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Redaction Preview Modal */}
      {showRedactionPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Bill Preview (Redacted)</h3>
              <button
                onClick={() => setShowRedactionPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Redaction Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Check size={16} className="text-green-600 mr-2" />
                  <span className="text-sm text-green-800 font-medium">
                    Sensitive information automatically redacted
                  </span>
                </div>
                <ul className="text-xs text-green-700 mt-2 space-y-1">
                  <li>• Account numbers: {showRedactionPreview.redactedData?.accountNumber}</li>
                  <li>• SSN: {showRedactionPreview.redactedData?.ssn}</li>
                  <li>• Bank information: REDACTED</li>
                </ul>
              </div>

              {/* Mock Bill Image */}
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {showRedactionPreview.type.charAt(0).toUpperCase() + showRedactionPreview.type.slice(1)} Bill
                </p>
                <p className="font-semibold">${showRedactionPreview.amount}</p>
                <p className="text-xs text-gray-500 mt-2">
                  This version has been automatically processed to remove sensitive information
                </p>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowRedactionPreview(null)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    shareWithTenants(showRedactionPreview.id);
                    setShowRedactionPreview(null);
                  }}
                  className="flex-1 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  Share with Tenants
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordUtilityManager;