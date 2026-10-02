import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react'
import { documentsService } from '../../../services/documentsService'
import { shortDate } from './statusMeta'

const CATEGORIES = [
  'lease',
  'receipt',
  'notice',
  'insurance',
  'inspection',
  'tax',
  'other',
]

const formatSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsTab({ data, onRefresh }) {
  const { documents, property } = data
  const fileRef = useRef(null)
  const [category, setCategory] = useState('lease')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async e => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Choose a file first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await documentsService.upload(file, {
        name: name || undefined,
        category,
        listingId: property.id,
      })
      setName('')
      if (fileRef.current) fileRef.current.value = ''
      await onRefresh()
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async doc => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await documentsService.remove(doc.id)
      await onRefresh()
    } catch (err) {
      setError(err?.message || 'Could not delete the document.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        {documents.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
            <FileText size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="font-medium text-gray-900">No documents yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Keep the lease, notices, insurance and receipts for this property
              in one place.
            </p>
          </div>
        ) : (
          <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {documents.map(doc => (
              <li key={doc.id} className="p-4 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
                  <FileText size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {doc.category} · {shortDate(doc.createdAt)}
                    {doc.size ? ` · ${formatSize(doc.size)}` : ''}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-gray-500 hover:text-brand-600"
                  aria-label={`Open ${doc.name}`}
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => remove(doc)}
                  disabled={busy}
                  className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={upload}
        className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 h-fit"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Upload size={16} /> Upload to this property
        </h2>
        <label className="block text-xs text-gray-500">
          File (PDF, Word or image)
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Name (optional)
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Signed lease 2026–27"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Category
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white capitalize"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Upload'}
        </button>
      </form>
    </div>
  )
}

DocumentsTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    documents: PropTypes.array.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
}
