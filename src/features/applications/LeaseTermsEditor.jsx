import { useState } from 'react'
import PropTypes from 'prop-types'
import { Upload, Save, Plus, Trash2 } from 'lucide-react'
import { agreementsService } from '../../services/agreementsService'

const toInput = value => (value ? String(value).slice(0, 10) : '')

const field =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white'

/**
 * Landlord's editor for an unsigned Rentra lease: money, dates, the
 * written terms, the late-fee rule, and an optional upload of their own
 * lease document. Locked by the server once anyone has signed.
 */
export default function LeaseTermsEditor({ agreement, onSaved }) {
  const t = agreement.terms
  const [form, setForm] = useState({
    monthlyRent: t.monthlyRent,
    securityDeposit: t.securityDeposit,
    startDate: toInput(t.startDate),
    endDate: toInput(t.endDate),
    monthToMonth: Boolean(agreement.monthToMonth),
    utilities: t.utilities || '',
    petPolicy: t.petPolicy || '',
    parking: t.parking || '',
    lateFeeText: t.lateFee || '',
    lateFeeAmount: agreement.lateFee?.amount ?? '',
    lateFeeGraceDays: agreement.lateFee?.graceDays ?? 5,
    additionalClauses: t.additionalClauses || [],
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const set = patch => {
    setSaved(false)
    setForm(prev => ({ ...prev, ...patch }))
  }
  const setClause = (i, value) =>
    set({
      additionalClauses: form.additionalClauses.map((c, k) =>
        k === i ? value : c
      ),
    })

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await agreementsService.updateTerms(agreement.id, {
        monthlyRent: Number(form.monthlyRent),
        securityDeposit: Number(form.securityDeposit),
        startDate: form.startDate,
        endDate: form.monthToMonth ? undefined : form.endDate,
        monthToMonth: form.monthToMonth,
        terms: {
          utilities: form.utilities,
          petPolicy: form.petPolicy,
          parking: form.parking,
          lateFee: form.lateFeeText,
          additionalClauses: form.additionalClauses,
        },
        lateFeeAmount:
          form.lateFeeAmount === '' ? null : Number(form.lateFeeAmount),
        lateFeeGraceDays: Number(form.lateFeeGraceDays),
      })
      setSaved(true)
      onSaved(updated)
    } catch (err) {
      setError(err?.message || 'Could not save the terms.')
    } finally {
      setSaving(false)
    }
  }

  const upload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const updated = await agreementsService.uploadDocument(agreement.id, file)
      onSaved(updated)
    } catch (err) {
      setError(err?.message || 'Could not upload the document.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <form
      onSubmit={save}
      className="bg-white rounded-lg border border-brand-200 p-4 space-y-4"
    >
      <div>
        <h3 className="font-semibold">Edit lease terms</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Change anything before signatures start. Once anyone signs, the terms
          are locked.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-gray-700">Monthly rent ($)</span>
          <input
            type="number"
            min="1"
            required
            value={form.monthlyRent}
            onChange={e => set({ monthlyRent: e.target.value })}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Security deposit ($)</span>
          <input
            type="number"
            min="0"
            required
            value={form.securityDeposit}
            onChange={e => set({ securityDeposit: e.target.value })}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Start date</span>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={e => set({ startDate: e.target.value })}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">End date</span>
          <input
            type="date"
            value={form.endDate}
            disabled={form.monthToMonth}
            onChange={e => set({ endDate: e.target.value })}
            className={`${field} mt-1 disabled:bg-gray-100 disabled:text-gray-400`}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.monthToMonth}
          onChange={e => set({ monthToMonth: e.target.checked })}
          className="accent-brand-500"
        />
        Month-to-month (no fixed end date)
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-gray-700">Utilities</span>
          <input
            value={form.utilities}
            onChange={e => set({ utilities: e.target.value })}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Pet policy</span>
          <input
            value={form.petPolicy}
            onChange={e => set({ petPolicy: e.target.value })}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Parking</span>
          <input
            value={form.parking}
            onChange={e => set({ parking: e.target.value })}
            placeholder="e.g. One assigned space"
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Late fee wording</span>
          <input
            value={form.lateFeeText}
            onChange={e => set({ lateFeeText: e.target.value })}
            placeholder="e.g. $50 after the 5th"
            className={`${field} mt-1`}
          />
        </label>
      </div>

      <fieldset className="border border-gray-200 rounded-lg p-3">
        <legend className="text-xs font-semibold text-gray-600 px-1">
          Late fee rule (used by rent collection)
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-gray-700">Flat fee ($)</span>
            <input
              type="number"
              min="0"
              max="5000"
              value={form.lateFeeAmount}
              onChange={e => set({ lateFeeAmount: e.target.value })}
              placeholder="blank = no fee"
              className={`${field} mt-1`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Grace period (days)</span>
            <input
              type="number"
              min="0"
              max="30"
              value={form.lateFeeGraceDays}
              onChange={e => set({ lateFeeGraceDays: e.target.value })}
              className={`${field} mt-1`}
            />
          </label>
        </div>
      </fieldset>

      <div>
        <p className="text-sm text-gray-700 mb-1">Additional clauses</p>
        <div className="space-y-2">
          {form.additionalClauses.map((clause, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={clause}
                onChange={e => setClause(i, e.target.value)}
                rows={2}
                className={field}
                placeholder="Write the clause as it should appear on the lease"
              />
              <button
                type="button"
                onClick={() =>
                  set({
                    additionalClauses: form.additionalClauses.filter(
                      (_, k) => k !== i
                    ),
                  })
                }
                className="p-2 text-gray-400 hover:text-red-600 self-start"
                aria-label="Remove clause"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set({ additionalClauses: [...form.additionalClauses, ''] })
            }
            className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline"
          >
            <Plus size={14} /> Add a clause
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-700">Use your own lease document</p>
        <p className="text-xs text-gray-500 mb-2">
          Upload a PDF or Word file. Parties e-sign against that document and it
          becomes the download; the terms above stay on record.
          {agreement.documentUrl && ' A document is attached.'}
        </p>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-brand-500 hover:text-brand-600 cursor-pointer">
          <Upload size={14} />
          {uploading
            ? 'Uploading…'
            : agreement.documentUrl
              ? 'Replace document'
              : 'Upload lease document'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={upload}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save terms'}
        </button>
        {saved && <span className="text-sm text-green-700">Saved</span>}
      </div>
    </form>
  )
}

LeaseTermsEditor.propTypes = {
  agreement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    monthToMonth: PropTypes.bool,
    documentUrl: PropTypes.string,
    lateFee: PropTypes.shape({
      amount: PropTypes.number,
      graceDays: PropTypes.number,
    }),
    terms: PropTypes.object.isRequired,
  }).isRequired,
  onSaved: PropTypes.func.isRequired,
}
