import type { PersonData } from '../types/person.ts'
import type {
  EntitlementBundle,
  EntitlementResult,
  ActionPlanStep,
  EntitlementDefinition,
  DependencyEdge,
  ConflictEdge,
  SituationDefinition,
  ClaimingDifficulty,
  ActionPriority,
} from '../types/entitlements.ts'
import type { SituationId } from '../types/conversation.ts'
import { checkEligibility, getRelevantEntitlementIds } from './eligibility-rules.ts'
import { resolveCascade } from './cascade-resolver.ts'
import { resolveConflicts } from './conflict-resolver.ts'
import { estimateValue } from './value-estimator.ts'
import entitlementData from '../data/entitlements.json'

const allEntitlements = entitlementData.entitlements as EntitlementDefinition[]
const dependencyEdges = entitlementData.dependency_edges as DependencyEdge[]
const conflictEdges = entitlementData.conflict_edges as ConflictEdge[]
const situations = entitlementData.situations as SituationDefinition[]

/**
 * Master orchestrator: eligibility + values + cascade + conflicts → EntitlementBundle
 */
export function buildBundle(
  personData: PersonData,
  situationIds: SituationId[],
): EntitlementBundle {
  // 1. Get relevant entitlements for the situation
  const relevantIds = getRelevantEntitlementIds(situationIds, { situations })
  const relevantEntitlements = allEntitlements.filter((e) => relevantIds.includes(e.id))

  // 2. Check eligibility
  const eligibilityResults = checkEligibility(relevantEntitlements, personData, situationIds)
  const eligibleIds = new Set(eligibilityResults.map((r) => r.id))

  // 3. Build EntitlementResult objects with values
  const entitlementResults: EntitlementResult[] = eligibilityResults.map((er) => {
    const def = allEntitlements.find((e) => e.id === er.id)!
    const value = estimateValue(def, personData)
    return {
      id: er.id,
      name: def.name,
      plain_description: def.short_description,
      estimated_annual_value: value,
      confidence: er.confidence,
      difficulty: def.claiming_difficulty,
      application_method: formatApplicationMethod(def.application_method),
      application_url: def.application_url ?? undefined,
      what_you_need: getWhatYouNeed(def.id),
      timeline: getTimeline(def.id),
      why_this_matters: getWhyThisMatters(def, dependencyEdges, eligibleIds),
    }
  })

  // 4. Resolve cascade groupings
  const cascade = resolveCascade(entitlementResults, allEntitlements, dependencyEdges)

  // 5. Resolve conflicts
  const conflicts = resolveConflicts(eligibleIds, conflictEdges, personData)

  // 6. Calculate totals
  const allResults = [
    ...cascade.gateway_entitlements,
    ...cascade.cascaded_entitlements.flatMap((g) => g.entitlements),
    ...cascade.independent_entitlements,
  ]
  const totalLow = allResults.reduce((sum, r) => sum + r.estimated_annual_value.low, 0)
  const totalHigh = allResults.reduce((sum, r) => sum + r.estimated_annual_value.high, 0)

  // 7. Build action plan
  const actionPlan = buildActionPlan(cascade, situationIds)

  return {
    total_estimated_annual_value: { low: totalLow, high: totalHigh },
    ...cascade,
    conflicts,
    action_plan: actionPlan,
  }
}

function formatApplicationMethod(methods: string[]): string {
  const labels: Record<string, string> = {
    online: 'Online at GOV.UK',
    phone: 'By phone',
    paper_form: 'Paper form',
    online_council: 'Online via your council',
    phone_then_paper: 'Phone to request form',
    letter: 'By letter',
    letter_or_online: 'Online or by letter',
    automatic_if_pension_credit: 'Automatic if on Pension Credit',
    apply_to_supplier: 'Apply to your supplier',
    online_provider: 'Online via your provider',
    phone_provider: 'By phone to your provider',
    online_operator_website: 'Online via train operator',
  }
  return methods.map((m) => labels[m] || m).join(' / ')
}

function getWhatYouNeed(id: string): string[] {
  const needs: Record<string, string[]> = {
    attendance_allowance: [
      'GP or consultant details',
      'Description of daily care needs',
      'Any relevant medical letters',
    ],
    pension_credit: [
      'National Insurance number',
      'Bank account details',
      'Income and savings information',
      'Housing costs details',
    ],
    universal_credit: [
      'National Insurance number',
      'Bank account details',
      'Proof of identity',
      'Income details',
      'Rent agreement (if renting)',
      'Childcare costs (if applicable)',
    ],
    carers_allowance: [
      'National Insurance number',
      "Cared-for person's details and their disability benefit reference",
      'Your employment details',
      'Bank account details',
    ],
    child_benefit: [
      "Child's birth certificate",
      'Your National Insurance number',
      'Bank account details',
    ],
    ehcp_assessment: [
      'Letter to the local authority requesting assessment',
      "Evidence of your child's needs (school reports, medical letters)",
      'Parental views on your child\'s needs',
    ],
    dla_child: [
      "Child's details and diagnosis (if any)",
      'Description of care needs compared to peers',
      'Medical evidence from GP or specialist',
    ],
    pip: [
      'Details of your health condition',
      'How it affects daily living and mobility',
      'Medical evidence and treatment details',
      'GP and specialist contact details',
    ],
  }
  return needs[id] || ['Contact the administering body for requirements']
}

function getTimeline(id: string): string {
  const timelines: Record<string, string> = {
    attendance_allowance: 'Decision usually within 8 weeks',
    pension_credit: 'Decision usually within 5 weeks',
    universal_credit: '5-week wait before first payment (advance available)',
    carers_allowance: 'Decision usually within 4 weeks',
    child_benefit: 'Usually backdated and paid within 2-3 weeks',
    council_tax_reduction_full: 'Applied to your next bill',
    council_tax_support_working_age: 'Applied to your next bill',
    warm_home_discount: 'Credited to your electricity account',
    free_school_meals: 'Usually confirmed within 2 weeks',
    ehcp_assessment: 'LA must decide to assess within 6 weeks; full process takes up to 20 weeks',
    dla_child: 'Decision usually within 12 weeks',
    pip: 'Typically 3-4 months from application to decision',
    tax_free_childcare: 'Account set up within 2-3 weeks',
    marriage_allowance: 'Applied to your tax code, backdatable 4 years',
    social_tariff_broadband: 'Usually switched within 2-4 weeks',
  }
  return timelines[id] || 'Contact the administering body for timeline'
}

function getWhyThisMatters(
  def: EntitlementDefinition,
  edges: DependencyEdge[],
  eligibleIds: Set<string>,
): string | undefined {
  if (!def.is_gateway) return undefined

  const unlocked = edges
    .filter((e) => e.from === def.id && eligibleIds.has(e.to))
    .map((e) => {
      const targetDef = allEntitlements.find((ent) => ent.id === e.to)
      return targetDef?.name
    })
    .filter(Boolean)

  if (unlocked.length === 0) return undefined
  return `Claiming this first helps you qualify for: ${unlocked.join(', ')}.`
}

function buildActionPlan(
  cascade: ReturnType<typeof resolveCascade>,
  situationIds: SituationId[],
): ActionPlanStep[] {
  const isUrgent = situationIds.includes('lost_job')
  const steps: ActionPlanStep[] = []

  // Week 1: Gateway entitlements
  const week1Actions = cascade.gateway_entitlements.map((gw) => ({
    entitlement_id: gw.id,
    entitlement_name: gw.name,
    action: `Apply for ${gw.name} — ${gw.application_method}`,
    priority: (isUrgent ? 'critical' : 'important') as ActionPriority,
  }))
  if (week1Actions.length > 0) {
    steps.push({ week: isUrgent ? 'This week' : 'Week 1', actions: week1Actions })
  }

  // Week 2: Independent entitlements
  const week2Actions = cascade.independent_entitlements.map((ent) => ({
    entitlement_id: ent.id,
    entitlement_name: ent.name,
    action: `Apply for ${ent.name} — ${ent.application_method}`,
    priority: 'important' as ActionPriority,
  }))
  if (week2Actions.length > 0) {
    steps.push({ week: isUrgent ? 'Next week' : 'Week 2', actions: week2Actions })
  }

  // After gateways awarded: Cascaded entitlements
  for (const group of cascade.cascaded_entitlements) {
    const groupActions = group.entitlements.map((ent) => ({
      entitlement_id: ent.id,
      entitlement_name: ent.name,
      action: `Apply for ${ent.name} — ${ent.application_method}`,
      priority: 'when_ready' as ActionPriority,
    }))
    if (groupActions.length > 0) {
      steps.push({
        week: `After ${group.gateway_name} is awarded`,
        actions: groupActions,
      })
    }
  }

  return steps
}
