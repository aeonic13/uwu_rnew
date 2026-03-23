import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Eye, Home, User, Clock, MessageSquare, FileText, AlertCircle, Star } from 'lucide-react';

const OwnerApprovalDashboard = ({ onBack, onApprove, onReject, onMessage }) => {
  const [pendingListings, setPendingListings] = useState([
    {
      id: 'sl-001',
      status: 'pending',
      submittedDate: new Date('2024-01-15'),
      studentInfo: {
        name: 'Emily Chen',
        email: 'emily.chen@ucla.edu',
        phone: '+1 (555) 123-4567',
        university: 'UCLA',
        year: 'Junior',
        major: 'Computer Science',
        rating: 4.8,
        reviews: 12,
        verificationStatus: 'verified'
      },
      propertyInfo: {
        title: 'Spacious Studio Near Campus',
        type: 'Studio',
        address: '1234 Westwood Blvd, Los Angeles, CA 90024',
        rent: 1200,
        deposit: 500,
        availableFrom: new Date('2024-02-01'),
        availableTo: new Date('2024-06-30'),
        reason: 'Study abroad program - Spring semester in London',
        photos: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200'],
        amenities: ['WiFi', 'Laundry', 'Parking', 'Pet-friendly']
      },
      ownerVerification: {
        status: 'pending',
        contactAttempts: 2,
        lastContactDate: new Date('2024-01-16'),
        verificationMethod: 'phone',
        notes: 'Left voicemail, awaiting callback'
      }
    },
    {
      id: 'sl-002',
      status: 'verified',
      submittedDate: new Date('2024-01-12'),
      studentInfo: {
        name: 'Michael Rodriguez',
        email: 'm.rodriguez@usc.edu',
        phone: '+1 (555) 987-6543',
        university: 'USC',
        year: 'Senior',
        major: 'Business Administration',
        rating: 4.5,
        reviews: 8,
        verificationStatus: 'verified'
      },
      propertyInfo: {
        title: 'Shared 2BR Apartment',
        type: '1 bedroom in 2BR',
        address: '5678 University Ave, Los Angeles, CA 90007',
        rent: 900,
        deposit: 450,
        availableFrom: new Date('2024-03-01'),
        availableTo: new Date('2024-08-31'),
        reason: 'Internship in San Francisco for summer',
        photos: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
        amenities: ['WiFi', 'Gym', 'Pool', 'Study Room']
      },
      ownerVerification: {
        status: 'verified',
        contactAttempts: 1,
        lastContactDate: new Date('2024-01-13'),
        verificationMethod: 'phone',
        notes: 'Owner confirmed, ready for approval'
      }
    }
  ]);

  const [selectedListing, setSelectedListing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleApprove = (listingId) => {
    setPendingListings(prev => 
      prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: 'approved', approvedDate: new Date() }
          : listing
      )
    );
    onApprove?.(listingId);
  };

  const handleReject = (listingId, reason) => {
    setPendingListings(prev => 
      prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: 'rejected', rejectedDate: new Date(), rejectionReason: reason }
          : listing
      )
    );
    onReject?.(listingId, reason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'verified': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVerificationStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      case 'verified': return <CheckCircle className="text-green-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      default: return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const filteredListings = pendingListings.filter(listing => {
    if (filterStatus === 'all') return true;
    return listing.status === filterStatus;
  });

  if (selectedListing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="p-4 flex items-center justify-between">
            <button 
              onClick={() => setSelectedListing(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold">Listing Review</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedListing.status)}`}>
              {selectedListing.status.charAt(0).toUpperCase() + selectedListing.status.slice(1)}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <User size={20} className="mr-2 text-blue-600" />
              Student Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{selectedListing.studentInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">University:</span>
                <span>{selectedListing.studentInfo.university} - {selectedListing.studentInfo.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Major:</span>
                <span>{selectedListing.studentInfo.major}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-400 fill-current mr-1" />
                  <span>{selectedListing.studentInfo.rating}</span>
                  <span className="text-gray-500 ml-1">({selectedListing.studentInfo.reviews} reviews)</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <div className="text-right">
                  <div>{selectedListing.studentInfo.email}</div>
                  <div className="text-sm text-gray-500">{selectedListing.studentInfo.phone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Home size={20} className="mr-2 text-green-600" />
              Property Details
            </h3>
            
            {/* Photos */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {selectedListing.propertyInfo.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Property ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="font-medium">{selectedListing.propertyInfo.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{selectedListing.propertyInfo.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="text-right text-sm">{selectedListing.propertyInfo.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rent:</span>
                <span className="font-semibold">${selectedListing.propertyInfo.rent}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit:</span>
                <span>${selectedListing.propertyInfo.deposit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span>
                  {selectedListing.propertyInfo.availableFrom.toLocaleDateString()} - {' '}
                  {selectedListing.propertyInfo.availableTo.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Reason:</span>
                <span className="text-right text-sm max-w-xs">{selectedListing.propertyInfo.reason}</span>
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-4">
              <div className="text-gray-600 mb-2">Amenities:</div>
              <div className="flex flex-wrap gap-2">
                {selectedListing.propertyInfo.amenities.map((amenity, index) => (
                  <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Owner Verification Status */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <FileText size={20} className="mr-2 text-purple-600" />
              Owner Verification
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <div className="flex items-center">
                  {getVerificationStatusIcon(selectedListing.ownerVerification.status)}
                  <span className="ml-2 capitalize">{selectedListing.ownerVerification.status}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact Attempts:</span>
                <span>{selectedListing.ownerVerification.contactAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Contact:</span>
                <span>{selectedListing.ownerVerification.lastContactDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Notes:</span>
                <span className="text-right text-sm max-w-xs">{selectedListing.ownerVerification.notes}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {selectedListing.status === 'verified' && (
            <div className="space-y-3">
              <button
                onClick={() => handleApprove(selectedListing.id)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
              >
                <CheckCircle size={20} className="mr-2" />
                Approve Listing
              </button>
              
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection:');
                  if (reason) handleReject(selectedListing.id, reason);
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center"
              >
                <XCircle size={20} className="mr-2" />
                Reject Listing
              </button>

              <button
                onClick={() => onMessage?.(selectedListing.studentInfo)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
              >
                <MessageSquare size={20} className="mr-2" />
                Message Student
              </button>
            </div>
          )}

          {selectedListing.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock size={20} className="text-yellow-600 mr-2" />
                <div>
                  <div className="font-medium text-yellow-800">Verification in Progress</div>
                  <div className="text-sm text-yellow-700">We're still verifying ownership. Actions will be available once verification is complete.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Student Listing Approvals</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          {[
            { key: 'all', label: 'All', count: pendingListings.length },
            { key: 'pending', label: 'Pending', count: pendingListings.filter(l => l.status === 'pending').length },
            { key: 'verified', label: 'Ready', count: pendingListings.filter(l => l.status === 'verified').length },
            { key: 'approved', label: 'Approved', count: pendingListings.filter(l => l.status === 'approved').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                filterStatus === filter.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">There are no student listings matching your filter.</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{listing.propertyInfo.title}</h3>
                    <p className="text-gray-600 text-sm">{listing.propertyInfo.address}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${listing.propertyInfo.rent}/month
                  </div>
                  <div className="text-sm text-gray-500">
                    Submitted {listing.submittedDate.toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-1" />
                    <span className="text-sm">{listing.studentInfo.name}</span>
                    <Star size={14} className="text-yellow-400 fill-current ml-2 mr-1" />
                    <span className="text-sm text-gray-600">{listing.studentInfo.rating}</span>
                  </div>
                  
                  <div className="flex items-center">
                    {getVerificationStatusIcon(listing.ownerVerification.status)}
                    <span className="text-sm ml-1 capitalize">{listing.ownerVerification.status}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedListing(listing)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Eye size={18} className="mr-2" />
                    Review Details
                  </button>
                  
                  {listing.status === 'verified' && (
                    <>
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) handleReject(listing.id, reason);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerApprovalDashboard;