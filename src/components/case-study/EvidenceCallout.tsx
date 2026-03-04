import { useState } from 'react'

interface Props {
  label: string
  children: React.ReactNode
}

export function EvidenceCallout({ label, children }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="cs-evidence">
      <button
        className="cs-evidence-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="cs-evidence-icon" aria-hidden="true">
          {expanded ? '\u2212' : '+'}
        </span>
        <span className="cs-evidence-label">{label}</span>
      </button>
      {expanded && (
        <div className="cs-evidence-content">
          {children}
        </div>
      )}
    </div>
  )
}
