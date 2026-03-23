import React, { useState, useMemo } from 'react';
import { Search, Sliders, DollarSign, Calendar, Home, Users, X, Check, BedDouble, Bath } from 'lucide-react';

const AdvancedSearch = ({ onSearch, onClose, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    minRent: initialFilters.minRent || '',
    maxRent: initialFilters.maxRent || '',
    keywords: initialFilters.keywords || '',
    amenities: initialFilters.amenities || [],
    termLength: initialFilters.termLength || 'any',
    leaseType: initialFilters.leaseType || 'any',
    moveInDate: initialFilters.moveInDate || '',
    propertyType: initialFilters.propertyType || 'any',
    bedrooms: initialFilters.bedrooms || 'any',
    bathrooms: initialFilters.bathrooms || 'any',
    ...initialFilters
  });

  const availableAmenities = [
    'WiFi', 'Laundry', 'Parking', 'Furnished', 'Kitchen', 'Garden', 
    'Pet-friendly', 'Gym', 'AC', 'Dishwasher', 'Pool', 'Balcony',
    'In-unit Laundry', 'Study Space', 'Security', 'Storage'
  ];

  const termLengthOptions = [
    { value: 'any', label: 'Any Term Length' },
    { value: '1-3', label: '1-3 months' },
    { value: '4-6', label: '4-6 months' },
    { value: '7-9', label: '7-9 months' },
    { value: '10-12', label: '10-12 months' },
    { value: '12+', label: '12+ months' }
  ];

  const leaseTypeOptions = [
    { value: 'any', label: 'Any Arrangement' },
    { value: 'lease', label: 'Lease (temporary)' },
    { value: 'lease-takeover', label: 'Lease takeover' },
    { value: 'roommate', label: 'Join existing lease as roommate' },
    { value: 'private-room', label: 'Private room in shared space' }
  ];

  const propertyTypeOptions = [
    { value: 'any', label: 'Any Type' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'House', label: 'House' },
    { value: 'Studio', label: 'Studio' },
    { value: 'Single Room', label: 'Single Room' },
    { value: 'Condo', label: 'Condo' },
    { value: 'Townhouse', label: 'Townhouse' }
  ];

  const bedroomOptions = [
    { value: 'any', label: 'Any' },
    { value: '0', label: 'Studio' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5+', label: '5+' }
  ];

  const bathroomOptions = [
    { value: 'any', label: 'Any' },
    { value: '1', label: '1' },
    { value: '1.5', label: '1.5' },
    { value: '2', label: '2' },
    { value: '2.5', label: '2.5' },
    { value: '3', label: '3' },
    { value: '4+', label: '4+' }
  ];

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({
      minRent: '',
      maxRent: '',
      keywords: '',
      amenities: [],
      termLength: 'any',
      leaseType: 'any',
      moveInDate: '',
      propertyType: 'any',
      bedrooms: 'any',
      bathrooms: 'any'
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minRent || filters.maxRent) count++;
    if (filters.keywords) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.termLength !== 'any') count++;
    if (filters.leaseType !== 'any') count++;
    if (filters.moveInDate) count++;
    if (filters.propertyType !== 'any') count++;
    if (filters.bedrooms !== 'any') count++;
    if (filters.bathrooms !== 'any') count++;
    return count;
  }, [filters]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Advanced Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium mb-2">Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by location, description, etc."
                value={filters.keywords}
                onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Monthly Rent
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minRent}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRent: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum</p>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxRent}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRent: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum</p>
              </div>
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-1" />
              Move-in Date
            </label>
            <input
              type="date"
              value={filters.moveInDate}
              onChange={(e) => setFilters(prev => ({ ...prev, moveInDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Properties available ±2 weeks from this date</p>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Home size={16} className="inline mr-1" />
              Property Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {propertyTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, propertyType: option.value }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    filters.propertyType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <BedDouble size={16} className="inline mr-1" />
              Bedrooms
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bedroomOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, bedrooms: option.value }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    filters.bedrooms === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Bath size={16} className="inline mr-1" />
              Bathrooms
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bathroomOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, bathrooms: option.value }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    filters.bathrooms === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Term Length */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-1" />
              Term Length
            </label>
            <div className="grid grid-cols-2 gap-2">
              {termLengthOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, termLength: option.value }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    filters.termLength === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lease Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={16} className="inline mr-1" />
              Arrangement Type
            </label>
            <div className="space-y-2">
              {leaseTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, leaseType: option.value }))}
                  className={`w-full p-3 border rounded-lg text-left font-medium transition-colors ${
                    filters.leaseType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {filters.leaseType === option.value && (
                      <Check size={20} className="text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Users size={16} className="inline mr-1" />
              Amenities ({filters.amenities.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    filters.amenities.includes(amenity)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{amenity}</span>
                    {filters.amenities.includes(amenity) && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex space-x-3">
            <button
              onClick={clearFilters}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Clear All
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
            >
              <Search size={20} className="mr-2" />
              Search {activeFiltersCount > 0 && `(${activeFiltersCount} filters)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;