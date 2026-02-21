import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mapPersonToHousehold, calculateBenefits } from '../../src/services/policyengine.ts'
import { estimateValue } from '../../src/engine/value-estimator.ts'
import { resolveConflicts } from '../../src/engine/conflict-resolver.ts'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { PolicyEngineCalculatedBenefits } from '../../src/types/policyengine.ts'
import type { EntitlementDefinition, ConflictEdge } from '../../src/types/entitlements.ts'
import { createEmptyPerson } from '../../src/types/person.ts'

// ─── Test Personas ───────────────────────────────────────────────────────────

const unemployedSingleRenter: PersonData = {
  age: 30,
  nation: 'england',
  relationship_status: 'single',
  employment_status: 'unemployed',
  gross_annual_income: 0,
  income_band: 'under_7400',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 800,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
  recently_redundant: true,
}

const retiredWidow: PersonData = {
  age: 68,
  nation: 'england',
  relationship_status: 'widowed',
  employment_status: 'retired',
  gross_annual_income: 10000,
  income_band: 'under_12570',
  housing_tenure: 'own_outright',
  monthly_housing_cost: 0,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
}

const marriedCoupleWithKids: PersonData = {
  age: 35,
  nation: 'england',
  relationship_status: 'couple_married',
  employment_status: 'employed',
  gross_annual_income: 35000,
  income_band: 'under_50270',
  partner_gross_annual_income: 0,
  partner_age: 33,
  housing_tenure: 'rent_social',
  monthly_housing_cost: 600,
  children: [
    { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
    { age: 7, has_additional_needs: false, disability_benefit: 'none', in_education: true },
  ],
  has_disability_or_health_condition: false,
  is_carer: false,
  weekly_childcare_costs: 150,
}

const selfEmployedCarer: PersonData = {
  age: 42,
  nation: 'england',
  relationship_status: 'single',
  employment_status: 'self_employed',
  gross_annual_income: 12000,
  income_band: 'under_12570',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 700,
  children: [],
  has_disability_or_health_condition: true,
  is_carer: true,
  carer_hours_per_week: 40,
  cared_for_person: {
    relationship: 'mother',
    age: 75,
    disability_benefit: 'attendance_allowance_higher',
    needs_help_daily_living: true,
  },
}

const disabledChildFamily: PersonData = {
  age: 38,
  nation: 'england',
  relationship_status: 'couple_cohabiting',
  employment_status: 'employed',
  gross_annual_income: 22000,
  income_band: 'under_25000',
  partner_gross_annual_income: 15000,
  partner_age: 36,
  housing_tenure: 'mortgage',
  monthly_housing_cost: 900,
  children: [
    { age: 5, has_additional_needs: true, disability_benefit: 'dla_middle_care', in_education: true },
    { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
  ],
  has_disability_or_health_condition: false,
  is_carer: true,
  carer_hours_per_week: 30,
  household_capital: 5000,
}

// ─── Mock PE Response Helper ─────────────────────────────────────────────────

function mockPeResponse(benefits: Record<string, number>, ucComponents?: Record<string, number>) {
  const benunitVars: Record<string, { '2025': number }> = {}
  const householdVars: Record<string, { '2025': number }> = {}

  for (const [key, value] of Object.entries(benefits)) {
    if (key === 'council_tax_benefit') {
      householdVars[key] = { '2025': value }
    } else {
      benunitVars[key] = { '2025': value }
    }
  }

  if (ucComponents) {
    for (const [key, value] of Object.entries(ucComponents)) {
      benunitVars[key] = { '2025': value }
    }
  }

  return {
    result: {
      benunits: { benunit: benunitVars },
      households: { household: householdVars },
      people: {},
      families: {},
    },
  }
}

function installFetchMock(responseData: unknown) {
  const original = globalThis.fetch
  globalThis.fetch = () =>
    Promise.resolve(new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
  return () => { globalThis.fetch = original }
}

// ─── Mapper Tests ────────────────────────────────────────────────────────────

describe('mapPersonToHousehold', () => {
  it('maps unemployed single renter correctly', () => {
    const h = mapPersonToHousehold(unemployedSingleRenter)

    expect(h.people.you.age).toEqual({ '2025': 30 })
    expect(h.people.you.employment_income).toEqual({ '2025': 0 })
    expect(h.people.you.hours_worked).toEqual({ '2025': 0 })
    expect(h.people.you.self_employment_income).toBeUndefined()
    expect(h.households.household.rent).toEqual({ '2025': 9600 })
    expect(h.households.household.mortgage).toBeUndefined()
    expect(Object.keys(h.people)).toEqual(['you'])
  })

  it('maps self-employed income to self_employment_income', () => {
    const h = mapPersonToHousehold(selfEmployedCarer)

    expect(h.people.you.self_employment_income).toEqual({ '2025': 12000 })
    expect(h.people.you.employment_income).toBeUndefined()
    expect(h.people.you.hours_worked).toEqual({ '2025': 35 })
  })

  it('sets disability and carer flags', () => {
    const h = mapPersonToHousehold(selfEmployedCarer)

    expect(h.people.you.is_disabled).toEqual({ '2025': true })
    expect(h.people.you.is_carer_for_benefits).toEqual({ '2025': true })
  })

  it('uses partner_age instead of copying main person age', () => {
    const h = mapPersonToHousehold(marriedCoupleWithKids)

    expect(h.people.you.age).toEqual({ '2025': 35 })
    expect(h.people.partner.age).toEqual({ '2025': 33 })
  })

  it('defaults partner age to main person age when not set', () => {
    const person: PersonData = {
      ...marriedCoupleWithKids,
      partner_age: undefined,
    }
    const h = mapPersonToHousehold(person)

    expect(h.people.partner.age).toEqual({ '2025': 35 })
  })

  it('maps children with correct ages and disability flags', () => {
    const h = mapPersonToHousehold(disabledChildFamily)

    expect(h.people.child_0.age).toEqual({ '2025': 5 })
    expect(h.people.child_0.is_disabled).toEqual({ '2025': true })
    expect(h.people.child_1.age).toEqual({ '2025': 2 })
    expect(h.people.child_1.is_disabled).toBeUndefined()
  })

  it('maps mortgage housing correctly', () => {
    const h = mapPersonToHousehold(disabledChildFamily)

    expect(h.households.household.mortgage).toEqual({ '2025': 10800 })
    expect(h.households.household.rent).toBeUndefined()
  })

  it('includes household_savings from capital', () => {
    const h = mapPersonToHousehold(disabledChildFamily)

    expect(h.benunits.benunit.household_savings).toEqual({ '2025': 5000 })
  })

  it('includes childcare expenses', () => {
    const h = mapPersonToHousehold(marriedCoupleWithKids)

    expect(h.benunits.benunit.childcare_expenses).toEqual({ '2025': 7800 })
  })

  it('sets would_claim_UC and would_claim_PC', () => {
    const h = mapPersonToHousehold(unemployedSingleRenter)

    expect(h.benunits.benunit.would_claim_UC).toEqual({ '2025': true })
    expect(h.benunits.benunit.would_claim_PC).toEqual({ '2025': true })
  })

  it('sets is_pregnant flag', () => {
    const person: PersonData = {
      ...createEmptyPerson(),
      age: 28,
      is_pregnant: true,
    }
    const h = mapPersonToHousehold(person)

    expect(h.people.you.is_pregnant).toEqual({ '2025': true })
  })

  it('includes council_tax_band when set', () => {
    const person: PersonData = {
      ...createEmptyPerson(),
      council_tax_band: 'C',
    }
    const h = mapPersonToHousehold(person)

    expect(h.households.household.council_tax_band).toEqual({ '2025': 'C' })
  })

  it('sets couple members correctly', () => {
    const h = mapPersonToHousehold(marriedCoupleWithKids)

    expect(h.benunits.benunit.members).toContain('you')
    expect(h.benunits.benunit.members).toContain('partner')
    expect(h.benunits.benunit.members).toContain('child_0')
    expect(h.benunits.benunit.members).toContain('child_1')
    expect(h.benunits.benunit.adults).toEqual(['you', 'partner'])
    expect(h.benunits.benunit.children).toEqual(['child_0', 'child_1'])
  })

  it('does not set carer flag when under 35 hours', () => {
    const person: PersonData = {
      ...createEmptyPerson(),
      is_carer: true,
      carer_hours_per_week: 20,
    }
    const h = mapPersonToHousehold(person)

    expect(h.people.you.is_carer_for_benefits).toBeUndefined()
  })

  it('omits optional fields when not provided', () => {
    const h = mapPersonToHousehold(createEmptyPerson())

    expect(h.people.you.is_disabled).toBeUndefined()
    expect(h.people.you.is_carer_for_benefits).toBeUndefined()
    expect(h.people.you.is_pregnant).toBeUndefined()
    expect(h.households.household.rent).toBeUndefined()
    expect(h.households.household.mortgage).toBeUndefined()
    expect(h.households.household.council_tax_band).toBeUndefined()
    expect(h.benunits.benunit.household_savings).toBeUndefined()
    expect(h.benunits.benunit.childcare_expenses).toBeUndefined()
  })
})

// ─── Value Estimator with PE Results ─────────────────────────────────────────

describe('estimateValue with PE results', () => {
  const makeDef = (id: string): EntitlementDefinition =>
    ({
      id,
      name: id,
      short_description: '',
      estimated_annual_value_range: [1000, 5000],
      claiming_difficulty: 'straightforward',
      application_method: ['online'],
    }) as unknown as EntitlementDefinition

  const peResults: PolicyEngineCalculatedBenefits = {
    universal_credit: 7200,
    pension_credit: 4800,
    child_benefit: 1331,
    housing_benefit: 5400,
    council_tax_support: 1200,
  }

  it('uses PE value for universal_credit when available', () => {
    const value = estimateValue(makeDef('universal_credit'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 7200, high: 7200 })
  })

  it('uses PE value for pension_credit when available', () => {
    const value = estimateValue(makeDef('pension_credit'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 4800, high: 4800 })
  })

  it('uses PE value for child_benefit when available', () => {
    const value = estimateValue(makeDef('child_benefit'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 1331, high: 1331 })
  })

  it('uses PE value for housing_benefit_legacy when available', () => {
    const value = estimateValue(makeDef('housing_benefit_legacy'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 5400, high: 5400 })
  })

  it('uses PE value for council_tax_reduction_full when available', () => {
    const value = estimateValue(makeDef('council_tax_reduction_full'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 1200, high: 1200 })
  })

  it('uses PE value for council_tax_support_working_age when available', () => {
    const value = estimateValue(makeDef('council_tax_support_working_age'), createEmptyPerson(), peResults)
    expect(value).toEqual({ low: 1200, high: 1200 })
  })

  it('falls through to heuristic when PE has no value for benefit', () => {
    const partialPe: PolicyEngineCalculatedBenefits = { universal_credit: 7200 }
    const value = estimateValue(makeDef('pension_credit'), retiredWidow, partialPe)
    expect(value.low).not.toEqual(value.high)
  })

  it('falls through to heuristic when PE value is 0', () => {
    const zeroPe: PolicyEngineCalculatedBenefits = { universal_credit: 0 }
    const person: PersonData = { ...createEmptyPerson(), age: 30 }
    const value = estimateValue(makeDef('universal_credit'), person, zeroPe)
    expect(value.low).toBeGreaterThanOrEqual(0)
  })

  it('falls through to heuristic when peResults is null', () => {
    const value = estimateValue(makeDef('universal_credit'), unemployedSingleRenter, null)
    expect(value.high).toBeGreaterThan(value.low)
  })

  it('uses heuristic for non-PE benefits regardless of PE data', () => {
    const value = estimateValue(makeDef('attendance_allowance'), createEmptyPerson(), peResults)
    expect(value.low).not.toEqual(value.high)
  })
})

// ─── Conflict Resolver with PE Results ───────────────────────────────────────

describe('resolveConflicts with PE results', () => {
  const tfcVsUcEdge: ConflictEdge[] = [
    {
      between: ['tax_free_childcare', 'universal_credit'],
      type: 'mutual_exclusion',
      resolution: 'Calculate both',
    },
  ]

  const pcVsUcEdge: ConflictEdge[] = [
    {
      between: ['pension_credit', 'universal_credit'],
      type: 'mutual_exclusion',
      resolution: 'Age-dependent',
    },
  ]

  it('uses PE childcare element for TFC vs UC comparison', () => {
    const eligible = new Set(['tax_free_childcare', 'universal_credit'])
    const person: PersonData = {
      ...createEmptyPerson(),
      children: [
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    }
    const pe: PolicyEngineCalculatedBenefits = {
      universal_credit: 9000,
      universal_credit_components: {
        childcare_element: 3500,
      },
    }

    const result = resolveConflicts(eligible, tfcVsUcEdge, person, pe)
    expect(result).toHaveLength(1)
    // UC childcare (£3,500) > TFC cap (£2,000 for 1 child)
    expect(result[0].recommendation).toContain('£3,500')
    expect(result[0].recommendation).toContain('UC Childcare Element')
  })

  it('recommends TFC when PE childcare element is below TFC cap', () => {
    const eligible = new Set(['tax_free_childcare', 'universal_credit'])
    const person: PersonData = {
      ...createEmptyPerson(),
      children: [
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    }
    const pe: PolicyEngineCalculatedBenefits = {
      universal_credit: 5000,
      universal_credit_components: {
        childcare_element: 1500,
      },
    }

    const result = resolveConflicts(eligible, tfcVsUcEdge, person, pe)
    expect(result).toHaveLength(1)
    // UC childcare (£1,500) < TFC cap (£4,000 for 2 children)
    expect(result[0].recommendation).toContain('Tax-Free Childcare')
    expect(result[0].recommendation).toContain('£1,500')
  })

  it('includes PE amount in PC vs UC recommendation for pensioner', () => {
    const eligible = new Set(['pension_credit', 'universal_credit'])
    const pe: PolicyEngineCalculatedBenefits = {
      pension_credit: 4800,
      universal_credit: 0,
    }
    const person = { ...createEmptyPerson(), age: 70 }

    const result = resolveConflicts(eligible, pcVsUcEdge, person, pe)
    expect(result).toHaveLength(1)
    expect(result[0].recommendation).toContain('Pension Credit')
    expect(result[0].recommendation).toContain('£4,800')
  })

  it('includes PE amount in PC vs UC recommendation for working age', () => {
    const eligible = new Set(['pension_credit', 'universal_credit'])
    const pe: PolicyEngineCalculatedBenefits = {
      pension_credit: 0,
      universal_credit: 7200,
    }
    const person = { ...createEmptyPerson(), age: 35 }

    const result = resolveConflicts(eligible, pcVsUcEdge, person, pe)
    expect(result).toHaveLength(1)
    expect(result[0].recommendation).toContain('Universal Credit')
    expect(result[0].recommendation).toContain('£7,200')
  })

  it('falls back to heuristic recommendation without PE data', () => {
    const eligible = new Set(['tax_free_childcare', 'universal_credit'])
    const person: PersonData = {
      ...createEmptyPerson(),
      income_band: 'under_16000',
    }

    const result = resolveConflicts(eligible, tfcVsUcEdge, person, null)
    expect(result).toHaveLength(1)
    expect(result[0].recommendation).toContain('UC Childcare Element')
    expect(result[0].recommendation).not.toMatch(/£[\d,]+\/yr/)
  })
})

// ─── calculateBenefits with Mocked PE API ────────────────────────────────────

describe('calculateBenefits (mocked PE API)', () => {
  it('parses UC amount from PE response', async () => {
    const peData = mockPeResponse({ universal_credit: 7200 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.universal_credit).toBe(7200)
    restore()
  })

  it('parses Pension Credit from PE response', async () => {
    const peData = mockPeResponse({
      pension_credit: 1800,
      pension_credit_guarantee_credit: 1500,
      pension_credit_savings_credit: 300,
    })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(retiredWidow)

    expect(result).not.toBeNull()
    expect(result!.pension_credit).toBe(1800)
    expect(result!.pension_credit_guarantee).toBe(1500)
    expect(result!.pension_credit_savings).toBe(300)
    restore()
  })

  it('parses Child Benefit from PE response', async () => {
    const peData = mockPeResponse({ child_benefit: 2251 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(marriedCoupleWithKids)

    expect(result).not.toBeNull()
    expect(result!.child_benefit).toBe(2251)
    restore()
  })

  it('parses Housing Benefit from PE response', async () => {
    const peData = mockPeResponse({ housing_benefit: 5400 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.housing_benefit).toBe(5400)
    restore()
  })

  it('parses Council Tax Support from household entity', async () => {
    const peData = mockPeResponse({ council_tax_benefit: 1200 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.council_tax_support).toBe(1200)
    restore()
  })

  it('parses UC component breakdown', async () => {
    const peData = mockPeResponse(
      { universal_credit: 9500 },
      {
        UC_standard_allowance: 4600,
        UC_child_element: 3200,
        UC_housing_costs_element: 7200,
        UC_carer_element: 1980,
        UC_LCWRA_element: 0,
        UC_childcare_element: 3500,
      },
    )
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(marriedCoupleWithKids)

    expect(result).not.toBeNull()
    expect(result!.universal_credit).toBe(9500)
    expect(result!.universal_credit_components).toBeDefined()
    expect(result!.universal_credit_components!.standard_allowance).toBe(4600)
    expect(result!.universal_credit_components!.child_element).toBe(3200)
    expect(result!.universal_credit_components!.housing_element).toBe(7200)
    expect(result!.universal_credit_components!.carer_element).toBe(1980)
    expect(result!.universal_credit_components!.childcare_element).toBe(3500)
    // LCWRA was 0 — should be undefined (getVal filters >0)
    expect(result!.universal_credit_components!.disability_element).toBeUndefined()
    restore()
  })

  it('omits UC components when none returned', async () => {
    const peData = mockPeResponse({ universal_credit: 4800 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.universal_credit_components).toBeUndefined()
    restore()
  })

  it('rounds PE values to nearest integer', async () => {
    const peData = mockPeResponse({ universal_credit: 7199.7, child_benefit: 2251.3 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.universal_credit).toBe(7200)
    expect(result!.child_benefit).toBe(2251)
    restore()
  })

  it('omits benefits with zero or negative values', async () => {
    const peData = mockPeResponse({ universal_credit: 0, pension_credit: -100 })
    const restore = installFetchMock(peData)

    const result = await calculateBenefits(unemployedSingleRenter)

    expect(result).not.toBeNull()
    expect(result!.universal_credit).toBeUndefined()
    expect(result!.pension_credit).toBeUndefined()
    restore()
  })
})

// ─── Fallback Behavior ──────────────────────────────────────────────────────

describe('PE fallback behavior', () => {
  it('calculateBenefits returns null on network error', async () => {
    const restore = installFetchMock(null)
    globalThis.fetch = () => Promise.reject(new Error('Network error'))

    const result = await calculateBenefits(unemployedSingleRenter)
    expect(result).toBeNull()

    restore()
  })

  it('calculateBenefits returns null on non-OK response', async () => {
    const original = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(new Response('Server Error', { status: 500 }))

    const result = await calculateBenefits(unemployedSingleRenter)
    expect(result).toBeNull()

    globalThis.fetch = original
  })

  it('calculateBenefits returns null on abort/timeout', async () => {
    const original = globalThis.fetch
    globalThis.fetch = () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 50),
      )

    const result = await calculateBenefits(unemployedSingleRenter)
    expect(result).toBeNull()

    globalThis.fetch = original
  })

  it('calculateBenefits returns null on 401 unauthorized', async () => {
    const original = globalThis.fetch
    globalThis.fetch = () =>
      Promise.resolve(new Response('{"error":"missing_authorization"}', { status: 401 }))

    const result = await calculateBenefits(unemployedSingleRenter)
    expect(result).toBeNull()

    globalThis.fetch = original
  })
})

// ─── End-to-End buildBundle with Mocked PE ───────────────────────────────────

describe('buildBundle with PE integration (mocked)', () => {
  it('produces precise UC value when PE returns data', async () => {
    const peData = mockPeResponse({
      universal_credit: 8400,
      child_benefit: 0,
      pension_credit: 0,
      housing_benefit: 0,
      council_tax_benefit: 0,
    })
    const restore = installFetchMock(peData)

    const bundle = await buildBundle(unemployedSingleRenter, ['lost_job'])

    const allResults = [
      ...bundle.gateway_entitlements,
      ...bundle.independent_entitlements,
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
    ]
    const uc = allResults.find((r) => r.id === 'universal_credit')
    expect(uc).toBeDefined()
    // PE returned precise value → low === high
    expect(uc!.estimated_annual_value.low).toBe(8400)
    expect(uc!.estimated_annual_value.high).toBe(8400)

    restore()
  })

  it('produces precise PC value when PE returns data', async () => {
    const peData = mockPeResponse({
      pension_credit: 1800,
      universal_credit: 0,
      child_benefit: 0,
      housing_benefit: 0,
      council_tax_benefit: 0,
    })
    const restore = installFetchMock(peData)

    const bundle = await buildBundle(retiredWidow, ['ageing_parent'])

    const allResults = [
      ...bundle.gateway_entitlements,
      ...bundle.independent_entitlements,
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
    ]
    const pc = allResults.find((r) => r.id === 'pension_credit')
    expect(pc).toBeDefined()
    expect(pc!.estimated_annual_value.low).toBe(1800)
    expect(pc!.estimated_annual_value.high).toBe(1800)

    restore()
  })

  it('produces precise Child Benefit when PE returns data', async () => {
    const peData = mockPeResponse({
      child_benefit: 2251,
      universal_credit: 0,
      pension_credit: 0,
      housing_benefit: 0,
      council_tax_benefit: 0,
    })
    const restore = installFetchMock(peData)

    const bundle = await buildBundle(marriedCoupleWithKids, ['new_baby'])

    const allResults = [
      ...bundle.gateway_entitlements,
      ...bundle.independent_entitlements,
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
    ]
    const cb = allResults.find((r) => r.id === 'child_benefit')
    expect(cb).toBeDefined()
    expect(cb!.estimated_annual_value.low).toBe(2251)
    expect(cb!.estimated_annual_value.high).toBe(2251)

    restore()
  })

  it('still builds bundle when PE fails (fallback to heuristics)', async () => {
    const original = globalThis.fetch
    globalThis.fetch = () => Promise.reject(new Error('PE down'))

    const bundle = await buildBundle(unemployedSingleRenter, ['lost_job'])

    const allResults = [
      ...bundle.gateway_entitlements,
      ...bundle.independent_entitlements,
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
    ]
    const uc = allResults.find((r) => r.id === 'universal_credit')
    expect(uc).toBeDefined()
    // Without PE, UC should be a heuristic range (low !== high)
    expect(uc!.estimated_annual_value.high).toBeGreaterThan(uc!.estimated_annual_value.low)

    // Bundle should still be structurally valid
    expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
    expect(bundle.action_plan.length).toBeGreaterThan(0)

    globalThis.fetch = original
  })

  it('non-PE benefits use heuristics even when PE succeeds', async () => {
    const peData = mockPeResponse({ universal_credit: 8400 })
    const restore = installFetchMock(peData)

    const bundle = await buildBundle(selfEmployedCarer, ['ageing_parent'])

    const allResults = [
      ...bundle.gateway_entitlements,
      ...bundle.independent_entitlements,
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
    ]
    const ca = allResults.find((r) => r.id === 'carers_allowance')
    if (ca) {
      // CA is not PE-mapped, should use heuristic (both values the same, from fixed rate)
      expect(ca.estimated_annual_value.low).toBeGreaterThan(0)
    }

    restore()
  })

  it('total value is positive for all test personas (with PE failing)', async () => {
    // Simulate PE being down — all bundles should still work via heuristics
    const original = globalThis.fetch
    globalThis.fetch = () => Promise.reject(new Error('PE down'))

    const scenarios: [PersonData, string[]][] = [
      [unemployedSingleRenter, ['lost_job']],
      [retiredWidow, ['ageing_parent']],
      [marriedCoupleWithKids, ['new_baby']],
      [selfEmployedCarer, ['ageing_parent']],
      [disabledChildFamily, ['child_struggling_school']],
    ]

    for (const [person, situations] of scenarios) {
      const bundle = await buildBundle(person, situations)
      expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
      expect(bundle.action_plan.length).toBeGreaterThan(0)
    }

    globalThis.fetch = original
  })

  it('total value is positive for all test personas (with PE succeeding)', async () => {
    const peData = mockPeResponse({
      universal_credit: 7200,
      pension_credit: 1800,
      child_benefit: 2251,
      housing_benefit: 5400,
      council_tax_benefit: 1200,
    })
    const restore = installFetchMock(peData)

    const scenarios: [PersonData, string[]][] = [
      [unemployedSingleRenter, ['lost_job']],
      [retiredWidow, ['ageing_parent']],
      [marriedCoupleWithKids, ['new_baby']],
      [selfEmployedCarer, ['ageing_parent']],
      [disabledChildFamily, ['child_struggling_school']],
    ]

    for (const [person, situations] of scenarios) {
      const bundle = await buildBundle(person, situations)
      expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
      expect(bundle.action_plan.length).toBeGreaterThan(0)
    }

    restore()
  })
})
