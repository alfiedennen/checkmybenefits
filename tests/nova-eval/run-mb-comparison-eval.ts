/**
 * MissingBenefit Comparison Eval
 *
 * Takes each multi-turn eval persona's expectedPersonData, runs it through:
 * 1. Our engine (buildBundle) → our entitlements
 * 2. MissingBenefit MCP server (calculate-benefits) → MB entitlements
 *
 * Compares: agreement, disagreement, coverage gaps.
 * This is NOT a pass/fail eval — it's a comparison to understand
 * where our heuristics and MB's calculations agree or diverge.
 */

import { ALL_MULTI_TURN_SCENARIOS } from './multi-turn-scenarios.ts'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import { mapPersonToAnswers } from '../../src/services/missing-benefit.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { MBBenefitResult, MBCalculateResponse } from '../../src/types/missing-benefit.ts'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MB_API_KEY = process.env.MISSING_BENEFIT_API_KEY
if (!MB_API_KEY) {
  console.error('Set MISSING_BENEFIT_API_KEY env var')
  process.exit(1)
}

const MCP_URL = 'https://missingbenefit.com/mcp'
const DELAY_MS = 600 // stay well under 120 req/min

// ── MB benefit ID → our entitlement ID mapping ─────────

const MB_TO_OUR_ID: Record<string, string> = {
  'universal-credit': 'universal_credit',
  'pip': 'personal_independence_payment',
  'state-pension': 'state_pension',
  'pension-credit': 'pension_credit',
  'attendance-allowance': 'attendance_allowance',
  'housing-benefit': 'housing_benefit_legacy',
  'council-tax-reduction': 'council_tax_support_working_age', // or council_tax_reduction_wales/scotland
  'winter-fuel-payment': 'winter_fuel_payment',
  'warm-home-discount': 'warm_home_discount',
  'free-tv-licence': 'free_tv_licence',
  'nhs-low-income-scheme': 'nhs_low_income_scheme',
  'jsa': 'jobseekers_allowance',
  'esa': 'employment_support_allowance',
  'carers-allowance': 'carers_allowance',
  'child-benefit': 'child_benefit',
  'bereavement-support': 'bereavement_support_payment',
}

// Our CTR IDs vary by nation
const OUR_CTR_IDS = [
  'council_tax_support_working_age',
  'council_tax_reduction_wales',
  'council_tax_reduction_scotland',
]

function mapMBIdToOurs(mbId: string, nation?: string): string | null {
  if (mbId === 'council-tax-reduction') {
    if (nation === 'wales') return 'council_tax_reduction_wales'
    if (nation === 'scotland') return 'council_tax_reduction_scotland'
    return 'council_tax_support_working_age'
  }
  return MB_TO_OUR_ID[mbId] ?? null
}

// ── MCP client ──────────────────────────────────────────

async function mcpRequest(
  headers: Record<string, string>,
  body: unknown,
): Promise<{ sessionId: string | null; data: unknown } | null> {
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const sid = res.headers.get('mcp-session-id')
    if (res.status === 202 || res.status === 204) return { sessionId: sid, data: null }
    const text = await res.text()
    const dataLine = text.split('\n').find((l) => l.startsWith('data: '))
    if (dataLine) return { sessionId: sid, data: JSON.parse(dataLine.slice(6)) }
    return { sessionId: sid, data: JSON.parse(text) }
  } catch (err) {
    console.error('MCP error:', (err as Error).message)
    return null
  }
}

async function callMB(answers: Record<string, unknown>): Promise<MBCalculateResponse | null> {
  const headers = {
    Authorization: `Bearer ${MB_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }

  // Init
  const init = await mcpRequest(headers, {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'checkmybenefits-eval', version: '1.0' },
    },
    id: 1,
  })
  if (!init?.sessionId) return null

  const sh = { ...headers, 'Mcp-Session-Id': init.sessionId }

  // Notify
  await mcpRequest(sh, { jsonrpc: '2.0', method: 'notifications/initialized', params: {} })

  // Calculate
  const calc = await mcpRequest(sh, {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'calculate-benefits',
      arguments: { answers, skipDataCheck: true },
    },
    id: 2,
  })

  const text = (calc?.data as any)?.result?.content?.[0]?.text
  if (!text) return null
  return JSON.parse(text) as MBCalculateResponse
}

// ── Bundle ID extraction ────────────────────────────────

function getAllBundleIds(bundle: ReturnType<typeof buildBundle>): string[] {
  return [
    ...bundle.gateway_entitlements.map((e) => e.id),
    ...bundle.independent_entitlements.map((e) => e.id),
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
  ]
}

// ── Main ────────────────────────────────────────────────

interface ComparisonResult {
  id: string
  name: string
  personData: Partial<PersonData>
  ourEntitlements: string[]
  mbBenefits: Array<{ id: string; eligible: boolean; annual: number; ourId: string | null }>
  mbEligible: string[]
  agreement: string[]       // both say eligible
  onlyOurs: string[]        // we say eligible, MB doesn't cover or says no
  onlyMB: string[]          // MB says eligible, we don't have it
  disagreement: string[]    // both cover it but disagree on eligibility
  ctrDetail?: {
    councilName: string
    annualAmount: number
    confidenceScore?: number
    confidenceLabel?: string
    breakdown?: MBBenefitResult['breakdown']
  }
  mbError?: string
}

async function run() {
  console.log('═'.repeat(70))
  console.log('  MISSINGBENEFIT COMPARISON EVAL')
  console.log('═'.repeat(70))
  console.log()

  const results: ComparisonResult[] = []

  for (const scenario of ALL_MULTI_TURN_SCENARIOS) {
    const person: PersonData = { ...createEmptyPerson(), ...scenario.expectedPersonData }

    // 1. Our engine
    const bundle = await buildBundle(person, scenario.expectedSituations)
    const ourIds = getAllBundleIds(bundle)

    // 2. MissingBenefit
    const answers = mapPersonToAnswers(person)
    let mbResponse: MBCalculateResponse | null = null
    let mbError: string | undefined

    try {
      mbResponse = await callMB(answers)
      if (!mbResponse) mbError = 'No response from MB MCP server'
    } catch (err) {
      mbError = String(err)
    }

    const mbBenefits = mbResponse?.benefits ?? []
    const nation = person.nation ?? (person.postcode?.startsWith('EH') ? 'scotland' : person.postcode?.startsWith('CF') || person.postcode?.startsWith('SA') || person.postcode?.startsWith('LL') ? 'wales' : 'england')
    const mbMapped = mbBenefits.map((b) => ({
      id: b.id,
      eligible: b.eligible,
      annual: b.annualAmount,
      ourId: mapMBIdToOurs(b.id, nation),
    }))

    const mbEligibleOurIds = mbMapped.filter((b) => b.eligible && b.ourId).map((b) => b.ourId!)

    // Compare
    const mbCoverageIds = new Set(mbMapped.filter((b) => b.ourId).map((b) => b.ourId!))
    const agreement: string[] = []
    const onlyOurs: string[] = []
    const disagreement: string[] = []

    for (const ourId of ourIds) {
      if (OUR_CTR_IDS.includes(ourId)) {
        // Map all our CTR variants to MB's single council-tax-reduction
        const mbCtr = mbMapped.find((b) => b.id === 'council-tax-reduction')
        if (mbCtr?.eligible) {
          agreement.push(ourId)
        } else if (mbCtr && !mbCtr.eligible) {
          disagreement.push(ourId)
        } else {
          onlyOurs.push(ourId)
        }
        continue
      }

      if (mbEligibleOurIds.includes(ourId)) {
        agreement.push(ourId)
      } else if (mbCoverageIds.has(ourId)) {
        disagreement.push(ourId)
      } else {
        onlyOurs.push(ourId)
      }
    }

    const onlyMB = mbEligibleOurIds.filter((id) => !ourIds.includes(id) && !OUR_CTR_IDS.some((c) => c === id && ourIds.some((o) => OUR_CTR_IDS.includes(o))))

    // CTR detail
    const ctrBenefit = mbBenefits.find((b) => b.id === 'council-tax-reduction')
    const ctrDetail = ctrBenefit?.eligible
      ? {
          councilName: ctrBenefit.councilName ?? 'Unknown',
          annualAmount: ctrBenefit.annualAmount,
          confidenceScore: ctrBenefit.confidenceScore,
          confidenceLabel: ctrBenefit.confidenceLabel,
          breakdown: ctrBenefit.breakdown,
        }
      : undefined

    const result: ComparisonResult = {
      id: scenario.id,
      name: scenario.name,
      personData: scenario.expectedPersonData,
      ourEntitlements: ourIds,
      mbBenefits: mbMapped,
      mbEligible: mbEligibleOurIds,
      agreement,
      onlyOurs,
      onlyMB,
      disagreement,
      ctrDetail,
      mbError,
    }

    results.push(result)

    // Print
    const status = mbError ? '\x1b[31mERROR\x1b[0m' : '\x1b[32mOK\x1b[0m'
    const agreePct = ourIds.length > 0 ? Math.round((agreement.length / ourIds.length) * 100) : 0
    console.log(
      `  [${scenario.id}] ${scenario.name.substring(0, 50).padEnd(50)} ${status}`,
    )
    console.log(
      `    Ours: ${ourIds.length} entitlements | MB eligible: ${mbEligibleOurIds.length} | Agreement: ${agreement.length} (${agreePct}%)`,
    )
    if (disagreement.length > 0) {
      console.log(`    \x1b[33mDisagree:\x1b[0m ${disagreement.join(', ')}`)
    }
    if (onlyMB.length > 0) {
      console.log(`    \x1b[36mOnly MB:\x1b[0m ${onlyMB.join(', ')}`)
    }
    if (ctrDetail) {
      console.log(
        `    \x1b[32mCTR:\x1b[0m ${ctrDetail.councilName} £${ctrDetail.annualAmount}/yr (${ctrDetail.confidenceLabel} ${ctrDetail.confidenceScore}%)`,
      )
    }
    if (mbError) {
      console.log(`    \x1b[31m${mbError}\x1b[0m`)
    }
    console.log()

    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  // Summary
  console.log('═'.repeat(70))
  console.log('  SUMMARY')
  console.log('═'.repeat(70))

  const totalOurs = results.reduce((s, r) => s + r.ourEntitlements.length, 0)
  const totalAgreed = results.reduce((s, r) => s + r.agreement.length, 0)
  const totalDisagreed = results.reduce((s, r) => s + r.disagreement.length, 0)
  const totalOnlyOurs = results.reduce((s, r) => s + r.onlyOurs.length, 0)
  const totalOnlyMB = results.reduce((s, r) => s + r.onlyMB.length, 0)
  const ctrResults = results.filter((r) => r.ctrDetail)
  const avgCtrConfidence =
    ctrResults.length > 0
      ? (ctrResults.reduce((s, r) => s + (r.ctrDetail!.confidenceScore ?? 0), 0) / ctrResults.length).toFixed(0)
      : 'N/A'

  console.log(`  Scenarios evaluated:     ${results.length}`)
  console.log(`  Our total entitlements:  ${totalOurs}`)
  console.log(`  Agreement (both say yes):${totalAgreed} (${Math.round((totalAgreed / totalOurs) * 100)}%)`)
  console.log(`  Disagreement:            ${totalDisagreed}`)
  console.log(`  Only ours (MB no cover): ${totalOnlyOurs}`)
  console.log(`  Only MB (we don't have): ${totalOnlyMB}`)
  console.log(`  CTR estimates returned:  ${ctrResults.length}/${results.length}`)
  console.log(`  Avg CTR confidence:      ${avgCtrConfidence}%`)
  console.log()

  // Save
  const outPath = join(__dirname, 'mb-comparison-results.json')
  writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`Results saved to: ${outPath}`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
