import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Camera,
  Loader2,
  Save,
  CheckCircle,
  Trash2,
  Shield,
  X,
} from 'lucide-react'
import { inspectionsService } from '../../../services/inspectionsService'
import { money, shortDate } from './statusMeta'
import {
  TYPE_LABEL,
  STATUS_META,
  CONDITIONS,
  conditionMeta,
  groupByRoom,
} from '../../inspections/inspectionMeta'

const toDateInput = value => (value ? String(value).slice(0, 10) : '')

function ConditionControl({ item, onChange, disabled }) {
  return (
    <div
      role="radiogroup"
      aria-label={`${item.item} condition`}
      className="inline-flex rounded-lg border border-gray-300 overflow-hidden"
    >
      {CONDITIONS.map(c => {
        const active = item.condition === c.key
        return (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(c.key)}
            className={`px-3 py-1.5 text-xs font-medium border-r last:border-r-0 border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 disabled:cursor-default ${
              active
                ? c.active
                : 'bg-white text-gray-700 hover:bg-gray-50 disabled:hover:bg-white'
            }`}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

ConditionControl.propTypes = {
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

function ItemRow({ item, readOnly, onUpdate, onAddPhotos, uploading }) {
  const fileRef = useRef(null)
  const damaged = item.condition === 'damaged'
  const costId = `${item.id}-cost`
  const notesId = `${item.id}-notes`

  const removePhoto = url =>
    onUpdate({ photos: item.photos.filter(p => p !== url) })

  return (
    <li className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-gray-900">{item.item}</p>
        {readOnly ? (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conditionMeta(item.condition).badge}`}
          >
            {conditionMeta(item.condition).label}
          </span>
        ) : (
          <ConditionControl
            item={item}
            onChange={condition => onUpdate({ condition })}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label
          htmlFor={notesId}
          className="text-xs text-gray-500 sm:col-span-2"
        >
          Notes
          <input
            id={notesId}
            value={item.notes || ''}
            readOnly={readOnly}
            onChange={e => onUpdate({ notes: e.target.value })}
            placeholder={readOnly ? '' : 'Scuffs, stains, missing parts…'}
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 read-only:bg-gray-50"
          />
        </label>
        {damaged && (
          <label htmlFor={costId} className="text-xs text-gray-500">
            Estimated cost ($)
            <input
              id={costId}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={item.estimatedCost ?? 0}
              readOnly={readOnly}
              onChange={e =>
                onUpdate({
                  estimatedCost: Math.max(
                    0,
                    Math.round(Number(e.target.value) || 0)
                  ),
                })
              }
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 read-only:bg-gray-50"
            />
          </label>
        )}
      </div>

      {(item.photos?.length > 0 || !readOnly) && (
        <div className="flex flex-wrap items-center gap-2">
          {(item.photos || []).map(url => (
            <span key={url} className="relative">
              <a href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`${item.room} ${item.item} photo`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Remove photo"
                  className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full p-0.5 text-gray-500 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {!readOnly && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={e => {
                  const files = Array.from(e.target.files || [])
                  e.target.value = ''
                  if (files.length) onAddPhotos(files)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
                {uploading ? 'Uploading…' : 'Add photos'}
              </button>
            </>
          )}
        </div>
      )}
    </li>
  )
}

ItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired,
  onAddPhotos: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
}

/**
 * Editor for one inspection report. Drafts are editable; a completed report
 * is read-only and a completed move-out can push its flagged items to the
 * lease's security deposit.
 */
export default function InspectionEditor() {
  const { id: propertyId, inspectionId } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState(null)
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')
  const [conductedAt, setConductedAt] = useState('')
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState('')
  const [uploadingItem, setUploadingItem] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deductionResult, setDeductionResult] = useState(null)

  const apply = useCallback(data => {
    setInspection(data)
    setItems(data.items || [])
    setNotes(data.notes || '')
    setConductedAt(toDateInput(data.conductedAt))
    setDirty(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    inspectionsService
      .get(inspectionId)
      .then(data => {
        if (!cancelled) apply(data)
      })
      .catch(err => {
        if (!cancelled) setError(err?.message || 'Could not load the report.')
      })
    return () => {
      cancelled = true
    }
  }, [inspectionId, apply])

  const readOnly = inspection?.status === 'completed'

  const updateItem = (itemId, patch) => {
    setItems(list => list.map(i => (i.id === itemId ? { ...i, ...patch } : i)))
    setDirty(true)
  }

  const addPhotos = async (itemId, files) => {
    setUploadingItem(itemId)
    setError('')
    try {
      const urls = await inspectionsService.uploadPhotos(inspectionId, files)
      setItems(list =>
        list.map(i =>
          i.id === itemId ? { ...i, photos: [...(i.photos || []), ...urls] } : i
        )
      )
      setDirty(true)
    } catch (err) {
      setError(err?.message || 'Photo upload failed.')
    } finally {
      setUploadingItem(null)
    }
  }

  const payload = () => ({
    items,
    notes,
    conductedAt: conductedAt || null,
  })

  const save = async () => {
    setBusy('save')
    setError('')
    setNotice('')
    try {
      apply(await inspectionsService.update(inspectionId, payload()))
      setNotice('Draft saved.')
    } catch (err) {
      setError(err?.message || 'Could not save the draft.')
    } finally {
      setBusy('')
    }
  }

  const complete = async () => {
    if (
      !window.confirm(
        'Complete this report? It becomes read-only and tenants on the lease are emailed a copy.'
      )
    ) {
      return
    }
    setBusy('complete')
    setError('')
    setNotice('')
    try {
      apply(
        await inspectionsService.update(inspectionId, {
          ...payload(),
          status: 'completed',
        })
      )
      setNotice('Report completed.')
    } catch (err) {
      setError(err?.message || 'Could not complete the report.')
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this draft report?')) return
    setBusy('delete')
    try {
      await inspectionsService.remove(inspectionId)
      navigate(`/dashboard/properties/${propertyId}/inspections`)
    } catch (err) {
      setError(err?.message || 'Could not delete the draft.')
      setBusy('')
    }
  }

  const sendToDeposit = async () => {
    setBusy('deposit')
    setError('')
    try {
      setDeductionResult(await inspectionsService.sendToDeposit(inspectionId))
    } catch (err) {
      setError(err?.message || 'Could not create deductions.')
    } finally {
      setBusy('')
    }
  }

  const toggleRoom = room =>
    setCollapsed(set => {
      const next = new Set(set)
      if (next.has(room)) next.delete(room)
      else next.add(room)
      return next
    })

  if (error && !inspection) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          to={`/dashboard/properties/${propertyId}/inspections`}
          className="text-brand-600 font-medium hover:underline"
        >
          Back to property
        </Link>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-44 bg-white border border-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  const status = STATUS_META[inspection.status] || STATUS_META.draft
  const rooms = groupByRoom(items)
  const damaged = items.filter(i => i.condition === 'damaged')
  const estimatedTotal = damaged.reduce(
    (s, i) => s + (Number(i.estimatedCost) || 0),
    0
  )
  const canSendToDeposit =
    readOnly && inspection.type === 'move_out' && inspection.agreementId

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        <Link
          to={`/dashboard/properties/${propertyId}/inspections`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> Back to property
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}
              >
                {status.label}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2 leading-tight">
                {TYPE_LABEL[inspection.type] || 'Inspection'} report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {inspection.listing?.title}
                {inspection.agreement
                  ? ` · lease ${shortDate(inspection.agreement.startDate)} – ${shortDate(inspection.agreement.endDate)}`
                  : ' · not attached to a lease'}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-2xl font-bold text-gray-900">
                {damaged.length}
                <span className="text-sm font-normal text-gray-500">
                  {' '}
                  flagged
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {money(estimatedTotal)} estimated
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <label htmlFor="conductedAt" className="text-xs text-gray-500">
              Conducted on
              <input
                id="conductedAt"
                type="date"
                value={conductedAt}
                readOnly={readOnly}
                onChange={e => {
                  setConductedAt(e.target.value)
                  setDirty(true)
                }}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 read-only:bg-gray-50"
              />
            </label>
            <label
              htmlFor="overallNotes"
              className="text-xs text-gray-500 sm:col-span-2"
            >
              Overall notes
              <textarea
                id="overallNotes"
                rows={2}
                value={notes}
                readOnly={readOnly}
                onChange={e => {
                  setNotes(e.target.value)
                  setDirty(true)
                }}
                placeholder={
                  readOnly
                    ? ''
                    : 'General condition, who attended, keys handed over…'
                }
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 read-only:bg-gray-50"
              />
            </label>
          </div>
          {readOnly && inspection.completedAt && (
            <p className="text-xs text-gray-500 mt-3">
              Completed {shortDate(inspection.completedAt)}. This report is
              read-only.
            </p>
          )}
        </div>

        {canSendToDeposit && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-brand-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Security deposit</p>
                  <p className="text-sm text-gray-500">
                    {damaged.filter(i => i.estimatedCost > 0).length} flagged
                    item
                    {damaged.filter(i => i.estimatedCost > 0).length === 1
                      ? ''
                      : 's'}{' '}
                    with a cost can become itemized deductions. Lines already on
                    the deposit are skipped.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={sendToDeposit}
                disabled={busy === 'deposit'}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {busy === 'deposit' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Shield size={14} />
                )}
                Send flagged items to the security deposit
              </button>
            </div>
            {deductionResult && (
              <p className="text-sm text-gray-700 mt-3">
                Added {deductionResult.created} deduction
                {deductionResult.created === 1 ? '' : 's'}
                {deductionResult.skipped > 0
                  ? `, skipped ${deductionResult.skipped} already on the deposit or over the amount held`
                  : ''}
                .{' '}
                <Link
                  to="/dashboard/security-deposits"
                  className="text-brand-600 font-medium hover:underline"
                >
                  Open security deposits
                </Link>
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            {notice}
          </p>
        )}

        <div className="space-y-3">
          {rooms.map(({ room, items: roomItems }) => {
            const open = !collapsed.has(room)
            const flagged = roomItems.filter(
              i => i.condition === 'damaged'
            ).length
            const sectionId = `room-${room.replace(/[^a-z0-9]+/gi, '-')}`
            return (
              <section
                key={room}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <h2>
                  <button
                    type="button"
                    onClick={() => toggleRoom(room)}
                    aria-expanded={open}
                    aria-controls={sectionId}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                  >
                    {open ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                    <span className="flex-1">{room}</span>
                    <span className="text-xs font-normal text-gray-500">
                      {roomItems.length} items
                      {flagged > 0 && (
                        <span className="ml-2 text-red-700 font-semibold">
                          {flagged} flagged
                        </span>
                      )}
                    </span>
                  </button>
                </h2>
                {open && (
                  <ul
                    id={sectionId}
                    className="divide-y divide-gray-100 border-t border-gray-100"
                  >
                    {roomItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        readOnly={readOnly}
                        onUpdate={patch => updateItem(item.id, patch)}
                        onAddPhotos={files => addPhotos(item.id, files)}
                        uploading={uploadingItem === item.id}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>

      {!readOnly && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete draft
            </button>
            <div className="flex items-center gap-2 ml-auto">
              {dirty && (
                <span className="text-xs text-amber-700">Unsaved changes</span>
              )}
              <button
                type="button"
                onClick={save}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                {busy === 'save' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save draft
              </button>
              <button
                type="button"
                onClick={complete}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black disabled:opacity-50"
              >
                {busy === 'complete' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Complete report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
