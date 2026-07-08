import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { expensesService } from '../../services/expensesService'

const money = n => `$${Number(n || 0).toLocaleString()}`
const currentYear = new Date().getFullYear()

/** Build and download the Schedule E CSV for the selected year. */
function downloadCsv(summary) {
  const lines = [
    ['Schedule E Summary', String(summary.year)],
    [],
    ['Income'],
    ['Rents received (Line 3)', summary.totals.income],
    [],
    ['Expenses', 'Schedule E line', 'Amount'],
    ...Object.values(summary.byCategory).map(c => [c.label, c.line, c.total]),
    ['Total expenses (Line 20)', '', summary.totals.expenses],
    [],
    ['Net income (Line 21)', '', summary.totals.net],
    [],
    ['Per property', 'Income', 'Expenses'],
    ...summary.byProperty.map(p => [p.title, p.income, p.expenses]),
  ]
  const csv = lines
    .map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rentra-schedule-e-${summary.year}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TaxCenter() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    expensesService
      .taxSummary(year)
      .then(res => active && setSummary(res))
      .catch(err => active && setError(err.message))
    return () => {
      active = false
    }
  }, [year])

  const categories = summary ? Object.values(summary.byCategory) : []

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
          <h2 className="text-2xl font-bold">Tax Center</h2>
          <p className="text-gray-600">
            Schedule E view of your rental income and categorized expenses.
          </p>
        </div>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>
              Tax year {y}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!summary && !error && (
        <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Building summary…
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Rents received</div>
              <div className="text-xl font-bold text-green-600">
                {money(summary.totals.income)}
              </div>
              <div className="text-xs text-gray-400">Schedule E, Line 3</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total expenses</div>
              <div className="text-xl font-bold text-red-600">
                {money(summary.totals.expenses)}
              </div>
              <div className="text-xs text-gray-400">Schedule E, Line 20</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Net income</div>
              <div
                className={`text-xl font-bold ${
                  summary.totals.net >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {money(summary.totals.net)}
              </div>
              <div className="text-xs text-gray-400">Schedule E, Line 21</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Expenses by Schedule E line</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-600">
                No expenses recorded for {year}. Add them in Bookkeeping and
                they'll appear here, pre-categorized for Schedule E.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {categories.map(c => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{c.label}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {c.line} • {c.count} item{c.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <span className="font-semibold">{money(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {summary.byProperty.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Per property</h3>
              <div className="divide-y divide-gray-100">
                {summary.byProperty.map(p => (
                  <div
                    key={p.listingId || 'unassigned'}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-medium">{p.title}</span>
                    <span>
                      <span className="text-green-700">{money(p.income)}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600">-{money(p.expenses)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => downloadCsv(summary)}
            className="w-full inline-flex items-center justify-center bg-brand-500 text-white py-2.5 rounded-lg font-medium hover:bg-brand-600"
          >
            <Download size={16} className="mr-2" /> Download Schedule E CSV (
            {year})
          </button>
          <p className="text-xs text-gray-400 flex items-start">
            <FileText size={14} className="mr-1 mt-0.5 shrink-0" />
            Income counts completed ledger payments on your leases. Not tax
            advice — hand the CSV to your tax preparer.
          </p>
        </div>
      )}
    </div>
  )
}
