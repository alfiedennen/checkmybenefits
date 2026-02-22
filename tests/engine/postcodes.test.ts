import { describe, it, expect, vi } from 'vitest'
import { lookupPostcode, countryToNation } from '../../src/services/postcodes.ts'

describe('postcodes service', () => {
  describe('countryToNation', () => {
    it('maps England', () => {
      expect(countryToNation('England')).toBe('england')
    })

    it('maps Scotland', () => {
      expect(countryToNation('Scotland')).toBe('scotland')
    })

    it('maps Wales', () => {
      expect(countryToNation('Wales')).toBe('wales')
    })

    it('maps Northern Ireland', () => {
      expect(countryToNation('Northern Ireland')).toBe('northern_ireland')
    })

    it('defaults to england for unknown', () => {
      expect(countryToNation('Unknown')).toBe('england')
      expect(countryToNation('')).toBe('england')
    })
  })

  describe('lookupPostcode', () => {
    it('returns null for too-short postcodes', async () => {
      expect(await lookupPostcode('SW1')).toBeNull()
      expect(await lookupPostcode('A1')).toBeNull()
    })

    it('returns null for too-long postcodes', async () => {
      expect(await lookupPostcode('SW1A 1AAXX')).toBeNull()
    })

    it('returns result with lsoa field for valid postcode', async () => {
      // Mock fetch to return a realistic postcodes.io response
      const mockResponse = {
        status: 200,
        result: {
          postcode: 'SW1A 1AA',
          admin_district: 'Westminster',
          region: 'London',
          country: 'England',
          codes: { lsoa: 'E01004736' },
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupPostcode('SW1A1AA')
      expect(result).not.toBeNull()
      expect(result!.postcode).toBe('SW1A 1AA')
      expect(result!.admin_district).toBe('Westminster')
      expect(result!.region).toBe('London')
      expect(result!.country).toBe('England')
      expect(result!.lsoa).toBe('E01004736')

      vi.unstubAllGlobals()
    })

    it('returns empty lsoa when codes not in response', async () => {
      const mockResponse = {
        status: 200,
        result: {
          postcode: 'BT1 1AA',
          admin_district: 'Belfast',
          region: null,
          country: 'Northern Ireland',
          // No codes object
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupPostcode('BT11AA')
      expect(result).not.toBeNull()
      expect(result!.lsoa).toBe('')

      vi.unstubAllGlobals()
    })

    it('returns null on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await lookupPostcode('SW1A1AA')
      expect(result).toBeNull()

      vi.unstubAllGlobals()
    })
  })
})
