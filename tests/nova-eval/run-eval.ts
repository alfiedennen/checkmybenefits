import { createBedrockClient } from './bedrock-client.ts'
import { ALL_SCENARIOS } from './test-scenarios.ts'
import { scoreScenario } from './scoring.ts'
import { buildReport, printReport, type EvalReport } from './report.ts'
import { parseAIResponse, type AIResponse } from '../../src/services/ai.ts'
import { extractFromMessage, mergeExtraction } from '../../src/services/message-extractor.ts'
import { buildSystemPrompt } from '../../src/services/system-prompt.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { SituationId } from '../../src/types/conversation.ts'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DELAY_BETWEEN_CALLS_MS = 1000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('Nova Micro Evaluation — Starting...')
  console.log(`Running ${ALL_SCENARIOS.length} scenarios\n`)

  const callNovaMicro = createBedrockClient({
    temperature: 0,
    maxTokens: 2048,
    region: 'eu-west-2',
  })

  const modelOnlyResults: EvalReport['scenarios'] = []
  const combinedResults: EvalReport['scenarios'] = []

  for (const scenario of ALL_SCENARIOS) {
    process.stdout.write(`  [${scenario.id}] ${scenario.name}... `)

    // Build person data context
    const personData: PersonData = {
      ...createEmptyPerson(),
      ...(scenario.existingPersonData ?? {}),
    }
    const situations: SituationId[] = scenario.existingSituations ?? []

    // Build system prompt using our real function
    const systemPrompt = buildSystemPrompt(scenario.stage, personData, situations)

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (scenario.previousMessages) {
      for (const m of scenario.previousMessages) {
        messages.push({ role: m.role, content: m.content })
      }
    }
    messages.push({ role: 'user', content: scenario.userMessage })

    let rawText = ''
    let inputTokens = 0
    let outputTokens = 0
    let latencyMs = 0
    let parsed: AIResponse | null = null
    let parseError = false

    try {
      const response = await callNovaMicro(systemPrompt, messages)
      rawText = response.text
      inputTokens = response.inputTokens
      outputTokens = response.outputTokens
      latencyMs = response.latencyMs

      try {
        parsed = parseAIResponse(rawText)
      } catch {
        parseError = true
      }
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`)
      parseError = true
    }

    // Score model-only
    const modelScore = scoreScenario(
      scenario.id,
      scenario.name,
      scenario.expected,
      parsed,
      parseError,
    )

    modelOnlyResults.push({
      ...modelScore,
      inputTokens,
      outputTokens,
      latencyMs,
      rawResponse: rawText,
    })

    // Score combined (model + code extraction)
    let combinedParsed = parsed
    if (parsed && !parseError) {
      const codeExtracted = extractFromMessage(scenario.userMessage)
      const mergedPersonData = mergeExtraction(parsed.personData, codeExtracted)
      combinedParsed = {
        ...parsed,
        personData: Object.keys(mergedPersonData).length > 0 ? mergedPersonData as Partial<PersonData> : parsed.personData,
      }
    }

    const combinedScore = scoreScenario(
      scenario.id,
      scenario.name,
      scenario.expected,
      combinedParsed,
      parseError,
    )

    combinedResults.push({
      ...combinedScore,
      inputTokens,
      outputTokens,
      latencyMs,
      rawResponse: rawText,
    })

    const modelPct = (modelScore.overallScore * 100).toFixed(0)
    const combinedPct = (combinedScore.overallScore * 100).toFixed(0)
    const improved = combinedScore.overallScore > modelScore.overallScore
    const status = combinedScore.pass ? 'PASS' : '\x1b[31mFAIL\x1b[0m'
    console.log(
      `model=${modelPct}% combined=${combinedPct}%${improved ? ' ↑' : ''} ${status}`,
    )

    await delay(DELAY_BETWEEN_CALLS_MS)
  }

  // Build and print both reports
  console.log('\n\n' + '▓'.repeat(80))
  console.log('  MODEL-ONLY RESULTS (no code extraction)')
  console.log('▓'.repeat(80))
  const modelReport = buildReport(modelOnlyResults)
  printReport(modelReport)

  console.log('\n\n' + '▓'.repeat(80))
  console.log('  COMBINED RESULTS (model + code extraction fallback)')
  console.log('▓'.repeat(80))
  const combinedReport = buildReport(combinedResults)
  printReport(combinedReport)

  // Print improvement summary
  console.log('\n  IMPROVEMENT SUMMARY')
  console.log('  ' + '-'.repeat(60))
  console.log(
    `  Model-only:  ${(modelReport.overallScore * 100).toFixed(1)}% (${modelReport.passed}/${modelReport.totalScenarios} passed)`,
  )
  console.log(
    `  Combined:    ${(combinedReport.overallScore * 100).toFixed(1)}% (${combinedReport.passed}/${combinedReport.totalScenarios} passed)`,
  )
  console.log(
    `  Improvement: +${((combinedReport.overallScore - modelReport.overallScore) * 100).toFixed(1)} percentage points`,
  )

  // Show per-scenario improvements
  const improved = modelOnlyResults
    .map((m, i) => ({
      id: m.scenarioId,
      name: m.scenarioName,
      modelPct: (m.overallScore * 100).toFixed(0),
      combinedPct: (combinedResults[i].overallScore * 100).toFixed(0),
      delta: combinedResults[i].overallScore - m.overallScore,
    }))
    .filter((s) => s.delta > 0.01)
    .sort((a, b) => b.delta - a.delta)

  if (improved.length > 0) {
    console.log('\n  Scenarios improved by code extraction:')
    for (const s of improved) {
      console.log(
        `    [${s.id}] ${s.name.slice(0, 45).padEnd(47)} ${s.modelPct}% → ${s.combinedPct}% (+${(s.delta * 100).toFixed(0)}%)`,
      )
    }
  }

  // Write JSON results
  const outputPath = join(__dirname, 'results.json')
  writeFileSync(
    outputPath,
    JSON.stringify({ modelOnly: modelReport, combined: combinedReport }, null, 2),
  )
  console.log(`\nResults saved to: ${outputPath}`)

  process.exit(combinedReport.overallPass ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
