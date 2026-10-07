/**
 * Pure helpers for the landlord CSV import (routes/properties.js
 * POST /import): parse the file, then turn its rows into validated units,
 * each with its current household when the rows name tenants. No Prisma
 * here so it unit tests in isolation.
 *
 * One row per tenant; rows that share an address and unit are one
 * household. A row with no tenant columns is a vacant unit.
 */
import { validateOnboarding, normalizeEmail } from './onboarding.js'

export const MAX_IMPORT_ROWS = 500

/** Header names the import understands, in template order. */
export const IMPORT_COLUMNS = [
  'address',
  'unit',
  'city_state_zip',
  'property_type',
  'bedrooms',
  'bathrooms',
  'rent',
  'deposit',
  'lease_start',
  'lease_end',
  'tenant_first_name',
  'tenant_last_name',
  'tenant_email',
  'tenant_phone',
  'tenant_share',
]

/** Alternative spellings accepted for a column, after normalisation. */
const HEADER_ALIASES = {
  street_address: 'address',
  street: 'address',
  unit_label: 'unit',
  apt: 'unit',
  apartment: 'unit',
  location: 'city_state_zip',
  city: 'city_state_zip',
  locality: 'city_state_zip',
  type: 'property_type',
  beds: 'bedrooms',
  baths: 'bathrooms',
  monthly_rent: 'rent',
  price: 'rent',
  security_deposit: 'deposit',
  start_date: 'lease_start',
  end_date: 'lease_end',
  first_name: 'tenant_first_name',
  last_name: 'tenant_last_name',
  email: 'tenant_email',
  phone: 'tenant_phone',
  share: 'tenant_share',
  rent_share: 'tenant_share',
}

/** Accepted property types (schema.prisma PropertyType) by lowercase alias. */
const PROPERTY_TYPES = {
  apartment: 'Apartment',
  apt: 'Apartment',
  house: 'House',
  studio: 'Studio',
  singleroom: 'SingleRoom',
  single_room: 'SingleRoom',
  room: 'SingleRoom',
  condo: 'Condo',
  condominium: 'Condo',
}
const DEFAULT_PROPERTY_TYPE = 'Apartment'

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/
// Excel writes a byte-order mark ahead of the first header.
const BOM = String.fromCharCode(0xfeff)
const stripBom = s => (s.startsWith(BOM) ? s.slice(1) : s)

/** "Tenant First Name" / "tenant-first-name" → "tenant_first_name". */
export function normalizeHeader(name) {
  const key = stripBom(String(name || ''))
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  return HEADER_ALIASES[key] || key
}

/**
 * Split CSV text into records (arrays of strings). RFC-4180-ish: fields
 * separated by commas, optionally quoted with `"`, `""` escapes a quote,
 * quoted fields may span lines, CRLF or LF line endings, BOM tolerated.
 */
export function parseCsvRecords(text) {
  const src = stripBom(String(text || ''))
  const records = []
  let record = []
  let field = ''
  let quoted = false
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      field += ch
      i += 1
      continue
    }
    if (ch === '"') {
      quoted = true
      i += 1
      continue
    }
    if (ch === ',') {
      record.push(field)
      field = ''
      i += 1
      continue
    }
    if (ch === '\r' || ch === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
      i += ch === '\r' && src[i + 1] === '\n' ? 2 : 1
      continue
    }
    field += ch
    i += 1
  }
  if (field !== '' || record.length) {
    record.push(field)
    records.push(record)
  }
  return records
}

/**
 * Parse CSV text with a header row into
 * `{ headers: string[], rows: [{ row, values }] }`. `row` is the line's
 * spreadsheet number (the header is row 1); blank lines are skipped and
 * header names are normalised (see normalizeHeader).
 */
export function parseCsv(text) {
  const records = parseCsvRecords(text)
  if (!records.length) return { headers: [], rows: [] }
  const headers = records[0].map(normalizeHeader)
  const rows = []
  records.slice(1).forEach((record, index) => {
    if (record.every(cell => String(cell).trim() === '')) return
    const values = {}
    headers.forEach((header, col) => {
      if (!header) return
      values[header] = String(record[col] ?? '').trim()
    })
    rows.push({ row: index + 2, values })
  })
  return { headers: headers.filter(Boolean), rows }
}

const text = v => String(v ?? '').trim()
const has = v => text(v) !== ''

const toInt = v => {
  if (!has(v)) return NaN
  const n = Number(String(v).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : NaN
}
const toFloat = v => {
  if (!has(v)) return NaN
  const n = Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

const unitKey = (address, unit) =>
  `${address.toLowerCase().replace(/\s+/g, ' ')}|${unit
    .toLowerCase()
    .replace(/\s+/g, ' ')}`

const rowHasTenant = v =>
  has(v.tenant_first_name) || has(v.tenant_last_name) || has(v.tenant_email)

/**
 * Validate parsed rows into units ready to create.
 *
 * Returns `{ ok, errors: [{ row, message }], units }` where each unit is
 * `{ rows, address, unit, location, propertyType, bedrooms, bathrooms,
 *    rent, deposit, occupied, lease, tenants, split }`. `lease`, `tenants`
 * and `split` are the normalised values validateOnboarding produces for an
 * occupied unit, and null / [] / null for a vacant one. Every problem is
 * listed, not just the first; `units` is empty unless `ok`.
 */
export function validateImportRows(
  rows,
  { ownerEmail, now = new Date() } = {}
) {
  const errors = []
  const fail = (row, message) => errors.push({ row, message })
  const list = Array.isArray(rows) ? rows : []

  if (!list.length) {
    fail(0, 'The file has no data rows under the header.')
    return { ok: false, errors, units: [] }
  }
  if (list.length > MAX_IMPORT_ROWS) {
    fail(
      0,
      `The file has ${list.length} rows; the limit is ${MAX_IMPORT_ROWS} per import.`
    )
    return { ok: false, errors, units: [] }
  }

  // Group rows into units by address + unit label, first appearance first.
  const groups = new Map()
  for (const { row, values: v } of list) {
    const address = text(v.address).replace(/\s+/g, ' ')
    const unit = text(v.unit).replace(/\s+/g, ' ').slice(0, 40)
    if (!address) {
      fail(row, 'A street address is required.')
      continue
    }
    const key = unitKey(address, unit)
    if (!groups.has(key)) groups.set(key, { key, address, unit, rows: [] })
    groups.get(key).rows.push({ row, values: v })
  }

  const emailRows = new Map()
  const units = []
  for (const group of groups.values()) {
    const first = group.rows[0]
    const v = first.values
    const unitErrors = errors.length

    const location = text(v.city_state_zip)
    if (!location) {
      fail(
        first.row,
        'City, state and ZIP are required (for example "Pacific Beach, San Diego, CA 92109").'
      )
    }

    let propertyType = DEFAULT_PROPERTY_TYPE
    if (has(v.property_type)) {
      const typeKey = text(v.property_type)
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
      propertyType = PROPERTY_TYPES[typeKey] || null
      if (!propertyType) {
        fail(
          first.row,
          `Property type "${text(v.property_type)}" is not one of Apartment, House, Studio, SingleRoom or Condo.`
        )
      }
    }

    const bedrooms = has(v.bedrooms) ? toInt(v.bedrooms) : 1
    if (!(bedrooms >= 0 && bedrooms <= 20)) {
      fail(first.row, 'Bedrooms must be a whole number (0 for a studio).')
    }
    const bathrooms = has(v.bathrooms) ? toFloat(v.bathrooms) : 1
    if (!(bathrooms > 0 && bathrooms <= 20)) {
      fail(first.row, 'Bathrooms must be a positive number.')
    }

    const rent = toInt(v.rent)
    if (!(rent > 0)) fail(first.row, 'Rent must be a positive whole amount.')
    const deposit = has(v.deposit) ? toInt(v.deposit) : 0
    if (!(deposit >= 0)) {
      fail(first.row, 'Deposit must be zero or a positive whole amount.')
    }

    // Unit-level columns must agree across a household's rows.
    for (const other of group.rows.slice(1)) {
      const o = other.values
      for (const col of ['rent', 'deposit', 'lease_start', 'lease_end']) {
        if (has(o[col]) && text(o[col]) !== text(v[col])) {
          fail(
            other.row,
            `${col} differs from row ${first.row} for the same unit; a household shares one lease.`
          )
        }
      }
      if (!rowHasTenant(o)) {
        fail(
          other.row,
          `This unit already appears on row ${first.row}; add a tenant to this row or remove it.`
        )
      }
    }

    const tenantRows = group.rows.filter(r => rowHasTenant(r.values))
    const occupied = tenantRows.length > 0

    let lease = null
    let tenants = []
    let split = null
    if (occupied) {
      for (const col of ['lease_start', 'lease_end']) {
        if (has(v[col]) && !DATE_ONLY_RE.test(text(v[col]))) {
          fail(first.row, `${col} must be a date written as YYYY-MM-DD.`)
        }
      }
      if (!has(v.lease_start)) {
        fail(first.row, 'lease_start is required when the unit has tenants.')
      }
      for (const r of tenantRows) {
        const email = normalizeEmail(r.values.tenant_email)
        if (email && emailRows.has(email) && emailRows.get(email) !== r.row) {
          fail(
            r.row,
            `${email} is also listed on row ${emailRows.get(email)}; a tenant belongs to one unit.`
          )
        } else if (email) {
          emailRows.set(email, r.row)
        }
      }
      const checked = validateOnboarding(
        {
          attest: true,
          lease: {
            startDate: text(v.lease_start),
            endDate: has(v.lease_end) ? text(v.lease_end) : undefined,
            monthToMonth: !has(v.lease_end),
            monthlyRent: rent,
            securityDeposit: deposit,
          },
          tenants: tenantRows.map(r => ({
            firstName: r.values.tenant_first_name,
            lastName: r.values.tenant_last_name,
            email: r.values.tenant_email,
            phone: r.values.tenant_phone,
            share: has(r.values.tenant_share)
              ? r.values.tenant_share
              : undefined,
          })),
        },
        { ownerEmail, now }
      )
      if (checked.ok) {
        ;({ lease, tenants, split } = checked.value)
      } else {
        for (const message of checked.errors) {
          // "Tenant 2: ..." belongs to that tenant's row; the rest to the unit.
          const m = /^Tenant (\d+): (.*)$/.exec(message)
          const tenantRow = m ? tenantRows[Number(m[1]) - 1] : null
          fail(tenantRow ? tenantRow.row : first.row, m ? m[2] : message)
        }
      }
    }

    if (errors.length > unitErrors) continue
    units.push({
      rows: group.rows.map(r => r.row),
      address: group.address,
      unit: group.unit || null,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      rent,
      deposit,
      occupied,
      lease,
      tenants,
      split,
    })
  }

  errors.sort((a, b) => a.row - b.row)
  return { ok: errors.length === 0, errors, units: errors.length ? [] : units }
}

/** Counts for a dry-run preview. */
export function summarizeUnits(units) {
  const list = units || []
  return {
    units: list.length,
    occupied: list.filter(u => u.occupied).length,
    vacant: list.filter(u => !u.occupied).length,
    tenants: list.reduce((sum, u) => sum + u.tenants.length, 0),
  }
}

/** Listing title and description for an imported unit. */
export function listingTextFor(unit) {
  const beds = unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}-bedroom`
  const type =
    unit.propertyType === 'SingleRoom'
      ? 'room'
      : unit.propertyType.toLowerCase()
  const where = unit.unit ? `${unit.address}, Unit ${unit.unit}` : unit.address
  return {
    title: unit.unit ? `${unit.address} · Unit ${unit.unit}` : unit.address,
    description: `${beds} ${type} at ${where}.`,
  }
}
