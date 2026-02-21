import type { ActionPlanStep } from '../../types/entitlements.ts'
import { ActionItem } from './ActionItem.tsx'

interface Props {
  step: ActionPlanStep
}

export function ActionPlanWeek({ step }: Props) {
  return (
    <div className="action-plan-week">
      <h4 className="action-plan-week-label">{step.week}</h4>
      <ul className="action-plan-week-list">
        {step.actions.map((action, i) => (
          <ActionItem key={i} item={action} />
        ))}
      </ul>
    </div>
  )
}
