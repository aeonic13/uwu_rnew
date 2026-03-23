import React, { useState } from 'react';
import { 
  FileText, Upload, X, Download, Send, Eye, Trash2, 
  Check, Clock, AlertCircle, Folder, Plus, Search, Filter,
  Calendar, User, Building2, Edit, Copy, Share2
} from 'lucide-react';

const OwnerDocumentManager = ({ user, onBack, onSendToChat }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const [uploadForm, setUploadForm] = useState({
    type: 'lease', // lease, application, other
    name: '',
    description: '',
    property: '',
    file: null
  });

  // Mock document data
  const [documents] = useState([
    {
      id: 'doc-001',
      type: 'lease',
      name: 'Standard Lease Agreement 2024',
      description: '12-month residential lease template',
      property: '123 University Ave, Unit 3A',
      uploadDate: '2024-01-15',
      fileSize: '245 KB',
      fileType: 'PDF',
      status: 'active',
      sentTo: [
        { name: 'Sarah Kim', date: '2024-02-10', status: 'signed' },
        { name: 'Mike Chen', date: '2024-03-05', status: 'pending' }
      ],
      lastModified: '2024-01-15'
    },
    {
      id: 'doc-002',
      type: 'application',
      name: 'Rental Application Form',
      description: 'Standard rental application with background check consent',
      property: 'All Properties',
      uploadDate: '2024-01-10',
      fileSize: '180 KB',
      fileType: 'PDF',
      status: 'active',
      sentTo: [
        { name: 'Alex Johnson', date: '2024-02-20', status: 'submitted' }
      ],
      lastModified: '2024-01-10'
    },
    {
      id: 'doc-003',
      type: 'lease',
      name: 'Short-Term Lease (3-6 months)',
      description: 'Flexible lease for summer rentals',
      property: '456 College St, Apt 2B',
      uploadDate: '2024-02-01',
      fileSize: '220 KB',
      fileType: 'PDF',
      status: 'active',
      sentTo: [],
      lastModified: '2024-02-01'
    },
    {
      id: 'doc-004',
      type: 'other',
      name: 'Property Rules & Guidelines',
      description: 'Community rules, quiet hours, parking info',
      property: 'All Properties',
      uploadDate: '2024-01-05',
      fileSize: '95 KB',
      fileType: 'PDF',
      status: 'active',
      sentTo: [
        { name: 'Sarah Kim', date: '2024-02-10', status: 'viewed' },
        { name: 'Mike Chen', date: '2024-03-05', status: 'viewed' },
        { name: 'Alex Johnson', date: '2024-02-20', status: 'viewed' }
      ],
      lastModified: '2024-01-05'
    }
  ]);

  const [properties] = useState([
    { id: 'prop-1', address: '123 University Ave, Unit 3A' },
    { id: 'prop-2', address: '456 College St, Apt 2B' },
    { id: 'prop-3', address: '789 Campus Dr, Suite 5' }
  ]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || doc.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'lease': return <FileText className="text-blue-600" size={20} />;
      case 'application': return <User className="text-purple-600" size={20} />;
      default: return <Folder className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      archived: { color: 'bg-orange-100 text-orange-700', label: 'Archived' }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file, name: file.name }));
    }
  };

  const handleUploadSubmit = () => {
    // Mock upload - in real app, this would upload to server
    console.log('Uploading document:', uploadForm);
    setShowUploadModal(false);
    setUploadForm({
      type: 'lease',
      name: '',
      description: '',
      property: '',
      file: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Document Manager</h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center font-medium hover:bg-blue-700"
            >
              <Plus size={18} className="mr-1" />
              Upload
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'lease', label: 'Leases' },
              { id: 'application', label: 'Applications' },
              { id: 'other', label: 'Other' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="p-4 space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No documents found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 text-blue-600 font-medium"
            >
              Upload your first document
            </button>
          </div>
        ) : (
          filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start flex-1">
                  <div className="mr-3 mt-1">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{doc.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Building2 size={14} className="mr-1" />
                        {doc.property}
                      </span>
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {doc.uploadDate}
                      </span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>

              {/* Sent To Summary */}
              {doc.sentTo.length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-1">Sent to {doc.sentTo.length} recipient(s):</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.sentTo.slice(0, 3).map((recipient, idx) => (
                      <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        {recipient.name}
                        {recipient.status === 'signed' && <Check size={12} className="inline ml-1 text-green-600" />}
                        {recipient.status === 'pending' && <Clock size={12} className="inline ml-1 text-yellow-600" />}
                      </span>
                    ))}
                    {doc.sentTo.length > 3 && (
                      <span className="text-xs text-gray-500">+{doc.sentTo.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedDocument(doc)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
                >
                  <Eye size={16} className="mr-1" />
                  View
                </button>
                <button
                  onClick={() => {
                    // Mock send to chat functionality
                    if (onSendToChat) {
                      onSendToChat(doc);
                    }
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <Send size={16} className="mr-1" />
                  Send in Chat
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download size={16} className="text-gray-600" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Copy size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Document Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'lease', label: 'Lease Agreement', icon: FileText },
                    { value: 'application', label: 'Application', icon: User },
                    { value: 'other', label: 'Other', icon: Folder }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setUploadForm(prev => ({ ...prev, type: type.value }))}
                      className={`p-3 border rounded-lg flex flex-col items-center justify-center ${
                        uploadForm.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <type.icon size={24} className="mb-1" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    {uploadForm.file ? (
                      <p className="text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900">Click to upload</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Lease Agreement 2024"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this document..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Associated Property</label>
                <select
                  value={uploadForm.property}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, property: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select property or leave for all</option>
                  <option value="all">All Properties</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.address}>{prop.address}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadForm.file || !uploadForm.name}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedDocument.name}</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">{selectedDocument.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{selectedDocument.fileType}</span>
                  <span>{selectedDocument.fileSize}</span>
                  <span>Uploaded {selectedDocument.uploadDate}</span>
                </div>
              </div>
              
              {/* Document preview placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Document preview</p>
                <div className="flex justify-center space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center font-medium hover:bg-blue-700">
                    <Download size={18} className="mr-2" />
                    Download
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-lg flex items-center font-medium hover:bg-gray-50">
                    <Share2 size={18} className="mr-2" />
                    Share
                  </button>
                </div>
              </div>

              {/* Sent History */}
              {selectedDocument.sentTo.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Sent History</h3>
                  <div className="space-y-2">
                    {selectedDocument.sentTo.map((recipient, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{recipient.name}</p>
                          <p className="text-sm text-gray-500">Sent on {recipient.date}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recipient.status === 'signed' ? 'bg-green-100 text-green-700' :
                          recipient.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDocumentManager;
