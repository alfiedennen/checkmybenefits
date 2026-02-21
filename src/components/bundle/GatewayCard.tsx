import type { EntitlementResult } from '../../types/entitlements.ts'
import { EntitlementCard } from './EntitlementCard.tsx'

interface Props {
  entitlement: EntitlementResult
}

export function GatewayCard({ entitlement }: Props) {
  return (
    <div className="gateway-card" aria-label={`Gateway benefit: ${entitlement.name}`}>
      <div className="gateway-badge">START HERE</div>
      <EntitlementCard entitlement={entitlement} showWhyThisMatters />
    </div>
  )
}
