import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Receipt, Plus, Trash2, Calculator } from 'lucide-react'
import { expensesService } from '../../../services/expensesService'
import { money, shortDate } from './statusMeta'

const today = () => new Date().toISOString().slice(0, 10)

export default function ExpensesTab({ data, onRefresh }) {
  const { property } = data
  const year = new Date().getFullYear()
  const [items, setItems] = useState(data.expenses || [])
  const [categories, setCategories] = useState({})
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    date: today(),
    amount: '',
    category: 'repairs',
    description: '',
    vendor: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Pull the category list (IRS Schedule E lines) and the fresh list.
  useEffect(() => {
    let cancelled = false
    expensesService
      .list({ year, listingId: property.id })
      .then(res => {
        if (cancelled) return
        setItems(res.expenses || [])
        setCategories(res.categories || {})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [year, property.id])

  const total = items.reduce((s, e) => s + e.amount, 0)

  const reload = async () => {
    const res = await expensesService.list({ year, listingId: property.id })
    setItems(res.expenses || [])
    await onRefresh()
  }

  const submit = async e => {
    e.preventDefault()
    const amount = Math.round(Number(form.amount))
    if (!form.description.trim() || !amount || amount <= 0) {
      setError('Add a description and a positive amount.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await expensesService.create({
        date: form.date,
        amount,
        category: form.category,
        description: form.description.trim(),
        vendor: form.vendor.trim() || undefined,
        listingId: property.id,
      })
      setForm({
        date: today(),
        amount: '',
        category: form.category,
        description: '',
        vendor: '',
      })
      setAdding(false)
      await reload()
    } catch (err) {
      setError(err?.message || 'Could not save the expense.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async exp => {
    if (!window.confirm(`Delete "${exp.description}"?`)) return
    setBusy(true)
    try {
      await expensesService.remove(exp.id)
      await reload()
    } catch (err) {
      setError(err?.message || 'Could not delete the expense.')
    } finally {
      setBusy(false)
    }
  }

  const label = key => categories[key]?.label || key

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {year} expenses on this property
          </p>
          <p className="text-2xl font-bold text-gray-900">{money(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/tax"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
          >
            <Calculator size={14} /> Tax center
          </Link>
          <button
            type="button"
            onClick={() => setAdding(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
          >
            <Plus size={14} /> Add expense
          </button>
        </div>
      </div>

      {adding && (
        <form
          onSubmit={submit}
          className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <label className="text-xs text-gray-500">
            Date
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-500">
            Amount ($)
            <input
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-500">
            Category
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white"
            >
              {Object.keys(categories).length === 0 ? (
                <option value="repairs">Repairs</option>
              ) : (
                Object.entries(categories).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            Description
            <input
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What was it for?"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <label className="text-xs text-gray-500 md:col-span-2">
            Vendor (optional)
            <input
              value={form.vendor}
              onChange={e => set('vendor', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <div className="md:col-span-3 flex items-end justify-end gap-2">
            {error && <p className="text-xs text-red-600 mr-auto">{error}</p>}
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Save expense
            </button>
          </div>
        </form>
      )}

      {!adding && error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
          <Receipt size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-900">No expenses logged</p>
          <p className="text-sm text-gray-500 mt-1">
            Repairs, insurance and other costs you add here roll into the Tax
            Center.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map(exp => (
            <li key={exp.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {exp.description}
                </p>
                <p className="text-xs text-gray-500">
                  {label(exp.category)} · {shortDate(exp.date)}
                  {exp.vendor ? ` · ${exp.vendor}` : ''}
                </p>
              </div>
              <p className="font-semibold text-gray-900">{money(exp.amount)}</p>
              <button
                type="button"
                onClick={() => remove(exp)}
                disabled={busy}
                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                aria-label={`Delete ${exp.description}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

ExpensesTab.propTypes = {
  data: PropTypes.shape({
    property: PropTypes.object.isRequired,
    expenses: PropTypes.array,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
}
