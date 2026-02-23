import type { PersonData } from '../../src/types/person.ts'
import type { SituationId } from '../../src/types/conversation.ts'

/**
 * Multi-turn evaluation scenarios.
 *
 * Each scenario is a sequence of user messages simulating a real conversation.
 * The eval runner sends each turn to Bedrock, accumulates PersonData via
 * AI extraction + code fallback (same as production), and verifies:
 *
 * 1. AI does NOT transition to 'complete' before all critical fields are collected
 * 2. After all turns, hasCriticalFields() passes
 * 3. buildBundle() produces the expected entitlements
 */

export interface MultiTurnScenario {
  id: string
  name: string
  /** User messages in order — the AI responds after each */
  turns: string[]
  /** Expected situations identified across the conversation */
  expectedSituations: SituationId[]
  /** After all turns, combined PersonData should contain these fields */
  expectedPersonData: Partial<PersonData>
  /** Expected entitlements in the final bundle */
  expectedEntitlements: string[]
  /** Minimum bundle size */
  minBundleSize: number
  /**
   * Turn index (0-based) where the AI is allowed to transition to 'complete'.
   * Before this turn, any 'complete' transition is a failure.
   * Typically the last turn index (turns.length - 1).
   */
  earliestCompleteTurn: number
}

// ── MT01: Job loss, evasive income ──────────────────

const MT01: MultiTurnScenario = {
  id: 'MT01',
  name: 'Job loss, evasive income — AI should persist',
  turns: [
    "I've just lost my job",
    'not much honestly',
    'nothing, zero income',
    'renting privately, £800 a month',
    'E1 6AN',
  ],
  expectedSituations: ['lost_job'],
  expectedPersonData: {
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    postcode: 'E1 6AN',
  },
  expectedEntitlements: ['universal_credit', 'council_tax_support_working_age'],
  minBundleSize: 6,
  earliestCompleteTurn: 4, // can only complete on last turn (postcode)
}

// ── MT02: Pensioner, missing housing ────────────────

const MT02: MultiTurnScenario = {
  id: 'MT02',
  name: 'Pensioner, missing housing — AI must ask for it',
  turns: [
    "I'm 78 and retired",
    'about £9000 a year from pensions',
    'B15 1TJ',
    'we own our house outright',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 78,
    employment_status: 'retired',
    income_band: 'under_12570',
    housing_tenure: 'own_outright',
    postcode: 'B15 1TJ',
  },
  expectedEntitlements: ['pension_credit', 'winter_fuel_payment'],
  minBundleSize: 4,
  earliestCompleteTurn: 3, // housing comes last
}

// ── MT03: Everything in one message ─────────────────

const MT03: MultiTurnScenario = {
  id: 'MT03',
  name: 'Everything in one message — AI handles dense input',
  turns: [
    "My wife and I just had a baby, I work part time earning about £14,000, we live in a council flat in LS1 1BA",
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    relationship_status: 'couple_married',
    income_band: 'under_16000',
    housing_tenure: 'rent_social',
    postcode: 'LS1 1BA',
  },
  expectedEntitlements: ['child_benefit'],
  minBundleSize: 4,
  earliestCompleteTurn: 0, // could complete in one turn if all fields extracted
}

// ── MT04: No housing → must not complete (BUG 1 REPRO) ──

const MT04: MultiTurnScenario = {
  id: 'MT04',
  name: 'No housing provided — AI must NOT complete early',
  turns: [
    "I've lost my job",
    'nothing, no income',
    'E1 6AN',
    'renting privately',
  ],
  expectedSituations: ['lost_job'],
  expectedPersonData: {
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    postcode: 'E1 6AN',
  },
  expectedEntitlements: ['universal_credit'],
  minBundleSize: 6,
  earliestCompleteTurn: 3, // housing comes on turn 4, so earliest complete is turn 3
}

// ── MT05: Carer, gradual reveal ─────────────────────

const MT05: MultiTurnScenario = {
  id: 'MT05',
  name: 'Carer, gradual reveal across 6 turns',
  turns: [
    "My mum can't cope on her own anymore",
    "She's 82, I go over every day",
    'About 40 hours a week looking after her',
    'I had to give up work, no income now',
    'Council house, £400 a month',
    'NE1 7RU',
  ],
  expectedSituations: ['ageing_parent'],
  expectedPersonData: {
    is_carer: true,
    carer_hours_per_week: 40,
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_social',
    postcode: 'NE1 7RU',
  },
  expectedEntitlements: ['carers_allowance', 'universal_credit'],
  minBundleSize: 6,
  earliestCompleteTurn: 5,
}

// ── MT06: Disability, PIP already received ──────────

const MT06: MultiTurnScenario = {
  id: 'MT06',
  name: 'Disability with PIP — AI recognises existing benefit',
  turns: [
    "I have MS and can't work",
    "I'm on PIP enhanced rate mobility",
    'no income at all',
    "I'm single, renting privately, £700 a month",
    'M1 1AD',
  ],
  expectedSituations: ['health_condition'],
  expectedPersonData: {
    has_disability_or_health_condition: true,
    disability_benefit_received: 'pip_mobility_enhanced',
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    postcode: 'M1 1AD',
  },
  expectedEntitlements: ['universal_credit', 'motability_scheme', 'vehicle_excise_duty_exemption'],
  minBundleSize: 6,
  earliestCompleteTurn: 4,
}

// ── MT07: Bereavement, emotional context ────────────

const MT07: MultiTurnScenario = {
  id: 'MT07',
  name: 'Bereavement — AI handles emotion while collecting data',
  turns: [
    "My husband died last month, I don't know what to do",
    "I'm 68, I was a housewife",
    'just his pension, about eight thousand a year',
    'we own our home',
    'NE1 7RU',
  ],
  expectedSituations: ['bereavement'],
  expectedPersonData: {
    is_bereaved: true,
    deceased_relationship: 'partner',
    age: 68,
    employment_status: 'retired',
    income_band: 'under_12570',
    housing_tenure: 'own_outright',
    postcode: 'NE1 7RU',
  },
  expectedEntitlements: ['pension_credit', 'winter_fuel_payment'],
  minBundleSize: 4,
  earliestCompleteTurn: 4,
}

// ── MT08: Student employment type ───────────────────

const MT08: MultiTurnScenario = {
  id: 'MT08',
  name: 'Student — AI correctly classifies uncommon status',
  turns: [
    "I'm a full time student and I'm pregnant with our first baby",
    'My partner works, earning about £18,000',
    "We're renting privately, £600 a month",
    'LE1 1WB',
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    employment_status: 'student',
    is_pregnant: true,
    expecting_first_child: true,
    income_band: 'under_25000',
    housing_tenure: 'rent_private',
    postcode: 'LE1 1WB',
  },
  expectedEntitlements: ['child_benefit', 'student_maintenance_loan'],
  minBundleSize: 3,
  earliestCompleteTurn: 3,
}

export const ALL_MULTI_TURN_SCENARIOS: MultiTurnScenario[] = [
  MT01, MT02, MT03, MT04, MT05, MT06, MT07, MT08,
]
