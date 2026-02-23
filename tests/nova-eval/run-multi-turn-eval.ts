import { createBedrockClient } from './bedrock-client.ts'
import { ALL_MULTI_TURN_SCENARIOS, type MultiTurnScenario } from './multi-turn-scenarios.ts'
import { parseAIResponse } from '../../src/services/ai.ts'
import { extractFromMessage, mergeExtraction } from '../../src/services/message-extractor.ts'
import { buildSystemPrompt } from '../../src/services/system-prompt.ts'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import { hasCriticalFields } from '../../src/engine/critical-fields.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { SituationId, ConversationStage } from '../../src/types/conversation.ts'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DELAY_BETWEEN_CALLS_MS = 1000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface TurnResult {
  turnIndex: number
  userMessage: string
  assistantResponse: string
  extractedFields: Partial<PersonData>
  stageTransition?: ConversationStage
  prematureComplete: boolean
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

interface ScenarioResult {
  id: string
  name: string
  turns: TurnResult[]
  finalPersonData: PersonData
  finalSituations: SituationId[]
  gatePass: boolean
  prematureCompletes: number
  bundleBuilt: boolean
  bundleEntitlements: string[]
  expectedEntitlements: string[]
  entitlementHits: number
  entitlementMisses: string[]
  bundleSizePass: boolean
  scores: {
    completeness: number
    gatePass: number
    noPrematureComplete: number
    bundleCorrectness: number
    overall: number
  }
  pass: boolean
  error?: string
}

// ── Scoring ─────────────────────────────────────────

function scoreFieldCompleteness(
  actual: PersonData,
  expected: Partial<PersonData>,
): number {
  const expectedEntries = Object.entries(expected)
  if (expectedEntries.length === 0) return 1.0

  let matched = 0
  for (const [key, expectedValue] of expectedEntries) {
    const actualValue = (actual as unknown as Record<string, unknown>)[key]
    if (actualValue === expectedValue) {
      matched++
    } else if (
      key === 'income_band' &&
      typeof actualValue === 'string' &&
      typeof expectedValue === 'string'
    ) {
      // Allow off-by-one income band
      const bands = [
        'under_7400', 'under_12570', 'under_16000', 'under_25000',
        'under_50270', 'under_60000', 'under_100000', 'under_125140', 'over_125140',
      ]
      const actualIdx = bands.indexOf(actualValue)
      const expectedIdx = bands.indexOf(expectedValue)
      if (Math.abs(actualIdx - expectedIdx) <= 1) matched += 0.5
    } else if (actualValue !== undefined && actualValue !== null) {
      // Present but wrong — partial credit
      matched += 0.3
    }
    // Missing: 0 points
  }

  return matched / expectedEntries.length
}

function getAllBundleIds(bundle: Awaited<ReturnType<typeof buildBundle>>): string[] {
  return [
    ...bundle.gateway_entitlements.map((e) => e.id),
    ...bundle.independent_entitlements.map((e) => e.id),
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
  ]
}

// ── Main ────────────────────────────────────────────

async function main() {
  console.log('Multi-Turn Evaluation — Starting...')
  console.log(`Running ${ALL_MULTI_TURN_SCENARIOS.length} scenarios\n`)

  const callBedrock = createBedrockClient({
    temperature: 0,
    maxTokens: 2048,
    region: 'eu-west-2',
  })

  const results: ScenarioResult[] = []

  for (const scenario of ALL_MULTI_TURN_SCENARIOS) {
    console.log(`  [${scenario.id}] ${scenario.name}`)
    const result = await runScenario(scenario, callBedrock)
    results.push(result)

    const status = result.pass ? 'PASS' : '\x1b[31mFAIL\x1b[0m'
    const pct = (result.scores.overall * 100).toFixed(0)
    console.log(
      `    Score: ${pct}% | Gate: ${result.gatePass ? 'OK' : 'FAIL'} | ` +
      `Premature: ${result.prematureCompletes} | Bundle: ${result.bundleEntitlements.length} items | ${status}`,
    )
    if (result.entitlementMisses.length > 0) {
      console.log(`    Missing: ${result.entitlementMisses.join(', ')}`)
    }
    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }
    console.log()
  }

  // Summary
  console.log('═'.repeat(70))
  console.log('MULTI-TURN EVAL SUMMARY')
  console.log('═'.repeat(70))

  const passed = results.filter((r) => r.pass).length
  const avgScore = results.reduce((s, r) => s + r.scores.overall, 0) / results.length
  const totalTokensIn = results.reduce(
    (s, r) => s + r.turns.reduce((ts, t) => ts + t.inputTokens, 0), 0,
  )
  const totalTokensOut = results.reduce(
    (s, r) => s + r.turns.reduce((ts, t) => ts + t.outputTokens, 0), 0,
  )

  console.log(`  Passed: ${passed}/${results.length}`)
  console.log(`  Average score: ${(avgScore * 100).toFixed(1)}%`)
  console.log(`  Total tokens: ${totalTokensIn} in / ${totalTokensOut} out`)
  console.log()

  for (const r of results) {
    const status = r.pass ? '✓' : '✗'
    console.log(
      `  ${status} [${r.id}] ${r.name.slice(0, 50).padEnd(52)} ${(r.scores.overall * 100).toFixed(0)}%`,
    )
  }

  // Write results
  const outputPath = join(__dirname, 'multi-turn-results.json')
  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResults saved to: ${outputPath}`)

  process.exit(passed === results.length ? 0 : 1)
}

async function runScenario(
  scenario: MultiTurnScenario,
  callBedrock: ReturnType<typeof createBedrockClient>,
): Promise<ScenarioResult> {
  let personData: PersonData = createEmptyPerson()
  let situations: SituationId[] = []
  let stage: ConversationStage = 'intake'
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  const turnResults: TurnResult[] = []
  let prematureCompletes = 0

  try {
    for (let i = 0; i < scenario.turns.length; i++) {
      const userMessage = scenario.turns[i]
      messages.push({ role: 'user', content: userMessage })

      // Build system prompt with current state (same as production)
      const systemPrompt = buildSystemPrompt(stage, personData, situations)

      const response = await callBedrock(systemPrompt, messages)
      const parsed = parseAIResponse(response.text)

      // Merge AI + code extraction (same as production pipeline)
      const codeExtracted = extractFromMessage(userMessage)
      const merged = mergeExtraction(parsed.personData, codeExtracted)
      if (merged && Object.keys(merged).length > 0) {
        personData = { ...personData, ...merged }
      }

      // Update situations
      if (parsed.situations && parsed.situations.length > 0) {
        situations = Array.from(new Set([...situations, ...parsed.situations]))
      }

      // Check for premature completion
      let prematureComplete = false
      if (parsed.stageTransition === 'complete' && i < scenario.earliestCompleteTurn) {
        prematureComplete = true
        prematureCompletes++
      }

      // Update stage
      if (parsed.stageTransition) {
        stage = parsed.stageTransition
      }

      turnResults.push({
        turnIndex: i,
        userMessage,
        assistantResponse: parsed.text,
        extractedFields: merged ?? {},
        stageTransition: parsed.stageTransition,
        prematureComplete,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        latencyMs: response.latencyMs,
      })

      // Add assistant message for next turn's context
      messages.push({ role: 'assistant', content: parsed.text })

      await delay(DELAY_BETWEEN_CALLS_MS)
    }

    // Final checks
    const gatePass = hasCriticalFields(personData)

    // Build bundle
    let bundleEntitlements: string[] = []
    let bundleBuilt = false
    try {
      const bundle = await buildBundle(personData, situations)
      bundleEntitlements = getAllBundleIds(bundle)
      bundleBuilt = true
    } catch {
      // Bundle build failed
    }

    // Score entitlement hits
    const entitlementHits = scenario.expectedEntitlements.filter(
      (e) => bundleEntitlements.includes(e),
    ).length
    const entitlementMisses = scenario.expectedEntitlements.filter(
      (e) => !bundleEntitlements.includes(e),
    )
    const bundleSizePass = bundleEntitlements.length >= scenario.minBundleSize

    // Calculate weighted scores
    const completeness = scoreFieldCompleteness(personData, scenario.expectedPersonData)
    const gateScore = gatePass ? 1.0 : 0.0
    const prematureScore = prematureCompletes === 0 ? 1.0 : 0.0
    const bundleScore = bundleBuilt
      ? (scenario.expectedEntitlements.length > 0
          ? entitlementHits / scenario.expectedEntitlements.length
          : 1.0) * (bundleSizePass ? 1.0 : 0.7)
      : 0.0

    const overall =
      completeness * 0.4 +
      gateScore * 0.2 +
      prematureScore * 0.2 +
      bundleScore * 0.2

    return {
      id: scenario.id,
      name: scenario.name,
      turns: turnResults,
      finalPersonData: personData,
      finalSituations: situations,
      gatePass,
      prematureCompletes,
      bundleBuilt,
      bundleEntitlements,
      expectedEntitlements: scenario.expectedEntitlements,
      entitlementHits,
      entitlementMisses,
      bundleSizePass,
      scores: {
        completeness,
        gatePass: gateScore,
        noPrematureComplete: prematureScore,
        bundleCorrectness: bundleScore,
        overall,
      },
      pass: overall >= 0.75,
    }
  } catch (err) {
    return {
      id: scenario.id,
      name: scenario.name,
      turns: turnResults,
      finalPersonData: personData,
      finalSituations: situations,
      gatePass: false,
      prematureCompletes,
      bundleBuilt: false,
      bundleEntitlements: [],
      expectedEntitlements: scenario.expectedEntitlements,
      entitlementHits: 0,
      entitlementMisses: scenario.expectedEntitlements,
      bundleSizePass: false,
      scores: { completeness: 0, gatePass: 0, noPrematureComplete: 0, bundleCorrectness: 0, overall: 0 },
      pass: false,
      error: (err as Error).message,
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
