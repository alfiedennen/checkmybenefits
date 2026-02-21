import { useState } from 'react'

interface Props {
  items: string[]
}

export function WhatYouNeed({ items }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  return (
    <div className="what-you-need">
      <button
        className="what-you-need-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        What you'll need {expanded ? '(hide)' : `(${items.length} items)`}
      </button>
      {expanded && (
        <ul className="what-you-need-list">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
