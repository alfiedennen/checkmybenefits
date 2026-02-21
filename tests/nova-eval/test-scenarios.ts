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
  category: 'A' | 'B' | 'C' | 'D' | 'F'
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
// Category F: Edge Cases
// ──────────────────────────────────────────────

const F1_OUT_OF_SCOPE: TestScenario = {
  id: 'F1',
  name: 'Out-of-scope situation (divorce)',
  category: 'F',
  stage: 'intake',
  userMessage: "I'm going through a divorce and I need to know what I'm entitled to",
  expected: {
    noSituation: true,
    textContains: ['citizens advice', '0800 144 8848'],
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
  // Category F: Edge Cases
  F1_OUT_OF_SCOPE,
  F2_NO_INFO,
  F3_CONTRADICTORY,
  F4_VERY_LONG,
]
