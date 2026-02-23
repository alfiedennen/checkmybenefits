import { describe, it, expect } from 'vitest'
import { extractFromMessage } from '../../src/services/message-extractor.ts'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import { hasCriticalFields } from '../../src/engine/critical-fields.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { SituationId } from '../../src/types/conversation.ts'

/**
 * Conversation Replay Tests — Real-World Rubric Layer 1
 *
 * These simulate realistic multi-turn conversations using ONLY the code
 * extractor pipeline. Each scenario is an array of user messages; we run
 * extractFromMessage() per message, accumulate PersonData, then verify
 * hasCriticalFields() and buildBundle() produce sensible results.
 *
 * This catches extraction gaps that would silently block results in production.
 */

// ── Helpers ─────────────────────────────────────────

function replayConversation(messages: string[]): PersonData {
  let person = createEmptyPerson()
  for (const msg of messages) {
    const extracted = extractFromMessage(msg)
    person = { ...person, ...extracted }
  }
  return person
}

function getAllIds(bundle: Awaited<ReturnType<typeof buildBundle>>): string[] {
  return [
    ...bundle.gateway_entitlements.map((e) => e.id),
    ...bundle.independent_entitlements.map((e) => e.id),
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
  ]
}

interface ReplayScenario {
  id: string
  name: string
  messages: string[]
  situations: SituationId[]
  expectedFields: Partial<PersonData>
  expectedEntitlements: string[]
  excludedEntitlements?: string[]
  minBundleSize: number
}

async function runScenario(scenario: ReplayScenario) {
  const person = replayConversation(scenario.messages)

  // Check expected field values
  for (const [key, expected] of Object.entries(scenario.expectedFields)) {
    if (key === 'children') continue // handled separately
    if (key.includes('.')) continue // nested fields handled separately
    const actual = (person as Record<string, unknown>)[key]
    expect(actual, `${scenario.id}: field '${key}'`).toBe(expected)
  }

  // Check children array if expected
  if (scenario.expectedFields.children) {
    expect(person.children?.length, `${scenario.id}: children count`).toBe(
      scenario.expectedFields.children.length,
    )
  }

  // Check cared_for_person if expected
  const expectedCared = scenario.expectedFields as Record<string, unknown>
  if (expectedCared['cared_for_person.age']) {
    expect(person.cared_for_person?.age, `${scenario.id}: cared_for_person.age`).toBe(
      expectedCared['cared_for_person.age'],
    )
  }
  if (expectedCared['cared_for_person.relationship']) {
    expect(
      person.cared_for_person?.relationship,
      `${scenario.id}: cared_for_person.relationship`,
    ).toBe(expectedCared['cared_for_person.relationship'])
  }

  // Critical fields gate
  expect(hasCriticalFields(person), `${scenario.id}: hasCriticalFields`).toBe(true)

  // Build bundle
  const bundle = await buildBundle(person, scenario.situations)
  const ids = getAllIds(bundle)

  // Check expected entitlements present
  for (const expected of scenario.expectedEntitlements) {
    expect(ids, `${scenario.id}: should include ${expected}`).toContain(expected)
  }

  // Check excluded entitlements absent
  for (const excluded of scenario.excludedEntitlements ?? []) {
    expect(ids, `${scenario.id}: should not include ${excluded}`).not.toContain(excluded)
  }

  // Check minimum bundle size
  expect(ids.length, `${scenario.id}: bundle size`).toBeGreaterThanOrEqual(scenario.minBundleSize)
}

// ── Scenarios ───────────────────────────────────────

describe('Conversation Replay — Real-World Rubric', () => {
  it('R01: Job loss, single, renting — "None" as zero income (BUG REPRODUCTION)', async () => {
    await runScenario({
      id: 'R01',
      name: 'Job loss, single, renting',
      messages: [
        "I've just lost my job",
        'None I lost my job',
        'Renting privately, £850 a month',
        'E1 6AN',
      ],
      situations: ['lost_job'],
      expectedFields: {
        employment_status: 'unemployed',
        income_band: 'under_7400',
        gross_annual_income: 0,
        housing_tenure: 'rent_private',
        monthly_housing_cost: 850,
        postcode: 'E1 6AN',
      },
      expectedEntitlements: ['universal_credit', 'council_tax_support_working_age'],
      excludedEntitlements: ['pension_credit', 'attendance_allowance'],
      minBundleSize: 6,
    })
  })

  it('R02: Job loss, couple with kids, mortgage — combined answers + "12 grand"', async () => {
    await runScenario({
      id: 'R02',
      name: 'Job loss, couple with kids, mortgage',
      messages: [
        "I've been made redundant, my wife works part time",
        'She earns about 12 grand',
        'Mortgage, 2 kids aged 9 and 11',
        'S11 8YA',
      ],
      situations: ['lost_job'],
      expectedFields: {
        employment_status: 'unemployed',
        recently_redundant: true,
        relationship_status: 'couple_married',
        gross_annual_income: 12000,
        income_band: 'under_12570',
        housing_tenure: 'mortgage',
      },
      expectedEntitlements: ['universal_credit', 'child_benefit', 'free_school_meals'],
      excludedEntitlements: ['pension_credit'],
      minBundleSize: 7,
    })
  })

  it('R03: Pensioner with care needs', async () => {
    await runScenario({
      id: 'R03',
      name: 'Pensioner with care needs',
      messages: [
        "I'm 78 and my wife helps me with everything",
        "We're retired, about £9000 a year from pensions",
        'We own our home outright',
        'B15 1TJ',
      ],
      situations: ['ageing_parent'],
      expectedFields: {
        age: 78,
        employment_status: 'retired',
        housing_tenure: 'own_outright',
        income_band: 'under_12570',
      },
      expectedEntitlements: ['attendance_allowance', 'pension_credit', 'winter_fuel_payment'],
      excludedEntitlements: ['universal_credit', 'child_benefit'],
      minBundleSize: 5,
    })
  })

  it('R04: Young family, new baby expected', async () => {
    await runScenario({
      id: 'R04',
      name: 'Young family, new baby expected',
      messages: [
        "We're expecting our first baby",
        'I work part time, about 15k',
        'Council flat',
        'LS1 1BA',
      ],
      situations: ['new_baby'],
      expectedFields: {
        is_pregnant: true,
        expecting_first_child: true,
        income_band: 'under_16000',
        housing_tenure: 'rent_social',
      },
      expectedEntitlements: ['sure_start_maternity_grant', 'child_benefit'],
      excludedEntitlements: ['attendance_allowance', 'pension_credit'],
      minBundleSize: 4,
    })
  })

  it('R05: Carer for parent — "Nothing" as zero income', async () => {
    await runScenario({
      id: 'R05',
      name: 'Carer for parent',
      messages: [
        "My mum is 82 and can't cope on her own",
        'I look after her about 40 hours a week',
        'Nothing, I had to give up work',
        'Renting from the council, £450 a month',
        'NE1 7RU',
      ],
      situations: ['ageing_parent'],
      expectedFields: {
        is_carer: true,
        carer_hours_per_week: 40,
        'cared_for_person.age': 82 as never,
        'cared_for_person.relationship': 'parent' as never,
        gross_annual_income: 0,
        income_band: 'under_7400',
        housing_tenure: 'rent_social',
      },
      expectedEntitlements: ['carers_allowance', 'universal_credit'],
      minBundleSize: 6,
    })
  })

  it('R06: Disability, MS, on PIP — "Zero income" variant', async () => {
    await runScenario({
      id: 'R06',
      name: 'Disability (MS, on PIP)',
      messages: [
        "I have MS and can't work anymore",
        "I'm on PIP enhanced rate mobility",
        'Zero income since I was let go',
        "Renting privately, £700 a month, I'm single",
        'M1 1AD',
      ],
      situations: ['health_condition'],
      expectedFields: {
        has_disability_or_health_condition: true,
        disability_benefit_received: 'pip_mobility_enhanced',
        gross_annual_income: 0,
        income_band: 'under_7400',
        relationship_status: 'single',
        housing_tenure: 'rent_private',
      },
      expectedEntitlements: ['universal_credit', 'motability_scheme', 'vehicle_excise_duty_exemption'],
      minBundleSize: 6,
    })
  })

  it('R07: Bereavement, widowed pensioner', async () => {
    await runScenario({
      id: 'R07',
      name: 'Bereavement (widowed pensioner)',
      messages: [
        'My husband died last month',
        "I'm 68, retired",
        'Just his pension, about £8000 a year',
        'We own our home outright',
        'NE1 7RU',
      ],
      situations: ['bereavement'],
      expectedFields: {
        is_bereaved: true,
        deceased_relationship: 'partner',
        age: 68,
        employment_status: 'retired',
        income_band: 'under_12570',
        housing_tenure: 'own_outright',
      },
      expectedEntitlements: ['pension_credit', 'winter_fuel_payment'],
      minBundleSize: 4,
    })
  })

  it('R08: Separated with kids — "fifteen grand" word-based income', async () => {
    await runScenario({
      id: 'R08',
      name: 'Separated with kids',
      messages: [
        "We've recently separated",
        'I work part-time, about fifteen grand',
        '2 kids aged 8 and 5, renting privately £700 a month',
        'CF10 1BH',
      ],
      situations: ['separation'],
      expectedFields: {
        relationship_status: 'separated',
        gross_annual_income: 15000,
        income_band: 'under_16000',
        housing_tenure: 'rent_private',
      },
      expectedEntitlements: ['child_benefit', 'universal_credit'],
      minBundleSize: 5,
    })
  })

  it('R09: Student with baby — student employment extraction + bundle', async () => {
    await runScenario({
      id: 'R09',
      name: 'Student with baby expected',
      messages: [
        "I'm a student and I'm pregnant with our first baby",
        'My partner works, earning about £18,000 per annum',
        "We're renting privately, £600 a month",
        'LE1 1WB',
      ],
      situations: ['new_baby'],
      expectedFields: {
        employment_status: 'student',
        is_pregnant: true,
        expecting_first_child: true,
        income_band: 'under_25000',
        housing_tenure: 'rent_private',
      },
      expectedEntitlements: ['child_benefit'],
      minBundleSize: 3,
    })
  })

  it('R10: Complex multi-situation — job loss + carer + kids + autism', async () => {
    await runScenario({
      id: 'R10',
      name: 'Complex multi-situation',
      messages: [
        "I've just lost my job and my mum's 79, she can't cope",
        'I look after her about 40 hours a week',
        'My wife earns about 12 grand, mortgage is £2000',
        '3 kids aged 14, 9, and 5. The youngest has autism',
        'S11 8YA',
      ],
      situations: ['lost_job', 'ageing_parent', 'child_struggling_school'],
      expectedFields: {
        employment_status: 'unemployed',
        is_carer: true,
        carer_hours_per_week: 40,
        relationship_status: 'couple_married',
        gross_annual_income: 12000,
        income_band: 'under_12570',
        housing_tenure: 'mortgage',
        monthly_housing_cost: 2000,
      },
      expectedEntitlements: ['universal_credit', 'child_benefit', 'carers_allowance'],
      minBundleSize: 8,
    })
  })

  it('R11: Zero income edge case — "£0"', async () => {
    await runScenario({
      id: 'R11',
      name: 'Zero income edge case',
      messages: [
        "I've just lost my job",
        '£0',
        'Renting, £500 a month',
        'E1 6AN',
      ],
      situations: ['lost_job'],
      expectedFields: {
        employment_status: 'unemployed',
        gross_annual_income: 0,
        income_band: 'under_7400',
        housing_tenure: 'rent_private',
      },
      expectedEntitlements: ['universal_credit'],
      minBundleSize: 6,
    })
  })

  // R12: Typos and lowercase — documents known limitations
  it('R12: Typos and lowercase — documents housing typo gap', async () => {
    const person = replayConversation([
      'lost my job last month',
      'nothing at the moment',
      'morgage, paying about 1000 a month',
      'tn34 3jn',
    ])

    // Known gap: "morgage" typo is NOT caught by code extractor
    expect(person.housing_tenure).toBeUndefined()
    expect(hasCriticalFields(person)).toBe(false)

    // Postcode normalisation works (lowercase → uppercase)
    expect(person.postcode).toBe('TN34 3JN')

    // Zero income from "nothing" works
    expect(person.gross_annual_income).toBe(0)
    expect(person.income_band).toBe('under_7400')

    // With corrected spelling, full pipeline works
    const corrected = replayConversation([
      'lost my job last month',
      'nothing at the moment',
      'mortgage, paying about 1000 a month',
      'tn34 3jn',
    ])
    expect(hasCriticalFields(corrected)).toBe(true)

    const bundle = await buildBundle(corrected, ['lost_job'])
    const ids = getAllIds(bundle)
    expect(ids).toContain('universal_credit')
    expect(ids.length).toBeGreaterThanOrEqual(6)
  })
})
