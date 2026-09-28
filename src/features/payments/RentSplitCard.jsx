import { useState } from 'react'
import PropTypes from 'prop-types'
import { Users, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { rentService } from '../../services/rentService'

/**
 * How the household divides monthly rent. Everyone on the lease sees the
 * same split; any tenant can set or change it. Purely a plan: it decides
 * what each person's "Amount due" and autopay default are.
 */
function RentSplitCard({ agreementId, plan, onChange }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const { split, household, monthlyRent } = plan

  const remove = async () => {
    if (!split) return
    setBusy(true)
    setError(null)
    try {
      await rentService.deleteSplit(split.id)
      onChange({ split: null, myShare: monthlyRent })
    } catch (err) {
      setError(err.message || 'Could not remove the split.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <SplitEditor
        agreementId={agreementId}
        plan={plan}
        onCancel={() => setEditing(false)}
        onSaved={result => {
          setEditing(false)
          onChange(result)
        }}
      />
    )
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="rent-split-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-brand-500" />
          <h3 className="font-semibold">Rent split</h3>
        </div>
        {split ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-gray-400 hover:text-brand-500 rounded"
              aria-label="Edit rent split"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-40"
              aria-label="Remove rent split"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : null}
      </div>

      {split ? (
        <>
          <p className="text-sm text-gray-500 mb-3">
            ${split.total.toLocaleString()} / month split{' '}
            {split.splitMode === 'equal' ? 'equally' : 'by custom amounts'}
            {split.createdBy ? ` · set by ${split.createdBy.name}` : ''}
          </p>
          <ul className="divide-y divide-gray-100">
            {split.shares.map(s => (
              <li
                key={s.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="font-medium text-gray-800">
                  {s.name}
                  {s.isMe && (
                    <span className="ml-2 text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">
                      you
                    </span>
                  )}
                </span>
                <span className="font-semibold">${s.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {household.length > 1
              ? `Your lease is for $${monthlyRent.toLocaleString()} a month across ${household.length} tenants. Decide how you divide it so everyone sees their own share.`
              : `Living with roommates who aren't on the lease? Split the $${monthlyRent.toLocaleString()} rent so you only track your part.`}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-brand-500 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50"
          >
            <Plus size={16} /> Set up a split
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}

const planShape = PropTypes.shape({
  monthlyRent: PropTypes.number.isRequired,
  household: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  split: PropTypes.shape({
    id: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    splitMode: PropTypes.string.isRequired,
    createdBy: PropTypes.shape({ name: PropTypes.string }),
    shares: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        userId: PropTypes.string,
        name: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        isMe: PropTypes.bool,
      })
    ).isRequired,
  }),
  myShare: PropTypes.number,
})

RentSplitCard.propTypes = {
  agreementId: PropTypes.string.isRequired,
  plan: planShape.isRequired,
  onChange: PropTypes.func.isRequired,
}

/**
 * Inline editor: total, equal or custom %, who is in. Household members
 * are prefilled; roommates not on the lease can be added by name.
 */
function SplitEditor({ agreementId, plan, onCancel, onSaved }) {
  const { split, household, monthlyRent } = plan
  const [total, setTotal] = useState(String(split?.total ?? monthlyRent))
  const [mode, setMode] = useState(split?.splitMode || 'equal')
  const [people, setPeople] = useState(() => {
    if (split) {
      return split.shares.map((s, i) => ({
        key: s.userId || `name-${i}`,
        userId: s.userId,
        name: s.name,
        percent:
          split.total > 0
            ? String(Math.round((s.amount / split.total) * 10000) / 100)
            : '',
      }))
    }
    return household.map(m => ({
      key: m.userId,
      userId: m.userId,
      name: m.name,
      percent: '',
    }))
  })
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const totalNum = parseFloat(total) || 0
  const percentTotal = people.reduce(
    (sum, p) => sum + (parseFloat(p.percent) || 0),
    0
  )
  const preview = p =>
    mode === 'equal'
      ? people.length
        ? totalNum / people.length
        : 0
      : (totalNum * (parseFloat(p.percent) || 0)) / 100

  const addPerson = () => {
    const name = newName.trim()
    if (!name) return
    setPeople(prev => [
      ...prev,
      { key: `name-${Date.now()}`, userId: null, name, percent: '' },
    ])
    setNewName('')
  }

  const canSave =
    totalNum > 0 &&
    people.length > 0 &&
    (mode === 'equal' || Math.abs(percentTotal - 100) < 0.1)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await rentService.saveSplit({
        agreementId,
        total: totalNum,
        splitMode: mode,
        shares: people.map(p => ({
          userId: p.userId,
          name: p.name,
          ...(mode === 'custom' && { percent: parseFloat(p.percent) || 0 }),
        })),
      })
      onSaved(result)
    } catch (err) {
      setError(err.message || 'Could not save the split.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="bg-white rounded-lg border border-brand-200 p-4 space-y-4"
      data-testid="rent-split-editor"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {split ? 'Edit rent split' : 'Set up a rent split'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="Cancel"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <label
          htmlFor="rent-split-total"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Total monthly rent
        </label>
        <input
          id="rent-split-total"
          type="number"
          min="0"
          step="1"
          value={total}
          onChange={e => setTotal(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
        {['equal', 'custom'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-semibold ${
              mode === m ? 'bg-brand-500 text-white' : 'text-gray-600'
            }`}
          >
            {m === 'equal' ? 'Equal split' : 'Custom %'}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {people.map(p => (
          <li
            key={p.key}
            className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-800 flex-1 truncate">
              {p.name}
            </span>
            {mode === 'custom' && (
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p.percent}
                  onChange={e =>
                    setPeople(prev =>
                      prev.map(x =>
                        x.key === p.key ? { ...x, percent: e.target.value } : x
                      )
                    )
                  }
                  aria-label={`${p.name} percent`}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                />
                <span className="text-xs text-gray-500">%</span>
              </span>
            )}
            <span className="text-sm font-semibold text-brand-600 w-20 text-right">
              ${preview(p).toFixed(2)}
            </span>
            <button
              onClick={() =>
                setPeople(prev => prev.filter(x => x.key !== p.key))
              }
              className="p-1 text-gray-300 hover:text-red-500"
              aria-label={`Remove ${p.name}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a roommate by name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPerson()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={addPerson}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          aria-label="Add roommate"
        >
          <Plus size={18} />
        </button>
      </div>

      {mode === 'custom' && people.length > 0 && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            Math.abs(percentTotal - 100) < 0.1
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          Total assigned: {percentTotal.toFixed(1)}%
          {Math.abs(percentTotal - 100) < 0.1 ? ' ✓' : ' — needs to be 100%'}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!canSave || busy}
          className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <Check size={16} /> {busy ? 'Saving…' : 'Save split'}
        </button>
      </div>
    </div>
  )
}

SplitEditor.propTypes = {
  agreementId: PropTypes.string.isRequired,
  plan: planShape.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}

export default RentSplitCard
