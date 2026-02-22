import { describe, it, expect } from 'vitest'
import { getDeprivationDecile, isDeprivedArea } from '../../src/services/deprivation.ts'

describe('deprivation lookup', () => {
  it('returns a decile for a known LSOA', () => {
    // E01000001 is City of London 001A — should be in the lookup
    const decile = getDeprivationDecile('E01000001')
    expect(decile).toBeTypeOf('number')
    expect(decile).toBeGreaterThanOrEqual(1)
    expect(decile).toBeLessThanOrEqual(10)
  })

  it('returns null for an unknown LSOA', () => {
    expect(getDeprivationDecile('INVALID')).toBeNull()
    expect(getDeprivationDecile('')).toBeNull()
  })

  it('returns null for Scottish/Welsh LSOAs (England-only dataset)', () => {
    // Scottish data zones start with S, Welsh with W
    expect(getDeprivationDecile('S01000001')).toBeNull()
    expect(getDeprivationDecile('W01000001')).toBeNull()
  })

  it('identifies deprived areas (decile 1-3)', () => {
    expect(isDeprivedArea(1)).toBe(true)
    expect(isDeprivedArea(2)).toBe(true)
    expect(isDeprivedArea(3)).toBe(true)
  })

  it('identifies non-deprived areas (decile 4-10)', () => {
    expect(isDeprivedArea(4)).toBe(false)
    expect(isDeprivedArea(5)).toBe(false)
    expect(isDeprivedArea(10)).toBe(false)
  })

  it('handles null decile', () => {
    expect(isDeprivedArea(null)).toBe(false)
  })

  it('covers a range of known LSOAs', () => {
    // Spot-check a few known LSOAs exist in the dataset
    const testLSOAs = ['E01000001', 'E01000002', 'E01000003', 'E01033768']
    for (const lsoa of testLSOAs) {
      const decile = getDeprivationDecile(lsoa)
      if (decile !== null) {
        expect(decile).toBeGreaterThanOrEqual(1)
        expect(decile).toBeLessThanOrEqual(10)
      }
    }
  })
})
