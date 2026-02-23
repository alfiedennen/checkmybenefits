import type { AIResponse } from '../../src/services/ai.ts'
import type { PersonData, ChildData, CaredForPerson } from '../../src/types/person.ts'
import type { SituationId } from '../../src/types/conversation.ts'
import type { ExpectedOutput } from './test-scenarios.ts'

export interface FieldScore {
  field: string
  expected: unknown
  actual: unknown
  score: number
  note: string
}

export interface ScenarioScore {
  scenarioId: string
  scenarioName: string
  xmlValid: boolean
  situationScore: number
  fieldScores: FieldScore[]
  fieldAverage: number
  stageCorrect: boolean
  hasConversationalText: boolean
  textContainsPass: boolean
  overallScore: number
  pass: boolean
}

const INCOME_BANDS_ORDERED = [
  'under_7400',
  'under_12570',
  'under_16000',
  'under_25000',
  'under_50270',
  'under_60000',
  'under_100000',
  'under_125140',
  'over_125140',
]

export function scoreScenario(
  scenarioId: string,
  scenarioName: string,
  expected: ExpectedOutput,
  parsed: AIResponse | null,
  parseError: boolean,
): ScenarioScore {
  const xmlValid = !parseError && parsed !== null
  let situationScore = 1.0
  const fieldScores: FieldScore[] = []
  let stageCorrect = true
  let hasConversationalText = true
  let textContainsPass = true

  if (!xmlValid || !parsed) {
    return {
      scenarioId,
      scenarioName,
      xmlValid: false,
      situationScore: 0,
      fieldScores: [],
      fieldAverage: 0,
      stageCorrect: false,
      hasConversationalText: false,
      textContainsPass: false,
      overallScore: 0,
      pass: false,
    }
  }

  // 1. Situation matching
  if (expected.situations) {
    situationScore = scoreSituations(expected.situations, parsed.situations ?? [])
  } else if (expected.noSituation) {
    situationScore = (!parsed.situations || parsed.situations.length === 0) ? 1.0 : 0.0
  }

  // 2. PersonData field scoring
  if (expected.personData) {
    scorePersonData(expected.personData, parsed.personData ?? {}, fieldScores)
  } else if (expected.noPersonData) {
    if (parsed.personData && Object.keys(parsed.personData).length > 0) {
      fieldScores.push({
        field: '_no_person_data',
        expected: 'none',
        actual: JSON.stringify(parsed.personData),
        score: 0,
        note: 'Expected no person data but got some',
      })
    }
  }

  // 3. Stage transition
  if (expected.stageTransition) {
    stageCorrect = parsed.stageTransition === expected.stageTransition
  }

  // 4. Conversational text
  hasConversationalText = parsed.text.trim().length > 10

  // 5. Text contains check
  if (expected.textContains) {
    const lowerText = parsed.text.toLowerCase()
    textContainsPass = expected.textContains.every((sub) =>
      lowerText.includes(sub.toLowerCase()),
    )
  }

  // Calculate field average
  const fieldAverage =
    fieldScores.length > 0
      ? fieldScores.reduce((sum, f) => sum + f.score, 0) / fieldScores.length
      : 1.0

  // Weighted overall score
  const weights = {
    xml: 0.2,
    situation: 0.2,
    fields: 0.3,
    stage: 0.1,
    text: 0.1,
    textContains: 0.1,
  }

  const overallScore =
    (xmlValid ? 1 : 0) * weights.xml +
    situationScore * weights.situation +
    fieldAverage * weights.fields +
    (stageCorrect ? 1 : 0) * weights.stage +
    (hasConversationalText ? 1 : 0) * weights.text +
    (textContainsPass ? 1 : 0) * weights.textContains

  return {
    scenarioId,
    scenarioName,
    xmlValid,
    situationScore,
    fieldScores,
    fieldAverage,
    stageCorrect,
    hasConversationalText,
    textContainsPass,
    overallScore,
    pass: overallScore >= 0.6,
  }
}

function scoreSituations(expected: SituationId[], actual: SituationId[]): number {
  if (expected.length === 0) return actual.length === 0 ? 1.0 : 0.5

  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)

  let matches = 0
  for (const s of expectedSet) {
    if (actualSet.has(s)) matches++
  }

  // Penalize extra situations
  const extras = actual.filter((s) => !expectedSet.has(s)).length
  const penalty = extras * 0.15

  return Math.max(0, matches / expectedSet.size - penalty)
}

function scorePersonData(
  expected: Partial<PersonData>,
  actual: Partial<PersonData>,
  scores: FieldScore[],
) {
  for (const [key, expectedVal] of Object.entries(expected)) {
    if (expectedVal === undefined) continue

    if (key === 'children') {
      scoreChildren(expectedVal as ChildData[], actual.children ?? [], scores)
      continue
    }

    if (key === 'cared_for_person') {
      scoreCaredFor(expectedVal as CaredForPerson, actual.cared_for_person, scores)
      continue
    }

    const actualVal = (actual as Record<string, unknown>)[key]
    scores.push(scoreField(key, expectedVal, actualVal))
  }
}

function scoreField(field: string, expected: unknown, actual: unknown): FieldScore {
  // Missing
  if (actual === undefined || actual === null) {
    return { field, expected, actual, score: 0.3, note: 'Missing' }
  }

  // Exact match
  if (expected === actual) {
    return { field, expected, actual, score: 1.0, note: 'Exact' }
  }

  // Income band — off by one
  if (field === 'income_band') {
    const ei = INCOME_BANDS_ORDERED.indexOf(expected as string)
    const ai = INCOME_BANDS_ORDERED.indexOf(actual as string)
    if (ei >= 0 && ai >= 0 && Math.abs(ei - ai) === 1) {
      return { field, expected, actual, score: 0.5, note: 'Off by one band' }
    }
    return { field, expected, actual, score: 0, note: 'Wrong band' }
  }

  // Numeric — close match (within 10%)
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (expected === 0) {
      return actual === 0
        ? { field, expected, actual, score: 1.0, note: 'Exact' }
        : { field, expected, actual, score: 0, note: 'Wrong' }
    }
    const ratio = Math.abs(actual - expected) / Math.abs(expected)
    if (ratio <= 0.1) {
      return { field, expected, actual, score: 0.8, note: 'Close (within 10%)' }
    }
    if (ratio <= 0.25) {
      return { field, expected, actual, score: 0.5, note: 'Approximate (within 25%)' }
    }
    return { field, expected, actual, score: 0, note: 'Wrong' }
  }

  // String — case-insensitive
  if (typeof expected === 'string' && typeof actual === 'string') {
    if (expected.toLowerCase() === actual.toLowerCase()) {
      return { field, expected, actual, score: 1.0, note: 'Exact (case-insensitive)' }
    }
  }

  return { field, expected, actual, score: 0, note: 'Wrong' }
}

function scoreChildren(expected: ChildData[], actual: ChildData[], scores: FieldScore[]) {
  // Count match
  const countCorrect = expected.length === actual.length
  scores.push({
    field: 'children.count',
    expected: expected.length,
    actual: actual.length,
    score: countCorrect ? 1.0 : actual.length > 0 ? 0.3 : 0,
    note: countCorrect ? 'Correct count' : `Expected ${expected.length}, got ${actual.length}`,
  })

  // Sort both by age to match them up
  const eSorted = [...expected].sort((a, b) => a.age - b.age)
  const aSorted = [...actual].sort((a, b) => a.age - b.age)

  for (let i = 0; i < eSorted.length; i++) {
    const exp = eSorted[i]
    const act = aSorted[i]

    if (!act) {
      scores.push({
        field: `children[${i}]`,
        expected: JSON.stringify(exp),
        actual: 'missing',
        score: 0,
        note: 'Child missing',
      })
      continue
    }

    scores.push(scoreField(`children[${i}].age`, exp.age, act.age))
    scores.push(
      scoreField(
        `children[${i}].has_additional_needs`,
        exp.has_additional_needs,
        act.has_additional_needs,
      ),
    )
    scores.push(scoreField(`children[${i}].in_education`, exp.in_education, act.in_education))
    scores.push(
      scoreField(`children[${i}].disability_benefit`, exp.disability_benefit, act.disability_benefit),
    )
  }
}

function scoreCaredFor(
  expected: CaredForPerson,
  actual: CaredForPerson | undefined,
  scores: FieldScore[],
) {
  if (!actual) {
    scores.push({
      field: 'cared_for_person',
      expected: JSON.stringify(expected),
      actual: 'missing',
      score: 0,
      note: 'Entire cared_for_person missing',
    })
    return
  }

  if (expected.relationship) {
    // Accept "parent", "mother", "father", "mum", "dad" as equivalent
    const parentTerms = ['parent', 'mother', 'father', 'mum', 'dad']
    const expIsParent = parentTerms.includes(expected.relationship.toLowerCase())
    const actIsParent = parentTerms.includes((actual.relationship ?? '').toLowerCase())
    if (expIsParent && actIsParent) {
      scores.push({
        field: 'cared_for_person.relationship',
        expected: expected.relationship,
        actual: actual.relationship,
        score: 1.0,
        note: 'Parent term match',
      })
    } else {
      scores.push(
        scoreField('cared_for_person.relationship', expected.relationship, actual.relationship),
      )
    }
  }
  if (expected.age !== undefined) {
    scores.push(scoreField('cared_for_person.age', expected.age, actual.age))
  }
  if (expected.needs_help_daily_living !== undefined) {
    scores.push(
      scoreField(
        'cared_for_person.needs_help_daily_living',
        expected.needs_help_daily_living,
        actual.needs_help_daily_living,
      ),
    )
  }
  if (expected.disability_benefit !== undefined) {
    scores.push(
      scoreField(
        'cared_for_person.disability_benefit',
        expected.disability_benefit,
        actual.disability_benefit,
      ),
    )
  }
}
