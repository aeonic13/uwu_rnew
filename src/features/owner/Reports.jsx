import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Download,
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Home,
} from 'lucide-react'
import { reportsService } from '../../services/reportsService'
import { money } from './property/statusMeta'

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Labels for the Schedule E categories in server/routes/expenses.js. */
const CATEGORY_LABELS = {
  advertising: 'Advertising',
  auto_travel: 'Auto & travel',
  cleaning_maintenance: 'Cleaning & maintenance',
  insurance: 'Insurance',
  legal_professional: 'Legal & professional fees',
  management_fees: 'Management fees',
  mortgage_interest: 'Mortgage interest',
  repairs: 'Repairs',
  supplies: 'Supplies',
  taxes: 'Taxes',
  utilities: 'Utilities',
  other: 'Other',
}

/** "Jun" from a "2026-06" month key. */
const monthLabel = key => {
  const index = Number(String(key).slice(5, 7)) - 1
  return MONTH_NAMES[index] || key
}

const percent = n => `${Math.round(Number(n) || 0)}%`

const netClass = n => (n < 0 ? 'text-red-600' : 'text-gray-900')

function StatTile({ label, value, Icon, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-600',
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
      <span className={`p-2 rounded-lg ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['gray', 'brand', 'green', 'red']),
}

/**
 * A money cell with a thin decorative bar scaled to the year's largest
 * monthly value. The number is always printed; the bar only adds shape.
 */
function BarCell({ value, max, barClass }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <td className="px-3 py-2 text-right tabular-nums align-middle">
      <div className="inline-flex flex-col items-end min-w-[5.5rem]">
        <span>{money(value)}</span>
        <span
          className="block h-1 w-full rounded bg-gray-100 mt-1"
          aria-hidden="true"
        >
          <span
            className={`block h-1 rounded ${barClass}`}
            style={{ width: `${width}%` }}
          />
        </span>
      </div>
    </td>
  )
}

BarCell.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  barClass: PropTypes.string.isRequired,
}

const thClass =
  'px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide'

function MonthlyTable({ months }) {
  const max = Math.max(0, ...months.map(m => Math.max(m.income, m.expenses)))
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <h3 className="font-semibold px-4 pt-4 pb-2">Income vs expenses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="border-b border-gray-200">
            <tr>
              <th className={`${thClass} text-left`}>Month</th>
              <th className={`${thClass} text-right`}>Income</th>
              <th className={`${thClass} text-right`}>Expenses</th>
              <th className={`${thClass} text-right`}>Net</th>
              <th className={`${thClass} text-right`}>Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => (
              <tr
                key={m.month}
                data-testid={`month-row-${m.month}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-3 py-2 text-gray-700">
                  {monthLabel(m.month)}
                </td>
                <BarCell value={m.income} max={max} barClass="bg-brand-500" />
                <BarCell value={m.expenses} max={max} barClass="bg-gray-400" />
                <td
                  className={`px-3 py-2 text-right tabular-nums font-medium ${netClass(m.net)}`}
                >
                  {money(m.net)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                  {m.totalUnits > 0
                    ? `${m.occupiedUnits} / ${m.totalUnits} (${percent(m.occupancyRate)})`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

MonthlyTable.propTypes = {
  months: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      income: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
      net: PropTypes.number.isRequired,
      occupiedUnits: PropTypes.number.isRequired,
      totalUnits: PropTypes.number.isRequired,
      occupancyRate: PropTypes.number.isRequired,
    })
  ).isRequired,
}

function CategoryTable({ byCategory, total }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <h3 className="font-semibold px-4 pt-4 pb-2">Expenses by category</h3>
      {byCategory.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-gray-500">
          No expenses recorded this year.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200">
              <tr>
                <th className={`${thClass} text-left`}>Category</th>
                <th className={`${thClass} text-right`}>Amount</th>
                <th className={`${thClass} text-right`}>Share</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map(c => (
                <tr
                  key={c.category}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-2 text-gray-700">
                    {CATEGORY_LABELS[c.category] || c.category}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {money(c.amount)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                    {total > 0 ? percent((c.amount / total) * 100) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

CategoryTable.propTypes = {
  byCategory: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
}

function PropertyTable({ byProperty }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <h3 className="font-semibold px-4 pt-4 pb-2">By property</h3>
      {byProperty.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-gray-500">No properties yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="border-b border-gray-200">
              <tr>
                <th className={`${thClass} text-left`}>Property</th>
                <th className={`${thClass} text-right`}>Income</th>
                <th className={`${thClass} text-right`}>Expenses</th>
                <th className={`${thClass} text-right`}>Net</th>
                <th className={`${thClass} text-right`}>Occupied months</th>
                <th className={`${thClass} text-right`}>Vacant days</th>
              </tr>
            </thead>
            <tbody>
              {byProperty.map(p => (
                <tr
                  key={p.listingId}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-2 text-gray-900 font-medium">
                    {p.title}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {money(p.income)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {money(p.expenses)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${netClass(p.net)}`}
                  >
                    {money(p.net)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {p.occupiedMonths}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {p.vacancyDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

PropertyTable.propTypes = {
  byProperty: PropTypes.arrayOf(
    PropTypes.shape({
      listingId: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      income: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
      net: PropTypes.number.isRequired,
      occupiedMonths: PropTypes.number.isRequired,
      vacancyDays: PropTypes.number.isRequired,
    })
  ).isRequired,
}

export default function Reports() {
  const navigate = useNavigate()
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReport(null)
    setError(null)
    reportsService
      .getSummary(year)
      .then(data => {
        if (!cancelled) setReport(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  const exportCsv = async () => {
    setExporting(true)
    setError(null)
    try {
      await reportsService.downloadCsv(year)
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const totals = report?.totals
  const isEmpty =
    report && totals && totals.income === 0 && totals.expenses === 0

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" /> Dashboard
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-gray-600">
            Vacancy, income versus expenses by month, and the year at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || !report}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <Download size={14} className="mr-1" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!report && !error && (
        <div className="min-h-[30vh] flex items-center justify-center text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      )}

      {report && isEmpty && (
        <div className="bg-white border border-gray-200 rounded-lg text-center py-12 px-4 mb-6">
          <BarChart3 size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-900 font-medium">
            No income or expenses recorded for {year}.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Rent collected through Rentra and expenses added in Bookkeeping show
            up here.
          </p>
          {report.byProperty.length > 0 && (
            <p className="text-gray-600 text-sm mt-3">
              Average occupancy {percent(totals.averageOccupancy)} across{' '}
              {report.byProperty.length}{' '}
              {report.byProperty.length === 1 ? 'property' : 'properties'},{' '}
              {totals.vacancyDays.toLocaleString()} vacant days.
            </p>
          )}
        </div>
      )}

      {report && !isEmpty && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
            <StatTile
              label="Income"
              value={money(totals.income)}
              Icon={TrendingUp}
              tone="green"
            />
            <StatTile
              label="Expenses"
              value={money(totals.expenses)}
              Icon={TrendingDown}
              tone="red"
            />
            <StatTile
              label="Net"
              value={money(totals.net)}
              Icon={BarChart3}
              tone={totals.net < 0 ? 'red' : 'brand'}
            />
            <StatTile
              label="Average occupancy"
              value={percent(totals.averageOccupancy)}
              Icon={Home}
            />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Vacant days: {totals.vacancyDays.toLocaleString()}
            {year === currentYear ? ' so far this year' : ''} across{' '}
            {report.byProperty.length}{' '}
            {report.byProperty.length === 1 ? 'property' : 'properties'}.
          </p>

          <MonthlyTable months={report.months} />
          <CategoryTable
            byCategory={report.byCategory}
            total={totals.expenses}
          />
          <PropertyTable byProperty={report.byProperty} />
        </>
      )}
    </div>
  )
}
