import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { propertiesService } from '../../services/propertiesService'
import { money, shortDate } from './property/statusMeta'

/** Template columns, in order, with what each one means. */
export const COLUMNS = [
  { key: 'address', required: true, help: 'Street address of the building' },
  { key: 'unit', help: 'Unit label like 2B; blank for a whole house' },
  {
    key: 'city_state_zip',
    required: true,
    help: 'Shown publicly, e.g. "Pacific Beach, San Diego, CA 92109"',
  },
  {
    key: 'property_type',
    help: 'Apartment (default), House, Studio, SingleRoom or Condo',
  },
  { key: 'bedrooms', help: 'Whole number; 0 for a studio (default 1)' },
  { key: 'bathrooms', help: 'e.g. 1 or 1.5 (default 1)' },
  { key: 'rent', required: true, help: 'Monthly rent in whole dollars' },
  { key: 'deposit', help: 'Deposit held, whole dollars (default 0)' },
  {
    key: 'lease_start',
    required: 'tenants',
    help: 'YYYY-MM-DD; required when the row names a tenant',
  },
  { key: 'lease_end', help: 'YYYY-MM-DD; leave blank for month-to-month' },
  { key: 'tenant_first_name', help: 'One row per tenant' },
  { key: 'tenant_last_name', help: '' },
  { key: 'tenant_email', help: 'Where their invitation goes' },
  { key: 'tenant_phone', help: 'Optional' },
  {
    key: 'tenant_share',
    help: 'Their share of the rent; blank splits it equally',
  },
]

const EXAMPLE_ROWS = [
  [
    '1245 Grand Ave',
    '1A',
    'Pacific Beach, San Diego, CA 92109',
    'Apartment',
    '2',
    '1',
    '2400',
    '2400',
    '2026-08-01',
    '2027-07-31',
    'Emma',
    'Wilson',
    'emma@example.com',
    '619-555-0100',
    '1200',
  ],
  [
    '1245 Grand Ave',
    '1A',
    'Pacific Beach, San Diego, CA 92109',
    'Apartment',
    '2',
    '1',
    '2400',
    '2400',
    '2026-08-01',
    '2027-07-31',
    'Alex',
    'Johnson',
    'alex@example.com',
    '',
    '1200',
  ],
  [
    '1245 Grand Ave',
    '1B',
    'Pacific Beach, San Diego, CA 92109',
    'Apartment',
    '1',
    '1',
    '1900',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
]

const csvCell = v => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** The downloadable template: header plus the example household and a vacant unit. */
export function templateCsv() {
  return [COLUMNS.map(c => c.key), ...EXAMPLE_ROWS]
    .map(row => row.map(csvCell).join(','))
    .join('\r\n')
}

function downloadTemplate() {
  const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rentra-units-template.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const unitLabel = u => (u.unit ? `${u.address}, Unit ${u.unit}` : u.address)

function Tile({ label, value, Icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
      <span className="p-2 rounded-lg bg-gray-100 text-gray-600">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

Tile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Icon: PropTypes.elementType.isRequired,
}

function ErrorTable({ errors }) {
  if (!errors?.length) return null
  return (
    <section className="bg-red-50 border border-red-200 rounded-xl p-5">
      <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
        <AlertCircle size={16} /> {errors.length} problem
        {errors.length === 1 ? '' : 's'} to fix
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-red-700">
            <th className="pb-1 pr-4 font-medium w-16">Row</th>
            <th className="pb-1 font-medium">Problem</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={`${e.row}-${i}`} className="border-t border-red-100">
              <td className="py-1.5 pr-4 text-red-900 font-mono">
                {e.row || '—'}
              </td>
              <td className="py-1.5 text-red-900">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

ErrorTable.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({ row: PropTypes.number, message: PropTypes.string })
  ),
}

function SkippedList({ skipped }) {
  if (!skipped?.length) return null
  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm">
      <h3 className="font-semibold text-amber-900 mb-2">
        {skipped.length} unit{skipped.length === 1 ? '' : 's'} already on your
        portfolio (left unchanged)
      </h3>
      <ul className="space-y-1">
        {skipped.map(s => (
          <li key={s.listingId} className="flex items-center gap-2">
            <span className="text-amber-900">{unitLabel(s)}</span>
            <span className="text-xs text-amber-700">
              rows {s.rows.join(', ')}
            </span>
            <Link
              to={`/dashboard/properties/${s.listingId}`}
              className="text-brand-600 text-xs font-medium hover:underline"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

SkippedList.propTypes = {
  skipped: PropTypes.arrayOf(
    PropTypes.shape({
      listingId: PropTypes.string,
      address: PropTypes.string,
      unit: PropTypes.string,
      rows: PropTypes.arrayOf(PropTypes.number),
    })
  ),
}

/**
 * Landlord bulk import at /dashboard/import: a CSV of units and their
 * current tenants is checked on the server first (nothing written), then
 * imported. Occupied units are onboarded like "Add current tenants" and
 * each tenant is emailed an invitation.
 */
export default function ImportProperties() {
  const fileRef = useRef(null)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const reset = () => {
    setPreview(null)
    setResult(null)
    setError('')
  }

  const onFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCsv(String(reader.result || ''))
      setFileName(file.name)
      reset()
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsText(file)
  }

  const check = async () => {
    setChecking(true)
    setError('')
    setResult(null)
    try {
      setPreview(await propertiesService.checkImport(csv))
    } catch (err) {
      setError(err?.message || 'Could not check the file.')
    } finally {
      setChecking(false)
    }
  }

  const runImport = async () => {
    setImporting(true)
    setError('')
    try {
      const res = await propertiesService.importCsv(csv)
      setResult(res)
      setPreview(null)
    } catch (err) {
      setError(
        err?.message || 'The import failed. Nothing may have been saved.'
      )
    } finally {
      setImporting(false)
    }
  }

  const canImport =
    preview && preview.ok && preview.summary.units > 0 && !importing

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={15} /> All properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Import units &amp; tenants
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
          Bring a whole building over at once. Each row is one tenant; rows that
          share an address and unit are one household on one lease. A row with
          no tenant creates a vacant, listed unit. Occupied units are created
          unlisted and every tenant gets an email invitation to confirm their
          lease, exactly like adding current tenants one property at a time.
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {result ? (
          <Results result={result} onAgain={() => setResult(null)} />
        ) : (
          <div className="mt-6 space-y-6">
            {/* 1. Format */}
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" /> 1. Prepare
                  your file
                </h2>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
                >
                  <Download size={13} /> Download template
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                A CSV with these columns (header names are not case sensitive;
                up to 500 rows per file):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {COLUMNS.map(c => (
                      <tr key={c.key} className="border-t border-gray-100">
                        <td className="py-1.5 pr-4 font-mono text-xs text-gray-900 whitespace-nowrap">
                          {c.key}
                          {c.required === true && (
                            <span className="text-red-500"> *</span>
                          )}
                        </td>
                        <td className="py-1.5 text-gray-600">{c.help}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. Upload */}
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Upload size={16} className="text-gray-400" /> 2. Upload or
                paste
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={onFile}
                  className="hidden"
                  data-testid="import-file"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-600"
                >
                  <Upload size={14} /> Choose CSV file
                </button>
                {fileName && (
                  <span className="text-sm text-gray-500">{fileName}</span>
                )}
              </div>
              <label
                htmlFor="import-csv"
                className="block text-xs text-gray-500 mb-1"
              >
                Or paste the CSV contents
              </label>
              <textarea
                id="import-csv"
                value={csv}
                onChange={e => {
                  setCsv(e.target.value)
                  setFileName('')
                  reset()
                }}
                rows={8}
                spellCheck={false}
                placeholder={`address,unit,city_state_zip,rent,...\n1245 Grand Ave,1A,"Pacific Beach, San Diego, CA 92109",2400,...`}
                className="w-full p-3 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={check}
                  disabled={!csv.trim() || checking}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {checking ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Check file
                </button>
              </div>
            </section>

            {/* 3. Preview */}
            {preview && (
              <section className="space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={16} className="text-gray-400" /> 3. Review
                  and import
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Tile
                    label="Units to create"
                    value={preview.summary.units}
                    Icon={Building2}
                  />
                  <Tile
                    label="Occupied"
                    value={preview.summary.occupied}
                    Icon={Users}
                  />
                  <Tile
                    label="Vacant (listed)"
                    value={preview.summary.vacant}
                    Icon={FileText}
                  />
                  <Tile
                    label="Tenants to invite"
                    value={preview.summary.tenants}
                    Icon={Users}
                  />
                </div>
                <ErrorTable errors={preview.errors} />
                <SkippedList skipped={preview.skipped} />
                {preview.units.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 text-left">
                        <tr>
                          <th className="px-4 py-2 font-medium">Unit</th>
                          <th className="px-4 py-2 font-medium">Type</th>
                          <th className="px-4 py-2 font-medium">Rent</th>
                          <th className="px-4 py-2 font-medium">Lease</th>
                          <th className="px-4 py-2 font-medium">Tenants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.units.map(u => (
                          <tr
                            key={`${u.address}|${u.unit || ''}`}
                            className="border-t border-gray-100 align-top"
                          >
                            <td className="px-4 py-2">
                              <p className="font-medium text-gray-900">
                                {unitLabel(u)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {u.location} · rows {u.rows.join(', ')}
                              </p>
                            </td>
                            <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                              {u.propertyType} ·{' '}
                              {u.bedrooms === 0 ? 'Studio' : `${u.bedrooms} bd`}{' '}
                              / {u.bathrooms} ba
                            </td>
                            <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                              {money(u.rent)}/mo
                              {u.deposit > 0 && (
                                <p className="text-xs text-gray-500">
                                  {money(u.deposit)} deposit
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                              {u.lease
                                ? `${shortDate(u.lease.startDate)} – ${
                                    u.lease.monthToMonth
                                      ? 'Month-to-month'
                                      : shortDate(u.lease.endDate)
                                  }`
                                : 'Vacant · listed'}
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {u.tenants.length === 0
                                ? '—'
                                : u.tenants.map(t => (
                                    <p key={t.email}>
                                      {t.firstName} {t.lastName}{' '}
                                      <span className="text-xs text-gray-500">
                                        {t.email}
                                        {t.share != null &&
                                          u.tenants.length > 1 &&
                                          ` · ${money(t.share)}`}
                                      </span>
                                    </p>
                                  ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {preview.ok
                      ? 'Importing creates every unit above and emails each tenant an invitation.'
                      : 'Fix the problems in your file, then check it again.'}
                  </p>
                  <button
                    type="button"
                    onClick={runImport}
                    disabled={!canImport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
                  >
                    {importing ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    Import {preview.summary.units} unit
                    {preview.summary.units === 1 ? '' : 's'}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Results({ result, onAgain }) {
  const { created = [], skipped = [], errors = [] } = result
  const invited = created.reduce((n, c) => n + c.tenants.length, 0)
  const unsent = created.flatMap(c => c.tenants.filter(t => !t.emailSent))
  return (
    <div className="mt-6 space-y-4">
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          {created.length} unit{created.length === 1 ? '' : 's'} imported
          {invited > 0 &&
            `, ${invited} tenant${invited === 1 ? '' : 's'} invited`}
        </h2>
        {unsent.length > 0 && (
          <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {unsent.length} invitation email
            {unsent.length === 1 ? '' : 's'} could not be sent. Resend them from
            each property&apos;s Tenants tab.
          </p>
        )}
        {created.length > 0 && (
          <ul className="divide-y divide-gray-100 mt-3">
            {created.map(c => (
              <li key={c.listingId}>
                <Link
                  to={`/dashboard/properties/${c.listingId}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-600"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-gray-900">
                      {unitLabel(c)}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {c.tenants.length === 0
                        ? 'Vacant · listed'
                        : c.tenants
                            .map(
                              t =>
                                `${t.firstName} ${t.lastName}${
                                  t.emailSent ? '' : ' (email failed)'
                                }`
                            )
                            .join(', ')}
                    </span>
                  </span>
                  <ChevronRight size={15} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <SkippedList skipped={skipped} />
      <ErrorTable errors={errors} />
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600"
        >
          <Building2 size={15} /> View properties
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="text-sm text-brand-600 font-medium hover:underline"
        >
          Import another file
        </button>
      </div>
    </div>
  )
}

Results.propTypes = {
  result: PropTypes.shape({
    created: PropTypes.array,
    skipped: PropTypes.array,
    errors: PropTypes.array,
  }).isRequired,
  onAgain: PropTypes.func.isRequired,
}
