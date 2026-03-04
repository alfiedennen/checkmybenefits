import { useState, useEffect } from 'react'

interface Section {
  id: string
  label: string
}

interface Props {
  sections: Section[]
}

export function CaseStudyNav({ sections }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sections])

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="cs-nav" aria-label="Case study sections">
      {sections.map((s) => (
        <button
          key={s.id}
          className={`cs-nav-item${s.id === activeId ? ' cs-nav-item--active' : ''}`}
          onClick={() => handleClick(s.id)}
        >
          {s.label}
        </button>
      ))}
    </nav>
  )
}
