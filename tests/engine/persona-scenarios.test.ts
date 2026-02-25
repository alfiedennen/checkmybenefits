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

  // ── Nation warning test ─────────────────────────

  it('Welsh postcode produces bundle with nation=wales', async () => {
    const welshPensioner: PersonData = {
      ...pensionerWithCareNeeds,
      nation: 'wales',
      postcode: 'CF10 1BH',
    }
    const bundle = await buildBundle(welshPensioner, ['ageing_parent'])
    expect(bundle.nation).toBe('wales')
  })

  it('English persona produces bundle with nation=england', async () => {
    const bundle = await buildBundle(pensionerWithCareNeeds, ['ageing_parent'])
    expect(bundle.nation).toBe('england')
  })

  it('Welsh pensioner gets free prescriptions for everyone', async () => {
    const welshPensioner: PersonData = {
      age: 45,
      nation: 'wales',
      postcode: 'CF10 1BH',
      relationship_status: 'single',
      employment_status: 'employed',
      gross_annual_income: 35000,
      income_band: 'under_50270',
      housing_tenure: 'own_outright',
      children: [],
    }
    const bundle = await buildBundle(welshPensioner, [])
    const ids = getAllIds(bundle)
    // In England this person wouldn't qualify (employed, decent income, under 60)
    // In Wales, prescriptions are free for everyone
    expect(ids).toContain('free_nhs_prescriptions')
  })

  it('Welsh user does not get England-only childcare entitlements', async () => {
    const welshParent: PersonData = {
      age: 30,
      nation: 'wales',
      postcode: 'CF10 1BH',
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 25000,
      income_band: 'under_25000',
      housing_tenure: 'rent_private',
      children: [{ age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false }],
    }
    const bundle = await buildBundle(welshParent, ['new_baby'])
    const ids = getAllIds(bundle)
    expect(ids).not.toContain('free_childcare_30hrs')
    expect(ids).not.toContain('free_childcare_15hrs_universal')
    expect(ids).not.toContain('ehcp_assessment')
  })

  it('Scottish user does not get cold_weather_payment', async () => {
    const scottishPensioner: PersonData = {
      age: 70,
      nation: 'scotland',
      postcode: 'EH1 1YZ',
      relationship_status: 'single',
      employment_status: 'retired',
      gross_annual_income: 9000,
      income_band: 'under_12570',
      housing_tenure: 'own_outright',
      children: [],
    }
    const bundle = await buildBundle(scottishPensioner, [])
    const ids = getAllIds(bundle)
    expect(ids).not.toContain('cold_weather_payment')
    // Should still get pension-age benefits
    expect(ids).toContain('pension_credit')
  })

  it('Welsh low-income family gets Wales-specific entitlements', async () => {
    const welshFamily: PersonData = {
      age: 35,
      nation: 'wales',
      postcode: 'CF10 1BH',
      relationship_status: 'couple_married',
      employment_status: 'unemployed',
      recently_redundant: true,
      gross_annual_income: 0,
      income_band: 'under_7400',
      housing_tenure: 'rent_social',
      monthly_housing_cost: 500,
      children: [
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    }
    const bundle = await buildBundle(welshFamily, ['lost_job'])
    const ids = getAllIds(bundle)
    // Should get Wales-specific entitlements
    expect(ids).toContain('council_tax_reduction_wales')
    expect(ids).toContain('welsh_government_fuel_support')
    expect(ids).toContain('discretionary_assistance_fund_wales')
    expect(ids).toContain('pupil_development_grant_wales')
    expect(ids).toContain('free_nhs_prescriptions') // free for all in Wales
    // Should NOT get England-only entitlements
    expect(ids).not.toContain('council_tax_support_working_age')
    expect(ids).not.toContain('free_childcare_30hrs')
  })

  it('Scottish 20-year-old gets free bus travel', async () => {
    const scottishYouth: PersonData = {
      age: 20,
      nation: 'scotland',
      postcode: 'EH1 1YZ',
      relationship_status: 'single',
      employment_status: 'student',
      gross_annual_income: 0,
      income_band: 'under_7400',
      housing_tenure: 'living_with_family',
      children: [],
    }
    const bundle = await buildBundle(scottishYouth, [])
    const ids = getAllIds(bundle)
    expect(ids).toContain('concessionary_bus_travel')
  })

  it('Scottish low-income family gets Scotland-specific entitlements', async () => {
    const scottishFamily: PersonData = {
      age: 35,
      nation: 'scotland',
      postcode: 'EH1 1YZ',
      relationship_status: 'couple_married',
      employment_status: 'unemployed',
      recently_redundant: true,
      gross_annual_income: 0,
      income_band: 'under_7400',
      housing_tenure: 'rent_social',
      monthly_housing_cost: 500,
      children: [
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    }
    const bundle = await buildBundle(scottishFamily, ['lost_job'])
    const ids = getAllIds(bundle)
    // Should get Scotland-specific entitlements
    expect(ids).toContain('scottish_child_payment')
    expect(ids).toContain('best_start_foods')
    expect(ids).toContain('council_tax_reduction_scotland')
    expect(ids).toContain('scottish_welfare_fund')
    expect(ids).toContain('winter_heating_payment')
    expect(ids).toContain('school_clothing_grant_scotland')
    // Should NOT get England-only entitlements
    expect(ids).not.toContain('council_tax_support_working_age')
    expect(ids).not.toContain('cold_weather_payment')
    expect(ids).not.toContain('free_childcare_30hrs')
  })

  it('Scottish pensioner with care needs gets Scottish disability benefits', async () => {
    const scottishPensioner: PersonData = {
      age: 75,
      nation: 'scotland',
      postcode: 'EH1 1YZ',
      relationship_status: 'single',
      employment_status: 'retired',
      gross_annual_income: 9000,
      income_band: 'under_12570',
      housing_tenure: 'own_outright',
      children: [],
      has_disability_or_health_condition: true,
      needs_help_with_daily_living: true,
    }
    const bundle = await buildBundle(scottishPensioner, ['ageing_parent'])
    const ids = getAllIds(bundle)
    expect(ids).toContain('pension_age_disability_payment')
    expect(ids).toContain('pension_credit')
    expect(ids).toContain('winter_heating_payment')
    expect(ids).toContain('free_nhs_prescriptions') // free for all in Scotland
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
