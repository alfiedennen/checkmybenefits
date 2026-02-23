import { describe, it, expect, vi } from 'vitest'
import { lookupPostcode, lookupOutcode, countryToNation } from '../../src/services/postcodes.ts'

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

  describe('lookupPostcode — full postcodes', () => {
    it('returns null for single character input', async () => {
      expect(await lookupPostcode('A')).toBeNull()
    })

    it('returns null for too-long postcodes', async () => {
      expect(await lookupPostcode('SW1A 1AAXX')).toBeNull()
    })

    it('returns result with partial: false for valid full postcode', async () => {
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
      expect(result!.partial).toBe(false)

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
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupPostcode('BT11AA')
      expect(result).not.toBeNull()
      expect(result!.lsoa).toBe('')
      expect(result!.partial).toBe(false)

      vi.unstubAllGlobals()
    })

    it('returns null on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await lookupPostcode('SW1A1AA')
      expect(result).toBeNull()

      vi.unstubAllGlobals()
    })
  })

  describe('lookupPostcode — outcodes (partial postcodes)', () => {
    it('routes 2-4 char outcode to outcode lookup', async () => {
      const mockResponse = {
        status: 200,
        result: {
          outcode: 'E1',
          admin_district: ['Tower Hamlets', 'City of London'],
          country: ['England'],
          latitude: 51.52,
          longitude: -0.06,
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupPostcode('E1')
      expect(result).not.toBeNull()
      expect(result!.postcode).toBe('E1')
      expect(result!.admin_district).toBe('Tower Hamlets')
      expect(result!.country).toBe('England')
      expect(result!.lsoa).toBe('')
      expect(result!.region).toBe('')
      expect(result!.partial).toBe(true)

      vi.unstubAllGlobals()
    })

    it('handles 4-char outcodes like SW1A', async () => {
      const mockResponse = {
        status: 200,
        result: {
          outcode: 'SW1A',
          admin_district: ['Westminster'],
          country: ['England'],
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupPostcode('SW1A')
      expect(result).not.toBeNull()
      expect(result!.postcode).toBe('SW1A')
      expect(result!.partial).toBe(true)

      vi.unstubAllGlobals()
    })

    it('returns null for non-outcode short strings', async () => {
      // "AB" doesn't match outcode pattern (needs a digit)
      expect(await lookupPostcode('AB')).toBeNull()
      // Pure digits
      expect(await lookupPostcode('123')).toBeNull()
    })

    it('returns null when outcode API fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
      }))

      const result = await lookupPostcode('E1')
      expect(result).toBeNull()

      vi.unstubAllGlobals()
    })
  })

  describe('lookupOutcode', () => {
    it('returns partial result for valid outcode', async () => {
      const mockResponse = {
        status: 200,
        result: {
          outcode: 'M1',
          admin_district: ['Manchester'],
          country: ['England'],
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupOutcode('M1')
      expect(result).not.toBeNull()
      expect(result!.postcode).toBe('M1')
      expect(result!.admin_district).toBe('Manchester')
      expect(result!.country).toBe('England')
      expect(result!.partial).toBe(true)
      expect(result!.lsoa).toBe('')

      vi.unstubAllGlobals()
    })

    it('handles Scottish outcodes', async () => {
      const mockResponse = {
        status: 200,
        result: {
          outcode: 'EH1',
          admin_district: ['City of Edinburgh'],
          country: ['Scotland'],
        },
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const result = await lookupOutcode('EH1')
      expect(result).not.toBeNull()
      expect(result!.country).toBe('Scotland')

      vi.unstubAllGlobals()
    })

    it('returns null for invalid outcode pattern', async () => {
      expect(await lookupOutcode('INVALID')).toBeNull()
      expect(await lookupOutcode('123')).toBeNull()
      expect(await lookupOutcode('')).toBeNull()
    })

    it('returns null on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await lookupOutcode('E1')
      expect(result).toBeNull()

      vi.unstubAllGlobals()
    })
  })
})
