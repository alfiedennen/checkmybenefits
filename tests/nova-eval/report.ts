import type { ScenarioScore } from './scoring.ts'

export interface EvalReport {
  timestamp: string
  model: string
  totalScenarios: number
  passed: number
  failed: number
  overallScore: number
  overallPass: boolean
  totalInputTokens: number
  totalOutputTokens: number
  totalLatencyMs: number
  avgLatencyMs: number
  estimatedCostPerConversation: number
  scenarios: Array<
    ScenarioScore & {
      inputTokens: number
      outputTokens: number
      latencyMs: number
      rawResponse?: string
    }
  >
}

// Nova Micro pricing per 1M tokens
const INPUT_PRICE_PER_1M = 0.035
const OUTPUT_PRICE_PER_1M = 0.14

export function buildReport(
  scenarios: EvalReport['scenarios'],
): EvalReport {
  const totalInputTokens = scenarios.reduce((s, sc) => s + sc.inputTokens, 0)
  const totalOutputTokens = scenarios.reduce((s, sc) => s + sc.outputTokens, 0)
  const totalLatencyMs = scenarios.reduce((s, sc) => s + sc.latencyMs, 0)
  const passed = scenarios.filter((s) => s.pass).length
  const overallScore =
    scenarios.reduce((s, sc) => s + sc.overallScore, 0) / scenarios.length

  // Estimate cost: average 5 turns per real conversation
  const avgInputPerCall = totalInputTokens / scenarios.length
  const avgOutputPerCall = totalOutputTokens / scenarios.length
  const turnsPerConversation = 5
  const costPerConversation =
    ((avgInputPerCall * turnsPerConversation) / 1_000_000) * INPUT_PRICE_PER_1M +
    ((avgOutputPerCall * turnsPerConversation) / 1_000_000) * OUTPUT_PRICE_PER_1M

  return {
    timestamp: new Date().toISOString(),
    model: 'amazon.nova-micro-v1:0',
    totalScenarios: scenarios.length,
    passed,
    failed: scenarios.length - passed,
    overallScore,
    overallPass: overallScore >= 0.8 && scenarios.every((s) => s.overallScore >= 0.6),
    totalInputTokens,
    totalOutputTokens,
    totalLatencyMs,
    avgLatencyMs: Math.round(totalLatencyMs / scenarios.length),
    estimatedCostPerConversation: costPerConversation,
    scenarios,
  }
}

export function printReport(report: EvalReport) {
  console.log('\n' + '='.repeat(80))
  console.log('  NOVA MICRO EVALUATION REPORT')
  console.log('='.repeat(80))
  console.log(`  Model:     ${report.model}`)
  console.log(`  Date:      ${report.timestamp}`)
  console.log(`  Scenarios: ${report.totalScenarios}`)
  console.log('')

  // Summary table
  console.log(
    '  ' +
      'ID'.padEnd(6) +
      'Name'.padEnd(50) +
      'Score'.padEnd(8) +
      'Result'.padEnd(8) +
      'Latency',
  )
  console.log('  ' + '-'.repeat(85))

  for (const sc of report.scenarios) {
    const scoreStr = (sc.overallScore * 100).toFixed(0) + '%'
    const result = sc.pass ? 'PASS' : 'FAIL'
    const latency = sc.latencyMs + 'ms'
    console.log(
      '  ' +
        sc.scenarioId.padEnd(6) +
        sc.scenarioName.slice(0, 48).padEnd(50) +
        scoreStr.padEnd(8) +
        (sc.pass ? result : `\x1b[31m${result}\x1b[0m`).padEnd(sc.pass ? 8 : 19) +
        latency,
    )
  }

  console.log('')
  console.log('  ' + '-'.repeat(85))
  console.log(
    `  OVERALL: ${(report.overallScore * 100).toFixed(1)}%  |  ` +
      `${report.passed}/${report.totalScenarios} passed  |  ` +
      (report.overallPass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'),
  )

  // Cost & performance
  console.log('')
  console.log('  COST & PERFORMANCE')
  console.log(`  Avg latency:        ${report.avgLatencyMs}ms`)
  console.log(`  Total tokens:       ${report.totalInputTokens} in / ${report.totalOutputTokens} out`)
  console.log(`  Est. cost/convo:    $${report.estimatedCostPerConversation.toFixed(5)}`)
  console.log(
    `  Convos per dollar:  ~${Math.floor(1 / report.estimatedCostPerConversation)}`,
  )

  // Print details for failures
  const failures = report.scenarios.filter((s) => !s.pass)
  if (failures.length > 0) {
    console.log('')
    console.log('  FAILURE DETAILS')
    console.log('  ' + '-'.repeat(85))
    for (const sc of failures) {
      console.log(`\n  [${sc.scenarioId}] ${sc.scenarioName}`)
      console.log(`  XML Valid: ${sc.xmlValid}  |  Situations: ${(sc.situationScore * 100).toFixed(0)}%  |  Stage: ${sc.stageCorrect}  |  Text: ${sc.hasConversationalText}`)

      if (sc.fieldScores.length > 0) {
        const failedFields = sc.fieldScores.filter((f) => f.score < 1.0)
        for (const f of failedFields) {
          console.log(
            `    ${f.field}: expected=${JSON.stringify(f.expected)} got=${JSON.stringify(f.actual)} (${f.note}, ${(f.score * 100).toFixed(0)}%)`,
          )
        }
      }

      if (sc.rawResponse) {
        console.log(`  Raw response (first 300 chars):`)
        console.log(`    ${sc.rawResponse.slice(0, 300)}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
}
