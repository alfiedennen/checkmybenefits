import type { EntitlementResult } from '../../types/entitlements.ts'
import { ValueBadge } from './ValueBadge.tsx'
import { DifficultyBadge } from './DifficultyBadge.tsx'
import { ConfidenceBadge } from './ConfidenceBadge.tsx'
import { ApplyLink } from './ApplyLink.tsx'
import { WhatYouNeed } from './WhatYouNeed.tsx'

interface Props {
  entitlement: EntitlementResult
  showWhyThisMatters?: boolean
}

export function EntitlementCard({ entitlement, showWhyThisMatters = false }: Props) {
  return (
    <div className="entitlement-card" aria-label={`${entitlement.name} entitlement details`}>
      <div className="entitlement-card-header">
        <h3 className="entitlement-card-name">{entitlement.name}</h3>
        <div className="entitlement-card-badges">
          <ValueBadge
            low={entitlement.estimated_annual_value.low}
            high={entitlement.estimated_annual_value.high}
          />
          <DifficultyBadge difficulty={entitlement.difficulty} />
          <ConfidenceBadge confidence={entitlement.confidence} />
        </div>
      </div>

      <p className="entitlement-card-description">{entitlement.plain_description}</p>

      {showWhyThisMatters && entitlement.why_this_matters && (
        <p className="entitlement-card-why">{entitlement.why_this_matters}</p>
      )}

      <div className="entitlement-card-details">
        <p className="entitlement-card-timeline">{entitlement.timeline}</p>
        <WhatYouNeed items={entitlement.what_you_need} />
      </div>

      <div className="entitlement-card-action">
        <ApplyLink url={entitlement.application_url} method={entitlement.application_method} />
      </div>
    </div>
  )
}
