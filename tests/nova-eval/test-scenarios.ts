import type { PersonData } from '../../src/types/person.ts'
import type { SituationId, ConversationStage } from '../../src/types/conversation.ts'

export interface ExpectedOutput {
  situations?: SituationId[]
  personData?: Partial<PersonData>
  stageTransition?: ConversationStage
  /** If true, we only check that no person_data tag is emitted */
  noPersonData?: boolean
  /** If true, we only check that no situation tag is emitted */
  noSituation?: boolean
  /** Text should contain one of these substrings (case-insensitive) */
  textContains?: string[]
}

export interface Turn {
  role: 'user' | 'assistant'
  content: string
}

export interface TestScenario {
  id: string
  name: string
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U'
  /** Stage the conversation is in when this message is sent */
  stage: ConversationStage
  /** Existing person data context (simulates accumulated state) */
  existingPersonData?: Partial<PersonData>
  /** Existing situations context */
  existingSituations?: SituationId[]
  /** Previous messages in the conversation (for multi-turn) */
  previousMessages?: Turn[]
  /** The user message to send */
  userMessage: string
  /** What we expect in the response */
  expected: ExpectedOutput
}

// ──────────────────────────────────────────────
// Category A: Intake Extraction
// ──────────────────────────────────────────────

const A1_COMPLEX_MULTI: TestScenario = {
  id: 'A1',
  name: 'Complex multi-situation (3 situations, rich detail)',
  category: 'A',
  stage: 'intake',
  userMessage:
    "My mum's 79, she can't cope on her own anymore. I've lost my job — was made redundant last month. My wife works part-time earning about £12,000. We've got 3 kids aged 14, 9, and 5. The youngest has autism. We're paying £2000 a month on the mortgage. We live in Sheffield, S11 8YA.",
  expected: {
    situations: ['ageing_parent', 'lost_job', 'child_struggling_school'],
    stageTransition: 'questions',
    personData: {
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
      cared_for_person: {
        relationship: 'parent',
        age: 79,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
      postcode: 'S11 8YA',
    },
  },
}

const A2_NEW_BABY_SIMPLE: TestScenario = {
  id: 'A2',
  name: 'New baby — simple intake',
  category: 'A',
  stage: 'intake',
  userMessage: "We're expecting our first baby in March. I work part time at Tesco.",
  expected: {
    situations: ['new_baby'],
    stageTransition: 'questions',
    personData: {
      is_pregnant: true,
      expecting_first_child: true,
      employment_status: 'employed',
    },
  },
}

const A3_AGEING_PARENT_MINIMAL: TestScenario = {
  id: 'A3',
  name: 'Ageing parent — minimal info',
  category: 'A',
  stage: 'intake',
  userMessage: "My mum can't cope on her own anymore",
  expected: {
    situations: ['ageing_parent'],
    stageTransition: 'questions',
  },
}

const A4_LOST_JOB_DETAILED: TestScenario = {
  id: 'A4',
  name: 'Lost job — detailed single situation',
  category: 'A',
  stage: 'intake',
  userMessage:
    "I was made redundant last week. I'm 34, single, renting a council flat in Birmingham B15 1AA for £600 a month. I've got about £3000 in savings.",
  expected: {
    situations: ['lost_job'],
    stageTransition: 'questions',
    personData: {
      age: 34,
      relationship_status: 'single',
      employment_status: 'unemployed',
      recently_redundant: true,
      housing_tenure: 'rent_social',
      monthly_housing_cost: 600,
      household_capital: 3000,
      postcode: 'B15 1AA',
    },
  },
}

const A5_CHILD_STRUGGLING: TestScenario = {
  id: 'A5',
  name: 'Child struggling at school — ADHD diagnosis',
  category: 'A',
  stage: 'intake',
  userMessage:
    "My 7 year old has just been diagnosed with ADHD and the school can't handle him. They keep calling us in for meetings.",
  expected: {
    situations: ['child_struggling_school'],
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 7, has_additional_needs: true, disability_benefit: 'none', in_education: true },
      ],
    },
  },
}

const A6_TWO_SITUATIONS: TestScenario = {
  id: 'A6',
  name: 'Two situations — caring + lost job',
  category: 'A',
  stage: 'intake',
  userMessage:
    "I'm caring for my dad who's 85 and needs help with everything. My partner just lost his job last week.",
  expected: {
    situations: ['ageing_parent', 'lost_job'],
    stageTransition: 'questions',
    personData: {
      is_carer: true,
      cared_for_person: {
        relationship: 'parent',
        age: 85,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
      recently_redundant: true,
    },
  },
}

// ──────────────────────────────────────────────
// Category B: Income Band Mapping
// ──────────────────────────────────────────────

function makeIncomeTurn(userMessage: string, expected: ExpectedOutput): TestScenario {
  return {
    id: '',
    name: '',
    category: 'B',
    stage: 'questions',
    existingPersonData: {
      relationship_status: 'couple_married',
      employment_status: 'unemployed',
      housing_tenure: 'mortgage',
    },
    existingSituations: ['lost_job'],
    previousMessages: [
      { role: 'user', content: "I've lost my job" },
      {
        role: 'assistant',
        content:
          "I'm sorry to hear that. I can help you find what support you might be entitled to. Roughly, what's your household income?",
      },
    ],
    userMessage,
    expected,
  }
}

const B1_TWELVE_GRAND: TestScenario = {
  ...makeIncomeTurn('About twelve grand', {
    personData: { income_band: 'under_12570', gross_annual_income: 12000 },
  }),
  id: 'B1',
  name: 'Income: "about twelve grand"',
}

const B2_25K: TestScenario = {
  ...makeIncomeTurn('My wife earns £25,000', {
    personData: { income_band: 'under_25000', gross_annual_income: 25000 },
  }),
  id: 'B2',
  name: 'Income: "£25,000"',
}

const B3_45K: TestScenario = {
  ...makeIncomeTurn("We're on about £45k between us", {
    personData: { income_band: 'under_50270', gross_annual_income: 45000 },
  }),
  id: 'B3',
  name: 'Income: "about £45k"',
}

const B4_MIN_WAGE: TestScenario = {
  ...makeIncomeTurn("I'm on minimum wage, 20 hours a week", {
    personData: { income_band: 'under_12570' },
  }),
  id: 'B4',
  name: 'Income: minimum wage 20hrs',
}

const B5_JSA: TestScenario = {
  ...makeIncomeTurn('Just JSA at the moment, nothing else', {
    personData: { income_band: 'under_7400' },
  }),
  id: 'B5',
  name: 'Income: JSA only',
}

// ──────────────────────────────────────────────
// Category C: Implicit Inference
// ──────────────────────────────────────────────

function makeInferenceTurn(
  userMessage: string,
  expected: ExpectedOutput,
): Omit<TestScenario, 'id' | 'name'> {
  return {
    category: 'C',
    stage: 'intake',
    userMessage,
    expected: {
      ...expected,
      situations: expected.situations ?? ['lost_job'],
    },
  }
}

const C1_WIFE: TestScenario = {
  ...makeInferenceTurn("My wife and I have been struggling since I lost my job", {
    personData: { relationship_status: 'couple_married' },
  }),
  id: 'C1',
  name: 'Implicit: "my wife" → couple_married',
}

const C2_MORTGAGE: TestScenario = {
  ...makeInferenceTurn("I've lost my job and don't know how we'll pay the mortgage", {
    personData: { housing_tenure: 'mortgage' },
  }),
  id: 'C2',
  name: 'Implicit: "mortgage" → housing_tenure: mortgage',
}

const C3_REDUNDANT: TestScenario = {
  ...makeInferenceTurn('I was made redundant two weeks ago', {
    personData: { employment_status: 'unemployed', recently_redundant: true },
  }),
  id: 'C3',
  name: 'Implicit: "made redundant" → unemployed + recently_redundant',
}

const C4_PARTNER: TestScenario = {
  ...makeInferenceTurn("My partner and I both lost our jobs last month", {
    personData: { relationship_status: 'couple_cohabiting' },
  }),
  id: 'C4',
  name: 'Implicit: "my partner" → couple_cohabiting',
}

const C5_COUNCIL_RENT: TestScenario = {
  ...makeInferenceTurn("I've been made redundant and I rent from the council", {
    personData: { housing_tenure: 'rent_social' },
  }),
  id: 'C5',
  name: 'Implicit: "rent from the council" → rent_social',
}

const C6_LIVING_WITH_PARENTS: TestScenario = {
  ...makeInferenceTurn("I lost my job and I'm living with my parents at the moment", {
    personData: { housing_tenure: 'living_with_family' },
  }),
  id: 'C6',
  name: 'Implicit: "living with my parents" → living_with_family',
}

// ──────────────────────────────────────────────
// Category D: Multi-turn Conversations
// ──────────────────────────────────────────────

const D1_AGEING_PARENT_TURN1: TestScenario = {
  id: 'D1a',
  name: 'Multi-turn ageing parent: turn 1 (intake)',
  category: 'D',
  stage: 'intake',
  userMessage: "My mum can't cope on her own anymore",
  expected: {
    situations: ['ageing_parent'],
    stageTransition: 'questions',
  },
}

const D1_AGEING_PARENT_TURN2: TestScenario = {
  id: 'D1b',
  name: 'Multi-turn ageing parent: turn 2 (household)',
  category: 'D',
  stage: 'questions',
  existingSituations: ['ageing_parent'],
  previousMessages: [
    { role: 'user', content: "My mum can't cope on her own anymore" },
    {
      role: 'assistant',
      content:
        "I'm sorry to hear that — it's understandable to be worried. I can help find what support might be available. First, who lives in your household?",
    },
  ],
  userMessage: 'Just me and my partner',
  expected: {
    personData: { relationship_status: 'couple_married' },
  },
}

const D1_AGEING_PARENT_TURN3: TestScenario = {
  id: 'D1c',
  name: 'Multi-turn ageing parent: turn 3 (mum details)',
  category: 'D',
  stage: 'questions',
  existingSituations: ['ageing_parent'],
  existingPersonData: { relationship_status: 'couple_married' },
  previousMessages: [
    { role: 'user', content: "My mum can't cope on her own anymore" },
    {
      role: 'assistant',
      content:
        "I'm sorry to hear that. I can help. First, who lives in your household?",
    },
    { role: 'user', content: 'Just me and my partner' },
    { role: 'assistant', content: "Got it. How old is your mum, and what kind of help does she need?" },
  ],
  userMessage: "She's 82. She needs help with everything — washing, cooking, she forgets her tablets.",
  expected: {
    personData: {
      cared_for_person: {
        relationship: 'parent',
        age: 82,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
    },
  },
}

const D2_NEW_BABY_TURN1: TestScenario = {
  id: 'D2a',
  name: 'Multi-turn new baby: turn 1 (intake)',
  category: 'D',
  stage: 'intake',
  userMessage: "We're expecting a baby, it's our first",
  expected: {
    situations: ['new_baby'],
    stageTransition: 'questions',
    personData: {
      is_pregnant: true,
      expecting_first_child: true,
    },
  },
}

const D2_NEW_BABY_TURN2: TestScenario = {
  id: 'D2b',
  name: 'Multi-turn new baby: turn 2 (income + housing)',
  category: 'D',
  stage: 'questions',
  existingSituations: ['new_baby'],
  existingPersonData: { is_pregnant: true, expecting_first_child: true },
  previousMessages: [
    { role: 'user', content: "We're expecting a baby, it's our first" },
    {
      role: 'assistant',
      content:
        "Congratulations! I can help you find what support you might be entitled to. What's your rough household income?",
    },
  ],
  userMessage: 'I earn about £18,000 and we rent privately for £950 a month',
  expected: {
    personData: {
      gross_annual_income: 18000,
      income_band: 'under_25000',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 950,
    },
  },
}

// ──────────────────────────────────────────────
// Category E: Pipeline / Data Quality
// Tests focused on income correction, required fields,
// and data pipeline gaps exposed by the thin-results bug.
// ──────────────────────────────────────────────

const E1_JOB_LOSS_MORTGAGE_INCOME: TestScenario = {
  id: 'E1',
  name: 'Job loss + mortgage — should set income to £0/under_7400',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
    housing_tenure: 'mortgage',
    monthly_housing_cost: 2100,
  },
  existingSituations: ['lost_job'],
  userMessage:
    "I was earning £50,000 before I lost my job. I'm single, no kids. My postcode is TN34 3JN.",
  expected: {
    personData: {
      postcode: 'TN34 3JN',
      relationship_status: 'single',
    },
    // Key: model should NOT set income_band to under_50270 (old salary).
    // The programmatic safety net will correct it, but we want the AI to also get it right.
    textContains: ['postcode', 'TN34'],
  },
}

const E2_JOB_LOSS_COUPLE_PARTNER_INCOME: TestScenario = {
  id: 'E2',
  name: 'Job loss + couple — should use partner income, not previous salary',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
  },
  existingSituations: ['lost_job'],
  userMessage:
    "My wife works part-time earning about £12,000. We've got a mortgage of £1,500 a month. We're in S11 8YA.",
  expected: {
    personData: {
      relationship_status: 'couple_married',
      gross_annual_income: 12000,
      income_band: 'under_12570',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 1500,
      postcode: 'S11 8YA',
    },
  },
}

const E3_PENSIONER_NO_POSTCODE_NO_COMPLETE: TestScenario = {
  id: 'E3',
  name: 'Pensioner + AA — should NOT complete without postcode',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    age: 82,
    employment_status: 'retired',
    income_band: 'under_12570',
    housing_tenure: 'own_outright',
  },
  existingSituations: ['ageing_parent'],
  userMessage: "I live alone. I need help with washing and cooking every day.",
  expected: {
    personData: {
      relationship_status: 'single',
      needs_help_with_daily_living: true,
    },
    // Should NOT transition to complete — postcode is missing
    textContains: ['postcode'],
  },
}

const E4_MULTI_TURN_COLLECT_FIELDS: TestScenario = {
  id: 'E4',
  name: 'Multi-turn: 3rd message collects remaining required field',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
    income_band: 'under_7400',
    housing_tenure: 'rent_private',
    monthly_housing_cost: 800,
  },
  existingSituations: ['lost_job'],
  previousMessages: [
    { role: 'user', content: "I've just been made redundant" },
    {
      role: 'assistant',
      content: "I'm sorry to hear that. Can you tell me about your housing situation?",
    },
    { role: 'user', content: "I'm renting privately, £800 a month" },
    {
      role: 'assistant',
      content: "Thank you. And what's your postcode so I can check local support?",
    },
  ],
  userMessage: "It's E1 6AN. I'm 35 and single.",
  expected: {
    personData: {
      postcode: 'E1 6AN',
      age: 35,
      relationship_status: 'single',
    },
    // With all required fields now collected, should transition to complete
    stageTransition: 'complete',
  },
}

const E5_CORRECTION_MID_CONVERSATION: TestScenario = {
  id: 'E5',
  name: 'User corrects housing tenure mid-conversation',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    income_band: 'under_7400',
    housing_tenure: 'mortgage',
    monthly_housing_cost: 1000,
  },
  existingSituations: ['lost_job'],
  previousMessages: [
    { role: 'user', content: "I lost my job. Mortgage is £1,000" },
    {
      role: 'assistant',
      content: "I'm sorry to hear that. What's your postcode?",
    },
  ],
  userMessage: "Actually sorry, I rent - I don't have a mortgage. It's £800 a month. Postcode is LS1 1BA.",
  expected: {
    personData: {
      housing_tenure: 'rent_private',
      monthly_housing_cost: 800,
      postcode: 'LS1 1BA',
    },
  },
}

const E6_ONE_QUESTION_PER_TURN: TestScenario = {
  id: 'E6',
  name: 'AI should ask only ONE question per turn',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
  },
  existingSituations: ['lost_job'],
  userMessage: "I've just lost my job last week. I don't know what to do.",
  expected: {
    stageTransition: 'questions',
    // Response should contain only one question — this is checked by textContains
    // We can't perfectly enforce one-question-per-turn via regex, but we check the response is reasonable
    textContains: ['?'],
  },
}

const E7_JOB_LOSS_SINGLE_INCOME_ZERO: TestScenario = {
  id: 'E7',
  name: 'Job loss + single should infer income = £0 without asking',
  category: 'E',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
    relationship_status: 'single',
  },
  existingSituations: ['lost_job'],
  userMessage:
    "I'm renting a council flat for £450 a month. Postcode is M1 1AD.",
  expected: {
    personData: {
      housing_tenure: 'rent_social',
      monthly_housing_cost: 450,
      postcode: 'M1 1AD',
      income_band: 'under_7400',
    },
    // Should recognise income is £0 for single unemployed without asking
  },
}

// ──────────────────────────────────────────────
// Category F: Edge Cases
// ──────────────────────────────────────────────

const F1_SEPARATION: TestScenario = {
  id: 'F1',
  name: 'Separation / divorce — now supported',
  category: 'F',
  stage: 'intake',
  userMessage: "I'm going through a divorce and I need to know what I'm entitled to",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'separated',
    },
  },
}

const F2_NO_INFO: TestScenario = {
  id: 'F2',
  name: 'Vague message — no extractable info',
  category: 'F',
  stage: 'intake',
  userMessage: 'I need help',
  expected: {
    noPersonData: true,
    noSituation: true,
  },
}

const F3_CONTRADICTORY: TestScenario = {
  id: 'F3',
  name: 'Contradictory info — correction',
  category: 'F',
  stage: 'questions',
  existingSituations: ['lost_job'],
  existingPersonData: { housing_tenure: 'rent_private' },
  previousMessages: [
    { role: 'user', content: "I've lost my job, I rent privately" },
    { role: 'assistant', content: "I'm sorry to hear that. What's your household situation?" },
  ],
  userMessage: "Actually sorry, we own our house outright, I got confused",
  expected: {
    personData: { housing_tenure: 'own_outright' },
  },
}

const F4_VERY_LONG: TestScenario = {
  id: 'F4',
  name: 'Very long detailed message',
  category: 'F',
  stage: 'intake',
  userMessage:
    "OK so here's my situation. My name is Sarah, I'm 42 years old. I live with my husband Dave in Leeds, LS1 4AP. We've got two children — Emily who's 11 and Jake who's 6. Jake has autism and he's really struggling at school, they've been talking about an EHCP assessment but nothing's happened yet. My mum lives nearby, she's 78 and she had a fall recently. She needs help getting dressed, cooking meals, and remembering her medication. I go over every day to help her, probably about 30 hours a week. On top of all that, Dave was made redundant from his factory job three weeks ago. I work part-time as a teaching assistant earning about £14,000 a year. We've got a mortgage, payments are £1,200 a month. We've got maybe £5,000 in savings. I just feel like we're drowning and I don't know what help is out there.",
  expected: {
    situations: ['ageing_parent', 'lost_job', 'child_struggling_school'],
    stageTransition: 'questions',
    personData: {
      age: 42,
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 14000,
      income_band: 'under_16000',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 1200,
      household_capital: 5000,
      postcode: 'LS1 4AP',
      is_carer: true,
      carer_hours_per_week: 30,
      recently_redundant: true,
      children: [
        { age: 11, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 6, has_additional_needs: true, disability_benefit: 'none', in_education: true },
      ],
      cared_for_person: {
        relationship: 'parent',
        age: 78,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
    },
  },
}

// ──────────────────────────────────────────────
// Category G: Health Condition / Disability
// ──────────────────────────────────────────────

const G1_MS_CANT_WORK: TestScenario = {
  id: 'G1',
  name: 'MS diagnosis, cannot work',
  category: 'G',
  stage: 'intake',
  userMessage: "I've been diagnosed with MS and I can't work anymore. I'm 38, single, renting privately.",
  expected: {
    stageTransition: 'questions',
    personData: {
      has_disability_or_health_condition: true,
      age: 38,
      relationship_status: 'single',
      housing_tenure: 'rent_private',
    },
  },
}

const G2_WHEELCHAIR_PIP: TestScenario = {
  id: 'G2',
  name: 'Wheelchair user, getting PIP enhanced mobility',
  category: 'G',
  stage: 'intake',
  userMessage: "I'm in a wheelchair and I'm getting PIP enhanced rate mobility. I need to know what else I might be entitled to.",
  expected: {
    stageTransition: 'questions',
    personData: {
      has_disability_or_health_condition: true,
      mobility_difficulty: true,
      disability_benefit_received: 'pip_mobility_enhanced',
    },
  },
}

const G3_DEPRESSION_HOUSEBOUND: TestScenario = {
  id: 'G3',
  name: 'Severe depression, struggling to leave the house',
  category: 'G',
  stage: 'intake',
  userMessage: "I have severe depression and I'm struggling to leave the house most days. I can't work and I need help with daily tasks.",
  expected: {
    stageTransition: 'questions',
    personData: {
      has_disability_or_health_condition: true,
      needs_help_with_daily_living: true,
    },
  },
}

const G4_PARTNER_DEMENTIA_CARER: TestScenario = {
  id: 'G4',
  name: 'Partner has early-onset dementia, full-time carer',
  category: 'G',
  stage: 'intake',
  userMessage: "My husband has early-onset dementia. I'm caring for him about 40 hours a week. I had to leave my job. We're both 56.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_carer: true,
      carer_hours_per_week: 40,
      relationship_status: 'couple_married',
      age: 56,
    },
  },
}

const G5_CHRONIC_PAIN_PART_TIME: TestScenario = {
  id: 'G5',
  name: 'Chronic pain, working part-time, struggles with daily tasks',
  category: 'G',
  stage: 'intake',
  userMessage: "I have chronic pain and fibromyalgia. I can work part-time but I struggle with daily tasks like cooking and cleaning. I earn about £10,000 a year.",
  expected: {
    stageTransition: 'questions',
    personData: {
      has_disability_or_health_condition: true,
      needs_help_with_daily_living: true,
      employment_status: 'employed',
      gross_annual_income: 10000,
      income_band: 'under_12570',
    },
  },
}

const G6_CHILD_CEREBRAL_PALSY: TestScenario = {
  id: 'G6',
  name: 'Child has cerebral palsy, parent cannot work',
  category: 'G',
  stage: 'intake',
  userMessage: "My 4 year old has cerebral palsy and needs constant care. I can't work because of his needs. My partner earns £18,000. We rent from the council.",
  expected: {
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 4, has_additional_needs: true, disability_benefit: 'none', in_education: true },
      ],
      is_carer: true,
      gross_annual_income: 18000,
      income_band: 'under_25000',
      housing_tenure: 'rent_social',
    },
  },
}

// ──────────────────────────────────────────────
// Category H: Bereavement
// ──────────────────────────────────────────────

const H1_HUSBAND_DIED_YOUNG_CHILDREN: TestScenario = {
  id: 'H1',
  name: 'Husband died, two young children',
  category: 'H',
  stage: 'intake',
  userMessage: "My husband died last month. I have two children aged 5 and 3. I don't know how I'm going to manage. I work part-time earning about £15,000.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_bereaved: true,
      deceased_relationship: 'partner',
      relationship_status: 'widowed',
      children: [
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
      employment_status: 'employed',
      gross_annual_income: 15000,
      income_band: 'under_16000',
    },
  },
}

const H2_WIDOWER_PENSION_AGE: TestScenario = {
  id: 'H2',
  name: 'Widower, 72, on state pension',
  category: 'H',
  stage: 'intake',
  userMessage: "I'm a widower, 72 years old. I'm just living on my state pension. My wife passed away six months ago.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_bereaved: true,
      deceased_relationship: 'partner',
      relationship_status: 'widowed',
      age: 72,
      employment_status: 'retired',
    },
  },
}

const H3_MUM_DIED_WAS_CARER: TestScenario = {
  id: 'H3',
  name: 'Mum passed away, was her carer',
  category: 'H',
  stage: 'intake',
  userMessage: "My mum passed away last week. I was her full-time carer for the last three years. I'm 45 and I don't have a job now.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_bereaved: true,
      deceased_relationship: 'parent',
      age: 45,
      employment_status: 'unemployed',
    },
  },
}

// ──────────────────────────────────────────────
// Category I: Separation / Relationship Breakdown
// ──────────────────────────────────────────────

const I1_DIVORCE_TWO_KIDS: TestScenario = {
  id: 'I1',
  name: 'Going through divorce, 2 kids, moving out',
  category: 'I',
  stage: 'intake',
  userMessage: "I'm going through a divorce. I have two kids aged 8 and 12. I'll be moving out and need to rent somewhere. I earn about £22,000.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'separated',
      children: [
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 12, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 22000,
      income_band: 'under_25000',
    },
  },
}

const I2_ABUSIVE_RELATIONSHIP: TestScenario = {
  id: 'I2',
  name: 'Left abusive relationship, no income, staying with family',
  category: 'I',
  stage: 'intake',
  userMessage: "I've left an abusive relationship. I have no income and I'm staying with my family for now. I have a 2 year old.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'separated',
      housing_tenure: 'living_with_family',
      children: [
        { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const I3_SEPARATED_JOINT_MORTGAGE: TestScenario = {
  id: 'I3',
  name: 'Separated, joint mortgage, minimum wage',
  category: 'I',
  stage: 'intake',
  userMessage: "I've separated from my husband. The mortgage is in both our names, £1100 a month. I'm on minimum wage, about £12,000 a year.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'separated',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 1100,
      gross_annual_income: 12000,
      income_band: 'under_12570',
    },
  },
}

// ──────────────────────────────────────────────
// Category J: Mixed / Novel Situations
// ──────────────────────────────────────────────

const J1_HOMELESS_ADDICTION: TestScenario = {
  id: 'J1',
  name: 'Homeless with drug addiction',
  category: 'J',
  stage: 'intake',
  userMessage: "I'm homeless and I have a drug addiction. I'm 32. I've got no income at all.",
  expected: {
    stageTransition: 'questions',
    personData: {
      housing_tenure: 'homeless',
      has_disability_or_health_condition: true,
      age: 32,
    },
  },
}

const J2_EARLY_RETIREMENT_SAVINGS_LOW: TestScenario = {
  id: 'J2',
  name: 'Retired early at 58, savings running out',
  category: 'J',
  stage: 'intake',
  userMessage: "I retired early at 58. My savings are running out and I'm not old enough for state pension yet. I own my house outright.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 58,
      employment_status: 'retired',
      housing_tenure: 'own_outright',
    },
  },
}

const J3_STUDENT_WITH_BABY: TestScenario = {
  id: 'J3',
  name: 'University student with a baby',
  category: 'J',
  stage: 'intake',
  userMessage: "I'm a university student and I've just had a baby. I'm 21, single, renting privately for £650 a month.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 21,
      relationship_status: 'single',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 650,
    },
  },
}

const J4_SELF_EMPLOYED_BUSINESS_FAILED: TestScenario = {
  id: 'J4',
  name: 'Self-employed, business failed, massive debts',
  category: 'J',
  stage: 'intake',
  userMessage: "I was self-employed but my business has failed. I've got massive debts and no income. I'm 40, married with one child aged 10. We rent privately for £900 a month.",
  expected: {
    stageTransition: 'questions',
    personData: {
      employment_status: 'unemployed',
      relationship_status: 'couple_married',
      age: 40,
      children: [
        { age: 10, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      housing_tenure: 'rent_private',
      monthly_housing_cost: 900,
    },
  },
}

// ──────────────────────────────────────────────
// Category K: NHS Health Costs
// ──────────────────────────────────────────────

const K1_PENSIONER_ON_PC: TestScenario = {
  id: 'K1',
  name: 'Pensioner on Pension Credit — free prescriptions, dental, sight tests cascade',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm 62, single, on Pension Credit. I pay for my prescriptions and dental — is there help?",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 62,
      relationship_status: 'single',
    },
  },
}

const K2_DIABETES_MODERATE_INCOME: TestScenario = {
  id: 'K2',
  name: 'Diabetes at moderate income — medical exemption for prescriptions + NHS LIS',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm 35, I have diabetes, earning £18,000 a year. I spend a fortune on prescriptions and dental.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 35,
      has_disability_or_health_condition: true,
      has_medical_exemption: true,
      gross_annual_income: 18000,
      income_band: 'under_25000',
    },
  },
}

const K3_PREGNANT_EARNING_30K: TestScenario = {
  id: 'K3',
  name: 'Pregnant, earning £30k — maternity exemption cert',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm pregnant with my first baby. I earn about £30,000. Do I get free prescriptions?",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_pregnant: true,
      expecting_first_child: true,
      gross_annual_income: 30000,
      income_band: 'under_50270',
    },
  },
}

const K4_LOTS_OF_PRESCRIPTIONS: TestScenario = {
  id: 'K4',
  name: 'No benefits but lots of prescriptions — PPC',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm 45, I earn £40k, no benefits. I'm on lots of medication — about 6 prescriptions a month. It's costing me a fortune.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 45,
      gross_annual_income: 40000,
      income_band: 'under_50270',
      has_medical_exemption: true,
    },
  },
}

const K5_UC_WITH_KIDS: TestScenario = {
  id: 'K5',
  name: 'On UC with two kids — free prescriptions, dental, sight tests cascade',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm on Universal Credit with two kids aged 8 and 3. I didn't know I could get free dental and eye tests.",
  expected: {
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const K6_JUST_ABOVE_PC_THRESHOLD: TestScenario = {
  id: 'K6',
  name: '70, just above Pension Credit threshold — NHS Low Income Scheme',
  category: 'K',
  stage: 'intake',
  userMessage: "I'm 70, I'm just above the Pension Credit threshold. My income is about £14,000 a year. I pay for everything — prescriptions, dental, glasses.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 70,
      gross_annual_income: 14000,
      income_band: 'under_16000',
    },
  },
}

// ──────────────────────────────────────────────
// Category L: Childcare & Education
// ──────────────────────────────────────────────

const L1_TWO_YEAR_OLD_ON_UC: TestScenario = {
  id: 'L1',
  name: '2 year old on UC — free 15hrs childcare',
  category: 'L',
  stage: 'intake',
  userMessage: "I have a 2 year old and I'm on Universal Credit. I didn't know there was free childcare for 2 year olds.",
  expected: {
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const L2_BOTH_WORKING_CHILD_1: TestScenario = {
  id: 'L2',
  name: 'Both parents working, child aged 1 — 30hrs + Tax-Free Childcare',
  category: 'L',
  stage: 'intake',
  userMessage: "We both work full-time. I earn £35,000 and my husband earns £30,000. Our daughter is 1 year old. Childcare is costing us a fortune.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'couple_married',
      employment_status: 'employed',
      gross_annual_income: 35000,
      income_band: 'under_50270',
      children: [
        { age: 1, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const L3_STUDENT_WITH_3YR_OLD: TestScenario = {
  id: 'L3',
  name: 'Student parent with 3 year old — childcare grant + 15hrs universal',
  category: 'L',
  stage: 'intake',
  userMessage: "I'm a full-time university student with a 3 year old. I'm single and struggling with childcare costs.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'single',
      children: [
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const L4_PREGNANT_FIRST_BABY_UC: TestScenario = {
  id: 'L4',
  name: 'Pregnant, first baby, on UC — Sure Start Maternity Grant',
  category: 'L',
  stage: 'intake',
  userMessage: "I'm pregnant with my first baby. I'm on Universal Credit earning about £8,000 a year part-time.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_pregnant: true,
      expecting_first_child: true,
      gross_annual_income: 8000,
      income_band: 'under_12570',
    },
  },
}

const L5_17YR_OLD_IN_COLLEGE: TestScenario = {
  id: 'L5',
  name: '17 year old in college, low income — 16-19 bursary',
  category: 'L',
  stage: 'intake',
  userMessage: "My 17 year old is in college doing A-levels. We're on a low income, about £15,000 a year. He needs money for transport and books.",
  expected: {
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 17, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 15000,
      income_band: 'under_16000',
    },
  },
}

// ──────────────────────────────────────────────
// Category M: Housing, Energy & Water
// ──────────────────────────────────────────────

const M1_PENSIONER_RENTING: TestScenario = {
  id: 'M1',
  name: '70, renting privately, pension only — Housing Benefit + Winter Fuel',
  category: 'M',
  stage: 'intake',
  userMessage: "I'm 70, living on my own. I rent privately for £650 a month. I'm just on my state pension.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 70,
      relationship_status: 'single',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 650,
      employment_status: 'retired',
    },
  },
}

const M2_UC_MORTGAGE_STRUGGLING: TestScenario = {
  id: 'M2',
  name: 'On UC for a year, struggling with mortgage — SMI',
  category: 'M',
  stage: 'intake',
  userMessage: "I've been on UC for a year now. I'm struggling to pay my mortgage — it's £1,000 a month. I earn about £8,000 part-time.",
  expected: {
    stageTransition: 'questions',
    personData: {
      housing_tenure: 'mortgage',
      monthly_housing_cost: 1000,
      months_on_uc: 12,
      gross_annual_income: 8000,
      income_band: 'under_12570',
    },
  },
}

const M3_UC_WATER_METER_4_KIDS: TestScenario = {
  id: 'M3',
  name: 'On UC, water meter, 4 kids — WaterSure',
  category: 'M',
  stage: 'intake',
  userMessage: "I'm on Universal Credit with 4 kids aged 1, 3, 5, and 8. We're on a water meter and the bills are massive.",
  expected: {
    stageTransition: 'questions',
    personData: {
      on_water_meter: true,
      children: [
        { age: 1, has_additional_needs: false, disability_benefit: 'none', in_education: false },
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    },
  },
}

const M4_PENSION_CREDIT_COLD_HOUSE: TestScenario = {
  id: 'M4',
  name: 'On Pension Credit, cold house, no insulation — Cold Weather + ECO4',
  category: 'M',
  stage: 'intake',
  userMessage: "I'm 75, on Pension Credit. My house is freezing — the walls have no insulation and the heating barely works.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 75,
      employment_status: 'retired',
    },
  },
}

// ──────────────────────────────────────────────
// Category N: Transport, Legal & Misc
// ──────────────────────────────────────────────

const N1_PIP_ENHANCED_MOBILITY_67: TestScenario = {
  id: 'N1',
  name: '67, PIP enhanced mobility — VED exemption + Motability + bus pass',
  category: 'N',
  stage: 'intake',
  userMessage: "I'm 67, getting PIP enhanced rate mobility. I'm struggling with transport costs. Do I get any help?",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 67,
      disability_benefit_received: 'pip_mobility_enhanced',
      has_disability_or_health_condition: true,
    },
  },
}

const N2_UC_COURT_CASE: TestScenario = {
  id: 'N2',
  name: 'On UC, housing tribunal — court fee remission',
  category: 'N',
  stage: 'intake',
  userMessage: "I'm on UC, earning about £10,000 a year. I need to go to a housing tribunal about my landlord. I can't afford the fees.",
  expected: {
    stageTransition: 'questions',
    personData: {
      gross_annual_income: 10000,
      income_band: 'under_12570',
    },
  },
}

const N3_MUM_DIED_FUNERAL: TestScenario = {
  id: 'N3',
  name: 'Mum died, on UC, need funeral help — Funeral Expenses Payment',
  category: 'N',
  stage: 'intake',
  userMessage: "My mum died last week. I'm on Universal Credit and I need to pay for the funeral. I don't have any savings.",
  expected: {
    stageTransition: 'questions',
    personData: {
      is_bereaved: true,
      deceased_relationship: 'parent',
    },
  },
}

// ──────────────────────────────────────────────
// Category O: Nation-Specific Scenarios
// ──────────────────────────────────────────────

const O1_WELSH_PENSIONER_PRESCRIPTIONS: TestScenario = {
  id: 'O1',
  name: 'Welsh pensioner — free prescriptions for all (no age limit in Wales)',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 55, living in Cardiff CF10 1EP. I earn £25,000 and pay for prescriptions every month. Is there any help?",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 55,
      gross_annual_income: 25000,
      income_band: 'under_25000',
      postcode: 'CF10 1EP',
    },
  },
}

const O2_SCOTTISH_FAMILY_LOW_INCOME: TestScenario = {
  id: 'O2',
  name: 'Scottish family, low income — Scottish Child Payment + Best Start',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 28, I have two kids aged 4 and 2. I'm on Universal Credit, earning about £8,000 part-time. We live in Edinburgh EH1 1YZ.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 28,
      children: [
        { age: 4, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
      gross_annual_income: 8000,
      income_band: 'under_12570',
      postcode: 'EH1 1YZ',
    },
  },
}

const O3_WELSH_LOW_INCOME_FAMILY: TestScenario = {
  id: 'O3',
  name: 'Welsh low-income family — PDG + school essentials grant',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 35, single mum with a 6 year old in primary school. I'm on Universal Credit, earning £7,000 a year. We rent from the council in Swansea SA1 1NW.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 35,
      relationship_status: 'single',
      children: [
        { age: 6, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 7000,
      income_band: 'under_7400',
      housing_tenure: 'rent_social',
      postcode: 'SA1 1NW',
    },
  },
}

const O4_SCOTTISH_YOUNG_CARER: TestScenario = {
  id: 'O4',
  name: 'Scottish young carer — Young Carer Grant',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 17 and I look after my mum who has MS. I spend about 20 hours a week caring for her. I'm still at school in Glasgow G1 1XQ.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 17,
      is_carer: true,
      carer_hours_per_week: 20,
      postcode: 'G1 1XQ',
    },
  },
}

const O5_QUALITATIVE_AGE_OLD: TestScenario = {
  id: 'O5',
  name: 'Qualitative age "I\'m old" — extracts approximate age + retired',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm old and struggling to manage on my own. I need help with daily tasks.",
  expected: {
    stageTransition: 'questions',
    personData: {
      needs_help_with_daily_living: true,
    },
  },
}

const O6_SCOTTISH_PENSIONER_CARE: TestScenario = {
  id: 'O6',
  name: 'Scottish pensioner needing care — Pension Age Disability Payment',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 80, retired, living alone in Aberdeen AB10 1AQ. I need help with washing, dressing and cooking. My income is about £10,000 from my pension.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 80,
      employment_status: 'retired',
      relationship_status: 'single',
      needs_help_with_daily_living: true,
      gross_annual_income: 10000,
      income_band: 'under_12570',
      postcode: 'AB10 1AQ',
    },
  },
}

const O7_WELSH_EMERGENCY_HARDSHIP: TestScenario = {
  id: 'O7',
  name: 'Welsh resident in financial crisis — Discretionary Assistance Fund',
  category: 'O',
  stage: 'intake',
  userMessage: "I've just lost my job, I'm 40, single, and I can't pay my rent this month. I'm in Newport NP20 1PL, renting privately for £650.",
  expected: {
    situations: ['lost_job'],
    stageTransition: 'questions',
    personData: {
      age: 40,
      employment_status: 'unemployed',
      recently_redundant: true,
      relationship_status: 'single',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 650,
      postcode: 'NP20 1PL',
    },
  },
}

const O8_SCOTTISH_PREGNANT_FIRST_BABY: TestScenario = {
  id: 'O8',
  name: 'Scottish pregnant woman — Best Start Grant pregnancy payment',
  category: 'O',
  stage: 'intake',
  userMessage: "I'm 26, pregnant with my first baby. I'm on Universal Credit. We live in Dundee DD1 1DB, renting privately.",
  expected: {
    situations: ['new_baby'],
    stageTransition: 'questions',
    personData: {
      age: 26,
      is_pregnant: true,
      expecting_first_child: true,
      postcode: 'DD1 1DB',
      housing_tenure: 'rent_private',
    },
  },
}

// ──────────────────────────────────────────────
// Category P: Colloquial British English
// ──────────────────────────────────────────────

const P1_ME_MUM: TestScenario = {
  id: 'P1',
  name: 'Colloquial: "me mum can\'t cope"',
  category: 'P',
  stage: 'intake',
  userMessage: "Me mum can't cope on her own anymore, she's 81 and needs help with everything",
  expected: {
    situations: ['ageing_parent'],
    stageTransition: 'questions',
    personData: {
      cared_for_person: {
        relationship: 'parent',
        age: 81,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
    },
  },
}

const P2_ON_THE_DOLE: TestScenario = {
  id: 'P2',
  name: 'Colloquial: "on the dole, skint"',
  category: 'P',
  stage: 'intake',
  userMessage: "I'm 34, on the dole, absolutely skint. Not a penny to me name. Renting a council gaff for 450 quid a month.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 34,
      employment_status: 'unemployed',
      housing_tenure: 'rent_social',
      monthly_housing_cost: 450,
    },
  },
}

const P3_MISSUS_WORKS: TestScenario = {
  id: 'P3',
  name: 'Colloquial: "missus works at Asda"',
  category: 'P',
  stage: 'intake',
  userMessage: "I got made redundant last week. The missus works part-time at Asda, about 12 grand a year. We've got two little ones, 5 and 3.",
  expected: {
    situations: ['lost_job'],
    stageTransition: 'questions',
    personData: {
      employment_status: 'unemployed',
      recently_redundant: true,
      relationship_status: 'couple_married',
      gross_annual_income: 12000,
      income_band: 'under_12570',
      children: [
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const P4_OUR_KID: TestScenario = {
  id: 'P4',
  name: 'Colloquial: "our kid\'s got ADHD"',
  category: 'P',
  stage: 'intake',
  userMessage: "Our kid's got ADHD and the school can't deal with him. He's 8. We're on about 15 grand between us.",
  expected: {
    situations: ['child_struggling_school'],
    stageTransition: 'questions',
    personData: {
      children: [
        { age: 8, has_additional_needs: true, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 15000,
      income_band: 'under_16000',
    },
  },
}

const P5_QUID_DOSH: TestScenario = {
  id: 'P5',
  name: 'Colloquial: "500 quid a month rent"',
  category: 'P',
  stage: 'questions',
  existingPersonData: {
    employment_status: 'unemployed',
    recently_redundant: true,
    income_band: 'under_7400',
  },
  existingSituations: ['lost_job'],
  previousMessages: [
    { role: 'user', content: "Lost me job innit" },
    { role: 'assistant', content: "I'm sorry to hear that. Let's see what support might be available. What's your housing situation?" },
  ],
  userMessage: "Renting privately, 500 quid a month. Postcode's BD1 1HU. I'm 29.",
  expected: {
    personData: {
      housing_tenure: 'rent_private',
      monthly_housing_cost: 500,
      postcode: 'BD1 1HU',
      age: 29,
    },
  },
}

// ──────────────────────────────────────────────
// Category Q: Vague / Ambiguous Input
// ──────────────────────────────────────────────

const Q1_STRUGGLING: TestScenario = {
  id: 'Q1',
  name: 'Vague: "struggling to get by"',
  category: 'Q',
  stage: 'intake',
  userMessage: "I'm really struggling to get by. Things have been really hard since I lost my job.",
  expected: {
    situations: ['lost_job'],
    stageTransition: 'questions',
    personData: {
      employment_status: 'unemployed',
    },
  },
}

const Q2_CANT_MANAGE: TestScenario = {
  id: 'Q2',
  name: 'Vague: "I can\'t manage anymore" — health context',
  category: 'Q',
  stage: 'intake',
  userMessage: "I can't manage anymore. I'm 78 and everything is getting harder. I need help with cooking and washing.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 78,
      needs_help_with_daily_living: true,
    },
  },
}

const Q3_COMPLICATED_SEPARATION: TestScenario = {
  id: 'Q3',
  name: 'Vague: "it\'s complicated — separated but living together"',
  category: 'Q',
  stage: 'intake',
  userMessage: "It's complicated — we've separated but we're still living in the same house because neither of us can afford to move out. I've got two kids aged 6 and 9.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'separated',
      children: [
        { age: 6, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 9, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    },
  },
}

const Q4_JUST_ABOUT_MANAGING: TestScenario = {
  id: 'Q4',
  name: 'Vague: "just about managing on what we\'ve got"',
  category: 'Q',
  stage: 'questions',
  existingSituations: ['new_baby'],
  existingPersonData: {
    is_pregnant: true,
    expecting_first_child: true,
    relationship_status: 'couple_married',
  },
  previousMessages: [
    { role: 'user', content: "We're expecting our first baby" },
    { role: 'assistant', content: "Congratulations! What's your household income roughly?" },
  ],
  userMessage: "We're just about managing on what we've got. My husband earns about 20 grand and I work part-time, maybe 8 thousand.",
  expected: {
    personData: {
      gross_annual_income: 20000,
      income_band: 'under_25000',
    },
  },
}

const Q5_EVERYTHING_AT_ONCE: TestScenario = {
  id: 'Q5',
  name: 'Vague: "everything is going wrong at once"',
  category: 'Q',
  stage: 'intake',
  userMessage: "Everything's going wrong at once. My dad's ill, I've been sacked, and my wife's pregnant. I'm 38.",
  expected: {
    situations: ['ageing_parent', 'lost_job', 'new_baby'],
    stageTransition: 'questions',
    personData: {
      age: 38,
      employment_status: 'unemployed',
      is_pregnant: true,
      relationship_status: 'couple_married',
    },
  },
}

// ──────────────────────────────────────────────
// Category R: Complex Financial Situations
// ──────────────────────────────────────────────

const R1_PENSION_COMPONENTS: TestScenario = {
  id: 'R1',
  name: 'Complex financial: state pension + small works pension',
  category: 'R',
  stage: 'intake',
  userMessage: "I'm 72, retired. I get about £11,000 from my state pension and another £3,000 from a small works pension. So about £14,000 altogether. I own my house.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 72,
      employment_status: 'retired',
      gross_annual_income: 14000,
      income_band: 'under_16000',
      housing_tenure: 'own_outright',
    },
  },
}

const R2_ZERO_HOURS: TestScenario = {
  id: 'R2',
  name: 'Complex financial: zero hours contract',
  category: 'R',
  stage: 'intake',
  userMessage: "I'm 25, on a zero hours contract. Some weeks I get 30 hours, some weeks nothing. Maybe £8,000 to £10,000 a year if I'm lucky. I'm single, renting privately.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 25,
      employment_status: 'employed',
      relationship_status: 'single',
      housing_tenure: 'rent_private',
    },
  },
}

const R3_MONTHLY_UC: TestScenario = {
  id: 'R3',
  name: 'Complex financial: "about £400 a month UC"',
  category: 'R',
  stage: 'intake',
  userMessage: "I'm 33, single mum with a 4 year old. I get about £400 a month from Universal Credit. Renting from the council, £520 a month. B15 1AA.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 33,
      relationship_status: 'single',
      children: [
        { age: 4, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      housing_tenure: 'rent_social',
      monthly_housing_cost: 520,
      postcode: 'B15 1AA',
    },
  },
}

const R4_REDUNDANCY_PAYOUT: TestScenario = {
  id: 'R4',
  name: 'Complex financial: redundancy payout but no income',
  category: 'R',
  stage: 'intake',
  userMessage: "I was made redundant. Got a £20,000 redundancy payout but no job now. I'm 45, married, mortgage of £1,100 a month.",
  expected: {
    situations: ['lost_job'],
    stageTransition: 'questions',
    personData: {
      age: 45,
      employment_status: 'unemployed',
      recently_redundant: true,
      relationship_status: 'couple_married',
      household_capital: 20000,
      housing_tenure: 'mortgage',
      monthly_housing_cost: 1100,
    },
  },
}

const R5_SELF_EMPLOYED_VARIABLE: TestScenario = {
  id: 'R5',
  name: 'Complex financial: "self-employed, income varies wildly"',
  category: 'R',
  stage: 'intake',
  userMessage: "I'm self-employed, 41. Income varies wildly — some months I earn £2,000, others barely £200. Maybe £15,000 on a good year. Wife doesn't work, two kids aged 7 and 4.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 41,
      employment_status: 'self_employed',
      relationship_status: 'couple_married',
      gross_annual_income: 15000,
      income_band: 'under_16000',
      children: [
        { age: 7, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 4, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    },
  },
}

// ──────────────────────────────────────────────
// Category S: Complex Family / Housing
// ──────────────────────────────────────────────

const S1_SOFA_SURFING: TestScenario = {
  id: 'S1',
  name: 'Complex housing: "sofa surfing since I left my ex"',
  category: 'S',
  stage: 'intake',
  userMessage: "I'm 29, I left my ex last month and I've been sofa surfing at friends' places. I have a 3 year old with me. No income at the moment.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 29,
      relationship_status: 'separated',
      children: [
        { age: 3, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
    },
  },
}

const S2_BOYFRIEND_MOVED_IN: TestScenario = {
  id: 'S2',
  name: 'Complex family: "boyfriend just moved in"',
  category: 'S',
  stage: 'intake',
  userMessage: "My boyfriend just moved in with me last month. I'm 31, I earn about £16,000. He's looking for work. I have a 5 year old from a previous relationship.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 31,
      relationship_status: 'couple_cohabiting',
      gross_annual_income: 16000,
      income_band: 'under_16000',
      children: [
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    },
  },
}

const S3_MULTIGENERATIONAL: TestScenario = {
  id: 'S3',
  name: 'Complex family: adult daughter moved back with her baby',
  category: 'S',
  stage: 'intake',
  userMessage: "I'm 55, my adult daughter's moved back home with her baby. She's got no job and no money. I earn about £30,000. We own the house outright.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 55,
      gross_annual_income: 30000,
      income_band: 'under_50270',
      housing_tenure: 'own_outright',
    },
  },
}

const S4_SHARED_CUSTODY: TestScenario = {
  id: 'S4',
  name: 'Complex family: "kids are with me half the week"',
  category: 'S',
  stage: 'intake',
  userMessage: "I'm separated, 38. My two kids aged 10 and 7 are with me half the week. I earn £22,000, renting privately for £750 a month. E1 6AN.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 38,
      relationship_status: 'separated',
      children: [
        { age: 10, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 7, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 22000,
      income_band: 'under_25000',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 750,
      postcode: 'E1 6AN',
    },
  },
}

const S5_SHARED_OWNERSHIP: TestScenario = {
  id: 'S5',
  name: 'Complex housing: "shared ownership, mortgage on our half"',
  category: 'S',
  stage: 'intake',
  userMessage: "We've got a shared ownership flat — we own half and pay rent on the other half plus our mortgage. It's about £900 a month total. I'm 35, my partner earns £28,000.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 35,
      relationship_status: 'couple_cohabiting',
      monthly_housing_cost: 900,
      gross_annual_income: 28000,
      income_band: 'under_50270',
    },
  },
}

// ──────────────────────────────────────────────
// Category T: Medical / Disability Nuance
// ──────────────────────────────────────────────

const T1_WAITING_ASSESSMENT: TestScenario = {
  id: 'T1',
  name: 'Medical: "waiting for autism assessment for my 6 year old"',
  category: 'T',
  stage: 'intake',
  userMessage: "My 6 year old is waiting for an autism assessment. The school says he needs one-to-one support. I'm a single mum earning about £14,000.",
  expected: {
    situations: ['child_struggling_school'],
    stageTransition: 'questions',
    personData: {
      relationship_status: 'single',
      children: [
        { age: 6, has_additional_needs: true, disability_benefit: 'none', in_education: true },
      ],
      gross_annual_income: 14000,
      income_band: 'under_16000',
    },
  },
}

const T2_CANCER_REMISSION: TestScenario = {
  id: 'T2',
  name: 'Medical: "cancer in remission but still can\'t work"',
  category: 'T',
  stage: 'intake',
  userMessage: "I had cancer and it's in remission now, but I still can't work. I'm 52, single. I've used up most of my savings. Renting privately for £700.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 52,
      has_disability_or_health_condition: true,
      relationship_status: 'single',
      housing_tenure: 'rent_private',
      monthly_housing_cost: 700,
    },
  },
}

const T3_LONG_COVID: TestScenario = {
  id: 'T3',
  name: 'Medical: "long COVID, off work 18 months"',
  category: 'T',
  stage: 'intake',
  userMessage: "I've had long COVID for about 18 months. I can barely get out of bed most days. I'm 39, was earning £35,000 but haven't worked since. My wife earns £20,000.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 39,
      has_disability_or_health_condition: true,
      needs_help_with_daily_living: true,
      relationship_status: 'couple_married',
      gross_annual_income: 20000,
      income_band: 'under_25000',
    },
  },
}

const T4_MENTAL_HEALTH_NO_DIAGNOSIS: TestScenario = {
  id: 'T4',
  name: 'Medical: "mental health is really bad, can barely leave the house"',
  category: 'T',
  stage: 'intake',
  userMessage: "My mental health is really bad. I can barely leave the house most days. I've not been able to work for months. I'm 27, living with my parents.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 27,
      has_disability_or_health_condition: true,
      needs_help_with_daily_living: true,
      housing_tenure: 'living_with_family',
    },
  },
}

const T5_VETERAN_PTSD: TestScenario = {
  id: 'T5',
  name: 'Medical: "war veteran with PTSD and mobility issues"',
  category: 'T',
  stage: 'intake',
  userMessage: "I'm a war veteran, 48. I have PTSD and mobility issues from my time in service. I can't work. My wife earns about £15,000. We rent privately.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 48,
      has_disability_or_health_condition: true,
      mobility_difficulty: true,
      relationship_status: 'couple_married',
      gross_annual_income: 15000,
      income_band: 'under_16000',
      housing_tenure: 'rent_private',
    },
  },
}

// ──────────────────────────────────────────────
// Category U: Welsh / Scottish Dialect Context
// ──────────────────────────────────────────────

const U1_WELSH_VALLEYS: TestScenario = {
  id: 'U1',
  name: 'Welsh dialect: "live in the valleys, Merthyr"',
  category: 'U',
  stage: 'intake',
  userMessage: "We live in the valleys, Merthyr Tydfil CF47 8EE. I'm 42, my mam's poorly and I look after her most days. I had to give up work.",
  expected: {
    situations: ['ageing_parent'],
    stageTransition: 'questions',
    personData: {
      age: 42,
      is_carer: true,
      employment_status: 'unemployed',
      postcode: 'CF47 8EE',
    },
  },
}

const U2_SCOTTISH_BAIRN: TestScenario = {
  id: 'U2',
  name: 'Scottish dialect: "bairn\'s just started school"',
  category: 'U',
  stage: 'intake',
  userMessage: "Aye, our bairn's just started school, he's 5. I'm 30, working part-time at Tesco earning about 10 grand. We rent from the council in Glasgow G1 1XQ.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 30,
      children: [
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
      employment_status: 'employed',
      gross_annual_income: 10000,
      income_band: 'under_12570',
      housing_tenure: 'rent_social',
      postcode: 'G1 1XQ',
    },
  },
}

const U3_SCOTTISH_ON_THE_SICK: TestScenario = {
  id: 'U3',
  name: 'Scottish dialect: "partner\'s on the sick, we\'re in Dundee"',
  category: 'U',
  stage: 'intake',
  userMessage: "My partner's on the sick with his back, cannae work. I earn about £12,000 part-time. We've got a wee one aged 2. We're in Dundee DD1 1DB, renting privately.",
  expected: {
    stageTransition: 'questions',
    personData: {
      relationship_status: 'couple_cohabiting',
      has_disability_or_health_condition: true,
      gross_annual_income: 12000,
      income_band: 'under_12570',
      children: [
        { age: 2, has_additional_needs: false, disability_benefit: 'none', in_education: false },
      ],
      housing_tenure: 'rent_private',
      postcode: 'DD1 1DB',
    },
  },
}

const U4_WELSH_MAM: TestScenario = {
  id: 'U4',
  name: 'Welsh dialect: "my mam needs help, she\'s in Swansea"',
  category: 'U',
  stage: 'intake',
  userMessage: "My mam needs help, she's 83 and can't do anything for herself anymore. I'm 55, living with her in Swansea SA1 1NW. She owns the house.",
  expected: {
    situations: ['ageing_parent'],
    stageTransition: 'questions',
    personData: {
      age: 55,
      is_carer: true,
      cared_for_person: {
        relationship: 'parent',
        age: 83,
        disability_benefit: 'none',
        needs_help_daily_living: true,
      },
      postcode: 'SA1 1NW',
      housing_tenure: 'own_outright',
    },
  },
}

const U5_SCOTTISH_RETIRED: TestScenario = {
  id: 'U5',
  name: 'Scottish dialect: "aye I\'m retired, Inverness"',
  category: 'U',
  stage: 'intake',
  userMessage: "Aye, I'm retired now. I'm 71, living on my own in Inverness IV1 1AA. Just my state pension, about £11,500 a year. I own my wee house.",
  expected: {
    stageTransition: 'questions',
    personData: {
      age: 71,
      employment_status: 'retired',
      relationship_status: 'single',
      gross_annual_income: 11500,
      income_band: 'under_12570',
      housing_tenure: 'own_outright',
      postcode: 'IV1 1AA',
    },
  },
}

// ──────────────────────────────────────────────
// Export all scenarios
// ──────────────────────────────────────────────

export const ALL_SCENARIOS: TestScenario[] = [
  // Category A: Intake Extraction
  A1_COMPLEX_MULTI,
  A2_NEW_BABY_SIMPLE,
  A3_AGEING_PARENT_MINIMAL,
  A4_LOST_JOB_DETAILED,
  A5_CHILD_STRUGGLING,
  A6_TWO_SITUATIONS,
  // Category B: Income Band Mapping
  B1_TWELVE_GRAND,
  B2_25K,
  B3_45K,
  B4_MIN_WAGE,
  B5_JSA,
  // Category C: Implicit Inference
  C1_WIFE,
  C2_MORTGAGE,
  C3_REDUNDANT,
  C4_PARTNER,
  C5_COUNCIL_RENT,
  C6_LIVING_WITH_PARENTS,
  // Category D: Multi-turn
  D1_AGEING_PARENT_TURN1,
  D1_AGEING_PARENT_TURN2,
  D1_AGEING_PARENT_TURN3,
  D2_NEW_BABY_TURN1,
  D2_NEW_BABY_TURN2,
  // Category E: Pipeline / Data Quality
  E1_JOB_LOSS_MORTGAGE_INCOME,
  E2_JOB_LOSS_COUPLE_PARTNER_INCOME,
  E3_PENSIONER_NO_POSTCODE_NO_COMPLETE,
  E4_MULTI_TURN_COLLECT_FIELDS,
  E5_CORRECTION_MID_CONVERSATION,
  E6_ONE_QUESTION_PER_TURN,
  E7_JOB_LOSS_SINGLE_INCOME_ZERO,
  // Category F: Edge Cases
  F1_SEPARATION,
  F2_NO_INFO,
  F3_CONTRADICTORY,
  F4_VERY_LONG,
  // Category G: Health Condition / Disability
  G1_MS_CANT_WORK,
  G2_WHEELCHAIR_PIP,
  G3_DEPRESSION_HOUSEBOUND,
  G4_PARTNER_DEMENTIA_CARER,
  G5_CHRONIC_PAIN_PART_TIME,
  G6_CHILD_CEREBRAL_PALSY,
  // Category H: Bereavement
  H1_HUSBAND_DIED_YOUNG_CHILDREN,
  H2_WIDOWER_PENSION_AGE,
  H3_MUM_DIED_WAS_CARER,
  // Category I: Separation / Relationship Breakdown
  I1_DIVORCE_TWO_KIDS,
  I2_ABUSIVE_RELATIONSHIP,
  I3_SEPARATED_JOINT_MORTGAGE,
  // Category J: Mixed / Novel Situations
  J1_HOMELESS_ADDICTION,
  J2_EARLY_RETIREMENT_SAVINGS_LOW,
  J3_STUDENT_WITH_BABY,
  J4_SELF_EMPLOYED_BUSINESS_FAILED,
  // Category K: NHS Health Costs
  K1_PENSIONER_ON_PC,
  K2_DIABETES_MODERATE_INCOME,
  K3_PREGNANT_EARNING_30K,
  K4_LOTS_OF_PRESCRIPTIONS,
  K5_UC_WITH_KIDS,
  K6_JUST_ABOVE_PC_THRESHOLD,
  // Category L: Childcare & Education
  L1_TWO_YEAR_OLD_ON_UC,
  L2_BOTH_WORKING_CHILD_1,
  L3_STUDENT_WITH_3YR_OLD,
  L4_PREGNANT_FIRST_BABY_UC,
  L5_17YR_OLD_IN_COLLEGE,
  // Category M: Housing, Energy & Water
  M1_PENSIONER_RENTING,
  M2_UC_MORTGAGE_STRUGGLING,
  M3_UC_WATER_METER_4_KIDS,
  M4_PENSION_CREDIT_COLD_HOUSE,
  // Category N: Transport, Legal & Misc
  N1_PIP_ENHANCED_MOBILITY_67,
  N2_UC_COURT_CASE,
  N3_MUM_DIED_FUNERAL,
  // Category O: Nation-Specific
  O1_WELSH_PENSIONER_PRESCRIPTIONS,
  O2_SCOTTISH_FAMILY_LOW_INCOME,
  O3_WELSH_LOW_INCOME_FAMILY,
  O4_SCOTTISH_YOUNG_CARER,
  O5_QUALITATIVE_AGE_OLD,
  O6_SCOTTISH_PENSIONER_CARE,
  O7_WELSH_EMERGENCY_HARDSHIP,
  O8_SCOTTISH_PREGNANT_FIRST_BABY,
  // Category P: Colloquial British English
  P1_ME_MUM,
  P2_ON_THE_DOLE,
  P3_MISSUS_WORKS,
  P4_OUR_KID,
  P5_QUID_DOSH,
  // Category Q: Vague / Ambiguous
  Q1_STRUGGLING,
  Q2_CANT_MANAGE,
  Q3_COMPLICATED_SEPARATION,
  Q4_JUST_ABOUT_MANAGING,
  Q5_EVERYTHING_AT_ONCE,
  // Category R: Complex Financial
  R1_PENSION_COMPONENTS,
  R2_ZERO_HOURS,
  R3_MONTHLY_UC,
  R4_REDUNDANCY_PAYOUT,
  R5_SELF_EMPLOYED_VARIABLE,
  // Category S: Complex Family / Housing
  S1_SOFA_SURFING,
  S2_BOYFRIEND_MOVED_IN,
  S3_MULTIGENERATIONAL,
  S4_SHARED_CUSTODY,
  S5_SHARED_OWNERSHIP,
  // Category T: Medical / Disability Nuance
  T1_WAITING_ASSESSMENT,
  T2_CANCER_REMISSION,
  T3_LONG_COVID,
  T4_MENTAL_HEALTH_NO_DIAGNOSIS,
  T5_VETERAN_PTSD,
  // Category U: Welsh / Scottish Dialect
  U1_WELSH_VALLEYS,
  U2_SCOTTISH_BAIRN,
  U3_SCOTTISH_ON_THE_SICK,
  U4_WELSH_MAM,
  U5_SCOTTISH_RETIRED,
]
