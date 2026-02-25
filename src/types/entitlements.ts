export type ClaimingDifficulty = 'automatic' | 'easy' | 'moderate' | 'complex' | 'adversarial'
export type ConfidenceTier = 'likely' | 'possible' | 'worth_checking'
export type ActionPriority = 'critical' | 'important' | 'when_ready'
export type DependencyType = 'gateway' | 'strengthens' | 'qualifies' | 'enables_for_carer' | 'triggers'

export interface EntitlementResult {
  id: string
  name: string
  plain_description: string
  estimated_annual_value: { low: number; high: number }
  confidence: ConfidenceTier
  difficulty: ClaimingDifficulty
  application_method: string
  application_url?: string
  what_you_need: string[]
  timeline: string
  why_this_matters?: string
}

export interface CascadedGroup {
  gateway_id: string
  gateway_name: string
  entitlements: EntitlementResult[]
}

export interface ConflictResolution {
  option_a: string
  option_a_id: string
  option_b: string
  option_b_id: string
  recommendation: string
  reasoning: string
  value_difference?: number
}

export interface ActionPlanStep {
  week: string
  actions: ActionItem[]
}

export interface ActionItem {
  entitlement_id: string
  entitlement_name: string
  action: string
  priority: ActionPriority
  deadline?: string
}

export interface EntitlementBundle {
  total_estimated_annual_value: { low: number; high: number }
  nation?: 'england' | 'scotland' | 'wales' | 'northern_ireland'
  gateway_entitlements: EntitlementResult[]
  cascaded_entitlements: CascadedGroup[]
  independent_entitlements: EntitlementResult[]
  conflicts: ConflictResolution[]
  action_plan: ActionPlanStep[]
}

// Raw data model types (matching entitlement-engine-data-model.json)

export interface EntitlementDefinition {
  id: string
  name: string
  short_description: string
  admin_body: string
  application_method: string[]
  application_url?: string | null
  estimated_annual_value_range: [number, number] | null
  value_note?: string
  claiming_difficulty: ClaimingDifficulty
  is_gateway: boolean
  eligibility: Record<string, unknown>
  unlocks: string[]
  conflicts_with: string[]
  critical_note?: string
  conflict_note?: string
  available_in?: Array<'england' | 'scotland' | 'wales' | 'northern_ireland'>
}

export interface DependencyEdge {
  from: string
  to: string
  type: DependencyType
  note?: string
  condition?: string
  auto?: boolean
  critical?: boolean
}

export interface ConflictEdge {
  between: [string, string]
  type: string
  resolution: string
}

export interface SituationDefinition {
  id: string
  trigger_phrases: string[]
  primary_entitlements: string[]
  secondary_entitlements: string[]
  optimal_claiming_order?: string[]
  decision_points?: Array<{
    id: string
    description: string
    factors: string[]
  }>
  time_critical?: boolean
  sensitive?: boolean
}

export interface EntitlementDataModel {
  entitlements: EntitlementDefinition[]
  dependency_edges: DependencyEdge[]
  conflict_edges: ConflictEdge[]
  situations: SituationDefinition[]
}
