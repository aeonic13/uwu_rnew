import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { ImagePlus, Loader2, Send, X } from 'lucide-react'
import { maintenanceService } from '../../services/maintenanceService'

/** "Oct 5, 3:14 PM" */
export function commentTime(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function authorName(author) {
  return (
    [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'Unknown'
  )
}

export function MaintenanceComment({ comment, isOwnerAuthor }) {
  return (
    <li className="text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        <span className="font-semibold text-gray-900">
          {authorName(comment.author)}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isOwnerAuthor
              ? 'bg-gray-900 text-white'
              : 'bg-brand-100 text-brand-700'
          }`}
        >
          {isOwnerAuthor ? 'Landlord' : 'Tenant'}
        </span>
        <span>{commentTime(comment.createdAt)}</span>
      </p>
      <p className="text-gray-800 whitespace-pre-wrap break-words mt-0.5">
        {comment.body}
      </p>
      {comment.photos?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {comment.photos.map(url => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt="Attached photo"
                className="w-14 h-14 object-cover rounded-lg border border-gray-200"
              />
            </a>
          ))}
        </div>
      )}
    </li>
  )
}

MaintenanceComment.propTypes = {
  comment: PropTypes.shape({
    body: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    photos: PropTypes.arrayOf(PropTypes.string),
    author: PropTypes.object,
  }).isRequired,
  isOwnerAuthor: PropTypes.bool,
}

/**
 * Comment thread for one maintenance ticket, shared by the landlord's
 * property workspace and the tenant dashboard. Loads the ticket detail on
 * mount and reports it back through `onLoaded` so the host can show
 * vendor/cost/expense fields that live on the ticket.
 */
export default function MaintenanceThread({ ticketId, onLoaded, onPosted }) {
  const [comments, setComments] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    let active = true
    setLoadError('')
    maintenanceService
      .get(ticketId)
      .then(ticket => {
        if (!active) return
        setComments(ticket.comments || [])
        onLoaded?.(ticket)
      })
      .catch(err => {
        if (active) setLoadError(err?.message || 'Could not load the thread.')
      })
    return () => {
      active = false
    }
    // onLoaded is a host callback; re-fetch only when the ticket changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const pickPhotos = async e => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    if (photos.length + files.length > 10) {
      setError('At most 10 photos per message.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const urls = await maintenanceService.uploadPhotos(ticketId, files)
      setPhotos(prev => [...prev, ...urls])
    } catch (err) {
      setError(err?.message || 'Could not upload photos.')
    } finally {
      setUploading(false)
    }
  }

  const post = async e => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setPosting(true)
    setError('')
    try {
      const comment = await maintenanceService.addComment(ticketId, {
        body: text,
        photos,
      })
      setComments(prev => [...(prev || []), comment])
      setBody('')
      setPhotos([])
      onPosted?.(comment)
    } catch (err) {
      setError(err?.message || 'Could not post your message.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-3">
      {loadError ? (
        <p className="text-xs text-red-600">{loadError}</p>
      ) : comments === null ? (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> Loading thread…
        </p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500">
          No messages yet. Start the conversation below.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map(c => (
            <MaintenanceComment
              key={c.id}
              comment={c}
              isOwnerAuthor={c.author?.userType === 'owner'}
            />
          ))}
        </ul>
      )}

      <form onSubmit={post} className="space-y-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Write a message…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map(url => (
              <span key={url} className="relative">
                <img
                  src={url}
                  alt="Pending upload"
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter(p => p !== url))}
                  aria-label="Remove photo"
                  className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full p-0.5 text-gray-600"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={pickPhotos}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || posting}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ImagePlus size={13} />
            )}
            Add photos
          </button>
          <button
            type="submit"
            disabled={!body.trim() || posting || uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40 ml-auto"
          >
            <Send size={13} /> {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  )
}

MaintenanceThread.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onLoaded: PropTypes.func,
  onPosted: PropTypes.func,
}
