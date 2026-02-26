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
    "I'm 35 and I've just lost my job",
    'not much honestly',
    'nothing, zero income',
    'renting privately, £800 a month',
    'E1 6AN',
  ],
  expectedSituations: ['lost_job'],
  expectedPersonData: {
    age: 35,
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
    "I'm 30 and my wife and I just had a baby, I work part time earning about £14,000, we live in a council flat in LS1 1BA",
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    age: 30,
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
    "I'm 28 and I've lost my job",
    'nothing, no income',
    'E1 6AN',
    'renting privately',
  ],
  expectedSituations: ['lost_job'],
  expectedPersonData: {
    age: 28,
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
    "She's 82, I go over every day. I'm 48.",
    'About 40 hours a week looking after her',
    'I had to give up work, no income now',
    'Council house, £400 a month',
    'NE1 7RU',
  ],
  expectedSituations: ['ageing_parent'],
  expectedPersonData: {
    age: 48,
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
    "I'm 42 and I have MS and can't work",
    "I'm on PIP enhanced rate mobility",
    'no income at all',
    "I'm single, renting privately, £700 a month",
    'M1 1AD',
  ],
  expectedSituations: ['health_condition'],
  expectedPersonData: {
    age: 42,
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
    "I'm 22, a full time student and I'm pregnant with our first baby",
    'My partner works, earning about £18,000',
    "We're renting privately, £600 a month",
    'LE1 1WB',
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    age: 22,
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

// ── MT09: Welsh pensioner — nation-specific entitlements ──

const MT09: MultiTurnScenario = {
  id: 'MT09',
  name: 'Welsh pensioner — nation-specific entitlements',
  turns: [
    "I'm 75 and retired, living on my own",
    'about £9,000 a year from my pension',
    'I own my house outright',
    'CF10 1EP',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 75,
    employment_status: 'retired',
    income_band: 'under_12570',
    housing_tenure: 'own_outright',
    postcode: 'CF10 1EP',
    nation: 'wales',
  },
  expectedEntitlements: ['pension_credit', 'free_nhs_prescriptions', 'council_tax_reduction_wales'],
  minBundleSize: 4,
  earliestCompleteTurn: 3,
}

// ── MT10: Scottish family with children ──────────────

const MT10: MultiTurnScenario = {
  id: 'MT10',
  name: 'Scottish family — Scottish Child Payment + Best Start',
  turns: [
    "I'm 32, I've just had a baby boy, he's 2 months old. I'm not working at the moment.",
    'My partner works part-time, about £10,000 a year',
    'We rent from the council, £450 a month',
    'EH1 1YZ',
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    age: 32,
    employment_status: 'unemployed',
    income_band: 'under_12570',
    housing_tenure: 'rent_social',
    postcode: 'EH1 1YZ',
    nation: 'scotland',
  },
  expectedEntitlements: ['child_benefit', 'scottish_child_payment', 'best_start_grant'],
  minBundleSize: 4,
  earliestCompleteTurn: 3,
}

// ── MT11: Qualitative age — "I'm old" ───────────────

const MT11: MultiTurnScenario = {
  id: 'MT11',
  name: 'Qualitative age "I\'m old" — must ask for numeric age',
  turns: [
    "I'm old and I need help, I can't manage on my own",
    "I'm 79",
    'just my state pension, about £11,000',
    'I rent from the council, £500 a month',
    'B15 1TJ',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 79,
    employment_status: 'retired',
    income_band: 'under_12570',
    housing_tenure: 'rent_social',
    postcode: 'B15 1TJ',
  },
  expectedEntitlements: ['pension_credit', 'winter_fuel_payment'],
  minBundleSize: 4,
  earliestCompleteTurn: 4,
}

// ── MT12: Colloquial gradual reveal ──────────────────

const MT12: MultiTurnScenario = {
  id: 'MT12',
  name: 'Colloquial gradual reveal — slang extraction',
  turns: [
    "me and the missus just had a baby, I'm 29 and not working",
    'she works at Tesco, about 12 grand a year',
    'council gaff, 500 quid a month',
    'BD1 1HU',
  ],
  expectedSituations: ['new_baby'],
  expectedPersonData: {
    age: 29,
    employment_status: 'unemployed',
    relationship_status: 'couple_cohabiting',
    income_band: 'under_16000',
    housing_tenure: 'rent_social',
    postcode: 'BD1 1HU',
  },
  expectedEntitlements: ['child_benefit', 'universal_credit'],
  minBundleSize: 4,
  earliestCompleteTurn: 3,
}

// ── MT13: Vague-to-specific funnel ───────────────────

const MT13: MultiTurnScenario = {
  id: 'MT13',
  name: 'Vague-to-specific funnel — AI must probe',
  turns: [
    'I need help, things are really bad right now',
    "I lost my job 3 weeks ago, I'm 45",
    'renting privately, £800 a month',
    'no savings, no partner, no income',
    'LS1 1BA',
  ],
  expectedSituations: ['lost_job'],
  expectedPersonData: {
    age: 45,
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    postcode: 'LS1 1BA',
  },
  expectedEntitlements: ['universal_credit', 'council_tax_support_working_age'],
  minBundleSize: 6,
  earliestCompleteTurn: 4,
}

// ── MT14: Complex financial (pension components) ─────

const MT14: MultiTurnScenario = {
  id: 'MT14',
  name: 'Complex financial — pension components summed',
  turns: [
    "I'm 72 and retired, getting state pension plus a small works pension",
    'about £14,000 between them both',
    'I own my house outright',
    'NE1 7RU',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 72,
    employment_status: 'retired',
    income_band: 'under_16000',
    housing_tenure: 'own_outright',
    postcode: 'NE1 7RU',
  },
  expectedEntitlements: ['winter_fuel_payment'],
  minBundleSize: 3,
  earliestCompleteTurn: 3,
}

// ── MT15: Welsh carer with dialect ───────────────────

const MT15: MultiTurnScenario = {
  id: 'MT15',
  name: 'Welsh carer with dialect — mam, valleys',
  turns: [
    "my mam can't manage on her own anymore, she's 83 and lives in Swansea",
    "I'm 50, I go over every day, about 40 hours a week looking after her",
    'I had to give up work, no income now',
    'renting privately, £550 a month',
    'SA1 1NW',
  ],
  expectedSituations: ['ageing_parent'],
  expectedPersonData: {
    age: 50,
    is_carer: true,
    carer_hours_per_week: 40,
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    postcode: 'SA1 1NW',
    nation: 'wales',
  },
  expectedEntitlements: ['carers_allowance', 'universal_credit'],
  minBundleSize: 6,
  earliestCompleteTurn: 4,
}

// ── MT16: Scottish family, complex ───────────────────

const MT16: MultiTurnScenario = {
  id: 'MT16',
  name: 'Scottish family — second bairn, partner redundant',
  turns: [
    "just had our second bairn, I'm 30. My partner's been made redundant last month.",
    'I work part-time, about £10,000 a year',
    'council house, £400 a month',
    'EH1 1YZ',
  ],
  expectedSituations: ['new_baby', 'lost_job'],
  expectedPersonData: {
    age: 30,
    income_band: 'under_12570',
    housing_tenure: 'rent_social',
    postcode: 'EH1 1YZ',
    nation: 'scotland',
  },
  expectedEntitlements: ['child_benefit', 'scottish_child_payment', 'universal_credit'],
  minBundleSize: 4,
  earliestCompleteTurn: 3,
}

// ── MT17: Self-employed single parent, own autism/ADHD ──

const MT17: MultiTurnScenario = {
  id: 'MT17',
  name: 'Self-employed single parent with autism/ADHD — disability is the USER\'s',
  turns: [
    "i'm self employed, single parent, autism and adhd",
    "it's me who has autism and adhd, not my child",
    "i'm 34, my daughter is 6",
    'about 8 thousand a year',
    'renting privately, £650 a month',
    'LS9 8AG',
  ],
  expectedSituations: ['health_condition'],
  expectedPersonData: {
    age: 34,
    employment_status: 'self_employed',
    has_disability_or_health_condition: true,
    relationship_status: 'single',
    income_band: 'under_12570',
    housing_tenure: 'rent_private',
    postcode: 'LS9 8AG',
  },
  expectedEntitlements: ['universal_credit', 'child_benefit'],
  minBundleSize: 6,
  earliestCompleteTurn: 5,
}

// ── MT18: Domestic abuse, fleeing with children ─────

const MT18: MultiTurnScenario = {
  id: 'MT18',
  name: 'Domestic abuse — fleeing partner with 2 kids',
  turns: [
    'I need to leave my partner, he is abusive. I have two kids aged 3 and 7.',
    "I'm 31, I've never worked, he controlled everything",
    "we're staying at my mum's house for now",
    'no income at all, he kept all the money',
    'M14 5RQ',
  ],
  expectedSituations: ['domestic_abuse'],
  expectedPersonData: {
    age: 31,
    employment_status: 'unemployed',
    relationship_status: 'separated',
    income_band: 'under_7400',
    housing_tenure: 'living_with_family',
    postcode: 'M14 5RQ',
  },
  expectedEntitlements: ['universal_credit', 'child_benefit'],
  minBundleSize: 8,
  earliestCompleteTurn: 4,
}

// ── MT19: Working poverty — couple, low wages, 2 kids ──

const MT19: MultiTurnScenario = {
  id: 'MT19',
  name: 'Working poverty — couple both working, still struggling',
  turns: [
    "We're both working but we can't make ends meet. Two kids aged 4 and 10.",
    "I'm 35, I work full time on minimum wage, my wife does 16 hours at Asda",
    'about 28 thousand between us',
    'renting privately, £900 a month',
    'BD1 1HU',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 35,
    employment_status: 'employed',
    relationship_status: 'couple_married',
    income_band: 'under_50270',
    housing_tenure: 'rent_private',
    postcode: 'BD1 1HU',
  },
  expectedEntitlements: ['child_benefit', 'free_childcare_15hrs_universal'],
  minBundleSize: 3,
  earliestCompleteTurn: 4,
}

// ── MT20: Young NEET, care leaver ───────────────────

const MT20: MultiTurnScenario = {
  id: 'MT20',
  name: 'Young NEET care leaver — 18, sofa surfing, no income',
  turns: [
    "I'm 18, just left care and I've got nowhere to go",
    "I'm staying on a mate's sofa, no job",
    'nothing, no money at all',
    'SE1 7QY',
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 18,
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'homeless',
    postcode: 'SE1 7QY',
  },
  expectedEntitlements: ['universal_credit'],
  minBundleSize: 6,
  earliestCompleteTurn: 3,
}

// ── MT21: Homeless rough sleeper ────────────────────

const MT21: MultiTurnScenario = {
  id: 'MT21',
  name: 'Homeless rough sleeper — no fixed address',
  turns: [
    'I am sleeping rough and have nowhere to go',
    "I'm 40, been on the streets about 3 months",
    'not working, no income',
    "I'm in Birmingham, around B5",
  ],
  expectedSituations: [],
  expectedPersonData: {
    age: 40,
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'homeless',
  },
  expectedEntitlements: ['universal_credit'],
  minBundleSize: 6,
  earliestCompleteTurn: 3,
}

export const ALL_MULTI_TURN_SCENARIOS: MultiTurnScenario[] = [
  MT01, MT02, MT03, MT04, MT05, MT06, MT07, MT08, MT09, MT10, MT11,
  MT12, MT13, MT14, MT15, MT16, MT17, MT18, MT19, MT20, MT21,
]
