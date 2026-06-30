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
 * @returns {{
 *   monthlyIncome: number, monthlyRent: number, multiplier: number,
 *   requiredIncome: number, ratio: number|null, meetsRequirement: boolean,
 *   hasIncomeData: boolean
 * }}
 */
export function assessIncome(
  monthlyIncome,
  monthlyRent,
  multiplier = DEFAULT_INCOME_MULTIPLIER
) {
  const income = Number(monthlyIncome) || 0
  const rent = Number(monthlyRent) || 0
  const requiredIncome = Math.round(rent * multiplier)
  const hasIncomeData = income > 0

  return {
    monthlyIncome: income,
    monthlyRent: rent,
    multiplier,
    requiredIncome,
    ratio: rent > 0 ? Number((income / rent).toFixed(2)) : null,
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
 */
export function assessCombinedIncome(
  incomes,
  monthlyRent,
  multiplier = DEFAULT_INCOME_MULTIPLIER
) {
  const combined = (incomes || []).reduce((sum, n) => sum + (Number(n) || 0), 0)
  return assessIncome(combined, monthlyRent, multiplier)
}
