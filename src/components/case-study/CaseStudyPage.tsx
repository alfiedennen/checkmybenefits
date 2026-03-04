import { useState } from 'react'
import { CaseStudyPasswordGate } from './CaseStudyPasswordGate.tsx'
import { CaseStudyContent } from './CaseStudyContent.tsx'
import './case-study.css'

export function CaseStudyPage() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('case-study-auth') === 'true'
  )

  if (!authenticated) {
    return <CaseStudyPasswordGate onAuthenticated={() => setAuthenticated(true)} />
  }

  return <CaseStudyContent />
}
