import React, { useState, useMemo } from 'react';
import { MapPin, Sliders, ArrowLeft, Search } from 'lucide-react';

// University data with coordinates for distance calculations
const universitiesData = [
  { id: 'usc', name: 'University of Southern California (USC)', lat: 34.0224, lng: -118.2851, city: 'Los Angeles, CA' },
  { id: 'ucla', name: 'University of California, Los Angeles (UCLA)', lat: 34.0689, lng: -118.4452, city: 'Los Angeles, CA' },
  { id: 'nyu', name: 'New York University (NYU)', lat: 40.7282, lng: -73.9942, city: 'New York, NY' },
  { id: 'stanford', name: 'Stanford University', lat: 37.4275, lng: -122.1697, city: 'Stanford, CA' },
  { id: 'harvard', name: 'Harvard University', lat: 42.3770, lng: -71.1167, city: 'Cambridge, MA' },
  { id: 'mit', name: 'Massachusetts Institute of Technology (MIT)', lat: 42.3601, lng: -71.0942, city: 'Cambridge, MA' },
  { id: 'berkeley', name: 'UC Berkeley', lat: 37.8719, lng: -122.2585, city: 'Berkeley, CA' },
  { id: 'columbia', name: 'Columbia University', lat: 40.8075, lng: -73.9626, city: 'New York, NY' },
  { id: 'yale', name: 'Yale University', lat: 41.3163, lng: -72.9223, city: 'New Haven, CT' },
  { id: 'princeton', name: 'Princeton University', lat: 40.3431, lng: -74.6551, city: 'Princeton, NJ' }
];

// Sample listings with coordinates
const sampleListingsWithCoords = [
  {
    id: 1,
    title: "Cozy 1BR near USC Campus",
    price: 1200,
    location: "University Park, LA",
    university: "USC",
    dates: "Jan 2024 - June 2024",
    lat: 34.0224,
    lng: -118.2851,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
    description: "Perfect for exchange students! Fully furnished apartment just 5 minutes walk to campus.",
    amenities: ["WiFi", "Laundry", "Parking", "Furnished"],
    owner: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      rating: 4.8,
      verified: true
    }
  },
  {
    id: 2,
    title: "Shared House - UCLA Area",
    price: 850,
    location: "Westwood, LA",
    university: "UCLA",
    dates: "Feb 2024 - July 2024",
    lat: 34.0689,
    lng: -118.4452,
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
    description: "Looking for a clean, responsible student to share my house while I study in Barcelona!",
    amenities: ["WiFi", "Kitchen", "Garden", "Pet-friendly"],
    owner: {
      name: "Mike Rodriguez",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 3,
    title: "Studio Apartment - NYU",
    price: 1800,
    location: "Greenwich Village, NYC",
    university: "NYU",
    dates: "March 2024 - Aug 2024",
    lat: 40.7282,
    lng: -73.9942,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
    description: "Modern studio in the heart of NYC. Perfect for someone who wants the full city experience!",
    amenities: ["WiFi", "Gym", "Doorman", "AC"],
    owner: {
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      rating: 4.7,
      verified: true
    }
  },
  {
    id: 4,
    title: "Modern Loft near Stanford",
    price: 2200,
    location: "Palo Alto, CA",
    university: "Stanford",
    dates: "April 2024 - Sept 2024",
    lat: 37.4419,
    lng: -122.1430,
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400"],
    description: "Beautiful loft with high ceilings and modern amenities. Perfect for grad students!",
    amenities: ["WiFi", "Parking", "Furnished", "AC"],
    owner: {
      name: "Alex Kim",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      rating: 4.6,
      verified: true
    }
  },
  {
    id: 5,
    title: "Cozy Room near Harvard Square",
    price: 1600,
    location: "Cambridge, MA",
    university: "Harvard",
    dates: "Jan 2024 - May 2024",
    lat: 42.3736,
    lng: -71.1097,
    images: ["https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=400"],
    description: "Walking distance to Harvard Square with great cafes and bookstores nearby.",
    amenities: ["WiFi", "Kitchen", "Study Space", "Furnished"],
    owner: {
      name: "Jessica Park",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      rating: 4.9,
      verified: true
    }
  }
];

// Function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const UniversitySearch = ({ onBack, onSelectListing }) => {
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [showResults, setShowResults] = useState(false);

  // Filter universities based on search term
  const filteredUniversities = useMemo(() => {
    if (!searchTerm) return universitiesData;
    
    return universitiesData.filter(university =>
      university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      university.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Filter listings based on selected university and radius
  const filteredListings = useMemo(() => {
    if (!selectedUniversity) return [];

    return sampleListingsWithCoords.filter(listing => {
      const distance = calculateDistance(
        selectedUniversity.lat,
        selectedUniversity.lng,
        listing.lat,
        listing.lng
      );
      return distance <= radiusMiles;
    }).map(listing => ({
      ...listing,
      distance: calculateDistance(
        selectedUniversity.lat,
        selectedUniversity.lng,
        listing.lat,
        listing.lng
      ).toFixed(1)
    })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  }, [selectedUniversity, radiusMiles]);

  const handleUniversitySelect = (university) => {
    setSelectedUniversity(university);
    setShowResults(true);
  };

  const handleRadiusChange = (value) => {
    setRadiusMiles(value);
  };

  if (!showResults) {
    return (
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Find Housing Near Your University</h2>
          <p className="text-gray-600">Search for your university and discover nearby subletting options</p>
        </div>

        {/* University Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search universities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        {/* University List */}
        <div className="space-y-3">
          {filteredUniversities.map((university) => (
            <button
              key={university.id}
              onClick={() => handleUniversitySelect(university)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{university.name}</h3>
                  <p className="text-gray-600 text-sm">{university.city}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredUniversities.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Universities Found</h3>
            <p className="text-gray-500">Try searching with a different term</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      {/* Header with selected university */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">{selectedUniversity.name}</h3>
              <p className="text-sm text-gray-600">{selectedUniversity.city}</p>
            </div>
          </div>
          <button
            onClick={() => setShowResults(false)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Change University
          </button>
        </div>

        {/* Radius Slider */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              <Sliders size={16} className="inline mr-2" />
              Search Radius
            </label>
            <span className="text-sm font-semibold text-blue-600">
              {radiusMiles} {radiusMiles === 1 ? 'mile' : 'miles'}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="25"
            step="0.5"
            value={radiusMiles}
            onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5mi</span>
            <span>25mi</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {filteredListings.length} {filteredListings.length === 1 ? 'Property' : 'Properties'} Found
        </h3>
        {filteredListings.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Sorted by distance from {selectedUniversity.name}
          </p>
        )}
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Properties Found</h3>
          <p className="text-gray-500 mb-4">Try increasing your search radius</p>
          <button
            onClick={() => setRadiusMiles(Math.min(25, radiusMiles + 5))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Expand to {Math.min(25, radiusMiles + 5)} miles
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectListing(listing)}
            >
              <div className="relative">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  {listing.distance} miles away
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <span className="text-xl font-bold text-green-600">${listing.price}/mo</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{listing.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3">
                  <span className="text-sm">{listing.dates}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.amenities.slice(0, 3).map(amenity => (
                    <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {amenity}
                    </span>
                  ))}
                  {listing.amenities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{listing.amenities.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <img
                    src={listing.owner.avatar}
                    alt={listing.owner.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm font-medium">{listing.owner.name}</span>
                  <div className="ml-auto flex items-center">
                    <span className="text-sm">★ {listing.owner.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default UniversitySearch;