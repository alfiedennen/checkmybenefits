import { describe, it, expect } from 'vitest'
import { validateRates } from '../../scripts/validate-rates.ts'

describe('validateRates', () => {
  const baseRates = {
    attendance_allowance: { lower_weekly: 73.9, higher_weekly: 110.4, source: 'gov.uk' },
    state_pension_full_new_weekly: 230.25,
  }

  it('passes when rates are identical', () => {
    const result = validateRates(baseRates, baseRates, '2025-26')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('passes with small rate changes', () => {
    const newRates = {
      ...baseRates,
      attendance_allowance: { lower_weekly: 76.5, higher_weekly: 114.0, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(true)
  })

  it('warns on >10% change', () => {
    const newRates = {
      ...baseRates,
      attendance_allowance: { lower_weekly: 82.0, higher_weekly: 110.4, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('changed by'))).toBe(true)
  })

  it('fails on >50% change', () => {
    const newRates = {
      ...baseRates,
      attendance_allowance: { lower_weekly: 200.0, higher_weekly: 110.4, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('exceeds 50%'))).toBe(true)
  })

  it('fails on zero value', () => {
    const newRates = {
      ...baseRates,
      attendance_allowance: { lower_weekly: 0, higher_weekly: 110.4, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('must be positive'))).toBe(true)
  })

  it('fails on negative value', () => {
    const newRates = {
      ...baseRates,
      attendance_allowance: { lower_weekly: -5, higher_weekly: 110.4, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(false)
  })

  it('fails on missing key', () => {
    const newRates = {
      attendance_allowance: { lower_weekly: 73.9, source: 'gov.uk' },
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Missing key'))).toBe(true)
  })

  it('warns on new key', () => {
    const newRates = {
      ...baseRates,
      new_benefit_weekly: 50.0,
    }
    const result = validateRates(newRates, baseRates, '2025-26')
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('New key'))).toBe(true)
  })

  it('fails on invalid tax year format', () => {
    const result = validateRates(baseRates, baseRates, '2025')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('tax_year format'))).toBe(true)
  })

  it('fails on mismatched tax year', () => {
    const result = validateRates(baseRates, baseRates, '2025-27')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes("don't match"))).toBe(true)
  })

  it('accepts valid tax years', () => {
    expect(validateRates(baseRates, baseRates, '2025-26').valid).toBe(true)
    expect(validateRates(baseRates, baseRates, '2099-00').valid).toBe(true)
  })
})
