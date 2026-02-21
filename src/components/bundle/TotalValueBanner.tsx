import { formatCurrency } from '../../utils/format-currency.ts'

interface Props {
  low: number
  high: number
}

export function TotalValueBanner({ low, high }: Props) {
  return (
    <div className="total-value-banner" role="status" aria-label="Estimated total annual value">
      <div className="total-value-label">Estimated total value</div>
      <div className="total-value-amount">
        up to <strong>{formatCurrency(high)}</strong>/year
      </div>
      {low !== high && (
        <div className="total-value-range">
          (range: {formatCurrency(low)} – {formatCurrency(high)})
        </div>
      )}
    </div>
  )
}
