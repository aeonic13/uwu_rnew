/**
 * Tenant/cosigner income screening.
 *
 * The customer-discovery research was explicit: landlords don't trust a
 * black-box "approved" — they want to see the math. These helpers compute a
 * transparent pass/fail against a configurable income-to-rent multiple.
 */

// Default income multiple (monthly income must be >= rent * multiplier).
// Configurable per deployment; landlords will be able to override per listing.
export const DEFAULT_INCOME_MULTIPLIER = Number(
  process.env.SCREENING_INCOME_MULTIPLIER || 3
)

/**
 * Assess a single income against a monthly rent requirement.
 * @param {number} monthlyIncome - Verified monthly income (e.g. from Plaid).
 * @param {number} monthlyRent - The monthly rent to qualify against.
 * @param {number} [multiplier] - Required income-to-rent multiple.
 * @param {number} [voucherAmount] - Monthly housing subsidy (e.g. Section 8).
 * @returns {{
 *   monthlyIncome: number, monthlyRent: number, voucherAmount: number,
 *   tenantRent: number, multiplier: number, requiredIncome: number,
 *   ratio: number|null, meetsRequirement: boolean, hasIncomeData: boolean
 * }}
 */
export function assessIncome(
  monthlyIncome,
  monthlyRent,
  multiplier = DEFAULT_INCOME_MULTIPLIER,
  voucherAmount = 0
) {
  const income = Number(monthlyIncome) || 0
  const rent = Number(monthlyRent) || 0
  const voucher = Number(voucherAmount) || 0
  // CA source-of-income law: when a housing subsidy covers part of the rent,
  // the income multiple applies only to the tenant's share (rent - voucher),
  // never the full rent — and a voucher must never itself be grounds to reject.
  const tenantRent = Math.max(0, rent - voucher)
  const requiredIncome = Math.round(tenantRent * multiplier)
  const hasIncomeData = income > 0

  return {
    monthlyIncome: income,
    monthlyRent: rent,
    voucherAmount: voucher,
    tenantRent,
    multiplier,
    requiredIncome,
    ratio: tenantRent > 0 ? Number((income / tenantRent).toFixed(2)) : null,
    // Unknown income is not a pass.
    meetsRequirement: hasIncomeData && income >= requiredIncome,
    hasIncomeData,
  }
}

/**
 * Assess a group's combined income (e.g. all roommates on one listing, or a
 * tenant + cosigner) against the rent.
 * @param {number[]} incomes - Monthly incomes to sum.
 * @param {number} monthlyRent
 * @param {number} [multiplier]
 * @param {number} [voucherAmount] - Monthly housing subsidy (e.g. Section 8).
 */
export function assessCombinedIncome(
  incomes,
  monthlyRent,
  multiplier = DEFAULT_INCOME_MULTIPLIER,
  voucherAmount = 0
) {
  const combined = (incomes || []).reduce((sum, n) => sum + (Number(n) || 0), 0)
  return assessIncome(combined, monthlyRent, multiplier, voucherAmount)
}

// Guarantor policies a landlord can state on a listing.
export const GUARANTOR_POLICIES = ['always', 'students-only', 'never']

/**
 * Normalize the screening criteria a landlord enters on a listing into the
 * JSON stored on `Listing.screeningCriteria`. Unknown keys are dropped and
 * every value is coerced, so the column never holds free-form client input.
 * Returns null when nothing usable was supplied.
 *
 * Deliberately has no "accepts vouchers" switch: in California a housing
 * subsidy is a protected source of income, so the income test applies to
 * the tenant's share instead (see assessIncome).
 */
export function sanitizeScreeningCriteria(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const out = {}

  if (GUARANTOR_POLICIES.includes(input.guarantorPolicy)) {
    out.guarantorPolicy = input.guarantorPolicy
  }
  if (typeof input.backgroundCheck === 'boolean') {
    out.backgroundCheck = input.backgroundCheck
  }
  if (typeof input.idVerification === 'boolean') {
    out.idVerification = input.idVerification
  }
  const credit = Number(input.minCreditScore)
  if (
    input.minCreditScore !== null &&
    input.minCreditScore !== undefined &&
    input.minCreditScore !== '' &&
    Number.isFinite(credit) &&
    credit >= 300 &&
    credit <= 850
  ) {
    out.minCreditScore = Math.round(credit)
  }
  const multiple = Number(input.minIncomeMultiple)
  if (Number.isFinite(multiple) && multiple >= 1 && multiple <= 10) {
    out.minIncomeMultiple = multiple
  }

  return Object.keys(out).length ? out : null
}

/**
 * Should approving this household need an explicit landlord override?
 *
 * Each member's effective income is their verified monthly income plus an
 * accepted cosigner's verified income (the same math the Inbox shows);
 * vouchers reduce the rent the household must qualify for. "Short" means
 * there is a requirement (rent > 0) and the household is below it —
 * unverified income counts as $0, so it is short too.
 *
 * @param {Array<{ monthlyIncome?: number, cosignerIncome?: number, voucherAmount?: number }>} members
 * @param {number} monthlyRent
 * @param {number} [multiplier]
 * @returns {{ short: boolean, required: number, effective: number, assessment: object }}
 */
export function householdIncomeDecision(
  members,
  monthlyRent,
  multiplier = DEFAULT_INCOME_MULTIPLIER
) {
  const list = Array.isArray(members) ? members : []
  const incomes = list.map(
    m => (Number(m?.monthlyIncome) || 0) + (Number(m?.cosignerIncome) || 0)
  )
  const voucher = list.reduce(
    (sum, m) => sum + (Number(m?.voucherAmount) || 0),
    0
  )
  const assessment = assessCombinedIncome(
    incomes,
    monthlyRent,
    multiplier,
    voucher
  )
  return {
    short: assessment.requiredIncome > 0 && !assessment.meetsRequirement,
    required: assessment.requiredIncome,
    effective: assessment.monthlyIncome,
    assessment,
  }
}
