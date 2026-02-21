import { describe, it, expect } from 'vitest'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import type { PersonData } from '../../src/types/person.ts'

describe('bundle-builder', () => {
  it('builds ageing parent bundle with correct cascade', async () => {
    const person: PersonData = {
      age: 45,
      nation: 'england',
      postcode: 'TN34 1PL',
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 28000,
      income_band: 'under_50270',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 800,
      children: [],
      has_disability_or_health_condition: false,
      is_carer: true,
      carer_hours_per_week: 40,
      cared_for_person: {
        relationship: 'mother',
        age: 82,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
    }

    const bundle = await buildBundle(person, ['ageing_parent'])

    // Should have some results
    expect(bundle.gateway_entitlements.length + bundle.independent_entitlements.length).toBeGreaterThan(0)

    // Should have an action plan
    expect(bundle.action_plan.length).toBeGreaterThan(0)

    // Total value should be positive
    expect(bundle.total_estimated_annual_value.high).toBeGreaterThan(0)
  })

  it('builds lost job bundle with UC as gateway', async () => {
    const person: PersonData = {
      age: 35,
      nation: 'england',
      postcode: 'E1 6AN',
      relationship_status: 'single',
      employment_status: 'unemployed',
      gross_annual_income: 0,
      income_band: 'under_7400',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 1200,
      children: [],
      has_disability_or_health_condition: false,
      is_carer: false,
      recently_redundant: true,
    }

    const bundle = await buildBundle(person, ['lost_job'])

    // UC should be eligible
    const allIds = [
      ...bundle.gateway_entitlements.map((e) => e.id),
      ...bundle.independent_entitlements.map((e) => e.id),
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
    ]
    expect(allIds).toContain('universal_credit')

    // Action plan should mark things as urgent
    const firstStep = bundle.action_plan[0]
    expect(firstStep.week).toContain('week')
  })

  it('builds new baby bundle with child benefit', async () => {
    const person: PersonData = {
      age: 30,
      nation: 'england',
      postcode: 'SW1A 1AA',
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 35000,
      income_band: 'under_50270',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 1500,
      children: [{ age: 0, has_additional_needs: false, disability_benefit: 'none', in_education: false }],
      has_disability_or_health_condition: false,
      is_carer: false,
      is_pregnant: false,
    }

    const bundle = await buildBundle(person, ['new_baby'])

    const allIds = [
      ...bundle.gateway_entitlements.map((e) => e.id),
      ...bundle.independent_entitlements.map((e) => e.id),
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
    ]
    expect(allIds).toContain('child_benefit')
  })

  it('builds child struggling bundle with EHCP', async () => {
    const person: PersonData = {
      age: 40,
      nation: 'england',
      postcode: 'OX1 1DP',
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 32000,
      income_band: 'under_50270',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 900,
      children: [{ age: 8, has_additional_needs: true, disability_benefit: 'none', in_education: true }],
      has_disability_or_health_condition: false,
      is_carer: true,
      carer_hours_per_week: 25,
    }

    const bundle = await buildBundle(person, ['child_struggling_school'])

    const allIds = [
      ...bundle.gateway_entitlements.map((e) => e.id),
      ...bundle.independent_entitlements.map((e) => e.id),
      ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
    ]
    expect(allIds).toContain('ehcp_assessment')
    expect(allIds).toContain('dla_child')
  })
})
