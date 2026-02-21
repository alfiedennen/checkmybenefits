import type { ConflictResolution } from '../../types/entitlements.ts'

interface Props {
  conflict: ConflictResolution
}

export function ConflictCard({ conflict }: Props) {
  return (
    <div className="conflict-card" aria-label={`Choice between ${conflict.option_a} and ${conflict.option_b}`}>
      <div className="conflict-header">You need to choose between:</div>
      <div className="conflict-options">
        <div className="conflict-option">
          <strong>{conflict.option_a}</strong>
        </div>
        <div className="conflict-vs">or</div>
        <div className="conflict-option">
          <strong>{conflict.option_b}</strong>
        </div>
      </div>
      <div className="conflict-recommendation">
        <strong>Our assessment:</strong> {conflict.recommendation}
      </div>
      <p className="conflict-reasoning">{conflict.reasoning}</p>
    </div>
  )
}
