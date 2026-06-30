import { useState } from 'react'
import PropTypes from 'prop-types'
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cosignerService } from '../../services/cosignerService'

const RELATIONSHIPS = ['parent', 'guardian', 'relative', 'friend', 'other']

/**
 * Tenant-facing form to invite a cosigner/guarantor to an application.
 * Calls POST /api/cosigners/invite which emails a secure accept link.
 */
export default function InviteCosignerForm({ applicationId, onInvited }) {
  const [form, setForm] = useState({
    cosignerName: '',
    cosignerEmail: '',
    relationshipType: 'parent',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sentTo, setSentTo] = useState(null)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await cosignerService.invite({ applicationId, ...form })
      setSentTo(form.cosignerEmail)
      onInvited?.(form.cosignerEmail)
    } catch (err) {
      setError(err.message || 'Could not send the invitation')
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className="rounded-xl border bg-green-50 p-4 flex items-start">
        <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-green-900">Invitation sent</p>
          <p className="text-sm text-green-700">
            We emailed {sentTo} a secure link to verify income and co-sign.
          </p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null)
              setForm({
                cosignerName: '',
                cosignerEmail: '',
                relationshipType: 'parent',
              })
            }}
            className="text-sm text-green-800 underline mt-2"
          >
            Invite another cosigner
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-4">
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center mr-3">
          <Shield className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Invite a co-signer</p>
          <p className="text-sm text-gray-500">
            They&apos;ll verify income instantly — no paperwork.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name (optional)
          </label>
          <input
            name="cosignerName"
            value={form.cosignerName}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship
          </label>
          <select
            name="relationshipType"
            value={form.relationshipType}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white capitalize"
          >
            {RELATIONSHIPS.map(r => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Co-signer email
        </label>
        <input
          name="cosignerEmail"
          type="email"
          required
          value={form.cosignerEmail}
          onChange={handleChange}
          placeholder="parent@example.com"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>

      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Send invitation'
        )}
      </button>
    </form>
  )
}

InviteCosignerForm.propTypes = {
  applicationId: PropTypes.string.isRequired,
  onInvited: PropTypes.func,
}
