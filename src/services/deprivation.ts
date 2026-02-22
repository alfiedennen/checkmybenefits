/**
 * IMD (Index of Multiple Deprivation) lookup service
 *
 * Maps LSOA codes to deprivation deciles (1 = most deprived, 10 = least deprived).
 * Data source: English Indices of Deprivation 2019, MHCLG.
 */

import imdLookup from '../data/imd-lookup.json'

const lookup = imdLookup as Record<string, number>

/** Get the IMD deprivation decile for an LSOA code. Returns null if not found. */
export function getDeprivationDecile(lsoa: string): number | null {
  return lookup[lsoa] ?? null
}

/** Returns true if the area is in the bottom 30% most deprived (deciles 1-3). */
export function isDeprivedArea(decile: number | null): boolean {
  return decile !== null && decile <= 3
}
