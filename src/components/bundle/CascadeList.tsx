import { useState } from 'react'
import type { CascadedGroup } from '../../types/entitlements.ts'
import { EntitlementCard } from './EntitlementCard.tsx'

interface Props {
  group: CascadedGroup
}

export function CascadeList({ group }: Props) {
  const [expanded, setExpanded] = useState(false)
  const count = group.entitlements.length

  return (
    <div className="cascade-list" aria-label={`Benefits unlocked by ${group.gateway_name}`}>
      <button
        className="cascade-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="cascade-toggle-text">
          Unlocked by {group.gateway_name}
        </span>
        <span className="cascade-toggle-count">{count} benefit{count !== 1 ? 's' : ''}</span>
        <span className="cascade-toggle-icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="cascade-items">
          {group.entitlements.map((ent) => (
            <div key={ent.id} className="cascade-item">
              <div className="cascade-connector" aria-hidden="true" />
              <EntitlementCard entitlement={ent} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
