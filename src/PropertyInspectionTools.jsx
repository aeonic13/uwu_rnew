import React, { useState, useRef } from 'react'
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  Upload,
  FileText,
  Clock,
  User,
  MapPin,
  Calendar,
} from 'lucide-react'

const PropertyInspectionTools = ({
  lease,
  inspectionType = 'move-in',
  onComplete,
  onBack,
}) => {
  const [currentRoom, setCurrentRoom] = useState('living-room')
  const [inspectionData, setInspectionData] = useState({})
  const [photos, setPhotos] = useState({})
  const [notes, setNotes] = useState({})
  const [signatures, setSignatures] = useState({})
  const [showSummary, setShowSummary] = useState(false)
  const fileInputRef = useRef(null)

  // Room categories for inspection
  const roomCategories = {
    'living-room': {
      name: 'Living Room',
      items: [
        'Walls (paint, holes, stains)',
        'Flooring (carpet, hardwood, tile)',
        'Windows and window treatments',
        'Light fixtures and switches',
        'Outlets and electrical',
        'Furniture (if furnished)',
        'Doors and door frames',
      ],
    },
    kitchen: {
      name: 'Kitchen',
      items: [
        'Cabinets and drawers',
        'Countertops',
        'Sink and faucet',
        'Appliances (refrigerator, stove, dishwasher)',
        'Flooring',
        'Walls and backsplash',
        'Light fixtures',
        'Outlets and switches',
      ],
    },
    bathroom: {
      name: 'Bathroom(s)',
      items: [
        'Toilet',
        'Sink and vanity',
        'Shower/bathtub',
        'Tiles and grout',
        'Mirror',
        'Light fixtures',
        'Ventilation fan',
        'Flooring',
        'Towel bars and fixtures',
      ],
    },
    bedroom: {
      name: 'Bedroom(s)',
      items: [
        'Walls (paint, holes)',
        'Flooring (carpet, hardwood)',
        'Windows and treatments',
        'Closet and doors',
        'Light fixtures',
        'Outlets and switches',
        'Furniture (if furnished)',
      ],
    },
    exterior: {
      name: 'Exterior/Common Areas',
      items: [
        'Front/back doors',
        'Balcony/patio',
        'Parking space',
        'Mailbox',
        'Storage areas',
        'HVAC system',
        'Smoke/carbon monoxide detectors',
        'Keys provided',
      ],
    },
  }

  const conditionOptions = {
    excellent: {
      label: 'Excellent',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
    good: {
      label: 'Good',
      color: 'bg-brand-100 text-blue-800',
      icon: CheckCircle,
    },
    fair: {
      label: 'Fair',
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
    },
    poor: { label: 'Poor', color: 'bg-red-100 text-red-800', icon: XCircle },
    damaged: {
      label: 'Damaged',
      color: 'bg-red-200 text-red-900',
      icon: XCircle,
    },
  }

  const handleItemCondition = (room, item, condition) => {
    setInspectionData(prev => ({
      ...prev,
      [room]: {
        ...prev[room],
        [item]: condition,
      },
    }))
  }

  const handlePhotoUpload = (room, item, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        setPhotos(prev => ({
          ...prev,
          [room]: {
            ...prev[room],
            [item]: [
              ...(prev[room]?.[item] || []),
              {
                id: Date.now(),
                url: e.target.result,
                filename: file.name,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNote = (room, item, note) => {
    setNotes(prev => ({
      ...prev,
      [room]: {
        ...prev[room],
        [item]: note,
      },
    }))
  }

  const generateInspectionReport = () => {
    const report = {
      id: `INSPECTION-${Date.now()}`,
      lease: lease,
      type: inspectionType,
      date: new Date().toISOString(),
      inspector: 'Rentra User',
      data: inspectionData,
      photos: photos,
      notes: notes,
      signatures: signatures,
      summary: generateSummary(),
    }
    return report
  }

  const generateSummary = () => {
    let totalItems = 0
    let issuesFound = 0

    Object.keys(roomCategories).forEach(room => {
      roomCategories[room].items.forEach(item => {
        totalItems++
        const condition = inspectionData[room]?.[item]
        if (
          condition === 'fair' ||
          condition === 'poor' ||
          condition === 'damaged'
        ) {
          issuesFound++
        }
      })
    })

    return {
      totalItems,
      issuesFound,
      itemsInspected: Object.keys(inspectionData).reduce(
        (total, room) => total + Object.keys(inspectionData[room] || {}).length,
        0
      ),
      photosUploaded: Object.keys(photos).reduce(
        (total, room) =>
          total +
          Object.keys(photos[room] || {}).reduce(
            (roomTotal, item) => roomTotal + (photos[room][item]?.length || 0),
            0
          ),
        0
      ),
    }
  }

  const currentRoomData = roomCategories[currentRoom]

  if (showSummary) {
    const summary = generateSummary()
    return (
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {inspectionType === 'move-in' ? 'Move-In' : 'Move-Out'} Inspection
            Complete
          </h2>
          <p className="text-gray-600">
            Review your inspection report and add signatures
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
            <div className="text-2xl font-bold text-brand-500">
              {summary.itemsInspected}
            </div>
            <div className="text-sm text-brand-600">Items Inspected</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {summary.photosUploaded}
            </div>
            <div className="text-sm text-green-700">Photos Uploaded</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.issuesFound}
            </div>
            <div className="text-sm text-yellow-700">Issues Found</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((summary.itemsInspected / summary.totalItems) * 100)}%
            </div>
            <div className="text-sm text-purple-700">Complete</div>
          </div>
        </div>

        {/* Digital Signatures */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-4">Digital Signatures Required</h3>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    Tenant: {lease.tenant?.name || 'Student Tenant'}
                  </p>
                  <p className="text-sm text-gray-600">
                    I acknowledge this inspection is accurate and complete
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSignatures(prev => ({
                      ...prev,
                      tenant: {
                        signed: true,
                        timestamp: new Date().toISOString(),
                      },
                    }))
                  }
                  className={`px-4 py-2 rounded-lg font-medium ${
                    signatures.tenant?.signed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {signatures.tenant?.signed ? 'Signed' : 'Sign Here'}
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    Landlord: {lease.landlord?.name || 'Property Owner'}
                  </p>
                  <p className="text-sm text-gray-600">
                    I acknowledge this inspection is accurate and complete
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSignatures(prev => ({
                      ...prev,
                      landlord: {
                        signed: true,
                        timestamp: new Date().toISOString(),
                      },
                    }))
                  }
                  className={`px-4 py-2 rounded-lg font-medium ${
                    signatures.landlord?.signed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {signatures.landlord?.signed ? 'Signed' : 'Sign Here'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              const report = generateInspectionReport()
              onComplete?.(report)
            }}
            disabled={
              !signatures.tenant?.signed || !signatures.landlord?.signed
            }
            className={`w-full py-3 rounded-lg font-semibold ${
              signatures.tenant?.signed && signatures.landlord?.signed
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Complete Inspection
          </button>

          <button
            onClick={() => setShowSummary(false)}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
          >
            Continue Inspection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {inspectionType === 'move-in' ? 'Move-In' : 'Move-Out'} Inspection
        </h2>
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
          <div className="flex items-center text-sm text-blue-800">
            <MapPin size={16} className="mr-2" />
            <span>{lease.property?.address || 'Property Address'}</span>
          </div>
          <div className="flex items-center text-sm text-brand-600 mt-1">
            <Calendar size={16} className="mr-2" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Room Navigation */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Select Room to Inspect</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(roomCategories).map(([key, room]) => {
            const roomProgress = room.items.filter(
              item => inspectionData[key]?.[item]
            ).length
            const totalItems = room.items.length

            return (
              <button
                key={key}
                onClick={() => setCurrentRoom(key)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  currentRoom === key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-300 hover:border-brand-300'
                }`}
              >
                <div className="font-medium">{room.name}</div>
                <div className="text-sm text-gray-600">
                  {roomProgress}/{totalItems} items
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div
                    className="bg-brand-500 h-1 rounded-full transition-all"
                    style={{ width: `${(roomProgress / totalItems) * 100}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Current Room Inspection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <CheckCircle size={20} className="text-brand-500 mr-2" />
          Inspecting: {currentRoomData.name}
        </h3>

        <div className="space-y-4">
          {currentRoomData.items.map((item, index) => {
            const condition = inspectionData[currentRoom]?.[item]
            const itemPhotos = photos[currentRoom]?.[item] || []
            const itemNote = notes[currentRoom]?.[item] || ''

            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium mb-3">{item}</h4>

                {/* Condition Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">
                    Condition:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(conditionOptions).map(([key, option]) => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            handleItemCondition(currentRoom, item, key)
                          }
                          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                            condition === key
                              ? option.color
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <IconComponent size={14} className="inline mr-1" />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Photos:</label>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click()
                      }}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center"
                    >
                      <Camera size={14} className="mr-1" />
                      Add Photo
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      Array.from(e.target.files || []).forEach(file => {
                        handlePhotoUpload(currentRoom, item, file)
                      })
                    }}
                  />

                  {itemPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {itemPhotos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="relative">
                          <img
                            src={photo.url}
                            alt={`${item} photo ${photoIndex + 1}`}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => {
                              setPhotos(prev => ({
                                ...prev,
                                [currentRoom]: {
                                  ...prev[currentRoom],
                                  [item]: itemPhotos.filter(
                                    (_, i) => i !== photoIndex
                                  ),
                                },
                              }))
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes:
                  </label>
                  <textarea
                    value={itemNote}
                    onChange={e =>
                      handleNote(currentRoom, item, e.target.value)
                    }
                    placeholder="Any additional notes about this item..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    rows={2}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setShowSummary(true)}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center"
        >
          <FileText size={20} className="mr-2" />
          Review & Complete Inspection
        </button>

        <button
          onClick={onBack}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
        >
          Back
        </button>
      </div>
    </div>
  )
}

export default PropertyInspectionTools
