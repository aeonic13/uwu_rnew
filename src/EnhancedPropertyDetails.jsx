import React, { useState } from 'react';
import { MapPin, Calendar, DollarSign, User, MessageCircle, Heart, Star, Shield, Zap, Droplets, Thermometer, Wifi, Car, Utensils, Home, Users, Info, Camera, ArrowLeft } from 'lucide-react';

const EnhancedPropertyDetails = ({ listing, onBack, onMessage, onApply, onToggleFavorite, isFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Enhanced utility cost data
  const utilityCosts = {
    electricity: { avg: 85, range: '60-120', icon: Zap, color: 'yellow' },
    water: { avg: 35, range: '25-50', icon: Droplets, color: 'blue' },
    gas: { avg: 45, range: '30-70', icon: Thermometer, color: 'red' },
    internet: { avg: 60, range: '50-80', icon: Wifi, color: 'green' }
  };

  const totalUtilityCost = Object.values(utilityCosts).reduce((sum, utility) => sum + utility.avg, 0);

  // Enhanced amenities with categories and icons
  const amenityCategories = {
    'Essential': [
      { name: 'WiFi', icon: Wifi, available: listing.amenities.includes('WiFi') },
      { name: 'Laundry', icon: Home, available: listing.amenities.includes('Laundry') },
      { name: 'Parking', icon: Car, available: listing.amenities.includes('Parking') },
      { name: 'Kitchen', icon: Utensils, available: listing.amenities.includes('Kitchen') }
    ],
    'Comfort': [
      { name: 'Furnished', icon: Home, available: listing.amenities.includes('Furnished') },
      { name: 'AC', icon: Thermometer, available: listing.amenities.includes('AC') },
      { name: 'Study Space', icon: Home, available: listing.amenities.includes('Study Space') },
      { name: 'Balcony', icon: Home, available: listing.amenities.includes('Balcony') }
    ],
    'Community': [
      { name: 'Gym', icon: Users, available: listing.amenities.includes('Gym') },
      { name: 'Pool', icon: Droplets, available: listing.amenities.includes('Pool') },
      { name: 'Garden', icon: Home, available: listing.amenities.includes('Garden') },
      { name: 'Pet-friendly', icon: Heart, available: listing.amenities.includes('Pet-friendly') }
    ]
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  return (
    <div className="pb-20">
      {/* Image Gallery */}
      <div className="relative">
        <img
          src={listing.images[currentImageIndex]}
          alt={listing.title}
          className="w-full h-80 object-cover"
        />
        
        {/* Image Navigation */}
        {listing.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              →
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {listing.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => onToggleFavorite(listing.id)}
            className="p-2 rounded-full bg-white shadow-md"
          >
            <Heart
              size={24}
              className={isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}
            />
          </button>
          <button className="p-2 rounded-full bg-white shadow-md">
            <Camera size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Distance/Location Badge */}
        {listing.distance && (
          <div className="absolute top-4 left-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {listing.distance} miles from campus
          </div>
        )}
      </div>
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold flex-1 pr-4">{listing.title}</h1>
            <div className="text-right">
              <span className="text-3xl font-bold text-green-600">${listing.price}</span>
              <span className="text-gray-500">/month</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin size={18} className="mr-2" />
            <span>{listing.location}</span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-4">
            <Calendar size={18} className="mr-2" />
            <span>{listing.dates}</span>
          </div>

          {/* Lease Type Badge */}
          <div className="flex items-center space-x-2 mb-4">
            {listing.leaseType && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {listing.leaseType === 'lease' && 'Lease Available'}
                {listing.leaseType === 'roommate' && 'Roommate Wanted'}
                {listing.leaseType === 'lease-takeover' && 'Lease Takeover'}
              </span>
            )}
          </div>
        </div>

        {/* Utility Costs */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <DollarSign size={20} className="mr-2" />
            Estimated Monthly Costs
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(utilityCosts).map(([utility, data]) => {
                const IconComponent = data.icon;
                return (
                  <div key={utility} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full bg-${data.color}-100 mr-3`}>
                        <IconComponent size={16} className={`text-${data.color}-600`} />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{utility}</p>
                        <p className="text-xs text-gray-500">${data.range}</p>
                      </div>
                    </div>
                    <span className="font-semibold">${data.avg}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <div className="flex items-center">
                <Info size={16} className="text-blue-600 mr-2" />
                <span className="font-medium">Total Utilities (avg)</span>
              </div>
              <span className="text-lg font-bold">${totalUtilityCost}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              *Estimates based on average usage in the area. Actual costs may vary.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">About This Property</h3>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>
          
          {/* Additional Property Details */}
          {listing.additionalDetails && (
            <div className="mt-4 space-y-2">
              {listing.additionalDetails.map((detail, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amenities by Category */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Amenities & Features</h3>
          {Object.entries(amenityCategories).map(([category, amenities]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map(amenity => {
                  const IconComponent = amenity.icon;
                  return (
                    <div
                      key={amenity.name}
                      className={`flex items-center p-3 rounded-lg border ${
                        amenity.available
                          ? 'border-green-200 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <IconComponent size={16} className="mr-2" />
                      <span className="text-sm font-medium">{amenity.name}</span>
                      {amenity.available && (
                        <div className="ml-auto w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* House Rules */}
        {listing.houseRules && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">House Rules</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="space-y-2">
                {listing.houseRules.map((rule, index) => (
                  <li key={index} className="flex items-start text-sm text-yellow-800">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Owner Information */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">Property Owner</h3>
          <div className="flex items-center mb-4">
            <img
              src={listing.owner.avatar}
              alt={listing.owner.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="font-semibold text-lg">{listing.owner.name}</span>
                {listing.owner.verified && (
                  <Shield size={18} className="ml-2 text-blue-500" />
                )}
              </div>
              <div className="flex items-center mb-2">
                <Star size={16} className="text-yellow-400 fill-current mr-1" />
                <span className="font-medium">{listing.owner.rating}</span>
                <span className="text-gray-500 ml-1">({listing.owner.reviewCount || 12} reviews)</span>
              </div>
              {listing.owner.responseTime && (
                <p className="text-sm text-gray-600">
                  Responds within {listing.owner.responseTime}
                </p>
              )}
            </div>
          </div>
          
          {/* Owner Bio */}
          {listing.owner.bio && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">{listing.owner.bio}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onApply(listing)}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center text-lg hover:bg-blue-700 transition-colors"
            >
              <DollarSign size={20} className="mr-2" />
              Apply & Pay Securely
            </button>
            
            <button
              onClick={() => onMessage(listing)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <MessageCircle size={20} className="mr-2" />
              Message Owner
            </button>
          </div>

          {/* Safety & Trust */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield size={20} className="text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Safety & Trust</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Secure payments protected by Rentra</li>
              <li>• Verified university student owner</li>
              <li>• 24/7 customer support available</li>
              <li>• Money-back guarantee if listing doesn't match</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropertyDetails;