import type { CascadedGroup } from '../../types/entitlements.ts'
import { EntitlementCard } from './EntitlementCard.tsx'

interface Props {
  group: CascadedGroup
}

export function CascadeList({ group }: Props) {
  return (
    <div className="cascade-list" aria-label={`Benefits unlocked by ${group.gateway_name}`}>
      <div className="cascade-header">
        Unlocked by {group.gateway_name}
      </div>
      <div className="cascade-items">
        {group.entitlements.map((ent) => (
          <div key={ent.id} className="cascade-item">
            <div className="cascade-connector" aria-hidden="true" />
            <EntitlementCard entitlement={ent} />
          </div>
        ))}
      </div>
    </div>
  )
}
