import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PersonData } from '../../src/types/person.ts'
import type { MBCalculateResponse } from '../../src/types/missing-benefit.ts'

// Mock the missing-benefit service so we control API responses
vi.mock('../../src/services/missing-benefit.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/missing-benefit.ts')>()
  return {
    ...actual,
    calculateBenefits: vi.fn(),
  }
})

// Import after mock setup
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import { calculateBenefits } from '../../src/services/missing-benefit.ts'

const mockedCalculateBenefits = vi.mocked(calculateBenefits)

// Standard CTR-eligible persona: single, unemployed, renting, low income, England
const CTR_PERSONA: PersonData = {
  age: 35,
  nation: 'england',
  postcode: 'E17 4SA',
  relationship_status: 'single',
  employment_status: 'unemployed',
  gross_annual_income: 0,
  income_band: 'under_7400',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 800,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
}

// Realistic MB API response for Waltham Forest
const MB_SUCCESS_RESPONSE: MBCalculateResponse = {
  totalMonthly: 528.73,
  totalAnnual: 6344.83,
  benefits: [
    {
      id: 'council-tax-reduction',
      name: 'Council Tax Reduction',
      eligible: true,
      monthlyAmount: 128.59,
      annualAmount: 1543.11,
      description: 'Council tax saving from single person discount and means-tested reduction.',
      breakdown: [
        { label: 'Annual council tax Band D — Waltham Forest (2025/26)', amount: 2277.65 },
        { label: 'Single person discount (25%)', amount: -569.41 },
        { label: 'Council Tax Reduction', amount: 973.7 },
        { label: 'Combined annual saving', amount: 1543.11 },
      ],
      applyUrl: 'https://www.walthamforest.gov.uk/council-tax/discounts-exemptions-and-reductions/council-tax-support',
      councilName: 'Waltham Forest',
      confidenceScore: 95,
      confidenceLabel: 'High',
    },
  ],
  calculatedAt: '2026-02-28T00:00:00Z',
  disclaimer: 'Estimates only.',
}

// MB response where CTR is not eligible
const MB_NOT_ELIGIBLE_RESPONSE: MBCalculateResponse = {
  totalMonthly: 0,
  totalAnnual: 0,
  benefits: [
    {
      id: 'council-tax-reduction',
      name: 'Council Tax Reduction',
      eligible: false,
      monthlyAmount: 0,
      annualAmount: 0,
      description: 'Not eligible.',
    },
  ],
  calculatedAt: '2026-02-28T00:00:00Z',
  disclaimer: 'Estimates only.',
}

function getAllEntitlements(bundle: Awaited<ReturnType<typeof buildBundle>>) {
  return [
    ...bundle.gateway_entitlements,
    ...bundle.independent_entitlements,
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
  ]
}

function findCTR(bundle: Awaited<ReturnType<typeof buildBundle>>) {
  return getAllEntitlements(bundle).find((e) =>
    e.id === 'council_tax_support_working_age' || e.id === 'council_tax_reduction_full',
  )
}

describe('CTR enrichment via MissingBenefit API', () => {
  beforeEach(() => {
    mockedCalculateBenefits.mockReset()
  })

  describe('successful enrichment', () => {
    it('replaces heuristic range with precise annual value', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr).toBeDefined()
      expect(ctr!.estimated_annual_value.low).toBe(1543.11)
      expect(ctr!.estimated_annual_value.high).toBe(1543.11)
    })

    it('attaches ctrDetail with council name', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr!.ctrDetail).toBeDefined()
      expect(ctr!.ctrDetail!.councilName).toBe('Waltham Forest')
    })

    it('attaches breakdown lines from MB', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr!.ctrDetail!.breakdown.length).toBeGreaterThan(0)
      expect(ctr!.ctrDetail!.breakdown[0].label).toContain('Waltham Forest')
    })

    it('attaches confidence score from MB', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr!.ctrDetail!.confidenceScore).toBe(95)
    })

    it('upgrades confidence to likely when enriched', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr!.confidence).toBe('likely')
    })

    it('uses MB apply URL when available', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr!.application_url).toContain('walthamforest.gov.uk')
    })

    it('includes precise CTR value in bundle total', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])

      // The total should include the precise CTR value (1543.11)
      // rather than a heuristic range
      const allResults = getAllEntitlements(bundle)
      const ctrValue = allResults
        .filter((e) => e.id === 'council_tax_support_working_age')
        .reduce((sum, e) => sum + e.estimated_annual_value.low, 0)

      expect(ctrValue).toBe(1543.11)
    })
  })

  describe('graceful fallback', () => {
    it('uses heuristic values when MB API returns null', async () => {
      mockedCalculateBenefits.mockResolvedValue(null)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr).toBeDefined()
      // Heuristic range — low and high should differ
      expect(ctr!.estimated_annual_value.low).not.toBe(ctr!.estimated_annual_value.high)
      expect(ctr!.ctrDetail).toBeUndefined()
    })

    it('uses heuristic values when MB API throws', async () => {
      mockedCalculateBenefits.mockRejectedValue(new Error('Network timeout'))

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr).toBeDefined()
      expect(ctr!.ctrDetail).toBeUndefined()
      // Should NOT crash — bundle still builds
      expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
    })

    it('uses heuristic values when CTR not eligible in MB response', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_NOT_ELIGIBLE_RESPONSE)

      const bundle = await buildBundle(CTR_PERSONA, ['lost_job'])
      const ctr = findCTR(bundle)

      expect(ctr).toBeDefined()
      expect(ctr!.ctrDetail).toBeUndefined()
    })

    it('skips MB API call when no postcode', async () => {
      const noPostcode = { ...CTR_PERSONA, postcode: undefined }
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(noPostcode, ['lost_job'])

      // Should NOT have called the API
      expect(mockedCalculateBenefits).not.toHaveBeenCalled()
    })
  })

  describe('pension-age CTR', () => {
    it('enriches pension-age CTR with precise values', async () => {
      const pensioner: PersonData = {
        ...CTR_PERSONA,
        age: 70,
        employment_status: 'retired',
        income_band: 'under_12570',
      }
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(pensioner, [])
      const allResults = getAllEntitlements(bundle)
      const ctrFull = allResults.find((e) => e.id === 'council_tax_reduction_full')

      // Pension-age CTR should also be enriched
      if (ctrFull) {
        expect(ctrFull.ctrDetail).toBeDefined()
        expect(ctrFull.estimated_annual_value.low).toBe(1543.11)
      }
    })
  })

  describe('nation variants', () => {
    it('enriches Welsh CTR when nation is wales', async () => {
      const welsh: PersonData = {
        ...CTR_PERSONA,
        nation: 'wales',
        postcode: 'CF10 1AA',
      }
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(welsh, ['lost_job'])
      const allResults = getAllEntitlements(bundle)
      const welshCTR = allResults.find((e) => e.id === 'council_tax_reduction_wales')

      if (welshCTR) {
        expect(welshCTR.ctrDetail).toBeDefined()
        expect(welshCTR.estimated_annual_value.low).toBe(1543.11)
      }
    })

    it('enriches Scottish CTR when nation is scotland', async () => {
      const scottish: PersonData = {
        ...CTR_PERSONA,
        nation: 'scotland',
        postcode: 'EH1 1YZ',
      }
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      const bundle = await buildBundle(scottish, ['lost_job'])
      const allResults = getAllEntitlements(bundle)
      const scotCTR = allResults.find((e) => e.id === 'council_tax_reduction_scotland')

      if (scotCTR) {
        expect(scotCTR.ctrDetail).toBeDefined()
        expect(scotCTR.estimated_annual_value.low).toBe(1543.11)
      }
    })
  })

  describe('API call correctness', () => {
    it('calls calculateBenefits with /api/ctr endpoint', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      await buildBundle(CTR_PERSONA, ['lost_job'])

      expect(mockedCalculateBenefits).toHaveBeenCalledWith(
        '/api/ctr',
        expect.objectContaining({ postcode: 'E17 4SA' }),
      )
    })

    it('maps PersonData to MB answers correctly', async () => {
      mockedCalculateBenefits.mockResolvedValue(MB_SUCCESS_RESPONSE)

      await buildBundle(CTR_PERSONA, ['lost_job'])

      const callArgs = mockedCalculateBenefits.mock.calls[0]
      const answers = callArgs[1]
      expect(answers.postcode).toBe('E17 4SA')
      expect(answers.employmentStatus).toBe('unemployed')
      expect(answers.housingStatus).toBe('renting-private')
      expect(answers.relationshipStatus).toBe('single')
    })
  })
})
