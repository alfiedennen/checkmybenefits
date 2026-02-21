import { describe, it, expect } from 'vitest'
import { resolveCascade } from '../../src/engine/cascade-resolver.ts'
import type {
  EntitlementResult,
  EntitlementDefinition,
  DependencyEdge,
} from '../../src/types/entitlements.ts'

function makeResult(id: string, name: string, highValue: number): EntitlementResult {
  return {
    id,
    name,
    plain_description: '',
    estimated_annual_value: { low: 0, high: highValue },
    confidence: 'likely',
    difficulty: 'moderate',
    application_method: 'Online',
    what_you_need: [],
    timeline: '',
  }
}

function makeDef(id: string, isGateway: boolean): EntitlementDefinition {
  return {
    id,
    name: id,
    short_description: '',
    admin_body: 'dwp',
    application_method: ['online'],
    estimated_annual_value_range: [0, 1000],
    claiming_difficulty: 'moderate',
    is_gateway: isGateway,
    eligibility: {},
    unlocks: [],
    conflicts_with: [],
  }
}

describe('cascade-resolver', () => {
  it('groups cascaded entitlements under their gateway (ageing parent)', () => {
    const results: EntitlementResult[] = [
      makeResult('attendance_allowance', 'Attendance Allowance', 5600),
      makeResult('pension_credit', 'Pension Credit', 8000),
      makeResult('council_tax_reduction_full', 'Council Tax Reduction', 2500),
      makeResult('warm_home_discount', 'Warm Home Discount', 150),
      makeResult('carers_allowance', "Carer's Allowance", 4260),
      makeResult('social_tariff_broadband', 'Broadband Social Tariff', 200),
    ]

    const defs: EntitlementDefinition[] = [
      makeDef('attendance_allowance', true),
      makeDef('pension_credit', true),
      makeDef('council_tax_reduction_full', false),
      makeDef('warm_home_discount', false),
      makeDef('carers_allowance', true),
      makeDef('social_tariff_broadband', false),
    ]

    const edges: DependencyEdge[] = [
      { from: 'attendance_allowance', to: 'pension_credit', type: 'strengthens' },
      { from: 'attendance_allowance', to: 'carers_allowance', type: 'enables_for_carer' },
      { from: 'pension_credit', to: 'council_tax_reduction_full', type: 'gateway' },
      { from: 'pension_credit', to: 'warm_home_discount', type: 'gateway', auto: true },
      { from: 'pension_credit', to: 'social_tariff_broadband', type: 'qualifies' },
    ]

    const result = resolveCascade(results, defs, edges)

    // Pension Credit should be a gateway (it has dependents)
    const gwIds = result.gateway_entitlements.map((g) => g.id)
    expect(gwIds).toContain('pension_credit')

    // Council Tax Reduction and Warm Home Discount should be cascaded under PC
    const pcGroup = result.cascaded_entitlements.find((g) => g.gateway_id === 'pension_credit')
    expect(pcGroup).toBeDefined()
    const cascadedIds = pcGroup!.entitlements.map((e) => e.id)
    expect(cascadedIds).toContain('council_tax_reduction_full')
    expect(cascadedIds).toContain('warm_home_discount')
    expect(cascadedIds).toContain('social_tariff_broadband')
  })

  it('puts entitlements with no dependencies into independent list', () => {
    const results: EntitlementResult[] = [
      makeResult('marriage_allowance', 'Marriage Allowance', 252),
    ]

    const defs: EntitlementDefinition[] = [makeDef('marriage_allowance', false)]

    const result = resolveCascade(results, defs, [])

    expect(result.gateway_entitlements).toHaveLength(0)
    expect(result.cascaded_entitlements).toHaveLength(0)
    expect(result.independent_entitlements).toHaveLength(1)
    expect(result.independent_entitlements[0].id).toBe('marriage_allowance')
  })

  it('handles empty eligible set', () => {
    const result = resolveCascade([], [], [])
    expect(result.gateway_entitlements).toHaveLength(0)
    expect(result.cascaded_entitlements).toHaveLength(0)
    expect(result.independent_entitlements).toHaveLength(0)
  })

  it('does not include a gateway with no eligible dependents', () => {
    const results: EntitlementResult[] = [
      makeResult('attendance_allowance', 'Attendance Allowance', 5600),
    ]

    const defs: EntitlementDefinition[] = [makeDef('attendance_allowance', true)]

    // Edge exists but target is not eligible
    const edges: DependencyEdge[] = [
      { from: 'attendance_allowance', to: 'pension_credit', type: 'strengthens' },
    ]

    const result = resolveCascade(results, defs, edges)
    expect(result.gateway_entitlements).toHaveLength(0)
    expect(result.independent_entitlements).toHaveLength(1)
    expect(result.independent_entitlements[0].id).toBe('attendance_allowance')
  })
})
