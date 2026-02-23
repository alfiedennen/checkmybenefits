import { describe, it, expect } from 'vitest'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import type { PersonData } from '../../src/types/person.ts'

/**
 * Persona-based integration tests for buildBundle().
 * Each persona mirrors a prompt_tests.md scenario with fully-populated PersonData.
 * Verifies correct benefit counts and specific entitlement IDs.
 */

function getAllIds(bundle: Awaited<ReturnType<typeof buildBundle>>): string[] {
  return [
    ...bundle.gateway_entitlements.map((e) => e.id),
    ...bundle.independent_entitlements.map((e) => e.id),
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
  ]
}

// ── Persona definitions ───────────────────────────

const redundantSingleRenter: PersonData = {
  age: 35,
  nation: 'england',
  postcode: 'E1 6AN',
  relationship_status: 'single',
  employment_status: 'unemployed',
  recently_redundant: true,
  gross_annual_income: 0,
  income_band: 'under_7400',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 1200,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
}

const redundantWithMortgage: PersonData = {
  age: 40,
  nation: 'england',
  postcode: 'TN34 3JN',
  relationship_status: 'single',
  employment_status: 'unemployed',
  recently_redundant: true,
  gross_annual_income: 0,
  income_band: 'under_7400',
  housing_tenure: 'mortgage',
  monthly_housing_cost: 2100,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
  months_on_uc: 10,
}

const redundantCoupleWithKids: PersonData = {
  age: 45,
  nation: 'england',
  postcode: 'S11 8YA',
  relationship_status: 'couple_married',
  employment_status: 'unemployed',
  recently_redundant: true,
  gross_annual_income: 12000,
  income_band: 'under_12570',
  housing_tenure: 'mortgage',
  monthly_housing_cost: 2000,
  children: [
    { age: 14, has_additional_needs: false, disability_benefit: 'none', in_education: true },
    { age: 9, has_additional_needs: false, disability_benefit: 'none', in_education: true },
    { age: 5, has_additional_needs: true, disability_benefit: 'none', in_education: true },
  ],
  has_disability_or_health_condition: false,
  is_carer: true,
  carer_hours_per_week: 40,
  cared_for_person: {
    relationship: 'parent',
    age: 79,
    disability_benefit: 'none',
    needs_help_daily_living: true,
  },
}

const pensionerWithCareNeeds: PersonData = {
  age: 82,
  nation: 'england',
  postcode: 'B15 1TJ',
  relationship_status: 'single',
  employment_status: 'retired',
  income_band: 'under_12570',
  gross_annual_income: 10000,
  housing_tenure: 'own_outright',
  children: [],
  has_disability_or_health_condition: true,
  needs_help_with_daily_living: true,
  is_carer: false,
}

const newBabyLowIncome: PersonData = {
  age: 28,
  nation: 'england',
  postcode: 'LS1 1BA',
  relationship_status: 'couple_cohabiting',
  employment_status: 'employed',
  gross_annual_income: 14000,
  income_band: 'under_16000',
  housing_tenure: 'rent_social',
  monthly_housing_cost: 500,
  children: [{ age: 0, has_additional_needs: false, disability_benefit: 'none', in_education: false }],
  has_disability_or_health_condition: false,
  is_carer: false,
  is_pregnant: false,
  expecting_first_child: false,
}

const disabledAdultPIP: PersonData = {
  age: 50,
  nation: 'england',
  postcode: 'M1 1AD',
  relationship_status: 'single',
  employment_status: 'sick_disabled',
  gross_annual_income: 0,
  income_band: 'under_7400',
  housing_tenure: 'rent_social',
  monthly_housing_cost: 450,
  children: [],
  has_disability_or_health_condition: true,
  disability_benefit_received: 'pip_mobility_enhanced',
  needs_help_with_daily_living: true,
  mobility_difficulty: true,
  is_carer: false,
}

const widowedPensioner: PersonData = {
  age: 75,
  nation: 'england',
  postcode: 'NE1 7RU',
  relationship_status: 'widowed',
  employment_status: 'retired',
  gross_annual_income: 8000,
  income_band: 'under_12570',
  housing_tenure: 'rent_social',
  monthly_housing_cost: 400,
  children: [],
  has_disability_or_health_condition: true,
  needs_help_with_daily_living: true,
  is_carer: false,
  is_bereaved: true,
  deceased_relationship: 'partner',
}

const separatedWithKids: PersonData = {
  age: 32,
  nation: 'england',
  postcode: 'CF10 1BH',
  relationship_status: 'separated',
  employment_status: 'employed',
  gross_annual_income: 15000,
  income_band: 'under_16000',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 700,
  children: [
    { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
    { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
  ],
  has_disability_or_health_condition: false,
  is_carer: false,
}

const sandwichCarer: PersonData = {
  age: 42,
  nation: 'england',
  postcode: 'OX1 1DP',
  relationship_status: 'couple_married',
  employment_status: 'employed',
  gross_annual_income: 22000,
  income_band: 'under_25000',
  housing_tenure: 'mortgage',
  monthly_housing_cost: 900,
  children: [
    { age: 10, has_additional_needs: true, disability_benefit: 'none', in_education: true },
  ],
  has_disability_or_health_condition: false,
  is_carer: true,
  carer_hours_per_week: 35,
  cared_for_person: {
    relationship: 'parent',
    age: 81,
    disability_benefit: 'none',
    needs_help_daily_living: true,
  },
}

const pregnantFirstBaby: PersonData = {
  age: 25,
  nation: 'england',
  postcode: 'LE1 1WB',
  relationship_status: 'couple_cohabiting',
  employment_status: 'employed',
  gross_annual_income: 13000,
  income_band: 'under_16000',
  housing_tenure: 'rent_private',
  monthly_housing_cost: 600,
  children: [],
  has_disability_or_health_condition: false,
  is_carer: false,
  is_pregnant: true,
  expecting_first_child: true,
}

// ── Tests ─────────────────────────────────────────

describe('persona scenario bundle tests', () => {
  it('5.1: redundant single renter gets 8+ benefits', async () => {
    const bundle = await buildBundle(redundantSingleRenter, ['lost_job'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('universal_credit')
    expect(ids.length).toBeGreaterThanOrEqual(8)
    expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
  })

  it('5.3: redundant with mortgage gets 10+ benefits', async () => {
    const bundle = await buildBundle(redundantWithMortgage, ['lost_job'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('universal_credit')
    expect(ids.length).toBeGreaterThanOrEqual(10)

    // Should include mortgage-specific + NHS cascades
    const expectedSubset = [
      'universal_credit',
      'council_tax_support_working_age',
      'warm_home_discount',
    ]
    for (const id of expectedSubset) {
      expect(ids).toContain(id)
    }
  })

  it('A1: redundant couple with kids + ageing parent gets 8+ benefits', async () => {
    const bundle = await buildBundle(redundantCoupleWithKids, [
      'lost_job',
      'ageing_parent',
      'child_struggling_school',
    ])
    const ids = getAllIds(bundle)

    expect(ids).toContain('universal_credit')
    expect(ids).toContain('child_benefit')
    expect(ids.length).toBeGreaterThanOrEqual(8)
  })

  it('4.2: pensioner with care needs gets 6+ benefits', async () => {
    const bundle = await buildBundle(pensionerWithCareNeeds, ['ageing_parent'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('attendance_allowance')
    expect(ids).toContain('pension_credit')
    expect(ids.length).toBeGreaterThanOrEqual(6)
  })

  it('6.2: new baby low income gets 6+ benefits', async () => {
    const bundle = await buildBundle(newBabyLowIncome, ['new_baby'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('child_benefit')
    expect(ids.length).toBeGreaterThanOrEqual(6)
  })

  it('7.2: disabled adult with PIP gets 6+ benefits', async () => {
    const bundle = await buildBundle(disabledAdultPIP, ['health_condition'])
    const ids = getAllIds(bundle)

    expect(ids.length).toBeGreaterThanOrEqual(6)

    // PIP mobility enhanced should unlock transport benefits
    const hasTransport = ids.includes('concessionary_bus_travel') ||
      ids.includes('motability_scheme') ||
      ids.includes('vehicle_excise_duty_exemption')
    expect(hasTransport).toBe(true)
  })

  it('15.3: widowed pensioner gets 5+ benefits', async () => {
    const bundle = await buildBundle(widowedPensioner, ['bereavement'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('attendance_allowance')
    expect(ids).toContain('pension_credit')
    expect(ids.length).toBeGreaterThanOrEqual(5)
  })

  it('9a: separated with kids gets 5+ benefits', async () => {
    const bundle = await buildBundle(separatedWithKids, ['separation'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('child_benefit')
    expect(ids.length).toBeGreaterThanOrEqual(5)
  })

  it('15.5: sandwich carer gets 5+ benefits', async () => {
    const bundle = await buildBundle(sandwichCarer, [
      'ageing_parent',
      'child_struggling_school',
    ])
    const ids = getAllIds(bundle)

    expect(ids).toContain('attendance_allowance')
    expect(ids.length).toBeGreaterThanOrEqual(5)

    // Should include child-related + carer benefits
    const hasChildRelated = ids.includes('ehcp_assessment') || ids.includes('dla_child')
    expect(hasChildRelated).toBe(true)
  })

  it('6.1: pregnant with first baby gets pregnancy-related benefits', async () => {
    const bundle = await buildBundle(pregnantFirstBaby, ['new_baby'])
    const ids = getAllIds(bundle)

    expect(ids).toContain('sure_start_maternity_grant')
    expect(ids).toContain('child_benefit')
    expect(ids.length).toBeGreaterThanOrEqual(4)
  })

  // ── Income preprocessing tests ──────────────────

  it('preprocesses income to £0 for redundant single person', async () => {
    const personWithWrongIncome: PersonData = {
      ...redundantSingleRenter,
      gross_annual_income: 50000,
      income_band: 'under_50270',
    }
    const bundle = await buildBundle(personWithWrongIncome, ['lost_job'])
    const ids = getAllIds(bundle)

    // Should still get UC because preprocessing corrects income to £0
    expect(ids).toContain('universal_credit')
    expect(ids.length).toBeGreaterThanOrEqual(8)
  })

  it('does NOT preprocess income for redundant couple (partner may earn)', async () => {
    const couplePersona: PersonData = {
      ...redundantCoupleWithKids,
      gross_annual_income: 12000,
      income_band: 'under_12570',
    }
    const bundle = await buildBundle(couplePersona, ['lost_job'])

    // Should still be eligible for UC at £12k couple income
    const ids = getAllIds(bundle)
    expect(ids).toContain('universal_credit')
    // Total should reflect actual income, not zero
    expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
  })

  it('urgent action plan for job loss scenarios', async () => {
    const bundle = await buildBundle(redundantSingleRenter, ['lost_job'])

    expect(bundle.action_plan.length).toBeGreaterThan(0)
    // First step should be urgent
    const firstWeek = bundle.action_plan[0].week
    expect(firstWeek).toMatch(/this week/i)
  })

  it('non-urgent action plan for non-job-loss scenarios', async () => {
    const bundle = await buildBundle(pensionerWithCareNeeds, ['ageing_parent'])

    expect(bundle.action_plan.length).toBeGreaterThan(0)
    const firstWeek = bundle.action_plan[0].week
    expect(firstWeek).toMatch(/week 1/i)
  })
})
