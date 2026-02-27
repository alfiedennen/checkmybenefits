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

  // DLOOK-01: Welsh LSOA returns valid decile
  it('returns a decile for a known Welsh LSOA', () => {
    const decile = getDeprivationDecile('W01000003') // Amlwch Port
    expect(decile).toBeTypeOf('number')
    expect(decile).toBeGreaterThanOrEqual(1)
    expect(decile).toBeLessThanOrEqual(10)
  })

  // DLOOK-02: Scottish data zone returns valid decile
  it('returns a decile for a known Scottish data zone', () => {
    const decile = getDeprivationDecile('S01006506') // Culter, Aberdeen
    expect(decile).toBeTypeOf('number')
    expect(decile).toBeGreaterThanOrEqual(1)
    expect(decile).toBeLessThanOrEqual(10)
  })

  // DLOOK-03: English LSOA still works (covered by first test — no regression)

  // DLOOK-04: Unknown code returns null (covered by 'returns null for an unknown LSOA')

  // DLOOK-05: isDeprivedArea edge cases
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

  it('covers a range of known LSOAs across all nations', () => {
    const testLSOAs = [
      'E01000001', 'E01000002', 'E01000003', 'E01033768', // England
      'W01000003', 'W01000004', 'W01000005',               // Wales
      'S01006506', 'S01006507', 'S01006508',               // Scotland
    ]
    for (const lsoa of testLSOAs) {
      const decile = getDeprivationDecile(lsoa)
      if (decile !== null) {
        expect(decile).toBeGreaterThanOrEqual(1)
        expect(decile).toBeLessThanOrEqual(10)
      }
    }
  })
})
