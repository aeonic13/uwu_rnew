import React, { useState } from 'react';
import { Check, Upload, Camera, Zap, Droplets, Wifi, Phone, CheckCircle, AlertCircle, Home, Calendar } from 'lucide-react';

const MoveInConfirmation = ({ lease, onConfirm, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmationData, setConfirmationData] = useState({
    moveInPhotos: [],
    conditionNotes: '',
    utilitiesSetup: {
      electricity: false,
      water: false,
      internet: false,
      gas: false
    },
    emergencyContacts: {
      landlord: lease.landlord.phone,
      maintenance: '',
      utilities: ''
    }
  });

  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          timestamp: new Date().toISOString()
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const utilityServices = [
    { 
      id: 'electricity', 
      name: 'Electricity', 
      icon: Zap, 
      provider: 'SoCal Edison',
      phone: '(800) 655-4555',
      setupInstructions: 'Call to transfer service to your name'
    },
    { 
      id: 'water', 
      name: 'Water/Sewer', 
      icon: Droplets, 
      provider: 'LA Water & Power',
      phone: '(213) 367-4211',
      setupInstructions: 'Visit ladwp.com or call to set up account'
    },
    { 
      id: 'internet', 
      name: 'Internet', 
      icon: Wifi, 
      provider: 'Spectrum (recommended)',
      phone: '(855) 757-7328',
      setupInstructions: 'Schedule installation appointment online'
    },
    { 
      id: 'gas', 
      name: 'Gas', 
      icon: Phone, 
      provider: 'SoCal Gas',
      phone: '(800) 427-2200',
      setupInstructions: 'Call to activate service'
    }
  ];

  const toggleUtilitySetup = (utilityId) => {
    setConfirmationData(prev => ({
      ...prev,
      utilitiesSetup: {
        ...prev.utilitiesSetup,
        [utilityId]: !prev.utilitiesSetup[utilityId]
      }
    }));
  };

  const handleMoveInConfirmation = () => {
    const confirmationRecord = {
      leaseId: lease.id,
      moveInDate: new Date().toISOString(),
      photos: uploadedPhotos,
      conditionNotes: confirmationData.conditionNotes,
      utilitiesStatus: confirmationData.utilitiesSetup,
      confirmationTimestamp: new Date().toISOString()
    };
    
    onConfirm(confirmationRecord);
  };

  // Step 1: Photo Documentation
  if (currentStep === 1) {
    return (
      <div className="p-6 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Document Your Move-In</h2>
          <p className="text-gray-600">
            Take photos to document the property's condition. This protects both you and the landlord.
          </p>
        </div>

        {/* Property Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">{lease.property.address}</h3>
          <div className="flex items-center text-blue-700 text-sm">
            <Calendar size={16} className="mr-2" />
            <span>Move-in: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Take Move-In Photos</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-blue-600 font-medium hover:underline">
                Take photos or upload from gallery
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
            <p className="text-sm text-gray-500 mt-2">
              Document rooms, appliances, and any existing damage
            </p>
          </div>
        </div>

        {/* Uploaded Photos */}
        {uploadedPhotos.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">Uploaded Photos ({uploadedPhotos.length})</h4>
            <div className="grid grid-cols-2 gap-3">
              {uploadedPhotos.map(photo => (
                <div key={photo.id} className="relative">
                  <img 
                    src={photo.preview} 
                    alt="Move-in documentation"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
          <textarea
            value={confirmationData.conditionNotes}
            onChange={(e) => setConfirmationData(prev => ({ ...prev, conditionNotes: e.target.value }))}
            placeholder="Note any existing issues or damage you observe..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Navigation */}
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Utility Setup
  if (currentStep === 2) {
    return (
      <div className="p-6 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Set Up Your Utilities</h2>
          <p className="text-gray-600">
            We've made it easy to get your essential services connected.
          </p>
        </div>

        {/* Utility Services */}
        <div className="space-y-4 mb-6">
          {utilityServices.map(utility => {
            const IconComponent = utility.icon;
            const isSetup = confirmationData.utilitiesSetup[utility.id];
            
            return (
              <div key={utility.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <IconComponent size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{utility.name}</h4>
                      <p className="text-sm text-gray-600">{utility.provider}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUtilitySetup(utility.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSetup 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {isSetup && <Check size={14} />}
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{utility.setupInstructions}</p>
                
                <div className="flex space-x-2">
                  <a
                    href={`tel:${utility.phone}`}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium text-center hover:bg-blue-700"
                  >
                    Call {utility.phone}
                  </a>
                  <button
                    onClick={() => toggleUtilitySetup(utility.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      isSetup
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSetup ? 'Setup Complete' : 'Mark as Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Setup Progress */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Setup Progress</span>
            <span className="text-sm text-gray-600">
              {Object.values(confirmationData.utilitiesSetup).filter(Boolean).length} / {utilityServices.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(Object.values(confirmationData.utilitiesSetup).filter(Boolean).length / utilityServices.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Emergency Contacts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Landlord</span>
              <a href={`tel:${lease.landlord.phone}`} className="text-blue-600 hover:underline">
                {lease.landlord.phone}
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">SubletHub Support</span>
              <a href="tel:(555) 123-4567" className="text-blue-600 hover:underline">
                (555) 123-4567
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Complete Move-In
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Final Confirmation
  if (currentStep === 3) {
    return (
      <div className="p-6 pb-20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Home className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to Your New Home!</h2>
          <p className="text-gray-600">
            Your move-in has been confirmed. We'll release the security deposit to your landlord.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">Move-In Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Property:</span>
              <span className="font-medium">{lease.property.address}</span>
            </div>
            <div className="flex justify-between">
              <span>Move-in Date:</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Photos Uploaded:</span>
              <span className="font-medium">{uploadedPhotos.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilities Setup:</span>
              <span className="font-medium">
                {Object.values(confirmationData.utilitiesSetup).filter(Boolean).length} / {utilityServices.length}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Release Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle size={20} className="text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">Payment Released</span>
          </div>
          <p className="text-sm text-blue-700">
            Your security deposit and first month's rent have been released to the landlord. 
            Future rent payments will be due on the 1st of each month.
          </p>
        </div>

        {/* Next Steps */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                <Check size={12} className="text-blue-600" />
              </div>
              <span className="text-sm">We'll send you monthly rent reminders</span>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                <Check size={12} className="text-blue-600" />
              </div>
              <span className="text-sm">Your photos are saved for security deposit protection</span>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                <Check size={12} className="text-blue-600" />
              </div>
              <span className="text-sm">24/7 support is available if you need help</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleMoveInConfirmation}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Complete Move-In Process
        </button>
      </div>
    );
  }
};

export default MoveInConfirmation;