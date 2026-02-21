/**
 * Format a number as GBP currency.
 * Examples: 5600 → "£5,600", 252 → "£252"
 */
export function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
}

/**
 * Format a value range as "£X – £Y" or "£X" if low equals high.
 */
export function formatValueRange(low: number, high: number): string {
  if (low === high) return formatCurrency(low)
  return `${formatCurrency(low)} – ${formatCurrency(high)}`
}

/**
 * Format as "up to £X/year"
 */
export function formatUpTo(high: number): string {
  return `up to ${formatCurrency(high)}/year`
}
