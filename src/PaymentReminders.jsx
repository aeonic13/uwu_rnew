import React, { useState, useEffect } from 'react';
import { Bell, DollarSign, Calendar, Shield, Camera, AlertTriangle, CheckCircle, Clock, FileText, Phone, X } from 'lucide-react';

const PaymentReminders = ({ user, currentLease, onPayRent, onReportIssue }) => {
  const [showRentPayment, setShowRentPayment] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [issuePhotos, setIssuePhotos] = useState([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [issueType, setIssueType] = useState('maintenance');

  // Calculate next rent due date
  const getNextRentDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth;
  };

  const getDaysUntilRent = () => {
    const today = new Date();
    const nextRent = getNextRentDate();
    const diffTime = nextRent - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilRent = getDaysUntilRent();

  // Mock payment history
  const paymentHistory = [
    { month: 'December 2024', amount: currentLease?.monthlyRent || 1200, status: 'paid', date: '2024-12-01', fee: 12 },
    { month: 'November 2024', amount: currentLease?.monthlyRent || 1200, status: 'paid', date: '2024-11-01', fee: 12 },
    { month: 'October 2024', amount: currentLease?.monthlyRent || 1200, status: 'paid', date: '2024-10-01', fee: 12 }
  ];

  // Mock issues/reports
  const [reportedIssues, setReportedIssues] = useState([
    {
      id: 1,
      type: 'maintenance',
      title: 'Leaky faucet in kitchen',
      description: 'Water drips constantly from the kitchen sink faucet',
      status: 'in-progress',
      reportedDate: '2024-12-15',
      photos: 2,
      landlordResponse: 'Maintenance scheduled for next week'
    }
  ]);

  useEffect(() => {
    // Set up payment reminders
    const createNotifications = () => {
      const newNotifications = [];
      
      if (daysUntilRent <= 7) {
        newNotifications.push({
          id: 1,
          type: 'payment',
          title: `Rent due in ${daysUntilRent} days`,
          message: `Your rent payment of $${currentLease?.monthlyRent || 1200} is due on ${getNextRentDate().toLocaleDateString()}`,
          priority: daysUntilRent <= 3 ? 'high' : 'medium',
          timestamp: new Date().toISOString()
        });
      }

      setNotifications(newNotifications);
    };

    createNotifications();
  }, [daysUntilRent, currentLease]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIssuePhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitIssue = () => {
    const newIssue = {
      id: Date.now(),
      type: issueType,
      title: issueDescription.substring(0, 50) + '...',
      description: issueDescription,
      status: 'reported',
      reportedDate: new Date().toLocaleDateString(),
      photos: issuePhotos.length,
      landlordResponse: null
    };

    setReportedIssues(prev => [newIssue, ...prev]);
    setIssuePhotos([]);
    setIssueDescription('');
    setShowIssueReport(false);
    onReportIssue?.(newIssue);
  };

  const handlePayRent = () => {
    const payment = {
      amount: currentLease?.monthlyRent || 1200,
      fee: Math.round((currentLease?.monthlyRent || 1200) * 0.01), // 1% fee
      month: getNextRentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      date: new Date().toISOString()
    };
    
    onPayRent?.(payment);
    setShowRentPayment(false);
    
    // Remove payment notification
    setNotifications(prev => prev.filter(n => n.type !== 'payment'));
  };

  if (!currentLease) {
    return (
      <div className="p-6 text-center">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Lease</h3>
        <p className="text-gray-500">You don't have an active lease to manage</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Notifications</h2>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 mb-3 ${
                notification.priority === 'high' 
                  ? 'bg-red-50 border-red-400'
                  : 'bg-brand-50 border-brand-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Bell className={`${
                    notification.priority === 'high' ? 'text-red-600' : 'text-brand-500'
                  } mr-3`} size={20} />
                  <div>
                    <h3 className={`font-semibold ${
                      notification.priority === 'high' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm ${
                      notification.priority === 'high' ? 'text-red-700' : 'text-brand-600'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                {notification.type === 'payment' && (
                  <button
                    onClick={() => setShowRentPayment(true)}
                    className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-600"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Lease Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Lease</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium">{currentLease.property?.address}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Rent:</span>
            <span className="font-medium">${currentLease.monthlyRent}</span>
          </div>
          <div className="flex justify-between">
            <span>Next Payment:</span>
            <span className="font-medium">{getNextRentDate().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Days Until Due:</span>
            <span className={`font-medium ${daysUntilRent <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
              {daysUntilRent} days
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowRentPayment(true)}
          className="p-4 bg-brand-500 text-white rounded-lg flex flex-col items-center hover:bg-brand-600"
        >
          <DollarSign size={24} className="mb-2" />
          <span className="font-medium">Pay Rent</span>
        </button>
        <button
          onClick={() => setShowIssueReport(true)}
          className="p-4 bg-orange-600 text-white rounded-lg flex flex-col items-center hover:bg-orange-700"
        >
          <AlertTriangle size={24} className="mb-2" />
          <span className="font-medium">Report Issue</span>
        </button>
      </div>

      {/* Payment History */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Payment History</h2>
        <div className="space-y-3">
          {paymentHistory.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{payment.month}</p>
                  <p className="text-sm text-gray-600">Paid on {new Date(payment.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${payment.amount}</p>
                <p className="text-xs text-gray-500">+${payment.fee} fee</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reported Issues */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Reported Issues</h2>
        {reportedIssues.length === 0 ? (
          <div className="text-center py-8">
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No issues reported</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reportedIssues.map(issue => (
              <div key={issue.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    issue.status === 'resolved' 
                      ? 'bg-green-100 text-green-800'
                      : issue.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {issue.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Reported: {issue.reportedDate}</span>
                  <div className="flex items-center">
                    <Camera size={12} className="mr-1" />
                    <span>{issue.photos} photos</span>
                  </div>
                </div>
                {issue.landlordResponse && (
                  <div className="mt-3 p-3 bg-brand-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Landlord Response:</p>
                    <p className="text-sm text-brand-600">{issue.landlordResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenant Protection Info */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Shield size={20} className="text-brand-500 mr-2" />
          <span className="font-semibold text-blue-800">Tenant Protection</span>
        </div>
        <ul className="text-sm text-brand-600 space-y-1">
          <li>• Payment escrow protects your rent payments</li>
          <li>• Photo documentation for security deposit disputes</li>
          <li>• Issue reporting creates a legal paper trail</li>
          <li>• 24/7 support for urgent maintenance issues</li>
        </ul>
      </div>

      {/* Rent Payment Modal */}
      {showRentPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pay Rent</h2>
              <button onClick={() => setShowRentPayment(false)}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span>Monthly Rent:</span>
                  <span className="font-semibold">${currentLease.monthlyRent}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Processing Fee (1%):</span>
                  <span>${Math.round(currentLease.monthlyRent * 0.01)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${currentLease.monthlyRent + Math.round(currentLease.monthlyRent * 0.01)}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Payment for: {getNextRentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                <p>Due date: {getNextRentDate().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRentPayment(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayRent}
                className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Report Modal */}
      {showIssueReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Report an Issue</h2>
              <button onClick={() => setShowIssueReport(false)}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="maintenance">Maintenance Issue</option>
                  <option value="safety">Safety Concern</option>
                  <option value="noise">Noise Complaint</option>
                  <option value="utilities">Utilities Problem</option>
                  <option value="pest">Pest Control</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Photos (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-brand-500 font-medium hover:underline">
                      Add photos
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      capture="camera"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* Photo Previews */}
                {issuePhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {issuePhotos.map(photo => (
                      <img 
                        key={photo.id}
                        src={photo.preview} 
                        alt="Issue documentation"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowIssueReport(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={!issueDescription.trim()}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  issueDescription.trim()
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReminders;