import { formatValueRange } from '../../utils/format-currency.ts'

interface Props {
  low: number
  high: number
  period?: string
}

export function ValueBadge({ low, high, period = '/year' }: Props) {
  if (low === 0 && high === 0) return null

  return (
    <span className="value-badge">
      {low === high ? (
        <>{formatValueRange(low, high)}{period}</>
      ) : (
        <>up to {formatValueRange(low, high)}{period}</>
      )}
    </span>
  )
}
