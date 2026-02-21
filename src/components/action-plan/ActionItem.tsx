import type { ActionItem as ActionItemType } from '../../types/entitlements.ts'

interface Props {
  item: ActionItemType
}

const PRIORITY_LABELS = {
  critical: 'Urgent',
  important: 'Important',
  when_ready: 'When ready',
} as const

export function ActionItem({ item }: Props) {
  return (
    <li className={`action-item action-item-${item.priority}`}>
      <span className={`action-priority priority-${item.priority}`}>
        {PRIORITY_LABELS[item.priority]}
      </span>
      <span className="action-text">{item.action}</span>
      {item.deadline && <span className="action-deadline">Deadline: {item.deadline}</span>}
    </li>
  )
}
