import type { ConfidenceTier } from '../../types/entitlements.ts'

interface Props {
  confidence: ConfidenceTier
}

const LABELS: Record<ConfidenceTier, { text: string; detail: string; className: string }> = {
  likely: {
    text: 'Likely eligible',
    detail: 'Based on what you\'ve told us, you appear to meet the main criteria.',
    className: 'confidence-likely',
  },
  possible: {
    text: 'May be eligible',
    detail: 'Your situation suggests you might qualify, but we can\'t be certain.',
    className: 'confidence-possible',
  },
  worth_checking: {
    text: 'Worth looking into',
    detail: 'We can\'t fully assess this, but your situation suggests it\'s worth investigating.',
    className: 'confidence-check',
  },
}

export function ConfidenceBadge({ confidence }: Props) {
  const { text, className } = LABELS[confidence]

  return (
    <span className={`confidence-badge ${className}`} aria-label={text}>
      {text}
    </span>
  )
}
