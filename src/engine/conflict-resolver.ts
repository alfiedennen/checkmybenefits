import type { ConflictEdge, ConflictResolution } from '../types/entitlements.ts'
import type { PersonData } from '../types/person.ts'

/**
 * Walks conflict edges and produces ConflictResolution objects
 * for pairs where both options are in the eligible set.
 */
export function resolveConflicts(
  eligibleIds: Set<string>,
  conflictEdges: ConflictEdge[],
  personData: PersonData,
): ConflictResolution[] {
  const resolutions: ConflictResolution[] = []

  for (const edge of conflictEdges) {
    const [idA, idB] = edge.between
    if (!eligibleIds.has(idA) || !eligibleIds.has(idB)) continue

    const resolution = resolveSpecificConflict(idA, idB, edge, personData)
    if (resolution) {
      resolutions.push(resolution)
    }
  }

  return resolutions
}

function resolveSpecificConflict(
  idA: string,
  idB: string,
  edge: ConflictEdge,
  personData: PersonData,
): ConflictResolution | null {
  switch (true) {
    case hasIds(idA, idB, 'tax_free_childcare', 'universal_credit'):
      return resolveTfcVsUc(personData)

    case hasIds(idA, idB, 'pension_credit', 'universal_credit'):
      return resolvePcVsUc(personData)

    case hasIds(idA, idB, 'pip', 'attendance_allowance'):
      return resolvePipVsAa(personData)

    case hasIds(idA, idB, 'carers_allowance', 'state_pension'):
      return resolveCaVsSp()

    default:
      return {
        option_a: idA,
        option_a_id: idA,
        option_b: idB,
        option_b_id: idB,
        recommendation: edge.resolution,
        reasoning: edge.resolution,
      }
  }
}

function hasIds(a: string, b: string, id1: string, id2: string): boolean {
  return (a === id1 && b === id2) || (a === id2 && b === id1)
}

function resolveTfcVsUc(personData: PersonData): ConflictResolution {
  // UC childcare (85% of costs) is usually better for lower income families
  const isLowerIncome =
    personData.income_band === 'under_12570' ||
    personData.income_band === 'under_16000' ||
    personData.income_band === 'under_25000'

  const recommendation = isLowerIncome
    ? 'UC Childcare Element is likely better for your income level — it covers 85% of childcare costs.'
    : 'Tax-Free Childcare (20% government top-up) may be better at your income level. Check both.'

  return {
    option_a: 'Tax-Free Childcare',
    option_a_id: 'tax_free_childcare',
    option_b: 'UC Childcare Element',
    option_b_id: 'universal_credit',
    recommendation,
    reasoning:
      'These are mutually exclusive — you can only use one. UC childcare element covers 85% of costs (usually better for lower incomes). Tax-Free Childcare adds 20% to your payments (up to £2,000/child/year).',
  }
}

function resolvePcVsUc(personData: PersonData): ConflictResolution {
  const age = personData.age ?? 0
  const recommendation =
    age >= 66
      ? 'At your age, Pension Credit is the right route — not Universal Credit.'
      : 'At your age, Universal Credit is the right route — not Pension Credit.'

  return {
    option_a: 'Pension Credit',
    option_a_id: 'pension_credit',
    option_b: 'Universal Credit',
    option_b_id: 'universal_credit',
    recommendation,
    reasoning:
      'These are age-dependent and mutually exclusive. Under state pension age = UC. Over state pension age = Pension Credit. Mixed-age couples (since May 2019) generally claim UC.',
  }
}

function resolvePipVsAa(personData: PersonData): ConflictResolution {
  const age = personData.age ?? 0
  const recommendation =
    age >= 66
      ? 'At your age, Attendance Allowance is the right route.'
      : 'At your age, PIP (Personal Independence Payment) is the right route.'

  return {
    option_a: 'PIP',
    option_a_id: 'pip',
    option_b: 'Attendance Allowance',
    option_b_id: 'attendance_allowance',
    recommendation,
    reasoning:
      'These are age-dependent. Under state pension age = PIP. Over state pension age = Attendance Allowance. Both are not means-tested.',
  }
}

function resolveCaVsSp(): ConflictResolution {
  return {
    option_a: "Carer's Allowance",
    option_a_id: 'carers_allowance',
    option_b: 'State Pension',
    option_b_id: 'state_pension',
    recommendation:
      "Always claim Carer's Allowance even if State Pension is higher — the underlying entitlement triggers carer premiums and passported benefits.",
    reasoning:
      "You can't receive both, but claiming CA (even if you receive SP instead) unlocks Carer's Credit, UC carer element, and council tax discounts.",
  }
}
