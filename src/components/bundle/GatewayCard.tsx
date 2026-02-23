import type { EntitlementResult } from '../../types/entitlements.ts'
import { EntitlementCard } from './EntitlementCard.tsx'

interface Props {
  entitlement: EntitlementResult
}

export function GatewayCard({ entitlement }: Props) {
  return (
    <div className="gateway-card" aria-label={`Gateway benefit: ${entitlement.name}`}>
      <span className="gateway-badge" role="img" aria-label="Priority: start here">Start here</span>
      <EntitlementCard entitlement={entitlement} showWhyThisMatters />
    </div>
  )
}
