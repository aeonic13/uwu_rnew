import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  parseCsvRecords,
  normalizeHeader,
  validateImportRows,
  summarizeUnits,
  listingTextFor,
  MAX_IMPORT_ROWS,
  IMPORT_COLUMNS,
} from '../utils/importCsv.js'

const NOW = new Date('2026-10-06T18:00:00Z')
const OWNER = 'jennifer@example.com'

const HEADER = IMPORT_COLUMNS.join(',')

const line = (over = {}) => {
  const cells = {
    address: '1245 Grand Ave',
    unit: '2B',
    city_state_zip: 'Pacific Beach, San Diego, CA 92109',
    property_type: 'Apartment',
    bedrooms: '2',
    bathrooms: '1',
    rent: '2400',
    deposit: '2400',
    lease_start: '2026-08-01',
    lease_end: '2027-07-31',
    tenant_first_name: 'Emma',
    tenant_last_name: 'Wilson',
    tenant_email: 'emma@example.com',
    tenant_phone: '',
    tenant_share: '',
    ...over,
  }
  return IMPORT_COLUMNS.map(c => quote(cells[c] ?? '')).join(',')
}

const quote = v => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

const csv = (...lines) => [HEADER, ...lines].join('\n')

const validate = (text, opts = {}) =>
  validateImportRows(parseCsv(text).rows, {
    ownerEmail: OWNER,
    now: NOW,
    ...opts,
  })

describe('parseCsvRecords / parseCsv', () => {
  it('splits plain fields, CRLF line endings and a trailing newline', () => {
    expect(parseCsvRecords('a,b,c\r\n1,2,3\r\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields with commas, escaped quotes and newlines', () => {
    const records = parseCsvRecords(
      '"Grand Ave, Apt ""2B""",x\n"multi\nline",y'
    )
    expect(records).toEqual([
      ['Grand Ave, Apt "2B"', 'x'],
      ['multi\nline', 'y'],
    ])
  })

  it('keeps empty fields and a trailing empty field', () => {
    expect(parseCsvRecords('a,,c\n,,')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ])
  })

  it('normalises headers, tolerates a BOM, and skips blank lines', () => {
    const parsed = parseCsv(
      String.fromCharCode(0xfeff) +
        'Address,Unit,City State Zip,Tenant-Email\n1 Main St,,San Diego, CA,\n\n2 Main St,3,"San Diego, CA",a@b.co\n'
    )
    expect(parsed.headers).toEqual([
      'address',
      'unit',
      'city_state_zip',
      'tenant_email',
    ])
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0].row).toBe(2)
    expect(parsed.rows[1]).toEqual({
      row: 4,
      values: {
        address: '2 Main St',
        unit: '3',
        city_state_zip: 'San Diego, CA',
        tenant_email: 'a@b.co',
      },
    })
  })

  it('maps alias headers onto the canonical names', () => {
    expect(normalizeHeader('Location')).toBe('city_state_zip')
    expect(normalizeHeader('Street Address')).toBe('address')
    expect(normalizeHeader('Email')).toBe('tenant_email')
    expect(normalizeHeader('Monthly Rent')).toBe('rent')
    expect(normalizeHeader('  Property type ')).toBe('property_type')
  })

  it('returns nothing for empty text', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] })
  })
})

describe('validateImportRows', () => {
  it('builds an occupied unit with a validated lease and household', () => {
    const result = validate(
      csv(
        line(),
        line({
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'Alex@Example.com',
          tenant_phone: '619-555-0100',
        })
      )
    )
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.units).toHaveLength(1)
    const unit = result.units[0]
    expect(unit).toMatchObject({
      rows: [2, 3],
      address: '1245 Grand Ave',
      unit: '2B',
      location: 'Pacific Beach, San Diego, CA 92109',
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      rent: 2400,
      deposit: 2400,
      occupied: true,
    })
    expect(unit.lease.monthToMonth).toBe(false)
    expect(unit.lease.startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z')
    expect(unit.lease.endDate.toISOString()).toBe('2027-07-31T00:00:00.000Z')
    expect(unit.tenants).toEqual([
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma@example.com',
        phone: null,
      },
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@example.com',
        phone: '619-555-0100',
      },
    ])
    expect(unit.split).toEqual({ mode: 'equal', amounts: [1200, 1200] })
  })

  it('treats a row without tenant columns as a vacant unit', () => {
    const result = validate(
      csv(
        line({
          unit: '3A',
          tenant_first_name: '',
          tenant_last_name: '',
          tenant_email: '',
          lease_start: '',
          lease_end: '',
          deposit: '',
        })
      )
    )
    expect(result.ok).toBe(true)
    expect(result.units[0]).toMatchObject({
      unit: '3A',
      occupied: false,
      lease: null,
      tenants: [],
      split: null,
      deposit: 0,
    })
  })

  it('makes a blank lease_end month-to-month with a rolling end date', () => {
    const result = validate(csv(line({ lease_end: '' })))
    expect(result.ok).toBe(true)
    expect(result.units[0].lease.monthToMonth).toBe(true)
    expect(result.units[0].lease.endDate.toISOString()).toBe(
      '2027-08-01T00:00:00.000Z'
    )
  })

  it('uses custom shares when every tenant carries one', () => {
    const result = validate(
      csv(
        line({ tenant_share: '1500' }),
        line({
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'alex@example.com',
          tenant_share: '900',
        })
      )
    )
    expect(result.ok).toBe(true)
    expect(result.units[0].split).toEqual({
      mode: 'custom',
      amounts: [1500, 900],
    })
  })

  it('defaults property type, bedrooms and bathrooms and accepts aliases', () => {
    const result = validate(
      csv(
        line({ unit: '1', property_type: '', bedrooms: '', bathrooms: '' }),
        line({
          unit: '2',
          property_type: 'single room',
          tenant_email: 'b@x.co',
        }),
        line({ unit: '3', property_type: 'CONDO', tenant_email: 'c@x.co' })
      )
    )
    expect(result.errors).toEqual([])
    expect(result.units.map(u => u.propertyType)).toEqual([
      'Apartment',
      'SingleRoom',
      'Condo',
    ])
    expect(result.units[0]).toMatchObject({ bedrooms: 1, bathrooms: 1 })
  })

  it('accepts the location alias header and rent with a dollar sign', () => {
    const text = [
      'address,unit,location,rent',
      '9 Oak St,,"Hillcrest, San Diego, CA 92103","$1,350"',
    ].join('\n')
    const result = validate(text)
    expect(result.ok).toBe(true)
    expect(result.units[0]).toMatchObject({
      unit: null,
      location: 'Hillcrest, San Diego, CA 92103',
      rent: 1350,
      occupied: false,
    })
  })

  it('reports every problem with its row number', () => {
    const result = validate(
      csv(
        line({ address: '', unit: 'x' }),
        line({ unit: 'bad', city_state_zip: '', rent: '-5', bedrooms: 'two' }),
        line({
          unit: 'type',
          property_type: 'Mansion',
          tenant_email: 't@x.co',
        }),
        line({
          unit: 'date',
          lease_start: '08/01/2026',
          tenant_email: 'd@x.co',
        }),
        line({ unit: 'nostart', lease_start: '', tenant_email: 'n@x.co' }),
        line({ unit: 'self', tenant_email: OWNER }),
        line({ unit: 'noname', tenant_first_name: '', tenant_email: 'z@x.co' })
      )
    )
    expect(result.ok).toBe(false)
    expect(result.units).toEqual([])
    const byRow = Object.fromEntries(
      result.errors.map(e => [
        e.row,
        (byRowList(result.errors, e.row) || []).join(' | '),
      ])
    )
    expect(byRow[2]).toMatch(/street address is required/)
    expect(byRow[3]).toMatch(/City, state and ZIP/)
    expect(byRow[3]).toMatch(/Rent must be a positive/)
    expect(byRow[3]).toMatch(/Bedrooms must be/)
    expect(byRow[4]).toMatch(/Property type "Mansion"/)
    expect(byRow[5]).toMatch(/YYYY-MM-DD/)
    expect(byRow[6]).toMatch(/lease_start is required/)
    expect(byRow[7]).toMatch(/cannot invite yourself/)
    expect(byRow[8]).toMatch(/first and last name are required/)
    // Sorted by row.
    expect(result.errors.map(e => e.row)).toEqual(
      [...result.errors.map(e => e.row)].sort((a, b) => a - b)
    )
  })

  it("pins tenant errors to that tenant's row", () => {
    const result = validate(
      csv(
        line(),
        line({
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'not-an-email',
        })
      )
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      { row: 3, message: 'a valid email address is required.' },
    ])
  })

  it('rejects a household whose rows disagree on the lease', () => {
    const result = validate(
      csv(
        line(),
        line({
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'alex@example.com',
          rent: '2500',
          lease_end: '2027-06-30',
        })
      )
    )
    expect(result.ok).toBe(false)
    expect(result.errors.map(e => e.row)).toEqual([3, 3])
    expect(result.errors[0].message).toMatch(/rent differs from row 2/)
    expect(result.errors[1].message).toMatch(/lease_end differs from row 2/)
  })

  it('rejects a duplicate unit row with no tenant, and a tenant listed twice', () => {
    const result = validate(
      csv(
        line({ unit: '1' }),
        line({
          unit: '1',
          tenant_first_name: '',
          tenant_last_name: '',
          tenant_email: '',
        }),
        line({ unit: '2' })
      )
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([
      {
        row: 3,
        message:
          'This unit already appears on row 2; add a tenant to this row or remove it.',
      },
      {
        row: 4,
        message:
          'emma@example.com is also listed on row 2; a tenant belongs to one unit.',
      },
    ])
  })

  it('rejects an already-ended lease', () => {
    const result = validate(
      csv(line({ lease_start: '2024-08-01', lease_end: '2025-07-31' }))
    )
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatchObject({ row: 2 })
    expect(result.errors[0].message).toMatch(/already ended/)
  })

  it('refuses an empty file and one over the row limit', () => {
    expect(validate(HEADER)).toMatchObject({
      ok: false,
      errors: [{ row: 0, message: expect.stringMatching(/no data rows/) }],
    })
    const many = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) =>
      line({ unit: String(i), tenant_email: `t${i}@x.co` })
    )
    const result = validate(csv(...many))
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/limit is 500/)
  })

  it('groups units by address and unit label case-insensitively', () => {
    const result = validate(
      csv(
        line({ unit: '2b' }),
        line({
          unit: '2B',
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'alex@example.com',
        }),
        line({ address: '1245  Grand Ave', unit: '', tenant_email: 'c@x.co' })
      )
    )
    expect(result.ok).toBe(true)
    expect(result.units).toHaveLength(2)
    expect(result.units[0].tenants).toHaveLength(2)
    expect(result.units[1]).toMatchObject({
      address: '1245 Grand Ave',
      unit: null,
    })
  })
})

describe('summarizeUnits / listingTextFor', () => {
  it('counts units, occupancy and tenants', () => {
    const result = validate(
      csv(
        line(),
        line({
          tenant_first_name: 'Alex',
          tenant_last_name: 'Johnson',
          tenant_email: 'alex@example.com',
        }),
        line({
          unit: '3A',
          tenant_first_name: '',
          tenant_last_name: '',
          tenant_email: '',
        })
      )
    )
    expect(summarizeUnits(result.units)).toEqual({
      units: 2,
      occupied: 1,
      vacant: 1,
      tenants: 2,
    })
  })

  it('writes a title and description from the unit facts', () => {
    expect(
      listingTextFor({
        address: '1245 Grand Ave',
        unit: '2B',
        bedrooms: 2,
        propertyType: 'Apartment',
      })
    ).toEqual({
      title: '1245 Grand Ave · Unit 2B',
      description: '2-bedroom apartment at 1245 Grand Ave, Unit 2B.',
    })
    expect(
      listingTextFor({
        address: '9 Oak St',
        unit: null,
        bedrooms: 0,
        propertyType: 'SingleRoom',
      })
    ).toEqual({
      title: '9 Oak St',
      description: 'Studio room at 9 Oak St.',
    })
  })
})

function byRowList(errors, row) {
  return errors.filter(e => e.row === row).map(e => e.message)
}
