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
