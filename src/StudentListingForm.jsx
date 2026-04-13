import React, { useState } from 'react';
import { Camera, Upload, FileText, DollarSign, MapPin, Calendar, Home, Plus, X, Check, AlertCircle, User, Mail, Phone, Building, Info } from 'lucide-react';

const StudentListingForm = ({ onSubmit, onBack, currentUser }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [listingData, setListingData] = useState({
    // Basic Property Info
    title: '',
    description: '',
    address: '',
    university: '',
    suggestedRent: '',
    availableFrom: '',
    availableTo: '',
    propertyType: 'room', // Default to room since students often rental their room
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    reasonForRentalting: '',
    
    // Owner Information
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerRelationship: 'landlord', // 'landlord', 'parent', 'roommate', 'other'
    ownerVerified: false,
    
    // Student Information
    studentName: currentUser?.name || '',
    studentEmail: currentUser?.email || '',
    studentPhone: '',
    currentLease: null,
    
    // Special terms
    guestPolicy: '',
    cleaningArrangement: '',
    keyAccess: '',
    specialTerms: ''
  });

  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [ownerApprovalSent, setOwnerApprovalSent] = useState(false);

  const availableAmenities = [
    'WiFi', 'Laundry', 'Parking', 'Furnished', 'Kitchen', 'Garden', 
    'Pet-friendly', 'Gym', 'AC', 'Dishwasher', 'Pool', 'Balcony',
    'In-unit Laundry', 'Study Space', 'Security', 'Storage'
  ];

  const universities = [
    'USC', 'UCLA', 'NYU', 'Stanford', 'Harvard', 'MIT', 
    'UC Berkeley', 'Columbia', 'Yale', 'Princeton'
  ];

  const rentaltingReasons = [
    'Study Abroad',
    'Internship',
    'Summer Break',
    'Graduation Early',
    'Family Emergency',
    'Job Relocation',
    'Other'
  ];

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          caption: ''
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'image'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleAmenity = (amenity) => {
    setListingData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const sendOwnerApprovalRequest = () => {
    // In a real app, this would send an email/notification to the owner
    setOwnerApprovalSent(true);
    
    // Simulate owner response delay
    setTimeout(() => {
      setListingData(prev => ({ ...prev, ownerVerified: true }));
    }, 3000);
  };

  const handleSubmit = () => {
    const completeListingData = {
      ...listingData,
      photos: propertyPhotos,
      documents,
      createdAt: new Date().toISOString(),
      status: 'pending_owner_approval',
      listingType: 'student_initiated',
      views: 0,
      applicants: [],
      approvalRequired: true
    };
    
    onSubmit(completeListingData);
  };

  // Step 1: Basic Property Info & Reason
  if (currentStep === 1) {
    return (
      <div className="p-6 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Rental Your Space</h2>
          <p className="text-gray-600">
            List your room or property for rentalting. We'll get approval from your property owner first.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info size={20} className="text-brand-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Owner Approval Required</h3>
              <p className="text-sm text-brand-600">
                Your property owner must approve this listing before it goes live. We'll contact them directly to ensure everything is legitimate and legal.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Listing Title</label>
            <input
              type="text"
              value={listingData.title}
              onChange={(e) => setListingData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., My room in shared apartment near USC"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <input
              type="text"
              value={listingData.address}
              onChange={(e) => setListingData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address of the property"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nearest University</label>
              <select
                value={listingData.university}
                onChange={(e) => setListingData(prev => ({ ...prev, university: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select University</option>
                {universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">What are you rentalting?</label>
              <select
                value={listingData.propertyType}
                onChange={(e) => setListingData(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="room">My room</option>
                <option value="apartment">Entire apartment</option>
                <option value="studio">Studio</option>
                <option value="house">House</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Why are you rentalting?</label>
            <select
              value={listingData.reasonForRentalting}
              onChange={(e) => setListingData(prev => ({ ...prev, reasonForRentalting: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select reason</option>
              {rentaltingReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={listingData.description}
              onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your space, what makes it special, house rules, etc."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            disabled={!listingData.title || !listingData.address || !listingData.reasonForRentalting}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.title && listingData.address && listingData.reasonForRentalting
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Property Owner Information
  if (currentStep === 2) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Property Owner Information</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle size={20} className="text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Verification Required</h3>
              <p className="text-sm text-yellow-700">
                We need to verify with your property owner/landlord that you have permission to rental. This protects both you and potential renters.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Property Owner Name</label>
            <input
              type="text"
              value={listingData.ownerName}
              onChange={(e) => setListingData(prev => ({ ...prev, ownerName: e.target.value }))}
              placeholder="Full name of your landlord/property owner"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Owner Email</label>
            <input
              type="email"
              value={listingData.ownerEmail}
              onChange={(e) => setListingData(prev => ({ ...prev, ownerEmail: e.target.value }))}
              placeholder="owner@email.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Owner Phone Number</label>
            <input
              type="tel"
              value={listingData.ownerPhone}
              onChange={(e) => setListingData(prev => ({ ...prev, ownerPhone: e.target.value }))}
              placeholder="(555) 123-4567"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your relationship to the owner</label>
            <select
              value={listingData.ownerRelationship}
              onChange={(e) => setListingData(prev => ({ ...prev, ownerRelationship: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="landlord">They are my landlord</option>
              <option value="parent">They are my parent/guardian</option>
              <option value="roommate">They are my roommate (on the lease)</option>
              <option value="property-manager">They are the property manager</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Upload Current Lease */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Your Current Lease (Optional but Recommended)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText size={32} className="mx-auto text-gray-400 mb-2" />
              <label className="cursor-pointer">
                <span className="text-brand-500 font-medium hover:underline">
                  Upload lease document
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-1">
                This helps verify your right to rental
              </p>
            </div>
            
            {documents.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-green-600">
                  ✓ Lease document uploaded
                </p>
              </div>
            )}
          </div>

          {/* Owner Approval Status */}
          {ownerApprovalSent && (
            <div className={`p-4 rounded-lg border ${
              listingData.ownerVerified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-brand-50 border-brand-200'
            }`}>
              <div className="flex items-center">
                {listingData.ownerVerified ? (
                  <>
                    <Check size={20} className="text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Owner approval received!</span>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500 mr-2"></div>
                    <span className="text-blue-800 font-medium">Waiting for owner approval...</span>
                  </>
                )}
              </div>
              {!listingData.ownerVerified && (
                <p className="text-sm text-brand-600 mt-2">
                  We've sent a verification request to {listingData.ownerEmail}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          {!ownerApprovalSent ? (
            <button
              onClick={sendOwnerApprovalRequest}
              disabled={!listingData.ownerName || !listingData.ownerEmail}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                listingData.ownerName && listingData.ownerEmail
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              Request Owner Approval
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!listingData.ownerVerified}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                listingData.ownerVerified
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Pricing & Terms
  if (currentStep === 3) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Pricing & Terms</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Suggested Monthly Rent ($)</label>
              <input
                type="number"
                value={listingData.suggestedRent}
                onChange={(e) => setListingData(prev => ({ ...prev, suggestedRent: e.target.value }))}
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-500 mt-1">Owner can adjust this amount</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Your Current Rent</label>
              <input
                type="number"
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">For reference only</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Available From</label>
              <input
                type="date"
                value={listingData.availableFrom}
                onChange={(e) => setListingData(prev => ({ ...prev, availableFrom: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Available Until</label>
              <input
                type="date"
                value={listingData.availableTo}
                onChange={(e) => setListingData(prev => ({ ...prev, availableTo: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Special Terms */}
          <div>
            <label className="block text-sm font-medium mb-2">Guest Policy</label>
            <input
              type="text"
              value={listingData.guestPolicy}
              onChange={(e) => setListingData(prev => ({ ...prev, guestPolicy: e.target.value }))}
              placeholder="e.g., Guests welcome with 24hr notice"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cleaning Arrangement</label>
            <input
              type="text"
              value={listingData.cleaningArrangement}
              onChange={(e) => setListingData(prev => ({ ...prev, cleaningArrangement: e.target.value }))}
              placeholder="e.g., Shared cleaning schedule, personal spaces only"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Key/Access Arrangement</label>
            <input
              type="text"
              value={listingData.keyAccess}
              onChange={(e) => setListingData(prev => ({ ...prev, keyAccess: e.target.value }))}
              placeholder="e.g., Spare key provided, digital lock code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Special Terms or Notes</label>
            <textarea
              value={listingData.specialTerms}
              onChange={(e) => setListingData(prev => ({ ...prev, specialTerms: e.target.value }))}
              placeholder="Any other important information rentalter should know..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            disabled={!listingData.suggestedRent || !listingData.availableFrom}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.suggestedRent && listingData.availableFrom
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Photos & Amenities
  if (currentStep === 4) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Photos & Amenities</h2>
        
        {/* Photo Upload */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Property Photos</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-brand-500 font-medium hover:underline">
                Upload photos of your space
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Show your room, common areas, and any special features
            </p>
          </div>
        </div>

        {/* Photo Gallery */}
        {propertyPhotos.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Uploaded Photos ({propertyPhotos.length})</h3>
            <div className="grid grid-cols-2 gap-4">
              {propertyPhotos.map((photo, index) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview}
                    alt={`Property ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setPropertyPhotos(prev => prev.filter(p => p.id !== photo.id))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Available Amenities</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableAmenities.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  listingData.amenities.includes(amenity)
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-gray-300 text-gray-700 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{amenity}</span>
                  {listingData.amenities.includes(amenity) && (
                    <Check size={16} className="text-brand-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(5)}
            className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Review & Submit
  if (currentStep === 5) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Review Your Listing</h2>
        
        {/* Important Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Check size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 mb-1">Owner Approved ✓</h3>
              <p className="text-sm text-green-700">
                {listingData.ownerName} has approved this listing. Your property will be reviewed by our team and go live within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Listing Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold">{listingData.title}</h3>
            <span className="text-xl font-bold text-green-600">${listingData.suggestedRent}/mo</span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin size={16} className="mr-2" />
            <span className="text-sm">{listingData.address}</span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-3">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm">
              {new Date(listingData.availableFrom).toLocaleDateString()} - {new Date(listingData.availableTo).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">{listingData.description}</p>
          
          {propertyPhotos.length > 0 && (
            <div className="flex space-x-2 mb-3">
              {propertyPhotos.slice(0, 3).map((photo, index) => (
                <img
                  key={photo.id}
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded"
                />
              ))}
              {propertyPhotos.length > 3 && (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                  +{propertyPhotos.length - 3} more
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Listed by: {listingData.studentName}</span>
            <span>Owner: {listingData.ownerName}</span>
          </div>
        </div>

        {/* Final Terms */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Terms</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Your property owner maintains final control over pricing and lease terms</li>
            <li>• All applications must be approved by both you and the owner</li>
            <li>• You are responsible for coordinating move-in/move-out with the rentalter</li>
            <li>• Rentra will handle payments and provide protection for all parties</li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Next Steps After Listing</h3>
          <div className="text-sm text-brand-600 space-y-2">
            <p>• Create a legally binding lease contract to protect yourself and your sublessee</p>
            <p>• Set up payment collection and security deposit management</p>
            <p>• Screen potential sublessees with our verification tools</p>
          </div>
          <button
            onClick={() => {
              // This would navigate to the lease contract manager
              alert('After submitting, you can create a lease contract in your profile under "Student Features"');
            }}
            className="mt-3 text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center"
          >
            <FileText size={16} className="mr-1" />
            Learn about lease contracts →
          </button>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(4)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Submit for Review
          </button>
        </div>
      </div>
    );
  }
};

export default StudentListingForm;