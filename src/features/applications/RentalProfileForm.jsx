import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { rentalProfileService } from '../../services/rentalProfileService'

/**
 * Universal rental application questionnaire.
 *
 * Covers the sections every standard rental application asks for
 * (residence history, employment & income, vehicles,
 * references, emergency contact, and standard disclosures) so tenants
 * answer them ONCE at pre-qualification instead of per property.
 *
 * Deliberately excludes SSN and date of birth — those are only needed by a
 * credit/background-check provider and should never sit in our database.
 * Also excludes "who will live with you" and pets: co-tenants come from
 * Rentra's roommate-group applications (one application per member), so
 * asking here would duplicate that and drift out of sync.
 */

// Section → fields. Kept flat so answers serialize as simple JSON.
const SECTIONS = [
  {
    title: 'Current residence',
    fields: [
      { id: 'currentAddress', label: 'Current address', required: true },
      {
        id: 'timeAtAddress',
        label: 'Time at this address',
        placeholder: 'e.g. 2 years',
      },
      { id: 'currentLandlordName', label: 'Current landlord / manager name' },
      { id: 'currentLandlordPhone', label: 'Landlord phone', type: 'tel' },
      {
        id: 'currentRent',
        label: 'Current monthly rent',
        placeholder: 'e.g. $1,200',
      },
      { id: 'reasonForLeaving', label: 'Reason for leaving' },
      { id: 'previousAddress', label: 'Previous address (optional)' },
    ],
  },
  {
    title: 'Employment & income',
    fields: [
      { id: 'employer', label: 'Current employer', required: true },
      { id: 'jobTitle', label: 'Job title', required: true },
      {
        id: 'employmentLength',
        label: 'Time with employer',
        placeholder: 'e.g. 18 months',
      },
      { id: 'workPhone', label: 'Work / supervisor phone', type: 'tel' },
      {
        id: 'monthlyIncome',
        label: 'Gross monthly income',
        placeholder: 'e.g. $4,000',
        required: true,
      },
      { id: 'otherIncome', label: 'Other income (source & amount, optional)' },
    ],
  },
  {
    title: 'Vehicles',
    fields: [
      {
        id: 'vehicles',
        label: 'Vehicle(s) — make, model, plate',
        placeholder: 'or "none"',
      },
    ],
  },
  {
    title: 'References',
    fields: [
      { id: 'reference1Name', label: 'Reference 1 — name', required: true },
      { id: 'reference1Relation', label: 'Relationship' },
      { id: 'reference1Phone', label: 'Phone', type: 'tel' },
      { id: 'reference2Name', label: 'Reference 2 — name (optional)' },
      { id: 'reference2Relation', label: 'Relationship' },
      { id: 'reference2Phone', label: 'Phone', type: 'tel' },
    ],
  },
  {
    title: 'Emergency contact',
    fields: [
      { id: 'emergencyName', label: 'Name', required: true },
      { id: 'emergencyRelation', label: 'Relationship' },
      { id: 'emergencyPhone', label: 'Phone', type: 'tel', required: true },
    ],
  },
]

// Standard yes/no disclosures. Honest answers with context beat surprises
// on a screening report.
const DISCLOSURES = [
  { id: 'everEvicted', label: 'Have you ever been evicted?' },
  { id: 'brokenLease', label: 'Have you ever broken a lease?' },
  { id: 'felony', label: 'Have you ever been convicted of a felony?' },
  { id: 'smoker', label: 'Do you smoke?' },
]

const REQUIRED_IDS = SECTIONS.flatMap(s =>
  s.fields.filter(f => f.required).map(f => f.id)
)

// Every id the questionnaire currently asks. Saves are filtered to this set
// so answers to questions we've since removed don't linger in the JSON.
const KNOWN_IDS = new Set([
  ...SECTIONS.flatMap(s => s.fields.map(f => f.id)),
  ...DISCLOSURES.map(d => d.id),
])

export default function RentalProfileForm({ onSaved }) {
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)

  // Preload any previously saved profile so it's editable, not re-typed.
  useEffect(() => {
    let active = true
    rentalProfileService
      .get()
      .then(profile => {
        if (!active) return
        if (profile) {
          setAnswers(profile)
          setSavedAt(true)
          onSaved?.(profile)
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // Mount-only: onSaved is typically an inline arrow; depending on it
    // would re-run the fetch every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setField = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }))

  const missingRequired = REQUIRED_IDS.filter(
    id => !String(answers[id] || '').trim()
  )
  const disclosuresAnswered = DISCLOSURES.every(
    d => typeof answers[d.id] === 'boolean'
  )
  const complete = missingRequired.length === 0 && disclosuresAnswered

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = Object.fromEntries(
        Object.entries(answers).filter(([key]) => KNOWN_IDS.has(key))
      )
      const saved = await rentalProfileService.save(payload)
      setSavedAt(true)
      onSaved?.(saved)
    } catch (err) {
      setError(err.message || 'Could not save your rental profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={22} className="animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(section => (
        <div key={section.title}>
          <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map(f => (
              <div key={f.id}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type={f.type || 'text'}
                  value={answers[f.id] || ''}
                  onChange={e => setField(f.id, e.target.value)}
                  placeholder={f.placeholder || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Disclosures</h3>
        <div className="space-y-2">
          {DISCLOSURES.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
            >
              <span className="text-sm text-gray-700">{d.label}</span>
              <div className="flex gap-2">
                {[
                  { v: false, label: 'No' },
                  { v: true, label: 'Yes' },
                ].map(opt => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => setField(d.id, opt.v)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border-2 transition-colors ${
                      answers[d.id] === opt.v
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          We never ask for your SSN or date of birth — those go directly to a
          screening provider only if a credit check is run, never stored here.
        </p>
      </div>

      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!complete || saving}
          className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {savedAt ? 'Update rental profile' : 'Save rental profile'}
        </button>
        {!complete && (
          <span className="text-xs text-gray-500">
            {missingRequired.length > 0
              ? `${missingRequired.length} required field${missingRequired.length === 1 ? '' : 's'} left`
              : 'Answer the disclosures to finish'}
          </span>
        )}
        {complete && savedAt && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> Saved — reused on every application
          </span>
        )}
      </div>
    </div>
  )
}

RentalProfileForm.propTypes = {
  onSaved: PropTypes.func,
}
