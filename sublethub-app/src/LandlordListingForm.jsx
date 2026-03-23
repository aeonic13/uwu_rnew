import React, { useState } from 'react';
import { Camera, Upload, FileText, DollarSign, MapPin, Calendar, Home, Plus, X, Check, Scan, Eye, EyeOff } from 'lucide-react';

const LandlordListingForm = ({ onSubmit, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    address: '',
    university: '',
    rent: '',
    deposit: '',
    availableFrom: '',
    availableTo: '',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    utilitiesIncluded: [],
    petPolicy: 'no-pets',
    smokingPolicy: 'no-smoking'
  });

  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [utilityBills, setUtilityBills] = useState([]);
  const [documents, setDocuments] = useState([]);

  const availableAmenities = [
    'WiFi', 'Laundry', 'Parking', 'Furnished', 'Kitchen', 'Garden', 
    'Pet-friendly', 'Gym', 'AC', 'Dishwasher', 'Pool', 'Balcony',
    'In-unit Laundry', 'Study Space', 'Security', 'Storage', 'Elevator'
  ];

  const universities = [
    'USC', 'UCLA', 'NYU', 'Stanford', 'Harvard', 'MIT', 
    'UC Berkeley', 'Columbia', 'Yale', 'Princeton'
  ];

  const utilityTypes = [
    { id: 'electricity', name: 'Electricity', color: 'yellow' },
    { id: 'gas', name: 'Gas', color: 'red' },
    { id: 'water', name: 'Water/Sewer', color: 'blue' },
    { id: 'internet', name: 'Internet', color: 'green' },
    { id: 'trash', name: 'Trash/Recycling', color: 'gray' }
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

  const handleUtilityBillUpload = (e, utilityType) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUtilityBills(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          type: utilityType,
          amount: '',
          month: new Date().toISOString().slice(0, 7), // YYYY-MM
          isProcessed: false,
          redactedInfo: []
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentUpload = (e, docType) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: reader.result,
          type: docType,
          isScanned: false,
          extractedData: null
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const simulateDocumentScan = (docId) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? {
            ...doc, 
            isScanned: true,
            extractedData: {
              propertyAddress: listingData.address || "123 Main St, Los Angeles, CA",
              monthlyRent: listingData.rent || "1200",
              leaseStart: listingData.availableFrom || "2024-01-01",
              leaseEnd: listingData.availableTo || "2024-12-31"
            }
          }
        : doc
    ));
  };

  const simulateBillProcessing = (billId) => {
    setUtilityBills(prev => prev.map(bill => 
      bill.id === billId 
        ? {
            ...bill,
            isProcessed: true,
            redactedInfo: ['Account Number: ****1234', 'SSN: ***-**-****'],
            amount: Math.floor(Math.random() * 200 + 50).toString() // Random bill amount
          }
        : bill
    ));
  };

  const toggleAmenity = (amenity) => {
    setListingData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const removePhoto = (photoId) => {
    setPropertyPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleSubmit = () => {
    const completeListingData = {
      ...listingData,
      photos: propertyPhotos,
      utilityBills,
      documents,
      createdAt: new Date().toISOString(),
      status: 'active',
      views: 0,
      applicants: []
    };
    
    onSubmit(completeListingData);
  };

  // Step 1: Basic Property Info
  if (currentStep === 1) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">List Your Property</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Property Title</label>
            <input
              type="text"
              value={listingData.title}
              onChange={(e) => setListingData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Cozy 1BR near USC Campus"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <input
              type="text"
              value={listingData.address}
              onChange={(e) => setListingData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address including city and state"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nearest University</label>
              <select
                value={listingData.university}
                onChange={(e) => setListingData(prev => ({ ...prev, university: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select University</option>
                {universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <select
                value={listingData.propertyType}
                onChange={(e) => setListingData(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Private Room</option>
                <option value="studio">Studio</option>
                <option value="condo">Condo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <select
                value={listingData.bedrooms}
                onChange={(e) => setListingData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num} Bedroom{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <select
                value={listingData.bathrooms}
                onChange={(e) => setListingData(prev => ({ ...prev, bathrooms: parseFloat(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Bathroom</option>
                <option value={1.5}>1.5 Bathrooms</option>
                <option value={2}>2 Bathrooms</option>
                <option value={2.5}>2.5 Bathrooms</option>
                <option value={3}>3+ Bathrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={listingData.description}
              onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your property, neighborhood, and what makes it special..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            disabled={!listingData.title || !listingData.address}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.title && listingData.address
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Photos & Media
  if (currentStep === 2) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Property Photos</h2>
        
        {/* Photo Upload */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-blue-600 font-medium hover:underline">
                Upload property photos
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
              Add multiple photos to showcase your property
            </p>
          </div>
        </div>

        {/* Photo Gallery */}
        {propertyPhotos.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Property Photos ({propertyPhotos.length})</h3>
            <div className="grid grid-cols-2 gap-4">
              {propertyPhotos.map((photo, index) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview}
                    alt={`Property ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Cover Photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            disabled={propertyPhotos.length === 0}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              propertyPhotos.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Pricing & Availability
  if (currentStep === 3) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Pricing & Availability</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Rent ($)</label>
              <input
                type="number"
                value={listingData.rent}
                onChange={(e) => setListingData(prev => ({ ...prev, rent: e.target.value }))}
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Security Deposit ($)</label>
              <input
                type="number"
                value={listingData.deposit}
                onChange={(e) => setListingData(prev => ({ ...prev, deposit: e.target.value }))}
                placeholder="1200"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Available From</label>
              <input
                type="date"
                value={listingData.availableFrom}
                onChange={(e) => setListingData(prev => ({ ...prev, availableFrom: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Available Until</label>
              <input
                type="date"
                value={listingData.availableTo}
                onChange={(e) => setListingData(prev => ({ ...prev, availableTo: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Policies */}
          <div>
            <label className="block text-sm font-medium mb-2">Pet Policy</label>
            <select
              value={listingData.petPolicy}
              onChange={(e) => setListingData(prev => ({ ...prev, petPolicy: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no-pets">No Pets</option>
              <option value="cats-only">Cats Only</option>
              <option value="dogs-only">Dogs Only</option>
              <option value="pets-welcome">All Pets Welcome</option>
              <option value="case-by-case">Case by Case</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Smoking Policy</label>
            <select
              value={listingData.smokingPolicy}
              onChange={(e) => setListingData(prev => ({ ...prev, smokingPolicy: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no-smoking">No Smoking</option>
              <option value="outdoor-only">Outdoor Only</option>
              <option value="designated-areas">Designated Areas</option>
              <option value="smoking-allowed">Smoking Allowed</option>
            </select>
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
            disabled={!listingData.rent || !listingData.deposit}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              listingData.rent && listingData.deposit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Amenities
  if (currentStep === 4) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Amenities & Features</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Select all amenities that apply:</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableAmenities.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  listingData.amenities.includes(amenity)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{amenity}</span>
                  {listingData.amenities.includes(amenity) && (
                    <Check size={16} className="text-blue-600" />
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
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Utility Bills & Documents
  if (currentStep === 5) {
    return (
      <div className="p-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">Utility Bills & Documents</h2>
        
        {/* Utility Bills Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Upload Recent Utility Bills</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload your recent utility bills to help renters understand average costs. We'll automatically redact sensitive information.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {utilityTypes.map(utility => (
              <div key={utility.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-2">{utility.name}</h4>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-blue-300">
                    <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                    <span className="text-xs text-gray-600">Upload Bill</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleUtilityBillUpload(e, utility.id)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Uploaded Bills */}
          {utilityBills.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Uploaded Bills</h4>
              {utilityBills.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 bg-${utilityTypes.find(t => t.id === bill.type)?.color || 'gray'}-400`}></div>
                    <div>
                      <p className="font-medium">{utilityTypes.find(t => t.id === bill.type)?.name} Bill</p>
                      <p className="text-xs text-gray-500">{bill.month}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {bill.isProcessed ? (
                      <div className="flex items-center text-green-600">
                        <Check size={16} className="mr-1" />
                        <span className="text-sm">Processed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => simulateBillProcessing(bill.id)}
                        className="text-blue-600 text-sm hover:underline flex items-center"
                      >
                        <Scan size={16} className="mr-1" />
                        Process
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Legal Documents (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload lease templates or other documents. Our AI will scan and extract key information.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-300">
                  <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Lease Agreement</span>
                  <p className="text-xs text-gray-500">PDF, DOC, or Image</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => handleDocumentUpload(e, 'lease')}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-300">
                  <FileText size={24} className="mx-auto mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Property Deed</span>
                  <p className="text-xs text-gray-500">PDF, DOC, or Image</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => handleDocumentUpload(e, 'deed')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Documents */}
          {documents.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium">Uploaded Documents</h4>
              {documents.map(doc => (
                <div key={doc.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{doc.type} Document</p>
                      <p className="text-xs text-gray-500">{doc.file.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.isScanned ? (
                        <div className="flex items-center text-green-600">
                          <Check size={16} className="mr-1" />
                          <span className="text-sm">Scanned</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => simulateDocumentScan(doc.id)}
                          className="text-blue-600 text-sm hover:underline flex items-center"
                        >
                          <Scan size={16} className="mr-1" />
                          Scan
                        </button>
                      )}
                    </div>
                  </div>
                  {doc.extractedData && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <p className="text-green-800 font-medium">Extracted Information:</p>
                      <p>• Rent: ${doc.extractedData.monthlyRent}/month</p>
                      <p>• Lease Term: {doc.extractedData.leaseStart} to {doc.extractedData.leaseEnd}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
            Publish Listing
          </button>
        </div>
      </div>
    );
  }
};

export default LandlordListingForm;