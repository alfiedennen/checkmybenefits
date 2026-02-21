import type { ActionPlanStep } from '../../types/entitlements.ts'
import { ActionPlanWeek } from './ActionPlanWeek.tsx'

interface Props {
  steps: ActionPlanStep[]
}

export function ActionPlanView({ steps }: Props) {
  if (steps.length === 0) return null

  return (
    <div className="action-plan-view" aria-label="Your action plan">
      <h3 className="action-plan-heading">Your action plan</h3>
      <p className="action-plan-intro">
        Here's the order we'd suggest tackling these — starting with the gateways
        that unlock other entitlements.
      </p>
      <div className="action-plan-timeline">
        {steps.map((step, i) => (
          <ActionPlanWeek key={i} step={step} />
        ))}
      </div>
    </div>
  )
}
