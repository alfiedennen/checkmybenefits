import type { ClaimingDifficulty } from '../../types/entitlements.ts'

interface Props {
  difficulty: ClaimingDifficulty
}

const LABELS: Record<ClaimingDifficulty, { text: string; className: string }> = {
  automatic: { text: 'Automatic', className: 'difficulty-automatic' },
  easy: { text: 'Easy', className: 'difficulty-easy' },
  moderate: { text: 'Moderate', className: 'difficulty-moderate' },
  complex: { text: 'Complex', className: 'difficulty-complex' },
  adversarial: { text: 'Difficult process', className: 'difficulty-adversarial' },
}

export function DifficultyBadge({ difficulty }: Props) {
  const { text, className } = LABELS[difficulty]

  return (
    <span className={`difficulty-badge ${className}`} aria-label={`Claiming difficulty: ${text}`}>
      {text}
    </span>
  )
}
