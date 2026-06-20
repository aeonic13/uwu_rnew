import React, { useState } from 'react';
import { ArrowLeft, User, Bell, Shield, CreditCard, Home, Heart, FileText, HelpCircle, MessageCircle, AlertTriangle, Map, DollarSign, MapPin } from 'lucide-react';

// Edit Profile View
export const EditProfileView = ({ user, onBack, onSave }) => {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    university: user?.university || '',
    major: user?.major || ''
  });

  const handleSave = () => {
    onSave(profile);
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Edit Profile</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">University</label>
          <input
            type="text"
            value={profile.university}
            onChange={(e) => setProfile(prev => ({ ...prev, university: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// My Listings View
export const MyListingsView = ({ user, onBack, listings = [] }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">My Listings</h2>
    </div>

    {listings.length === 0 ? (
      <div className="text-center py-12">
        <Home size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Listings Yet</h3>
        <p className="text-gray-500">Create your first listing to get started!</p>
      </div>
    ) : (
      <div className="space-y-4">
        {listings.map(listing => (
          <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">{listing.title}</h3>
            <p className="text-gray-600">{listing.location}</p>
            <p className="text-green-600 font-bold">${listing.price}/month</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Saved Properties View
export const SavedPropertiesView = ({ user, onBack, savedListings = [], onViewProperty }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Saved Properties</h2>
    </div>

    {savedListings.length === 0 ? (
      <div className="text-center py-12">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Saved Properties</h3>
        <p className="text-gray-500">Heart properties you like to save them here!</p>
      </div>
    ) : (
      <div className="space-y-4">
        {savedListings.map(listing => (
          <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">{listing.title}</h3>
            <p className="text-gray-600">{listing.location}</p>
            <p className="text-green-600 font-bold">${listing.price}/month</p>
            <button
              onClick={() => onViewProperty(listing)}
              className="mt-2 bg-brand-500 text-white px-4 py-2 rounded-lg"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Application History View
export const ApplicationHistoryView = ({ user, onBack, transactions = [] }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Application History</h2>
    </div>

    {transactions.length === 0 ? (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h3>
        <p className="text-gray-500">Your application history will appear here</p>
      </div>
    ) : (
      <div className="space-y-4">
        {transactions.map(transaction => (
          <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">Application #{transaction.id}</h3>
            <p className="text-gray-600">{transaction.date}</p>
            <p className="text-green-600 font-bold">${transaction.total}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Notification Settings View
export const NotificationSettingsView = ({ user, onBack }) => {
  const [settings, setSettings] = useState({
    messages: true,
    tours: true,
    applications: true,
    payments: false
  });

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium capitalize">{key}</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))}
              className={`w-12 h-6 rounded-full ${value ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Privacy Settings View
export const PrivacySettingsView = ({ user, onBack }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Privacy Settings</h2>
    </div>

    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Profile Visibility</h3>
        <p className="text-gray-600 text-sm">Control who can see your profile information</p>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Data Usage</h3>
        <p className="text-gray-600 text-sm">Manage how your data is used</p>
      </div>
    </div>
  </div>
);

// Help Center View
export const HelpCenterView = ({ onBack }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Help Center</h2>
    </div>

    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
        <p className="text-gray-600 text-sm">Find answers to common questions</p>
      </div>
      
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Contact Support</h3>
        <p className="text-gray-600 text-sm">Get in touch with our support team</p>
      </div>
    </div>
  </div>
);

// Contact Support View
export const ContactSupportView = ({ user, onBack }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Contact Support</h2>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          placeholder="Brief description of your issue"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          rows={6}
          placeholder="Describe your issue in detail..."
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      <button className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold">
        Send Message
      </button>
    </div>
  </div>
);

// Bank Account Manager
export const BankAccountManager = ({ user, bankAccounts = [], onBack, onAddAccount, onRemoveAccount, onVerifyAccount }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Bank Accounts</h2>
    </div>

    {bankAccounts.length === 0 ? (
      <div className="text-center py-12">
        <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bank Accounts</h3>
        <p className="text-gray-500 mb-6">Add a bank account for easy payments</p>
        <button 
          onClick={() => onAddAccount && onAddAccount({ name: 'Sample Bank', last4: '1234' })}
          className="bg-brand-500 text-white px-6 py-3 rounded-lg"
        >
          Add Bank Account
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {bankAccounts.map(account => (
          <div key={account.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">{account.name}</h3>
            <p className="text-gray-600">****{account.last4}</p>
            <button
              onClick={() => onRemoveAccount(account.id)}
              className="mt-2 text-red-600 text-sm"
            >
              Remove Account
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Map View
export const MapView = ({ listings = [], onBack, onSelectProperty }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Map View</h2>
    </div>

    <div className="bg-gray-200 rounded-lg h-96 mb-4 flex items-center justify-center">
      <div className="text-center">
        <Map size={48} className="mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">Interactive map coming soon!</p>
      </div>
    </div>

    <div className="space-y-2">
      {listings.slice(0, 3).map(listing => (
        <div key={listing.id} className="border border-gray-200 rounded-lg p-3">
          <h3 className="font-semibold text-sm">{listing.title}</h3>
          <p className="text-gray-600 text-sm">{listing.location}</p>
          <p className="text-green-600 font-bold">${listing.price}/month</p>
        </div>
      ))}
    </div>
  </div>
);

// Owner Payment Center
export const OwnerPaymentCenter = ({ user, transactions = [], onBack }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Payment Center</h2>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-green-800 mb-2">Monthly Revenue</h3>
      <p className="text-2xl font-bold text-green-600">
        ${transactions.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="font-semibold">Recent Transactions</h3>
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No transactions yet</p>
        </div>
      ) : (
        transactions.map(transaction => (
          <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{transaction.tenant}</h4>
                <p className="text-gray-600 text-sm">{transaction.date}</p>
              </div>
              <p className="font-bold text-green-600">${transaction.total}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Tour Request Modal
export const TourRequestModal = ({ property, onRequestTour, onClose }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Request Tour</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select time</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onRequestTour(date, time, '')}
            disabled={!date || !time}
            className="flex-1 py-2 bg-brand-500 text-white rounded-lg disabled:bg-gray-300"
          >
            Request Tour
          </button>
        </div>
      </div>
    </div>
  );
};

// Application Flow
export const ApplicationFlow = ({ application, onBack }) => (
  <div className="p-4 pb-20">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="mr-3">
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-bold">Application</h2>
    </div>

    <div className="text-center py-12">
      <FileText size={48} className="mx-auto text-brand-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Application Process</h3>
      <p className="text-gray-600">Complete your rental application here</p>
    </div>
  </div>
);

