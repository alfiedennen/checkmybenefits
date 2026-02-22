/**
 * Benefit rate validation
 *
 * Sanity checks to catch parsing errors before committing changes.
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Validate a single rate value */
function validateRate(key: string, newVal: number, oldVal: number | undefined): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (newVal <= 0) {
    errors.push(`${key}: value is ${newVal} (must be positive)`)
  }

  if (oldVal !== undefined && oldVal > 0) {
    const changePct = Math.abs((newVal - oldVal) / oldVal) * 100
    if (changePct > 50) {
      errors.push(`${key}: changed by ${changePct.toFixed(1)}% (${oldVal} → ${newVal}) — exceeds 50% threshold`)
    } else if (changePct > 10) {
      warnings.push(`${key}: changed by ${changePct.toFixed(1)}% (${oldVal} → ${newVal})`)
    }
  }

  return { errors, warnings }
}

/** Validate that tax_year format is correct */
function validateTaxYear(taxYear: string): string[] {
  const errors: string[] = []
  const match = taxYear.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    errors.push(`tax_year format invalid: "${taxYear}" (expected YYYY-YY)`)
  } else {
    const startYear = parseInt(match[1])
    const endYearShort = parseInt(match[2])
    if (endYearShort !== (startYear + 1) % 100) {
      errors.push(`tax_year years don't match: ${taxYear}`)
    }
  }
  return errors
}

/** Deep-compare rates objects and validate all values */
export function validateRates(
  newRates: Record<string, unknown>,
  oldRates: Record<string, unknown>,
  taxYear: string,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate tax year
  errors.push(...validateTaxYear(taxYear))

  // Check all expected keys still exist
  const oldKeys = collectNumericKeys(oldRates)
  const newKeys = collectNumericKeys(newRates)

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      errors.push(`Missing key: ${key} (was in old rates but not in new)`)
    }
  }

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      warnings.push(`New key: ${key} (not in old rates)`)
    }
  }

  // Validate each numeric value
  const oldFlat = flattenRates(oldRates)
  const newFlat = flattenRates(newRates)

  for (const [key, newVal] of Object.entries(newFlat)) {
    const result = validateRate(key, newVal, oldFlat[key])
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/** Collect all paths to numeric values in a nested object */
function collectNumericKeys(obj: Record<string, unknown>, prefix = ''): Set<string> {
  const keys = new Set<string>()
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'number') {
      keys.add(fullKey)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const k of collectNumericKeys(value as Record<string, unknown>, fullKey)) {
        keys.add(k)
      }
    }
  }
  return keys
}

/** Flatten nested rates to dot-separated keys with numeric values */
function flattenRates(obj: Record<string, unknown>, prefix = ''): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'number') {
      result[fullKey] = value
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenRates(value as Record<string, unknown>, fullKey))
    }
  }
  return result
}
