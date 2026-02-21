import type {
  EntitlementResult,
  CascadedGroup,
  DependencyEdge,
  EntitlementDefinition,
} from '../types/entitlements.ts'

export interface CascadeResult {
  gateway_entitlements: EntitlementResult[]
  cascaded_entitlements: CascadedGroup[]
  independent_entitlements: EntitlementResult[]
}

/**
 * The core cascade algorithm.
 * Takes eligible entitlement IDs + dependency edges → produces gateway/cascaded/independent groupings.
 *
 * 1. Identify gateways: entitlements that are is_gateway AND have outgoing dependency edges to other eligible entitlements
 * 2. Group cascaded entitlements under their gateway (deduplicated — each entitlement appears once)
 * 3. Everything else is independent
 */
export function resolveCascade(
  eligibleResults: EntitlementResult[],
  allDefinitions: EntitlementDefinition[],
  dependencyEdges: DependencyEdge[],
): CascadeResult {
  const eligibleIds = new Set(eligibleResults.map((r) => r.id))
  const resultMap = new Map(eligibleResults.map((r) => [r.id, r]))
  const defMap = new Map(allDefinitions.map((d) => [d.id, d]))

  // Build adjacency: gateway → [dependents that are also eligible]
  const gatewayDependents = new Map<string, Set<string>>()

  for (const edge of dependencyEdges) {
    if (!eligibleIds.has(edge.from) || !eligibleIds.has(edge.to)) continue

    const fromDef = defMap.get(edge.from)
    if (!fromDef?.is_gateway) continue

    if (!gatewayDependents.has(edge.from)) {
      gatewayDependents.set(edge.from, new Set())
    }
    gatewayDependents.get(edge.from)!.add(edge.to)
  }

  // Gateways: entitlements that have dependents AND are marked is_gateway
  const gatewayIds = new Set<string>()
  for (const [gwId, deps] of gatewayDependents) {
    if (deps.size > 0) {
      gatewayIds.add(gwId)
    }
  }

  // Sort gateways by estimated value (highest first)
  const sortedGatewayIds = [...gatewayIds].sort((a, b) => {
    const aVal = resultMap.get(a)!.estimated_annual_value.high
    const bVal = resultMap.get(b)!.estimated_annual_value.high
    return bVal - aVal
  })

  // Track which entitlements have been placed (for deduplication)
  const placed = new Set<string>()

  const gateway_entitlements: EntitlementResult[] = []
  const cascaded_entitlements: CascadedGroup[] = []
  const independent_entitlements: EntitlementResult[] = []

  // Place gateways and their cascaded dependents
  for (const gwId of sortedGatewayIds) {
    // A gateway that's already placed as a cascaded dependent of a higher-value gateway
    // should still show as a gateway — but we note it's already placed
    if (!placed.has(gwId)) {
      gateway_entitlements.push(resultMap.get(gwId)!)
      placed.add(gwId)
    }

    const deps = gatewayDependents.get(gwId)!
    const groupEntitlements: EntitlementResult[] = []

    for (const depId of deps) {
      if (depId === gwId) continue // skip self-reference
      if (placed.has(depId)) continue // already shown under a higher-value gateway

      const result = resultMap.get(depId)
      if (result) {
        groupEntitlements.push(result)
        placed.add(depId)
      }
    }

    // Sort cascaded entitlements by value
    groupEntitlements.sort((a, b) => b.estimated_annual_value.high - a.estimated_annual_value.high)

    if (groupEntitlements.length > 0) {
      cascaded_entitlements.push({
        gateway_id: gwId,
        gateway_name: resultMap.get(gwId)!.name,
        entitlements: groupEntitlements,
      })
    }
  }

  // Independent: eligible but not placed yet
  for (const result of eligibleResults) {
    if (!placed.has(result.id)) {
      independent_entitlements.push(result)
    }
  }

  // Sort independent by value
  independent_entitlements.sort(
    (a, b) => b.estimated_annual_value.high - a.estimated_annual_value.high,
  )

  return {
    gateway_entitlements,
    cascaded_entitlements,
    independent_entitlements,
  }
}
