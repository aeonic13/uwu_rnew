import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react'
import { expensesService } from '../../services/expensesService'
import { listingsService } from '../../services/listingsService'

const money = n => `$${Number(n || 0).toLocaleString()}`
const currentYear = new Date().getFullYear()

function ExpenseForm({ categories, listings, onSaved, onCancel }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: 'repairs',
    description: '',
    vendor: '',
    listingId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await expensesService.create({
        ...form,
        amount: Number(form.amount),
        vendor: form.vendor || undefined,
        listingId: form.listingId || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <h3 className="font-semibold">Add expense</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Amount ($)</label>
          <input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            {Object.entries(categories).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Property (optional)
          </label>
          <select
            value={form.listingId}
            onChange={e => set('listingId', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            <option value="">— Portfolio-wide —</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <input
        type="text"
        required
        placeholder="Description"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        placeholder="Vendor (optional)"
        value={form.vendor}
        onChange={e => set('vendor', e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save expense'}
        </button>
      </div>
    </form>
  )
}

export default function Bookkeeping() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [expenses, setExpenses] = useState(null)
  const [categories, setCategories] = useState({})
  const [summary, setSummary] = useState(null)
  const [listings, setListings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    Promise.all([
      expensesService.list({ year }),
      expensesService.taxSummary(year),
    ])
      .then(([listRes, summaryRes]) => {
        setExpenses(listRes.expenses || [])
        setCategories(listRes.categories || {})
        setSummary(summaryRes)
      })
      .catch(err => setError(err.message))
  }, [year])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    listingsService
      .getMyListings?.()
      .then(res => setListings(res.listings || res || []))
      .catch(() => setListings([]))
  }, [])

  const removeExpense = async id => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await expensesService.remove(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const totals = summary?.totals || { income: 0, expenses: 0, net: 0 }

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookkeeping</h2>
          <p className="text-gray-600">
            Rental income (from your ledger) and property expenses.
          </p>
        </div>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!summary && !error && (
        <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp size={14} className="mr-1 text-green-600" /> Income
              </div>
              <div className="text-xl font-bold text-green-600">
                {money(totals.income)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center text-sm text-gray-600">
                <TrendingDown size={14} className="mr-1 text-red-600" />{' '}
                Expenses
              </div>
              <div className="text-xl font-bold text-red-600">
                {money(totals.expenses)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Net</div>
              <div
                className={`text-xl font-bold ${
                  totals.net >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {money(totals.net)}
              </div>
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Monthly ({year})</h3>
            <div className="space-y-1">
              {summary.byMonth.map(m => {
                const max = Math.max(
                  1,
                  ...summary.byMonth.map(x => Math.max(x.income, x.expenses))
                )
                return (
                  <div key={m.month} className="flex items-center text-xs">
                    <span className="w-8 text-gray-500">
                      {new Date(year, m.month - 1, 1).toLocaleString('en-US', {
                        month: 'short',
                      })}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div
                        className="bg-green-500/80 h-1.5 rounded"
                        style={{ width: `${(m.income / max) * 100}%` }}
                      />
                      <div
                        className="bg-red-400/80 h-1.5 rounded"
                        style={{ width: `${(m.expenses / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-green-700">
                      {money(m.income)}
                    </span>
                    <span className="w-20 text-right text-red-600">
                      -{money(m.expenses)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Expenses</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            <Plus size={14} className="mr-1" /> Add expense
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4">
          <ExpenseForm
            categories={categories}
            listings={listings}
            onCancel={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false)
              load()
            }}
          />
        </div>
      )}

      {expenses && expenses.length === 0 && !showForm && (
        <div className="text-center py-10">
          <Receipt size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600">
            No expenses recorded for {year}. Add repairs, insurance, taxes —
            they flow straight into your Tax Center.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {(expenses || []).map(e => (
          <div
            key={e.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-sm">{e.description}</div>
              <div className="text-xs text-gray-500">
                {new Date(e.date).toLocaleDateString()} •{' '}
                {categories[e.category]?.label || e.category}
                {e.listing ? ` • ${e.listing.title}` : ''}
                {e.vendor ? ` • ${e.vendor}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-red-600">
                -{money(e.amount)}
              </span>
              <button
                onClick={() => removeExpense(e.id)}
                className="text-gray-400 hover:text-red-600"
                title="Delete expense"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
