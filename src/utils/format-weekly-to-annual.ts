/**
 * Convert a weekly amount to annual.
 */
export function weeklyToAnnual(weekly: number): number {
  return Math.round(weekly * 52)
}

/**
 * Convert a monthly amount to annual.
 */
export function monthlyToAnnual(monthly: number): number {
  return Math.round(monthly * 12)
}
