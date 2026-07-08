import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { documentsService } from '../../services/documentsService'
import { listingsService } from '../../services/listingsService'

const CATEGORY_LABELS = {
  lease: 'Lease',
  receipt: 'Receipt',
  notice: 'Notice',
  insurance: 'Insurance',
  inspection: 'Inspection',
  tax: 'Tax',
  other: 'Other',
}

const fileSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documents() {
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [documents, setDocuments] = useState(null)
  const [listings, setListings] = useState([])
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadMeta, setUploadMeta] = useState({
    category: 'lease',
    listingId: '',
  })

  const load = useCallback(() => {
    documentsService
      .list()
      .then(res => setDocuments(res.documents || []))
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
    listingsService
      .getMyListings?.()
      .then(res => setListings(res.listings || res || []))
      .catch(() => setListings([]))
  }, [load])

  const onFileChosen = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await documentsService.upload(file, {
        category: uploadMeta.category,
        listingId: uploadMeta.listingId || undefined,
      })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const remove = async doc => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return
    try {
      await documentsService.remove(doc.id)
      setDocuments(list => list.filter(d => d.id !== doc.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const visible = (documents || []).filter(
    d => filter === 'all' || d.category === filter
  )

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-gray-600">
          Leases, receipts, notices, and inspection records — stored per
          property.
        </p>
      </div>

      {/* Upload panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select
              value={uploadMeta.category}
              onChange={e =>
                setUploadMeta(m => ({ ...m, category: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Property (optional)
            </label>
            <select
              value={uploadMeta.listingId}
              onChange={e =>
                setUploadMeta(m => ({ ...m, listingId: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              <option value="">— General —</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={onFileChosen}
          className="hidden"
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="w-full inline-flex items-center justify-center bg-brand-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Upload size={16} className="mr-2" />
          )}
          {uploading ? 'Uploading…' : 'Upload document'}
        </button>
        <p className="text-xs text-gray-400">PDF, Word, or images. Max 15MB.</p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto mb-4">
        {['all', ...Object.keys(CATEGORY_LABELS)].map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-3 py-1 text-sm rounded-full border ${
              filter === c
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {!documents && !error && (
        <div className="min-h-[20vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      )}
      {documents && visible.length === 0 && (
        <div className="text-center py-10">
          <FileText size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No documents yet — upload your first lease or receipt above.'
              : `No ${CATEGORY_LABELS[filter]?.toLowerCase()} documents.`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {visible.map(doc => (
          <div
            key={doc.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{doc.name}</div>
              <div className="text-xs text-gray-500">
                {CATEGORY_LABELS[doc.category] || doc.category}
                {doc.listing ? ` • ${doc.listing.title}` : ''} •{' '}
                {new Date(doc.createdAt).toLocaleDateString()}
                {doc.size ? ` • ${fileSize(doc.size)}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:text-brand-600"
                title="Open"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => remove(doc)}
                className="text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
